import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, AlertCircle, RefreshCw, ArrowLeft, Info, Loader2, Wifi, WifiOff, Tv, Settings } from 'lucide-react';
import { Channel } from '../types';

interface VideoPlayerProps {
  channel: Channel;
  onClose: () => void;
}

type PlayerEngine = 'native' | 'hlsjs' | 'videojs' | 'dashjs' | 'shaka';
type StreamFormat = 'hls' | 'dash' | 'mp4' | 'webm' | 'avi' | 'mkv' | 'flv' | 'rai' | 'rtmp' | 'adts' | 'aac' | 'unknown';

const VideoPlayer: React.FC<VideoPlayerProps> = ({ channel, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerInstanceRef = useRef<any>(null);
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
  const [streamFormat, setStreamFormat] = useState<StreamFormat>('unknown');
  const [playerEngine, setPlayerEngine] = useState<PlayerEngine>('native');
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [availableEngines, setAvailableEngines] = useState<PlayerEngine[]>(['native']);

  const buttonBackgroundStyle = {
    backgroundImage: 'url(/cinema.jpg)',
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

  // Detect stream format
  const detectStreamFormat = useCallback((url: string): StreamFormat => {
    const urlLower = url.toLowerCase();
    
    if (url.includes('mediapolis.rai.it/relinker') || url.includes('relinker.rai.it')) {
      return 'rai';
    }
    if (urlLower.includes('.adts') || urlLower.includes('adts') || urlLower.includes('audio/aac')) {
      return 'adts';
    }
    if (urlLower.includes('.aac') || urlLower.includes('audio/aacp')) {
      return 'aac';
    }
    if (urlLower.includes('.m3u8')) {
      return 'hls';
    }
    if (urlLower.includes('.mpd')) {
      return 'dash';
    }
    if (urlLower.includes('.mp4')) {
      return 'mp4';
    }
    if (urlLower.includes('.webm')) {
      return 'webm';
    }
    if (urlLower.includes('.avi')) {
      return 'avi';
    }
    if (urlLower.includes('.mkv')) {
      return 'mkv';
    }
    if (urlLower.includes('.flv')) {
      return 'flv';
    }
    if (urlLower.includes('rtmp://') || urlLower.includes('rtmps://')) {
      return 'rtmp';
    }
    
    return 'unknown';
  }, []);

  // Check available player engines
  const checkAvailableEngines = useCallback(async () => {
    const engines: PlayerEngine[] = ['native'];
    
    try {
      // Check HLS.js
      await import('hls.js');
      engines.push('hlsjs');
    } catch (e) {
      console.log('HLS.js not available');
    }
    
    try {
      // Check Video.js
      await import('video.js');
      engines.push('videojs');
    } catch (e) {
      console.log('Video.js not available');
    }
    
    try {
      // Check Dash.js
      await import('dashjs');
      engines.push('dashjs');
    } catch (e) {
      console.log('Dash.js not available');
    }
    
    try {
      // Check Shaka Player
      await import('shaka-player');
      engines.push('shaka');
    } catch (e) {
      console.log('Shaka Player not available');
    }
    
    setAvailableEngines(engines);
    return engines;
  }, []);

  // Resolve RAI relinker URLs
  const resolveRaiUrl = useCallback(async (url: string): Promise<string> => {
    try {
      console.log('Resolving RAI relinker URL:', url);
      
      // Try multiple resolution strategies
      const strategies = [
        // Strategy 1: Direct fetch with RAI headers
        async () => {
          const response = await fetch(url, {
            method: 'HEAD',
            headers: {
              'User-Agent': 'raiplayappletv',
              'Accept': '*/*',
            },
            redirect: 'follow'
          });
          return response.url;
        },
        
        // Strategy 2: Extract cont parameter and construct direct URL
        async () => {
          const contMatch = url.match(/cont=(\d+)/);
          if (contMatch) {
            const cont = contMatch[1];
            return `https://mediapolis.rai.it/relinker/relinkerServlet.htm?cont=${cont}&output=25&forceUserAgent=raiplayappletv`;
          }
          throw new Error('No cont parameter found');
        },
        
        // Strategy 3: Try alternative RAI endpoints
        async () => {
          const contMatch = url.match(/cont=(\d+)/);
          if (contMatch) {
            const cont = contMatch[1];
            const alternatives = [
              `https://relinker.rai.it/relinkerServlet.htm?cont=${cont}&output=7`,
              `https://mediapolis.rai.it/relinker/relinkerServlet.htm?cont=${cont}&output=7&forceUserAgent=raiplayappletv`,
              `https://mediapolis.rai.it/relinker/relinkerServlet.htm?cont=${cont}&output=25`,
            ];
            return alternatives[0];
          }
          throw new Error('No cont parameter found');
        }
      ];
      
      for (const strategy of strategies) {
        try {
          const resolvedUrl = await strategy();
          if (resolvedUrl && resolvedUrl !== url) {
            console.log('RAI URL resolved to:', resolvedUrl);
            return resolvedUrl;
          }
        } catch (e) {
          console.log('RAI resolution strategy failed:', e);
        }
      }
      
      throw new Error('All RAI resolution strategies failed');
    } catch (error) {
      console.error('RAI URL resolution failed:', error);
      throw error;
    }
  }, []);

  // Native HTML5 Video Player
  const loadWithNative = useCallback((url: string) => {
    const video = videoRef.current;
    if (!video) throw new Error('Video element not available');

    return new Promise<void>((resolve, reject) => {
      let resolved = false;

      const handleCanPlay = () => {
        if (!resolved) {
          resolved = true;
          cleanup();
          setCanPlay(true);
          setConnectionStatus('connected');
          resolve();
        }
      };

      const handleError = () => {
        if (!resolved) {
          resolved = true;
          cleanup();
          reject(new Error('Native video loading failed'));
        }
      };

      const cleanup = () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);

      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      video.src = url;
      video.load();

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          reject(new Error('Native video timeout'));
        }
      }, 30000);
    });
  }, []);

  // HLS.js Player
  const loadWithHLSJS = useCallback(async (url: string) => {
    const video = videoRef.current;
    if (!video) throw new Error('Video element not available');

    const { default: Hls } = await import('hls.js');
    
    if (!Hls.isSupported()) {
      throw new Error('HLS.js not supported');
    }

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 30,
      maxBufferLength: 20,
      maxMaxBufferLength: 40,
      maxBufferSize: 60 * 1000 * 1000,
      manifestLoadingTimeOut: 20000,
      manifestLoadingMaxRetry: 6,
      fragLoadingTimeOut: 15000,
      fragLoadingMaxRetry: 6,
      abrEwmaDefaultEstimate: 500000,
      abrBandWidthFactor: 0.95,
      abrBandWidthUpFactor: 0.7,
      xhrSetup: (xhr: XMLHttpRequest, requestUrl: string) => {
        xhr.withCredentials = false;
        xhr.timeout = 20000;
        xhr.setRequestHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        xhr.setRequestHeader('Accept', '*/*');
        xhr.setRequestHeader('Accept-Encoding', 'gzip, deflate');
        // Add ADTS/AAC specific headers
        if (requestUrl.includes('adts') || requestUrl.includes('aac')) {
          xhr.setRequestHeader('Accept', 'audio/aac, audio/aacp, audio/x-aac, */*');
        }
      }
    });

    playerInstanceRef.current = hls;

    return new Promise<void>((resolve, reject) => {
      let resolved = false;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!resolved) {
          resolved = true;
          setCanPlay(true);
          setConnectionStatus('connected');
          resolve();
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal && !resolved) {
          resolved = true;
          reject(new Error('HLS.js fatal error'));
        }
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('HLS.js timeout'));
        }
      }, 45000);
    });
  }, []);

  // Video.js Player
  const loadWithVideoJS = useCallback(async (url: string) => {
    const video = videoRef.current;
    if (!video) throw new Error('Video element not available');

    const videojs = (await import('video.js')).default;
    await import('videojs-contrib-hls');

    const player = videojs(video, {
      controls: false,
      fluid: true,
      responsive: true,
      html5: {
        hls: {
          enableLowInitialPlaylist: true,
          smoothQualityChange: true,
          overrideNative: true
        }
      }
    });

    playerInstanceRef.current = player;

    return new Promise<void>((resolve, reject) => {
      let resolved = false;

      player.ready(() => {
        player.src({ src: url, type: 'application/x-mpegURL' });
        
        player.on('loadedmetadata', () => {
          if (!resolved) {
            resolved = true;
            setCanPlay(true);
            setConnectionStatus('connected');
            resolve();
          }
        });

        player.on('error', () => {
          if (!resolved) {
            resolved = true;
            reject(new Error('Video.js error'));
          }
        });
      });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Video.js timeout'));
        }
      }, 30000);
    });
  }, []);

  // Dash.js Player
  const loadWithDashJS = useCallback(async (url: string) => {
    const video = videoRef.current;
    if (!video) throw new Error('Video element not available');

    const dashjs = (await import('dashjs')).default;
    
    const player = dashjs.MediaPlayer().create();
    player.initialize(video, url, false);
    
    playerInstanceRef.current = player;

    return new Promise<void>((resolve, reject) => {
      let resolved = false;

      player.on('streamInitialized', () => {
        if (!resolved) {
          resolved = true;
          setCanPlay(true);
          setConnectionStatus('connected');
          resolve();
        }
      });

      player.on('error', () => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Dash.js error'));
        }
      });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Dash.js timeout'));
        }
      }, 30000);
    });
  }, []);

  // Shaka Player
  const loadWithShaka = useCallback(async (url: string) => {
    const video = videoRef.current;
    if (!video) throw new Error('Video element not available');

    const shaka = await import('shaka-player');
    
    if (!shaka.Player.isBrowserSupported()) {
      throw new Error('Shaka Player not supported');
    }

    const player = new shaka.Player(video);
    playerInstanceRef.current = player;

    return new Promise<void>((resolve, reject) => {
      let resolved = false;

      player.load(url).then(() => {
        if (!resolved) {
          resolved = true;
          setCanPlay(true);
          setConnectionStatus('connected');
          resolve();
        }
      }).catch((error) => {
        if (!resolved) {
          resolved = true;
          reject(new Error(`Shaka Player error: ${error}`));
        }
      });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Shaka Player timeout'));
        }
      }, 30000);
    });
  }, []);

  // Get best player engine for format
  const getBestEngine = useCallback((format: StreamFormat, engines: PlayerEngine[]): PlayerEngine => {
    switch (format) {
      case 'hls':
      case 'rai':
      case 'adts':
      case 'aac':
        if (engines.includes('hlsjs')) return 'hlsjs';
        if (engines.includes('videojs')) return 'videojs';
        if (engines.includes('shaka')) return 'shaka';
        return 'native';
      
      case 'dash':
        if (engines.includes('dashjs')) return 'dashjs';
        if (engines.includes('shaka')) return 'shaka';
        return 'native';
      
      case 'mp4':
      case 'webm':
        return 'native';
      
      case 'avi':
      case 'mkv':
      case 'flv':
        if (engines.includes('videojs')) return 'videojs';
        return 'native';
      
      default:
        return 'native';
    }
  }, []);

  // Load stream with appropriate engine
  const loadStreamWithEngine = useCallback(async (url: string, engine: PlayerEngine) => {
    console.log(`Loading with ${engine} engine:`, url);
    
    switch (engine) {
      case 'hlsjs':
        return await loadWithHLSJS(url);
      case 'videojs':
        return await loadWithVideoJS(url);
      case 'dashjs':
        return await loadWithDashJS(url);
      case 'shaka':
        return await loadWithShaka(url);
      default:
        return await loadWithNative(url);
    }
  }, [loadWithHLSJS, loadWithVideoJS, loadWithDashJS, loadWithShaka, loadWithNative]);

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

      // Clean up previous player instance
      if (playerInstanceRef.current) {
        try {
          if (typeof playerInstanceRef.current.destroy === 'function') {
            playerInstanceRef.current.destroy();
          } else if (typeof playerInstanceRef.current.dispose === 'function') {
            playerInstanceRef.current.dispose();
          }
        } catch (e) {
          console.log('Error cleaning up player:', e);
        }
        playerInstanceRef.current = null;
      }

      // Reset video
      video.src = '';
      video.load();

      let url = channel.streamUrl;
      let finalUrl = url;

      // Check available engines
      const engines = await checkAvailableEngines();
      
      // Detect stream format
      const format = detectStreamFormat(url);
      setStreamFormat(format);

      // Resolve RAI URLs if needed
      if (format === 'rai') {
        try {
          finalUrl = await resolveRaiUrl(url);
          setResolvedUrl(finalUrl);
        } catch (resolveError) {
          console.error('RAI URL resolution failed:', resolveError);
          finalUrl = url;
        }
      }

      // Get best engine for this format
      const bestEngine = getBestEngine(format, engines);
      setPlayerEngine(bestEngine);

      console.log(`Loading ${format} stream with ${bestEngine} engine:`, finalUrl);

      // Try with best engine first, then fallback to others
      const engineOrder = [bestEngine, ...engines.filter(e => e !== bestEngine)];
      
      let lastError: Error | null = null;
      
      for (const engine of engineOrder) {
        try {
          await loadStreamWithEngine(finalUrl, engine);
          setPlayerEngine(engine);
          setIsLoading(false);
          setRetryCount(0);
          return;
        } catch (engineError) {
          console.log(`${engine} failed:`, engineError);
          lastError = engineError as Error;
          
          // Clean up failed attempt
          if (playerInstanceRef.current) {
            try {
              if (typeof playerInstanceRef.current.destroy === 'function') {
                playerInstanceRef.current.destroy();
              } else if (typeof playerInstanceRef.current.dispose === 'function') {
                playerInstanceRef.current.dispose();
              }
            } catch (e) {
              console.log('Error cleaning up failed player:', e);
            }
            playerInstanceRef.current = null;
          }
        }
      }

      throw lastError || new Error('All player engines failed');

    } catch (err) {
      console.error('Stream loading failed:', err);
      handleStreamError(err);
    }
  }, [channel.streamUrl, checkAvailableEngines, detectStreamFormat, resolveRaiUrl, getBestEngine, loadStreamWithEngine]);

  // Handle stream errors
  const handleStreamError = useCallback((err: any) => {
    let errorMessage = 'Failed to load stream';
    
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    
    // Add format-specific guidance
    if (streamFormat === 'rai') {
      errorMessage += ' - RAI streams may require Italian IP or authentication';
    } else if (streamFormat === 'adts' || streamFormat === 'aac') {
      errorMessage += ' - ADTS/AAC audio streams require compatible browser codec support';
    } else if (streamFormat === 'dash') {
      errorMessage += ' - DASH streams require modern browser support';
    } else if (streamFormat === 'flv' || streamFormat === 'avi' || streamFormat === 'mkv') {
      errorMessage += ' - This format may not be supported in browsers';
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
  }, [streamFormat, retryCount, loadStream]);

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
      
      if (playerInstanceRef.current) {
        try {
          if (typeof playerInstanceRef.current.destroy === 'function') {
            playerInstanceRef.current.destroy();
          } else if (typeof playerInstanceRef.current.dispose === 'function') {
            playerInstanceRef.current.dispose();
          }
        } catch (e) {
          console.log('Cleanup error:', e);
        }
        playerInstanceRef.current = null;
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
        return streamFormat === 'rai' ? 'Resolving RAI URL' : 'Connecting';
      case 'buffering':
        return 'Buffering';
      case 'disconnected':
        return 'Offline';
    }
  };

  const getFormatIcon = () => {
    switch (streamFormat) {
      case 'hls':
        return '🎬';
      case 'dash':
        return '📺';
      case 'mp4':
        return '🎥';
      case 'webm':
        return '🌐';
      case 'rai':
        return '🇮🇹';
      case 'adts':
      case 'aac':
        return '🎵';
      default:
        return '📹';
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
                    {streamFormat === 'rai' ? 'RAI' : isLiveStream ? 'LIVE' : 'VIDEO'}
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
                  <span className="text-sm">{getFormatIcon()}</span>
                  <span className="text-xs">{streamFormat.toUpperCase()}</span>
                </div>
                <div className="w-px h-6 bg-white/30"></div>
                <div className="flex items-center gap-1">
                  <Settings className="w-3 h-3 text-blue-400" />
                  <span className="text-xs">{playerEngine.toUpperCase()}</span>
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
                  <div className="text-xs text-slate-300">Universal Player</div>
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
                <h3 className="text-lg font-bold">Universal Player Info</h3>
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
                  <span className="text-slate-400">Format:</span>
                  <span className="ml-2 font-medium">{getFormatIcon()} {streamFormat.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-slate-400">Engine:</span>
                  <span className="ml-2 font-medium">{playerEngine.toUpperCase()}</span>
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
                  <span className="text-slate-400">Available Engines:</span>
                  <div className="ml-2 text-xs">
                    {availableEngines.map(engine => (
                      <span key={engine} className={`inline-block mr-2 px-2 py-1 rounded ${
                        engine === playerEngine ? 'bg-blue-600' : 'bg-gray-600'
                      }`}>
                        {engine.toUpperCase()}
                      </span>
                    ))}
                  </div>
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
                  <span className="text-2xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    {getFormatIcon()}
                  </span>
                </div>
                <p className="text-2xl font-semibold mb-2">
                  Loading {streamFormat.toUpperCase()} Stream
                </p>
                <p className="text-slate-400 mb-4">
                  Using {playerEngine.toUpperCase()} player for {channel.name}
                </p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getSignalIcon()}
                  <span className="text-sm text-yellow-400">
                    {streamFormat === 'rai' ? 'Resolving RAI redirect' : 'Establishing connection'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Universal player supports: HLS, DASH, MP4, WebM, AVI, MKV, FLV, RAI, ADTS, AAC
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
                
                <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4 mb-6">
                  <h4 className="text-blue-400 font-semibold mb-2">Universal Player</h4>
                  <p className="text-xs text-blue-200 leading-relaxed">
                    This player automatically detects stream formats (including ADTS/AAC audio) and uses the best available engine:
                    Native HTML5, HLS.js, Video.js, Dash.js, or Shaka Player with enhanced codec support.
                  </p>
                  <div className="mt-2 text-xs">
                    <span className="text-slate-400">Tried engines: </span>
                    {availableEngines.join(', ')}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={retryConnection}
                    className="px-8 py-3 rounded-lg transition-all flex items-center gap-3 mx-auto relative overflow-hidden border border-white/20 hover:scale-105"
                    style={buttonBackgroundStyle}
                  >
                    <div className="absolute inset-0 bg-blue-600/80"></div>
                    <RefreshCw className="w-5 h-5 relative z-10" />
                    <span className="font-medium relative z-10">Retry with All Engines</span>
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
                      {streamFormat === 'rai' ? 'RAI TV' : isLiveStream ? 'LIVE TV' : 'VIDEO'}
                    </span>
                    {getSignalIcon()}
                  </div>
                  <p className="text-sm text-slate-300">{channel.name}</p>
                  <p className="text-xs text-slate-400">
                    {getFormatIcon()} {streamFormat.toUpperCase()} • {playerEngine.toUpperCase()}
                  </p>
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
                    Start {streamFormat.toUpperCase()} Stream
                  </span>
                  <span className="text-sm text-slate-300">
                    {playerEngine.toUpperCase()} Player
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