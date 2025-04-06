import os
import time
import uuid
from PIL import Image
import io
import logging
from datetime import datetime
import base64
from dotenv import load_dotenv
from transformers import AutoModelForCausalLM
import torch
import numpy as np
import cv2
import matplotlib.pyplot as plt
from typing import List, Dict, Optional, Tuple
from contextlib import contextmanager


# Force full precision mode and enable HF transfer
os.environ["COMMANDLINE_ARGS"] = '--precision full --no-half'
os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "1"


# Load environment variables
load_dotenv()


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

#IMPORTANT: UNINSTALL TORCH AND INSTALL TORCH FOR CUDA 11.8 IF U HAVE A GPU

class ThreatDetectionSystem:
   def __init__(self):
       self.model = None
       # Check for Apple Silicon (MPS), CUDA, or fallback to CPU
       if torch.backends.mps.is_available():
           self.device = "mps"
           logger.info("Using Apple Silicon (MPS) device")
           # Conservative settings for MPS
           self.min_process_interval = 1.5
           self.cache_timeout = 2.0
           self.process_every_n_frames = 4
           self.detection_timeout = 3.0
       elif torch.cuda.is_available():
           self.device = "cuda"
           logger.info(f"Using CUDA device: {torch.cuda.get_device_name(0)}")
           # Set CUDA device
           torch.cuda.set_device(0)
           # Aggressive settings for CUDA
           self.min_process_interval = 0.1
           self.cache_timeout = 0.5
           self.process_every_n_frames = 1
           self.detection_timeout = 1.0
       else:
           self.device = "cpu"
           logger.info("Using CPU device")
           # Force FP32 for Windows CPU
           torch.set_default_dtype(torch.float32)
           torch.set_default_device('cpu')
           # Conservative settings for CPU
           self.min_process_interval = 1.5
           self.cache_timeout = 2.0
           self.process_every_n_frames = 4
           self.detection_timeout = 3.0
       self.last_process_time = 0
       self.max_image_size = 256
       self.result_cache = {}
       self.frame_counter = 0
       self.last_detections = []
       self.initialize_model()


   def initialize_model(self) -> None:
       """Initialize the Moondream 2 model with error handling."""
       try:
           logger.info("Initializing Moondream 2 model...")
           model_id = "vikhyatk/moondream2"
           revision = "2025-01-09"

           if self.device == "mps":
               device_map = {"": self.device}
               self.model = AutoModelForCausalLM.from_pretrained(
                   model_id,
                   revision=revision,
                   trust_remote_code=True,
                   low_cpu_mem_usage=True,
                   device_map=device_map,
                   torch_dtype=torch.float32,  # Changed from bfloat16 to float32
               )
           elif self.device == "cuda":
               device_map = {"": self.device}
               self.model = AutoModelForCausalLM.from_pretrained(
                   model_id,
                   revision=revision,
                   trust_remote_code=True,
                   low_cpu_mem_usage=True,
                   device_map=device_map,
                   torch_dtype=torch.float32,  # Force FP32 for consistency
               )
               # Ensure model is on CUDA
               self.model = self.model.cuda()
               logger.info("Model moved to CUDA successfully")
           else:
               device_map = None
               # Force PyTorch to use float32
               torch.set_default_dtype(torch.float32)
               
               self.model = AutoModelForCausalLM.from_pretrained(
                   model_id,
                   revision=revision,
                   trust_remote_code=True,
                   torch_dtype=torch.float32,
                   device_map={"": "cpu"}
               )
               logger.info("Model initialized in FP32 mode for Windows CPU")

           # Ensure model is in eval mode
           self.model.eval()
           logger.info("✓ Model initialized successfully")
       except Exception as e:
           logger.error(f"Error initializing model: {e}")
           raise


   def fig2rgb_array(self, fig: plt.Figure) -> np.ndarray:
       """Convert matplotlib figure to RGB array"""
       fig.canvas.draw()
       buf = fig.canvas.buffer_rgba()
       w, h = fig.canvas.get_width_height()
       img_array = np.asarray(buf).reshape((h, w, 4))
       rgb_array = img_array[:, :, :3]  # Drop alpha channel
       return rgb_array


   def visualize_frame(self, frame: np.ndarray, threats: List[Dict]) -> np.ndarray:
       """Visualize a single frame with detected threats"""
       try:
           # Create figure without margins
           fig = plt.figure(figsize=(frame.shape[1] / 100, frame.shape[0] / 100), dpi=100)
           ax = fig.add_axes([0, 0, 1, 1])


           # Display frame
           ax.imshow(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))


           # Sort threats by confidence for consistent color assignment
           threats = sorted(threats, key=lambda t: t["confidence"], reverse=True)
           colors = plt.cm.rainbow(np.linspace(0, 1, max(1, len(threats))))


           # Process each threat to draw rectangles and labels
           for threat, color in zip(threats, colors):
               try:
                   x1, y1, x2, y2 = threat["bbox"]
                   rect = plt.Rectangle(
                       (x1, y1), x2 - x1, y2 - y1,
                       fill=False, color=color, linewidth=2
                   )
                   ax.add_patch(rect)
                   label = f"{threat['type']}: {threat['confidence']:.2f}"
                   ax.text(x1, y1 - 5, label, color=color, fontsize=8, bbox=dict(facecolor='white', alpha=0.7))
               except Exception as e:
                   logger.error(f"Error processing threat: {e}")
                   continue


           ax.set_xlim(0, frame.shape[1])
           ax.set_ylim(frame.shape[0], 0)
           ax.axis("off")


           # Convert the figure to an image array
           frame_rgb = self.fig2rgb_array(fig)
           frame_bgr = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2BGR)
           plt.close(fig)
           return frame_bgr


       except Exception as e:
           logger.error(f"Error in visualize_frame: {e}")
           plt.close("all")
           return frame


   def resize_image(self, image: Image.Image) -> Image.Image:
       """Resize image while maintaining aspect ratio"""
       width, height = image.size
       if width > self.max_image_size or height > self.max_image_size:
           ratio = min(self.max_image_size / width, self.max_image_size / height)
           new_size = (int(width * ratio), int(height * ratio))
           return image.resize(new_size, Image.Resampling.BILINEAR)  # Changed to BILINEAR for speed
       return image


   def process_frame(self, frame: np.ndarray) -> Tuple[np.ndarray, List[Dict]]:
       """Process a single frame and return the processed frame with threat detections."""
       try:
           # Convert frame to PIL Image
           image = Image.fromarray(frame)
           logger.info(f"Processing image of size: {image.size}, mode: {image.mode}")
           
           # Resize image if needed
           image = self.resize_image(image)
           
           # Convert to RGB if needed
           if image.mode != 'RGB':
               image = image.convert('RGB')
           
           # Convert to tensor and ensure correct dtype
           image_tensor = torch.from_numpy(np.array(image)).float()
           image_tensor = image_tensor.permute(2, 0, 1).unsqueeze(0)
           image_tensor = image_tensor / 255.0  # Normalize to [0, 1]
           
           # Move tensor to the correct device
           image_tensor = image_tensor.to(self.device)
           
           # Ensure tensor is in FP32 for Windows CPU
           if self.device == "cpu":
               image_tensor = image_tensor.float()
           
           logger.info(f"Input tensor shape: {image_tensor.shape}, device: {image_tensor.device}, dtype: {image_tensor.dtype}")

           current_time = time.time()
           
           # Frame skipping logic
           self.frame_counter += 1
           if self.frame_counter % self.process_every_n_frames != 0:
               return self.draw_threats(frame, self.last_detections), self.last_detections

           if current_time - self.last_process_time < self.min_process_interval:
               return self.draw_threats(frame, self.last_detections), self.last_detections

           # Create a hash of the image for caching using numpy array
           image_array = image_tensor.cpu().numpy()
           image_hash = hash(image_array.tobytes())
           
           # Check cache
           if image_hash in self.result_cache:
               cache_entry = self.result_cache[image_hash]
               if current_time - cache_entry['timestamp'] < self.cache_timeout:
                   scale_x = frame.shape[1] / image.size[0]
                   scale_y = frame.shape[0] / image.size[1]
                   threats = []
                   for threat in cache_entry['threats']:
                       scaled_threat = {
                           'bbox': [
                               threat['bbox'][0] * scale_x,
                               threat['bbox'][1] * scale_y,
                               threat['bbox'][2] * scale_x,
                               threat['bbox'][3] * scale_y
                           ],
                           'confidence': threat['confidence'],
                           'type': threat['type'],
                           'timestamp': current_time
                       }
                       threats.append(scaled_threat)
                   self.last_detections = threats
                   return self.draw_threats(frame, threats), threats

           self.last_process_time = current_time

           # Use the model to detect weapons
           with torch.no_grad():
               try:
                   logger.info(f"Processing image of size: {image.size}, mode: {image.mode}")
                   
                   # Define the three threat types we want to detect
                   threat_types = [
                       {"query": "weapon or handheld sharp object", "level": "HIGH", "type": "weapon"},
                       {"query": "man in a hoodie with hood up", "level": "MEDIUM", "type": "suspicious person"},
                       {"query": "pencil or pen", "level": "LOW", "type": "writing implement"}
                   ]
                   
                   all_threats = []
                   
                   # Run detection for each threat type
                   for threat_type in threat_types:
                       # Use the model's built-in detect method directly for all devices
                       detection_result = self.model.detect(
                           image, 
                           threat_type["query"]
                       )
                       logger.info(f"Detection result for {threat_type['type']}: {type(detection_result)}")
                       
                       if isinstance(detection_result, dict) and "objects" in detection_result:
                           detections = detection_result["objects"]
                       elif isinstance(detection_result, list):
                           detections = detection_result
                       else:
                           logger.warning(f"Unexpected detection result format: {type(detection_result)}")
                           detections = []

                       # Log number of detections
                       logger.info(f"Found {len(detections)} {threat_type['type']} detections")

                       # Convert normalized coordinates to pixel values and build threat objects
                       img_width, img_height = image.size
                       for obj in detections:
                           try:
                               x_min = float(obj.get("x_min", 0)) * img_width
                               y_min = float(obj.get("y_min", 0)) * img_height
                               x_max = float(obj.get("x_max", 1)) * img_width
                               y_max = float(obj.get("y_max", 1)) * img_height
                               threat = {
                                   "bbox": [x_min, y_min, x_max, y_max],
                                   "confidence": float(obj.get("confidence", 1.0)),
                                   "type": threat_type["type"],
                                   "level": threat_type["level"],
                                   "timestamp": current_time
                               }
                               all_threats.append(threat)
                               logger.info(f"Processed threat: {threat}")
                           except Exception as e:
                               logger.error(f"Error processing detection object: {e}")
                               continue
                   
                   # Cache the results
                   self.result_cache[image_hash] = {
                       'threats': all_threats,
                       'timestamp': current_time
                   }

                   # Scale threats back to original size
                   scale_x = frame.shape[1] / image.size[0]
                   scale_y = frame.shape[0] / image.size[1]
                   scaled_threats = []
                   for threat in all_threats:
                       scaled_threat = {
                           'bbox': [
                               threat['bbox'][0] * scale_x,
                               threat['bbox'][1] * scale_y,
                               threat['bbox'][2] * scale_x,
                               threat['bbox'][3] * scale_y
                           ],
                           'confidence': threat['confidence'],
                           'type': threat['type'],
                           'level': threat['level'],
                           'timestamp': current_time
                       }
                       scaled_threats.append(scaled_threat)

                   # Update last detections
                   self.last_detections = scaled_threats
                   return self.draw_threats(frame, scaled_threats), scaled_threats

               except Exception as e:
                   logger.error(f"Error during model inference: {e}")
                   return self.draw_threats(frame, self.last_detections), self.last_detections

       except Exception as e:
           logger.error(f"Error processing frame: {e}")
           return self.draw_threats(frame, self.last_detections), self.last_detections

   def draw_threats(self, frame: np.ndarray, threats: List[Dict]) -> np.ndarray:
       """Draw threats on frame using OpenCV"""
       processed_frame = frame.copy()
       current_time = time.time()
       
       # No threats detected
       if not threats:
           return processed_frame
       
       # Sort threats by confidence for consistent color assignment
       threats = sorted(threats, key=lambda t: t["confidence"], reverse=True)
       
       # Draw each threat with appropriate color based on threat level
       for threat in threats:
           try:
               # Set color based on threat level
               if "level" in threat:
                   if threat["level"] == "HIGH":
                       color = (0, 0, 255)  # Red (BGR)
                   elif threat["level"] == "MEDIUM":
                       color = (0, 165, 255)  # Orange (BGR)
                   elif threat["level"] == "LOW":
                       color = (0, 255, 255)  # Yellow (BGR)
                   else:
                       color = (0, 255, 0)  # Green (BGR) for unknown level
               else:
                   # Fallback to default high threat color if level not specified
                   color = (0, 0, 255)  # Red (BGR)
               
               # Extract bounding box coordinates
               x1, y1, x2, y2 = map(int, threat["bbox"])
               
               # Draw rectangle around the threat
               cv2.rectangle(processed_frame, (x1, y1), (x2, y2), color, 2)
               
               # Prepare label text
               confidence = threat.get("confidence", 0.0)
               threat_type = threat.get("type", "Unknown")
               threat_level = threat.get("level", "UNKNOWN")
               label = f"{threat_type} ({threat_level}): {confidence:.2f}"
               
               # Calculate text position and draw background
               text_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)[0]
               cv2.rectangle(processed_frame, (x1, y1 - text_size[1] - 10), (x1 + text_size[0], y1), color, -1)
               
               # Draw text
               cv2.putText(processed_frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
               
           except Exception as e:
               logger.error(f"Error drawing threat: {e}")
               continue
       
       return processed_frame


   def process_base64_image(self, image_data: str) -> Tuple[str, List[Dict]]:
       """Process a base64 encoded image and return processed image and threats"""
       try:
           # Handle both data URL and raw base64 formats
           if ',' in image_data:
               # Data URL format: data:image/jpeg;base64,/9j/4AAQ...
               image_bytes = base64.b64decode(image_data.split(',')[1])
           else:
               # Raw base64 format
               image_bytes = base64.b64decode(image_data)
           
           image = Image.open(io.BytesIO(image_bytes))
           frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
          
           # Process the frame to detect threats
           processed_frame, threats = self.process_frame(frame)
          
           # Encode the processed frame back to base64
           _, buffer = cv2.imencode('.jpg', processed_frame)
           processed_image = base64.b64encode(buffer).decode('utf-8')
           return processed_image, threats

       except Exception as e:
           logger.error(f"Error processing base64 image: {e}")
           return image_data, []