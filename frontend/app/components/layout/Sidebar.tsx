'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  HomeIcon, 
  MapIcon, 
  VideoCameraIcon, 
  BellIcon, 
  ChartBarIcon, 
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Map View', href: '/map', icon: MapIcon },
    { name: 'Monitoring', href: '/monitoring', icon: VideoCameraIcon },
    { name: 'Alerts', href: '/alerts', icon: BellIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className={`flex flex-col h-full bg-slate-800 text-white p-4 ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300`}>
      <div className="flex items-center justify-between mb-8">
        {!collapsed && (
          <div className="flex items-center">
            <div className="bg-red-500 p-2 rounded-lg mr-2">
              <span className="font-bold text-lg">AI</span>
            </div>
            <h1 className="text-xl font-bold">Safe AI</h1>
          </div>
        )}
        {collapsed && (
          <div className="bg-red-500 p-2 rounded-lg mx-auto">
            <span className="font-bold text-lg">AI</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="flex-1">
        <ul className="space-y-4">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link 
                href={item.href}
                className="flex items-center p-2 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <item.icon className="h-6 w-6" />
                {!collapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="pt-4 border-t border-slate-700 mt-6">
        <div className="flex items-center p-2">
          <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
            <span className="text-sm">SC</span>
          </div>
          {!collapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium">Security Team</p>
              <p className="text-xs text-gray-400">Main Campus</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
