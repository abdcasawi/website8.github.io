import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, AlertCircle, RefreshCw, ArrowLeft, Info, Loader2, Wifi, WifiOff, Tv } from 'lucide-react';
import { Channel } from '../types';

interface VideoPlayerProps {
  channel: Channel;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ channel, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
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
  const [streamType, setStreamType] = useState<'hls' | 'direct'>('direct');

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

  // Load video stream with native HLS support
  const loadStream = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      setError('Video player not available');
      setIsLoading(false);
      return;
    }

    console.log('Loading stream:', channel.streamUrl);
    
    setIsLoading(true);
    setError(null);
    setCanPlay(false);
    setConnectionStatus('connecting');

    // Reset video state
    video.currentTime = 0;
    setCurrentVideoTime(0);
    setDuration(0);
    setBuffered(0);

    // Determine stream type
    const isHLS = channel.streamUrl.includes('.m3u8');
    setStreamType(isHLS ? 'hls' : 'direct');

    // Check HLS support for .m3u8 streams
    if (isHLS && !supportsNativeHLS()) {
      setError('HLS streams are not supported in this browser. Please try a different browser like Safari, Chrome, or Edge.');
      setIsLoading(false);
      setConnectionStatus('disconnected');
      return;
    }

    // Configure video element for optimal HLS playback
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.autoplay = false;
    video.controls = false;
    video.muted = isMuted;
    video.volume = volume;
    
    // Set additional attributes for better HLS support
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('playsinline', 'true');
    
    // For HLS streams, add specific headers and configuration
    if (isHLS) {
      // Some HLS streams require specific user agents or referrers
      if (channel.streamUrl.includes('rai.it') || channel.streamUrl.includes('akamaized.net')) {
        // These streams might need specific headers, but we can't set them directly
        // The browser will handle CORS and authentication
        console.log('Loading RAI/Akamai HLS stream with native support');
      }
    }

    // Set source and load
    video.src = channel.streamUrl;
    video.load();

    console.log(`Loading ${streamType.toUpperCase()} stream with native browser support`);
  }, [channel.streamUrl, isMuted, volume, supportsNativeHLS, streamType]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      console.log('Video load started');
      setIsLoading(true);
      setConnectionStatus('connecting');
    };

    const handleLoadedMetadata = () => {
      console.log('Video metadata loaded, duration:', video.duration);
      setDuration(video.duration || 0);
      setConnectionStatus('connected');
    };

    const handleCanPlay = () => {
      console.log('Video can play');
      setCanPlay(true);
      setIsLoading(false);
      setConnectionStatus('connected');
      setError(null);
      setRetryCount(0);
    };

    const handleCanPlayThrough = () => {
      console.log('Video can play through');
      setCanPlay(true);
      setIsLoading(false);
      setConnectionStatus('connected');
    };

    const handlePlay = () => {
      console.log('Video playing');
      setIsPlaying(true);
      setConnectionStatus('connected');
    };

    const handlePause = () => {
      console.log('Video paused');
      setIsPlaying(false);
    };

    const handleWaiting = () => {
      console.log('Video waiting/buffering');
      setConnectionStatus('buffering');
    };

    const handlePlaying = () => {
      console.log('Video playing after buffering');
      setConnectionStatus('connected');
    };

    const handleTimeUpdate = () => {
      setCurrentVideoTime(video.currentTime);
      
      // Update buffered amount
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered(bufferedEnd);
      }
    };

    const handleError = (e: Event) => {
      console.error('Video error:', e, video.error);
      setIsLoading(false);
      setCanPlay(false);
      setConnectionStatus('disconnected');
      
      let errorMessage = 'Failed to load video stream';
      
      if (video.error) {
        switch (video.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Video loading was aborted by user';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            if (streamType === 'hls') {
              errorMessage = 'Network error loading HLS stream. Stream may be geo-blocked, offline, or require authentication.';
            } else {
              errorMessage = 'Network error - Stream may be offline or geo-blocked';
            }
            break;
          case MediaError.MEDIA_ERR_DECODE:
            if (streamType === 'hls') {
              errorMessage = 'HLS stream format error or corrupted segments';
            } else {
              errorMessage = 'Video format not supported or corrupted';
            }
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            if (streamType === 'hls') {
              errorMessage = 'HLS format not supported. Try a browser with native HLS support like Safari.';
            } else {
              errorMessage = 'Video format not supported by this browser';
            }
            break;
          default:
            errorMessage = `Unknown video error (code: ${video.error.code})`;
        }
      }
      
      // Add specific error handling for common HLS issues
      if (streamType === 'hls') {
        if (channel.streamUrl.includes('rai.it')) {
          errorMessage += ' RAI streams may require Italian IP address or specific authentication.';
        } else if (channel.streamUrl.includes('akamaized.net')) {
          errorMessage += ' Akamai CDN streams may have geo-restrictions or authentication requirements.';
        }
      }
      
      setError(errorMessage);
      
      // Auto-retry with exponential backoff for network errors
      if (video.error?.code === MediaError.MEDIA_ERR_NETWORK && retryCount < 3) {
        const retryDelay = Math.min(3000 * Math.pow(2, retryCount), 15000);
        console.log(`Auto-retry in ${retryDelay/1000} seconds (attempt ${retryCount + 1}/3)`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadStream();
        }, retryDelay);
      }
    };

    const handleStalled = () => {
      console.log('Video stalled');
      setConnectionStatus('buffering');
    };

    const handleSuspend = () => {
      console.log('Video suspended');
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handleProgress = () => {
      // Update buffered ranges
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered(bufferedEnd);
      }
    };

    // Add event listeners
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('error', handleError);
    video.addEventListener('stalled', handleStalled);
    video.addEventListener('suspend', handleSuspend);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('progress', handleProgress);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('error', handleError);
      video.removeEventListener('stalled', handleStalled);
      video.removeEventListener('suspend', handleSuspend);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('progress', handleProgress);
    };
  }, [streamType, channel.streamUrl, retryCount, loadStream]);

  // Load stream on mount and URL change
  useEffect(() => {
    const timer = setTimeout(() => {
      loadStream();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [loadStream]);

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
        return 'Connecting';
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
                    {isLiveStream ? 'LIVE' : 'VIDEO'}
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
                  <span className="text-xs">{streamType.toUpperCase()}</span>
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
                    {isLiveStream ? 'Live TV' : 'Video Player'}
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
                  <span className="ml-2 font-medium">Native {streamType.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-slate-400">Duration:</span>
                  <span className="ml-2 font-medium">{formatDuration(duration)}</span>
                </div>
                <div>
                  <span className="text-slate-400">HLS Support:</span>
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
                  {connectionStatus === 'buffering' ? 'Buffering' : 'Loading Stream'}
                </p>
                <p className="text-slate-400 mb-4">Connecting to {channel.name}...</p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getSignalIcon()}
                  <span className="text-sm text-yellow-400">
                    {connectionStatus === 'buffering' ? 'Buffering content' : 'Establishing connection'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Using native {streamType.toUpperCase()} player
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
                
                {streamType === 'hls' && !supportsNativeHLS() && (
                  <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4 mb-6">
                    <p className="text-yellow-400 text-sm">
                      <strong>HLS Support Required:</strong> This stream requires a browser with native HLS support. 
                      Try Safari, Chrome, or Edge for better compatibility.
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
                      {isLiveStream ? 'LIVE TV' : 'VIDEO'}
                    </span>
                    {getSignalIcon()}
                  </div>
                  <p className="text-sm text-slate-300">{channel.name}</p>
                  <p className="text-xs text-slate-400">Native {streamType.toUpperCase()} Player</p>
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
                    {isLiveStream ? 'Start Live TV' : 'Play Video'}
                  </span>
                  <span className="text-sm text-slate-300">
                    Native {streamType.toUpperCase()} Player
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