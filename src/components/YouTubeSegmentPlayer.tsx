import React, { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface YouTubeSegmentPlayerProps {
  videoId: string;
  startTime: number;
  endTime: number;
  onClose?: () => void;
  autoplay?: boolean;
  loop?: boolean;
  className?: string;
  isSourcePlayer?: boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const YouTubeSegmentPlayer: React.FC<YouTubeSegmentPlayerProps> = ({
  videoId,
  startTime,
  endTime,
  onClose,
  autoplay = true,
  loop = true,
  className = '',
  isSourcePlayer = false,
}) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(startTime);
  const progressInterval = useRef<number | null>(null);
  const [showThumbnail, setShowThumbnail] = useState(true);

  // Calculate duration
  const duration = endTime > 0 ? endTime - startTime : 0;

  // Load YouTube API
  useEffect(() => {
    // Only load the API once
    if (!document.getElementById('youtube-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Initialize player when API is ready
    const initPlayer = () => {
      if (!playerRef.current) return;
      
      if (window.YT && window.YT.Player) {
        createPlayer();
      } else {
        // If API is not ready yet, set a global callback
        window.onYouTubeIframeAPIReady = createPlayer;
      }
    };

    initPlayer();

    return () => {
      // Clean up player and interval
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
      }
      if (progressInterval.current) {
        window.clearInterval(progressInterval.current);
      }
    };
  }, [videoId]);

  // Create the YouTube player
  const createPlayer = () => {
    if (!playerRef.current) return;

    playerInstanceRef.current = new window.YT.Player(playerRef.current, {
      videoId: videoId,
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        controls: 0, // Hide controls
        modestbranding: 1,
        rel: 0,
        showinfo: 0, // Hide video title and uploader info
        fs: 0, // Disable fullscreen
        playsinline: 1,
        start: Math.floor(startTime),
        end: Math.ceil(endTime),
        iv_load_policy: 3, // Hide annotations
        disablekb: 1, // Disable keyboard controls
        origin: window.location.origin, // Set origin for security
        enablejsapi: 1, // Enable JS API
        widget_referrer: window.location.href, // Set referrer
        cc_load_policy: 0, // Hide closed captions by default
        hl: 'en', // Set language to English
        color: 'white', // Use white progress bar (when controls are shown)
        // The following are important for removing overlay elements
        showsearch: 0, // Hide search button
        ecver: 2, // Use enhanced privacy mode
        autohide: 1, // Hide controls after play begins
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
  };

  // Handle player ready event
  const onPlayerReady = (event: any) => {
    setIsReady(true);
    event.target.seekTo(startTime);
    setShowThumbnail(false);
    
    if (autoplay) {
      event.target.playVideo();
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }

    // Start progress tracking
    startProgressTracking();
  };

  // Handle player state changes
  const onPlayerStateChange = (event: any) => {
    // When video ends (state = 0) or pauses (state = 2)
    if (event.data === 0) {
      if (loop) {
        // Loop back to start time
        event.target.seekTo(startTime);
        event.target.playVideo();
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    } else if (event.data === 1) {
      // Video is playing
      setIsPlaying(true);
      startProgressTracking();
    } else if (event.data === 2) {
      // Video is paused
      setIsPlaying(false);
      stopProgressTracking();
    }
  };

  // Track progress for the custom progress bar
  const startProgressTracking = () => {
    if (progressInterval.current) {
      window.clearInterval(progressInterval.current);
    }

    progressInterval.current = window.setInterval(() => {
      if (playerInstanceRef.current && typeof playerInstanceRef.current.getCurrentTime === 'function') {
        const time = playerInstanceRef.current.getCurrentTime();
        setCurrentTime(time);
        
        if (duration > 0) {
          const progressPercent = ((time - startTime) / duration) * 100;
          // Keep progress within 0-100%
          setProgress(Math.min(100, Math.max(0, progressPercent)));
        }
        
        // If we've gone past the end time, loop back
        if (time >= endTime && loop) {
          playerInstanceRef.current.seekTo(startTime);
        }
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (progressInterval.current) {
      window.clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!playerInstanceRef.current) return;
    
    if (isPlaying) {
      playerInstanceRef.current.pauseVideo();
    } else {
      playerInstanceRef.current.playVideo();
    }
    
    setIsPlaying(!isPlaying);
  };

  // Seek to a specific position when clicking on the progress bar
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerInstanceRef.current || !duration) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const seekTime = startTime + (duration * clickPosition);
    
    playerInstanceRef.current.seekTo(seekTime);
    setProgress(clickPosition * 100);
  };

  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get thumbnail URL for the specific timestamp
  const getThumbnailUrl = () => {
    // YouTube doesn't officially support timestamp-based thumbnails
    // This is a best effort approach
    return `https://i3.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  };

  // Add this useEffect to apply CSS to hide YouTube overlay elements
  useEffect(() => {
    // Add CSS to hide YouTube overlay elements
    const style = document.createElement('style');
    style.textContent = `
      /* Hide all YouTube UI elements */
      .ytp-chrome-top,
      .ytp-chrome-bottom,
      .ytp-watermark,
      .ytp-pause-overlay,
      .ytp-share-button,
      .ytp-watch-later-button,
      .ytp-youtube-button,
      .ytp-chapter-container,
      .ytp-title-channel,
      .ytp-title-text,
      .ytp-title,
      .ytp-title-link,
      .ytp-show-cards-title,
      .ytp-menuitem,
      .ytp-ce-element,
      .ytp-ce-covering-overlay,
      .ytp-ce-element-shadow,
      .ytp-ce-covering-image,
      .ytp-ce-expanding-image,
      .ytp-ce-element.ytp-ce-channel,
      .ytp-ce-element.ytp-ce-video,
      .ytp-ce-element.ytp-ce-playlist,
      .annotation,
      .iv-branding,
      .ytp-cards-button,
      .ytp-overflow-menu-button,
      .ytp-button[aria-label="More actions"],
      .ytp-button[aria-label="More"],
      .ytp-button[data-tooltip-target-id="ytp-autonav-toggle-button"],
      .ytp-chrome-controls {
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      
      /* Make sure the iframe doesn't have a border */
      iframe {
        border: none !important;
      }
      
      /* Hide any YouTube annotations */
      .video-annotations {
        display: none !important;
      }
      
      /* Ensure our custom controls work by preventing YouTube from capturing clicks */
      .html5-video-player {
        pointer-events: none !important;
      }
      
      /* But allow the actual video to receive events */
      .html5-video-container, video {
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Clean up
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Modify the skipForward and skipBackward functions to handle source player differently
  const skipBackward = () => {
    if (!playerInstanceRef.current) return;
    
    // For source player, allow seeking anywhere in the video
    if (isSourcePlayer) {
      const newTime = Math.max(0, currentTime - 10);
      playerInstanceRef.current.seekTo(newTime);
      return;
    }
    
    // For segment player, restrict to segment bounds
    const newTime = Math.max(startTime, currentTime - 10);
    playerInstanceRef.current.seekTo(newTime);
  };

  const skipForward = () => {
    if (!playerInstanceRef.current) return;
    
    // For source player, allow seeking anywhere in the video
    if (isSourcePlayer) {
      const newTime = currentTime + 10;
      playerInstanceRef.current.seekTo(newTime);
      return;
    }
    
    // For segment player, restrict to segment bounds
    const newTime = Math.min(endTime > 0 ? endTime : Infinity, currentTime + 10);
    playerInstanceRef.current.seekTo(newTime);
  };

  return (
    <div className={`relative aspect-video ${className}`}>
      {/* Thumbnail overlay (shown before player is ready) */}
      {showThumbnail && (
        <div className="absolute inset-0 z-10 bg-black">
          <img 
            src={getThumbnailUrl()} 
            alt="Video thumbnail" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 bg-black/60 rounded-full flex items-center justify-center">
              <Play className="h-8 w-8 text-white ml-1" />
            </div>
          </div>
        </div>
      )}
      
      {/* Player container */}
      <div ref={playerRef} className="w-full h-full"></div>
      
      {/* Custom controls overlay */}
      <div className="absolute inset-0 z-20 flex flex-col justify-between pointer-events-none">
        {/* Top controls */}
        <div className="flex justify-between p-2">
          {/* Video title could go here */}
          {onClose && (
            <button 
              className="ml-auto bg-black/70 text-white rounded-full p-1.5 hover:bg-black/90 transition-colors pointer-events-auto"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Center controls */}
        <div className="flex items-center justify-center space-x-4 pointer-events-auto">
          <button 
            className="bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
            onClick={skipBackward}
          >
            <SkipBack className="h-5 w-5" />
          </button>
          
          <button 
            className="bg-black/50 text-white rounded-full p-3 hover:bg-black/70 transition-colors"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-0.5" />
            )}
          </button>
          
          <button 
            className="bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
            onClick={skipForward}
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
        
        {/* Bottom controls */}
        <div className="p-2 space-y-1">
          {/* Progress bar */}
          <div 
            className="h-1.5 bg-black/50 rounded-full overflow-hidden cursor-pointer pointer-events-auto"
            onClick={handleProgressBarClick}
          >
            <div 
              className="h-full bg-purple-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Time display */}
          <div className="flex justify-between text-xs text-white">
            <div className="bg-black/70 px-2 py-0.5 rounded">
              {formatTime(currentTime)}
            </div>
            <div className="bg-black/70 px-2 py-0.5 rounded">
              {formatTime(endTime > 0 ? endTime : currentTime + 1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeSegmentPlayer; 