import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, AlertCircle, RefreshCw, ArrowLeft, Info, Loader2, Wifi, WifiOff, Tv } from 'lucide-react';
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
  const [canPlay, setCanPlay] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'buffering'>('connecting');
  const [showInfo, setShowInfo] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [streamType, setStreamType] = useState<'hls' | 'direct' | 'rai'>('direct');
  const [playerType, setPlayerType] = useState<'native' | 'hlsjs' | 'unknown'>('unknown');
  const [resolvedUrl, setResolvedUrl] = useState<string>('');

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

  // Check if browser supports HLS natively
  const supportsNativeHLS = useCallback(() => {
    const video = document.createElement('video');
    return video.canPlayType('application/vnd.apple.mpegurl') !== '' ||
           video.canPlayType('application/x-mpegURL') !== '';
  }, []);

  // Resolve RAI relinker URLs
  const resolveRaiUrl = useCallback(async (url: string): Promise<string> => {
    try {
      console.log('Resolving RAI relinker URL:', url);
      
      // Create a proxy request to avoid CORS issues
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'raiplayappletv',
          'Accept': '*/*',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const resolvedUrl = response.url;
      console.log('RAI URL resolved to:', resolvedUrl);
      
      // If the response is a redirect, get the final URL
      if (resolvedUrl && resolvedUrl !== proxyUrl) {
        return resolvedUrl;
      }

      // Try alternative resolution method
      const text = await response.text();
      
      // Look for m3u8 URLs in the response
      const m3u8Match = text.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/);
      if (m3u8Match) {
        console.log('Found m3u8 URL in response:', m3u8Match[0]);
        return m3u8Match[0];
      }

      // Try direct URL construction for RAI
      const contMatch = url.match(/cont=(\d+)/);
      if (contMatch) {
        const cont = contMatch[1];
        const directUrl = `https://mediapolis.rai.it/relinker/relinkerServlet.htm?cont=${cont}&output=7&forceUserAgent=raiplayappletv`;
        console.log('Trying direct RAI URL:', directUrl);
        return directUrl;
      }

      throw new Error('Could not resolve RAI relinker URL');
    } catch (error) {
      console.error('RAI URL resolution failed:', error);
      
      // Fallback: try to construct a direct stream URL
      const contMatch = url.match(/cont=(\d+)/);
      if (contMatch) {
        const cont = contMatch[1];
        // Try known RAI stream patterns
        const fallbackUrls = [
          `https://mediapolis.rai.it/relinker/relinkerServlet.htm?cont=${cont}&output=7`,
          `https://mediapolis.rai.it/relinker/relinkerServlet.htm?cont=${cont}&output=25`,
          `https://relinker.rai.it/relinkerServlet.htm?cont=${cont}&output=7`,
        ];
        
        console.log('Trying fallback URLs:', fallbackUrls);
        return fallbackUrls[0]; // Return first fallback
      }
      
      throw error;
    }
  }, []);

  // Load stream with HLS.js fallback
  const loadStreamWithHLSJS = useCallback(async (url: string) => {
    const video = videoRef.current;
    if (!video) throw new Error('Video element not available');

    try {
      const { default: Hls } = await import('hls.js');
      
      if (!Hls.isSupported()) {
        throw new Error('HLS.js not supported in this browser');
      }

      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: false,
        backBufferLength: 10,
        maxBufferLength: 10,
        maxMaxBufferLength: 15,
        maxBufferSize: 10 * 1000 * 1000,
        maxBufferHole: 1,
        nudgeOffset: 1,
        nudgeMaxRetry: 3,
        manifestLoadingTimeOut: 30000,
        manifestLoadingMaxRetry: 5,
        manifestLoadingRetryDelay: 2000,
        fragLoadingTimeOut: 30000,
        fragLoadingMaxRetry: 5,
        fragLoadingRetryDelay: 2000,
        xhrSetup: (xhr: XMLHttpRequest, requestUrl: string) => {
          xhr.withCredentials = false;
          xhr.timeout = 30000;
          
          // Set headers based on the stream source
          if (requestUrl.includes('rai.it') || requestUrl.includes('mediapolis')) {
            xhr.setRequestHeader('User-Agent', 'raiplayappletv');
            xhr.setRequestHeader('Origin', 'https://www.raiplay.it');
            xhr.setRequestHeader('Referer', 'https://www.raiplay.it/');
          } else {
            xhr.setRequestHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
          }
          
          xhr.setRequestHeader('Accept', '*/*');
          xhr.setRequestHeader('Accept-Language', 'en-US,en;q=0.9');
        }
      });

      hlsRef.current = hls;
      setPlayerType('hlsjs');

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
            console.log('HLS.js manifest parsed');
          }
        });

        hls.on(Hls.Events.LEVEL_LOADED, () => {
          if (!resolved && manifestParsed) {
            resolved = true;
            cleanup();
            setCanPlay(true);
            setConnectionStatus('connected');
            console.log('HLS.js stream ready');
            resolve();
          }
        });

        hls.on(Hls.Events.FRAG_LOADED, () => {
          setConnectionStatus('connected');
          if (!resolved && manifestParsed) {
            resolved = true;
            cleanup();
            setCanPlay(true);
            resolve();
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS.js error:', data);
          
          if (data.fatal && !resolved) {
            resolved = true;
            cleanup();
            
            let errorMsg = 'HLS streaming error';
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR) {
                errorMsg = 'Stream not accessible - May be geo-blocked, offline, or require authentication';
              } else {
                errorMsg = 'Network error - Stream may be offline or unreachable';
              }
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              errorMsg = 'Media format error - Stream may be corrupted or incompatible';
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
              console.error('HLS.js recovery failed:', recoveryError);
            }
          }
        });

        try {
          hls.loadSource(url);
          hls.attachMedia(video);
        } catch (hlsError) {
          if (!resolved) {
            resolved = true;
            cleanup();
            reject(new Error(`HLS.js setup failed: ${hlsError}`));
          }
        }

        // Timeout
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            cleanup();
            reject(new Error('HLS.js loading timeout - Stream may be slow or unavailable'));
          }
        }, 45000);
      });
    } catch (importError) {
      throw new Error(`Failed to load HLS.js: ${importError}`);
    }
  }, []);

  // Load stream with native video
  const loadStreamNative = useCallback((url: string) => {
    const video = videoRef.current;
    if (!video) throw new Error('Video element not available');

    setPlayerType('native');

    return new Promise<void>((resolve, reject) => {
      let resolved = false;

      const handleCanPlay = () => {
        if (!resolved) {
          resolved = true;
          cleanup();
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
                errorMsg = 'Network error - Stream may be offline, geo-blocked, or require authentication';
                break;
              case MediaError.MEDIA_ERR_DECODE:
                errorMsg = 'Video decode error - Format may not be supported';
                break;
              case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMsg = 'Video format not supported by this browser';
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

      // Configure video for RAI streams
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      
      // Set special attributes for RAI streams
      if (url.includes('rai.it') || url.includes('mediapolis')) {
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('playsinline', 'true');
      }
      
      video.src = url;
      video.load();

      // Timeout
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          reject(new Error('Native video timeout - Stream may be slow or unavailable'));
        }
      }, 30000);
    });
  }, []);

  // Main stream loading function
  const loadStream = useCallback(async () => {
    const video = videoRef.current;
    if (!video) {
      setError('Video player not available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setCanPlay(false);
      setConnectionStatus('connecting');

      // Clean up previous HLS instance
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

      let url = channel.streamUrl;
      let finalUrl = url;

      // Check if this is a RAI relinker URL
      const isRaiRelinker = url.includes('mediapolis.rai.it/relinker') || url.includes('relinker.rai.it');
      const isHLS = url.includes('.m3u8');
      
      if (isRaiRelinker) {
        setStreamType('rai');
        console.log('Detected RAI relinker URL, attempting to resolve...');
        
        try {
          finalUrl = await resolveRaiUrl(url);
          setResolvedUrl(finalUrl);
          console.log('RAI URL resolved successfully:', finalUrl);
        } catch (resolveError) {
          console.error('RAI URL resolution failed:', resolveError);
          // Try to use the original URL as fallback
          finalUrl = url;
        }
      } else if (isHLS) {
        setStreamType('hls');
      } else {
        setStreamType('direct');
      }

      console.log(`Loading ${streamType} stream:`, finalUrl);

      // Determine if the final URL is HLS
      const finalIsHLS = finalUrl.includes('.m3u8') || isRaiRelinker;

      if (finalIsHLS) {
        // For HLS streams (including resolved RAI streams), try native first, then HLS.js
        if (supportsNativeHLS()) {
          console.log('Trying native HLS support first...');
          try {
            await loadStreamNative(finalUrl);
            console.log('Native HLS successful');
          } catch (nativeError) {
            console.log('Native HLS failed, trying HLS.js...', nativeError);
            await loadStreamWithHLSJS(finalUrl);
            console.log('HLS.js successful');
          }
        } else {
          console.log('No native HLS support, using HLS.js...');
          await loadStreamWithHLSJS(finalUrl);
          console.log('HLS.js successful');
        }
      } else {
        // For direct streams, use native video
        console.log('Loading direct stream with native video...');
        await loadStreamNative(finalUrl);
        console.log('Native video successful');
      }

      setIsLoading(false);
      setRetryCount(0);

    } catch (err) {
      console.error('Stream loading failed:', err);
      handleStreamError(err);
    }
  }, [channel.streamUrl, supportsNativeHLS, loadStreamNative, loadStreamWithHLSJS, resolveRaiUrl, streamType]);

  // Handle stream errors
  const handleStreamError = useCallback((err: any) => {
    let errorMessage = 'Failed to load stream';
    
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    
    // Add specific guidance for common issues
    if (streamType === 'rai') {
      errorMessage += ' RAI streams may require Italian IP address, specific authentication, or may be temporarily offline.';
    } else if (streamType === 'hls') {
      if (channel.streamUrl.includes('akamaized.net')) {
        errorMessage += ' This stream may have geo-restrictions or authentication requirements.';
      }
      
      if (!supportsNativeHLS()) {
        errorMessage += ' Your browser has limited HLS support.';
      }
    }
    
    setError(errorMessage);
    setIsLoading(false);
    setConnectionStatus('disconnected');
    
    // Auto-retry with exponential backoff
    if (retryCount < 3) {
      const retryDelay = Math.min(5000 * Math.pow(2, retryCount), 20000);
      console.log(`Auto-retry in ${retryDelay/1000} seconds (attempt ${retryCount + 1}/3)`);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        loadStream();
      }, retryDelay);
    }
  }, [streamType, channel.streamUrl, retryCount, loadStream, supportsNativeHLS]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !canPlay) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
      video.volume = volume;
      video.muted = isMuted;
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setConnectionStatus('buffering');
    const handlePlaying = () => setConnectionStatus('connected');

    const handleTimeUpdate = () => {
      setCurrentVideoTime(video.currentTime);
      
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered(bufferedEnd);
      }
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [canPlay, volume, isMuted]);

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

  // Auto-play when ready
  useEffect(() => {
    const video = videoRef.current;
    if (canPlay && video && !isPlaying) {
      video.play().catch(err => {
        console.log('Auto-play prevented:', err);
      });
    }
  }, [canPlay, isPlaying]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canPlay) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            onClose();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canPlay, isFullscreen]);

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
      setError('Failed to play video. Browser may have blocked autoplay or stream is not accessible.');
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    if (newVolume === 0) {
      video.muted = true;
    } else if (isMuted) {
      video.muted = false;
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
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

  const formatDuration = (seconds: number) => {
    if (!isFinite(seconds) || seconds === 0) return 'LIVE';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
        return isFinite(duration) && duration > 0 ? 'Playing' : 'Live';
      case 'connecting':
        return streamType === 'rai' ? 'Resolving RAI URL' : 'Connecting';
      case 'buffering':
        return 'Buffering';
      case 'disconnected':
        return 'Offline';
    }
  };

  const isLiveStream = !isFinite(duration) || duration === 0;

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
                  <span className="text-sm font-bold text-red-400">
                    {streamType === 'rai' ? 'RAI' : isLiveStream ? 'LIVE' : 'VIDEO'}
                  </span>
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
                <div className="w-px h-6 bg-white/30"></div>
                <div className="flex items-center gap-1">
                  <Tv className="w-3 h-3 text-blue-400" />
                  <span className="text-xs">{playerType.toUpperCase()}</span>
                </div>
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
                  <div className="text-xs text-slate-300">
                    {streamType === 'rai' ? 'RAI Player' : isLiveStream ? 'Live TV' : 'Video Player'}
                  </div>
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
                  <span className="text-slate-400">Player:</span>
                  <span className="ml-2 font-medium">{playerType.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-slate-400">Stream Type:</span>
                  <span className="ml-2 font-medium">{streamType.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-slate-400">Original URL:</span>
                  <span className="ml-2 font-medium text-xs break-all">{channel.streamUrl}</span>
                </div>
                {resolvedUrl && resolvedUrl !== channel.streamUrl && (
                  <div>
                    <span className="text-slate-400">Resolved URL:</span>
                    <span className="ml-2 font-medium text-xs break-all text-green-400">{resolvedUrl}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400">Duration:</span>
                  <span className="ml-2 font-medium">{formatDuration(duration)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Native HLS:</span>
                  <span className={`ml-2 font-medium ${supportsNativeHLS() ? 'text-green-400' : 'text-red-400'}`}>
                    {supportsNativeHLS() ? 'Yes' : 'No'}
                  </span>
                </div>
                {buffered > 0 && (
                  <div>
                    <span className="text-slate-400">Buffered:</span>
                    <span className="ml-2 font-medium">{formatDuration(buffered)}</span>
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
                  {streamType === 'rai' ? 'Resolving RAI Stream' : 
                   connectionStatus === 'buffering' ? 'Buffering' : 'Loading Stream'}
                </p>
                <p className="text-slate-400 mb-4">
                  {streamType === 'rai' ? 'Resolving RAI relinker URL...' : `Connecting to ${channel.name}...`}
                </p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getSignalIcon()}
                  <span className="text-sm text-yellow-400">
                    {streamType === 'rai' ? 'Processing RAI redirect' :
                     connectionStatus === 'buffering' ? 'Buffering content' : 'Establishing connection'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {streamType === 'rai' ? 'RAI streams require special handling' :
                   streamType === 'hls' ? 
                    (supportsNativeHLS() ? 'Trying native HLS, fallback to HLS.js' : 'Using HLS.js player') :
                    'Using native video player'
                  }
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white max-w-lg">
                <AlertCircle className="w-24 h-24 text-red-500 mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-4">Stream Unavailable</h3>
                <p className="text-slate-400 mb-6 text-sm leading-relaxed">{error}</p>
                
                {streamType === 'rai' && (
                  <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 mb-6">
                    <h4 className="text-yellow-400 font-semibold mb-2">RAI Stream Notice</h4>
                    <p className="text-xs text-yellow-200 leading-relaxed">
                      RAI streams use special relinker URLs that may require Italian IP addresses or specific authentication. 
                      Some RAI content may only be available within Italy or to authenticated users.
                    </p>
                  </div>
                )}
                
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
                  {retryCount > 0 && retryCount < 3 && (
                    <p className="text-xs text-blue-400">
                      Auto-retry attempt {retryCount}/3
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
              playsInline
              webkit-playsinline="true"
              preload="metadata"
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

                  {/* Time Display */}
                  <div className="text-white text-sm">
                    {formatDuration(currentVideoTime)} / {formatDuration(duration)}
                  </div>
                </div>

                {/* Center Info */}
                <div className="text-center text-white">
                  <div className="flex items-center gap-3 justify-center mb-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-lg font-bold">
                      {streamType === 'rai' ? 'RAI TV' : isLiveStream ? 'LIVE TV' : 'VIDEO'}
                    </span>
                    {getSignalIcon()}
                  </div>
                  <p className="text-sm text-slate-300">{channel.name}</p>
                  <p className="text-xs text-slate-400">{playerType.toUpperCase()} Player</p>
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

              {/* Progress Bar for non-live content */}
              {!isLiveStream && (
                <div className="px-6 pb-2">
                  <div className="w-full bg-gray-600 rounded-full h-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full transition-all duration-200"
                      style={{ width: `${duration > 0 ? (currentVideoTime / duration) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
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
                  <span className="text-lg font-semibold">
                    {streamType === 'rai' ? 'Start RAI Stream' : isLiveStream ? 'Start Live TV' : 'Play Video'}
                  </span>
                  <span className="text-sm text-slate-300">
                    {playerType.toUpperCase()} Player
                  </span>
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