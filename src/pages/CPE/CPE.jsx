import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './CPE.css';
import CpePlayer from './CpePlayer';

// Dummy video data
const DUMMY_VIDEOS = [
  {
    id: '1',
    title: 'Introduction to Workplace Safety',
    description: 'Learn the basics of maintaining a safe environment at work, including hazard recognition, safety protocols, and emergency procedures.',
    duration: '0:46',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    status: 'pending' // 'pending' | 'watched'
  },
  {
    id: '2',
    title: 'Advanced Communication Skills',
    description: 'Enhance your communication skills for better team collaboration, active listening, and conflict resolution.',
    duration: '0:46',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    status: 'pending'
  },
  {
    id: '3',
    title: 'Time Management Fundamentals',
    description: 'Discover effective techniques to manage your time, prioritize tasks, and increase overall day-to-day productivity.',
    duration: '0:46',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    status: 'watched'
  },
  {
    id: '4',
    title: 'Leadership in the Digital Age',
    description: 'Strategies for leading teams effectively in modern digital workplaces, managing remote employees, and fostering innovation.',
    duration: '0:46',
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

  const filteredVideos = videos.filter(video => video.status === activeTab);

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
        <>
          <section className="cpe-controls">
            <div className="cpe-filterRow">
              <button 
                className={`cpe-filterTab ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending
              </button>
              <button 
                className={`cpe-filterTab ${activeTab === 'watched' ? 'active' : ''}`}
                onClick={() => setActiveTab('watched')}
              >
                Watched
              </button>
            </div>
          </section>

          <section className="cpe-list" aria-live="polite">
            {filteredVideos.length === 0 ? (
              <div className="cpe-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"></polygon>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
                <p>No {activeTab} training videos found.</p>
              </div>
            ) : (
              filteredVideos.map(video => (
                <article 
                  className="cpe-item" 
                  key={video.id} 
                  onClick={() => setSearchParams({ video: video.id })}
                >
                  <h3 className="cpe-itemTitle">{video.title}</h3>
                  <p className="cpe-itemDescription">{video.description}</p>
                  <div className="cpe-itemFooter">
                    <span className="cpe-itemDuration">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      {video.duration} mins
                    </span>
                    <button 
                      className={`cpe-watchButton ${video.status === 'watched' ? 'watched' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchParams({ video: video.id });
                      }}
                    >
                      {video.status === 'watched' ? 'Watch Again' : 'Watch'}
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default CPE;
