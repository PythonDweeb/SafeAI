'use client';

import Layout from '../components/layout/Layout';
import SchoolMap from '../components/map/SchoolMap';

const MapPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Interactive Building Map</h2>
        <p className="text-gray-600">View real-time threat monitoring and camera locations across the campus.</p>
        
        <SchoolMap />
      </div>
    </Layout>
  );
};

export default MapPage;
