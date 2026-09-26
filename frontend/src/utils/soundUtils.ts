// Utility for playing announcement sound alerts and managing desktop notifications

export const playAnnouncementSound = (isMuted: boolean = false) => {
  if (isMuted) return;
  playSynthesizedChime();
};

export const playSynthesizedChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    
    // First note: D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.2);

    // Second higher note: A5 (880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.error("Synthesizer sound play error:", e);
  }
};

export const requestDesktopNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  // Prompt for notification permission at most once per client browser
  const alreadyPrompted = localStorage.getItem('easytrack_notif_perm_prompted') === 'true';
  if (alreadyPrompted) return false;

  try {
    localStorage.setItem('easytrack_notif_perm_prompted', 'true');
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (e) {
    return false;
  }
};

export const triggerDesktopNotification = async (title: string, body: string, notificationKey?: string) => {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  // If a unique notification key is provided, ensure it is shown ONCE across visits
  if (notificationKey) {
    try {
      const notifiedKeys: string[] = JSON.parse(localStorage.getItem('easytrack_notified_keys') || '[]');
      if (notifiedKeys.includes(notificationKey)) {
        return; // Already notified once, suppress repeat messages on visit
      }
      notifiedKeys.push(notificationKey);
      if (notifiedKeys.length > 100) notifiedKeys.shift();
      localStorage.setItem('easytrack_notified_keys', JSON.stringify(notifiedKeys));
    } catch {
      // Storage fallback
    }
  }

  try {
    const notif = new Notification(title, {
      body,
      tag: notificationKey || `easytrack-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      requireInteraction: false
    });
    notif.onclick = () => {
      window.focus();
    };
  } catch (e) {
    console.error("Desktop notification error:", e);
  }
};
