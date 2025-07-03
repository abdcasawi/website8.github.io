import React, { useState } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import LiveTV from './components/LiveTV';
import VideoPlayer from './components/VideoPlayer';
import { Channel } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'live' | 'movies' | 'series'>('dashboard');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
    setIsPlayerOpen(true);
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    setSelectedChannel(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="px-4 py-6 max-w-7xl mx-auto">
        {currentView === 'dashboard' && (
          <Dashboard onNavigate={setCurrentView} />
        )}
        
        {currentView === 'live' && (
          <LiveTV onChannelSelect={handleChannelSelect} />
        )}
        
        {currentView === 'movies' && (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-white mb-4">Movies</h2>
            <p className="text-slate-400">Movies section coming soon...</p>
          </div>
        )}
        
        {currentView === 'series' && (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-white mb-4">Series</h2>
            <p className="text-slate-400">Series section coming soon...</p>
          </div>
        )}
      </main>

      {isPlayerOpen && selectedChannel && (
        <VideoPlayer
          channel={selectedChannel}
          onClose={handleClosePlayer}
        />
      )}
    </div>
  );
}

export default App;