import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  LuPlay, 
  LuCheck, 
  LuClock, 
  LuRotateCcw, 
  LuGraduationCap, 
  LuAward, 
  LuBookOpen,
  LuSparkles
} from 'react-icons/lu';
import './CPE.css';
import CpePlayer from './CpePlayer';

// Enhanced training module video data
const DUMMY_VIDEOS = [
  {
    id: '1',
    title: 'Introduction to Workplace Safety',
    description: 'Learn the essentials of maintaining a safe environment at work, hazard recognition, and emergency response procedures.',
    duration: '0:46',
    category: 'Health & Safety',
    bannerGradient: 'linear-gradient(135deg, #0F7A67 0%, #084339 100%)',
    badgeColor: '#0F7A67',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    status: 'pending' // 'pending' | 'watched'
  },
  {
    id: '2',
    title: 'Advanced Communication Skills',
    description: 'Enhance your workplace communication, master active listening, and resolve team conflicts with confidence.',
    duration: '0:46',
    category: 'Soft Skills',
    bannerGradient: 'linear-gradient(135deg, #1E88E5 0%, #0D47A1 100%)',
    badgeColor: '#1E88E5',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    status: 'pending'
  },
  {
    id: '3',
    title: 'Time Management Fundamentals',
    description: 'Discover practical techniques to prioritize daily tasks, overcome procrastination, and boost productivity.',
    duration: '0:46',
    category: 'Productivity',
    bannerGradient: 'linear-gradient(135deg, #D97706 0%, #92400E 100%)',
    badgeColor: '#D97706',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    status: 'watched'
  },
  {
    id: '4',
    title: 'Leadership in the Digital Age',
    description: 'Strategies for leading hybrid teams, fostering psychological safety, and driving continuous innovation.',
    duration: '0:46',
    category: 'Leadership',
    bannerGradient: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
    badgeColor: '#7C3AED',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    status: 'watched'
  }
];

