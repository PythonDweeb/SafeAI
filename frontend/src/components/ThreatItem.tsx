import React from 'react';

export interface ThreatItemProps {
  id: string;
  location: string;
  timestamp: string;
  status: 'HIGH' | 'MEDIUM' | 'LOW';
  onThreatClick: (id: string) => void;
}

const ThreatItem: React.FC<ThreatItemProps> = ({ 
  id, 
  location, 
  timestamp, 
  status, 
  onThreatClick 
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'HIGH':
        return (
          <div className="relative">
            <div className="absolute -inset-1 bg-red-500 rounded-full opacity-20 animate-pulse"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'MEDIUM':
        return (
          <div className="relative">
            <div className="absolute -inset-1 bg-orange-500 rounded-full opacity-20 animate-pulse" style={{ animationDuration: '2s' }}></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'LOW':
        return (
          <div className="relative">
            <div className="absolute -inset-1 bg-yellow-500 rounded-full opacity-20 animate-pulse" style={{ animationDuration: '3s' }}></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="flex items-center p-4 my-2 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md card animate-slideInUp"
      onClick={() => onThreatClick(id)}
    >
      <div className="mr-4">
        {getStatusIcon()}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{location}</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {timestamp}
          </span>
        </div>
        <div className="flex mt-1 items-center space-x-2">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-md px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300 font-medium">{id}</div>
          <div className={`status-badge status-${status.toLowerCase()}`}>
            <div className="flex items-center">
              <div className={`h-1.5 w-1.5 rounded-full bg-current mr-1`}></div>
              {status}
            </div>
          </div>
        </div>
      </div>

      <div className="ml-2">
        <button className="text-blue-500 hover:text-blue-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ThreatItem;
