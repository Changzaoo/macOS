export const getFaviconUrl = (siteUrl: string, size = 128): string => {
  try {
    const url = new URL(siteUrl);
    const params = new URLSearchParams({ url: url.href, size: String(size) });
    return `/api/vercel/logo?${params.toString()}`;
  } catch {
    return '';
  }
};
