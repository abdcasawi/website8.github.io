import React, { useRef, useEffect, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, AlertCircle, RefreshCw } from 'lucide-react';
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const loadVideo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setCanPlay(false);

        // Clean up previous HLS instance
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }

        console.log('Loading stream:', channel.streamUrl);

        // Check if HLS is supported natively (Safari)
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          console.log('Using native HLS support');
          video.src = channel.streamUrl;
          
          const handleLoadedData = () => {
            setIsLoading(false);
            setCanPlay(true);
            console.log('Video loaded successfully');
            // Auto-play when ready
            video.play().then(() => {
              setIsPlaying(true);
            }).catch(err => {
              console.log('Auto-play prevented:', err);
              // Auto-play was prevented, user needs to click play
            });
          };
          
          const handleError = (e: any) => {
            console.error('Native video error:', e);
            setError('Failed to load video stream - Stream may be unavailable');
            setIsLoading(false);
          };

          video.addEventListener('loadeddata', handleLoadedData);
          video.addEventListener('error', handleError);
          
          // Cleanup listeners
          return () => {
            video.removeEventListener('loadeddata', handleLoadedData);
            video.removeEventListener('error', handleError);
          };
        } else {
          // Use HLS.js for other browsers
          const { default: Hls } = await import('hls.js');
          
          if (Hls.isSupported()) {
            console.log('Using HLS.js');
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
              liveMaxLatencyDurationCount: Infinity,
              liveDurationInfinity: false,
              enableSoftwareAES: true,
              manifestLoadingTimeOut: 10000,
              manifestLoadingMaxRetry: 1,
              manifestLoadingRetryDelay: 1000,
              fragLoadingTimeOut: 20000,
              fragLoadingMaxRetry: 3,
              fragLoadingRetryDelay: 1000,
              startFragPrefetch: false,
              testBandwidth: true
            });
            
            hlsRef.current = hls;
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setIsLoading(false);
              setCanPlay(true);
              console.log('HLS manifest parsed successfully');
              // Auto-play when ready
              video.play().then(() => {
                setIsPlaying(true);
              }).catch(err => {
                console.log('Auto-play prevented:', err);
                // Auto-play was prevented, user needs to click play
              });
            });

            hls.on(Hls.Events.FRAG_LOADED, () => {
              console.log('Fragment loaded');
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
              console.error('HLS Error:', data);
              
              if (data.fatal) {
                let errorMessage = 'Failed to load video stream';
                
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    errorMessage = 'Network error - Stream may be blocked by CORS or unavailable';
                    if (retryCount < 2) {
                      console.log('Attempting to recover from network error');
                      hls.startLoad();
                      setRetryCount(prev => prev + 1);
                      return;
                    }
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    errorMessage = 'Media error - Invalid stream format or codec not supported';
                    if (retryCount < 2) {
                      console.log('Attempting to recover from media error');
                      hls.recoverMediaError();
                      setRetryCount(prev => prev + 1);
                      return;
                    }
                    break;
                  case Hls.ErrorTypes.MUX_ERROR:
                    errorMessage = 'Stream format error - Unable to parse media';
                    break;
                  default:
                    errorMessage = `Stream error: ${data.details || 'Unknown error'}`;
                    break;
                }
                
                setError(errorMessage);
                setIsLoading(false);
              }
            });

            hls.loadSource(channel.streamUrl);
            hls.attachMedia(video);
          } else {
            setError('HLS streaming is not supported in this browser');
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('Video loading error:', err);
        setError('Failed to initialize video player');
        setIsLoading(false);
      }
    };

    loadVideo();

    // Cleanup function
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
      setError('Unable to play video - Stream may be unavailable');
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

  const retryLoad = () => {
    setError(null);
    setIsLoading(true);
    setRetryCount(0);
    setCanPlay(false);
    
    // Clean up and reload
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    // Force re-render by updating a state
    const video = videoRef.current;
    if (video) {
      video.src = '';
      video.load();
    }
    
    // Trigger reload after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
      <div className="relative w-full h-full max-w-7xl max-h-full">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Channel Info */}
        <div className="absolute top-4 left-4 z-10 bg-black/50 text-white p-3 rounded-lg">
          <h2 className="text-xl font-bold">{channel.name}</h2>
          <p className="text-sm text-slate-300 capitalize">{channel.category}</p>
        </div>

        {/* Video Container */}
        <div className="relative w-full h-full">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-xl">Loading stream...</p>
                <p className="text-slate-400 mt-2">Connecting to {channel.name}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white max-w-md">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-xl mb-4">Unable to load stream</p>
                <p className="text-slate-400 mb-6 text-sm leading-relaxed">{error}</p>
                <div className="space-y-3">
                  <button
                    onClick={retryLoad}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                  <p className="text-xs text-slate-500">
                    Some streams may be geo-blocked or require special access
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
              }}
              onError={() => {
                setError('Video playback error - Stream format may not be supported');
                setIsLoading(false);
              }}
              crossOrigin="anonymous"
              playsInline
              muted={false}
            />
          )}

          {/* Controls */}
          {!error && !isLoading && canPlay && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-blue-400 transition-colors p-2 bg-black/30 rounded-full hover:bg-black/50"
                  disabled={!canPlay}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-blue-400 transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 accent-blue-500"
                  />
                </div>

                <div className="flex-1 text-center">
                  <span className="text-white text-sm">
                    {isPlaying ? 'Playing' : 'Paused'} • {channel.name}
                  </span>
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Large Play Button Overlay for Initial Play */}
          {!error && !isLoading && canPlay && !isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={togglePlay}
                className="bg-black/50 hover:bg-black/70 text-white p-6 rounded-full transition-all hover:scale-110"
              >
                <Play className="w-16 h-16 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;