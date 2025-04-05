'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, BellIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const [alertCount, setAlertCount] = useState(2);

  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-sm">
      <div className="flex-1">
        <h1 className="text-xl font-bold text-gray-800">School Safety Monitoring System</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
        
        <div className="relative">
          <BellIcon className="h-6 w-6 text-gray-500 hover:text-gray-700 cursor-pointer" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {alertCount}
            </span>
          )}
        </div>
        
        <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-white">
          <span className="text-sm">SC</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
