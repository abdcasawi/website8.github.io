import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, AlertCircle, RefreshCw, ArrowLeft, Info, Settings, Tv, Signal, Clock, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Channel } from '../types';

interface VideoPlayerProps {
  channel: Channel;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ channel, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [canPlay, setCanPlay] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'buffering'>('connecting');
  const [showInfo, setShowInfo] = useState(false);
  const [streamType, setStreamType] = useState<'hls' | 'direct' | 'unknown'>('unknown');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [bufferHealth, setBufferHealth] = useState(0);

  const buttonBackgroundStyle = {
    backgroundImage: 'url(/background1.jpg)',
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
        if (isPlaying && !error && !isLoading) {
          setShowControls(false);
        }
      }, 4000);
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
  }, [isPlaying, error, isLoading]);

  // Monitor buffer health
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !canPlay) return;

    const updateBufferHealth = () => {
      try {
        const buffered = video.buffered;
        if (buffered.length > 0) {
          const currentTime = video.currentTime;
          const bufferedEnd = buffered.end(buffered.length - 1);
          const bufferAhead = bufferedEnd - currentTime;
          setBufferHealth(Math.min(bufferAhead, 30));
        }
      } catch (e) {
        // Ignore buffer health errors
      }
    };

    const interval = setInterval(updateBufferHealth, 1000);
    return () => clearInterval(interval);
  }, [canPlay]);

  // Enhanced stream loading with multiple strategies
  const loadStream = useCallback(async () => {
    const video = videoRef.current;
    if (!video) {
      setError('Video player not initialized');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setCanPlay(false);
      setConnectionStatus('connecting');
      setLoadingProgress(10);

      // Clean up previous instances
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch (e) {
          console.log('Error destroying HLS:', e);
        }
        hlsRef.current = null;
      }

      // Reset video
      video.src = '';
      video.load();

      const streamUrl = channel.streamUrl;
      console.log('Loading stream:', streamUrl);
      setLoadingProgress(20);

      // Determine stream type
      const isHLS = streamUrl.includes('.m3u8');
      setStreamType(isHLS ? 'hls' : 'direct');

      if (isHLS) {
        // Try HLS.js first
        try {
          await loadWithHLS(streamUrl);
        } catch (hlsError) {
          console.log('HLS.js failed, trying native:', hlsError);
          // Fallback to native video
          await loadWithNative(streamUrl);
        }
      } else {
        // Try native video for direct streams
        await loadWithNative(streamUrl);
      }

    } catch (err) {
      console.error('Stream loading failed:', err);
      handleStreamError(err);
    }
  }, [channel.streamUrl]);

  // HLS.js loading strategy
  const loadWithHLS = useCallback(async (url: string) => {
    const video = videoRef.current;
    if (!video) throw new Error('Video element not available');

    const { default: Hls } = await import('hls.js');
    
    if (!Hls.isSupported()) {
      throw new Error('HLS.js not supported in this browser');
    }

    setLoadingProgress(40);

    const hls = new Hls({
      enableWorker: false,
      lowLatencyMode: false,
      backBufferLength: 90,
      maxBufferLength: 30,
      maxMaxBufferLength: 600,
      maxBufferSize: 60 * 1000 * 1000,
      maxBufferHole: 0.5,
      nudgeOffset: 0.1,
      nudgeMaxRetry: 3,
      manifestLoadingTimeOut: 20000,
      manifestLoadingMaxRetry: 3,
      manifestLoadingRetryDelay: 1000,
      fragLoadingTimeOut: 20000,
      fragLoadingMaxRetry: 3,
      fragLoadingRetryDelay: 1000,
      xhrSetup: (xhr: XMLHttpRequest, url: string) => {
        xhr.withCredentials = false;
        xhr.timeout = 20000;
        xhr.setRequestHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        xhr.setRequestHeader('Accept', '*/*');
        xhr.setRequestHeader('Accept-Language', 'en-US,en;q=0.9');
        
        // Domain-specific headers
        if (url.includes('akamaized.net') || url.includes('rai.it')) {
          xhr.setRequestHeader('Origin', 'https://www.raiplay.it');
          xhr.setRequestHeader('Referer', 'https://www.raiplay.it/');
        }
      }
    });

    hlsRef.current = hls;

    return new Promise<void>((resolve, reject) => {
      let resolved = false;
      let manifestParsed = false;

      const cleanup = () => {
        if (hls && !resolved) {
          hls.off(Hls.Events.MANIFEST_PARSED);
          hls.off(Hls.Events.LEVEL_LOADED);
          hls.off(Hls.Events.FRAG_LOADED);
          hls.off(Hls.Events.ERROR);
        }
      };

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!resolved) {
          manifestParsed = true;
          setLoadingProgress(70);
          console.log('HLS manifest parsed');
        }
      });

      hls.on(Hls.Events.LEVEL_LOADED, () => {
        if (!resolved && manifestParsed) {
          resolved = true;
          cleanup();
          setLoadingProgress(90);
          setCanPlay(true);
          setConnectionStatus('connected');
          console.log('HLS stream ready');
          resolve();
        }
      });

      hls.on(Hls.Events.FRAG_LOADED, () => {
        setConnectionStatus('connected');
        setLoadingProgress(100);
        if (!resolved && manifestParsed) {
          resolved = true;
          cleanup();
          setCanPlay(true);
          resolve();
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        
        if (data.fatal && !resolved) {
          resolved = true;
          cleanup();
          
          let errorMsg = 'HLS streaming error';
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR) {
              errorMsg = 'Stream not accessible - May be geo-blocked';
            } else {
              errorMsg = 'Network error - Stream may be offline';
            }
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            errorMsg = 'Media format error';
          }
          
          reject(new Error(errorMsg));
        } else if (!data.fatal) {
          // Try to recover from non-fatal errors
          try {
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            }
          } catch (recoveryError) {
            console.error('HLS recovery failed:', recoveryError);
          }
        }
      });

      try {
        hls.loadSource(url);
        hls.attachMedia(video);
        setLoadingProgress(60);
      } catch (hlsError) {
        if (!resolved) {
          resolved = true;
          cleanup();
          reject(new Error(`HLS setup failed: ${hlsError}`));
        }
      }

      // Timeout
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          reject(new Error('HLS loading timeout'));
        }
      }, 30000);
    });
  }, []);

  // Native video loading strategy
  const loadWithNative = useCallback(async (url: string) => {
    const video = videoRef.current;
    if (!video) throw new Error('Video element not available');

    setLoadingProgress(50);

    return new Promise<void>((resolve, reject) => {
      let resolved = false;

      const handleCanPlay = () => {
        if (!resolved) {
          resolved = true;
          cleanup();
          setLoadingProgress(100);
          setCanPlay(true);
          setConnectionStatus('connected');
          console.log('Native video ready');
          resolve();
        }
      };

      const handleError = () => {
        if (!resolved) {
          resolved = true;
          cleanup();
          
          let errorMsg = 'Video loading failed';
          if (video.error) {
            switch (video.error.code) {
              case MediaError.MEDIA_ERR_NETWORK:
                errorMsg = 'Network error - Stream may be offline';
                break;
              case MediaError.MEDIA_ERR_DECODE:
                errorMsg = 'Video decode error';
                break;
              case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMsg = 'Video format not supported';
                break;
              default:
                errorMsg = 'Unknown video error';
            }
          }
          
          reject(new Error(errorMsg));
        }
      };

      const cleanup = () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);

      // Setup video
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      video.src = url;
      video.load();

      setLoadingProgress(70);

      // Timeout
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          reject(new Error('Native video timeout'));
        }
      }, 20000);
    });
  }, []);

  // Handle stream errors
  const handleStreamError = useCallback((err: any) => {
    let errorMessage = 'Failed to load live stream';
    
    if (channel.streamUrl.includes('akamaized.net')) {
      errorMessage = 'Stream may be geo-blocked or require authentication';
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }
    
    setError(errorMessage);
    setIsLoading(false);
    setConnectionStatus('disconnected');
    setLoadingProgress(0);
    
    // Auto-retry with exponential backoff
    if (retryCount < 3) {
      const retryDelay = Math.min(5000 * Math.pow(2, retryCount), 20000);
      console.log(`Auto-retry in ${retryDelay/1000} seconds (attempt ${retryCount + 1}/3)`);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        loadStream();
      }, retryDelay);
    }
  }, [channel.streamUrl, retryCount, loadStream]);

  // Load stream on mount and URL change
  useEffect(() => {
    const timer = setTimeout(() => {
      loadStream();
    }, 100);
    
    return () => {
      clearTimeout(timer);
      
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch (e) {
          console.log('Cleanup error:', e);
        }
        hlsRef.current = null;
      }
    };
  }, [loadStream]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !canPlay) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setConnectionStatus('buffering');
    const handlePlaying = () => setConnectionStatus('connected');
    const handleLoadedMetadata = () => {
      video.volume = volume;
      video.muted = isMuted;
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [canPlay, volume, isMuted]);

  // Auto-play when ready
  useEffect(() => {
    const video = videoRef.current;
    if (canPlay && video && !isPlaying) {
      video.play().catch(err => {
        console.log('Auto-play prevented:', err);
      });
    }
  }, [canPlay, isPlaying]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video || !canPlay) return;

    try {
      if (isPlaying) {
        video.pause();
      } else {
        await video.play();
      }
    } catch (err) {
      console.error('Play/pause error:', err);
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
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
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
    setRetryCount(0);
    loadStream();
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
        return <Wifi className="w-4 h-4 text-green-400" />;
      case 'connecting':
      case 'buffering':
        return <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live';
      case 'connecting':
        return 'Connecting';
      case 'buffering':
        return 'Buffering';
      case 'disconnected':
        return 'Offline';
    }
  };

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="relative w-full h-full">
        {/* Header */}
        <div className={`absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/95 via-black/70 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-between p-4">
            {/* Back Button */}
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-all hover:scale-105 relative overflow-hidden border border-white/20"
              style={buttonBackgroundStyle}
            >
              <div className="absolute inset-0 bg-black/60"></div>
              <ArrowLeft className="w-5 h-5 relative z-10" />
              <span className="font-medium relative z-10">Back</span>
            </button>

            {/* Channel Info */}
            <div 
              className="flex items-center gap-4 text-white px-6 py-3 rounded-lg relative overflow-hidden border border-white/20"
              style={buttonBackgroundStyle}
            >
              <div className="absolute inset-0 bg-black/60"></div>
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
                  <span className="text-xs">{getStatusText()}</span>
                </div>
                {bufferHealth > 0 && (
                  <>
                    <div className="w-px h-6 bg-white/30"></div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-xs">{Math.round(bufferHealth)}s</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Time & Controls */}
            <div className="flex items-center gap-3">
              <div 
                className="text-center text-white px-4 py-2 rounded-lg relative overflow-hidden border border-white/20"
                style={buttonBackgroundStyle}
              >
                <div className="absolute inset-0 bg-black/60"></div>
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
                <div className="absolute inset-0 bg-black/60"></div>
                <Info className="w-5 h-5 relative z-10" />
              </button>

              <button
                onClick={onClose}
                className="p-2 text-white hover:text-red-400 rounded-lg transition-all relative overflow-hidden border border-white/20"
                style={buttonBackgroundStyle}
              >
                <div className="absolute inset-0 bg-black/60"></div>
                <X className="w-6 h-6 relative z-10" />
              </button>
            </div>
          </div>

          {/* Loading Progress Bar */}
          {isLoading && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Info Panel */}
        {showInfo && (
          <div className={`absolute top-20 right-4 z-20 w-80 rounded-lg relative overflow-hidden border border-white/20 transition-all duration-300`}
               style={buttonBackgroundStyle}>
            <div className="absolute inset-0 bg-black/70"></div>
            <div className="relative z-10 p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Tv className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-bold">Stream Information</h3>
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
                  <span className={`ml-2 font-medium ${
                    connectionStatus === 'connected' ? 'text-green-400' : 
                    connectionStatus === 'disconnected' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {getStatusText()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Stream Type:</span>
                  <span className="ml-2 font-medium">{streamType.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-slate-400">Quality:</span>
                  <span className="ml-2 font-medium">Auto</span>
                </div>
                {bufferHealth > 0 && (
                  <div>
                    <span className="text-slate-400">Buffer:</span>
                    <span className="ml-2 font-medium">{Math.round(bufferHealth)}s</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400">Retry Count:</span>
                  <span className="ml-2 font-medium">{retryCount}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Container */}
        <div className="relative w-full h-full bg-black">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white max-w-md">
                <div className="relative mb-6">
                  <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-500 border-t-transparent mx-auto"></div>
                  <Tv className="w-10 h-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400" />
                </div>
                <p className="text-2xl font-semibold mb-2">
                  {connectionStatus === 'buffering' ? 'Buffering' : 'Connecting to Live TV'}
                </p>
                <p className="text-slate-400 mb-4">Loading {channel.name}...</p>
                
                <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-center gap-2 mb-4">
                  {getSignalIcon()}
                  <span className="text-sm text-yellow-400">
                    {connectionStatus === 'buffering' ? 'Buffering content' : 'Establishing connection'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white max-w-md">
                <AlertCircle className="w-24 h-24 text-red-500 mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-4">Stream Unavailable</h3>
                <p className="text-slate-400 mb-6 text-sm leading-relaxed">{error}</p>
                <div className="space-y-4">
                  <button
                    onClick={retryConnection}
                    className="px-8 py-3 rounded-lg transition-all flex items-center gap-3 mx-auto relative overflow-hidden border border-white/20 hover:scale-105"
                    style={buttonBackgroundStyle}
                  >
                    <div className="absolute inset-0 bg-blue-600/80"></div>
                    <RefreshCw className="w-5 h-5 relative z-10" />
                    <span className="font-medium relative z-10">Retry Connection</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="px-8 py-3 rounded-lg transition-all flex items-center gap-3 mx-auto relative overflow-hidden border border-white/20"
                    style={buttonBackgroundStyle}
                  >
                    <div className="absolute inset-0 bg-black/60"></div>
                    <ArrowLeft className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Back to Channels</span>
                  </button>
                  {retryCount < 3 && (
                    <p className="text-xs text-blue-400">
                      Auto-retry in progress... ({retryCount + 1}/3)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Video Element */}
          {!error && (
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              crossOrigin="anonymous"
              playsInline
              muted={false}
            />
          )}

          {/* Controls */}
          {!error && !isLoading && canPlay && (
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center justify-between p-6">
                {/* Left Controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlay}
                    className="text-white hover:text-blue-400 transition-all p-3 rounded-full relative overflow-hidden border border-white/20 hover:scale-110"
                    style={buttonBackgroundStyle}
                  >
                    <div className="absolute inset-0 bg-black/60"></div>
                    {isPlaying ? <Pause className="w-8 h-8 relative z-10" /> : <Play className="w-8 h-8 relative z-10" />}
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleMute}
                      className="text-white hover:text-blue-400 transition-all p-2 rounded relative overflow-hidden border border-white/20"
                      style={buttonBackgroundStyle}
                    >
                      <div className="absolute inset-0 bg-black/60"></div>
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
                  <p className="text-xs text-slate-400">{streamType.toUpperCase()} Stream</p>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="text-white hover:text-blue-400 transition-all p-2 rounded relative overflow-hidden border border-white/20"
                    style={buttonBackgroundStyle}
                  >
                    <div className="absolute inset-0 bg-black/60"></div>
                    <Info className="w-6 h-6 relative z-10" />
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-blue-400 transition-all p-2 rounded relative overflow-hidden border border-white/20"
                    style={buttonBackgroundStyle}
                  >
                    <div className="absolute inset-0 bg-black/60"></div>
                    {isFullscreen ? <Minimize className="w-6 h-6 relative z-10" /> : <Maximize className="w-6 h-6 relative z-10" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Large Play Button */}
          {!error && !isLoading && canPlay && !isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={togglePlay}
                className="text-white p-8 rounded-full transition-all hover:scale-110 relative overflow-hidden border-2 border-white/30"
                style={buttonBackgroundStyle}
              >
                <div className="absolute inset-0 bg-black/60"></div>
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