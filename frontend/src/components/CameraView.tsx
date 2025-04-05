'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CameraViewProps {
  cameraId: string;
  onClose: () => void;
  onSendSecurity: (numSecurity: number) => void;
  cameraInfo?: {
    name: string;
    location: string;
    status: 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

const CameraView: React.FC<CameraViewProps> = ({ cameraId, onClose, onSendSecurity, cameraInfo }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isStreamingRef = useRef(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numSecurity, setNumSecurity] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    startVideoStream();
    return () => {
      stopVideoStream();
    };
  }, [cameraId]);

  const startVideoStream = async () => {
    try {
      console.log('Starting video stream...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640,
          height: 480,
          facingMode: 'environment'
        } 
      });
      
      console.log('Got media stream:', stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('Set video source');
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log('Video metadata loaded');
              resolve(true);
            };
          }
        });
      }
      
      isStreamingRef.current = true;
      console.log('Starting frame processing...');
      processVideoFrames();
      
    } catch (err) {
      setError('Error accessing camera: ' + (err as Error).message);
      console.error('Error accessing camera:', err);
    }
  };

  const stopVideoStream = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    isStreamingRef.current = false;
  };

  const processVideoFrames = async () => {
    if (!isStreamingRef.current || !videoRef.current || !canvasRef.current) {
      console.log('Cannot process frames:', { 
        isStreaming: isStreamingRef.current, 
        hasVideo: !!videoRef.current, 
        hasCanvas: !!canvasRef.current,
        videoReady: videoRef.current?.readyState === 4
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      console.error('Could not get canvas context');
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    console.log('Canvas dimensions set:', { width: canvas.width, height: canvas.height });

    const processFrame = async () => {
      if (!isStreamingRef.current) {
        console.log('Streaming stopped, ending frame processing');
        return;
      }

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      console.log('Frame drawn to canvas');

      // Convert canvas to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      console.log('Frame converted to base64, length:', imageData.length);

      // Send frame to backend for processing
      try {
        setIsProcessing(true);
        console.log('Sending frame to backend...');
        const response = await fetch('http://localhost:8000/api/detect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: imageData.split(',')[1] // Remove data URL prefix
          }),
        });

        console.log('Received response:', response.status);
        const data = await response.json();
        console.log('Response data keys:', Object.keys(data));
        
        if (data.processed_image) {
          console.log('Setting processed image...');
          setProcessedImage(data.processed_image);
        } else {
          console.error('No processed image in response:', data);
          setError('No processed image received from server');
        }
      } catch (err) {
        console.error('Error processing frame:', err);
        setError('Error processing video frame');
      } finally {
        setIsProcessing(false);
      }

      // Request next frame
      requestAnimationFrame(processFrame);
    };

    // Start processing frames
    console.log('Starting frame processing loop');
    processFrame();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 1));
  };

  return (
    <div className="w-full h-full select-none">
      <div className="grid grid-cols-1 gap-3">
        {/* Live Feed */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="rounded-lg overflow-hidden shadow-xl bg-black relative"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <motion.div 
            style={{ 
              scale: zoomLevel,
              transformOrigin: "center" 
            }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </motion.div>
          <canvas
            ref={canvasRef}
            className="hidden"
          />
          
          {/* Video Controls */}
          <AnimatePresence>
            {showControls && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-2 right-2 flex space-x-1.5"
              >
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleZoomIn}
                  className="bg-white/70 backdrop-blur-sm text-gray-800 p-1.5 rounded-full hover:bg-white/90 transition-colors shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3h-6" />
                  </svg>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleZoomOut}
                  className="bg-white/70 backdrop-blur-sm text-gray-800 p-1.5 rounded-full hover:bg-white/90 transition-colors shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  </svg>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleFullscreen}
                  className="bg-white/70 backdrop-blur-sm text-gray-800 p-1.5 rounded-full hover:bg-white/90 transition-colors shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                  </svg>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Live Indicator */}
          <div className="absolute top-2 left-2 flex items-center space-x-1.5 bg-white/70 backdrop-blur-sm text-gray-800 text-xs px-2 py-1 rounded-full shadow-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
            <span className="font-medium">LIVE</span>
          </div>
          
          {/* Threat Status Indicator */}
          {cameraInfo?.status === 'HIGH' && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="absolute bottom-2 left-2 flex items-center space-x-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md animate-pulse shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>HIGH THREAT</span>
            </motion.div>
          )}
        </motion.div>

        {/* Processed Results */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="rounded-lg overflow-hidden shadow-xl bg-black relative"
        >
          {processedImage ? (
            <img
              src={`data:image/jpeg;base64,${processedImage}`}
              alt="Processed frame"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              {isProcessing ? (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2 drop-shadow-glow"></div>
                  <span className="text-sm font-medium tracking-wider">Processing...</span>
                </div>
              ) : (
                <div className="text-sm font-medium tracking-wider">Waiting for processed frames...</div>
              )}
            </div>
          )}
          <div className="absolute bottom-2 left-2 flex items-center space-x-1.5 bg-white/70 backdrop-blur-sm text-gray-800 text-xs px-3 py-1 rounded-md shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="font-medium">AI Analysis</span>
          </div>
        </motion.div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="mt-2 bg-red-100 text-red-700 px-3 py-2 rounded-md text-xs font-medium shadow-md"
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add custom styles for glowing shadows */}
      <style jsx global>{`
        .drop-shadow-glow {
          filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.7));
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.7); }
          50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.9); }
        }
      `}</style>
    </div>
  );
};

export default CameraView;
