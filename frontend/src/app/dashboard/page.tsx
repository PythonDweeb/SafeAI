'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import ThreatItem, { ThreatItemProps } from '@/components/ThreatItem';
import MapView from '@/components/MapView';
import CameraView from '@/components/CameraView';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraProcessingManager } from '@/services/CameraProcessingManager';
import { AIAnalysisService, AIAnalysisResponse } from '@/services/AIAnalysisService';

// Define the camera info type
type CameraInfo = {
  name: string;
  location: string;
  status: "NORMAL" | "HIGH" | "MEDIUM" | "LOW";
};

// Define all camera IDs with NORMAL status
const ALL_CAMERAS = {
  "phhs-cam1": { name: "Main Entrance", location: "Piedmont Hills HS - Main Building", status: "NORMAL" as const },
  "phhs-cam2": { name: "Gymnasium", location: "Piedmont Hills HS - Gym", status: "NORMAL" as const },
  "phhs-cam3": { name: "Parking Lot", location: "Piedmont Hills HS - North Lot", status: "NORMAL" as const },
  "phhs-cam4": { name: "Science Building", location: "Piedmont Hills HS - Science Wing", status: "NORMAL" as const },
  "phhs-cam5": { name: "Cafeteria", location: "Piedmont Hills HS - Cafeteria", status: "NORMAL" as const },
  "phhs-cam6": { name: "Library", location: "Piedmont Hills HS - Library", status: "NORMAL" as const },
};

// School camera info mapping
const SCHOOL_CAMERA_INFO = {
  "Piedmont Hills High School": ALL_CAMERAS,
  "Los Altos High School": {
    "lahs-cam1": { name: "Main Entrance", location: "Los Altos HS - Main Building", status: "NORMAL" as const },
    "lahs-cam2": { name: "Gymnasium", location: "Los Altos HS - Gym", status: "NORMAL" as const },
    "lahs-cam3": { name: "Parking Lot", location: "Los Altos HS - East Lot", status: "NORMAL" as const },
    "lahs-cam4": { name: "Science Building", location: "Los Altos HS - Science Wing", status: "NORMAL" as const },
    "lahs-cam5": { name: "Cafeteria", location: "Los Altos HS - Cafeteria", status: "NORMAL" as const },
    "lahs-cam6": { name: "Football Field", location: "Los Altos HS - Athletic Field", status: "NORMAL" as const },
  }
};

// Update the type definition at the top of the file
type ThreatItem = {
  id: string;
  cameraId: string;
  location: string;
  timestamp: string;
  status: 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW';
};

// Update the INITIAL_THREATS constant
const INITIAL_THREATS: ThreatItem[] = [
  { id: 'phhs-cam1', cameraId: 'phhs-cam1', location: 'Main Entrance', timestamp: 'Now', status: 'NORMAL' },
  { id: 'phhs-cam2', cameraId: 'phhs-cam2', location: 'Gymnasium', timestamp: 'Now', status: 'NORMAL' },
  { id: 'phhs-cam3', cameraId: 'phhs-cam3', location: 'Parking Lot', timestamp: 'Now', status: 'NORMAL' },
  { id: 'phhs-cam4', cameraId: 'phhs-cam4', location: 'Science Building', timestamp: 'Now', status: 'NORMAL' },
  { id: 'phhs-cam5', cameraId: 'phhs-cam5', location: 'Cafeteria', timestamp: 'Now', status: 'NORMAL' },
  { id: 'phhs-cam6', cameraId: 'phhs-cam6', location: 'Library', timestamp: 'Now', status: 'NORMAL' }
];

// Get camera info from camera ID
const getCameraInfo = (schoolName: string, cameraId: string): CameraInfo | undefined => {
  if (schoolName && cameraId) {
    const schoolCameras = SCHOOL_CAMERA_INFO[schoolName as keyof typeof SCHOOL_CAMERA_INFO];
    if (schoolCameras) {
      return schoolCameras[cameraId as keyof typeof schoolCameras] as CameraInfo;
    }
  }
  return undefined;
};

