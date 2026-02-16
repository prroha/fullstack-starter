/**
 * Configuration Persistence - Handles localStorage persistence.
 */

const STORAGE_KEY = "studio_config";

export interface StoredConfig {
  tier: string;
  features: string[];
  template: string | null;
  updatedAt: string;
}

/**
 * Save configuration to localStorage
 */
export function saveConfig(config: Omit<StoredConfig, "updatedAt">): void {
  try {
    const stored: StoredConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (err) {
    console.error("Failed to save config:", err);
  }
}

/**
 * Load configuration from localStorage
 */
export function loadConfig(): StoredConfig | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    // Validate structure before trusting parsed data
    if (
      typeof parsed !== 'object' || parsed === null ||
      typeof parsed.tier !== 'string' ||
      !Array.isArray(parsed.features) ||
      !parsed.features.every((f: unknown) => typeof f === 'string') ||
      (parsed.template !== null && typeof parsed.template !== 'string') ||
      typeof parsed.updatedAt !== 'string'
    ) {
      console.warn('Invalid stored config, clearing');
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed as StoredConfig;
  } catch (err) {
    console.error("Failed to load config:", err);
    return null;
  }
}

/**
 * Clear stored configuration
 */
export function clearConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear config:", err);
  }
}

/**
 * Check if config exists in localStorage
 */
export function hasStoredConfig(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * Get config age in milliseconds
 */
export function getConfigAge(): number | null {
  const config = loadConfig();
  if (!config) return null;

  const updatedAt = new Date(config.updatedAt);
  return Date.now() - updatedAt.getTime();
}

/**
 * Check if config is stale (older than specified time)
 */
export function isConfigStale(maxAge: number = 24 * 60 * 60 * 1000): boolean {
  const age = getConfigAge();
  return age !== null && age > maxAge;
}
