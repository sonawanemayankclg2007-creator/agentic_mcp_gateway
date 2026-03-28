export const GRAPHICS_QUALITY_STORAGE_KEY = 'aveops-gfx-quality'

/** @returns {'high' | 'low'} */
export function readGraphicsQuality() {
  if (typeof window === 'undefined') return 'high'
  try {
    return window.localStorage.getItem(GRAPHICS_QUALITY_STORAGE_KEY) === 'low' ? 'low' : 'high'
  } catch {
    return 'high'
  }
}

/** @param {'high' | 'low'} q */
export function writeGraphicsQuality(q) {
  try {
    window.localStorage.setItem(GRAPHICS_QUALITY_STORAGE_KEY, q)
  } catch {
    /* ignore */
  }
}
