'use client';

import { useCallback } from 'react';
import { soundEffects } from '../utils/soundEffects';

export const useSoundEffects = () => {
  const onHover = useCallback(async () => {
    await soundEffects.playHoverSound();
  }, []);

  const onClick = useCallback(async () => {
    await soundEffects.playClickSound();
  }, []);

  const onFocus = useCallback(async () => {
    await soundEffects.playFocusSound();
  }, []);

  const onSuccess = useCallback(async () => {
    await soundEffects.playSuccessSound();
  }, []);

  const toggleSound = useCallback(() => {
    soundEffects.setEnabled(!soundEffects.isSoundEnabled());
  }, []);

  return {
    onHover,
    onClick,
    onFocus,
    onSuccess,
    isSoundEnabled: soundEffects.isSoundEnabled(),
    toggleSound,
  };
}; 