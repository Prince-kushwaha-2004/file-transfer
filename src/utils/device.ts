export function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

export function getOperatingSystem(): string {
  if (typeof window === 'undefined') return 'Unknown OS';
  const ua = navigator.userAgent;
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Desktop';
}

export function getBrowserName(): string {
  if (typeof window === 'undefined') return 'Browser';
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'Chrome';
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Safari';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Opera|OPR\//i.test(ua)) return 'Opera';
  return 'Browser';
}

export function getDefaultDeviceName(): string {
  if (typeof window === 'undefined') return 'My Device';
  try {
    const saved = localStorage.getItem('filesync_device_name');
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // ignore
  }

  const os = getOperatingSystem();
  const browser = getBrowserName();
  const type = getDeviceType();

  if (type === 'mobile') {
    return `${os} Phone (${browser})`;
  }
  if (type === 'tablet') {
    return `${os} Tablet (${browser})`;
  }
  return `${os} (${browser})`;
}

export function saveDeviceName(name: string): void {
  try {
    localStorage.setItem('filesync_device_name', name.trim());
  } catch {
    // ignore
  }
}
