'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProcessingService } from '@/services/ProcessingService';
import { CameraProcessingManager } from '@/services/CameraProcessingManager';

interface CameraViewProps {
  cameraId: string;
  onClose: () => void;
  onSendSecurity: (numSecurity: number) => void;
  onStatusUpdate: (status: 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW') => void;
  cameraInfo?: {
    name: string;
    location: string;
    status: 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  };
  assignedDeviceId: string | null;
  isFromThreatMonitor?: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ 
  cameraId, 
  onClose, 
  onSendSecurity,
  onStatusUpdate,
  cameraInfo,
  assignedDeviceId,
  isFromThreatMonitor = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isStreamingRef = useRef(false);
  const processingRef = useRef(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threats, setThreats] = useState<any[]>([]);
  const [cameraStatus, setCameraStatus] = useState<'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('NORMAL');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const processingService = ProcessingService.getInstance();
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedTimeRef = useRef<number>(0);
  const PROCESSING_INTERVAL = 1000; // Process every second
  const processingManager = CameraProcessingManager.getInstance();
  const processedFrameInterval = useRef<NodeJS.Timeout | null>(null);

  // Update selected device when initialDeviceId changes
  useEffect(() => {
    setSelectedDeviceId(assignedDeviceId || null);
  }, [assignedDeviceId]);

  // Get available cameras on mount
  useEffect(() => {
    const getDevices = async () => {
      try {
        // First request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        
        // Now enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableDevices(videoDevices);
      } catch (error) {
        console.error('Error getting video devices:', error);
        setError('Error accessing camera: ' + (error as Error).message);
      }
    };
    getDevices();
  }, []);

  // Register with processing manager when component mounts
  useEffect(() => {
    if (cameraId && assignedDeviceId) {
      processingManager.registerCamera(cameraId, assignedDeviceId, (status) => {
        setCameraStatus(status);
        onStatusUpdate(status);
      });

      // Start retrieving processed frames
      processedFrameInterval.current = setInterval(() => {
        const processedFrame = processingManager.getProcessedFrame(cameraId);
        if (processedFrame) {
          setProcessedImageUrl(processedFrame);
        }
      }, 100); // Check for new frames every 100ms
    }

    return () => {
      if (cameraId) {
        processingManager.unregisterCamera(cameraId);
      }
      if (processedFrameInterval.current) {
        clearInterval(processedFrameInterval.current);
      }
    };
  }, [cameraId, assignedDeviceId]);

  // Set up video processing when stream starts
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;

    video.addEventListener('play', () => {
      isStreamingRef.current = true;
      if (cameraId && assignedDeviceId) {
        processingManager.startProcessing(cameraId);
      }
    });

    video.addEventListener('pause', () => {
      isStreamingRef.current = false;
      if (cameraId) {
        processingManager.stopProcessing(cameraId);
      }
    });

    // Start processing if video is already playing
    if (!video.paused) {
      isStreamingRef.current = true;
      if (cameraId && assignedDeviceId) {
        processingManager.startProcessing(cameraId);
      }
    }

    return () => {
      if (cameraId) {
        processingManager.stopProcessing(cameraId);
      }
      isStreamingRef.current = false;
    };
  }, [videoRef.current, cameraId, assignedDeviceId]);

  // Remove old frame processing code
  const processFrame = async () => {
    if (!canvasRef.current || !videoRef.current || !isStreamingRef.current || !cameraId) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Draw the current frame to canvas
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Send frame to processing manager
    const imageData = processingService.canvasToBase64(canvas);
    processingManager.processFrame(cameraId, imageData);
  };

  // Continuous frame processing loop
  const startProcessing = () => {
    if (!videoRef.current || !canvasRef.current || processingRef.current) return;
    
    processingRef.current = true;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    const processLoop = async () => {
      if (!processingRef.current || !video || !context || !isStreamingRef.current) return;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Process the frame
      await processFrame();
      
      // Schedule next frame
      if (processingRef.current) {
        processingTimeoutRef.current = setTimeout(processLoop, PROCESSING_INTERVAL);
      }
    };
    
    processLoop();
  };

  // Stop processing
  const stopProcessing = () => {
    processingRef.current = false;
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
  };

  // Start camera stream when selected device changes
  useEffect(() => {
    if (!selectedDeviceId) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      stopProcessing();
      return;
    }

    const startCamera = async () => {
      try {
        // Stop any existing stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          stopProcessing();
        }

        // Add a small delay to ensure previous stream is fully stopped
        await new Promise(resolve => setTimeout(resolve, 100));

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: selectedDeviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          try {
            await videoRef.current.play();
          } catch (playError) {
            console.error('Error playing video:', playError);
            setError('Error playing video stream. The camera might be in use by another application.');
            return;
          }
        }
        
        setError(null);
      } catch (error) {
        console.error('Error starting camera:', error);
        if ((error as Error).name === 'OverconstrainedError') {
          setError('Camera is currently in use by another application. Please try again later.');
        } else {
          setError('Error accessing camera: ' + (error as Error).message);
        }
      }
    };

    startCamera();

    return () => {
      stopProcessing();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [selectedDeviceId]);

  // Update processed frame display for threat monitor view
  useEffect(() => {
    if (!isFromThreatMonitor || !selectedDeviceId) return;

    const updateProcessedFrame = () => {
      const frame = processingManager.getProcessedFrame(cameraId);
      if (frame) {
        setProcessedImageUrl(frame);
      }
    };

    // Update immediately and then every second
    updateProcessedFrame();
    const interval = setInterval(updateProcessedFrame, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [isFromThreatMonitor, selectedDeviceId, cameraId]);

  return (
    <div className="relative w-full h-full bg-black">
      {/* Original video element - hidden when showing processed feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-contain ${isFromThreatMonitor ? 'hidden' : ''}`}
      />
      
      {/* Processed image display */}
      {isFromThreatMonitor && processedImageUrl && (
        <img
          src={processedImageUrl}
          alt="Processed feed"
          className="w-full h-full object-contain"
        />
      )}

      {/* Camera selection dropdown */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <select
          value={selectedDeviceId || ''}
          onChange={(e) => {
            const deviceId = e.target.value || null;
            setSelectedDeviceId(deviceId);
            // Update the parent component's camera assignments
            if (cameraId) {
              const event = new CustomEvent('cameraAssigned', {
                detail: { cameraId, deviceId }
              });
              window.dispatchEvent(event);
            }
          }}
          className="w-full p-2 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-lg"
        >
          <option value="">Select Camera</option>
          {availableDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId}`}
            </option>
          ))}
        </select>
      </div>

      {/* Status indicator */}
      <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
        <div className={`w-2 h-2 rounded-full ${
          cameraStatus === 'HIGH' ? 'bg-red-500 animate-pulse' :
          cameraStatus === 'MEDIUM' ? 'bg-orange-500' :
          cameraStatus === 'LOW' ? 'bg-yellow-500' :
          'bg-green-500'
        }`} />
        <span className="text-white text-sm font-medium">{cameraStatus}</span>
      </div>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-4 left-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CameraView;
