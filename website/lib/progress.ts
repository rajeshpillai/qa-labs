const STORAGE_KEY = 'qa-labs-progress';

export function getProgress(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

export function setKataComplete(slug: string, complete: boolean): void {
  const progress = getProgress();
  if (complete) { progress[slug] = true; } else { delete progress[slug]; }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function getCompletedCount(): number {
  return Object.keys(getProgress()).length;
}

export function isKataComplete(slug: string): boolean {
  return getProgress()[slug] === true;
}
