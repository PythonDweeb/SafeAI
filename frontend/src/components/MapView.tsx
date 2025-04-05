'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
// Import Leaflet types but not the actual library on server
import type { LatLngTuple, LatLngExpression, Marker as LeafletMarker } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Dynamically import Leaflet components with no SSR to avoid hydration issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const ZoomControl = dynamic(
  () => import('react-leaflet').then((mod) => mod.ZoomControl),
  { ssr: false }
);

const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

// Import useMap hook for path interactions
// Not currently used but keeping for future reference
/*
const useMap = dynamic(
  () => import('react-leaflet/hooks').then((mod) => mod.useMap),
  { ssr: false }
);
*/

// Added DraggableMarker component for path points
const DraggableMarker = ({ position, index, onDragEnd, icon }: { 
  position: LatLngTuple, 
  index: number, 
  onDragEnd: (index: number, position: LatLngTuple) => void,
  icon: any
}) => {
  const [markerPosition, setMarkerPosition] = useState<LatLngTuple>(position);
  const markerRef = useRef<LeafletMarker>(null);
  
  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const newPos = [marker.getLatLng().lat, marker.getLatLng().lng] as LatLngTuple;
        setMarkerPosition(newPos);
        onDragEnd(index, newPos);
      }
    },
  };

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={markerPosition}
      ref={markerRef}
      icon={icon}
    />
  );
};

// Define allowed status types
type StatusType = 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL';

// School coordinates and camera positions
const SCHOOL_LOCATIONS = {
  "Piedmont Hills High School": {
    center: [37.4024, -121.8501] as LatLngTuple, // Piedmont Hills HS in San Jose, CA - user-specified location
    zoom: 17,
    cameras: [
      { 
        id: 'phhs-cam1', 
        position: [37.4027, -121.8503] as LatLngTuple, 
        name: 'Main Entrance', 
        status: 'NORMAL' as StatusType,
        location: 'Piedmont Hills HS - Main Building',
        lastUpdate: new Date().toISOString()
      },
      { 
        id: 'phhs-cam2', 
        position: [37.4020, -121.8498] as LatLngTuple, 
        name: 'Gymnasium', 
        status: 'HIGH' as StatusType,
        location: 'Piedmont Hills HS - Gym',
        lastUpdate: new Date().toISOString()
      },
      { 
        id: 'phhs-cam3', 
        position: [37.4029, -121.8495] as LatLngTuple, 
        name: 'Parking Lot', 
        status: 'MEDIUM' as StatusType,
        location: 'Piedmont Hills HS - North Lot',
        lastUpdate: new Date().toISOString()
      },
      { 
        id: 'phhs-cam4', 
        position: [37.4025, -121.8508] as LatLngTuple, 
        name: 'Science Building', 
        status: 'LOW' as StatusType,
        location: 'Piedmont Hills HS - Science Wing',
        lastUpdate: new Date().toISOString()
      },
      { 
        id: 'phhs-cam5', 
        position: [37.4022, -121.8492] as LatLngTuple, 
        name: 'Cafeteria', 
        status: 'NORMAL' as StatusType,
        location: 'Piedmont Hills HS - Cafeteria',
        lastUpdate: new Date().toISOString()
      },
      { 
        id: 'phhs-cam6', 
        position: [37.4018, -121.8505] as LatLngTuple, 
        name: 'Library', 
        status: 'NORMAL' as StatusType,
        location: 'Piedmont Hills HS - Library',
        lastUpdate: new Date().toISOString()
      },
    ],
    // Road access points for emergency response
    accessPoints: [
      { id: 'phhs-access1', position: [37.4035, -121.8510] as LatLngTuple, name: 'North Entrance' },
      { id: 'phhs-access2', position: [37.4015, -121.8490] as LatLngTuple, name: 'South Entrance' },
      { id: 'phhs-access3', position: [37.402828, -121.852601] as LatLngTuple, name: 'West Entrance' },
    ]
  },
  "Los Altos High School": {
    center: [37.386251, -122.107931] as LatLngTuple, // Los Altos HS location - user-specified
    zoom: 17,
    cameras: [
      { 
        id: 'lahs-cam1', 
        position: [37.386451, -122.107731] as LatLngTuple, 
        name: 'Main Entrance', 
        status: 'NORMAL' as StatusType,
        location: 'Los Altos HS - Main Building',
        lastUpdate: new Date().toISOString()
      },
      { 
        id: 'lahs-cam2', 
        position: [37.386051, -122.108231] as LatLngTuple, 
        name: 'Gymnasium', 
        status: 'NORMAL' as StatusType,
        location: 'Los Altos HS - Gym',
        lastUpdate: new Date().toISOString()
      },
      { 
        id: 'lahs-cam3', 
        position: [37.385851, -122.107631] as LatLngTuple, 
        name: 'Parking Lot', 
        status: 'HIGH' as StatusType,
        location: 'Los Altos HS - East Lot',
        lastUpdate: new Date().toISOString()
      },
      { 
        id: 'lahs-cam4', 
        position: [37.386351, -122.108431] as LatLngTuple, 
        name: 'Science Building', 
        status: 'MEDIUM' as StatusType,
        location: 'Los Altos HS - Science Wing',
        lastUpdate: new Date().toISOString()
      },
      { 
        id: 'lahs-cam5', 
        position: [37.386751, -122.107831] as LatLngTuple, 
        name: 'Cafeteria', 
        status: 'LOW' as StatusType,
        location: 'Los Altos HS - Cafeteria',
        lastUpdate: new Date().toISOString()
      },
      { 
        id: 'lahs-cam6', 
        position: [37.386051, -122.107331] as LatLngTuple, 
        name: 'Football Field', 
        status: 'NORMAL' as StatusType,
        location: 'Los Altos HS - Athletic Field',
        lastUpdate: new Date().toISOString()
      },
    ],
    // Road access points for emergency response
    accessPoints: [
      { id: 'lahs-access1', position: [37.387275, -122.107373] as LatLngTuple, name: 'North Entrance' },
      { id: 'lahs-access2', position: [37.385040, -122.107934] as LatLngTuple, name: 'South Entrance' },
      { id: 'lahs-access3', position: [37.385319, -122.110007] as LatLngTuple, name: 'West Entrance' },
    ]
  }
};

