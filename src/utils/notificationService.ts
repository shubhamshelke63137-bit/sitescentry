import { soundManager } from './audioAlert';

class SafetyNotificationService {
  private lastSpokenTime: number = 0;
  private speechThrottlingMs: number = 4000; // Throttle speech to once every 4s
  public speechEnabled: boolean = true;
  public desktopNotificationEnabled: boolean = true;

  // Request browser desktop notification permissions
  public async requestDesktopPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Speak voice announcement aloud
  public speakAlert(message: string): void {
    if (!this.speechEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const now = Date.now();
    if (now - this.lastSpokenTime < this.speechThrottlingMs) {
      return; // throttle speech
    }
    this.lastSpokenTime = now;

    try {
      window.speechSynthesis.cancel(); // cancel any pending audio
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.05; // slightly urgent speed
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis alert error:', e);
    }
  }

  // Trigger browser push/desktop notification
  public showDesktopNotification(title: string, body: string, iconUrl?: string): void {
    if (!this.desktopNotificationEnabled || typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: iconUrl || '/vite.svg',
          tag: 'sitesentry-alert',
        });
      } catch (e) {
        console.warn('Desktop notification error:', e);
      }
    }
  }

  // Vibrate mobile device if hardware supports vibration
  public triggerVibration(pattern: number[] = [200, 100, 200, 100, 300]): void {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // ignore vibration error
      }
    }
  }

  // Comprehensive safety alert dispatcher
  public dispatchViolationNotice(
    zone: string,
    violations: string[],
    isCritical: boolean
  ): void {
    const violationSummary = violations.join(' and ');
    const speechMessage = isCritical
      ? `Safety breach in ${zone}! Worker missing ${violationSummary}!`
      : `Warning in ${zone}! Missing ${violationSummary}!`;

    // 1. Audio siren or warning chime
    if (isCritical) {
      soundManager.playCriticalBreach();
    } else {
      soundManager.playWarning();
    }

    // 2. Voice announcement spoken aloud
    this.speakAlert(speechMessage);

    // 3. Desktop/browser notification
    this.showDesktopNotification(
      `SiteSentry: ${isCritical ? 'CRITICAL PPE BREACH' : 'Safety Warning'}`,
      `Worker in ${zone} identified without ${violationSummary}. Immediate inspection required.`
    );

    // 4. Device vibration
    this.triggerVibration(isCritical ? [300, 150, 300] : [200, 100]);
  }
}

export const notificationService = new SafetyNotificationService();
