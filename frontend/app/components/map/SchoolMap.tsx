'use client';

import { useState, useEffect } from 'react';

// Mock data for map markers (would come from backend in real app)
interface MapMarker {
  id: number;
  x: number;
  y: number;
  type: 'alert' | 'camera' | 'entrance';
  label: string;
  level: 'low' | 'medium' | 'high';
  active: boolean;
}

const MOCK_MARKERS: MapMarker[] = [
  { id: 1, x: 150, y: 100, type: 'camera', label: 'Main Entrance Camera', level: 'low', active: true },
  { id: 2, x: 300, y: 200, type: 'camera', label: 'Hallway Camera', level: 'low', active: true },
  { id: 3, x: 450, y: 150, type: 'camera', label: 'Cafeteria Camera', level: 'low', active: true },
  { id: 4, x: 200, y: 350, type: 'alert', label: 'Potential Threat Detected', level: 'high', active: true },
  { id: 5, x: 350, y: 300, type: 'entrance', label: 'Side Entrance', level: 'low', active: true },
];

// In a real application, we would integrate with the Mappedin SDK here
// For this demo, we'll create a simplified map visualization
const SchoolMap = () => {
  const [markers, setMarkers] = useState<MapMarker[]>(MOCK_MARKERS);
  const [activeMarker, setActiveMarker] = useState<MapMarker | null>(null);
  const [currentFloor, setCurrentFloor] = useState(1);
  
  // Mock floors for the building
  const floors = [
    { id: 1, name: '1st Floor' },
    { id: 2, name: '2nd Floor' },
    { id: 3, name: '3rd Floor' },
  ];

  // Simulating a threat detection
  useEffect(() => {
    const interval = setInterval(() => {
      // 5% chance to add a new alert
      if (Math.random() < 0.05) {
        const newMarker: MapMarker = {
          id: Math.random() * 1000,
          x: Math.random() * 500,
          y: Math.random() * 400,
          type: 'alert',
          label: 'New Threat Detected',
          level: Math.random() < 0.3 ? 'high' : 'medium',
          active: true
        };
        
        setMarkers(prev => [...prev, newMarker]);
        
        // Remove the alert after 10 seconds
        setTimeout(() => {
          setMarkers(prev => prev.filter(m => m.id !== newMarker.id));
        }, 10000);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleMarkerClick = (marker: MapMarker) => {
    setActiveMarker(marker);
  };

  const handleFloorChange = (floorId: number) => {
    setCurrentFloor(floorId);
    // In a real app, we would load different map data based on the floor
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">School Building Map</h2>
        <div className="flex space-x-2">
          {floors.map(floor => (
            <button
              key={floor.id}
              onClick={() => handleFloorChange(floor.id)}
              className={`px-3 py-1 rounded ${
                currentFloor === floor.id ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              {floor.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="relative" style={{ height: '600px', background: '#f9f9f9' }}>
        {/* This is where the actual Mappedin SDK would be integrated */}
        {/* For now we'll use a simplified visualization */}
        <div className="absolute inset-0 p-4">
          {/* Simple building outline */}
          <div className="w-full h-full border-2 border-gray-400 bg-gray-50 relative">
            {/* Mock rooms */}
            <div className="absolute top-20 left-20 w-64 h-48 border border-gray-400 bg-white flex items-center justify-center">
              Main Office
            </div>
            <div className="absolute top-20 right-20 w-64 h-48 border border-gray-400 bg-white flex items-center justify-center">
              Gymnasium
            </div>
            <div className="absolute bottom-20 left-20 w-64 h-48 border border-gray-400 bg-white flex items-center justify-center">
              Cafeteria
            </div>
            <div className="absolute bottom-20 right-20 w-64 h-48 border border-gray-400 bg-white flex items-center justify-center">
              Library
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-48 border border-gray-400 bg-white flex items-center justify-center">
              Central Hallway
            </div>
            
            {/* Map markers */}
            {markers.map(marker => (
              <div
                key={marker.id}
                className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
                  marker.type === 'alert' ? 'animate-pulse' : ''
                }`}
                style={{ left: marker.x, top: marker.y }}
                onClick={() => handleMarkerClick(marker)}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    marker.type === 'alert' 
                      ? marker.level === 'high' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-yellow-500 text-white'
                      : marker.type === 'camera'
                        ? 'bg-blue-500 text-white'
                        : 'bg-green-500 text-white'
                  }`}
                >
                  {marker.type === 'alert' ? '!' : marker.type === 'camera' ? '🎥' : '🚪'}
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-xs font-medium bg-white px-2 py-1 rounded shadow whitespace-nowrap">
                  {marker.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Marker details panel */}
      {activeMarker && (
        <div className="p-4 border-t">
          <div className="flex justify-between">
            <h3 className="font-medium">{activeMarker.label}</h3>
            <button onClick={() => setActiveMarker(null)} className="text-gray-400 hover:text-gray-600">
              Close
            </button>
          </div>
          <div className="mt-2">
            <p><span className="font-medium">Type:</span> {activeMarker.type}</p>
            {activeMarker.type === 'alert' && (
              <p><span className="font-medium">Threat Level:</span> {activeMarker.level}</p>
            )}
            <div className="mt-2">
              <button className="px-3 py-1 bg-slate-800 text-white rounded text-sm">
                {activeMarker.type === 'alert' ? 'Respond to Threat' : 'View Camera Feed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolMap;
