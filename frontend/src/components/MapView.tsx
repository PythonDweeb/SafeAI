'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
// Import Leaflet types but not the actual library on server
import type { LatLngTuple, Marker as LeafletMarker, DivIcon } from 'leaflet';
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

// Extend DraggableMarker to accept additional event handlers
const DraggableMarker = ({
  position,
  id,
  onDragEnd,
  icon,
  children,
  eventHandlers: extraEventHandlers = {}
}: {
  position: LatLngTuple,
  id: string,
  onDragEnd: (id: string, position: LatLngTuple) => void,
  icon: any,
  children?: React.ReactNode,
  eventHandlers?: any,
}) => {
  const [markerPosition, setMarkerPosition] = useState<LatLngTuple>(position);
  const markerRef = useRef<LeafletMarker>(null);

  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);

  const defaultHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const newPos = [marker.getLatLng().lat, marker.getLatLng().lng] as LatLngTuple;
        setMarkerPosition(newPos);
        onDragEnd(id, newPos);
      }
    },
  };

  // Merge any extra event handlers (e.g., click) with the default dragend handler.
  const mergedHandlers = { ...defaultHandlers, ...extraEventHandlers };

  return (
    <Marker
      draggable={true}
      eventHandlers={mergedHandlers}
      position={markerPosition}
      ref={markerRef}
      icon={icon}
    >
      {children}
    </Marker>
  );
};

// Define allowed status types
type StatusType = 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL';

// School coordinates and camera positions
const SCHOOL_LOCATIONS = {
  "Piedmont Hills High School": {
    center: [37.4024, -121.8501] as LatLngTuple,
    zoom: 17,
    cameras: [
      { id: 'phhs-cam1', position: [37.4027, -121.8503] as LatLngTuple, name: 'Main Entrance', status: 'NORMAL' as StatusType, location: 'Piedmont Hills HS - Main Building', lastUpdate: new Date().toISOString() },
      { id: 'phhs-cam2', position: [37.4020, -121.8498] as LatLngTuple, name: 'Gymnasium', status: 'NORMAL' as StatusType, location: 'Piedmont Hills HS - Gym', lastUpdate: new Date().toISOString() },
      { id: 'phhs-cam3', position: [37.4029, -121.8495] as LatLngTuple, name: 'Parking Lot', status: 'NORMAL' as StatusType, location: 'Piedmont Hills HS - North Lot', lastUpdate: new Date().toISOString() },
      { id: 'phhs-cam4', position: [37.4025, -121.8508] as LatLngTuple, name: 'Science Building', status: 'NORMAL' as StatusType, location: 'Piedmont Hills HS - Science Wing', lastUpdate: new Date().toISOString() },
      { id: 'phhs-cam5', position: [37.4022, -121.8492] as LatLngTuple, name: 'Cafeteria', status: 'NORMAL' as StatusType, location: 'Piedmont Hills HS - Cafeteria', lastUpdate: new Date().toISOString() },
      { id: 'phhs-cam6', position: [37.4018, -121.8505] as LatLngTuple, name: 'Library', status: 'NORMAL' as StatusType, location: 'Piedmont Hills HS - Library', lastUpdate: new Date().toISOString() },
    ],
    accessPoints: [
      { id: 'phhs-access1', position: [37.4035, -121.8510] as LatLngTuple, name: 'North Entrance' },
      { id: 'phhs-access2', position: [37.4015, -121.8490] as LatLngTuple, name: 'South Entrance' },
      { id: 'phhs-access3', position: [37.402828, -121.852601] as LatLngTuple, name: 'West Entrance' },
    ]
  },
  "Los Altos High School": {
    center: [37.386251, -122.107931] as LatLngTuple,
    zoom: 17,
    cameras: [
      { id: 'lahs-cam1', position: [37.386451, -122.107731] as LatLngTuple, name: 'Main Entrance', status: 'NORMAL' as StatusType, location: 'Los Altos HS - Main Building', lastUpdate: new Date().toISOString() },
      { id: 'lahs-cam2', position: [37.386051, -122.108231] as LatLngTuple, name: 'Gymnasium', status: 'NORMAL' as StatusType, location: 'Los Altos HS - Gym', lastUpdate: new Date().toISOString() },
      { id: 'lahs-cam3', position: [37.385851, -122.107631] as LatLngTuple, name: 'Parking Lot', status: 'NORMAL' as StatusType, location: 'Los Altos HS - East Lot', lastUpdate: new Date().toISOString() },
      { id: 'lahs-cam4', position: [37.386351, -122.108431] as LatLngTuple, name: 'Science Building', status: 'NORMAL' as StatusType, location: 'Los Altos HS - Science Wing', lastUpdate: new Date().toISOString() },
      { id: 'lahs-cam5', position: [37.386751, -122.107831] as LatLngTuple, name: 'Cafeteria', status: 'NORMAL' as StatusType, location: 'Los Altos HS - Cafeteria', lastUpdate: new Date().toISOString() },
      { id: 'lahs-cam6', position: [37.386051, -122.107331] as LatLngTuple, name: 'Football Field', status: 'NORMAL' as StatusType, location: 'Los Altos HS - Athletic Field', lastUpdate: new Date().toISOString() },
    ],
    accessPoints: [
      { id: 'lahs-access1', position: [37.387275, -122.107373] as LatLngTuple, name: 'North Entrance' },
      { id: 'lahs-access2', position: [37.385040, -122.107934] as LatLngTuple, name: 'South Entrance' },
      { id: 'lahs-access3', position: [37.385319, -122.110007] as LatLngTuple, name: 'West Entrance' },
    ]
  }
};