// Define Camera interface
interface Camera {
  id: string;
  name: string;
  location: string;
  status: 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL';
  position: LatLngTuple;
  lastUpdate: string;
}

// Define AccessPoint interface
interface AccessPoint {
  id: string;
  position: LatLngTuple;
  name: string;
}

interface MapViewProps {
  onMarkerClick: (cameraId: string) => void;
  onViewCameraClick: (cameraId: string) => void;
  selectedSchool: string;
  highlightedCamera: string | null;
}

// CSS for map components - Defined here to avoid DOM errors
const mapStyles = `
.leaflet-container {
  z-index: 1 !important; /* Ensure map stays in background */
  font-family: 'Inter', sans-serif;
}
.status-high {
  background-color: #ff3b30;
  color: white;
}
.status-medium {
  background-color: #ff9500;
  color: white;
}
.status-low {
  background-color: #ffcc00;
  color: #333;
}
.status-normal {
  background-color: #34c759;
  color: white;
}
.camera-marker {
  border-radius: 50%;
  transition: all 0.2s ease;
  opacity: 0.9;
}
.camera-marker-highlighted {
  transform: scale(1.5);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.8), 0 0 20px rgba(59, 130, 246, 0.4);
  z-index: 1000 !important;
  opacity: 1;
}
.access-point-marker {
  background-color: #3b82f6;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(0,0,0,0.3);
}
.response-path {
  stroke: #3b82f6;
  stroke-width: 3;
  stroke-dasharray: 10, 5;
  animation: dash 1.5s linear infinite;
  filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.5));
}
@keyframes dash {
  to {
    stroke-dashoffset: -15;
  }
}
.time-label {
  background-color: white;
  color: #3b82f6;
  font-size: 10px;
  font-weight: bold;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.leaflet-control-zoom {
  border-radius: 8px !important;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
}
.leaflet-control-zoom a {
  background-color: white !important;
  color: #555 !important;
}
.leaflet-control-zoom a:hover {
  background-color: #f8f9fa !important;
  color: #333 !important;
}
`;

// Updated OptimalPath interface to work with LatLngTuple
interface OptimalPath {
  path: LatLngTuple[];
  timeEstimate: number;
}

