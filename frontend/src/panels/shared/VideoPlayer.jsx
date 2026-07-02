import React, { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './VideoPlayer.css';

const VideoPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // Simulate access control: false means 'out door wala' or non-subscriber
  const [hasAccess, setHasAccess] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('1080p');
  const videoRef = useRef(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skip = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime += time;
    }
  };

  const handleSpeedChange = () => {
    if (videoRef.current) {
      let currentRate = videoRef.current.playbackRate;
      let newRate = currentRate === 1 ? 1.5 : currentRate === 1.5 ? 2 : 1;
      videoRef.current.playbackRate = newRate;
      setPlaybackRate(newRate);
    }
  };

  const handleQualityChange = () => {
    // Simulate changing video source quality
    const qualities = ['720p', '1080p', '4K'];
    const currentIndex = qualities.indexOf(quality);
    const nextQuality = qualities[(currentIndex + 1) % qualities.length];
    setQuality(nextQuality);
  };

  const handleSubscribe = () => {
    // Simulate subscribing to get access
    setHasAccess(true);
  };

  return (
    <div className="video-page-container">
      <div className="video-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="creator-info">
          <img loading="lazy" decoding="async" src="https://i.pravatar.cc/150?img=53" alt="Creator" className="creator-avatar" />
          <div className="creator-details">
            <h3>Julian.X</h3>
            <span>Exclusive Content</span>
          </div>
        </div>
      </div>

      <div className="video-player-wrapper">
        {!hasAccess ? (
          <div className="locked-video-overlay">
            <div className="lock-content">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" className="lock-icon">
                <path d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 10 0v2h1zm-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3z"/>
              </svg>
              <h2>Private Video</h2>
              <p>This content is exclusive for subscribers only. Unauthorized access is blocked securely.</p>
              <button onClick={handleSubscribe} className="btn-gradient subscribe-btn">
                Subscribe to Unlock ($9.99/mo)
              </button>
            </div>
            {/* Blurred placeholder to show it is secured content */}
            <div className="blurred-background" style={{ backgroundImage: 'url(https://picsum.photos/seed/fitness/800/450)' }}></div>
          </div>
        ) : (
          <div className="custom-video-player">
            <video 
              ref={videoRef}
              className="main-video"
              src="https://www.w3schools.com/html/mov_bbb.mp4"
              onClick={togglePlay}
              loop
            />
            <div className="video-controls">
              <button onClick={togglePlay} className="control-btn play-btn">
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>
              <div className="progress-bar">
                <div className="progress-filled" style={{ width: '45%' }}></div>
              </div>
              <button className="control-btn volume-btn">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              </button>
              <button onClick={() => skip(-10)} className="control-btn skip-btn">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/></svg>
                <span className="skip-text">-10s</span>
              </button>
              <button onClick={() => skip(10)} className="control-btn skip-btn">
                <span className="skip-text">+10s</span>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>
              </button>
              <button onClick={handleSpeedChange} className="control-btn speed-btn">
                {playbackRate}x
              </button>
              <button onClick={handleQualityChange} className="control-btn speed-btn quality-btn">
                {quality}
              </button>
              <button className="control-btn fullscreen-btn">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="video-info-section">
        <h1 className="video-title">Behind the scenes at the shoot 📸🔥</h1>
        <div className="video-stats">
          <span>12.4k Views</span> • <span>Oct 24, 2026</span>
        </div>
        <p className="video-description">
          An exclusive look at yesterday's sunset photoshoot. Things got wild! Thanks to all my VIPs for making this possible.
        </p>
        <div className="interaction-bar">
          <button className="interaction-btn liked">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            2.4k
          </button>
          <button className="interaction-btn">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            145
          </button>
          <button className="interaction-btn tip-btn">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            Tip
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
