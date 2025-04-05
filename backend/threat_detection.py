import os
import cv2
import numpy as np
import torch
import time
import uuid
from PIL import Image
import io
import logging
import google.generativeai as genai
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)

class ThreatDetectionSystem:
    def __init__(self):
        """Initialize the threat detection system with required models and configs"""
        self.alerts = []
        self.active_streams = {}
        
        # In a full implementation, we would load the actual models here
        # For this template, we'll simulate the detection process
        logging.info("Initializing threat detection system")
        
        # Initialize Gemini API (if API key is available)
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if gemini_api_key:
            genai.configure(api_key=gemini_api_key)
            self.gemini_model = genai.GenerativeModel('gemini-pro-vision')
        else:
            logging.warning("No Gemini API key found. Gemini integration disabled.")
            self.gemini_model = None
            
        logging.info("Threat detection system initialized")

    def detect(self, image_binary):
        """
        Detect threats in an image
        Args:
            image_binary: Binary image data
        Returns:
            List of detected threats with confidence scores and bounding boxes
        """
        try:
            # Convert binary image to a format suitable for processing
            image_array = np.frombuffer(image_binary, np.uint8)
            img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            
            # For the template, we'll simulate detection
            # In a real implementation, this would use PyTorch models
            
            # Simulate detection results (randomly generate threats for demo)
            threats = self._simulate_detection(img)
            
            # If we have Gemini integration and threats are detected, get more context
            if threats and self.gemini_model:
                threats = self._enhance_with_gemini(img, threats)
            
            # If threats are detected, create an alert
            if threats:
                self._create_alert(img, threats)
                
            return threats
            
        except Exception as e:
            logging.error(f"Error in threat detection: {str(e)}")
            return []
    
    def process_stream(self, stream_url):
        """
        Process a video stream for threat detection
        Args:
            stream_url: URL of the video stream
        Returns:
            Stream ID for tracking
        """
        stream_id = str(uuid.uuid4())
        
        # In a real implementation, this would start a background thread to process the stream
        # For this template, we'll just simulate it
        self.active_streams[stream_id] = {
            'url': stream_url,
            'start_time': time.time(),
            'status': 'active'
        }
        
        logging.info(f"Started processing stream {stream_id}")
        return stream_id
    
    def get_alerts(self):
        """
        Get all active alerts
        Returns:
            List of active alerts
        """
        return self.alerts
    
    def _simulate_detection(self, image):
        """
        Simulate threat detection for demonstration purposes
        In a real implementation, this would use computer vision models
        """
        # For demo purposes, randomly decide if a threat is present
        if np.random.random() < 0.3:  # 30% chance of detecting a threat for demo
            threat_types = ["gun", "knife", "suspicious behavior"]
            threat_type = np.random.choice(threat_types)
            
            # Generate a random bounding box
            h, w = image.shape[:2]
            x1 = int(np.random.uniform(0, w*0.7))
            y1 = int(np.random.uniform(0, h*0.7))
            x2 = int(min(x1 + np.random.uniform(50, 150), w))
            y2 = int(min(y1 + np.random.uniform(50, 150), h))
            
            confidence = np.random.uniform(0.6, 0.95)
            
            return [{
                'type': threat_type,
                'confidence': float(confidence),
                'bbox': [x1, y1, x2, y2],
                'timestamp': time.time()
            }]
        return []
    
    def _enhance_with_gemini(self, image, threats):
        """
        Enhance detection with Gemini for additional context
        Args:
            image: The image to analyze
            threats: List of detected threats
        Returns:
            Enhanced threats with additional context
        """
        try:
            # Convert OpenCV image to PIL for Gemini
            img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(img_rgb)
            
            # Create a buffer for the image
            img_buffer = io.BytesIO()
            pil_img.save(img_buffer, format='JPEG')
            img_buffer.seek(0)
            
            # Prepare prompt for Gemini
            prompt = f"""
            Analyze this security camera image where potential threats have been detected.
            Detected: {', '.join([t['type'] for t in threats])}
            
            Please provide:
            1. A brief assessment of the threat level (LOW, MEDIUM, HIGH)
            2. A short description of what you see
            3. Any recommended actions for security personnel
            
            Format your response as JSON with the keys 'threat_level', 'description', and 'recommendations'.
            """
            
            # Call Gemini API
            response = self.gemini_model.generate_content([prompt, pil_img])
            
            # Parse the response (in a real implementation, we'd handle this more robustly)
            try:
                # Try to extract JSON from the response
                json_str = response.text.strip()
                if json_str.startswith('```json'):
                    json_str = json_str.replace('```json', '').replace('```', '')
                enhanced_data = json.loads(json_str)
                
                # Add Gemini's analysis to each threat
                for threat in threats:
                    threat.update({
                        'threat_level': enhanced_data.get('threat_level', 'UNKNOWN'),
                        'description': enhanced_data.get('description', ''),
                        'recommendations': enhanced_data.get('recommendations', '')
                    })
            except:
                logging.warning("Could not parse Gemini response as JSON")
                
            return threats
        except Exception as e:
            logging.error(f"Error in Gemini enhancement: {str(e)}")
            return threats
    
    def _create_alert(self, image, threats):
        """
        Create an alert from detected threats
        Args:
            image: The image with threats
            threats: List of detected threats
        """
        # Save a small thumbnail of the image (in a real implementation)
        # For now, we'll just create the alert without the image
        
        alert_id = str(uuid.uuid4())
        alert = {
            'id': alert_id,
            'timestamp': datetime.now().isoformat(),
            'threats': threats,
            'status': 'active',
            'location': 'Main Building' # In a real implementation, this would be dynamically determined
        }
        
        self.alerts.append(alert)
        logging.info(f"Created alert {alert_id} for detected threats")
        return alert_id
