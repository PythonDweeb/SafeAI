from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import base64
import logging
import json
import time
from dotenv import load_dotenv
from detectweapons import ThreatDetectionSystem
import torch


# Load environment variables
load_dotenv()


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


app = Flask(__name__)
CORS(app)


# Initialize threat detection systems for each camera
threat_detectors = {
    "phhs-cam1": ThreatDetectionSystem(),
    "phhs-cam2": ThreatDetectionSystem(),
    "phhs-cam3": ThreatDetectionSystem(),
    "phhs-cam4": ThreatDetectionSystem(),
    "phhs-cam5": ThreatDetectionSystem(),
    "phhs-cam6": ThreatDetectionSystem(),
    "lahs-cam1": ThreatDetectionSystem(),
    "lahs-cam2": ThreatDetectionSystem(),
    "lahs-cam3": ThreatDetectionSystem(),
    "lahs-cam4": ThreatDetectionSystem(),
    "lahs-cam5": ThreatDetectionSystem(),
    "lahs-cam6": ThreatDetectionSystem(),
}


@app.route('/api/detect/<camera_id>', methods=['POST'])
def detect_threats(camera_id):
   """Endpoint to process a single frame and detect threats for a specific camera"""
   try:
       if camera_id not in threat_detectors:
           logger.error(f"Invalid camera ID: {camera_id}")
           return jsonify({'error': 'Invalid camera ID'}), 400

       # Get image data from request
       data = request.get_json()
       logger.info(f"Received request for camera {camera_id} with data keys: %s", list(data.keys()) if data else "No data")
       
       if not data or 'image' not in data:
           logger.error("No image data provided in request")
           return jsonify({'error': 'No image data provided'}), 400

       # Log image data size
       image_data = data['image']
       logger.info(f"Received image data of length: %d for camera {camera_id}", len(image_data))

       # Process the image using the specific camera's threat detector
       logger.info(f"Starting image processing for camera {camera_id}...")
       processed_image, threats = threat_detectors[camera_id].process_base64_image(image_data)
       logger.info(f"Processing complete for camera {camera_id}. Found %d threats", len(threats))
       
       # Prepare response
       response = {
           'processed_image': processed_image,
           'threats': threats,
           'timestamp': time.time()
       }
       
       return jsonify(response)


   except Exception as e:
       logger.error(f"Error processing request for camera {camera_id}: {e}", exc_info=True)
       return jsonify({'error': str(e)}), 500


@app.route('/api/health/<camera_id>', methods=['GET'])
def health_check(camera_id):
   """Health check endpoint for a specific camera"""
   if camera_id not in threat_detectors:
       return jsonify({'error': 'Invalid camera ID'}), 400
       
   detector = threat_detectors[camera_id]
   return jsonify({
       'status': 'healthy',
       'model_loaded': detector.model is not None,
       'device': detector.device,
       'timestamp': time.time()
   })


if __name__ == '__main__':
   port = int(os.getenv('PORT', 8000))
   try:
       app.run(host='0.0.0.0', port=port, debug=True)
   finally:
       # Cleanup resources for all detectors
       for detector in threat_detectors.values():
           if hasattr(detector, 'model'):
               del detector.model
       if torch.cuda.is_available():
           torch.cuda.empty_cache()


