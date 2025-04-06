'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProcessingService } from '@/services/ProcessingService';
import { CameraProcessingManager } from '@/services/CameraProcessingManager';
import CameraStreamManager from '@/services/CameraStreamManager';

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
  const streamManager = CameraStreamManager.getInstance();
  const processedFrameInterval = useRef<NodeJS.Timeout | null>(null);
  const streamCleanupRef = useRef<(() => void) | null>(null);

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
      
      // Update status based on threats
      if (result.threats.length > 0) {
        const highestThreat = result.threats.sort((a: { confidence: number }, b: { confidence: number }) => b.confidence - a.confidence)[0];
        const newStatus = highestThreat.confidence > 0.8 ? 'HIGH' :
                         highestThreat.confidence > 0.5 ? 'MEDIUM' : 'LOW';
        onStatusUpdate(newStatus);
      } else {
        onStatusUpdate('NORMAL');
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

  // Start camera stream when selected device changes - use CameraStreamManager
  useEffect(() => {
    if (!selectedDeviceId) {
      if (stream) {
        // Don't actually stop the stream - just release our reference
        setStream(null);
      }
      
      // Clean up the stream request
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
        streamCleanupRef.current = null;
      }
      
      stopProcessing();
      return;
    }

    // Clean up any previous stream request
    if (streamCleanupRef.current) {
      streamCleanupRef.current();
    }

    // Request the stream from the manager instead of directly from the device
    const cleanup = streamManager.requestStream(selectedDeviceId, (newStream) => {
      if (newStream) {
        setStream(newStream);
        setError(null);
        
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.play().catch(error => {
            console.error('Error playing video:', error);
            setError('Error playing video stream. The camera might be in use by another application.');
          });
        }
      } else {
        console.error('Failed to get camera stream');
        setError('Failed to access camera. The device might be in use or not available.');
      }
    });
    
    // Save the cleanup function
    streamCleanupRef.current = cleanup;

    return () => {
      stopProcessing();
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
        streamCleanupRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [selectedDeviceId]);

  // Fetch and display the processed frame from the processing manager
  useEffect(() => {
    if (!cameraId || !assignedDeviceId) return;

    const fetchProcessedFrame = () => {
      const frame = processingManager.getProcessedFrame(cameraId);
      if (frame) {
        setProcessedImageUrl(frame);
      }
    };

    // Set up an interval to fetch the latest processed frame
    const interval = setInterval(fetchProcessedFrame, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [cameraId, assignedDeviceId]);

  // Update threats and status when camera status changes
  useEffect(() => {
    const handleStatusChange = (event: CustomEvent<{ cameraId: string; status: 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW' }>) => {
      if (event.detail.cameraId === cameraId) {
        setCameraStatus(event.detail.status);
      }
    };

    window.addEventListener('cameraStatusChanged', handleStatusChange as EventListener);
    return () => {
      window.removeEventListener('cameraStatusChanged', handleStatusChange as EventListener);
    };
  }, [cameraId]);

  useEffect(() => {
    // Simulate camera status changes for demonstration
    const simulateStatusChanges = assignedDeviceId === null && isFromThreatMonitor;
    if (!simulateStatusChanges) return;

    let interval: NodeJS.Timeout;
    
    const simulate = () => {
      const statuses: ('NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW')[] = ['NORMAL', 'LOW', 'MEDIUM', 'HIGH'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      setCameraStatus(randomStatus);
      onStatusUpdate(randomStatus);
      
      // Dispatch event
      const event = new CustomEvent('cameraStatusChanged', {
        detail: { cameraId, status: randomStatus }
      });
      window.dispatchEvent(event);
    };
    
    if (simulateStatusChanges) {
      interval = setInterval(simulate, 8000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [assignedDeviceId, isFromThreatMonitor, cameraId, onStatusUpdate]);

  // Set up an event to handle the device assignment
  const handleDeviceAssignment = (deviceId: string | null) => {
    // Dispatch an event to notify any listeners about the camera assignment
    const event = new CustomEvent('cameraAssigned', {
      detail: { cameraId, deviceId }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Camera feed */}
      <div className="flex-1 relative bg-black">
        {!assignedDeviceId ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">No Camera Assigned</h3>
            <p className="text-gray-400 text-center mb-6">Assign a camera device to monitor this location.</p>
            
            {availableDevices.length > 0 ? (
              <div className="w-full max-w-xs">
                <select 
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  onChange={(e) => handleDeviceAssignment(e.target.value || null)}
                  value={selectedDeviceId || ''}
                >
                  <option value="">Select a camera...</option>
                  {availableDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${availableDevices.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-red-400">No camera devices detected</p>
            )}
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              className="absolute inset-0 h-full w-full object-cover"
              playsInline
              muted
              autoPlay
            />
            
            {/* Threat indicator overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className={`absolute inset-0 transition-opacity duration-1000 ${cameraStatus !== 'NORMAL' ? 'opacity-100' : 'opacity-0'}`}>
                <div className={`absolute inset-0 ${
                  cameraStatus === 'HIGH' ? 'border-red-500 animate-pulse-border-fast' :
                  cameraStatus === 'MEDIUM' ? 'border-orange-500 animate-pulse-border-medium' :
                  cameraStatus === 'LOW' ? 'border-yellow-500 animate-pulse-border-slow' : ''
                } border-[10px] rounded-lg`}></div>
              </div>
            </div>
            
            {/* Controls overlay */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  stream ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></div>
                <span className="text-white text-sm">
                  {stream ? 'Live' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleDeviceAssignment(null)}
                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                >
                  Disconnect
                </button>
                <select 
                  className="px-2 py-1 text-xs bg-gray-800 text-white rounded border border-gray-700"
                  value={selectedDeviceId || ''}
                  onChange={(e) => handleDeviceAssignment(e.target.value || null)}
                >
                  <option value="">Change camera...</option>
                  {availableDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${availableDevices.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Status indicator */}
            <div className="absolute top-4 right-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                cameraStatus === 'HIGH' ? 'bg-red-500 animate-pulse' :
                cameraStatus === 'MEDIUM' ? 'bg-orange-500' :
                cameraStatus === 'LOW' ? 'bg-yellow-500' :
                'bg-green-500'
              } text-white`}>
                {cameraStatus}
              </div>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 text-sm text-center">
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CameraView;
