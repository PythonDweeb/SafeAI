import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  buildingName: string;
  currentTime: string;
  onBuildingChange: (building: string) => void;
}

const Header: React.FC<HeaderProps> = ({ buildingName, currentTime, onBuildingChange }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  
  const buildings = [
    "Piedmont Hills High School",
    "Los Altos High School"
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <header 
      className={`flex justify-between items-center px-6 py-3 bg-opacity-95 backdrop-blur-md z-50 transition-all duration-300 ${
        isScrolled ? 'shadow-lg bg-white/90' : 'bg-white'
      }`}
    >
      <div className="flex items-center">
        <Link href="/" className="group transition-all duration-300 flex items-center">
          <div className="relative overflow-hidden">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:to-blue-500 transition-all duration-500">
              SafeAI
            </h1>
            <span className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"></span>
          </div>
          <div className="ml-1 relative top-0">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center">
          <div className="mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="relative">
            <button 
              className="border border-gray-200 rounded-lg py-2 px-4 flex items-center bg-white hover:bg-gray-50 transition-colors shadow-sm"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <span className="text-sm font-medium mr-2">{buildingName}</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 transition-transform duration-200 ease-in-out text-gray-500 ${showDropdown ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 animate-fadeIn overflow-hidden">
                <div className="py-1">
                  {buildings.map((building) => (
                    <button
                      key={building}
                      className="block w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors"
                      onClick={() => {
                        onBuildingChange(building);
                        setShowDropdown(false);
                      }}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${building === buildingName ? 'text-blue-500' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H7a1 1 0 00-1 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                        </svg>
                        <span className={building === buildingName ? 'font-medium text-blue-600' : ''}>{building}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <div className="mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm font-medium text-gray-600 bg-gray-100 py-1.5 px-3 rounded-lg">
            {currentTime}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
