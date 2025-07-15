'use client';

import { useState, useEffect } from 'react';
import { soundEffects } from '../utils/soundEffects';

export const VolumeSlider = () => {
  const [volume, setVolume] = useState(() => {
    // Load volume from localStorage on component mount
    if (typeof window !== 'undefined') {
      const savedVolume = localStorage.getItem('soundVolume');
      return savedVolume ? parseFloat(savedVolume) : 0.5;
    }
    return 0.5;
  });
  const [isMuted, setIsMuted] = useState(() => {
    // Load mute state from localStorage on component mount
    if (typeof window !== 'undefined') {
      const savedMuted = localStorage.getItem('soundMuted');
      return savedMuted ? JSON.parse(savedMuted) : false;
    }
    return false;
  });

  useEffect(() => {
    // Update the actual volume in the sound effects
    soundEffects.setVolume(volume);
    // Save volume to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundVolume', volume.toString());
    }
  }, [volume]);

  useEffect(() => {
    // Save mute state to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundMuted', JSON.stringify(isMuted));
    }
  }, [isMuted]);

  // Initialize sound effects with saved volume and mute state
  useEffect(() => {
    soundEffects.setVolume(volume);
    if (isMuted) {
      soundEffects.setVolume(0);
    }
  }, []); // Run only once on mount

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(0.5); // Restore to 50% when unmuting
      setIsMuted(false);
      soundEffects.setVolume(0.5);
    } else {
      setVolume(0);
      setIsMuted(true);
      soundEffects.setVolume(0);
    }
  };

  return (
    <div className="volume-control d-flex align-items-center gap-2">
      <button 
        className="btn btn-link p-0" 
        onClick={toggleMute}
        style={{ minWidth: '24px' }}
      >
        {isMuted ? '🔇' : volume > 0.5 ? '🔊' : '🔉'}
      </button>
      <input
        type="range"
        className="form-range"
        min="0"
        max="1"
        step="0.1"
        value={volume}
        onChange={handleVolumeChange}
        style={{ width: '80px' }}
      />
    </div>
  );
}; 