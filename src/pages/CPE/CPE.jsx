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
  LuSparkles,
  LuFolder,
  LuTv,
  LuPresentation,
  LuBrain,
  LuUsers,
  LuLayers,
  LuInfo,
  LuArrowLeft,
  LuChevronRight
} from 'react-icons/lu';
import './CPE.css';
import CpePlayer from './CpePlayer';

// 1. Parent Categories Definition (Aries HR Design System)
const PARENT_CATEGORIES = [
  {
    id: 'ceo-commandments',
    title: 'CEO Commandments',
    description: 'Core organizational policies & ethics',
    icon: LuFolder,
    badgeText: null,
    totalText: 'Core Directives',
    accentColor: '#D97706',
    bgColor: '#FEF3C7',
  },
  {
    id: '2026-cpe-ceo',
    title: '2026 CPE (Framed By CEO)',
    description: 'Annual strategic milestones & vision',
    icon: LuTv,
    hasInfo: false,
    badgeText: null,
    totalText: '10 Categories',
    accentColor: '#0F7A67',
    bgColor: '#E6F4F1',
  },
  {
    id: 'ceo-videos',
    title: 'CEO Videos',
    description: 'Executive townhall addresses & talks',
    icon: LuPresentation,
    badgeText: null,
    totalText: '14 Videos',
    accentColor: '#1E88E5',
    bgColor: '#EFF6FF',
  },
  {
    id: 'ai-videos',
    title: 'AI Videos',
    description: 'AI tools, workflows & automation',
    icon: LuBrain,
    badgeText: null,
    totalText: '13 Videos',
    accentColor: '#6366F1',
    bgColor: '#EEF2FF',
  },
  {
    id: 'general-topics',
    title: 'General Topics',
    description: 'Safety, soft skills & team efficiency',
    icon: LuUsers,
    badgeText: '18',
    totalText: '108 Videos',
    accentColor: '#0D9488',
    bgColor: '#F0FDFA',
  },
  {
    id: 'division-topics',
    title: 'Division Topics',
    description: 'Departmental standards & SOPs',
    icon: LuLayers,
    badgeText: '36',
    totalText: '41 Videos',
    accentColor: '#8B5CF6',
    bgColor: '#F5F3FF',
  },
  {
    id: 'external-training',
    title: 'External Training',
    description: 'Industry certifications & workshops',
    icon: LuGraduationCap,
    badgeText: null,
    totalText: 'Certificates',
    accentColor: '#D97706',
    bgColor: '#FFFBEB',
  },
  {
    id: 'my-training-details',
    title: 'My Training Details',
    description: 'Learning record & completed history',
    icon: LuAward,
    badgeText: null,
    totalText: 'History Logs',
    accentColor: '#059669',
    bgColor: '#ECFDF5',
  },
  {
    id: 'hartoise',
    title: 'Hartoise',
    description: 'Company knowledge base & library',
    icon: LuBookOpen,
    badgeText: null,
    totalText: 'Knowledge Portal',
    accentColor: '#475569',
    bgColor: '#F1F5F9',
  },
];

