'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import TypingEffect from '@/components/TypingEffect';

export default function LandingPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [cameraStatuses, setCameraStatuses] = useState<Record<string, 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW'>>({});
  const [activeThreats, setActiveThreats] = useState<{ cameraId: string; status: 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW' }[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Listen for camera status changes
  useEffect(() => {
    const handleStatusChange = (event: CustomEvent<{ cameraId: string; status: 'NORMAL' | 'HIGH' | 'MEDIUM' | 'LOW' }>) => {
      const { cameraId, status } = event.detail;
      setCameraStatuses(prev => ({
        ...prev,
        [cameraId]: status
      }));

      // Also update active threats
      setActiveThreats(prev => 
        prev.map(threat => 
          threat.cameraId === cameraId 
            ? { ...threat, status } 
            : threat
        )
      );
    };

    window.addEventListener('cameraStatusChanged', handleStatusChange as EventListener);
    return () => {
      window.removeEventListener('cameraStatusChanged', handleStatusChange as EventListener);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Background GIF */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/background.gif')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Semi-transparent overlay to improve text readability */}
      <div className="absolute inset-0 z-0 bg-black opacity-70"></div>

      {/* Foreground Content */}
      <div className={`z-10 flex flex-col items-center text-center transition-all duration-1000 ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Fixed-size translucent card */}
        <div
          className={`bg-black/50 backdrop-blur-md rounded-xl p-8 md:p-10 shadow-xl transition-all duration-[1500ms] ease-out 
                    ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'} 
                    flex flex-col items-center justify-center
                    w-[130%] max-w-[900px] h-[350px]`}
        >
          <h1
            className="text-6xl md:text-7xl font-bold mb-6 text-white title-glow transition-all duration-[1500ms] ease-out"
            style={{ 
              opacity: isLoaded ? 1 : 0, 
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              fontFamily: "'Lato', sans-serif",
              letterSpacing: "1px"
            }}
          >
            SafeAI
          </h1>
          
          <div className="mb-8 h-[50px] flex items-center justify-center">
            <div
              className="transition-all duration-[1500ms] ease-out delay-200"
              style={{ opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0)' : 'translateY(20px)' }}
            >
              <TypingEffect />
            </div>
          </div>

          <p className="text-gray-300 mb-8 max-w-md text-sm md:text-base transition-all duration-[1500ms] ease-out delay-300 text-glow"
             style={{ 
              opacity: isLoaded ? 1 : 0, 
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              fontFamily: "'Quicksand', sans-serif" 
            }}>
            Computer vision for school security cameras that detects weapons and alerts authorities instantly.
          </p>

          {/* Enter Button */}
          <Link href="/dashboard" className={`transition-all duration-[1500ms] ease-out delay-500 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <button
              className={`px-10 py-3 bg-transparent border-2 border-white text-white font-bold text-lg rounded-lg
                         shadow-lg hover:shadow-glow-strong hover:bg-white hover:text-black
                         transition-all duration-300 ease-in-out transform hover:scale-105
                         focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-75
                         button-pulse button-glow`}
              style={{ 
                fontFamily: "'Quicksand', sans-serif",
                fontWeight: "600" 
              }}
            >
              Begin
            </button>
          </Link>
        </div>
      </div>

      {/* Custom CSS for Glow Effects and Animations */}
      <style jsx>{`
        .title-glow {
          text-shadow: 0 0 5px rgba(255, 255, 255, 0.7),
                       0 0 15px rgba(255, 255, 255, 0.5),
                       0 0 25px rgba(255, 255, 255, 0.4),
                       0 0 35px rgba(200, 220, 255, 0.3);
          animation: pulse-glow 3s infinite alternate;
        }
        
        @keyframes pulse-glow {
          0% { text-shadow: 0 0 5px rgba(255, 255, 255, 0.7),
                           0 0 15px rgba(255, 255, 255, 0.5),
                           0 0 25px rgba(255, 255, 255, 0.4),
                           0 0 35px rgba(200, 220, 255, 0.3); }
          100% { text-shadow: 0 0 7px rgba(255, 255, 255, 0.8),
                             0 0 17px rgba(255, 255, 255, 0.6),
                             0 0 27px rgba(255, 255, 255, 0.5),
                             0 0 40px rgba(200, 220, 255, 0.4); }
        }
        
        .text-glow {
            text-shadow: 0 0 4px rgba(255, 255, 255, 0.3),
                         0 0 8px rgba(255, 255, 255, 0.2);
        }
        
        .button-glow {
            text-shadow: 0 0 5px rgba(255, 255, 255, 0.5),
                         0 0 10px rgba(255, 255, 255, 0.3);
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.3),
                        0 0 5px rgba(255, 255, 255, 0.2) inset;
        }
        
        .hover\:shadow-glow-strong:hover {
           box-shadow: 0 0 20px rgba(255, 255, 255, 0.8), 0 0 12px rgba(255, 255, 255, 0.6) inset;
        }
        
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 10px rgba(255, 255, 255, 0.3), 0 0 5px rgba(255, 255, 255, 0.2) inset; border-color: rgba(255, 255, 255, 0.8); }
          50% { box-shadow: 0 0 15px rgba(255, 255, 255, 0.5), 0 0 8px rgba(255, 255, 255, 0.3) inset; border-color: rgba(255, 255, 255, 1); }
        }
        
        .button-pulse {
          animation: pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Google Font import */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@700;900&display=swap');
      `}</style>
    </div>
  );
}
