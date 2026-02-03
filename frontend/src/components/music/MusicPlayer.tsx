import React, { useRef, useEffect, useState } from 'react';
import type { MusicTrack } from '../../types';

interface MusicPlayerProps {
  track: MusicTrack;
  onClose: () => void;
  autoPlay?: boolean;
}

// Declare SoundCloud widget API
declare global {
  interface Window {
    SC: {
      Widget: {
        (element: HTMLIFrameElement): {
          bind: (event: string, callback: Function) => void;
          play: () => void;
          pause: () => void;
          toggle: () => void;
          seekTo: (milliseconds: number) => void;
          setVolume: (volume: number) => void;
          getPosition: (callback: (position: number) => void) => void;
          getDuration: (callback: (duration: number) => void) => void;
          isPaused: (callback: (paused: boolean) => void) => void;
        };
        Events: {
          READY: string;
          PLAY: string;
          PAUSE: string;
          FINISH: string;
          SEEK: string;
          PLAY_PROGRESS: string;
          LOAD_PROGRESS: string;
          ERROR: string;
        };
      };
    };
  }
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ track, onClose, autoPlay = false }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [widget, setWidget] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSoundCloudUrl = (url: string) => {
    return url.includes('soundcloud.com');
  };

  useEffect(() => {
    if (!track.audioUrl) return;

    if (isSoundCloudUrl(track.audioUrl)) {
      // Load SoundCloud widget
      const script = document.createElement('script');
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.onload = () => {
        if (iframeRef.current && window.SC) {
          const widgetInstance = window.SC.Widget(iframeRef.current);
          setWidget(widgetInstance);

          widgetInstance.bind(window.SC.Widget.Events.READY, () => {
            setLoading(false);
            widgetInstance.getDuration((d: number) => setDuration(d / 1000));
            if (autoPlay) {
              widgetInstance.play();
            }
          });

          widgetInstance.bind(window.SC.Widget.Events.PLAY, () => {
            setIsPlaying(true);
            setError(null);
          });

          widgetInstance.bind(window.SC.Widget.Events.PAUSE, () => {
            setIsPlaying(false);
          });

          widgetInstance.bind(window.SC.Widget.Events.FINISH, () => {
            setIsPlaying(false);
            setCurrentTime(0);
          });

          widgetInstance.bind(window.SC.Widget.Events.PLAY_PROGRESS, (data: any) => {
            setCurrentTime(data.currentPosition / 1000);
          });

          widgetInstance.bind(window.SC.Widget.Events.ERROR, () => {
            setError('Failed to load SoundCloud track');
            setLoading(false);
          });
        }
      };
      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    } else {
      // Handle regular audio files
      const audio = audioRef.current;
      if (!audio) return;

      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
        setLoading(false);
        if (autoPlay) {
          audio.play().catch(err => {
            console.error('Auto-play failed:', err);
            setError('Auto-play failed. Please click play to start.');
          });
        }
      };

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handlePlay = () => {
        setIsPlaying(true);
        setError(null);
      };

      const handlePause = () => {
        setIsPlaying(false);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      const handleError = () => {
        setError('Failed to load audio file');
        setLoading(false);
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [track.audioUrl, autoPlay]);

  const togglePlayPause = () => {
    if (isSoundCloudUrl(track.audioUrl)) {
      if (widget) {
        widget.toggle();
      }
    } else {
      const audio = audioRef.current;
      if (!audio) return;

      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(err => {
          console.error('Play failed:', err);
          setError('Failed to play audio');
        });
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    
    if (isSoundCloudUrl(track.audioUrl)) {
      if (widget) {
        widget.seekTo(newTime * 1000);
      }
    } else {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = newTime;
        setCurrentTime(newTime);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!track.audioUrl) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-red-600">No audio file available for this track</div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close player"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      {isSoundCloudUrl(track.audioUrl) ? (
        <iframe
          ref={iframeRef}
          width="100%"
          height="166"
          scrolling="no"
          frameBorder="no"
          allow="autoplay"
          src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(track.audioUrl)}&color=%23ff5500&auto_play=${autoPlay}&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
          className="hidden"
        />
      ) : (
        <audio
          ref={audioRef}
          src={track.audioUrl}
          preload="metadata"
        />
      )}
      
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-shrink-0">
            {track.coverArt ? (
              <img
                src={track.coverArt}
                alt={`${track.title} cover`}
                className="w-12 h-12 rounded-md object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-grow min-w-0">
            <h4 className="font-semibold text-gray-900 truncate">{track.title}</h4>
            {track.genre && (
              <p className="text-sm text-gray-600">{track.genre}</p>
            )}
          </div>

          <button
            onClick={togglePlayPause}
            disabled={loading || !!error}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {loading ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close player"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {duration > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 min-w-[3rem]">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 relative">
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div 
                className="absolute top-0 left-0 h-2 bg-blue-600 rounded-lg pointer-events-none"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-sm text-gray-500 min-w-[3rem]">
              {formatTime(duration)}
            </span>
          </div>
        )}

        {error && (
          <div className="mt-2 text-red-600 text-sm">{error}</div>
        )}
      </div>
    </div>
  );
};