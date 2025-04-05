'use client';

import { useState, useEffect } from 'react';
import StatCard from './StatCard';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  VideoCameraIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

// Define the Alert type
interface Alert {
  id: number;
  type: string;
  location: string;
  timestamp: string;
  status: string;
  severity: string;
}

const DashboardOverview = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data for demo
  const securityStatus = {
    campusStatus: 'Secure',
    activeAlerts: 2,
    activeStreams: 8,
    monitoredAreas: 12
  };

  // Mock chart data
  const doughnutData = {
    labels: ['Secure', 'Warning', 'Alert'],
    datasets: [
      {
        data: [70, 20, 10],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderWidth: 0,
      },
    ],
  };

  const lineData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Alerts',
        data: [0, 1, 0, 3, 2, 0, 1],
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Weekly Alert Trends',
      },
    },
  };

  useEffect(() => {
    // In a real implementation, we would fetch alerts from the API
    // For now, we'll use mock data
    setLoading(true);
    
    // Simulate API request
    setTimeout(() => {
      setAlerts([
        {
          id: 1,
          type: 'Potential Weapon',
          location: 'Building A, North Wing',
          timestamp: new Date().toISOString(),
          status: 'Active',
          severity: 'High'
        },
        {
          id: 2,
          type: 'Suspicious Behavior',
          location: 'Main Entrance',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          status: 'Under Review',
          severity: 'Medium'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Campus Status" 
          value={securityStatus.campusStatus} 
          icon={<ShieldCheckIcon className="h-5 w-5" />}
          color="bg-green-500"
        />
        <StatCard 
          title="Active Alerts" 
          value={securityStatus.activeAlerts} 
          icon={<ExclamationTriangleIcon className="h-5 w-5" />}
          color="bg-red-500"
        />
        <StatCard 
          title="Active Streams" 
          value={securityStatus.activeStreams} 
          icon={<VideoCameraIcon className="h-5 w-5" />}
          color="bg-blue-500"
        />
        <StatCard 
          title="Monitored Areas" 
          value={securityStatus.monitoredAreas} 
          icon={<BuildingLibraryIcon className="h-5 w-5" />}
          color="bg-purple-500"
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Security Status</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="w-64">
              <Doughnut data={doughnutData} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Alert Trends</h3>
          <div className="h-64">
            <Line options={lineOptions} data={lineData} />
          </div>
        </div>
      </div>
      
      {/* Recent Alerts */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Recent Alerts</h3>
          <button className="text-sm text-red-600 hover:text-red-800">View All</button>
        </div>
        
        {loading ? (
          <div className="text-center py-4">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No recent alerts</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {alerts.map((alert: Alert) => (
                  <tr key={alert.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{alert.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{alert.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${alert.status === 'Active' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;
