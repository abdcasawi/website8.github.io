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

  const buttonBackgroundStyle = {
    backgroundImage: 'url(/183887-4146907743 copy.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };

  // Mock data for categories and channels
  const categories: Category[] = [
    {
      id: 'all',
      name: 'All Channels',
      channels: []
    },
    {
      id: 'General',
      name: 'General',
      channels: []
    },
    {
      id: 'Sports',
      name: 'Sports',
      channels: []
    },
    {
      id: 'News',
      name: 'News',
      channels: []
    },
    {
      id: 'Business',
      name: 'Business',
      channels: []
    },
    {
      id: 'Morocco',
      name: 'Morocco',
      channels: []
    },
    {
      id: 'arabic',
      name: 'arabic',
      channels: []
    },
    {
      id: 'Religious',
      name: 'Religious',
      channels: []
    }
  ];

  const channels: Channel[] = [
    {
      "id": "3",
      "name": "2M Monde +1 (1080p)",
      "logo": "https://i.imgur.com/MvpntzA.png",
      "streamUrl": "https://d2qh3gh0k5vp3v.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-n6pess5lwbghr/2M_ES.m3u8",
      "category": "Morocco"
    },
    {
      "id": "13",
      "name": "Al Aoula Inter (480p)",
      "logo": "https://i.imgur.com/nq53d2N.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/ts_corp/73_aloula_w1dqfwm/playlist_dvr.m3u8",
      "category": "Morocco"
    },
    {
      "id": "14",
      "name": "Al Aoula Laâyoune (480p)",
      "logo": "https://www.snrt.ma/sites/default/files/2023-04/laayoune.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/abr_corp/73_laayoune_pgagr52/corp/73_laayoune_pgagr52_480p/chunks_dvr.m3u8",
      "category": "Morocco"
    },
    {
      "id": "15",
      "name": "Al Arabiya (1080p)",
      "logo": "https://i.imgur.com/NXFkYFj.png",
      "streamUrl": "https://live.alarabiya.net/alarabiapublish/alarabiya.smil/playlist.m3u8",
      "category": "News"
    },
    {
      "id": "16",
      "name": "Al Arabiya Al Hadath (1080p) [Not 24/7]",
      "logo": "https://i.imgur.com/De4SEWE.png",
      "streamUrl": "https://av.alarabiya.net/alarabiapublish/alhadath.smil/playlist.m3u8",
      "category": "News"
    },
    {
      "id": "17",
      "name": "Al Arabiya Business (1080p)",
      "logo": "https://i.imgur.com/eEV4r6J.jpg",
      "streamUrl": "https://live.alarabiya.net/alarabiapublish/aswaaq.smil/playlist.m3u8",
      "category": "Business"
    },
    {
      "id": "18",
      "name": "Al Arabiya Programs (1080p)",
      "logo": "https://i.imgur.com/Hoc3cfO.png",
      "streamUrl": "https://d1j4r34gq3qw9y.cloudfront.net/out/v1/96804f3a14864641a21c25e8ca9afb74/index.m3u8",
      "category": "Undefined"
    },
    {
      "id": "19",
      "name": "Al Araby TV 2 (1080p)",
      "logo": "https://i.imgur.com/Gp5mNea.png",
      "streamUrl": "https://alarabyta.cdn.octivid.com/alaraby2n/smil:alaraby2n.stream.smil/chunklist.m3u8",
      "category": "News"
    },
    {
      "id": "20",
      "name": "Al Araby TV (1080p)",
      "logo": "https://i.imgur.com/YMqWEe4.png",
      "streamUrl": "https://alarabyta.cdn.octivid.com/alaraby/smil:alaraby.stream.smil/chunklist.m3u8",
      "category": "News"
    },
    {
      "id": "22",
      "name": "Al Jazeera (1080p)",
      "logo": "https://i.imgur.com/7bRVpnu.png",
      "streamUrl": "https://live-hls-apps-aja-fa.getaj.net/AJA/index.m3u8",
      "category": "News"
    },
    {
      "id": "24",
      "name": "Al Jazeera Mubasher 24 (1080p)",
      "logo": "https://yt3.googleusercontent.com/h0_bBdVgCAXIPJFnQ4hZtE87cDY_qO7rkDAue8qXdmOFxZ5NaO3AFD1uCUcst-EsBcGJ8zl8EQ=s160-c-k-c0x00ffffff-no-rj",
      "streamUrl": "https://live-hls-apps-ajm24-fa.getaj.net/AJM24/index.m3u8",
      "category": "News"
    },
    {
      "id": "27",
      "name": "Al Maghribia (480p)",
      "logo": "https://i.imgur.com/7GaahYh.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/abr_corp/73_almaghribia_83tz85q/corp/73_almaghribia_83tz85q_480p/chunks_dvr.m3u8",
      "category": "General"
    },
    {
      "id": "28",
      "name": "Al Qamar TV (1080p)",
      "logo": "https://i.imgur.com/zkBT0C8.png",
      "streamUrl": "https://streamer3.premio.link/alqamar/playlist.m3u8",
      "category": "Undefined"
    },
    {
      "id": "32",
      "name": "Arryadia (480p)",
      "logo": "https://i.imgur.com/XjzK3gZ.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/abr_corp/73_arryadia_k2tgcj0/corp/73_arryadia_k2tgcj0_480p/chunks_dvr.m3u8",
      "category": "Morocco"
    },
    {
      "id": "33",
      "name": "Asharq Discovery (1080p) [Geo-blocked]",
      "logo": "https://i.imgur.com/Czxi7yk.png",
      "streamUrl": "https://svs.itworkscdn.net/asharqdiscoverylive/asharqd.smil/playlist_dvr.m3u8",
      "category": "Documentary"
    },
    {
      "id": "34",
      "name": "Asharq Documentary (1080p)",
      "logo": "https://www.youtube.com/watch?v=0KsZtySOtQY",
      "streamUrl": "https://svs.itworkscdn.net/asharqdocumentarylive/asharqdocumentary.smil/playlist_dvr.m3u8",
      "category": "Documentary"
    },
    {
      "id": "35",
      "name": "Assadissa (480p)",
      "logo": "https://i.imgur.com/un6qTGO.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/abr_corp/73_assadissa_7b7u5n1/corp/73_assadissa_7b7u5n1_480p/chunks_dvr.m3u8",
      "category": "Religious"
    },
    {
      "id": "36",
      "name": "Athaqafia (480p)",
      "logo": "https://i.imgur.com/mrwFI2L.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/ts_corp/73_arrabia_hthcj4p/playlist_dvr.m3u8",
      "category": "Culture"
    },
    {
      "id": "42",
      "name": "CGTN Arabic (1080p) [Not 24/7]",
      "logo": "https://i.imgur.com/AkFFrS7.png",
      "streamUrl": "https://arabic-livews.cgtn.com/hls/LSveq57bErWLinBnxosqjisZ220802LSTefTAS9zc9mpU08y3np9TH220802cd/playlist.m3u8",
      "category": "News"
    },
    {
      "id": "43",
      "name": "Chada TV (720p)",
      "logo": "https://i.imgur.com/inJyJBN.png",
      "streamUrl": "https://chadatv.vedge.infomaniak.com/livecast/chadatv/playlist.m3u8",
      "category": "General"
    },
    {
      "id": "48",
      "name": "Dubai One (1080p)",
      "logo": "https://i.imgur.com/Dj16oKL.png",
      "streamUrl": "https://dminnvllta.cdn.mgmlcdn.com/dubaione/smil:dubaione.stream.smil/chunklist.m3u8",
      "category": "General"
    },
    {
      "id": "49",
      "name": "DW Arabic (1080p)",
      "logo": "https://i.imgur.com/8MRNFb9.png",
      "streamUrl": "https://dwamdstream103.akamaized.net/hls/live/2015526/dwstream103/index.m3u8",
      "category": "News"
    },
    {
      "id": "56",
      "name": "MBC 1 (1080p)",
      "logo": "https://i.imgur.com/CiA3plN.png",
      "streamUrl": "https://d3o3cim6uzorb4.cloudfront.net/out/v1/0965e4d7deae49179172426cbfb3bc5e/index.m3u8",
      "category": "General"
    },
    {
      "id": "58",
      "name": "MBC 3 KSA (1080p)",
      "logo": "https://i.imgur.com/PVt8OPN.png",
      "streamUrl": "https://shls-mbc3-prod-dub.shahid.net/out/v1/d5bbe570e1514d3d9a142657d33d85e6/index.m3u8",
      "category": "Kids"
    },
    {
      "id": "59",
      "name": "MBC 4 (1080p)",
      "logo": "https://i.imgur.com/BcXASJp.png",
      "streamUrl": "https://shls-masr-prod-dub.shahid.net/out/v1/c08681f81775496ab4afa2bac7ae7638/index.m3u8",
      "category": "Entertainment"
    },
    {
      "id": "60",
      "name": "MBC 5 (1080p)",
      "logo": "https://i.imgur.com/fRWaDyF.png",
      "streamUrl": "https://shls-mbc5-prod-dub.shahid.net/out/v1/2720564b6a4641658fdfb6884b160da2/index.m3u8",
      "category": "Family"
    },
    {
      "id": "63",
      "name": "MBC FM (1080p)",
      "logo": "https://i.imgur.com/lF8UxvR.png",
      "streamUrl": "https://dbbv9umqcd7cs.cloudfront.net/out/v1/db15b75c3cc0400c91961468d6a232ac/index.m3u8",
      "category": "Music"
    },
    {
      "id": "65",
      "name": "Medi 1 TV Afrique (1080p) [Not 24/7]",
      "logo": "https://i.imgur.com/OioFepy.jpeg",
      "streamUrl": "https://streaming1.medi1tv.com/live/smil:medi1fr.smil/playlist.m3u8",
      "category": "Morocco"
    },
    {
      "id": "66",
      "name": "Medi 1 TV Arabic (1080p) [Not 24/7]",
      "logo": "https://i.imgur.com/jWKH922.jpeg",
      "streamUrl": "https://streaming1.medi1tv.com/live/smil:medi1ar.smil/playlist.m3u8",
      "category": "Morocco"
    },
    {
      "id": "67",
      "name": "Medi 1 TV Maghreb (1080p) [Not 24/7]",
      "logo": "https://i.imgur.com/LbeChWy.jpeg",
      "streamUrl": "https://streaming1.medi1tv.com/live/smil:medi1tv.smil/playlist.m3u8",
      "category": "Morocco"
    },
    {
      "id": "75",
      "name": "Rai Italia",
      "logo": "https://i.imgur.com/1nN4rEP.png",
      "streamUrl": "https://ilglobotv-live.akamaized.net/channels/RAIItaliaSudAfrica/Live.m3u8",
      "category": "Undefined"
    },
    {
      "id": "79",
      "name": "RT Arabic (1080p) [Geo-blocked]",
      "logo": "https://i.imgur.com/G8vGrn1.png",
      "streamUrl": "https://rt-arb.rttv.com/dvr/rtarab/playlist.m3u8",
      "category": "News"
    },
    {
      "id": "81",
      "name": "Sky News Arabia (1080p) [Not 24/7]",
      "logo": "https://i.imgur.com/SvjU4h6.png",
      "streamUrl": "https://stream.skynewsarabia.com/ott/ott.m3u8",
      "category": "News"
    },
    {
      "id": "82",
      "name": "Sky News Arabia (Portrait) (1280p) [Not 24/7]",
      "logo": "https://i.imgur.com/FjtzQQs.png",
      "streamUrl": "https://stream.skynewsarabia.com/vertical/vertical.m3u8",
      "category": "News"
    },
    {
      "id": "85",
      "name": "Tamazight TV (480p)",
      "logo": "https://i.imgur.com/fm6S7we.png",
      "streamUrl": "https://cdn.live.easybroadcast.io/ts_corp/73_tamazight_tccybxt/playlist_dvr.m3u8",
      "category": "Morocco"
    },
    {
      "id": "86",
      "name": "BEIN SPORT 3 HD",
      "logo": "https://i.imgur.com/Vc3jdu8.jpeg",
      "streamUrl": "https://www.elahmad.com/tv/mobiletv/glarb.php?id=bein_m_1?",
      "category": "Sports"
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
        <h2 className="text-3xl font-bold text-white drop-shadow-lg">Live TV</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-black/30 backdrop-blur-md text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none w-64 placeholder-slate-400"
            />
          </div>
          <div 
            className="flex rounded-lg p-1 border border-white/20 relative overflow-hidden"
            style={buttonBackgroundStyle}
          >
            <div className="absolute inset-0 bg-black/60"></div>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors relative z-10 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors relative z-10 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
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
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-md border relative overflow-hidden ${
              selectedCategory === category.id
                ? 'border-blue-500 text-white'
                : 'border-white/20 text-slate-300 hover:text-white'
            }`}
            style={buttonBackgroundStyle}
          >
            <div className={`absolute inset-0 ${selectedCategory === category.id ? 'bg-blue-600/80' : 'bg-black/60 hover:bg-black/50'}`}></div>
            <span className="relative z-10">{category.name}</span>
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
              cursor-pointer transition-all duration-200 hover:scale-105 group backdrop-blur-md border border-white/20 relative overflow-hidden
              ${viewMode === 'grid' 
                ? 'rounded-lg p-4 hover:shadow-lg' 
                : 'rounded-lg p-3 hover:shadow-lg flex items-center gap-3'
              }
            `}
            style={buttonBackgroundStyle}
          >
            <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-colors"></div>
            <div className={`relative z-10 ${viewMode === 'grid' ? 'text-center' : 'flex items-center gap-3 w-full'}`}>
              <div className={`${viewMode === 'grid' ? 'mb-3' : 'flex-shrink-0'}`}>
                <div className={`${viewMode === 'grid' ? 'w-16 h-16' : 'w-12 h-12'} rounded-lg overflow-hidden mx-auto shadow-lg bg-white/10 flex items-center justify-center`}>
                  <img 
                    src={channel.logo} 
                    alt={channel.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback to first letter if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-text')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'fallback-text w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg';
                        fallback.textContent = channel.name.charAt(0);
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
              </div>
              <div className={`${viewMode === 'grid' ? 'text-center' : 'flex-1'}`}>
                <h3 className={`${viewMode === 'grid' ? 'text-sm' : 'text-base'} font-medium text-white group-hover:text-blue-400 transition-colors drop-shadow-lg`}>
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
          <p className="text-slate-400 text-lg drop-shadow-lg">No channels found</p>
        </div>
      )}
    </div>
  );
};

export default LiveTV;