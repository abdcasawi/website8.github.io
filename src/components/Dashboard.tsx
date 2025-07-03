import React from 'react';
import { Tv, Play, Clapperboard, Download, Info, Clock } from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: 'dashboard' | 'live' | 'movies' | 'series') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const mainCards = [
    {
      id: 'live',
      title: 'LIVE',
      icon: Tv,
      gradient: 'from-blue-500 via-cyan-500 to-teal-500',
      size: 'large',
      onClick: () => onNavigate('live')
    },
    {
      id: 'movies',
      title: 'MOVIES',
      icon: Play,
      gradient: 'from-orange-500 via-red-500 to-pink-500',
      size: 'large',
      onClick: () => onNavigate('movies')
    },
    {
      id: 'series',
      title: 'SERIES',
      icon: Clapperboard,
      gradient: 'from-purple-500 via-violet-500 to-blue-500',
      size: 'large',
      onClick: () => onNavigate('series')
    }
  ];

  const utilityCards = [
    {
      id: 'epg',
      title: 'UPDATE EPG',
      icon: Download,
      gradient: 'from-emerald-500 to-teal-500',
      size: 'small'
    },
    {
      id: 'account',
      title: 'ACCOUNT',
      icon: Info,
      gradient: 'from-emerald-500 to-teal-500',
      size: 'small'
    },
    {
      id: 'catchup',
      title: 'CATCH UP',
      icon: Clock,
      gradient: 'from-emerald-500 to-teal-500',
      size: 'small'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mainCards.map((card) => (
          <div
            key={card.id}
            onClick={card.onClick}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-8 cursor-pointer group hover:scale-105 transition-all duration-300 hover:shadow-2xl`}
          >
            <div className="flex flex-col items-center justify-center h-48 text-white">
              <div className="mb-4 opacity-80 group-hover:opacity-100 transition-opacity">
                <card.icon className="w-16 h-16" />
              </div>
              <h3 className="text-2xl font-bold tracking-wide">{card.title}</h3>
            </div>
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors"></div>
          </div>
        ))}
      </div>

      {/* Utility Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {utilityCards.map((card) => (
          <div
            key={card.id}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${card.gradient} p-6 cursor-pointer group hover:scale-105 transition-all duration-300 hover:shadow-lg`}
          >
            <div className="flex items-center justify-center text-white">
              <card.icon className="w-6 h-6 mr-3" />
              <h3 className="text-lg font-semibold">{card.title}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Status Bar */}
      <div className="flex justify-between items-center pt-8 border-t border-slate-700/50">
        <div className="text-slate-400">
          <span className="text-sm">Expiration: </span>
          <span className="text-white font-medium">Unlimited</span>
        </div>
        <div className="text-slate-400">
          <span className="text-sm">Logged in as: </span>
          <span className="text-white font-medium">ABC</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;