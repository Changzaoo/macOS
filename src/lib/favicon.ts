export const getFaviconUrl = (siteUrl: string, size = 128): string => {
  try {
    const domain = new URL(siteUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
  } catch {
    return '';
  }
};