const CPE = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [videos, setVideos] = useState(DUMMY_VIDEOS);
  const [searchParams, setSearchParams] = useSearchParams();

  // Retrieve active video from URL parameters
  const activeVideoId = searchParams.get('video');
  const activeVideo = videos.find(v => v.id === activeVideoId) || null;

  const pendingVideos = videos.filter(v => v.status === 'pending');
  const watchedVideos = videos.filter(v => v.status === 'watched');
  const filteredVideos = activeTab === 'pending' ? pendingVideos : watchedVideos;
  
  const completionPercentage = Math.round((watchedVideos.length / videos.length) * 100);

  const handleVideoComplete = (videoId) => {
    // Mark video as watched when completed
    setVideos(prevVideos => 
      prevVideos.map(v => v.id === videoId ? { ...v, status: 'watched' } : v)
    );
  };

  return (
    <div className="cpe-container">
      {activeVideo ? (
        <CpePlayer 
          video={activeVideo}
          onClose={() => setSearchParams({})}
          onComplete={() => handleVideoComplete(activeVideo.id)}
        />
      ) : (
        <div className="cpe-listing-wrapper">
          {/* Header Summary / Progress Card */}
          <div className="cpe-overview-card">
            <div className="cpe-overview-header">
              <div className="cpe-overview-icon-badge">
                <LuGraduationCap size={20} />
              </div>
              <div className="cpe-overview-title-group">
                <div className="cpe-overview-kicker">Professional Development</div>
                <h2 className="cpe-overview-title">Training Modules</h2>
              </div>
              <div className="cpe-overview-pct-badge">
                <LuSparkles size={13} />
                <span>{completionPercentage}% Done</span>
              </div>
            </div>

            <div className="cpe-overview-progress-section">
              <div className="cpe-overview-progress-bar">
                <div 
                  className="cpe-overview-progress-fill" 
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <div className="cpe-overview-stats-row">
                <span className="cpe-overview-stat-text">
                  <strong>{watchedVideos.length}</strong> of {videos.length} modules completed
                </span>
                <span className="cpe-overview-stat-remaining">
                  {pendingVideos.length} remaining
                </span>
              </div>
            </div>
          </div>

          {/* Segmented Pill Navigation */}
          <div className="cpe-tabs-container">
            <div className="cpe-segmented-tabs" role="tablist">
              <button 
                role="tab"
                aria-selected={activeTab === 'pending'}
                className={`cpe-segmented-tab ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                <span>Pending</span>
                <span className="cpe-tab-count">{pendingVideos.length}</span>
              </button>
              <button 
                role="tab"
                aria-selected={activeTab === 'watched'}
                className={`cpe-segmented-tab ${activeTab === 'watched' ? 'active' : ''}`}
                onClick={() => setActiveTab('watched')}
              >
                <span>Watched</span>
                <span className="cpe-tab-count">{watchedVideos.length}</span>
              </button>
            </div>
          </div>

          {/* Video Cards List */}
          <section className="cpe-cards-list" aria-live="polite">
            {filteredVideos.length === 0 ? (
              <div className="cpe-empty-state">
                <div className="cpe-empty-icon-wrap">
                  {activeTab === 'pending' ? (
                    <LuAward size={34} />
                  ) : (
                    <LuBookOpen size={34} />
                  )}
                </div>
                <h3 className="cpe-empty-title">
                  {activeTab === 'pending' ? "All Caught Up!" : "No Watched Videos Yet"}
                </h3>
                <p className="cpe-empty-desc">
                  {activeTab === 'pending' 
                    ? "Great job! You have completed all assigned training modules for this cycle." 
                    : "Videos you finish watching will appear here so you can review them at any time."}
                </p>
                {activeTab === 'pending' && watchedVideos.length > 0 && (
                  <button 
                    className="cpe-empty-action-btn"
                    onClick={() => setActiveTab('watched')}
                  >
                    View Completed Modules
                  </button>
                )}
              </div>
            ) : (
              filteredVideos.map((video, index) => (
                <article 
                  className={`cpe-card ${video.status === 'watched' ? 'cpe-card--watched' : ''}`} 
                  key={video.id} 
                  style={{ '--card-order': index }}
                  onClick={() => setSearchParams({ video: video.id })}
                >
                  {/* Card Visual Banner / Thumbnail */}
                  <div 
                    className="cpe-card-banner" 
                    style={{ background: video.bannerGradient }}
                  >
                    <div className="cpe-card-banner-grid" />
                    
                    {/* Top tags row */}
                    <div className="cpe-banner-top">
                      <span className="cpe-category-pill">
                        {video.category}
                      </span>
                      {video.status === 'watched' ? (
                        <span className="cpe-status-pill cpe-status-pill--completed">
                          <LuCheck size={12} strokeWidth={2.8} />
                          Completed
                        </span>
                      ) : (
                        <span className="cpe-status-pill cpe-status-pill--pending">
                          Pending
                        </span>
                      )}
                    </div>

                    {/* Center Floating Play Button */}
                    <div className="cpe-banner-center">
                      <div className="cpe-play-badge">
                        <LuPlay size={20} fill="currentColor" />
                      </div>
                    </div>

                    {/* Bottom banner info */}
                    <div className="cpe-banner-bottom">
                      <span className="cpe-duration-tag">
                        <LuClock size={12} />
                        <span>{video.duration} mins</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="cpe-card-body">
                    <div className="cpe-card-header-row">
                      <h3 className="cpe-card-title">{video.title}</h3>
                    </div>
                    
                    <p className="cpe-card-desc">{video.description}</p>
                    
                    <div className="cpe-card-footer">
                      <div className="cpe-card-module-tag">
                        Module {String(video.id).padStart(2, '0')}
                      </div>

                      <button 
                        className={`cpe-action-btn ${video.status === 'watched' ? 'cpe-action-btn--watched' : 'cpe-action-btn--primary'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchParams({ video: video.id });
                        }}
                      >
                        {video.status === 'watched' ? (
                          <>
                            <LuRotateCcw size={14} />
                            <span>Watch Again</span>
                          </>
                        ) : (
                          <>
                            <LuPlay size={14} fill="currentColor" />
                            <span>Watch Video</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default CPE;