// 2. Training module videos dataset organized by category
const INITIAL_VIDEOS = [
  // General Topics
  {
    id: '1',
    categoryId: 'general-topics',
    title: 'Introduction to Workplace Safety',
    description: 'Learn the essentials of maintaining a safe environment at work, hazard recognition, and emergency response procedures.',
    duration: '0:46',
    category: 'Health & Safety',
    bannerGradient: 'linear-gradient(135deg, #0F7A67 0%, #084339 100%)',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    status: 'pending'
  },
  {
    id: '2',
    categoryId: 'general-topics',
    title: 'Advanced Communication Skills',
    description: 'Enhance your workplace communication, master active listening, and resolve team conflicts with confidence.',
    duration: '0:46',
    category: 'Soft Skills',
    bannerGradient: 'linear-gradient(135deg, #1E88E5 0%, #0D47A1 100%)',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    status: 'pending'
  },
  {
    id: '3',
    categoryId: 'general-topics',
    title: 'Time Management Fundamentals',
    description: 'Discover practical techniques to prioritize daily tasks, overcome procrastination, and boost productivity.',
    duration: '0:46',
    category: 'Productivity',
    bannerGradient: 'linear-gradient(135deg, #D97706 0%, #92400E 100%)',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    status: 'watched'
  },
  {
    id: '4',
    categoryId: 'general-topics',
    title: 'Leadership in the Digital Age',
    description: 'Strategies for leading hybrid teams, fostering psychological safety, and driving continuous innovation.',
    duration: '0:46',
    category: 'Leadership',
    bannerGradient: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    status: 'watched'
  },
  // CEO Commandments
  {
    id: '5',
    categoryId: 'ceo-commandments',
    title: 'Company Mission & Core Values 2026',
    description: 'Understanding the overarching organizational vision, customer-first principles, and cultural pillars.',
    duration: '1:15',
    category: 'Strategy',
    bannerGradient: 'linear-gradient(135deg, #B91C1C 0%, #7F1D1D 100%)',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    status: 'pending'
  },
  // 2026 CPE (Framed By CEO)
  {
    id: '6',
    categoryId: '2026-cpe-ceo',
    title: '2026 Organizational Growth & Goals',
    description: 'Key milestones, departmental targets, and professional competency frameworks for 2026.',
    duration: '2:30',
    category: 'Executive',
    bannerGradient: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    status: 'pending'
  },
  // CEO Videos
  {
    id: '7',
    categoryId: 'ceo-videos',
    title: 'Quarterly Townhall & CEO Address',
    description: 'Insights from executive leadership on current accomplishments and upcoming market opportunities.',
    duration: '3:00',
    category: 'Executive',
    bannerGradient: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    status: 'pending'
  },
  // AI Videos
  {
    id: '8',
    categoryId: 'ai-videos',
    title: 'Leveraging AI in Daily Operations',
    description: 'Best practices for prompt engineering, workflow automation, and ethical generative AI utilization.',
    duration: '0:46',
    category: 'Technology',
    bannerGradient: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    status: 'pending'
  },
  // Division Topics
  {
    id: '9',
    categoryId: 'division-topics',
    title: 'Division Quality Standards & SOPs',
    description: 'Operational guidelines and standard operating procedures tailored for our division members.',
    duration: '0:46',
    category: 'Operations',
    bannerGradient: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    status: 'pending'
  },
  // External Training
  {
    id: '10',
    categoryId: 'external-training',
    title: 'Global Compliance & Industry Certifications',
    description: 'External regulatory standards, compliance requirements, and continuing education certification.',
    duration: '1:45',
    category: 'Compliance',
    bannerGradient: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    status: 'watched'
  },
  // My Training Details
  {
    id: '11',
    categoryId: 'my-training-details',
    title: 'Personalized Skills Matrix Review',
    description: 'Self-assessment guide and roadmap for ongoing professional milestones and career advancement.',
    duration: '0:46',
    category: 'Career Growth',
    bannerGradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    status: 'watched'
  },
  // Hartoise
  {
    id: '12',
    categoryId: 'hartoise',
    title: 'Hartoise System Navigation & Features',
    description: 'Comprehensive walkthrough of knowledge management, shared repositories, and document access.',
    duration: '0:46',
    category: 'Systems',
    bannerGradient: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    status: 'pending'
  }
];

