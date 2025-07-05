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
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'resolving'>('connecting');
  const [showInfo, setShowInfo] = useState(false);

  const buttonBackgroundStyle = {
    backgroundImage: 'url(/183887-4146907743.jpg)',
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

  // Enhanced PHP stream resolver
  const resolvePhpStream = async (phpUrl: string): Promise<string> => {
    try {
      console.log('Resolving PHP stream:', phpUrl);
      setConnectionStatus('resolving');
      
      // For elahmad.com PHP streams, we'll try multiple approaches
      if (phpUrl.includes('elahmad.com')) {
        // Method 1: Try to fetch the PHP page and extract stream URL
        try {
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(phpUrl)}`;
          const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const html = data.contents;
            
            // Look for m3u8 URLs in the HTML
            const m3u8Match = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
            if (m3u8Match) {
              console.log('Found m3u8 URL in PHP response:', m3u8Match[0]);
              return m3u8Match[0];
            }
            
            // Look for other video URLs
            const videoMatch = html.match(/https?:\/\/[^"'\s]+\.(mp4|ts|flv)[^"'\s]*/i);
            if (videoMatch) {
              console.log('Found video URL in PHP response:', videoMatch[0]);
              return videoMatch[0];
            }
          }
        } catch (proxyError) {
          console.log('Proxy method failed, trying direct approach');
        }
        
        // Method 2: Try direct iframe approach
        try {
          // Create a hidden iframe to load the PHP page
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = phpUrl;
          document.body.appendChild(iframe);
          
          // Wait for iframe to load and try to extract stream URL
          await new Promise((resolve, reject) => {
            iframe.onload = () => {
              try {
                // Try to access iframe content (may be blocked by CORS)
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (iframeDoc) {
                  const scripts = iframeDoc.getElementsByTagName('script');
                  for (let script of scripts) {
                    const content = script.innerHTML;
                    const m3u8Match = content.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
                    if (m3u8Match) {
                      document.body.removeChild(iframe);
                      resolve(m3u8Match[0]);
                      return;
                    }
                  }
                }
                document.body.removeChild(iframe);
                resolve(phpUrl); // Fallback to original URL
              } catch (e) {
                document.body.removeChild(iframe);
                resolve(phpUrl); // Fallback to original URL
              }
            };
            
            iframe.onerror = () => {
              document.body.removeChild(iframe);
              resolve(phpUrl); // Fallback to original URL
            };
            
            // Timeout after 5 seconds
            setTimeout(() => {
              if (iframe.parentNode) {
                document.body.removeChild(iframe);
              }
              resolve(phpUrl); // Fallback to original URL
            }, 5000);
          });
        } catch (iframeError) {
          console.log('Iframe method failed');
        }
      }
      
      // If all methods fail, return the original URL
      console.log('Using original PHP URL as fallback');
      return phpUrl;
      
    } catch (error) {
      console.error('PHP stream resolution failed:', error);
      return phpUrl; // Fallback to original URL
    }
  };

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

        console.log('Loading stream:', channel.streamUrl);

        let streamUrl = channel.streamUrl;

        // Handle PHP-based streams
        if (streamUrl.includes('.php')) {
          console.log('Detected PHP stream, attempting resolution...');
          streamUrl = await resolvePhpStream(streamUrl);
          console.log('Resolved stream URL:', streamUrl);
        }

        setConnectionStatus('connecting');

        // Try multiple loading strategies for PHP streams
        const loadStrategies = [
          // Strategy 1: Direct video element loading
          async () => {
            console.log('Trying direct video loading...');
            video.crossOrigin = 'anonymous';
            video.src = streamUrl;
            
            return new Promise((resolve, reject) => {
              const handleLoadedData = () => {
                console.log('Direct loading successful');
                video.removeEventListener('loadeddata', handleLoadedData);
                video.removeEventListener('error', handleError);
                resolve(true);
              };
              
              const handleError = (e: any) => {
                console.log('Direct loading failed:', e);
                video.removeEventListener('loadeddata', handleLoadedData);
                video.removeEventListener('error', handleError);
                reject(new Error('Direct video loading failed'));
              };

              video.addEventListener('loadeddata', handleLoadedData);
              video.addEventListener('error', handleError);
              
              // Timeout after 10 seconds
              setTimeout(() => {
                video.removeEventListener('loadeddata', handleLoadedData);
                video.removeEventListener('error', handleError);
                reject(new Error('Direct loading timeout'));
              }, 10000);
            });
          },

          // Strategy 2: HLS.js with enhanced settings
          async () => {
            console.log('Trying HLS.js loading...');
            const { default: Hls } = await import('hls.js');
            
            if (!Hls.isSupported()) {
              throw new Error('HLS.js not supported in this browser');
            }

            const hls = new Hls({
              enableWorker: false,
              lowLatencyMode: false,
              backBufferLength: 90,
              maxBufferLength: 60,
              maxMaxBufferLength: 600,
              maxBufferSize: 60 * 1000 * 1000,
              maxBufferHole: 0.5,
              highBufferWatchdogPeriod: 3,
              nudgeOffset: 0.1,
              nudgeMaxRetry: 5,
              maxFragLookUpTolerance: 0.25,
              liveSyncDurationCount: 3,
              liveMaxLatencyDurationCount: 10,
              liveDurationInfinity: true,
              enableSoftwareAES: true,
              manifestLoadingTimeOut: 20000,
              manifestLoadingMaxRetry: 10,
              manifestLoadingRetryDelay: 2000,
              fragLoadingTimeOut: 30000,
              fragLoadingMaxRetry: 10,
              fragLoadingRetryDelay: 2000,
              startFragPrefetch: true,
              testBandwidth: false,
              progressive: false,
              xhrSetup: function (xhr: XMLHttpRequest, url: string) {
                xhr.withCredentials = false;
                xhr.setRequestHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
                xhr.setRequestHeader('Accept', '*/*');
                xhr.setRequestHeader('Accept-Language', 'en-US,en;q=0.9');
                if (url.includes('elahmad.com')) {
                  xhr.setRequestHeader('Referer', 'https://www.elahmad.com/');
                  xhr.setRequestHeader('Origin', 'https://www.elahmad.com');
                }
              }
            });
            
            hlsRef.current = hls;
            
            return new Promise((resolve, reject) => {
              let resolved = false;
              
              const cleanup = () => {
                if (hls && !resolved) {
                  hls.off(Hls.Events.MANIFEST_PARSED);
                  hls.off(Hls.Events.ERROR);
                }
              };

              hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (!resolved) {
                  resolved = true;
                  cleanup();
                  console.log('HLS.js loading successful');
                  resolve(true);
                }
              });

              hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS.js error:', data);
                if (data.fatal && !resolved) {
                  resolved = true;
                  cleanup();
                  reject(new Error(`HLS fatal error: ${data.details || 'Unknown error'}`));
                }
              });

              try {
                hls.loadSource(streamUrl);
                hls.attachMedia(video);
              } catch (hlsError) {
                if (!resolved) {
                  resolved = true;
                  cleanup();
                  reject(new Error(`HLS setup error: ${hlsError}`));
                }
              }
              
              // Timeout after 15 seconds
              setTimeout(() => {
                if (!resolved) {
                  resolved = true;
                  cleanup();
                  reject(new Error('HLS loading timeout'));
                }
              }, 15000);
            });
          },

          // Strategy 3: Native HLS (Safari)
          async () => {
            console.log('Trying native HLS loading...');
            
            if (!video.canPlayType('application/vnd.apple.mpegurl')) {
              throw new Error('Native HLS not supported in this browser');
            }
            
            video.src = streamUrl;
            
            return new Promise((resolve, reject) => {
              const handleLoadedData = () => {
                console.log('Native HLS loading successful');
                video.removeEventListener('loadeddata', handleLoadedData);
                video.removeEventListener('error', handleError);
                resolve(true);
              };
              
              const handleError = (e: any) => {
                console.log('Native HLS loading failed:', e);
                video.removeEventListener('loadeddata', handleLoadedData);
                video.removeEventListener('error', handleError);
                reject(new Error('Native HLS loading failed'));
              };

              video.addEventListener('loadeddata', handleLoadedData);
              video.addEventListener('error', handleError);
              
              // Timeout after 12 seconds
              setTimeout(() => {
                video.removeEventListener('loadeddata', handleLoadedData);
                video.removeEventListener('error', handleError);
                reject(new Error('Native HLS timeout'));
              }, 12000);
            });
          }
        ];

        // Try each strategy in order
        let lastError = null;
        let strategySucceeded = false;
        
        for (let i = 0; i < loadStrategies.length; i++) {
          try {
            console.log(`Attempting loading strategy ${i + 1}/${loadStrategies.length}`);
            await loadStrategies[i]();
            
            // If we get here, loading was successful
            setIsLoading(false);
            setCanPlay(true);
            setConnectionStatus('connected');
            console.log('Stream loaded successfully with strategy', i + 1);
            strategySucceeded = true;
            
            // Auto-play
            try {
              await video.play();
              setIsPlaying(true);
            } catch (playError) {
              console.log('Auto-play prevented:', playError);
            }
            
            return; // Success, exit the function
            
          } catch (strategyError) {
            console.log(`Strategy ${i + 1} failed:`, strategyError);
            lastError = strategyError;
            
            // Clean up before trying next strategy
            if (hlsRef.current) {
              try {
                hlsRef.current.destroy();
              } catch (destroyError) {
                console.log('Error destroying HLS instance:', destroyError);
              }
              hlsRef.current = null;
            }
            video.src = '';
            
            // Wait a bit before trying next strategy
            if (i < loadStrategies.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        // If all strategies failed
        if (!strategySucceeded) {
          throw lastError || new Error('All loading strategies failed');
        }

      } catch (err) {
        console.error('Stream loading error:', err);
        let errorMessage = 'Failed to load stream';
        
        if (channel.streamUrl.includes('.php')) {
          errorMessage = 'PHP stream temporarily unavailable - This may be due to server restrictions or the stream being offline';
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
        setIsLoading(false);
        setConnectionStatus('disconnected');
      }
    };

    loadVideo();

    return () => {
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch (destroyError) {
          console.log('Error destroying HLS instance on cleanup:', destroyError);
        }
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
      setError('Unable to play stream - Channel may be offline');
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
    setRetryCount(prev => prev + 1);
    setCanPlay(false);
    setConnectionStatus('connecting');
    
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch (destroyError) {
        console.log('Error destroying HLS instance on retry:', destroyError);
      }
      hlsRef.current = null;
    }
    
    const video = videoRef.current;
    if (video) {
      video.src = '';
      video.load();
    }
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
      case 'resolving':
        return <Signal className="w-4 h-4 text-yellow-400 animate-pulse" />;
      case 'disconnected':
        return <Signal className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting';
      case 'resolving':
        return 'Resolving';
      case 'disconnected':
        return 'Disconnected';
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="relative w-full h-full">
        {/* Header */}
        <div className={`absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-between p-4">
            {/* Back Button */}
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-all hover:scale-105 relative overflow-hidden border border-white/20"
              style={buttonBackgroundStyle}
            >
              <div className="absolute inset-0 bg-black/50"></div>
              <ArrowLeft className="w-5 h-5 relative z-10" />
              <span className="font-medium relative z-10">Back</span>
            </button>

            {/* Channel Info */}
            <div 
              className="flex items-center gap-4 text-white px-6 py-3 rounded-lg relative overflow-hidden border border-white/20"
              style={buttonBackgroundStyle}
            >
              <div className="absolute inset-0 bg-black/50"></div>
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
              </div>
            </div>

            {/* Time & Controls */}
            <div className="flex items-center gap-3">
              <div 
                className="text-center text-white px-4 py-2 rounded-lg relative overflow-hidden border border-white/20"
                style={buttonBackgroundStyle}
              >
                <div className="absolute inset-0 bg-black/50"></div>
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
                <div className="absolute inset-0 bg-black/50"></div>
                <Info className="w-5 h-5 relative z-10" />
              </button>

              <button
                onClick={onClose}
                className="p-2 text-white hover:text-red-400 rounded-lg transition-all relative overflow-hidden border border-white/20"
                style={buttonBackgroundStyle}
              >
                <div className="absolute inset-0 bg-black/50"></div>
                <X className="w-6 h-6 relative z-10" />
              </button>
            </div>
          </div>
        </div>

        {/* Channel Info Panel */}
        {showInfo && (
          <div className={`absolute top-20 right-4 z-20 w-80 rounded-lg relative overflow-hidden border border-white/20 transition-all duration-300`}
               style={buttonBackgroundStyle}>
            <div className="absolute inset-0 bg-black/60"></div>
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
                  <span className={`ml-2 font-medium ${connectionStatus === 'connected' ? 'text-green-400' : connectionStatus === 'connecting' || connectionStatus === 'resolving' ? 'text-yellow-400' : 'text-red-400'}`}>
                    {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting...' : connectionStatus === 'resolving' ? 'Resolving...' : 'Offline'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Source:</span>
                  <span className="ml-2 font-medium text-xs">
                    {channel.streamUrl.includes('.php') ? 'PHP Stream' : 'Direct Stream'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Quality:</span>
                  <span className="ml-2 font-medium">Auto</span>
                </div>
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
              <div className="text-center text-white">
                <div className="relative mb-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
                  <Tv className="w-8 h-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400" />
                </div>
                <p className="text-xl font-semibold mb-2">
                  {connectionStatus === 'resolving' ? 'Resolving Stream' : 'Connecting to Live TV'}
                </p>
                <p className="text-slate-400">Loading {channel.name}...</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Signal className="w-4 h-4 text-yellow-400 animate-pulse" />
                  <span className="text-sm text-yellow-400">
                    {connectionStatus === 'resolving' ? 'Resolving PHP stream source' : 'Establishing connection'}
                  </span>
                </div>
                {channel.streamUrl.includes('.php') && (
                  <p className="text-xs text-slate-500 mt-4 max-w-md">
                    PHP-based streams may take longer to load as they require additional processing
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white max-w-md">
                <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-4">Connection Failed</h3>
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
                    <div className="absolute inset-0 bg-black/50"></div>
                    <ArrowLeft className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Back to Channels</span>
                  </button>
                  <p className="text-xs text-slate-500 mt-4">
                    {channel.streamUrl.includes('.php') 
                      ? 'PHP streams may have server-side restrictions or require specific access methods'
                      : 'Live channels may experience temporary interruptions'
                    }
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
                if (!error) { // Only set error if not already set
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

          {/* Controls */}
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
                    <div className="absolute inset-0 bg-black/50"></div>
                    {isPlaying ? <Pause className="w-8 h-8 relative z-10" /> : <Play className="w-8 h-8 relative z-10" />}
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleMute}
                      className="text-white hover:text-blue-400 transition-all p-2 rounded relative overflow-hidden border border-white/20"
                      style={buttonBackgroundStyle}
                    >
                      <div className="absolute inset-0 bg-black/50"></div>
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
                    <div className="absolute inset-0 bg-black/50"></div>
                    <Info className="w-6 h-6 relative z-10" />
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-blue-400 transition-all p-2 rounded relative overflow-hidden border border-white/20"
                    style={buttonBackgroundStyle}
                  >
                    <div className="absolute inset-0 bg-black/50"></div>
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
                <div className="absolute inset-0 bg-black/50"></div>
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