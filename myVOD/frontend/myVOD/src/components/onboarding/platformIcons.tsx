import type { ReactNode } from "react";

/**
 * Platform icons mapping for VOD platforms.
 * Maps platform slug to SVG icon component.
 */

export const platformIcons: Record<string, (props: { className?: string }) => ReactNode> = {
  netflix: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.5 2A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 2h-11ZM8 4h8v16H8V4Z"/>
    </svg>
  ),
  hbomax: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/>
    </svg>
  ),
  disneyplus: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  primevideo: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.5 2.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5S11.17 1 12 1s1.5.67 1.5 1.5zM12 5c-2.76 0-5 2.24-5 5v7c0 2.76 2.24 5 5 5s5-2.24 5-5V10c0-2.76-2.24-5-5-5zm-3 10V8h6v7c0 1.1-.9 2-2 2s-2-.9-2-2z"/>
    </svg>
  ),
  appletvplus: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.41 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  ),
  // Placeholder for platforms without specific icons
  default: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 14H3V8h18v12zM9 10v8l7-4z"/>
    </svg>
  ),
};

/**
 * Get platform icon component by slug
 * @param slug - Platform slug
 * @returns Icon component or null if not found
 */
export function getPlatformIcon(slug: string): ((props: { className?: string }) => ReactNode) | null {
  return platformIcons[slug.toLowerCase()] || null;
}

/**
 * Get platform icon as data URL for img src
 * @param slug - Platform slug
 * @returns Data URL string or null if not found
 */
export function getPlatformIconSrc(slug: string): string | null {
  const Icon = getPlatformIcon(slug);
  if (!Icon) return null;

  // For now, return a placeholder. In a real implementation,
  // you would render the SVG to a canvas and get the data URL
  return null;
}
