import React from 'react';

export interface ThreatItemProps {
  id: string;
  cameraId: string;
  location: string;
  timestamp: string;
  status: 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  onThreatClick: (id: string) => void;
}

const ThreatItem: React.FC<ThreatItemProps> = ({ 
  id, 
  cameraId, 
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
      className={`
        p-4 rounded-lg shadow-lg border transition-all cursor-pointer
        hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
        ${status === 'HIGH' ? 'bg-red-50 border-red-200' : 
          status === 'MEDIUM' ? 'bg-orange-50 border-orange-200' : 
          status === 'LOW' ? 'bg-yellow-50 border-yellow-200' :
          'bg-green-50 border-green-200'} 
      `}
      onClick={() => onThreatClick(id)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {status === 'HIGH' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : status === 'MEDIUM' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : status === 'LOW' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          <span className="font-medium text-gray-800">{location}</span>
        </div>
        <span className={`
          px-2 py-1 rounded-full text-xs font-medium
          ${status === 'HIGH' ? 'bg-red-100 text-red-800' : 
            status === 'MEDIUM' ? 'bg-orange-100 text-orange-800' : 
            status === 'LOW' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'}
        `}>
          {status}
        </span>
      </div>
      <div className="flex items-center text-xs text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {timestamp}
      </div>
    </div>
  );
};

export default ThreatItem;
