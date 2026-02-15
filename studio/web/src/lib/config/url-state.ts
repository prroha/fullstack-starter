/**
 * URL State - Handles URL query parameter encoding/decoding.
 * Format: /configure?tier=pro&template=lms&features=auth.basic,payments.stripe
 */

export interface URLConfig {
  tier?: string;
  template?: string;
  features?: string[];
  step?: string;
}

/**
 * Parse configuration from URL search params
 */
export function parseURLConfig(searchParams: URLSearchParams): URLConfig {
  const config: URLConfig = {};

  const tier = searchParams.get("tier");
  if (tier) {
    config.tier = tier;
  }

  const template = searchParams.get("template");
  if (template) {
    config.template = template;
  }

  const features = searchParams.get("features");
  if (features) {
    config.features = features.split(",").filter(Boolean);
  }

  const step = searchParams.get("step");
  if (step) {
    config.step = step;
  }

  return config;
}

/**
 * Encode configuration to URL search params
 */
export function encodeURLConfig(config: URLConfig): URLSearchParams {
  const params = new URLSearchParams();

  if (config.tier) {
    params.set("tier", config.tier);
  }

  if (config.template) {
    params.set("template", config.template);
  }

  if (config.features && config.features.length > 0) {
    params.set("features", config.features.join(","));
  }

  if (config.step) {
    params.set("step", config.step);
  }

  return params;
}

/**
 * Build URL with configuration
 */
export function buildConfigURL(
  basePath: string,
  config: URLConfig
): string {
  const params = encodeURLConfig(config);
  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Get shareable URL for current configuration
 */
export function getShareableURL(config: URLConfig): string {
  const baseURL = typeof window !== "undefined" ? window.location.origin : "";
  return buildConfigURL(`${baseURL}/configure`, config);
}

/**
 * Copy shareable URL to clipboard
 */
export async function copyShareableURL(config: URLConfig): Promise<boolean> {
  try {
    const url = getShareableURL(config);
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Update URL without navigation (replace state)
 */
export function updateURLState(config: URLConfig): void {
  if (typeof window === "undefined") return;

  const params = encodeURLConfig(config);
  const newURL = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;

  window.history.replaceState({}, "", newURL);
}

/**
 * Read current URL configuration
 */
export function readURLState(): URLConfig {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  return parseURLConfig(params);
}
