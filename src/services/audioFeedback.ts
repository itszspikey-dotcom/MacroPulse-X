/**
 * Sound and Haptic feedback helper for sub-second responsive interaction
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playBarcodeBeep() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, ctx.currentTime); // High pitch crisp beep A6
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);

    // Haptic vibration
    if ('vibrate' in navigator) {
      navigator.vibrate([40, 30, 40]);
    }
  } catch (e) {
    // Gracefully ignore audio autoplay restrictions
  }
}

export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Quick two-tone ascending major chord (C6 -> G6)
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1046.5, now); // C6
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1567.98, now + 0.08); // G6

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.08);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.25);

    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  } catch (e) {
    // Ignore
  }
}

export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light') {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  switch (type) {
    case 'light':
      navigator.vibrate(20);
      break;
    case 'medium':
      navigator.vibrate(40);
      break;
    case 'success':
      navigator.vibrate([30, 40, 50]);
      break;
    case 'warning':
      navigator.vibrate([80, 50, 80]);
      break;
  }
}
