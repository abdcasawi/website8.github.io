import React, { useState, useEffect } from 'react';
import { Search, RotateCw, User, Settings, Tv } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: 'dashboard' | 'live' | 'movies' | 'series') => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const buttonStyle = {
    backgroundImage: 'url(/183887-4146907743 copy.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };

  return (
    <header className="bg-black/20 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onViewChange('dashboard')}
          >
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg shadow-lg">
              <Tv className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">IPTV</h1>
              <p className="text-slate-300 text-xs">SMARTERS PRO</p>
            </div>
          </div>

          {/* Time & Date */}
          <div className="text-center">
            <div className="text-white text-xl font-semibold drop-shadow-lg">
              {formatTime(currentTime)}
            </div>
            <div className="text-slate-300 text-sm">
              {formatDate(currentTime)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 text-white hover:text-blue-300 rounded-lg transition-all border border-white/20 relative overflow-hidden"
              style={buttonStyle}
            >
              <div className="absolute inset-0 bg-black/40"></div>
              <Search className="w-5 h-5 relative z-10" />
            </button>
            <button 
              className="p-2 text-white hover:text-blue-300 rounded-lg transition-all border border-white/20 relative overflow-hidden"
              style={buttonStyle}
            >
              <div className="absolute inset-0 bg-black/40"></div>
              <RotateCw className="w-5 h-5 relative z-10" />
            </button>
            <button 
              className="p-2 text-white hover:text-blue-300 rounded-lg transition-all border border-white/20 relative overflow-hidden"
              style={buttonStyle}
            >
              <div className="absolute inset-0 bg-black/40"></div>
              <User className="w-5 h-5 relative z-10" />
            </button>
            <button 
              className="p-2 text-white hover:text-blue-300 rounded-lg transition-all border border-white/20 relative overflow-hidden"
              style={buttonStyle}
            >
              <div className="absolute inset-0 bg-black/40"></div>
              <Settings className="w-5 h-5 relative z-10" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;