// Define available tile layers with zoom levels
const TILE_LAYERS = {
  street: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxNativeZoom: 19,
    maxZoom: 20
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxNativeZoom: 19,
    maxZoom: 20
  },
  terrain: { // Using ESRI World Topographic Map
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution:
      'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
    maxNativeZoom: 19,
    maxZoom: 20
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxNativeZoom: 19,
    maxZoom: 20
  }
};

// Define Camera interface
interface Camera {
  id: string;
  name: string;
  location: string;
  status: StatusType;
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
  selectedSchool: string;
  onMarkerClick: (cameraId: string) => void;
  highlightedCamera: string | null;
  cameraAssignments: Record<string, string | null>;
  cameraStatuses: Record<string, StatusType>;
  onViewCameraClick: (cameraId: string) => void;
}

// CSS for map components
const mapStyles = `
.leaflet-container { z-index: 1 !important; font-family: 'Inter', sans-serif; }
.status-high { background-color: #ff3b30; color: white; }
.status-medium { background-color: #ff9500; color: white; }
.status-low { background-color: #ffcc00; color: #333; }
.status-normal { background-color: #34c759; color: white; }
.camera-marker { border-radius: 50%; transition: all 0.2s ease; opacity: 0.9; box-shadow: 0 1px 3px rgba(0,0,0,0.4); }
.camera-marker-highlighted { transform: scale(1.4); box-shadow: 0 0 10px rgba(59, 130, 246, 0.7), 0 0 15px rgba(59, 130, 246, 0.5); z-index: 1000 !important; opacity: 1; }
.access-point-marker { background-color: #3b82f6; border: 2px solid white; border-radius: 50%; box-shadow: 0 1px 4px rgba(0,0,0,0.5); transition: all 0.2s ease; cursor: grab; }
.path-point-marker { border: 1px solid white; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.4); transition: all 0.2s ease; cursor: grab; }
.response-path { stroke: #3b82f6; stroke-width: 3; stroke-dasharray: 10, 5; animation: dash 1.5s linear infinite; filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.5)); }
@keyframes dash { to { stroke-dashoffset: -15; } }
.time-label { background-color: white; color: #3b82f6; font-size: 10px; font-weight: bold; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: grab; }
.draggable-time-label { z-index: 1001 !important; }
.leaflet-control-zoom { border-radius: 8px !important; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important; }
.leaflet-control-zoom a { background-color: white !important; color: #555 !important; }
.leaflet-control-zoom a:hover { background-color: #f8f9fa !important; color: #333 !important; }
`;

interface OptimalPath {
  path: LatLngTuple[];
  timeEstimate: number;
  startAccessPointId: string;
}

