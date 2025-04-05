'use client';

import { useState } from 'react';
import Layout from '../components/layout/Layout';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('week');
  
  // Mock data for analytics
  const alertsByDay = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'High Priority',
        data: [1, 0, 2, 1, 0, 0, 1],
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
      },
      {
        label: 'Medium Priority',
        data: [2, 1, 3, 2, 1, 0, 2],
        backgroundColor: 'rgba(245, 158, 11, 0.5)',
      },
      {
        label: 'Low Priority',
        data: [3, 2, 1, 4, 3, 1, 3],
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
      },
    ],
  };
  
  const responseTimes = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Average Response Time (seconds)',
        data: [42, 38, 45, 35, 40, 50, 42],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.3,
      },
    ],
  };
  
  const threatTypes = {
    labels: ['Weapon Detected', 'Suspicious Behavior', 'Unauthorized Access', 'Other'],
    datasets: [
      {
        data: [5, 12, 8, 3],
        backgroundColor: [
          'rgba(239, 68, 68, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(107, 114, 128, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const alertLocations = {
    labels: ['Main Entrance', 'Hallways', 'Cafeteria', 'Gymnasium', 'Classrooms', 'Other'],
    datasets: [
      {
        label: 'Number of Alerts',
        data: [8, 15, 5, 3, 10, 7],
        backgroundColor: 'rgba(79, 70, 229, 0.6)',
      },
    ],
  };
  
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Security Analytics</h2>
          
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setTimeRange('day')}
              className={`px-4 py-2 ${timeRange === 'day' ? 'bg-slate-800 text-white' : 'bg-white'}`}
            >
              Day
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 ${timeRange === 'week' ? 'bg-slate-800 text-white' : 'bg-white'}`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 ${timeRange === 'month' ? 'bg-slate-800 text-white' : 'bg-white'}`}
            >
              Month
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts by Day */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Alerts by Day</h3>
            <div className="h-80">
              <Bar options={options} data={alertsByDay} />
            </div>
          </div>
          
          {/* Response Times */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Response Times</h3>
            <div className="h-80">
              <Line options={options} data={responseTimes} />
            </div>
          </div>
          
          {/* Threat Types */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Threat Types</h3>
            <div className="h-80 flex items-center justify-center">
              <div className="w-64">
                <Doughnut data={threatTypes} />
              </div>
            </div>
          </div>
          
          {/* Alert Locations */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Alert Locations</h3>
            <div className="h-80">
              <Bar options={options} data={alertLocations} />
            </div>
          </div>
        </div>
        
        {/* Summary statistics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Security Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Alerts</p>
              <p className="text-3xl font-bold mt-1">28</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Average Response Time</p>
              <p className="text-3xl font-bold mt-1">42s</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">High Priority Alerts</p>
              <p className="text-3xl font-bold mt-1 text-red-600">5</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Currently Active</p>
              <p className="text-3xl font-bold mt-1">2</p>
            </div>
          </div>
        </div>
        
        {/* Export options */}
        <div className="flex justify-end space-x-4">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
            Export as PDF
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
            Export as CSV
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;