const CPE = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('pending');
  const [videos, setVideos] = useState(INITIAL_VIDEOS);

  // URL state
  const selectedCategoryId = searchParams.get('category');
  const activeVideoId = searchParams.get('video');

  const selectedCategory = PARENT_CATEGORIES.find(c => c.id === selectedCategoryId) || null;
  const activeVideo = videos.find(v => v.id === activeVideoId) || null;

  // Filter videos for selected category (or fallback to category match)
  const categoryVideos = selectedCategoryId 
    ? videos.filter(v => v.categoryId === selectedCategoryId)
    : [];

  const pendingVideos = categoryVideos.filter(v => v.status === 'pending');
  const watchedVideos = categoryVideos.filter(v => v.status === 'watched');
  const filteredVideos = activeTab === 'pending' ? pendingVideos : watchedVideos;

  const handleVideoComplete = (videoId) => {
    setVideos(prev => 
      prev.map(v => v.id === videoId ? { ...v, status: 'watched' } : v)
    );
  };

  const handleSelectCategory = (categoryId) => {
    setSearchParams({ category: categoryId });
    setActiveTab('pending');
  };

  const handleBackToCategories = () => {
    setSearchParams({});
  };

  const handleClosePlayer = () => {
    if (selectedCategoryId) {
      setSearchParams({ category: selectedCategoryId });
    } else {
      setSearchParams({});
    }
  };

  // 1. VIDEO PLAYER VIEW
  if (activeVideo) {
    return (
      <div className="cpe-container">
        <CpePlayer 
          video={activeVideo}
          onClose={handleClosePlayer}
          onComplete={() => handleVideoComplete(activeVideo.id)}
        />
      </div>
    );
  }

  // 2. INNER CATEGORY LISTING VIEW
  if (selectedCategory) {
    const totalCount = categoryVideos.length;
    const completedCount = watchedVideos.length;
    const catPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <div className="cpe-container">
        <div className="cpe-listing-wrapper">
          
          {/* Breadcrumb / Back Bar */}
          <div className="cpe-inner-header-bar">
            <button 
              className="cpe-back-nav-btn"
              onClick={handleBackToCategories}
              aria-label="Back to categories"
            >
              <LuArrowLeft size={18} />
              <span>All Categories</span>
            </button>
            
            <div className="cpe-inner-title-row">
              <h2 className="cpe-inner-title">{selectedCategory.title}</h2>
              <span className="cpe-inner-count-tag">{totalCount} Modules</span>
            </div>
          </div>

          {/* Category Progress Card */}
          <div className="cpe-overview-card">
            <div className="cpe-overview-header">
              <div 
                className="cpe-overview-icon-badge"
                style={{ background: selectedCategory.accentColor }}
              >
                <selectedCategory.icon size={20} />
              </div>
              <div className="cpe-overview-title-group">
                <div className="cpe-overview-kicker">{selectedCategory.totalText}</div>
                <h3 className="cpe-overview-title">Category Progress</h3>
              </div>
              <div className="cpe-overview-pct-badge">
                <LuSparkles size={13} />
                <span>{catPercentage}% Done</span>
              </div>
            </div>

            <div className="cpe-overview-progress-section">
              <div className="cpe-overview-progress-bar">
                <div 
                  className="cpe-overview-progress-fill" 
                  style={{ width: `${catPercentage}%` }}
                />
              </div>
              <div className="cpe-overview-stats-row">
                <span className="cpe-overview-stat-text">
                  <strong>{completedCount}</strong> of {totalCount} completed
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
                    ? `Great job! You have completed all assigned training videos in ${selectedCategory.title}.` 
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
                  onClick={() => setSearchParams({ category: selectedCategoryId, video: video.id })}
                >
                  {/* Card Visual Banner / Thumbnail */}
                  <div 
                    className="cpe-card-banner" 
                    style={{ background: video.bannerGradient }}
                  >
                    <div className="cpe-card-banner-grid" />
                    
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

                    <div className="cpe-banner-center">
                      <div className="cpe-play-badge">
                        <LuPlay size={20} fill="currentColor" />
                      </div>
                    </div>

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
                          setSearchParams({ category: selectedCategoryId, video: video.id });
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
      </div>
    );
  }

  // 3. PARENT MAIN VIEW (Status Table/Dashboard + Category Grid)
  return (
    <div className="cpe-container">
      <div className="cpe-parent-wrapper">
        
        {/* TOP: CPE Status / 2026 Dashboard Card */}
        <section className="cpe-status-card" aria-label="CPE Status 2026">
          
          {/* Card Header: 2026 CPE Status + Progress Pill */}
          <div className="cpe-status-head">
            <div className="cpe-status-badge-title">
              <span className="cpe-status-badge-pill">2026</span>
              <h2 className="cpe-status-main-title">CPE Status</h2>
            </div>
            <div className="cpe-status-overall-pct">
              <LuSparkles size={12} />
              <span>57% Completed</span>
            </div>
          </div>

          {/* Hero Metric: Mandatory & Excess Training */}
          <div className="cpe-status-hero-metric">
            <div className="cpe-status-hero-row">
              <div className="cpe-status-hero-left">
                <span className="cpe-status-hero-label">Mandatory Training Done</span>
                <div className="cpe-status-hero-hours">
                  <span className="cpe-hero-completed">28:30</span>
                  <span className="cpe-hero-total">/ 50:00 hrs</span>
                </div>
              </div>
              <div className="cpe-status-hero-right">
                <span className="cpe-hero-excess-label">Excess Done</span>
                <span className="cpe-hero-excess-badge">+06:30 hrs</span>
              </div>
            </div>

            <div className="cpe-status-hero-bar">
              <div className="cpe-status-hero-fill" style={{ width: '57%' }} />
            </div>
          </div>

          {/* Category Breakdown (General, Division, External) */}
          <div className="cpe-status-breakdown">
            <div className="cpe-breakdown-heading">Category Breakdown</div>

            <div className="cpe-breakdown-list">
              
              {/* 1. General */}
              <div className="cpe-breakdown-item">
                <div className="cpe-breakdown-info">
                  <div className="cpe-breakdown-title-group">
                    <span className="cpe-breakdown-name">General</span>
                    <span className="cpe-breakdown-status-tag cpe-status-tag--done">
                      <LuCheck size={10} strokeWidth={3} />
                      Done
                    </span>
                  </div>
                  <div className="cpe-breakdown-hours-group">
                    <span className="cpe-breakdown-hours cpe-text--done">12:30</span>
                    <span className="cpe-breakdown-target">/ 12:30 hrs</span>
                    <span className="cpe-breakdown-excess-pill">Excess: +06:30</span>
                  </div>
                </div>
                <div className="cpe-breakdown-track">
                  <div className="cpe-breakdown-fill cpe-fill--green" style={{ width: '100%' }} />
                </div>
              </div>

              {/* 2. Division */}
              <div className="cpe-breakdown-item">
                <div className="cpe-breakdown-info">
                  <div className="cpe-breakdown-title-group">
                    <span className="cpe-breakdown-name">Division</span>
                    <span className="cpe-breakdown-status-tag cpe-status-tag--pending">
                      11:30 left
                    </span>
                  </div>
                  <div className="cpe-breakdown-hours-group">
                    <span className="cpe-breakdown-hours cpe-text--pending">1:00</span>
                    <span className="cpe-breakdown-target">/ 12:30 hrs</span>
                    <span className="cpe-breakdown-excess-muted">Excess: Nil</span>
                  </div>
                </div>
                <div className="cpe-breakdown-track">
                  <div className="cpe-breakdown-fill cpe-fill--amber" style={{ width: '8%' }} />
                </div>
              </div>

              {/* 3. External */}
              <div className="cpe-breakdown-item">
                <div className="cpe-breakdown-info">
                  <div className="cpe-breakdown-title-group">
                    <span className="cpe-breakdown-name">External</span>
                    <span className="cpe-breakdown-status-tag cpe-status-tag--pending">
                      10:00 left
                    </span>
                  </div>
                  <div className="cpe-breakdown-hours-group">
                    <span className="cpe-breakdown-hours cpe-text--pending">15:00</span>
                    <span className="cpe-breakdown-target">/ 25:00 hrs</span>
                    <span className="cpe-breakdown-excess-muted">Excess: Nil</span>
                  </div>
                </div>
                <div className="cpe-breakdown-track">
                  <div className="cpe-breakdown-fill cpe-fill--teal" style={{ width: '60%' }} />
                </div>
              </div>

            </div>
          </div>

        </section>

        {/* BOTTOM: 9 Parent Modules Grid */}
        <section className="cpe-categories-section">
          <div className="cpe-section-header">
            <h3 className="cpe-section-title">Training Categories</h3>
            <span className="cpe-section-count">{PARENT_CATEGORIES.length} Categories</span>
          </div>

          <div className="cpe-parent-grid">
            {PARENT_CATEGORIES.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <div
                  key={category.id}
                  className="cpe-parent-card"
                  style={{ '--parent-order': index }}
                  onClick={() => handleSelectCategory(category.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="cpe-parent-card-top">
                    <div 
                      className="cpe-parent-icon-wrap"
                      style={{ 
                        backgroundColor: category.bgColor, 
                        color: category.accentColor 
                      }}
                    >
                      <IconComponent size={20} />
                    </div>

                    {category.badgeText ? (
                      <span className="cpe-parent-notify-pill">
                        {category.badgeText}
                      </span>
                    ) : (
                      <span className="cpe-parent-card-arrow">
                        <LuChevronRight size={15} />
                      </span>
                    )}
                  </div>

                  <div className="cpe-parent-card-info">
                    <h4 className="cpe-parent-title">
                      {category.title}
                    </h4>
                    {category.description && (
                      <p className="cpe-parent-desc">
                        {category.description}
                      </p>
                    )}
                  </div>

                  <div className="cpe-parent-footer-row">
                    <span className="cpe-parent-footer-pill">
                      {category.totalText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
};

export default CPE;
