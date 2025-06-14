'use client';

import { useState, useEffect } from 'react';
import { soundEffects } from '../utils/soundEffects';

export const VolumeSlider = () => {
  const [volume, setVolume] = useState(0.5); // Default volume at 50%
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Update the actual volume in the sound effects
    soundEffects.setVolume(volume);
  }, [volume]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(0.5); // Restore to 50% when unmuting
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
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