import React, { useRef, useState, useEffect } from 'react';
import { 
  LuPlay, 
  LuPause, 
  LuVolume2, 
  LuVolumeX, 
  LuMaximize, 
  LuArrowLeft,
  LuAward,
  LuSparkles,
  LuRotateCcw,
  LuClock,
  LuGraduationCap,
  LuX
} from 'react-icons/lu';
import { FiMoreVertical } from 'react-icons/fi';
import './CPE.css';

const CHECKPOINT_INTERVAL = 30; // 30-Second interval checkpoint tracking

const CpePlayer = ({ video, onClose, onComplete, onOpenExam, onCheckpointUpdate }) => {
  const { url, title, description, duration: durationLabel, resumeTime = 0 } = video;
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);
  const lastCheckpointRef = useRef(resumeTime || 0);
  const hasInitializedResumeRef = useRef(false);
  
  const [hasFinishedVideo, setHasFinishedVideo] = useState(false);
  const isFinished = hasFinishedVideo || Boolean(video.videoWatched || video.status === 'watched');
  const [hasEnded, setHasEnded] = useState(false);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [playedSeconds, setPlayedSeconds] = useState(resumeTime || 0);
  const [duration, setDuration] = useState(0);
  const [maxWatched, setMaxWatched] = useState(resumeTime || 0);
  
  // UI state
  const [showControls, setShowControls] = useState(true);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [showResumeBanner, setShowResumeBanner] = useState(false);

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

  // Initial resume seek fallback when video is already loaded
  useEffect(() => {
    const videoElem = videoRef.current;
    if (!videoElem) return;

    if (videoElem.readyState >= 1 && !hasInitializedResumeRef.current && resumeTime > 0 && !isFinished) {
      hasInitializedResumeRef.current = true;
      const dur = videoElem.duration || 0;
      if (dur > 0 && resumeTime < dur) {
        videoElem.currentTime = resumeTime;
        setPlayedSeconds(resumeTime);
        setMaxWatched(resumeTime);
        lastCheckpointRef.current = resumeTime;
        setShowResumeBanner(true);
        const timer = setTimeout(() => setShowResumeBanner(false), 8000);
        return () => clearTimeout(timer);
      }
    }
  }, [resumeTime, isFinished]);

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    let timeout;
    if (isPlaying && showControls && !hasEnded) {
      timeout = setTimeout(() => {
        setShowControls(false);
        setShowOptionsMenu(false);
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls, hasEnded]);

  const handlePlayPause = () => {
    if (hasEnded) {
      handleReplay();
      return;
    }
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
    if (isNaN(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Replay Video handler
  const handleReplay = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    setPlayedSeconds(0);
    setHasEnded(false);
    setIsPlaying(true);
    videoRef.current.play().catch((err) => console.log('Replay error:', err));
  };

  // Restart from beginning if user prefers not to resume
  const handleRestartFromBeginning = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setPlayedSeconds(0);
      setIsPlaying(true);
    }
    setShowResumeBanner(false);
  };

  // Video Element event handlers
  const handleTimeUpdate = () => {
    const videoElem = videoRef.current;
    if (!videoElem) return;

    const curTime = videoElem.currentTime;
    setPlayedSeconds(curTime);

    // Natural progress tracking for forward-seek restriction
    if (!isFinished) {
      if (curTime > maxWatched && curTime - maxWatched < 2.0) {
        setMaxWatched(curTime);
      }

      // 30-Second Checkpoint Trigger (0:30, 1:00, 1:30, etc.)
      const milestone = Math.floor(curTime / CHECKPOINT_INTERVAL) * CHECKPOINT_INTERVAL;
      if (milestone > 0 && milestone > lastCheckpointRef.current) {
        lastCheckpointRef.current = milestone;
        if (onCheckpointUpdate) {
          onCheckpointUpdate(video.id, milestone);
        }
      }
    }

    // Check complete
    if (duration && curTime / duration >= 0.99) {
      if (!isFinished) {
        setHasFinishedVideo(true);
        setHasEnded(true);
        setShowControls(true);
        if (onComplete) onComplete();
      }
    }
  };

  // Seeking event handler: block skipping forward ONLY during mandatory initial watch
  const handleSeeking = () => {
    const videoElem = videoRef.current;
    if (!videoElem) return;

    // Block forward seeking past maxWatched only if video is NOT finished yet
    if (!isFinished && videoElem.currentTime > maxWatched) {
      videoElem.currentTime = maxWatched;
      setPlayedSeconds(maxWatched);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);

      // Seek to checkpoint if video has resumeTime and isn't finished
      if (!hasInitializedResumeRef.current && resumeTime > 0 && resumeTime < dur && !isFinished) {
        hasInitializedResumeRef.current = true;
        videoRef.current.currentTime = resumeTime;
        setPlayedSeconds(resumeTime);
        setMaxWatched(resumeTime);
        lastCheckpointRef.current = resumeTime;
        setShowResumeBanner(true);
        setTimeout(() => setShowResumeBanner(false), 8000);
      }
    }
  };

  // Scrubber / Seekbar Click Handler (unlocked when finished)
  const handleProgressBarClick = (e) => {
    if (!isFinished || !duration || !progressBarRef.current || !videoRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = clickRatio * duration;
    videoRef.current.currentTime = targetTime;
    setPlayedSeconds(targetTime);
    setHasEnded(false);
  };

  const handleProgressBarMouseMove = (e) => {
    if (!duration || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(ratio * 100);
    setHoverTime(ratio * duration);
  };

  const handleProgressBarMouseLeave = () => {
    setHoverTime(null);
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
      {/* Top Navigation Bar */}
      <div className="cpe-player-top-bar">
        <button type="button" className="cpe-player-back-btn" onClick={onClose}>
          <LuArrowLeft size={16} />
          <span>Back to Modules</span>
        </button>
        {video.tag && <span className="cpe-player-top-tag">{video.tag}</span>}
      </div>
      
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
                setHasFinishedVideo(true);
                setHasEnded(true);
                setShowControls(true);
                if (onComplete) onComplete();
              }}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              playsInline
              autoPlay
            />

            {/* Passive bottom progress bar (visible when controls overlay is hidden) */}
            {!showControls && (
              <div className="cpe-passive-progress-bar">
                <div 
                  className="cpe-passive-progress-fill" 
                  style={{ width: `${duration ? (playedSeconds / duration) * 100 : 0}%` }}
                />
              </div>
            )}
          </div>

          {/* End of Video Completion Overlay */}
          {hasEnded && (
            <div className="cpe-end-overlay" onClick={(e) => e.stopPropagation()}>
              <div className="cpe-end-modal">
                <div className="cpe-end-icon-badge">
                  <LuAward size={30} />
                </div>
                <h3 className="cpe-end-title">Training Module Completed!</h3>
                <p className="cpe-end-desc">
                  You have finished watching this video module. Seeking controls are now unlocked for replay and review.
                </p>
                <div className="cpe-end-actions">
                  <button 
                    type="button" 
                    className="cpe-end-btn cpe-end-btn--replay"
                    onClick={handleReplay}
                  >
                    <LuRotateCcw size={16} />
                    <span>Replay with Seek Controls</span>
                  </button>
                  {onOpenExam && !video.examPassed && (
                    <button 
                      type="button" 
                      className="cpe-end-btn cpe-end-btn--exam"
                      onClick={() => onOpenExam(video)}
                    >
                      <LuGraduationCap size={16} />
                      <span>Attend Exam</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Custom Controls Overlay */}
          <div className={`cpe-controls-overlay ${showControls ? 'visible' : 'hidden'}`}>
            
            {/* Spacer to push controls footer to the bottom */}
            <div style={{ flex: 1 }} />

            {/* Bottom controls panel */}
            <div className="cpe-controls-footer">
              
              {/* Interactive Seekbar Scrubber */}
              <div 
                ref={progressBarRef}
                className={`cpe-player-progressbar-wrap ${isFinished ? 'interactive' : 'locked'}`}
                onClick={handleProgressBarClick}
                onMouseMove={handleProgressBarMouseMove}
                onMouseLeave={handleProgressBarMouseLeave}
                title={isFinished ? "Click or drag to seek" : "Seeking forward is locked during initial training"}
              >
                <div className="cpe-player-progress-track">
                  <div 
                    className="cpe-player-progress-fill" 
                    style={{ width: `${duration ? (playedSeconds / duration) * 100 : 0}%` }}
                  />
                  {isFinished && (
                    <div 
                      className="cpe-player-progress-thumb"
                      style={{ left: `${duration ? (playedSeconds / duration) * 100 : 0}%` }}
                    />
                  )}
                  {isFinished && hoverTime !== null && (
                    <div 
                      className="cpe-player-seek-tooltip"
                      style={{ left: `${hoverPosition}%` }}
                    >
                      {formatTime(hoverTime)}
                    </div>
                  )}
                </div>
              </div>

              <div className="cpe-controls-row">
                {/* Left group: Play, Replay, Time */}
                <div className="cpe-controls-group">
                  <button 
                    className="cpe-control-icon-btn" 
                    onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <LuPause size={20} /> : <LuPlay size={20} />}
                  </button>

                  {isFinished && (
                    <button 
                      className="cpe-control-icon-btn cpe-control-replay-btn" 
                      onClick={(e) => { e.stopPropagation(); handleReplay(); }}
                      title="Replay Video (Seek controls unlocked)"
                    >
                      <LuRotateCcw size={18} />
                    </button>
                  )}

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
          
          {/* Resume Checkpoint Info Banner (Positioned cleanly below the video) */}
          {showResumeBanner && (
            <div className="cpe-resume-below-banner">
              <div className="cpe-resume-below-left">
                <div className="cpe-resume-badge-icon">
                  <LuPlay size={12} className="cpe-resume-play-icon" />
                </div>
                <div className="cpe-resume-below-content">
                  <div className="cpe-resume-below-header">
                    <span className="cpe-resume-pill-tag">Resumed</span>
                    <span className="cpe-resume-time-text">
                      Checkpoint: <strong>{formatTime(resumeTime)}</strong>
                    </span>
                  </div>
                  <p className="cpe-resume-subtext">
                    Playback continued from your previous progress
                  </p>
                </div>
              </div>

              <div className="cpe-resume-below-actions">
                <button 
                  type="button" 
                  className="cpe-resume-restart-btn"
                  onClick={handleRestartFromBeginning}
                  title="Start video over from 0:00"
                >
                  <LuRotateCcw size={12} />
                  <span>Restart (0:00)</span>
                </button>
                <button 
                  type="button" 
                  className="cpe-resume-dismiss-btn"
                  onClick={() => setShowResumeBanner(false)}
                  aria-label="Dismiss resume notice"
                >
                  <LuX size={15} />
                </button>
              </div>
            </div>
          )}

          <h2 className="cpe-details-title">{title}</h2>
          
          {description && <p className="cpe-details-desc">{description}</p>}

          <div className="cpe-details-meta">
            <span className={`cpe-meta-badge ${isFinished ? 'watched' : 'pending'}`}>
              {isFinished ? 'Video Watched' : 'In Progress'}
            </span>
            <span className="cpe-meta-duration-pill">
              {durationLabel} mins
            </span>
          </div>

          {/* Exam Assessment Banner */}
          <div className="cpe-player-exam-banner">
            {isFinished ? (
              <div className="cpe-player-exam-flex">
                <div className="cpe-player-exam-info">
                  <div className="cpe-player-exam-title-row">
                    <LuAward size={20} className="cpe-player-exam-icon" />
                    <span className="cpe-player-exam-title">
                      {video.examAttended ? 'Module Assessment Status' : 'Assessment Exam Available'}
                    </span>
                    {video.examAttended && (
                      <span className={`cpe-exam-score-chip ${video.examScore === 20 ? 'chip-full' : video.examPassed ? 'chip-pass' : 'chip-fail'}`}>
                        Score: {video.examScore} / 20 {video.examScore === 20 ? '• Full Mark' : video.examPassed ? '• Passed' : '• Failed'}
                      </span>
                    )}
                  </div>
                  <p className="cpe-player-exam-text">
                    {video.examAttended ? (
                      video.examScore === 20 ? (
                        "Congratulations! You achieved full marks (20 / 20). No re-attend needed."
                      ) : video.examPassed ? (
                        `Great job passing with ${video.examScore} / 20 marks! You can re-attend anytime to aim for full marks.`
                      ) : (
                        `You scored ${video.examScore} / 20 marks. Pass mark is 15 / 20. Please re-attend the exam to earn your certificate.`
                      )
                    ) : (
                      "Video completed! Take the 20-mark assessment exam (Pass mark: 15 / 20) to certify completion."
                    )}
                  </p>
                </div>

                <div className="cpe-player-exam-action-wrap">
                  {!video.examAttended ? (
                    <button 
                      type="button" 
                      className="cpe-exam-primary-btn cpe-btn-attend"
                      onClick={() => onOpenExam && onOpenExam(video)}
                    >
                      <LuGraduationCap size={17} />
                      <span>Attend Exam</span>
                    </button>
                  ) : video.examScore === 20 ? (
                    <div className="cpe-full-mark-indicator">
                      <LuSparkles size={16} />
                      <span>Full Marks (20/20)</span>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      className="cpe-exam-primary-btn cpe-btn-reattend"
                      onClick={() => onOpenExam && onOpenExam(video)}
                    >
                      <LuRotateCcw size={15} />
                      <span>Re-attend Exam</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="cpe-player-exam-locked">
                <LuClock size={16} />
                <span>Finish watching the full video to unlock the 20-mark assessment exam.</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default CpePlayer;
