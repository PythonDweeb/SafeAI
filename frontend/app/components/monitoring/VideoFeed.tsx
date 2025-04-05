'use client';

import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface VideoFeedProps {
  name: string;
  source: 'webcam' | 'upload' | 'stream';
  streamUrl?: string;
  onFrame?: (imageData: string) => void;
}

const VideoFeed = ({ name, source, streamUrl, onFrame }: VideoFeedProps) => {
  const [isActive, setIsActive] = useState(true);
  const [hasAlert, setHasAlert] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Mock threat detection (in a real app this would come from the backend)
  useEffect(() => {
    if (source === 'webcam' || source === 'stream') {
      const interval = setInterval(() => {
        // Randomly simulate threat detection (10% chance)
        const detectThreat = Math.random() < 0.1;
        if (detectThreat) {
          setHasAlert(true);
          // Reset alert after 5 seconds
          setTimeout(() => setHasAlert(false), 5000);
        }
        
        // If we have the onFrame callback, capture the current frame and send it
        if (onFrame && webcamRef.current) {
          const imageSrc = webcamRef.current.getScreenshot();
          if (imageSrc) {
            onFrame(imageSrc);
          }
        }
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [source, onFrame]);

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="p-3 bg-gray-100 flex justify-between items-center">
        <div className="flex items-center">
          <span className={`w-3 h-3 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          <h3 className="font-medium">{name}</h3>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleToggle}
            className="text-gray-400 hover:text-gray-600"
          >
            {isActive ? 'Pause' : 'Play'}
          </button>
          <button 
            onClick={handleFullscreen}
            className="text-gray-400 hover:text-gray-600"
          >
            {isFullscreen ? 'Exit' : 'Expand'}
          </button>
        </div>
      </div>
      
      <div className="relative">
        {source === 'webcam' && isActive && (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full h-52 object-cover"
          />
        )}
        
        {source === 'stream' && isActive && streamUrl && (
          <video
            ref={videoRef}
            src={streamUrl}
            className="w-full h-52 object-cover"
            autoPlay
            muted
            loop
          />
        )}
        
        {source === 'upload' && (
          <div className="w-full h-52 bg-gray-200 flex items-center justify-center">
            <p className="text-gray-500">Upload a video file for analysis</p>
          </div>
        )}
        
        {!isActive && (
          <div className="w-full h-52 bg-gray-800 flex items-center justify-center">
            <p className="text-white">Feed paused</p>
          </div>
        )}
        
        {hasAlert && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-30">
            <div className="bg-white p-3 rounded-lg shadow-lg flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-2" />
              <span className="font-bold text-red-500">Potential threat detected!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoFeed;