const MapView: React.FC<MapViewProps> = ({ 
  onMarkerClick, 
  onViewCameraClick, 
  selectedSchool,
  highlightedCamera
}) => {
  const [mounted, setMounted] = useState(false);
  const [mapKey, setMapKey] = useState<number>(Date.now());
  const [leafletInstance, setLeafletInstance] = useState<any>(null);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [optimalPath, setOptimalPath] = useState<OptimalPath | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isPathDragging, setIsPathDragging] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Use useEffect to set mounted status
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Load Leaflet on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Import Leaflet only on client side
      import('leaflet').then(L => {
        setLeafletInstance(L.default);
        
        // Fix for default Leaflet icon paths
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
        });
      });
    }
  }, []);
  
  // Reset map when school changes
  useEffect(() => {
    if (mounted) {
      setMapKey(Date.now());
      setSelectedCamera(null);
      setOptimalPath(null);
      setMapError(null);
    }
  }, [selectedSchool, mounted]);
  
  // Update selected camera when highlightedCamera changes
  useEffect(() => {
    if (highlightedCamera && mounted && leafletInstance) {
      const schoolData = SCHOOL_LOCATIONS[selectedSchool as keyof typeof SCHOOL_LOCATIONS];
      if (schoolData) {
        const camera = schoolData.cameras.find(cam => cam.id === highlightedCamera);
        if (camera) {
          setSelectedCamera(camera);
          try {
            // Find the optimal path from the nearest access point
            findOptimalPath(camera);
          } catch (error) {
            console.error("Error finding optimal path:", error);
            setMapError("Could not calculate response path");
          }
        }
      }
    } else if (highlightedCamera === null) {
      setSelectedCamera(null);
      setOptimalPath(null);
    }
  }, [highlightedCamera, selectedSchool, mounted, leafletInstance]);
  
  const findOptimalPath = (camera: Camera) => {
    try {
      if (!leafletInstance) return;
      
      const schoolData = SCHOOL_LOCATIONS[selectedSchool as keyof typeof SCHOOL_LOCATIONS];
      if (!schoolData || !schoolData.accessPoints || schoolData.accessPoints.length === 0) return;
      
      // Find the nearest access point
      let nearestAccessPoint = schoolData.accessPoints[0];
      let shortestDistance = calculateDistance(
        camera.position.lat, camera.position.lng,
        nearestAccessPoint.position[0], nearestAccessPoint.position[1]
      );
      
      schoolData.accessPoints.forEach(accessPoint => {
        const distance = calculateDistance(
          camera.position.lat, camera.position.lng,
          accessPoint.position[0], accessPoint.position[1]
        );
        
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestAccessPoint = accessPoint;
        }
      });
      
      // Calculate a more realistic path (add intermediary points for a more natural path)
      const path = calculatePath(nearestAccessPoint.position, camera.position);
      
      // Estimate time based on distance (assuming average walking speed of 1.4m/s or 5km/h)
      // 1 degree of latitude is approximately 111km, so we convert to meters
      // Multiply by 8 to make times more realistic (otherwise times are too short)
      const timeEstimate = Math.ceil(shortestDistance * 111000 / 83.3 * 8); // time in seconds (83.3 m/min is 5km/h)
      
      setOptimalPath({
        path,
        timeEstimate
      });
    } catch (error) {
      console.error("Error in findOptimalPath:", error);
      setMapError("Error calculating response path");
    }
  };
  
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    // Simple Euclidean distance - this is a simplification, but works for small distances
    const latDiff = lat2 - lat1;
    const lonDiff = lon2 - lon1;
    return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
  };
  
  const calculatePath = (start: LatLngTuple, end: any): LatLngTuple[] => {
    // Create a direct path with one intermediate point
    const result: LatLngTuple[] = [start];
    
    // Add midpoint exactly in the middle
    // Check if end is an object with lat/lng properties (CameraPosition type) or an array (LatLngTuple)
    const endLat = Array.isArray(end) ? end[0] : (end && typeof end === 'object' && 'lat' in end ? end.lat : 0);
    const endLng = Array.isArray(end) ? end[1] : (end && typeof end === 'object' && 'lng' in end ? end.lng : 0);
    const midLat = (start[0] + endLat) / 2;
    const midLon = (start[1] + endLng) / 2;
    
    result.push([midLat, midLon]);
    
    // Add endpoint - convert CameraPosition to LatLngTuple if needed
    if (end && typeof end === 'object' && !Array.isArray(end) && 'lat' in end && 'lng' in end) {
      result.push([end.lat, end.lng]);
    } else if (Array.isArray(end)) {
      result.push(end);
    }
    
    return result;
  };
  
  const formatTimeEstimate = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} sec`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes} min`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  // Add a handler for path point drag
  const handlePathPointDrag = (index: number, newPosition: LatLngTuple) => {
    if (!optimalPath) return;
    
    // Create a copy of the current path
    const newPath = [...optimalPath.path];
    
    // Update the dragged point position
    newPath[index] = newPosition;
    
    // If the first or last point was moved, update the accessPoint or camera position references
    if (index === 0) {
      // First point (access point) moved - we should recalculate time from new position
      const distance = calculateDistance(
        newPosition[0], newPosition[1],
        optimalPath.path[optimalPath.path.length - 1][0], optimalPath.path[optimalPath.path.length - 1][1]
      );
      
      const timeEstimate = Math.ceil(distance * 111000 / 83.3 * 8);
      
      setOptimalPath({
        ...optimalPath,
        path: newPath,
        timeEstimate
      });
    } else if (index === optimalPath.path.length - 1) {
      // Last point (camera) moved - recalculate time
      const distance = calculateDistance(
        optimalPath.path[0][0], optimalPath.path[0][1],
        newPosition[0], newPosition[1]
      );
      
      const timeEstimate = Math.ceil(distance * 111000 / 83.3 * 8);
      
      setOptimalPath({
        ...optimalPath,
        path: newPath,
        timeEstimate
      });
    } else {
      // Middle point moved - simply update the path
      setOptimalPath({
        ...optimalPath,
        path: newPath
      });
    }
  };
  
  // Loading state
  if (!mounted || !leafletInstance) {
    return (
      <div className="h-full w-full bg-gray-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-16 w-16 bg-blue-500 rounded-full mb-4"></div>
          <div className="text-lg font-semibold">Loading map...</div>
        </div>
      </div>
    );
  }

  // Get current school data
  const schoolData = SCHOOL_LOCATIONS[selectedSchool as keyof typeof SCHOOL_LOCATIONS] || SCHOOL_LOCATIONS["Piedmont Hills High School"];
  const { center, zoom, cameras, accessPoints } = schoolData;

  // Custom icon creation function
  const createCustomIcon = (status: StatusType, isHighlighted: boolean) => {
    try {
      let iconColor;
      switch(status) {
        case 'HIGH':
          iconColor = '#ff3b30'; // Red
          break;
        case 'MEDIUM':
          iconColor = '#ff9500'; // Orange
          break;
        case 'LOW':
          iconColor = '#ffcc00'; // Yellow
          break;
        default:
          iconColor = '#34c759'; // Green
      }
      
      // Create a custom icon for the camera
      return leafletInstance.divIcon({
        className: `camera-marker-${status.toLowerCase()} ${isHighlighted ? 'camera-marker-highlighted' : ''}`,
        html: `<div style="
          background-color: ${iconColor}; 
          border: ${isHighlighted ? '3px solid #3b82f6' : '2px solid white'}; 
          border-radius: 50%; 
          width: ${isHighlighted ? '16px' : '12px'}; 
          height: ${isHighlighted ? '16px' : '12px'};
          box-shadow: ${isHighlighted ? '0 0 8px rgba(59, 130, 246, 0.8)' : '0 0 4px rgba(0,0,0,0.5)'};
          transform: ${isHighlighted ? 'scale(1.2)' : 'scale(1)'};
          transition: all 0.2s ease;"
        ></div>`,
        iconSize: [isHighlighted ? 16 : 12, isHighlighted ? 16 : 12],
        iconAnchor: [isHighlighted ? 8 : 6, isHighlighted ? 8 : 6],
        popupAnchor: [0, isHighlighted ? -10 : -8]
      });
    } catch (error) {
      console.error("Error creating custom icon:", error);
      // Return a fallback icon
      return new leafletInstance.Icon.Default();
    }
  };
  
  const createAccessPointIcon = () => {
    return leafletInstance.divIcon({
      className: 'access-point-marker',
      html: `<div style="
        background-color: #3b82f6;
        border: 2px solid white;
        border-radius: 50%;
        width: 10px;
        height: 10px;
        box-shadow: 0 0 4px rgba(0,0,0,0.5);
      "></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5]
    });
  };

  // Create a path point icon
  const createPathPointIcon = (isAccessPoint = false, isEndpoint = false) => {
    if (!leafletInstance) return null;
    
    return leafletInstance.divIcon({
      className: '',
      html: `<div style="
        background-color: ${isAccessPoint ? '#3b82f6' : (isEndpoint ? '#f43f5e' : '#6366f1')}; 
        border: 2px solid white;
        border-radius: 50%;
        width: ${isAccessPoint || isEndpoint ? '12px' : '10px'};
        height: ${isAccessPoint || isEndpoint ? '12px' : '10px'};
        box-shadow: 0 0 8px rgba(0,0,0,0.3);
        cursor: grab;
        transition: transform 0.2s ease;
      "></div>`,
      iconSize: [isAccessPoint || isEndpoint ? 12 : 10, isAccessPoint || isEndpoint ? 12 : 10],
      iconAnchor: [isAccessPoint || isEndpoint ? 6 : 5, isAccessPoint || isEndpoint ? 6 : 5]
    });
  };

  return (
    <div className="w-full h-full relative">
      {/* Add CSS styles */}
      <style dangerouslySetInnerHTML={{ __html: mapStyles }} />
      
      <MapContainer
        key={mapKey}
        center={center}
        zoom={zoom}
        minZoom={10}
        maxZoom={19}
        style={{ height: '100%', width: '100%', backgroundColor: 'white' }}
        zoomControl={false}
        attributionControl={false}
        className="rounded-xl shadow-lg"
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          url="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxNativeZoom={19}
          maxZoom={19}
        />
        
        {/* Camera markers - removed popup and using new click handler */}
        {cameras.map((camera) => (
          <Marker 
            key={camera.id}
            position={camera.position}
            eventHandlers={{
              click: () => onMarkerClick(camera.id)
            }}
            icon={createCustomIcon(camera.status, camera.id === highlightedCamera)}
          />
        ))}
        
        {/* Access point markers - keep popup for these as they're informational only */}
        {accessPoints?.map((accessPoint) => (
          <Marker
            key={accessPoint.id}
            position={accessPoint.position}
            icon={createAccessPointIcon()}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-xs mb-1">{accessPoint.name}</h3>
                <div className="text-xs text-gray-600">Emergency Access Point</div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Response path visualization with draggable points */}
        {optimalPath && !mapError && (
          <>
            <Polyline 
              positions={optimalPath.path}
              pathOptions={{ 
                color: '#3b82f6', 
                weight: 4,
                dashArray: '10, 5',
                className: 'response-path' 
              }}
            />
            
            {/* Draggable markers for path points */}
            {optimalPath.path.map((point, index) => (
              <DraggableMarker
                key={`path-point-${index}`}
                position={point}
                index={index}
                onDragEnd={handlePathPointDrag}
                icon={createPathPointIcon(
                  index === 0, // is access point 
                  index === optimalPath.path.length - 1 // is endpoint
                )}
              />
            ))}
            
            {/* Time estimate label */}
            {optimalPath.path.length >= 2 && (
              <Marker
                position={optimalPath.path[Math.floor(optimalPath.path.length / 2)]}
                icon={leafletInstance.divIcon({
                  className: 'time-label',
                  html: `<div style="
                    background-color: white; 
                    color: #3b82f6;
                    padding: 3px 6px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: bold;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                    text-align: center;
                    border: none;
                  ">
                    ${formatTimeEstimate(optimalPath.timeEstimate)}
                  </div>`,
                  iconSize: [60, 20],
                  iconAnchor: [30, 10]
                })}
              />
            )}
          </>
        )}
      </MapContainer>
      
      {/* Error message display */}
      {mapError && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow-md z-50">
          <p className="text-sm">{mapError}</p>
          <button 
            className="mt-1 text-xs text-blue-600 hover:text-blue-800"
            onClick={() => {
              setMapError(null);
              setMapKey(Date.now()); // Force map re-render
            }}
          >
            Reload Map
          </button>
        </div>
      )}
      
      {/* Map controls overlay */}
      <div 
        className="absolute top-4 right-4 z-10 bg-white shadow-lg rounded-lg p-1.5 flex space-x-2"
      >
        <button 
          onClick={() => setShowTools(!showTools)}
          className="p-1.5 text-gray-700 hover:text-blue-500 transition-colors rounded-full hover:bg-blue-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        
        {showTools && (
          <>
            <div className="w-px h-6 self-center bg-gray-200"></div>
            <button className="p-1.5 text-gray-700 hover:text-blue-500 transition-colors rounded-full hover:bg-blue-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button className="p-1.5 text-gray-700 hover:text-blue-500 transition-colors rounded-full hover:bg-blue-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <div className="w-px h-6 self-center bg-gray-200"></div>
            <button className="p-1.5 text-gray-700 hover:text-blue-500 transition-colors rounded-full hover:bg-blue-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MapView;
