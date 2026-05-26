const IMAGE_EXT_RE = /\.(avif|webp|svg|png|jpe?g|ico)(\?[^"'`\s)]*)?$/i;
const ASSET_RE = /(?:https?:\/\/[^"'`\s)]+|\/[^"'`\s)]+|\.\/[^"'`\s)]+|[^"'`\s)]+\/)?[^"'`\s)]*\.(?:avif|webp|svg|png|jpe?g|ico)(?:\?[^"'`\s)]*)?/gi;

const GRADIENTS = [
  ['#49a8ff', '#1f6dff', '#8f7cff'],
  ['#7df2b7', '#10b981', '#0891b2'],
  ['#ffe071', '#f59e0b', '#ef5da8'],
  ['#72d7ff', '#8b5cf6', '#ef5da8'],
  ['#ff7a7a', '#ef4444', '#ffb84d'],
  ['#6ee7f9', '#06b6d4', '#34d399'],
  ['#dbeafe', '#60a5fa', '#64748b'],
];

function sendSvg(res, svg, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.end(svg);
}

function hash(input) {
  return [...input].reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
}

function titleFromSite(site, label = '') {
  const raw = label || site.hostname.replace(/\.vercel\.app$/i, '').replace(/^www\./i, '');
  return raw.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim() || 'App';
}

function initials(title) {
  const words = title.split(/\s+/).filter(Boolean);
  const text = words.length > 1 ? words.slice(0, 2).map((word) => word[0]).join('') : title.slice(0, 2);
  return text.toUpperCase();
}

function fallbackIcon(site, label = '') {
  const title = titleFromSite(site, label);
  const [a, b, c] = GRADIENTS[Math.abs(hash(title)) % GRADIENTS.length];
  const letters = initials(title);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop stop-color="${a}"/><stop offset=".52" stop-color="${b}"/><stop offset="1" stop-color="${c}"/>
      </linearGradient>
      <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#020617" flood-opacity=".28"/>
      </filter>
    </defs>
    <rect width="128" height="128" rx="30" fill="url(#g)"/>
    <circle cx="38" cy="34" r="28" fill="#fff" opacity=".2"/>
    <path d="M18 92c27-39 56-42 92-10v28H18z" fill="#fff" opacity=".16"/>
    <text x="64" y="74" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif" font-size="38" font-weight="800" fill="#fff" filter="url(#s)" letter-spacing="0">${letters}</text>
  </svg>`;
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

function srcsetUrls(value, baseUrl) {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim().split(/\s+/)[0])
    .map((src) => absoluteUrl(src, baseUrl))
    .filter(Boolean);
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
  const href = icon.href ?? '';
  const text = `${href} ${rel} ${icon.alt ?? ''} ${icon.class ?? ''} ${icon.id ?? ''} ${icon.type ?? ''}`.toLowerCase();
  const size = sizes
    .split(/\s+/)
    .map((item) => Number(item.split('x')[0]))
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0] ?? 0;
  let score = size;
  if (text.includes('logo')) score += 1400;
  if (text.includes('brand')) score += 1000;
  if (text.includes('icon')) score += 720;
  if (text.includes('apple-touch-icon')) score += 650;
  if (text.includes('favicon')) score += 520;
  if (href.endsWith('.svg')) score += 180;
  if (text.includes('hero')) score -= 900;
  if (text.includes('screenshot')) score -= 900;
  if (text.includes('background')) score -= 700;
  if (text.includes('mask-icon')) score -= 250;
  return score;
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
    const imgTags = html.match(/<img\s+[^>]*>/gi) ?? [];
    const sourceTags = html.match(/<source\s+[^>]*>/gi) ?? [];
    const scriptTags = html.match(/<script\s+[^>]*>/gi) ?? [];
    const links = linkTags.map(parseAttrs);
    const metas = metaTags.map(parseAttrs);
    const images = imgTags.map(parseAttrs);
    const sources = sourceTags.map(parseAttrs);
    const scripts = scriptTags.map(parseAttrs);

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

    const bodyImages = [
      ...images.flatMap((attrs) => [
        attrs.src ? absoluteUrl(attrs.src, siteUrl) : '',
        ...srcsetUrls(attrs.srcset, siteUrl),
      ].map((href) => ({
        href,
        rel: 'img',
        alt: attrs.alt ?? '',
        class: attrs.class ?? '',
        id: attrs.id ?? '',
      }))),
      ...sources.flatMap((attrs) => srcsetUrls(attrs.srcset, siteUrl).map((href) => ({
        href,
        rel: 'source',
        type: attrs.type ?? '',
      }))),
    ]
      .filter((item) => item.href && IMAGE_EXT_RE.test(item.href))
      .sort((a, b) => iconScore(b) - iconScore(a))
      .map((item) => item.href);

    const ogImage = metas.find((attrs) =>
      ['og:image', 'twitter:image'].includes((attrs.property ?? attrs.name ?? '').toLowerCase())
    )?.content;

    const preloadImages = links
      .filter((attrs) => attrs.href)
      .filter((attrs) => (attrs.as ?? '').toLowerCase() === 'image' || IMAGE_EXT_RE.test(attrs.href))
      .map((attrs) => absoluteUrl(attrs.href, siteUrl));

    const htmlAssetImages = assetCandidates(html, siteUrl);
    const scriptImages = await scriptAssetCandidates(scripts, siteUrl);

    return [
      ...bodyImages,
      ...scriptImages,
      ...htmlAssetImages,
      ...manifestIcons,
      ogImage ? absoluteUrl(ogImage, siteUrl) : '',
      ...preloadImages,
      ...linkIcons,
    ].filter(Boolean);
  } catch {
    return [];
  }
}

function assetCandidates(text, baseUrl) {
  const matches = text.match(ASSET_RE) ?? [];
  return [...new Set(matches)]
    .map((asset) => absoluteUrl(asset, baseUrl))
    .filter(Boolean)
    .filter((href) => IMAGE_EXT_RE.test(href))
    .map((href) => ({ href, rel: 'asset' }))
    .sort((a, b) => iconScore(b) - iconScore(a))
    .map((item) => item.href);
}

async function scriptAssetCandidates(scripts, baseUrl) {
  const srcs = scripts
    .map((attrs) => attrs.src)
    .filter(Boolean)
    .map((src) => absoluteUrl(src, baseUrl))
    .filter(Boolean)
    .filter((src) => src.includes('/assets/') || src.endsWith('.js'))
    .slice(0, 6);

  const found = [];
  for (const src of srcs) {
    try {
      const response = await fetchWithTimeout(src, {
        headers: {
          Accept: 'text/javascript,application/javascript,*/*',
          'User-Agent': 'macOS-dock-logo-resolver/1.0',
        },
      }, 3500);
      if (!response.ok) continue;
      found.push(...assetCandidates(await response.text(), src));
    } catch {
      // Ignore individual bundles; another candidate may work.
    }
  }
  return [...new Set(found)].slice(0, 24);
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
    sendSvg(res, fallbackIcon(new URL('https://app.local')), 405);
    return;
  }

  const site = safeSiteUrl(req.query?.url);
  if (!site) {
    sendSvg(res, fallbackIcon(new URL('https://app.local')), 400);
    return;
  }

  const label = typeof req.query?.name === 'string' ? req.query.name : '';

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

  sendSvg(res, fallbackIcon(site, label));
}
