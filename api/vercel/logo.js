const FALLBACK_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#6ee7f9"/><stop offset=".52" stop-color="#60a5fa"/><stop offset="1" stop-color="#f0abfc"/></linearGradient></defs><rect width="128" height="128" rx="30" fill="url(#g)"/><path fill="#fff" d="M64 26 98 88H30z" opacity=".92"/></svg>';

function sendSvg(res, svg, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.end(svg);
}

function safeSiteUrl(raw) {
  try {
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host === '0.0.0.0' ||
      host.startsWith('127.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host === '::1'
    ) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseAttrs(tag) {
  const attrs = {};
  const attrPattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*["']([^"']*)["']/g;
  let match = attrPattern.exec(tag);
  while (match) {
    attrs[match[1].toLowerCase()] = match[2];
    match = attrPattern.exec(tag);
  }
  return attrs;
}

function absoluteUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return '';
  }
}

function iconScore(icon) {
  const rel = icon.rel ?? '';
  const sizes = icon.sizes ?? '';
  const size = sizes
    .split(/\s+/)
    .map((item) => Number(item.split('x')[0]))
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0] ?? 0;
  return size + (rel.includes('apple-touch-icon') ? 500 : 0) + (rel.includes('mask-icon') ? -200 : 0) + (icon.href?.endsWith('.svg') ? 140 : 0);
}

async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function htmlCandidates(siteUrl) {
  try {
    const response = await fetchWithTimeout(siteUrl, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'macOS-dock-logo-resolver/1.0',
      },
    }, 4500);
    if (!response.ok) return [];

    const html = await response.text();
    const linkTags = html.match(/<link\s+[^>]*>/gi) ?? [];
    const metaTags = html.match(/<meta\s+[^>]*>/gi) ?? [];
    const links = linkTags.map(parseAttrs);
    const metas = metaTags.map(parseAttrs);

    const manifestHref = links.find((attrs) => attrs.rel?.toLowerCase().includes('manifest'))?.href;
    const manifestIcons = manifestHref ? await manifestCandidates(absoluteUrl(manifestHref, siteUrl), siteUrl) : [];
    const linkIcons = links
      .filter((attrs) => attrs.href && attrs.rel?.toLowerCase().includes('icon'))
      .map((attrs) => ({
        href: absoluteUrl(attrs.href, siteUrl),
        rel: attrs.rel.toLowerCase(),
        sizes: attrs.sizes ?? '',
      }))
      .filter((item) => item.href)
      .sort((a, b) => iconScore(b) - iconScore(a))
      .map((item) => item.href);

    const ogImage = metas.find((attrs) =>
      ['og:image', 'twitter:image'].includes((attrs.property ?? attrs.name ?? '').toLowerCase())
    )?.content;

    return [
      ...manifestIcons,
      ...linkIcons,
      ogImage ? absoluteUrl(ogImage, siteUrl) : '',
    ].filter(Boolean);
  } catch {
    return [];
  }
}

async function manifestCandidates(manifestUrl, baseUrl) {
  try {
    const response = await fetchWithTimeout(manifestUrl, {
      headers: { Accept: 'application/manifest+json, application/json' },
    }, 3500);
    if (!response.ok) return [];
    const manifest = await response.json();
    const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
    return icons
      .filter((item) => item?.src)
      .map((item) => ({ href: absoluteUrl(item.src, baseUrl), rel: 'manifest', sizes: item.sizes ?? '' }))
      .filter((item) => item.href)
      .sort((a, b) => iconScore(b) - iconScore(a))
      .map((item) => item.href);
  } catch {
    return [];
  }
}

async function tryImage(url) {
  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        Accept: 'image/avif,image/webp,image/svg+xml,image/png,image/jpeg,image/x-icon,*/*;q=0.8',
        'User-Agent': 'macOS-dock-logo-resolver/1.0',
      },
    }, 5000);
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('image') && !contentType.includes('svg')) return null;
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength < 32) return null;
    return {
      body: Buffer.from(arrayBuffer),
      contentType: contentType || 'image/png',
    };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendSvg(res, FALLBACK_ICON, 405);
    return;
  }

  const site = safeSiteUrl(req.query?.url);
  if (!site) {
    sendSvg(res, FALLBACK_ICON, 400);
    return;
  }

  const origin = site.origin;
  const candidates = [
    ...(await htmlCandidates(site.href)),
    `${origin}/apple-touch-icon.png`,
    `${origin}/apple-touch-icon-precomposed.png`,
    `${origin}/icon-512.png`,
    `${origin}/icon-192.png`,
    `${origin}/icon.png`,
    `${origin}/favicon.svg`,
    `${origin}/favicon.png`,
    `${origin}/favicon.ico`,
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(site.hostname)}&sz=128`,
  ];

  const seen = new Set();
  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);
    const image = await tryImage(candidate);
    if (!image) continue;
    res.statusCode = 200;
    res.setHeader('Content-Type', image.contentType);
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.end(image.body);
    return;
  }

  sendSvg(res, FALLBACK_ICON);
}
