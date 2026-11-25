import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { 
  LuPlay, 
  LuClock, 
  LuRotateCcw, 
  LuAward, 
  LuSparkles,
  LuPrinter,
  LuX,
  LuGraduationCap,
  LuBrain,
  LuUsers,
  LuLayers,
  LuChevronRight,
  LuCheck
} from 'react-icons/lu';
import './CPE.css';
import CpePlayer from './CpePlayer';
import CpeExamPage from './CpeExamPage';
import ExternalTrainingForm from './ExternalTrainingForm';
import { useAuth } from '../../context/AuthContext';

// 1. Parent Categories Definition (Aries HR Design System)
const PARENT_CATEGORIES = [
  {
    id: 'ai-videos',
    title: 'AI Videos',
    icon: LuBrain,
    badgeText: null,
    totalText: '13 Videos',
    accentColor: '#6366F1',
    bgColor: '#EEF2FF',
  },
  {
    id: 'general-topics',
    title: 'General Topics',
    icon: LuUsers,
    badgeText: '18',
    totalText: '108 Videos',
    accentColor: '#0D9488',
    bgColor: '#F0FDFA',
  },
  {
    id: 'division-topics',
    title: 'Division Topics',
    icon: LuLayers,
    badgeText: '36',
    totalText: '41 Videos',
    accentColor: '#8B5CF6',
    bgColor: '#F5F3FF',
  },
  {
    id: 'external-training',
    title: 'External Training',
    icon: LuGraduationCap,
    badgeText: null,
    totalText: 'Form Submission',
    accentColor: '#D97706',
    bgColor: '#FFFBEB',
  },
];

// Helper for formatting seconds into mm:ss
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Helper to retrieve saved checkpoint from localStorage (preserves progress across page refreshes)
const getCheckpoint = (videoId, fallbackTime = 0) => {
  try {
    const saved = localStorage.getItem(`cpe_checkpoint_${videoId}`);
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }
  return fallbackTime;
};

// 2. Training module dataset organized by category with table fields
const INITIAL_VIDEOS = [
  // General Topics
  {
    id: '1',
    slNo: 1,
    categoryId: 'general-topics',
    title: 'CPR, AED and First-Aid Comprehensive Training',
    tag: 'QHSE',
    duration: '2:00',
    passMark: '15 / 20',
    score: null,
    status: 'pending',
    videoWatched: false,
    resumeTime: 30, // Hardcoded checkpoint: resumes at 30 seconds (backend placeholder)
    examAttended: false,
    examScore: null,
    examPassed: false,
    hasCertificate: false,
    url: 'https://vjs.zencdn.net/v/oceans.mp4'
  },
  {
    id: '2',
    slNo: 2,
    categoryId: 'general-topics',
    title: 'Advanced Communication Skills & Active Listening',
    tag: 'HR',
    duration: '0:46',
    passMark: '15 / 20',
    score: null,
    status: 'pending',
    videoWatched: false,
    resumeTime: 0,
    examAttended: false,
    examScore: null,
    examPassed: false,
    hasCertificate: false,
    url: 'https://vjs.zencdn.net/v/oceans.mp4'
  },
  {
    id: '3',
    slNo: 3,
    categoryId: 'general-topics',
    title: 'Time Management & Focus Fundamentals',
    tag: 'GEN',
    duration: '0:46',
    passMark: '15 / 20',
    score: '20 / 20',
    status: 'watched',
    statusText: 'Excellent Score : 20 / 20',
    videoWatched: true,
    examAttended: true,
    examScore: 20,
    examPassed: true,
    hasCertificate: true,
    url: 'https://vjs.zencdn.net/v/oceans.mp4'
  },
  {
    id: '4',
    slNo: 4,
    categoryId: 'general-topics',
    title: 'Leadership in the Digital Age & Hybrid Teams',
    tag: 'MGT',
    duration: '0:46',
    passMark: '15 / 20',
    score: '19 / 20',
    status: 'watched',
    statusText: 'Excellent Score : 19 / 20',
    videoWatched: true,
    examAttended: true,
    examScore: 19,
    examPassed: true,
    hasCertificate: true,
    url: 'https://vjs.zencdn.net/v/oceans.mp4'
  },
  // AI Videos
  {
    id: '8',
    slNo: 28,
    categoryId: 'ai-videos',
    title: 'Prompt Engineering for AI Applications',
    tag: 'AI',
    duration: '3:00',
    passMark: '15 / 20',
    score: null,
    status: 'watched',
    statusText: 'Video Watched',
    videoWatched: true,
    examAttended: false,
    examScore: null,
    examPassed: false,
    hasCertificate: false,
    url: 'https://vjs.zencdn.net/v/oceans.mp4'
  },
  // Division Topics
  {
    id: '9',
    slNo: 1,
    categoryId: 'division-topics',
    title: 'Division Quality Standards & SOP Guidelines',
    tag: 'QA',
    duration: '0:46',
    passMark: '15 / 20',
    score: null,
    status: 'pending',
    videoWatched: false,
    examAttended: false,
    examScore: null,
    examPassed: false,
    hasCertificate: false,
    url: 'https://vjs.zencdn.net/v/oceans.mp4'
  }
];