type SchoolName = "Piedmont Hills High School" | "Los Altos High School";

export default function Dashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(''); // Empty by default
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<SchoolName>("Piedmont Hills High School");
  const [activeThreats, setActiveThreats] = useState(INITIAL_THREATS);
  const [cameraStatuses, setCameraStatuses] = useState<Record<string, 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW'>>(() => {
    const initial: Record<string, 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = {};
    // Initialize all cameras for both schools
    Object.keys(SCHOOL_CAMERA_INFO["Piedmont Hills High School"]).forEach(cameraId => {
      initial[cameraId] = 'NORMAL';
    });
    Object.keys(SCHOOL_CAMERA_INFO["Los Altos High School"]).forEach(cameraId => {
      initial[cameraId] = 'NORMAL';
    });
    return initial;
  });
  
  // Add state for security personnel count
  const [numSecurity, setNumSecurity] = useState<number>(1);
  
  // Add a new state variable to determine whether to forcibly open the camera view
  const [forceOpenCamera, setForceOpenCamera] = useState(false);
  // Add state to store highlighted camera (when clicking on marker) without showing camera view
  const [highlightedCamera, setHighlightedCamera] = useState<string | null>(null);
  // Expanded right sidebar state
  const [rightSidebarExpanded, setRightSidebarExpanded] = useState(true);
  // Add state for emergency actions
  const [emergencyMode, setEmergencyMode] = useState(false);
  
  // New state for camera assignments and available devices
  const [cameraAssignments, setCameraAssignments] = useState<Record<string, string | null>>(() => {
    const saved = localStorage.getItem('cameraAssignments');
    return saved ? JSON.parse(saved) : {};
  });
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  
  // New state for AI analysis results
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const processingManager = CameraProcessingManager.getInstance();
  const aiAnalysisService = AIAnalysisService.getInstance();
  
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
      }
    };
    getDevices();
  }, []);
  
  // Update time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZoneName: 'short'
      }));
    };
    
    updateTime(); // Initial call
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Update threats when school changes
  useEffect(() => {
    setActiveThreats(INITIAL_THREATS);
  }, [selectedSchool]);
  
  // Listen for camera status changes
  useEffect(() => {
    const handleStatusChange = (event: CustomEvent<{ cameraId: string; status: 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW'; timestamp?: number }>) => {
      const { cameraId, status, timestamp } = event.detail;
      
      // Force a re-render of the entire state to make sure all UI components update
      setCameraStatuses(prev => {
        const newStatuses = { ...prev, [cameraId]: status };
        console.log(`Dashboard: Camera ${cameraId} status updated to ${status}${timestamp ? ` at ${new Date(timestamp).toLocaleTimeString()}` : ''}`);
        return newStatuses;
      });

      // Update active threats with timestamp and force a complete state update
      setActiveThreats(prev => {
        return prev.map(threat => 
          threat.cameraId === cameraId 
            ? { ...threat, status, timestamp: 'Now' } 
            : threat
        );
      });
    };

    window.addEventListener('cameraStatusChanged', handleStatusChange as EventListener);
    return () => {
      window.removeEventListener('cameraStatusChanged', handleStatusChange as EventListener);
    };
  }, []);
  
  // Update camera statuses when school changes
  useEffect(() => {
    // Unregister all cameras from the previous school
    Object.keys(SCHOOL_CAMERA_INFO["Piedmont Hills High School"]).forEach(cameraId => {
      processingManager.unregisterCamera(cameraId);
    });
    Object.keys(SCHOOL_CAMERA_INFO["Los Altos High School"]).forEach(cameraId => {
      processingManager.unregisterCamera(cameraId);
    });

    // Reset all camera statuses to NORMAL
    const newStatuses: Record<string, 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = {};
    Object.keys(SCHOOL_CAMERA_INFO[selectedSchool]).forEach(cameraId => {
      newStatuses[cameraId] = 'NORMAL';
    });
    setCameraStatuses(newStatuses);
  }, [selectedSchool]);
  
  const handleThreatClick = (id: string) => {
    // Find the threat and get its camera ID
    const threat = activeThreats.find(t => t.id === id);
    if (threat) {
      setSelectedCamera(threat.cameraId);
      setForceOpenCamera(true);
    }
  };
  
  // Handler for clicking on a map marker - just highlights the camera without showing view
  const handleMarkerClick = (cameraId: string) => {
    // Only update the highlighted camera for path-finding
    setHighlightedCamera(cameraId);
    
    // Auto-trigger analysis when a camera is highlighted
    const cameraInfo = getCameraInfo(selectedSchool, cameraId);
    if (cameraInfo) {
      // Get current camera status from the state
      const currentStatus = cameraStatuses[cameraId] || 'NORMAL';
      
      // Create a new cameraInfo object with the current status
      const cameraInfoWithCurrentStatus = {
        ...cameraInfo,
        status: currentStatus
      };
      
      setIsAnalyzing(true);
      aiAnalysisService.analyzeSecurityThreat(cameraInfoWithCurrentStatus, selectedSchool)
        .then(result => {
          setAiAnalysis(result);
          setIsAnalyzing(false);
        })
        .catch(error => {
          console.error('Error auto-analyzing threat:', error);
          setIsAnalyzing(false);
        });
    }
  };
  
  // Handler for "View Camera" button in popup - shows the camera view
  const handleViewCameraClick = (cameraId: string) => {
    setSelectedCamera(cameraId);
    setHighlightedCamera(cameraId);
    setForceOpenCamera(true);
  };
  
  // Function to handle requesting AI analysis
  const handleRequestAnalysis = async () => {
    if (!highlightedCamera) return;
    
    const cameraInfo = getCameraInfo(selectedSchool, highlightedCamera);
    if (!cameraInfo) return;
    
    // Get current camera status from the state
    const currentStatus = cameraStatuses[highlightedCamera] || 'NORMAL';
    
    // Create a new cameraInfo object with the current status
    const cameraInfoWithCurrentStatus = {
      ...cameraInfo,
      status: currentStatus
    };
    
    setIsAnalyzing(true);
    try {
      const analysisResult = await aiAnalysisService.analyzeSecurityThreat(
        cameraInfoWithCurrentStatus,
        selectedSchool
      );
      setAiAnalysis(analysisResult);
    } catch (error) {
      console.error('Error getting AI analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Reset forceOpenCamera after camera is shown
  useEffect(() => {
    if (forceOpenCamera && selectedCamera) {
      setForceOpenCamera(false);
    }
  }, [forceOpenCamera, selectedCamera]);
  
  const handleSendSecurity = (numSecurity: number) => {
    console.log(`Sending ${numSecurity} security personnel to ${selectedCamera}`);
    // In a real app, this would make an API call
  };
  
  const handleBuildingChange = (buildingName: string) => {
    setSelectedSchool(buildingName as SchoolName);
    // Reset selected camera when school changes
    setSelectedCamera(null);
    setHighlightedCamera(null);
  };

  const handleEmergencyAction = (action: 'call911' | 'dispatchSecurity' | 'alertSMS' | 'lockdownInitiate') => {
    // In a real app, these would make API calls to emergency services
    switch(action) {
      case 'call911':
        console.log("Calling 911 for emergency at", selectedCamera ? getCameraInfo(selectedSchool, selectedCamera)?.location : null);
        // Show confirmation toast
        setEmergencyMode(true);
        setTimeout(() => setEmergencyMode(false), 3000);
        break;
      case 'dispatchSecurity':
        handleSendSecurity(numSecurity);
        break;
      case 'alertSMS':
        console.log("Sending SMS alerts to all personnel within 0.5 mile radius of", selectedCamera ? getCameraInfo(selectedSchool, selectedCamera)?.location : null);
        // Show confirmation toast
        break;
      case 'lockdownInitiate':
        console.log("Initiating lockdown at", selectedCamera ? getCameraInfo(selectedSchool, selectedCamera)?.location : null);
        // Show confirmation toast
        break;
    }
  };

  // Get camera info for the selected camera
  const selectedCameraInfo = selectedCamera ? getCameraInfo(selectedSchool, selectedCamera) : undefined;

  const handleCameraStatusUpdate = (status: 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW') => {
    if (selectedCamera) {
      setCameraStatuses(prev => ({
        ...prev,
        [selectedCamera]: status
      }));
    }
  };

  const handleCameraAssignment = async (cameraId: string, deviceId: string | null) => {
    const newAssignments = { ...cameraAssignments };
    
    // First, unregister this camera from any previous device
    await processingManager.unregisterCamera(cameraId);
    
    // Update assignments and status
    if (deviceId) {
      newAssignments[cameraId] = deviceId;
      // Register camera for continuous processing
      await processingManager.registerCamera(
        cameraId,
        deviceId,
        (status) => {
          setCameraStatuses(prev => ({
            ...prev,
            [cameraId]: status
          }));
        }
      );
    } else {
      // When camera is unassigned, remove it from assignments and set status to NORMAL
      delete newAssignments[cameraId];
      setCameraStatuses(prev => ({
        ...prev,
        [cameraId]: 'NORMAL'
      }));
    }
    
    setCameraAssignments(newAssignments);
    localStorage.setItem('cameraAssignments', JSON.stringify(newAssignments));
  };

  // Create a separate useEffect for simulating threat detection when no cameras are assigned
  useEffect(() => {
    // Only set up the simulation if no cameras have been assigned yet
    const hasAssignedCameras = Object.values(cameraAssignments).some(Boolean);
    
    // Function to simulate random threat detection for demonstration purposes
    const simulateThreatDetection = () => {
      // Get all camera IDs for the current school
      const allCameraIds = Object.keys(SCHOOL_CAMERA_INFO[selectedSchool]);
      if (allCameraIds.length === 0) return;
      
      // Randomly select a camera to "detect" a threat on
      const randomCameraId = allCameraIds[Math.floor(Math.random() * allCameraIds.length)];
      
      // Randomly determine a threat status (or NORMAL)
      const statuses: ('NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW')[] = ['NORMAL', 'NORMAL', 'NORMAL', 'LOW', 'MEDIUM', 'HIGH'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Update camera status state
      setCameraStatuses(prev => ({
        ...prev,
        [randomCameraId]: randomStatus
      }));
      
      // Update active threats state
      setActiveThreats(prev => 
        prev.map(threat => 
          threat.cameraId === randomCameraId 
            ? { ...threat, status: randomStatus, timestamp: 'Now' } 
            : threat
        )
      );
      
      // Dispatch global event to update all components
      const event = new CustomEvent('cameraStatusChanged', {
        detail: { 
          cameraId: randomCameraId, 
          status: randomStatus,
          timestamp: Date.now()
        }
      });
      setTimeout(() => {
        window.dispatchEvent(event);
      }, 0);
      
      console.log(`Simulated ${randomStatus} threat for camera ${randomCameraId}`);
      
      // If not NORMAL, set a timeout to revert back to NORMAL
      if (randomStatus !== 'NORMAL') {
        setTimeout(() => {
          setCameraStatuses(prev => ({
            ...prev,
            [randomCameraId]: 'NORMAL'
          }));
          
          setActiveThreats(prev => 
            prev.map(threat => 
              threat.cameraId === randomCameraId 
                ? { ...threat, status: 'NORMAL', timestamp: 'Now' } 
                : threat
            )
          );
          
          const normalEvent = new CustomEvent('cameraStatusChanged', {
            detail: { 
              cameraId: randomCameraId, 
              status: 'NORMAL',
              timestamp: Date.now()
            }
          });
          setTimeout(() => {
            window.dispatchEvent(normalEvent);
          }, 0);
          
          console.log(`Reverted camera ${randomCameraId} to NORMAL status`);
        }, 3000); // Revert after 3 seconds
      }
    };
    
    // Set up simulation interval only if no cameras are assigned
    let simulationInterval: NodeJS.Timeout | null = null;
    if (!hasAssignedCameras) {
      simulationInterval = setInterval(simulateThreatDetection, 5000); // Simulate every 5 seconds
      console.log("Starting threat detection simulation (no cameras assigned)");
    }
    
    return () => {
      if (simulationInterval) {
        clearInterval(simulationInterval);
        console.log("Stopping threat detection simulation");
      }
    };
  }, [selectedSchool, cameraAssignments]);

  // Load saved camera assignments on mount - MODIFY THIS FOR SINGLE CAMERA PROCESSING APPROACH
  useEffect(() => {
    const savedAssignments = localStorage.getItem('cameraAssignments');
    const assignments = savedAssignments ? JSON.parse(savedAssignments) : {};
    setCameraAssignments(assignments);
    
    // Initialize all cameras to NORMAL status
    const initialStatuses: Record<string, 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = {};
    Object.keys(SCHOOL_CAMERA_INFO[selectedSchool]).forEach(cameraId => {
      initialStatuses[cameraId] = 'NORMAL';
    });
    
    // Only register cameras that actually have assigned devices
    Object.entries(assignments).forEach(async ([cameraId, deviceId]) => {
      if (deviceId) {
        // Register the camera with the processing manager
        await processingManager.registerCamera(
          cameraId,
          deviceId as string,
          (status) => {
            // When this camera detects a status change:
            // 1. Update its own status
            setCameraStatuses(prev => ({
              ...prev,
              [cameraId]: status
            }));
            
            // 2. Update active threats immediately
            setActiveThreats(prev => 
              prev.map(threat => 
                threat.cameraId === cameraId 
                  ? { ...threat, status, timestamp: 'Now' } 
                  : threat
              )
            );
            
            // 3. Dispatch a global event for all components
            const event = new CustomEvent('cameraStatusChanged', {
              detail: { 
                cameraId, 
                status,
                timestamp: Date.now()
              }
            });
            setTimeout(() => {
              window.dispatchEvent(event);
            }, 0);
          }
        );
      }
    });
    
    setCameraStatuses(initialStatuses);
  }, [selectedSchool]);

  // Clean up all camera processing on unmount
  useEffect(() => {
    return () => {
      // Unregister all cameras, not just assigned ones
      Object.keys(SCHOOL_CAMERA_INFO["Piedmont Hills High School"]).forEach(cameraId => {
        processingManager.unregisterCamera(cameraId);
      });
      Object.keys(SCHOOL_CAMERA_INFO["Los Altos High School"]).forEach(cameraId => {
        processingManager.unregisterCamera(cameraId);
      });
    };
  }, []);

  // Update event listener for camera assignments
  useEffect(() => {
    const handleCameraAssigned = (event: CustomEvent<{ cameraId: string; deviceId: string | null }>) => {
      handleCameraAssignment(event.detail.cameraId, event.detail.deviceId);
    };

    window.addEventListener('cameraAssigned', handleCameraAssigned as EventListener);
    return () => {
      window.removeEventListener('cameraAssigned', handleCameraAssigned as EventListener);
    };
  }, [cameraAssignments]);

  // *** SEARCH FILTERING LOGIC ADDED HERE ***  
  // Filter cameras based on the search query (searching by name or location)
  const filteredCameras = Object.entries(SCHOOL_CAMERA_INFO[selectedSchool]).filter(
    ([, info]) =>
      info.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      info.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <Header 
        buildingName={selectedSchool} 
        currentTime={currentTime}
        onBuildingChange={handleBuildingChange}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-80 bg-white flex flex-col overflow-hidden shadow-lg z-10 transition-all duration-300">
          <div className="p-5 border-b border-gray-200 bg-white">
            <h2 className="text-xl font-bold mb-3 text-gray-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Threat Monitor
            </h2>
            <SearchBar 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
              resultCount={filteredCameras.length} 
            />
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50 transition-all duration-300">
            {/* Active Cameras - Render filtered list */}
            <div className="space-y-3">
              {filteredCameras.map(([cameraId, info]) => (
                <ThreatItem 
                  key={cameraId}
                  id={cameraId}
                  cameraId={cameraId}
                  location={info.name}
                  timestamp="Now"
                  status={cameraStatuses[cameraId] || 'NORMAL'}
                  onThreatClick={handleThreatClick}
                />
              ))}
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100">
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">System Status: Online</span>
              <div className="ml-auto">
                <button className="text-xs text-blue-600 hover:underline transition-all">
                  Status History
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              <div className="text-xs text-gray-500">
                Version 2.1.4
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content area - map */}
        <div className="flex-1 relative flex">
          <MapView 
            onMarkerClick={handleMarkerClick}
            onViewCameraClick={handleViewCameraClick}
            selectedSchool={selectedSchool}
            highlightedCamera={highlightedCamera}
            cameraAssignments={cameraAssignments}
            cameraStatuses={cameraStatuses}
          />
          
          {/* New right sidebar for camera info and controls */}
          <AnimatePresence>
            {highlightedCamera && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'clamp(600px, 100%, 1600px)', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                className="h-full bg-white border-l border-gray-200 shadow-lg z-10 overflow-hidden relative"
              >
                {/* Right sidebar header */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      <motion.span
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        {getCameraInfo(selectedSchool, highlightedCamera)?.name || 'Camera Feed'}
                      </motion.span>
                    </h2>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      onClick={() => setHighlightedCamera(null)}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-sm text-gray-600"
                    >
                      {getCameraInfo(selectedSchool, highlightedCamera)?.location || 'Unknown location'}
                    </motion.p>
                  </div>
                </div>
                
                {/* Status badge */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-2">Status:</span>
                    <motion.span 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      className={`px-2.5 py-1 text-xs font-medium rounded-full shadow-sm ${
                        cameraStatuses[highlightedCamera] === 'HIGH' ? 'bg-red-100 text-red-800 shadow-red-500/10' :
                        cameraStatuses[highlightedCamera] === 'MEDIUM' ? 'bg-orange-100 text-orange-800 shadow-orange-500/10' :
                        cameraStatuses[highlightedCamera] === 'LOW' ? 'bg-yellow-100 text-yellow-800 shadow-yellow-500/10' :
                        'bg-green-100 text-green-800 shadow-green-500/10'
                      }`}
                    >
                      {cameraStatuses[highlightedCamera] || 'NORMAL'}
                    </motion.span>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Last updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
                
                {/* Camera feeds and controls */}
                <div className="p-4 space-y-4 overflow-y-auto bg-gray-50/50" style={{ height: 'calc(100% - 135px)' }}>
                  {/* Live Camera Feed */}
                  <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200 bg-white transition-all hover:shadow-xl h-[calc(100vh-280px)]">
                    <div className="h-full bg-black relative">
                      <CameraView 
                        cameraId={highlightedCamera} 
                        onClose={() => setHighlightedCamera(null)}
                        onSendSecurity={handleSendSecurity}
                        onStatusUpdate={handleCameraStatusUpdate}
                        cameraInfo={getCameraInfo(selectedSchool, highlightedCamera)}
                        assignedDeviceId={highlightedCamera ? cameraAssignments[highlightedCamera] : null}
                        isFromThreatMonitor={false}
                      />
                    </div>
                  </div>
                  
                  {/* Emergency Actions */}
                  <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200">
                    <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-2 border-b border-gray-200 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <h3 className="text-sm font-medium text-gray-700">Emergency Actions</h3>
                    </div>
                    <div className="p-4 space-y-3 bg-white">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleEmergencyAction('call911')}
                        className={`w-full py-2.5 px-4 rounded-lg font-medium text-white shadow-lg transition-all flex items-center justify-center
                          ${emergencyMode ? 'bg-red-600 animate-pulse shadow-red-500/50' : 'bg-red-500 hover:bg-red-600 shadow-red-500/30'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        {emergencyMode ? 'Calling 911...' : 'Call 911'}
                      </motion.button>
                      
                      <div className="flex space-x-3">
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleEmergencyAction('alertSMS')}
                          className="flex-1 py-2.5 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Alert by SMS
                        </motion.button>
                        
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleEmergencyAction('lockdownInitiate')}
                          className="flex-1 py-2.5 px-4 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Lockdown Area
                        </motion.button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Security Dispatch Controls */}
                  <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200">
                    <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-2 border-b border-gray-200 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      <h3 className="text-sm font-medium text-gray-700">Security Dispatch</h3>
                    </div>
                    <div className="p-4 bg-white">
                      <div className="flex items-center mb-4">
                        <label className="text-sm text-gray-700 mr-3 font-medium">Personnel:</label>
                        <div className="flex items-center border rounded-lg overflow-hidden shadow-sm">
                          <motion.button
                            whileHover={{ backgroundColor: '#f3f4f6' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setNumSecurity(prev => Math.max(1, prev - 1))}
                            className="px-3 py-2 bg-gray-100 text-gray-700 border-r transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </motion.button>
                          <motion.div 
                            key={numSecurity}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="px-4 py-2 bg-white min-w-[50px] text-center font-medium"
                          >
                            {numSecurity}
                          </motion.div>
                          <motion.button
                            whileHover={{ backgroundColor: '#f3f4f6' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setNumSecurity(prev => Math.min(10, prev + 1))}
                            className="px-3 py-2 bg-gray-100 text-gray-700 border-l transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </motion.button>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSendSecurity(numSecurity)}
                        className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        Dispatch Security Team
                      </motion.button>
                      
                      {/* Security info */}
                      <div className="mt-3 text-xs text-gray-500 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Estimated response time: 2-3 minutes</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Analysis Section - New */}
                  <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200">
                    <div className="bg-gradient-to-r from-teal-100 to-blue-100 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <h3 className="text-base font-medium text-gray-800">AI Threat Analysis</h3>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleRequestAnalysis}
                          disabled={isAnalyzing}
                          className="p-1.5 text-teal-600 hover:text-teal-800 transition-colors bg-white/60 rounded-full shadow-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </motion.button>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4">
                      {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <div className="w-12 h-12 border-t-2 border-r-2 border-b-2 border-teal-500 rounded-full animate-spin mb-4"></div>
                          <p className="text-sm text-gray-600 animate-pulse">Analyzing threat situation with Gemini AI...</p>
                        </div>
                      ) : aiAnalysis ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 300, 
                            damping: 30,
                            staggerChildren: 0.05,
                            delayChildren: 0.1
                          }}
                          className="space-y-5"
                        >
                          {/* Analysis Header */}
                          <motion.div 
                            variants={{
                              hidden: { opacity: 0, y: 10 },
                              visible: { opacity: 1, y: 0 }
                            }}
                            className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-5 shadow-inner"
                          >
                            <h4 className="font-medium text-gray-800 mb-3 flex items-center text-base">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Situation Assessment
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {aiAnalysis.analysis}
                            </p>
                          </motion.div>
                          
                          {/* Analysis Details */}
                          <div className="grid grid-cols-2 gap-4">
                            <motion.div 
                              variants={{
                                hidden: { opacity: 0, y: 10 },
                                visible: { opacity: 1, y: 0 }
                              }}
                              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="text-xs uppercase text-gray-500 font-medium mb-2">Response Time</div>
                              <div className="text-xl font-semibold text-gray-800 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {aiAnalysis.responseTime}
                              </div>
                            </motion.div>
                            
                            <motion.div 
                              variants={{
                                hidden: { opacity: 0, y: 10 },
                                visible: { opacity: 1, y: 0 }
                              }}
                              className={`rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow ${
                                cameraStatuses[highlightedCamera || ''] === 'HIGH' ? 'bg-red-50 border-red-200 text-red-800' : 
                                cameraStatuses[highlightedCamera || ''] === 'MEDIUM' ? 'bg-orange-50 border-orange-200 text-orange-800' :
                                cameraStatuses[highlightedCamera || ''] === 'LOW' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                                'bg-green-50 border-green-200 text-green-800'
                              }`}
                            >
                              <div className="text-xs uppercase font-medium mb-2 opacity-80">Threat Level</div>
                              <div className="text-xl font-semibold flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {cameraStatuses[highlightedCamera || '']}
                              </div>
                            </motion.div>
                          </div>
                          
                          {/* Recommended Actions */}
                          <motion.div 
                            variants={{
                              hidden: { opacity: 0, y: 10 },
                              visible: { opacity: 1, y: 0 }
                            }}
                            className="rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                              <h4 className="font-medium text-gray-800 text-base flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Recommended Actions
                              </h4>
                            </div>
                            <div className="divide-y divide-gray-100">
                              {aiAnalysis.recommendedActions.map((action, index) => (
                                <motion.div 
                                  key={index}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.15 }}
                                  className="flex items-start p-4 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mr-3 mt-0.5 shadow-sm">
                                    <span className="text-xs font-medium text-indigo-700">{index + 1}</span>
                                  </div>
                                  <p className="text-sm text-gray-700">{action}</p>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                          
                          {/* Analysis timestamp */}
                          <motion.div 
                            variants={{
                              hidden: { opacity: 0 },
                              visible: { opacity: 1 }
                            }}
                            className="flex justify-between items-center text-xs text-gray-500 pt-2"
                          >
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Generated: {new Date(aiAnalysis.timestamp).toLocaleTimeString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                Gemini AI
                              </span>
                            </div>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <div className="py-10 px-6 flex flex-col items-center justify-center text-center">
                          <div className="rounded-full bg-teal-100 p-4 mb-5 shadow-inner">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-medium text-gray-800 mb-3">AI Analysis Ready</h4>
                          <p className="text-gray-600 text-sm mb-5 max-w-md">
                            Click the refresh button to generate a real-time AI analysis of the current situation using the Gemini API.
                          </p>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleRequestAnalysis}
                            className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg font-medium shadow-lg shadow-teal-500/20 transition-all flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Generate AI Analysis
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Full screen camera view modal */}
          <AnimatePresence>
            {selectedCamera && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
                >
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                      {(selectedCameraInfo as CameraInfo)?.name || 'Camera Feed'} - Full View
                  </h2>
                  <button 
                    onClick={() => setSelectedCamera(null)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6 flex-1 overflow-auto">
                  <CameraView 
                    cameraId={selectedCamera}
                    onClose={() => setSelectedCamera(null)}
                    onSendSecurity={handleSendSecurity}
                    onStatusUpdate={handleCameraStatusUpdate}
                    cameraInfo={selectedCamera ? getCameraInfo(selectedSchool, selectedCamera) : undefined}
                    assignedDeviceId={selectedCamera ? cameraAssignments[selectedCamera] : null}
                    isFromThreatMonitor={true}
                  />
                </div>
                </motion.div>
              </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
