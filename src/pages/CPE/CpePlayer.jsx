import React, { useRef, useState, useEffect } from 'react';
import { 
  LuPlay, 
  LuPause, 
  LuVolume2, 
  LuVolumeX, 
  LuMaximize, 
  LuArrowLeft
} from 'react-icons/lu';
import { FiMoreVertical } from 'react-icons/fi';
import './CPE.css';

const CpePlayer = ({ video, onClose, onComplete }) => {
  const { url, title, description, duration: durationLabel, status } = video;
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [maxWatched, setMaxWatched] = useState(0);
  
  // UI state
  const [showControls, setShowControls] = useState(true);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Sync state with native video element
  useEffect(() => {
    const videoElem = videoRef.current;
    if (!videoElem) return;

    if (isPlaying) {
      videoElem.play().catch((err) => console.log('Playback error:', err));
    } else {
      videoElem.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    let timeout;
    if (isPlaying && showControls) {
      timeout = setTimeout(() => {
        setShowControls(false);
        setShowOptionsMenu(false);
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
  };

  const handleSpeedChange = (rate) => {
    setPlaybackRate(rate);
    setShowOptionsMenu(false);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Video Element event handlers
  const handleTimeUpdate = () => {
    const videoElem = videoRef.current;
    if (!videoElem) return;

    setPlayedSeconds(videoElem.currentTime);

    // Natural progress tracking (don't track if they somehow skipped forward)
    if (videoElem.currentTime > maxWatched && videoElem.currentTime - maxWatched < 2.0) {
      setMaxWatched(videoElem.currentTime);
    }

    // Check complete
    if (duration && videoElem.currentTime / duration >= 0.99) {
      if (onComplete) onComplete();
    }
  };

  // Native seeking event handler to block skipping forward
  const handleSeeking = () => {
    const videoElem = videoRef.current;
    if (!videoElem) return;

    // Block forward seeking past maxWatched
    if (videoElem.currentTime > maxWatched) {
      videoElem.currentTime = maxWatched;
      setPlayedSeconds(maxWatched);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleFullscreen = () => {
    const container = containerRef.current;
    const videoElem = videoRef.current;
    if (!container) return;

    const isFullscreenActive = 
      document.fullscreenElement || 
      document.webkitFullscreenElement || 
      document.mozFullScreenElement || 
      document.msFullscreenElement;

    if (!isFullscreenActive) {
      const requestFS = 
        container.requestFullscreen || 
        container.webkitRequestFullscreen || 
        container.mozRequestFullScreen || 
        container.msRequestFullscreen;

      if (requestFS) {
        requestFS.call(container).then(() => {
          if (window.screen.orientation && window.screen.orientation.lock) {
            window.screen.orientation.lock('landscape').catch(() => {});
          }
        }).catch(() => {
          // iOS Safari fallback on video element directly
          if (videoElem && videoElem.webkitEnterFullscreen) {
            videoElem.webkitEnterFullscreen();
          }
        });
      }
    } else {
      const exitFS = 
        document.exitFullscreen || 
        document.webkitExitFullscreen || 
        document.mozCancelFullScreen || 
        document.msExitFullscreen;

      if (exitFS) {
        exitFS.call(document).catch(() => {});
      }
    }
  };

  const handleWrapperClick = (e) => {
    if (e.target.closest('.cpe-controls-footer') || e.target.closest('.cpe-options-menu')) {
      return;
    }
    setShowControls(!showControls);
  };

  return (
    <div className="cpe-player-page-wrapper">
      
      {/* Unified Player Card Container */}
      <div className="cpe-player-card">
        
        {/* 1. Video Player Viewport */}
        <div 
          ref={containerRef}
          className="cpe-nativePlayerContainer"
          onClick={handleWrapperClick}
          onMouseMove={() => setShowControls(true)}
        >
          {/* Video element wrapper */}
          <div className="cpe-nativeVideoWrapper">
            <video
              ref={videoRef}
              src={url}
              onClick={handlePlayPause}
              onTimeUpdate={handleTimeUpdate}
              onSeeking={handleSeeking}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => {
                setIsPlaying(false);
                if (onComplete) onComplete();
              }}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              playsInline
              autoPlay
            />

            {/* Passive Non-Interactive Progress Bar */}
            <div className="cpe-passive-progress-bar">
              <div 
                className="cpe-passive-progress-fill" 
                style={{ width: `${duration ? (playedSeconds / duration) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Custom Controls Overlay */}
          <div className={`cpe-controls-overlay ${showControls ? 'visible' : 'hidden'}`}>
            
            {/* Spacer to push controls footer to the bottom */}
            <div style={{ flex: 1 }} />

            {/* Bottom controls panel */}
            <div className="cpe-controls-footer">
              <div className="cpe-controls-row">
                {/* Left group: Play, Time */}
                <div className="cpe-controls-group">
                  <button className="cpe-control-icon-btn" onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}>
                    {isPlaying ? <LuPause size={20} /> : <LuPlay size={20} />}
                  </button>
                  <div className="cpe-time-display">
                    <span>{formatTime(playedSeconds)}</span>
                    <span className="cpe-time-separator">/</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Right group: Fullscreen & Options menu */}
                <div className="cpe-controls-group">
                  
                  {/* Fullscreen button */}
                  <button className="cpe-control-icon-btn" onClick={(e) => { e.stopPropagation(); handleFullscreen(); }}>
                    <LuMaximize size={20} />
                  </button>

                  {/* 3-Dot Options menu */}
                  <div className="cpe-options-container">
                    <button 
                      className="cpe-control-icon-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowOptionsMenu(!showOptionsMenu);
                      }}
                      title="More Settings"
                    >
                      <FiMoreVertical size={20} />
                    </button>

                    {showOptionsMenu && (
                      <div className="cpe-options-menu" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Volume Slider row */}
                        <div className="cpe-menu-row">
                          <span className="cpe-menu-label">Volume</span>
                          <div className="cpe-menu-volume-group">
                            <button className="cpe-menu-icon-btn" onClick={handleToggleMute}>
                              {isMuted || volume === 0 ? <LuVolumeX size={18} /> : <LuVolume2 size={18} />}
                            </button>
                            <input 
                              type="range" 
                              min="0" 
                              max="1" 
                              step="0.05" 
                              value={isMuted ? 0 : volume} 
                              onChange={handleVolumeChange}
                              className="cpe-volume-slider"
                            />
                          </div>
                        </div>

                        <div className="cpe-menu-divider" />

                        {/* Playback speed selector row */}
                        <div className="cpe-menu-row flex-col">
                          <span className="cpe-menu-label">Playback Speed</span>
                          <div className="cpe-menu-speed-grid">
                            {[0.5, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                              <button 
                                key={rate} 
                                className={`cpe-menu-speed-btn ${playbackRate === rate ? 'active' : ''}`}
                                onClick={() => handleSpeedChange(rate)}
                              >
                                {rate}x
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>

        {/* 2. Details Section (Continuation of Player Card) */}
        <div className="cpe-details-section">
          <h2 className="cpe-details-title">{title}</h2>
          
          <p className="cpe-details-desc">{description}</p>

          <div className="cpe-details-meta">
            <span className={`cpe-meta-badge ${status}`}>
              {status}
            </span>
            <span className="cpe-meta-duration-pill">
              {durationLabel} mins
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default CpePlayer;
