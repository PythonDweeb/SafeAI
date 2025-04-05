from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import base64
import logging
import json
import time
from dotenv import load_dotenv
from threat_detection import ThreatDetectionSystem

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize the threat detection system
threat_detector = ThreatDetectionSystem()

@app.route('/api/detect', methods=['POST'])
def detect_threats():
    """
    Detect threats in an image
    Expects a base64 encoded image in the request body
    """
    try:
        data = request.json
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
            
        # Decode the base64 image
        image_data = data['image'].split(',')[1] if ',' in data['image'] else data['image']
        image_binary = base64.b64decode(image_data)
        
        # Process the image and detect threats
        results = threat_detector.detect(image_binary)
        
        # Return the results
        return jsonify({
            'success': True,
            'timestamp': time.time(),
            'threats': results
        })
        
    except Exception as e:
        logging.error(f"Error processing image: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/stream', methods=['POST'])
def process_stream():
    """
    Process a video stream
    """
    try:
        data = request.json
        if not data or 'stream_url' not in data:
            return jsonify({'error': 'No stream URL provided'}), 400
            
        # Process the stream (in a real implementation, this would likely be async)
        stream_id = threat_detector.process_stream(data['stream_url'])
        
        return jsonify({
            'success': True,
            'stream_id': stream_id,
            'message': 'Stream processing started'
        })
        
    except Exception as e:
        logging.error(f"Error processing stream: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """
    Get all active alerts
    """
    try:
        alerts = threat_detector.get_alerts()
        return jsonify({
            'success': True,
            'alerts': alerts
        })
    except Exception as e:
        logging.error(f"Error retrieving alerts: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
