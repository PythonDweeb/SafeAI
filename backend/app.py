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


# Initialize threat detection system
threat_detector = ThreatDetectionSystem()


@app.route('/api/detect', methods=['POST'])
def detect_threats():
   """Endpoint to process a single frame and detect threats"""
   try:
       # Get image data from request
       data = request.get_json()
       logger.info("Received request with data keys: %s", list(data.keys()) if data else "No data")
       
       if not data or 'image' not in data:
           logger.error("No image data provided in request")
           return jsonify({'error': 'No image data provided'}), 400

       # Log image data size
       image_data = data['image']
       logger.info("Received image data of length: %d", len(image_data))

       # Process the image using the threat detector
       logger.info("Starting image processing...")
       processed_image, threats = threat_detector.process_base64_image(image_data)
       logger.info("Processing complete. Found %d threats", len(threats))
       
       # Prepare response
       response = {
           'processed_image': processed_image,
           'threats': threats,
           'timestamp': time.time()
       }
       
       return jsonify(response)


   except Exception as e:
       logger.error(f"Error processing request: {e}", exc_info=True)
       return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
   """Health check endpoint"""
   return jsonify({
       'status': 'healthy',
       'model_loaded': threat_detector.model is not None,
       'device': threat_detector.device,
       'timestamp': time.time()
   })


if __name__ == '__main__':
   port = int(os.getenv('PORT', 8000))
   try:
       app.run(host='0.0.0.0', port=port, debug=True)
   finally:
       # Cleanup resources
       if hasattr(threat_detector, 'model'):
           del threat_detector.model
       if torch.cuda.is_available():
           torch.cuda.empty_cache()


