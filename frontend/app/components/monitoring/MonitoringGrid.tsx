'use client';

import { useState } from 'react';
import VideoFeed from './VideoFeed';

// Define feed types
interface BaseFeed {
  id: number;
  name: string;
  source: 'webcam' | 'upload' | 'stream';
}

interface WebcamFeed extends BaseFeed {
  source: 'webcam';
}

interface UploadFeed extends BaseFeed {
  source: 'upload';
  file: string;
}

interface StreamFeed extends BaseFeed {
  source: 'stream';
  streamUrl: string;
}

type Feed = WebcamFeed | UploadFeed | StreamFeed;

// Sample video feeds for demonstration
const DEFAULT_FEEDS: Feed[] = [
  { id: 1, name: 'Main Entrance', source: 'webcam' },
  { id: 2, name: 'North Hallway', source: 'webcam' },
  { id: 3, name: 'Cafeteria', source: 'webcam' },
  { id: 4, name: 'Gymnasium', source: 'webcam' },
  { id: 5, name: 'Library', source: 'webcam' },
  { id: 6, name: 'Parking Lot', source: 'webcam' },
];

const MonitoringGrid = () => {
  const [feeds, setFeeds] = useState<Feed[]>(DEFAULT_FEEDS);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [uploadOpen, setUploadOpen] = useState(false);

  const handleFrameCapture = (feedId: number, imageData: string) => {
    // In a real implementation, this would send the frame to the backend for analysis
    console.log(`Captured frame from feed ${feedId}`);
    
    // Here we could send the image to our API endpoint
    /*
    fetch('http://localhost:5000/api/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageData }),
    })
      .then(response => response.json())
      .then(data => {
        // Handle threat detection results
        if (data.threats && data.threats.length > 0) {
          console.log('Threats detected:', data.threats);
        }
      })
      .catch(error => {
        console.error('Error analyzing frame:', error);
      });
    */
  };

  const handleAddFeed = () => {
    setUploadOpen(true);
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newFeed: UploadFeed = {
        id: feeds.length + 1,
        name: `Uploaded Video ${feeds.length + 1}`,
        source: 'upload',
        file: URL.createObjectURL(file),
      };
      
      setFeeds([...feeds, newFeed]);
      setUploadOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Video Monitoring</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setLayout('grid')}
            className={`px-3 py-1 rounded ${layout === 'grid' ? 'bg-slate-800 text-white' : 'bg-gray-200'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setLayout('list')}
            className={`px-3 py-1 rounded ${layout === 'list' ? 'bg-slate-800 text-white' : 'bg-gray-200'}`}
          >
            List
          </button>
          <button
            onClick={handleAddFeed}
            className="px-3 py-1 rounded bg-red-500 text-white"
          >
            Add Feed
          </button>
        </div>
      </div>

      {uploadOpen && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="font-medium mb-4">Upload Video File</h3>
          <input
            type="file"
            accept="video/*"
            onChange={handleUploadFile}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-red-50 file:text-red-700
              hover:file:bg-red-100"
          />
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setUploadOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className={`grid ${layout === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
        {feeds.map((feed) => (
          <VideoFeed
            key={feed.id}
            name={feed.name}
            source={feed.source}
            streamUrl={feed.source === 'upload' ? feed.file : feed.source === 'stream' ? feed.streamUrl : undefined}
            onFrame={(imageData) => handleFrameCapture(feed.id, imageData)}
          />
        ))}
      </div>
    </div>
  );
};

export default MonitoringGrid;
