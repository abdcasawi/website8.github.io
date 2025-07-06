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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  
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
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'resolving' | 'buffering'>('connecting');
  const [showInfo, setShowInfo] = useState(false);
  const [streamType, setStreamType] = useState<'direct' | 'hls' | 'php' | 'iframe'>('direct');
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

  // Auto-hide controls with mouse movement detection
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
    const handleTouch = () => resetTimeout();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('touchstart', handleTouch);

    resetTimeout();

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('touchstart', handleTouch);
    };
  }, [isPlaying, error, isLoading]);

  // Monitor buffer health
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateBufferHealth = () => {
      try {
        const buffered = video.buffered;
        if (buffered.length > 0) {
          const currentTime = video.currentTime;
          const bufferedEnd = buffered.end(buffered.length - 1);
          const bufferAhead = bufferedEnd - currentTime;
          setBufferHealth(Math.min(bufferAhead, 30)); // Max 30 seconds
        }
      } catch (e) {
        // Ignore buffer health errors
      }
    };

    const interval = setInterval(updateBufferHealth, 1000);
    return () => clearInterval(interval);
  }, [canPlay]);

  // Enhanced stream resolution for PHP and complex URLs
  const resolveStreamUrl = useCallback(async (url: string): Promise<{ url: string; type: 'direct' | 'hls' | 'php' | 'iframe' }> => {
    console.log('Resolving stream URL:', url);
    
    // Detect stream type
    if (url.includes('.m3u8')) {
      return { url, type: 'hls' };
    }
    
    if (url.includes('.php')) {
      setConnectionStatus('resolving');
      setStreamType('php');
      
      try {
        // Method 1: Try CORS proxy
        const proxyUrls = [
          `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
          `https://cors-anywhere.herokuapp.com/${url}`,
          `https://thingproxy.freeboard.io/fetch/${url}`
        ];

        for (const proxyUrl of proxyUrls) {
          try {
            console.log('Trying proxy:', proxyUrl);
            const response = await fetch(proxyUrl, {
              method: 'GET',
              headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              },
              signal: AbortSignal.timeout(10000)
            });
            
            if (response.ok) {
              const data = await response.json();
              const html = data.contents || data.response;
              
              // Extract various stream URLs
              const patterns = [
                /https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/gi,
                /https?:\/\/[^"'\s]+\.mp4[^"'\s]*/gi,
                /https?:\/\/[^"'\s]+\.ts[^"'\s]*/gi,
                /"(https?:\/\/[^"]+\.m3u8[^"]*)"/gi,
                /'(https?:\/\/[^']+\.m3u8[^']*)'/gi,
                /src\s*=\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)/gi
              ];
              
              for (const pattern of patterns) {
                const matches = html.match(pattern);
                if (matches && matches.length > 0) {
                  const extractedUrl = matches[0].replace(/['"]/g, '');
                  console.log('Extracted stream URL:', extractedUrl);
                  return { url: extractedUrl, type: extractedUrl.includes('.m3u8') ? 'hls' : 'direct' };
                }
              }
            }
          } catch (proxyError) {
            console.log('Proxy failed:', proxyError);
            continue;
          }
        }

        // Method 2: Try iframe approach
        console.log('Trying iframe method for PHP stream');
        return { url, type: 'iframe' };
        
      } catch (error) {
        console.error('PHP resolution failed:', error);
        return { url, type: 'php' };
      }
    }
    
    return { url, type: 'direct' };
  }, []);

  // Get appropriate strategies based on stream type
  const getStrategiesForStreamType = useCallback((resolvedUrl: string, type: 'direct' | 'hls' | 'php' | 'iframe') => {
    const strategies = [];

    // Strategy 1: HLS.js for .m3u8 streams or HLS type
    if (resolvedUrl.includes('.m3u8') || type === 'hls') {
      strategies.push({
        name: 'HLS.js Enhanced',
        execute: async () => {
          console.log('Loading with Enhanced HLS.js strategy');
          
          // Check if video element exists
          if (!videoRef.current) {
            throw new Error('Video element not available');
          }

          const { default: Hls } = await import('hls.js');
          
          if (!Hls.isSupported()) {
            throw new Error('HLS.js not supported');
          }

          const hls = new Hls({
            enableWorker: false,
            lowLatencyMode: false,
            backBufferLength: 90,
            maxBufferLength: 30,
            maxMaxBufferLength: 600,
            maxBufferSize: 60 * 1000 * 1000,
            maxBufferHole: 0.5,
            highBufferWatchdogPeriod: 2,
            nudgeOffset: 0.1,
            nudgeMaxRetry: 3,
            maxFragLookUpTolerance: 0.25,
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 10,
            liveDurationInfinity: true,
            enableSoftwareAES: true,
            manifestLoadingTimeOut: 20000,
            manifestLoadingMaxRetry: 4,
            manifestLoadingRetryDelay: 1000,
            fragLoadingTimeOut: 20000,
            fragLoadingMaxRetry: 6,
            fragLoadingRetryDelay: 1000,
            startFragPrefetch: true,
            testBandwidth: false,
            progressive: false,
            xhrSetup: (xhr: XMLHttpRequest, url: string) => {
              xhr.withCredentials = false;
              xhr.timeout = 20000;
              
              // Enhanced headers for better compatibility
              xhr.setRequestHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
              xhr.setRequestHeader('Accept', '*/*');
              xhr.setRequestHeader('Accept-Language', 'en-US,en;q=0.9');
              xhr.setRequestHeader('Accept-Encoding', 'gzip, deflate, br');
              xhr.setRequestHeader('Cache-Control', 'no-cache');
              xhr.setRequestHeader('Pragma', 'no-cache');
              
              // Domain-specific headers
              if (url.includes('akamaized.net')) {
                xhr.setRequestHeader('Origin', 'https://www.raiplay.it');
                xhr.setRequestHeader('Referer', 'https://www.raiplay.it/');
              } else if (url.includes('elahmad.com')) {
                xhr.setRequestHeader('Referer', 'https://www.elahmad.com/');
                xhr.setRequestHeader('Origin', 'https://www.elahmad.com');
              } else if (url.includes('rai.it')) {
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
              if (!resolved && hls) {
                hls.off(Hls.Events.MANIFEST_PARSED);
                hls.off(Hls.Events.ERROR);
                hls.off(Hls.Events.FRAG_LOADED);
                hls.off(Hls.Events.LEVEL_LOADED);
              }
            };

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (!resolved) {
                manifestParsed = true;
                setLoadingProgress(70);
                console.log('HLS manifest parsed successfully');
              }
            });

            hls.on(Hls.Events.LEVEL_LOADED, () => {
              if (!resolved && manifestParsed) {
                resolved = true;
                cleanup();
                setLoadingProgress(90);
                console.log('HLS level loaded successfully');
                resolve();
              }
            });

            hls.on(Hls.Events.FRAG_LOADED, () => {
              setConnectionStatus('connected');
              setLoadingProgress(100);
              if (!resolved && manifestParsed) {
                resolved = true;
                cleanup();
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
                    errorMsg = 'Stream manifest not accessible - May be geo-blocked or offline';
                  } else if (data.details === Hls.ErrorDetails.FRAG_LOAD_ERROR) {
                    errorMsg = 'Stream fragments not accessible - Connection issue';
                  } else {
                    errorMsg = 'Network error - Stream may be offline or geo-blocked';
                  }
                } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                  errorMsg = 'Media format error - Stream may be corrupted';
                } else if (data.type === Hls.ErrorTypes.MUX_ERROR) {
                  errorMsg = 'Stream multiplexing error';
                }
                
                reject(new Error(errorMsg));
              } else if (!data.fatal) {
                // Non-fatal error, try to recover
                console.log('Non-fatal HLS error, attempting recovery:', data.details);
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
              // Double-check video element exists before attaching
              if (!videoRef.current) {
                throw new Error('Video element not available for HLS attachment');
              }
              
              hls.loadSource(resolvedUrl);
              hls.attachMedia(videoRef.current);
              setLoadingProgress(50);
            } catch (hlsError) {
              if (!resolved) {
                resolved = true;
                cleanup();
                reject(new Error(`HLS setup failed: ${hlsError}`));
              }
            }
            
            // Extended timeout for problematic streams
            setTimeout(() => {
              if (!resolved) {
                resolved = true;
                cleanup();
                reject(new Error('HLS loading timeout - Stream may be slow or inaccessible'));
              }
            }, 30000);
          });
        }
      });
    }

    // Strategy 2: Native video element with enhanced headers
    if (type === 'direct' || type === 'hls' || type === 'php') {
      strategies.push({
        name: 'Native Video Enhanced',
        execute: async () => {
          console.log('Loading with enhanced native video strategy');
          
          // Check if video element exists
          const video = videoRef.current;
          if (!video) {
            throw new Error('Video element not available');
          }
          
          // Clear any existing source
          video.src = '';
          video.load();
          
          // Enhanced video element setup
          video.crossOrigin = 'anonymous';
          video.preload = 'metadata';
          
          // Set source with enhanced error handling
          video.src = resolvedUrl;
          setLoadingProgress(60);
          
          return new Promise<void>((resolve, reject) => {
            let resolved = false;
            
            const handleCanPlay = () => {
              if (!resolved) {
                resolved = true;
                console.log('Native video can play');
                cleanup();
                setLoadingProgress(100);
                resolve();
              }
            };
            
            const handleLoadedData = () => {
              if (!resolved) {
                resolved = true;
                console.log('Native video loaded data successfully');
                cleanup();
                setLoadingProgress(100);
                resolve();
              }
            };
            
            const handleError = (e: any) => {
              if (!resolved) {
                resolved = true;
                console.log('Native video loading failed:', e);
                cleanup();
                
                let errorMsg = 'Native video loading failed';
                if (video.error) {
                  switch (video.error.code) {
                    case MediaError.MEDIA_ERR_ABORTED:
                      errorMsg = 'Video loading aborted';
                      break;
                    case MediaError.MEDIA_ERR_NETWORK:
                      errorMsg = 'Network error - Stream may be offline or geo-blocked';
                      break;
                    case MediaError.MEDIA_ERR_DECODE:
                      errorMsg = 'Video decode error - Unsupported format';
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
              video.removeEventListener('loadeddata', handleLoadedData);
              video.removeEventListener('error', handleError);
            };

            video.addEventListener('canplay', handleCanPlay);
            video.addEventListener('loadeddata', handleLoadedData);
            video.addEventListener('error', handleError);
            
            // Start loading
            video.load();
            
            setTimeout(() => {
              if (!resolved) {
                resolved = true;
                cleanup();
                reject(new Error('Native video timeout'));
              }
            }, 20000);
          });
        }
      });
    }

    // Strategy 3: Iframe (only for PHP streams that need iframe embedding)
    if (type === 'iframe' || type === 'php') {
      strategies.push({
        name: 'Iframe',
        execute: async () => {
          console.log('Loading with iframe strategy');
          setStreamType('iframe');
          
          return new Promise<void>((resolve, reject) => {
            const iframe = iframeRef.current;
            if (!iframe) {
              reject(new Error('Iframe not available'));
              return;
            }

            iframe.style.display = 'block';
            iframe.src = resolvedUrl;
            setLoadingProgress(80);
            
            const handleLoad = () => {
              console.log('Iframe loaded successfully');
              iframe.removeEventListener('load', handleLoad);
              iframe.removeEventListener('error', handleError);
              setLoadingProgress(100);
              resolve();
            };
            
            const handleError = () => {
              console.log('Iframe loading failed');
              iframe.removeEventListener('load', handleLoad);
              iframe.removeEventListener('error', handleError);
              reject(new Error('Iframe loading failed'));
            };

            iframe.addEventListener('load', handleLoad);
            iframe.addEventListener('error', handleError);
            
            setTimeout(() => {
              iframe.removeEventListener('load', handleLoad);
              iframe.removeEventListener('error', handleError);
              reject(new Error('Iframe loading timeout'));
            }, 15000);
          });
        }
      });
    }

    return strategies;
  }, []);

  // Enhanced video loading with dynamic strategy selection
  const loadVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video) {
      console.error('Video element not available for loading');
      setError('Video player not initialized');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setCanPlay(false);
      setConnectionStatus('connecting');
      setLoadingProgress(0);

      // Clean up previous instances
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch (e) {
          console.log('Error destroying previous HLS instance:', e);
        }
        hlsRef.current = null;
      }

      // Clear retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      // Hide iframe
      if (iframeRef.current) {
        iframeRef.current.style.display = 'none';
        iframeRef.current.src = '';
      }

      console.log('Loading stream:', channel.streamUrl);
      setLoadingProgress(20);

      // Resolve stream URL
      const { url: resolvedUrl, type } = await resolveStreamUrl(channel.streamUrl);
      setStreamType(type);
      setLoadingProgress(40);

      console.log('Resolved URL:', resolvedUrl, 'Type:', type);

      // Get appropriate strategies for this stream type
      const strategies = getStrategiesForStreamType(resolvedUrl, type);
      
      if (strategies.length === 0) {
        throw new Error('No suitable loading strategies available for this stream type');
      }

      // Try strategies in order
      let lastError = null;
      let success = false;
      
      for (let i = 0; i < strategies.length && !success; i++) {
        try {
          console.log(`Trying strategy ${i + 1}/${strategies.length}: ${strategies[i].name}`);
          await strategies[i].execute();
          
          // Success
          setIsLoading(false);
          setCanPlay(true);
          setConnectionStatus('connected');
          setLoadingProgress(100);
          console.log(`Stream loaded successfully with strategy: ${strategies[i].name}`);
          success = true;
          
          // Auto-play for video streams (not iframe)
          if (streamType !== 'iframe' && video) {
            try {
              video.volume = volume;
              video.muted = isMuted;
              await video.play();
              setIsPlaying(true);
            } catch (playError) {
              console.log('Auto-play prevented:', playError);
            }
          } else {
            setCanPlay(true);
            setIsPlaying(true); // Assume iframe is playing
          }
          
        } catch (strategyError) {
          console.log(`Strategy ${strategies[i].name} failed:`, strategyError);
          lastError = strategyError;
          
          // Cleanup before next strategy
          if (hlsRef.current) {
            try {
              hlsRef.current.destroy();
            } catch (e) {
              console.log('Error destroying HLS:', e);
            }
            hlsRef.current = null;
          }
          
          if (iframeRef.current) {
            iframeRef.current.style.display = 'none';
            iframeRef.current.src = '';
          }
          
          if (video) {
            video.src = '';
            video.load();
          }
          
          // Wait before next strategy
          if (i < strategies.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }

      if (!success) {
        throw lastError || new Error('All loading strategies failed');
      }

    } catch (err) {
      console.error('Stream loading error:', err);
      
      let errorMessage = 'Failed to load live stream';
      if (channel.streamUrl.includes('akamaized.net')) {
        errorMessage = 'Stream may be geo-blocked or require specific access permissions';
      } else if (channel.streamUrl.includes('.php')) {
        errorMessage = 'PHP stream temporarily unavailable - Server may be restricting access';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setIsLoading(false);
      setConnectionStatus('disconnected');
      setLoadingProgress(0);
      
      // Auto-retry logic with exponential backoff
      if (retryCount < 3) {
        const retryDelay = Math.min(5000 * Math.pow(2, retryCount), 20000);
        console.log(`Auto-retry in ${retryDelay/1000} seconds (attempt ${retryCount + 1}/3)`);
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, retryDelay);
      }
    }
  }, [channel.streamUrl, retryCount, resolveStreamUrl, volume, isMuted, streamType, getStrategiesForStreamType]);

  // Load video on mount and URL change
  useEffect(() => {
    // Add a small delay to ensure video element is mounted
    const timer = setTimeout(() => {
      loadVideo();
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
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [loadVideo]);

  const togglePlay = async () => {
    if (streamType === 'iframe') {
      // For iframe streams, we can't control playback
      setIsPlaying(!isPlaying);
      return;
    }

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
      setError('Unable to control playback - Stream may be offline');
    }
  };

  const toggleMute = () => {
    if (streamType === 'iframe') return;
    
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (streamType === 'iframe') return;
    
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleFullscreen = () => {
    const container = streamType === 'iframe' ? iframeRef.current : videoRef.current;
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
    setIsLoading(true);
    setRetryCount(0);
    setCanPlay(false);
    setConnectionStatus('connecting');
    setLoadingProgress(0);
    
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch (e) {
        console.log('Error destroying HLS on retry:', e);
      }
      hlsRef.current = null;
    }
    
    if (iframeRef.current) {
      iframeRef.current.style.display = 'none';
      iframeRef.current.src = '';
    }
    
    const video = videoRef.current;
    if (video) {
      video.src = '';
      video.load();
    }
    
    // Trigger reload
    setTimeout(() => {
      loadVideo();
    }, 500);
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
      case 'resolving':
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
      case 'resolving':
        return 'Resolving';
      case 'buffering':
        return 'Buffering';
      case 'disconnected':
        return 'Offline';
    }
  };

  const getStreamTypeDisplay = () => {
    switch (streamType) {
      case 'hls':
        return 'HLS Stream';
      case 'php':
        return 'PHP Stream';
      case 'iframe':
        return 'Embedded Stream';
      case 'direct':
        return 'Direct Stream';
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="relative w-full h-full">
        {/* Enhanced Header */}
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

            {/* Enhanced Channel Info */}
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

        {/* Enhanced Info Panel */}
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
                  <span className="ml-2 font-medium">{getStreamTypeDisplay()}</span>
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
                {isLoading && (
                  <div>
                    <span className="text-slate-400">Progress:</span>
                    <span className="ml-2 font-medium">{loadingProgress}%</span>
                  </div>
                )}
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
                  {connectionStatus === 'resolving' ? 'Resolving Stream' : 
                   connectionStatus === 'buffering' ? 'Buffering' : 'Connecting to Live TV'}
                </p>
                <p className="text-slate-400 mb-4">Loading {channel.name}...</p>
                
                {/* Progress indicator */}
                <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-center gap-2 mb-4">
                  {getSignalIcon()}
                  <span className="text-sm text-yellow-400">
                    {connectionStatus === 'resolving' ? 'Resolving stream source' : 
                     connectionStatus === 'buffering' ? 'Buffering content' : 'Establishing connection'}
                  </span>
                </div>
                
                {channel.streamUrl.includes('akamaized.net') && (
                  <p className="text-xs text-slate-500 max-w-sm">
                    Akamai CDN streams may require specific access permissions or be geo-blocked
                  </p>
                )}
                
                {channel.streamUrl.includes('.php') && (
                  <p className="text-xs text-slate-500 max-w-sm">
                    PHP-based streams require additional processing and may take longer to load
                  </p>
                )}
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
                  <p className="text-xs text-slate-500 mt-4">
                    {channel.streamUrl.includes('akamaized.net') 
                      ? 'Akamai CDN streams may be geo-blocked or require specific access permissions'
                      : channel.streamUrl.includes('.php') 
                      ? 'PHP streams may have server restrictions or require specific access methods'
                      : 'Live channels may experience temporary interruptions'
                    }
                  </p>
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
          {!error && streamType !== 'iframe' && (
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onWaiting={() => setConnectionStatus('buffering')}
              onPlaying={() => setConnectionStatus('connected')}
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
                if (!error) {
                  setError('Stream playback error - Channel may be offline');
                  setIsLoading(false);
                  setConnectionStatus('disconnected');
                }
              }}
              crossOrigin="anonymous"
              playsInline
              muted={false}
            />
          )}

          {/* Iframe Element for PHP streams */}
          {!error && streamType === 'iframe' && (
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              style={{ display: 'none' }}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          )}

          {/* Enhanced Controls */}
          {!error && !isLoading && canPlay && (
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center justify-between p-6">
                {/* Left Controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlay}
                    className="text-white hover:text-blue-400 transition-all p-3 rounded-full relative overflow-hidden border border-white/20 hover:scale-110"
                    disabled={!canPlay}
                    style={buttonBackgroundStyle}
                  >
                    <div className="absolute inset-0 bg-black/60"></div>
                    {isPlaying ? <Pause className="w-8 h-8 relative z-10" /> : <Play className="w-8 h-8 relative z-10" />}
                  </button>

                  {streamType !== 'iframe' && (
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
                  )}
                </div>

                {/* Center Info */}
                <div className="text-center text-white">
                  <div className="flex items-center gap-3 justify-center mb-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-lg font-bold">LIVE TV</span>
                    {getSignalIcon()}
                  </div>
                  <p className="text-sm text-slate-300">{channel.name}</p>
                  <p className="text-xs text-slate-400">{getStreamTypeDisplay()}</p>
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

          {/* Large Play Button for Initial Play */}
          {!error && !isLoading && canPlay && !isPlaying && streamType !== 'iframe' && (
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