const MapView: React.FC<MapViewProps> = ({
  selectedSchool,
  onMarkerClick,
  highlightedCamera,
  cameraAssignments,
  cameraStatuses,
  onViewCameraClick
}) => {
  const [mounted, setMounted] = useState(false);
  const [mapKey, setMapKey] = useState<number>(Date.now());
  const [leafletInstance, setLeafletInstance] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [optimalPath, setOptimalPath] = useState<OptimalPath | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [currentAccessPoints, setCurrentAccessPoints] = useState<AccessPoint[]>([]);
  const [selectedLayerKey, setSelectedLayerKey] = useState<keyof typeof TILE_LAYERS>('street');
  const [cameraPositions, setCameraPositions] = useState<Camera[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then(L => {
        setLeafletInstance(L.default);
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
        });
      });
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      setMapKey(Date.now());
      setSelectedCamera(null);
      setOptimalPath(null);
      setMapError(null);
      const schoolData = SCHOOL_LOCATIONS[selectedSchool as keyof typeof SCHOOL_LOCATIONS];
      if (schoolData) {
        setCameraPositions(schoolData.cameras);
        if (schoolData.accessPoints) {
          setCurrentAccessPoints(JSON.parse(JSON.stringify(schoolData.accessPoints)));
        } else {
          setCurrentAccessPoints([]);
        }
      }
    }
  }, [selectedSchool, mounted]);

  useEffect(() => {
    if (mounted && leafletInstance) {
      if (!highlightedCamera) {
        setSelectedCamera(null);
        setOptimalPath(null);
        return;
      }
      const camera = cameraPositions.find(cam => cam.id === highlightedCamera);
      if (camera) {
        setOptimalPath(null);
        setSelectedCamera(camera);
        try {
          findOptimalPath(camera);
        } catch (error) {
          console.error("Error finding optimal path:", error);
          setMapError("Could not calculate response path");
        }
      }
    }
  }, [highlightedCamera, selectedSchool, mounted, leafletInstance, currentAccessPoints, cameraPositions]);

  // Add direct event listener for camera status changes
  useEffect(() => {
    if (!mounted) return;
    
    // Listen for camera status changes directly
    const handleStatusChange = (event: CustomEvent<{ cameraId: string; status: 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW' }>) => {
      const { cameraId, status } = event.detail;
      // Force map to update when camera status changes
      if (cameraPositions.some(cam => cam.id === cameraId)) {
        console.log(`MapView: Camera ${cameraId} status updated to ${status}`);
        // Force a re-render by updating the map key
        if (map) {
          map.invalidateSize();
        }
      }
    };

    window.addEventListener('cameraStatusChanged', handleStatusChange as EventListener);
    return () => {
      window.removeEventListener('cameraStatusChanged', handleStatusChange as EventListener);
    };
  }, [mounted, cameraPositions, map]);

  // New effect: When the selected map type changes, force the map to recalc its dimensions.
  useEffect(() => {
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
        window.dispatchEvent(new Event('resize'));
      }, 300);
    }
  }, [selectedLayerKey, map]);

  const handleCameraDragEnd = (id: string, newPos: LatLngTuple) => {
    setCameraPositions(prevCameras =>
      prevCameras.map(camera => camera.id === id ? { ...camera, position: newPos } : camera)
    );
  };

  const findOptimalPath = (camera: Camera) => {
    try {
      if (!leafletInstance || currentAccessPoints.length === 0) return;
      let nearestAccessPoint = currentAccessPoints[0];
      let shortestDistance = calculateHaversineDistance(
        camera.position[0],
        camera.position[1],
        nearestAccessPoint.position[0],
        nearestAccessPoint.position[1]
      );
      currentAccessPoints.forEach(accessPoint => {
        const distance = calculateHaversineDistance(
          camera.position[0],
          camera.position[1],
          accessPoint.position[0],
          accessPoint.position[1]
        );
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestAccessPoint = accessPoint;
        }
      });
      const path = calculateDetailedPath(nearestAccessPoint.position, camera.position);
      const timeEstimate = Math.ceil(shortestDistance * 1000 / 1.4);
      setOptimalPath({ path, timeEstimate, startAccessPointId: nearestAccessPoint.id });
    } catch (error) {
      console.error("Error in findOptimalPath:", error);
      setMapError("Error calculating response path");
    }
  };

  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const toRad = (v: number) => v * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateTotalPathDistance = (path: LatLngTuple[]): number => {
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      totalDistance += calculateHaversineDistance(
        path[i][0],
        path[i][1],
        path[i + 1][0],
        path[i + 1][1]
      );
    }
    return totalDistance;
  };

  const createCustomIcon = (cameraId: string, isHighlighted: boolean): DivIcon | undefined => {
    if (!leafletInstance) return undefined;
    try {
      const status = cameraStatuses[cameraId];
      let iconColor = '#34c759';
      if (status && status !== 'NORMAL') {
        switch (status) {
          case 'HIGH': iconColor = '#ff3b30'; break;
          case 'MEDIUM': iconColor = '#ff9500'; break;
          case 'LOW': iconColor = '#ffcc00'; break;
        }
      }
      return leafletInstance.divIcon({
        className: `camera-marker ${isHighlighted ? 'camera-marker-highlighted' : ''}`,
        html: `<div style="background-color: ${iconColor}; border: ${isHighlighted ? '3px solid #3b82f6' : '2px solid white'}; border-radius: 50%; width: ${isHighlighted ? '16px' : '12px'}; height: ${isHighlighted ? '16px' : '12px'}; pointer-events: auto;"></div>`,
        iconSize: [isHighlighted ? 16 : 12, isHighlighted ? 16 : 12],
        iconAnchor: [isHighlighted ? 8 : 6, isHighlighted ? 8 : 6],
        popupAnchor: [0, isHighlighted ? -10 : -8]
      });
    } catch (error) {
      console.error("Error creating custom icon:", error);
      return new leafletInstance.Icon.Default();
    }
  };

  const calculateDetailedPath = (start: LatLngTuple, end: LatLngTuple): LatLngTuple[] => {
    const result: LatLngTuple[] = [start];
    const numPoints = 3;
    for (let i = 1; i <= numPoints; i++) {
      const fraction = i / (numPoints + 1);
      const lat = start[0] + (end[0] - start[0]) * fraction;
      const lng = start[1] + (end[1] - start[1]) * fraction;
      const randomOffset = 0.0001;
      const randomLat = lat + (Math.random() - 0.5) * randomOffset;
      const randomLng = lng + (Math.random() - 0.5) * randomOffset;
      result.push([randomLat, randomLng]);
    }
    result.push(end);
    return result;
  };

  const handlePathPointDrag = (id: string, newPosition: LatLngTuple) => {
    if (!optimalPath) return;
    const index = parseInt(id.split('-').pop() || '0', 10);
    if (isNaN(index)) {
      console.error("Could not parse index from path point ID:", id);
      return;
    }
    const newPath = [...optimalPath.path];
    newPath[index] = newPosition;
    const totalDistance = calculateTotalPathDistance(newPath);
    const newTimeEstimate = Math.ceil(totalDistance * 1000 / 1.4);
    setOptimalPath({ ...optimalPath, path: newPath, timeEstimate: newTimeEstimate });
  };

  const handleAccessPointDrag = (id: string, newPosition: LatLngTuple) => {
    setCurrentAccessPoints(prevPoints => prevPoints.map(point => point.id === id ? { ...point, position: newPosition } : point));
    if (optimalPath && selectedCamera && optimalPath.startAccessPointId === id) {
      findOptimalPath(selectedCamera);
    }
  };

  const formatTimeEstimate = (seconds: number) => {
    if (seconds < 60) return `${seconds} sec`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds === 0 ? `${minutes} min` : `${minutes}m ${remainingSeconds}s`;
  };

  const cleanupPath = () => {
    setOptimalPath(null);
    setMapError(null);
  };

  const handleMarkerClick = (cameraId: string) => {
    cleanupPath();
    onMarkerClick(cameraId);
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
        window.dispatchEvent(new Event('resize'));
      }, 300);
    }
  };

  const createAccessPointIcon = (): DivIcon | undefined => {
    if (!leafletInstance) return undefined;
    return leafletInstance.divIcon({
      className: 'access-point-marker',
      html: `<div style="background-color: #3b82f6; border: 2px solid white; border-radius: 50%; width: 12px; height: 12px;"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
      popupAnchor: [0, -8]
    });
  };

  const createPathPointIcon = (isAccessPoint = false, isEndpoint = false): DivIcon | undefined => {
    if (!leafletInstance) return undefined;
    const size = isAccessPoint || isEndpoint ? 12 : 8;
    const color = isAccessPoint ? '#3b82f6' : (isEndpoint ? '#10b981' : '#a855f7');
    const intermediateStyle = !isAccessPoint && !isEndpoint ? 'box-shadow: 0 0 6px rgba(168, 85, 247, 0.7), 0 0 10px rgba(168, 85, 247, 0.5);' : '';
    return leafletInstance.divIcon({
      className: `path-point-marker ${isAccessPoint ? 'path-start' : ''} ${isEndpoint ? 'path-end' : ''}`,
      html: `<div style="background-color: ${color}; border: 1px solid white; border-radius: 50%; width: ${size}px; height: ${size}px; ${intermediateStyle}"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  };

  if (!mounted || !leafletInstance) {
    return (
      <div className="h-full w-full bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading Map...</p>
      </div>
    );
  }

  const schoolData = SCHOOL_LOCATIONS[selectedSchool as keyof typeof SCHOOL_LOCATIONS] || SCHOOL_LOCATIONS["Piedmont Hills High School"];
  const accessPoints = currentAccessPoints || [];

  return (
    <div className="w-full h-full relative" ref={mapContainerRef}>
      <style jsx global>{mapStyles}</style>
      <MapContainer
        key={mapKey}
        center={schoolData.center}
        zoom={schoolData.zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        scrollWheelZoom={true}
        maxZoom={TILE_LAYERS[selectedLayerKey].maxZoom}
        ref={(mapRef) => {
          if (mapRef) {
            setMap(mapRef);
          }
        }}
      >
        <TileLayer
          key={selectedLayerKey}
          attribution={TILE_LAYERS[selectedLayerKey].attribution}
          url={TILE_LAYERS[selectedLayerKey].url}
          maxNativeZoom={TILE_LAYERS[selectedLayerKey].maxNativeZoom}
          maxZoom={TILE_LAYERS[selectedLayerKey].maxZoom}
          crossOrigin=""
        />
        <ZoomControl position="topright" />

        {/* Render Camera Markers as draggable */}
        {cameraPositions.map((camera) => (
          <DraggableMarker
            key={camera.id}
            id={camera.id}
            position={camera.position}
            onDragEnd={handleCameraDragEnd}
            icon={createCustomIcon(camera.id, highlightedCamera === camera.id)}
            eventHandlers={{ click: () => handleMarkerClick(camera.id) }}
          />
        ))}

        {accessPoints.map((accessPoint) => (
          <DraggableMarker
            key={accessPoint.id}
            id={accessPoint.id}
            position={accessPoint.position}
            onDragEnd={handleAccessPointDrag}
            icon={createAccessPointIcon()}
          />
        ))}

        {optimalPath && (
          <>
            <Polyline positions={optimalPath.path} className="response-path" />
            {optimalPath.path.map((point, index) => {
              if (index === 0) return null;
              const isMiddlePoint = index === Math.floor(optimalPath.path.length / 2);
              const markerIcon = isMiddlePoint && optimalPath.path.length >= 2
                ? leafletInstance.divIcon({
                    className: 'time-label draggable-time-label',
                    html: `<div style="background-color: white; color: #3b82f6; padding: 3px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; text-align: center; border: none;">${formatTimeEstimate(optimalPath.timeEstimate)}</div>`,
                    iconSize: [60, 20],
                    iconAnchor: [30, 10]
                  })
                : createPathPointIcon(false, index === optimalPath.path.length - 1);
              if (!markerIcon) return null;
              return (
                <DraggableMarker
                  key={`path-point-${index}`}
                  position={point}
                  id={`path-point-${index}`}
                  onDragEnd={handlePathPointDrag}
                  icon={markerIcon}
                />
              );
            })}
          </>
        )}
      </MapContainer>

      {mapError && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow-md z-50">
          <p className="text-sm">{mapError}</p>
          <button
            className="mt-1 text-xs text-blue-600 hover:text-blue-800"
            onClick={() => { setMapError(null); setMapKey(Date.now()); }}
          >
            Reload Map
          </button>
        </div>
      )}

      <div className="absolute top-4 left-4 z-[1000] bg-white shadow-lg rounded-md p-1 flex flex-col space-y-1">
        {(Object.keys(TILE_LAYERS) as Array<keyof typeof TILE_LAYERS>).map((key) => (
          <button
            key={key}
            onClick={() => setSelectedLayerKey(key)}
            className={`px-2 py-1 text-xs rounded transition-colors ${selectedLayerKey === key ? 'bg-blue-500 text-white font-semibold' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            style={{ textTransform: 'capitalize' }}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MapView;
