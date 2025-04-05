'use client';

import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
  color?: string;
}

const StatCard = ({ 
  title, 
  value, 
  change, 
  trend = 'neutral',
  icon,
  color = 'bg-blue-500'
}: StatCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        {icon && (
          <div className={`${color} text-white p-2 rounded-lg`}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change && (
          <p className={`ml-2 text-sm ${
            trend === 'up' 
              ? 'text-green-600' 
              : trend === 'down' 
                ? 'text-red-600' 
                : 'text-gray-500'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {change}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
