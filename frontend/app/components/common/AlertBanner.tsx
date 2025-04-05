'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface AlertBannerProps {
  message?: string;
  type?: 'warning' | 'danger' | 'info';
  show?: boolean;
  onClose?: () => void;
}

const AlertBanner = ({ 
  message = 'Potential security threat detected! Security team has been notified.', 
  type = 'danger',
  show: initialShow = false,
  onClose
}: AlertBannerProps) => {
  const [show, setShow] = useState(initialShow);
  
  useEffect(() => {
    setShow(initialShow);
  }, [initialShow]);
  
  const handleClose = () => {
    setShow(false);
    if (onClose) onClose();
  };
  
  if (!show) return null;
  
  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 ${
      type === 'danger' ? 'bg-red-600 text-white' : 
      type === 'warning' ? 'bg-yellow-600 text-white' : 
      'bg-blue-600 text-white'
    }`}>
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          {type === 'danger' && (
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          )}
          <p className="font-medium">{message}</p>
        </div>
        <button onClick={handleClose} className="ml-auto">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default AlertBanner;
