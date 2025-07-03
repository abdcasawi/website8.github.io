import React, { useState } from 'react';
import { Channel, Category } from '../types';
import { ChevronLeft, ChevronRight, Search, Grid, List } from 'lucide-react';

interface LiveTVProps {
  onChannelSelect: (channel: Channel) => void;
}

const LiveTV: React.FC<LiveTVProps> = ({ onChannelSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock data for categories and channels
  const categories: Category[] = [
    {
      id: 'all',
      name: 'All Channels',
      channels: []
    },
    {
      id: 'news',
      name: 'News',
      channels: []
    },
    {
      id: 'sports',
      name: 'Sports',
      channels: []
    },
    {
      id: 'entertainment',
      name: 'Entertainment',
      channels: []
    },
    {
      id: 'demo',
      name: 'Demo Streams',
      channels: []
    },
    {
      id: 'kids',
      name: 'Kids',
      channels: []
    }
  ];

  const channels: Channel[] = [
    {
    "id": "1",
    "name": "2M",
    "logo": "https://i.imgur.com/PJYTfHi.png",
    "streamUrl": "https://fl1002.bozztv.com/ga-2mmaroc-hd/index.m3u8",
    "category": "Morocco"
  },
  {
    "id": "2",
    "name": "2M Monde",
    "logo": "https://i.imgur.com/MvpntzA.png",
    "streamUrl": "https://cdn-globecast.akamaized.net/live/eds/2m_monde/hls_video_ts_tuhawxpiemz257adfc/2m_monde.m3u8",
    "category": "Morocco"
  },
  {
    "id": "3",
    "name": "2M Monde +1 (1080p)",
    "logo": "https://i.imgur.com/MvpntzA.png",
    "streamUrl": "https://d2qh3gh0k5vp3v.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-n6pess5lwbghr/2M_ES.m3u8",
    "category": "Morocco"
  },
  {
    "id": "4",
    "name": "ABN Africa (480p)",
    "logo": "https://i.imgur.com/SLrX8Ef.png",
    "streamUrl": "https://mediaserver.abnvideos.com/streams/abnafrica.m3u8",
    "category": "Morocco"
  },
  {
    "id": "5",
    "name": "Abu Dhabi Sports 1 (1080p)",
    "logo": "https://i.imgur.com/6BVWk8z.png",
    "streamUrl": "https://vo-live-media.cdb.cdn.orange.com/Content/Channel/AbuDhabiSportsChannel1/HLS/index.m3u8",
    "category": "Morocco"
  },
  {
    "id": "6",
    "name": "Aflam (1080p)",
    "logo": "https://i.imgur.com/cTLj7Yt.png",
    "streamUrl": "https://shls-live-enc.edgenextcdn.net/out/v1/0044dd4b001a466c941ad77b04a574a2/index.m3u8",
    "category": "Morocco"
  },
  {
    "id": "7",
    "name": "Aflam TV",
    "logo": "https://i.imgur.com/XqQxO9J.png",
    "streamUrl": "https://fl1002.bozztv.com/ga-aflamtv7/index.m3u8",
    "category": "Morocco"
  }
  ];

  const filteredChannels = channels.filter(channel => {
    const matchesCategory = selectedCategory === 'all' || channel.category === selectedCategory;
    const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-white">Live TV</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none w-64"
            />
          </div>
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Channels */}
      <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4' : 'space-y-2'}`}>
        {filteredChannels.map((channel) => (
          <div
            key={channel.id}
            onClick={() => onChannelSelect(channel)}
            className={`
              cursor-pointer transition-all duration-200 hover:scale-105 group
              ${viewMode === 'grid' 
                ? 'bg-slate-800 rounded-lg p-4 hover:bg-slate-700' 
                : 'bg-slate-800 rounded-lg p-3 hover:bg-slate-700 flex items-center gap-3'
              }
            `}
          >
            <div className={`${viewMode === 'grid' ? 'text-center' : 'flex items-center gap-3 w-full'}`}>
              <div className={`${viewMode === 'grid' ? 'mb-3' : 'flex-shrink-0'}`}>
                <div className={`${viewMode === 'grid' ? 'w-16 h-16' : 'w-12 h-12'} bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mx-auto`}>
                  {channel.name.charAt(0)}
                </div>
              </div>
              <div className={`${viewMode === 'grid' ? 'text-center' : 'flex-1'}`}>
                <h3 className={`${viewMode === 'grid' ? 'text-sm' : 'text-base'} font-medium text-white group-hover:text-blue-400 transition-colors`}>
                  {channel.name}
                </h3>
                {viewMode === 'list' && (
                  <p className="text-xs text-slate-400 capitalize">{channel.category}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredChannels.length === 0 && (
        <div className="text-center py-20">
          <p className="text-slate-400 text-lg">No channels found</p>
        </div>
      )}
    </div>
  );
};

export default LiveTV;