const CPE = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('pending');
  const [videos, setVideos] = useState(() => {
    return INITIAL_VIDEOS.map(v => ({
      ...v,
      resumeTime: getCheckpoint(v.id, v.resumeTime || 0)
    }));
  });
  const [selectedCertificateVideo, setSelectedCertificateVideo] = useState(null);
  const { user, userName } = useAuth();

  // URL state
  const selectedCategoryId = searchParams.get('category');
  const activeVideoId = searchParams.get('video');
  const activeExamVideoId = searchParams.get('exam');

  const selectedCategory = PARENT_CATEGORIES.find(c => c.id === selectedCategoryId) || null;
  const activeVideo = videos.find(v => v.id === activeVideoId) || null;
  const activeExamVideo = videos.find(v => v.id === activeExamVideoId) || null;

  // Videos filtered for selected category
  const categoryVideos = selectedCategoryId 
    ? videos.filter(v => v.categoryId === selectedCategoryId)
    : [];

  const pendingVideos = categoryVideos.filter(v => v.status === 'pending');
  const watchedVideos = categoryVideos.filter(v => v.status === 'watched');
  const filteredVideos = activeTab === 'pending' ? pendingVideos : watchedVideos;

  // 30-Second Checkpoint Progress Handler
  const handleCheckpointUpdate = (videoId, checkpointSeconds) => {
    // 1. Update React state
    setVideos(prev => 
      prev.map(v => v.id === videoId ? { 
        ...v, 
        resumeTime: checkpointSeconds 
      } : v)
    );

    // 2. Persist in localStorage so it survives complete app closing / reload
    try {
      localStorage.setItem(`cpe_checkpoint_${videoId}`, checkpointSeconds.toString());
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // 3. BACKEND INTEGRATION PLACEHOLDER:
    // When backend API is connected, dispatch progress update to database here:
    // e.g., api.post('/api/cpe/checkpoint', { videoId, checkpointSeconds });
    console.log(`[CPE Progress Checkpoint Saved] Video ID: ${videoId}, Checkpoint: ${checkpointSeconds}s`);
  };

  const handleVideoComplete = (videoId) => {
    setVideos(prev => 
      prev.map(v => v.id === videoId ? { 
        ...v, 
        videoWatched: true,
        resumeTime: 0 // Reset checkpoint once video is fully completed
      } : v)
    );

    try {
      localStorage.removeItem(`cpe_checkpoint_${videoId}`);
    } catch (e) {
      console.warn('LocalStorage remove error:', e);
    }
  };

  const handleOpenExam = (video) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('exam', video.id);
    setSearchParams(nextParams);
  };

  const handleCloseExam = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('exam');
    setSearchParams(nextParams);
  };

  const handleExamScoreSubmit = (videoId, score, passed, isFullMark) => {
    setVideos(prev => 
      prev.map(v => {
        if (v.id !== videoId) return v;
        return {
          ...v,
          videoWatched: true,
          examAttended: true,
          examScore: score,
          examPassed: passed,
          score: `${score} / 20`,
          status: passed ? 'watched' : v.status,
          statusText: isFullMark 
            ? 'Excellent Score : 20 / 20' 
            : passed 
              ? `Passed Score : ${score} / 20` 
              : `Score : ${score} / 20 (Pass: 15)`,
          hasCertificate: passed
        };
      })
    );
  };

  const handleSelectCategory = (categoryId) => {
    setSearchParams({ category: categoryId });
    setActiveTab('pending');
  };

  const handleOpenVideo = (videoId) => {
    if (selectedCategoryId) {
      setSearchParams({ category: selectedCategoryId, video: videoId });
    } else {
      setSearchParams({ video: videoId });
    }
  };

  const handleClosePlayer = () => {
    if (selectedCategoryId) {
      setSearchParams({ category: selectedCategoryId });
    } else {
      setSearchParams({});
    }
  };

  const handlePrintCertificate = (video, e) => {
    if (e) e.stopPropagation();
    setSelectedCertificateVideo(video);
  };

  const handleCloseCertificate = () => {
    setSelectedCertificateVideo(null);
  };

  const renderCertificateModal = () => {
    if (!selectedCertificateVideo) return null;
    return createPortal(
      <div className="cpe-modal-overlay" onClick={handleCloseCertificate}>
        <div className="cpe-cert-modal" onClick={(e) => e.stopPropagation()}>
          <div className="cpe-cert-modal-header">
            <div className="cpe-cert-modal-title-wrap">
              <LuAward size={20} className="cpe-cert-modal-icon" />
              <h3>Training Certificate</h3>
            </div>
            <button 
              className="cpe-cert-close-btn"
              onClick={handleCloseCertificate}
              aria-label="Close certificate"
            >
              <LuX size={18} />
            </button>
          </div>

          <div className="cpe-cert-preview">
            <div className="cpe-cert-frame">
              <div className="cpe-cert-watermark">
                <LuGraduationCap size={120} />
              </div>
              <div className="cpe-cert-badge-top">
                <LuCheck size={16} strokeWidth={2.8} />
                <span>Aries HR • CPE Certified</span>
              </div>
              <h2 className="cpe-cert-name">Certificate of Completion</h2>
              <p className="cpe-cert-sub">This is proudly presented to</p>
              <h1 className="cpe-cert-recipient">{user?.name || userName || "Employee"}</h1>
              <p className="cpe-cert-text">
                For successfully completing the training module and achieving the required score:
              </p>
              <h4 className="cpe-cert-topic">
                {selectedCertificateVideo.title}{' '}
                {selectedCertificateVideo.tag && `(${selectedCertificateVideo.tag})`}
              </h4>
              <div className="cpe-cert-stats-grid">
                <div className="cpe-cert-stat">
                  <span>Sl.No</span>
                  <strong>#{selectedCertificateVideo.slNo}</strong>
                </div>
                <div className="cpe-cert-stat">
                  <span>Pass Mark</span>
                  <strong>{selectedCertificateVideo.passMark}</strong>
                </div>
                <div className="cpe-cert-stat">
                  <span>Duration</span>
                  <strong>{selectedCertificateVideo.duration}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="cpe-cert-modal-footer">
            <button 
              className="cpe-cert-download-btn"
              onClick={() => {
                window.print();
              }}
            >
              <LuPrinter size={16} />
              <span>Print Certificate</span>
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // 1. ASSESSMENT EXAM FULL PAGE VIEW (Replaces popup with dedicated mobile-friendly page)
  if (activeExamVideo) {
    return (
      <div className="cpe-container">
        <CpeExamPage 
          video={activeExamVideo}
          onClose={handleCloseExam}
          onSubmitScore={handleExamScoreSubmit}
          onOpenCertificate={(video) => setSelectedCertificateVideo(video)}
        />
        {renderCertificateModal()}
      </div>
    );
  }

  // 2. VIDEO PLAYER VIEW
  if (activeVideo) {
    return (
      <div className="cpe-container">
        <CpePlayer 
          video={activeVideo}
          onClose={handleClosePlayer}
          onComplete={() => handleVideoComplete(activeVideo.id)}
          onOpenExam={handleOpenExam}
          onCheckpointUpdate={handleCheckpointUpdate}
        />
        {renderCertificateModal()}
      </div>
    );
  }

  // 2. EXTERNAL TRAINING FORM VIEW (Dedicated Form Submission)
  if (selectedCategoryId === 'external-training') {
    return (
      <div className="cpe-container">
        <ExternalTrainingForm 
          onClose={() => setSearchParams({})} 
        />
      </div>
    );
  }

  // 3. INNER CATEGORY LISTING VIEW (Clean Kanban Cards - No redundant All Categories link/arrow)
  if (selectedCategory) {
    const totalCount = categoryVideos.length;
    const completedCount = watchedVideos.length;
    const catPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <div className="cpe-container">
        <div className="cpe-listing-wrapper">
          
          {/* Inner Header Row (Title & Module Count - No redundant '< All Categories' link) */}
          <div className="cpe-inner-header-bar">
            <div className="cpe-inner-title-row">
              <h2 className="cpe-inner-title">{selectedCategory.title}</h2>
              <span className="cpe-inner-count-tag">{totalCount} Modules</span>
            </div>
          </div>

          {/* Category Progress Card */}
          <div className="cpe-overview-card">
            <div className="cpe-overview-header">
              <div className="cpe-overview-title-group">
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

          {/* Segmented Pill Tabs */}
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

          {/* Kanban Cards List */}
          <section className="cpe-kanban-list" aria-live="polite">
            {filteredVideos.length === 0 ? (
              <div className="cpe-empty-state">
                <div className="cpe-empty-icon-wrap">
                  {activeTab === 'pending' ? (
                    <LuAward size={34} />
                  ) : (
                    <LuSparkles size={34} />
                  )}
                </div>
                <h3 className="cpe-empty-title">
                  {activeTab === 'pending' ? "All Caught Up!" : "No Watched Videos Yet"}
                </h3>
                <p className="cpe-empty-desc">
                  {activeTab === 'pending' 
                    ? `Great job! You have completed all assigned training video modules in ${selectedCategory.title}.` 
                    : "Modules you finish will appear here where you can watch again or print certificates."}
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
                  className="cpe-kanban-card" 
                  key={video.id} 
                  style={{ '--card-order': index }}
                >
                  {/* Top Row: Sl.No, Title & Status */}
                  <div className="cpe-kanban-header">
                    <div className="cpe-kanban-slno">
                      <span>{video.slNo}</span>
                    </div>

                    <div className="cpe-kanban-title-wrap">
                      <h3 className="cpe-kanban-title">
                        {video.title}{' '}
                        {video.tag && <span className="cpe-kanban-tag">({video.tag})</span>}
                      </h3>
                    </div>

                    {video.status === 'watched' && (
                      <div className="cpe-kanban-status-badge">
                        <span className="cpe-status-text-green">
                          {video.statusText || 'Video Watched'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Middle Row: Duration & Pass Mark */}
                  <div className="cpe-kanban-details-row">
                    <div className="cpe-kanban-detail-item">
                      <span className="cpe-detail-label">Duration:</span>
                      <span className="cpe-detail-val cpe-duration-val">
                        <LuClock size={13} />
                        {video.duration}
                      </span>
                    </div>

                    <div className="cpe-kanban-detail-item">
                      <span className="cpe-detail-label">Pass Mark:</span>
                      <span className="cpe-detail-val">
                        {video.passMark}
                      </span>
                    </div>

                    {video.score && (
                      <div className="cpe-kanban-detail-item">
                        <span className="cpe-detail-label">Score:</span>
                        <span className="cpe-detail-val cpe-score-val">
                          {video.score}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Actions */}
                  <div className="cpe-kanban-footer">
                    <div className="cpe-kanban-actions-left">
                      {video.videoWatched ? (
                        <button 
                          type="button"
                          className="cpe-table-btn"
                          onClick={() => handleOpenVideo(video.id)}
                        >
                          <LuRotateCcw size={13} />
                          <span>Watch Again</span>
                        </button>
                      ) : video.resumeTime > 0 ? (
                        <button 
                          type="button"
                          className="cpe-table-btn cpe-table-btn--resume"
                          onClick={() => handleOpenVideo(video.id)}
                          title={`Resume from ${formatTime(video.resumeTime)}`}
                        >
                          <LuPlay size={13} />
                          <span>Resume ({formatTime(video.resumeTime)})</span>
                        </button>
                      ) : (
                        <button 
                          type="button"
                          className="cpe-table-btn"
                          onClick={() => handleOpenVideo(video.id)}
                        >
                          <LuPlay size={13} />
                          <span>Start Video</span>
                        </button>
                      )}

                      {/* Attend or Re-attend Exam Button */}
                      {video.videoWatched && (
                        !video.examAttended ? (
                          <button
                            type="button"
                            className="cpe-table-btn cpe-table-btn--exam-attend"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenExam(video);
                            }}
                          >
                            <LuGraduationCap size={13} />
                            <span>Attend Exam</span>
                          </button>
                        ) : video.examScore === 20 ? (
                          <span className="cpe-kanban-full-badge">
                            <LuSparkles size={12} />
                            <span>Full Marks (20/20)</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="cpe-table-btn cpe-table-btn--exam-reattend"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenExam(video);
                            }}
                          >
                            <LuRotateCcw size={13} />
                            <span>Re-attend Exam</span>
                          </button>
                        )
                      )}
                    </div>

                    {video.hasCertificate && (
                      <div className="cpe-kanban-actions-right">
                        <button
                          type="button"
                          className="cpe-table-btn cpe-table-btn--print"
                          onClick={(e) => handlePrintCertificate(video, e)}
                        >
                          <LuPrinter size={13} />
                          <span>Print</span>
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}
          </section>

        </div>

        {renderCertificateModal()}
      </div>
    );
  }

  // 3. PARENT MAIN VIEW (Status Table/Dashboard + 9 Training Categories Grid)
  return (
    <div className="cpe-container">
      <div className="cpe-parent-wrapper">
        
        {/* TOP: CPE Status / 2026 Dashboard Card */}
        <section className="cpe-status-card" aria-label="CPE Status 2026">
          
          {/* Card Header: CPE Status + Progress Pill */}
          <div className="cpe-status-head">
            <div className="cpe-status-badge-title">
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

          {/* Category Progress Breakdown - Clean, Uncluttered & Compact Panel */}
          <div className="cpe-status-breakdown-panel" aria-label="Category Targets Breakdown">
            
            {/* Category 1: General Topics */}
            <div 
              className="cpe-breakdown-item"
              onClick={() => handleSelectCategory('general-topics')}
              role="button"
              tabIndex={0}
              title="View General Topics"
            >
              <div className="cpe-breakdown-row-top">
                <div className="cpe-breakdown-left">
                  <div className="cpe-breakdown-icon cpe-icon--teal">
                    <LuUsers size={13} />
                  </div>
                  <span className="cpe-breakdown-name">General Topics</span>
                  <span className="cpe-breakdown-excess-pill">+06:30 Excess</span>
                </div>

                <div className="cpe-breakdown-badges">
                  <span className="cpe-breakdown-tag cpe-tag--done">
                    <LuCheck size={10} strokeWidth={3} />
                    Done
                  </span>
                </div>
              </div>

              <div className="cpe-breakdown-row-bottom">
                <div className="cpe-breakdown-track">
                  <div className="cpe-breakdown-bar cpe-bar--green" style={{ width: '100%' }} />
                </div>
                <span className="cpe-breakdown-hours">
                  <strong className="cpe-hours--green">12:30</strong>
                  <span className="cpe-hours-target"> / 12:30 hrs</span>
                </span>
              </div>
            </div>

            {/* Category 2: Division Topics */}
            <div 
              className="cpe-breakdown-item"
              onClick={() => handleSelectCategory('division-topics')}
              role="button"
              tabIndex={0}
              title="View Division Topics"
            >
              <div className="cpe-breakdown-row-top">
                <div className="cpe-breakdown-left">
                  <div className="cpe-breakdown-icon cpe-icon--purple">
                    <LuLayers size={13} />
                  </div>
                  <span className="cpe-breakdown-name">Division Topics</span>
                </div>

                <div className="cpe-breakdown-badges">
                  <span className="cpe-breakdown-tag cpe-tag--pending">
                    11:30 left
                  </span>
                </div>
              </div>

              <div className="cpe-breakdown-row-bottom">
                <div className="cpe-breakdown-track">
                  <div className="cpe-breakdown-bar cpe-bar--purple" style={{ width: '8%' }} />
                </div>
                <span className="cpe-breakdown-hours">
                  <strong className="cpe-hours--amber">1:00</strong>
                  <span className="cpe-hours-target"> / 12:30 hrs</span>
                </span>
              </div>
            </div>

            {/* Category 3: External Training */}
            <div 
              className="cpe-breakdown-item"
              onClick={() => handleSelectCategory('external-training')}
              role="button"
              tabIndex={0}
              title="View External Training"
            >
              <div className="cpe-breakdown-row-top">
                <div className="cpe-breakdown-left">
                  <div className="cpe-breakdown-icon cpe-icon--amber">
                    <LuGraduationCap size={13} />
                  </div>
                  <span className="cpe-breakdown-name">External Training</span>
                </div>

                <div className="cpe-breakdown-badges">
                  <span className="cpe-breakdown-tag cpe-tag--pending">
                    10:00 left
                  </span>
                </div>
              </div>

              <div className="cpe-breakdown-row-bottom">
                <div className="cpe-breakdown-track">
                  <div className="cpe-breakdown-bar cpe-bar--amber" style={{ width: '60%' }} />
                </div>
                <span className="cpe-breakdown-hours">
                  <strong className="cpe-hours--amber">15:00</strong>
                  <span className="cpe-hours-target"> / 25:00 hrs</span>
                </span>
              </div>
            </div>

          </div>

        </section>

        {/* BOTTOM: 9 Parent Categories Grid */}
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
                  </div>

                  {category.totalText && (
                    <div className="cpe-parent-footer-row">
                      <span className="cpe-parent-footer-pill">
                        {category.totalText}
                      </span>
                    </div>
                  )}
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


