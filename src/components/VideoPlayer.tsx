import React, { useRef, useEffect, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, AlertCircle, RefreshCw, ArrowLeft, Info, Settings, Tv, Signal, Clock } from 'lucide-react';
import { Channel } from '../types';

interface VideoPlayerProps {
  channel: Channel;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ channel, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [canPlay, setCanPlay] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [showInfo, setShowInfo] = useState(false);

  const buttonBackgroundStyle = {
    backgroundImage: 'url(/183887-4146907743 copy.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeout);
      setShowControls(true);
      timeout = setTimeout(() => {
        if (isPlaying && !error) {
          setShowControls(false);
        }
      }, 3000);
    };

    const handleMouseMove = () => resetTimeout();
    const handleKeyPress = () => resetTimeout();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyPress);

    resetTimeout();

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isPlaying, error]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const loadVideo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setCanPlay(false);
        setConnectionStatus('connecting');

        // Clean up previous HLS instance
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }

        console.log('Loading live stream:', channel.streamUrl);

        // Check if HLS is supported natively (Safari)
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          console.log('Using native HLS support for live TV');
          video.src = channel.streamUrl;
          
          const handleLoadedData = () => {
            setIsLoading(false);
            setCanPlay(true);
            setConnectionStatus('connected');
            console.log('Live stream loaded successfully');
            // Auto-play live TV
            video.play().then(() => {
              setIsPlaying(true);
            }).catch(err => {
              console.log('Auto-play prevented:', err);
            });
          };
          
          const handleError = (e: any) => {
            console.error('Live stream error:', e);
            setError('Failed to connect to live stream - Channel may be offline');
            setIsLoading(false);
            setConnectionStatus('disconnected');
          };

          video.addEventListener('loadeddata', handleLoadedData);
          video.addEventListener('error', handleError);
          
          return () => {
            video.removeEventListener('loadeddata', handleLoadedData);
            video.removeEventListener('error', handleError);
          };
        } else {
          // Use HLS.js for live streaming
          const { default: Hls } = await import('hls.js');
          
          if (Hls.isSupported()) {
            console.log('Using HLS.js for live TV streaming');
            const hls = new Hls({
              enableWorker: false,
              lowLatencyMode: true,
              backBufferLength: 30,
              maxBufferLength: 100,
              maxMaxBufferLength: 30,
              maxBufferSize: 100* 1000 * 1000,
              maxBufferHole: 1,
              highBufferWatchdogPeriod: 1,
              nudgeOffset: 0.1,
              nudgeMaxRetry: 3,
              maxFragLookUpTolerance: 0.25,
              liveSyncDurationCount: 1,
              liveMaxLatencyDurationCount: 3,
              liveDurationInfinity: true,
              enableSoftwareAES: true,
              manifestLoadingTimeOut: 10000,
              manifestLoadingMaxRetry: 3,
              manifestLoadingRetryDelay: 1000,
              fragLoadingTimeOut: 20000,
              fragLoadingMaxRetry: 6,
              fragLoadingRetryDelay: 1000,
              startFragPrefetch: true,
              testBandwidth: true
            });
            
            hlsRef.current = hls;
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setIsLoading(false);
              setCanPlay(true);
              setConnectionStatus('connected');
              console.log('Live TV manifest parsed successfully');
              // Auto-play live TV
              video.play().then(() => {
                setIsPlaying(true);
              }).catch(err => {
                console.log('Auto-play prevented:', err);
              });
            });

            hls.on(Hls.Events.FRAG_LOADED, () => {
              setConnectionStatus('connected');
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
              console.error('Live TV HLS Error:', data);
              
              if (data.fatal) {
                let errorMessage = 'Failed to connect to live channel';
                
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    errorMessage = 'Network error - Live channel may be offline or blocked';
                    setConnectionStatus('disconnected');
                    if (retryCount < 3) {
                      console.log('Attempting to reconnect to live stream');
                      setTimeout(() => {
                        hls.startLoad();
                        setRetryCount(prev => prev + 1);
                      }, 2000);
                      return;
                    }
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    errorMessage = 'Media error - Live stream format not supported';
                    if (retryCount < 2) {
                      console.log('Attempting to recover live stream');
                      hls.recoverMediaError();
                      setRetryCount(prev => prev + 1);
                      return;
                    }
                    break;
                  case Hls.ErrorTypes.MUX_ERROR:
                    errorMessage = 'Stream format error - Unable to decode live signal';
                    break;
                  default:
                    errorMessage = `Live stream error: ${data.details || 'Unknown error'}`;
                    break;
                }
                
                setError(errorMessage);
                setIsLoading(false);
                setConnectionStatus('disconnected');
              }
            });

            hls.loadSource(channel.streamUrl);
            hls.attachMedia(video);
          } else {
            setError('Live TV streaming is not supported in this browser');
            setIsLoading(false);
            setConnectionStatus('disconnected');
          }
        }
      } catch (err) {
        console.error('Live TV loading error:', err);
        setError('Failed to initialize live TV player');
        setIsLoading(false);
        setConnectionStatus('disconnected');
      }
    };

    loadVideo();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel.streamUrl, retryCount]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video || !canPlay) return;

    try {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        await video.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Play/pause error:', err);
      setError('Unable to play live stream - Channel may be offline');
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const retryConnection = () => {
    setError(null);
    setIsLoading(true);
    setRetryCount(0);
    setCanPlay(false);
    setConnectionStatus('connecting');
    
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    const video = videoRef.current;
    if (video) {
      video.src = '';
      video.load();
    }
    
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSignalIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Signal className="w-4 h-4 text-green-400" />;
      case 'connecting':
        return <Signal className="w-4 h-4 text-yellow-400 animate-pulse" />;
      case 'disconnected':
        return <Signal className="w-4 h-4 text-red-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="relative w-full h-full">
        {/* Live TV Header - Always visible */}
        <div className={`absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-between p-4">
            {/* Back Button */}
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-all hover:scale-105 relative overflow-hidden border border-white/20"
              style={buttonBackgroundStyle}
            >
              <div className="absolute inset-0 bg-black/70"></div>
              <ArrowLeft className="w-5 h-5 relative z-10" />
              <span className="font-medium relative z-10">Back</span>
            </button>

            {/* Live TV Info */}
            <div 
              className="flex items-center gap-4 text-white px-6 py-3 rounded-lg relative overflow-hidden border border-white/20"
              style={buttonBackgroundStyle}
            >
              <div className="absolute inset-0 bg-black/70"></div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-bold text-red-400">LIVE</span>
                </div>
                <div className="w-px h-6 bg-white/30"></div>
                <div className="text-center">
                  <h2 className="text-lg font-bold">{channel.name}</h2>
                  <p className="text-xs text-slate-300 capitalize">{channel.category}</p>
                </div>
                <div className="w-px h-6 bg-white/30"></div>
                <div className="flex items-center gap-2">
                  {getSignalIcon()}
                  <span className="text-xs capitalize">{connectionStatus}</span>
                </div>
              </div>
            </div>

            {/* Time & Controls */}
            <div className="flex items-center gap-3">
              <div 
                className="text-center text-white px-4 py-2 rounded-lg relative overflow-hidden border border-white/20"
                style={buttonBackgroundStyle}
              >
                <div className="absolute inset-0 bg-black/70"></div>
                <div className="relative z-10">
                  <div className="text-lg font-bold">{formatTime(currentTime)}</div>
                  <div className="text-xs text-slate-300">Live TV</div>
                </div>
              </div>
              
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="p-2 text-white hover:text-blue-300 rounded-lg transition-all relative overflow-hidden border border-white/20"
                style={buttonBackgroundStyle}
              >
                <div className="absolute inset-0 bg-black/70"></div>
                <Info className="w-5 h-5 relative z-10" />
              </button>

              <button
                onClick={onClose}
                className="p-2 text-white hover:text-red-400 rounded-lg transition-all relative overflow-hidden border border-white/20"
                style={buttonBackgroundStyle}
              >
                <div className="absolute inset-0 bg-black/70"></div>
                <X className="w-6 h-6 relative z-10" />
              </button>
            </div>
          </div>
        </div>

        {/* Channel Info Panel */}
        {showInfo && (
          <div className={`absolute top-20 right-4 z-20 w-80 rounded-lg relative overflow-hidden border border-white/20 transition-all duration-300`}
               style={buttonBackgroundStyle}>
            <div className="absolute inset-0 bg-black/80"></div>
            <div className="relative z-10 p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Tv className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-bold">Channel Information</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-400">Channel:</span>
                  <span className="ml-2 font-medium">{channel.name}</span>
                </div>
                <div>
                  <span className="text-slate-400">Category:</span>
                  <span className="ml-2 font-medium capitalize">{channel.category}</span>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <span className={`ml-2 font-medium ${connectionStatus === 'connected' ? 'text-green-400' : connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'}`}>
                    {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Quality:</span>
                  <span className="ml-2 font-medium">Auto</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Container */}
        <div className="relative w-full h-full bg-black">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <div className="relative mb-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
                  <Tv className="w-8 h-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400" />
                </div>
                <p className="text-xl font-semibold mb-2">Connecting to Live TV</p>
                <p className="text-slate-400">Tuning into {channel.name}...</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Signal className="w-4 h-4 text-yellow-400 animate-pulse" />
                  <span className="text-sm text-yellow-400">Establishing connection</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white max-w-md">
                <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-4">Signal Lost</h3>
                <p className="text-slate-400 mb-6 text-sm leading-relaxed">{error}</p>
                <div className="space-y-4">
                  <button
                    onClick={retryConnection}
                    className="px-8 py-3 rounded-lg transition-all flex items-center gap-3 mx-auto relative overflow-hidden border border-white/20 hover:scale-105"
                    style={buttonBackgroundStyle}
                  >
                    <div className="absolute inset-0 bg-blue-600/80"></div>
                    <RefreshCw className="w-5 h-5 relative z-10" />
                    <span className="font-medium relative z-10">Reconnect</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="px-8 py-3 rounded-lg transition-all flex items-center gap-3 mx-auto relative overflow-hidden border border-white/20"
                    style={buttonBackgroundStyle}
                  >
                    <div className="absolute inset-0 bg-black/70"></div>
                    <ArrowLeft className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Back to Channels</span>
                  </button>
                  <p className="text-xs text-slate-500 mt-4">
                    Live channels may experience temporary interruptions
                  </p>
                </div>
              </div>
            </div>
          )}

          {!error && (
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onLoadedMetadata={() => {
                const video = videoRef.current;
                if (video) {
                  video.volume = volume;
                  video.muted = isMuted;
                }
              }}
              onCanPlay={() => {
                setIsLoading(false);
                setCanPlay(true);
                setConnectionStatus('connected');
              }}
              onError={() => {
                setError('Live stream playback error - Channel may be offline');
                setIsLoading(false);
                setConnectionStatus('disconnected');
              }}
              crossOrigin="anonymous"
              playsInline
              muted={false}
            />
          )}

          {/* Live TV Controls */}
          {!error && !isLoading && canPlay && (
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center justify-between p-6">
                {/* Left Controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlay}
                    className="text-white hover:text-blue-400 transition-all p-3 rounded-full relative overflow-hidden border border-white/20 hover:scale-110"
                    disabled={!canPlay}
                    style={buttonBackgroundStyle}
                  >
                    <div className="absolute inset-0 bg-black/70"></div>
                    {isPlaying ? <Pause className="w-8 h-8 relative z-10" /> : <Play className="w-8 h-8 relative z-10" />}
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleMute}
                      className="text-white hover:text-blue-400 transition-all p-2 rounded relative overflow-hidden border border-white/20"
                      style={buttonBackgroundStyle}
                    >
                      <div className="absolute inset-0 bg-black/70"></div>
                      {isMuted ? <VolumeX className="w-6 h-6 relative z-10" /> : <Volume2 className="w-6 h-6 relative z-10" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-24 accent-blue-500"
                    />
                  </div>
                </div>

                {/* Center Info */}
                <div className="text-center text-white">
                  <div className="flex items-center gap-3 justify-center mb-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-lg font-bold">LIVE TV</span>
                    {getSignalIcon()}
                  </div>
                  <p className="text-sm text-slate-300">{channel.name}</p>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="text-white hover:text-blue-400 transition-all p-2 rounded relative overflow-hidden border border-white/20"
                    style={buttonBackgroundStyle}
                  >
                    <div className="absolute inset-0 bg-black/70"></div>
                    <Info className="w-6 h-6 relative z-10" />
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-blue-400 transition-all p-2 rounded relative overflow-hidden border border-white/20"
                    style={buttonBackgroundStyle}
                  >
                    <div className="absolute inset-0 bg-black/70"></div>
                    {isFullscreen ? <Minimize className="w-6 h-6 relative z-10" /> : <Maximize className="w-6 h-6 relative z-10" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Large Play Button for Initial Play */}
          {!error && !isLoading && canPlay && !isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={togglePlay}
                className="text-white p-8 rounded-full transition-all hover:scale-110 relative overflow-hidden border-2 border-white/30"
                style={buttonBackgroundStyle}
              >
                <div className="absolute inset-0 bg-black/70"></div>
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <Play className="w-20 h-20 ml-2" />
                  <span className="text-lg font-semibold">Start Live TV</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;