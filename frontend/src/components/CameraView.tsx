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

  // Function to process frame through backend
  const processFrame = async () => {
    if (!canvasRef.current || !videoRef.current || !isStreamingRef.current) return;
    
    const now = Date.now();
    if (now - lastProcessedTimeRef.current < PROCESSING_INTERVAL) return;
    
    try {
      // Check if previous processing is still ongoing
      if (processingRef.current) {
        console.warn('Previous frame still processing, skipping this frame');
        return;
      }

      processingRef.current = true;
      const imageData = processingService.canvasToBase64(canvasRef.current);
      const result = await processingService.processFrame(imageData);
      
      // Always update threats and status
      setThreats(result.threats);
      
      // Store the processed frame in the manager and update the display
      const processedFrame = `data:image/jpeg;base64,${result.processed_image}`;
      processingManager.setProcessedFrame(cameraId, processedFrame);
      
      if (isFromThreatMonitor) {
        setProcessedImageUrl(processedFrame);
      }
      
      // Update status based on threats
      if (result.threats.length > 0) {
        const highestThreat = result.threats.sort((a: { confidence: number }, b: { confidence: number }) => b.confidence - a.confidence)[0];
        const newStatus = highestThreat.confidence > 0.8 ? 'HIGH' :
                         highestThreat.confidence > 0.5 ? 'MEDIUM' : 'LOW';
        onStatusUpdate(newStatus);
        processingManager.updateCameraStatus(cameraId, newStatus);
      } else {
        onStatusUpdate('NORMAL');
        processingManager.updateCameraStatus(cameraId, 'NORMAL');
      }
      
      lastProcessedTimeRef.current = now;
    } catch (error) {
      console.error('Error processing frame:', error);
      setError('Error processing frame. The system might be overloaded.');
    } finally {
      processingRef.current = false;
    }
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

  // Set up video processing when stream starts
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;

    video.addEventListener('play', () => {
      isStreamingRef.current = true;
      startProcessing();
    });

    video.addEventListener('pause', () => {
      isStreamingRef.current = false;
      stopProcessing();
    });

    // Start processing if video is already playing
    if (!video.paused) {
      isStreamingRef.current = true;
      startProcessing();
    }

    return () => {
      stopProcessing();
      isStreamingRef.current = false;
    };
  }, [videoRef.current]);

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

  // Update camera status when threats are detected
  useEffect(() => {
    const newStatus = threats.length > 0 ? 'HIGH' : 'NORMAL';
    if (newStatus !== cameraStatus) {
      setCameraStatus(newStatus);
      onStatusUpdate(newStatus);
    }
  }, [threats, onStatusUpdate, cameraStatus]);

  // Update processed frame display for threat monitor view
  useEffect(() => {
    if (!isFromThreatMonitor || !selectedDeviceId) {
      if (processedFrameInterval.current) {
        clearInterval(processedFrameInterval.current);
        processedFrameInterval.current = null;
      }
      return;
    }

    const updateProcessedFrame = () => {
      const frame = processingManager.getProcessedFrame(cameraId);
      if (frame) {
        setProcessedImageUrl(frame);
      }
    };

    // Update immediately and then every second
    updateProcessedFrame();
    processedFrameInterval.current = setInterval(updateProcessedFrame, 1000);
    
    return () => {
      if (processedFrameInterval.current) {
        clearInterval(processedFrameInterval.current);
        processedFrameInterval.current = null;
      }
    };
  }, [isFromThreatMonitor, selectedDeviceId, cameraId]);

  // Effect to retrieve processed frame from manager
  useEffect(() => {
    if (!isFromThreatMonitor) return;

    const updateProcessedFrame = () => {
      const frame = processingManager.getProcessedFrame(cameraId);
      if (frame) {
        setProcessedImageUrl(frame);
      }
    };

    // Update immediately
    updateProcessedFrame();

    // Set up interval to check for new frames
    const interval = setInterval(updateProcessedFrame, 100);

    return () => {
      clearInterval(interval);
    };
  }, [cameraId, isFromThreatMonitor]);

  // Register camera with manager when device changes
  useEffect(() => {
    processingManager.registerCamera(cameraId, selectedDeviceId);
    return () => {
      processingManager.unregisterCamera(cameraId);
    };
  }, [cameraId, selectedDeviceId]);

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
