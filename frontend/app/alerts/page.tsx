'use client';

import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';

interface Alert {
  id: string;
  type: string;
  location: string;
  timestamp: string;
  status: 'Active' | 'Under Review' | 'Resolved';
  severity: 'Low' | 'Medium' | 'High';
  details?: string;
  image?: string;
}

const AlertsPage = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // In a real implementation, this would fetch from the API
    // Simulating API request
    setTimeout(() => {
      setAlerts([
        {
          id: '1',
          type: 'Potential Weapon',
          location: 'Building A, North Wing',
          timestamp: new Date().toISOString(),
          status: 'Active',
          severity: 'High',
          details: 'Security cameras detected an object that may be a weapon. Security personnel have been dispatched to investigate.',
          image: 'https://via.placeholder.com/300x200?text=Camera+Feed+1'
        },
        {
          id: '2',
          type: 'Suspicious Behavior',
          location: 'Main Entrance',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          status: 'Under Review',
          severity: 'Medium',
          details: 'Unusual movement patterns detected near the main entrance. Security team is reviewing footage.',
          image: 'https://via.placeholder.com/300x200?text=Camera+Feed+2'
        },
        {
          id: '3',
          type: 'Unauthorized Access',
          location: 'East Wing, Room 104',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          status: 'Resolved',
          severity: 'Medium',
          details: 'Motion detected in a restricted area after hours. Security personnel confirmed it was maintenance staff.',
          image: 'https://via.placeholder.com/300x200?text=Camera+Feed+3'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => 
        filter === 'active' 
          ? alert.status === 'Active' 
          : filter === 'high' 
            ? alert.severity === 'High' 
            : alert.status === 'Resolved'
      );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Security Alerts</h2>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => setFilter('all')} 
              className={`px-3 py-1 rounded-md text-sm ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-gray-200'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('active')} 
              className={`px-3 py-1 rounded-md text-sm ${filter === 'active' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
            >
              Active
            </button>
            <button 
              onClick={() => setFilter('high')} 
              className={`px-3 py-1 rounded-md text-sm ${filter === 'high' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}
            >
              High Priority
            </button>
            <button 
              onClick={() => setFilter('resolved')} 
              className={`px-3 py-1 rounded-md text-sm ${filter === 'resolved' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
            >
              Resolved
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading alerts...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No alerts match your current filter.</p>
            {filter !== 'all' && (
              <button 
                onClick={() => setFilter('all')}
                className="mt-4 text-blue-600 hover:underline"
              >
                View all alerts
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAlerts.map((alert) => (
                      <tr 
                        key={alert.id} 
                        className={`${selectedAlert?.id === alert.id ? 'bg-blue-50' : ''} cursor-pointer hover:bg-gray-50`}
                        onClick={() => setSelectedAlert(alert)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{alert.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${alert.status === 'Active' ? 'bg-red-100 text-red-800' : 
                              alert.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-green-100 text-green-800'}`}>
                            {alert.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${alert.severity === 'High' ? 'bg-red-100 text-red-800' : 
                              alert.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-green-100 text-green-800'}`}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            className="text-blue-600 hover:text-blue-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAlert(alert);
                            }}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              {selectedAlert ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold">{selectedAlert.type}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                      ${selectedAlert.severity === 'High' ? 'bg-red-100 text-red-800' : 
                        selectedAlert.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {selectedAlert.severity} Priority
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Location:</span> {selectedAlert.location}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Time:</span> {new Date(selectedAlert.timestamp).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Status:</span> {selectedAlert.status}
                  </p>
                  
                  {selectedAlert.image && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Camera Feed:</p>
                      <img 
                        src={selectedAlert.image} 
                        alt="Alert Camera Feed" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  {selectedAlert.details && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-1">Details:</p>
                      <p className="text-sm text-gray-600">{selectedAlert.details}</p>
                    </div>
                  )}
                  
                  <div className="mt-6 flex justify-between">
                    <button className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700">
                      Respond to Alert
                    </button>
                    
                    {selectedAlert.status !== 'Resolved' && (
                      <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                        Mark as Resolved
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-500">Select an alert to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AlertsPage;
