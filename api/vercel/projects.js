const VERCEL_API = 'https://api.vercel.com';

const ICON_HINTS = [
  ['trade', 'CandlestickChart'],
  ['chart', 'LineChart'],
  ['crypto', 'Coins'],
  ['cripto', 'Coins'],
  ['coin', 'Coins'],
  ['bet', 'Trophy'],
  ['sport', 'Trophy'],
  ['garden', 'Leaf'],
  ['grow', 'TrendingUp'],
  ['crescer', 'TrendingUp'],
  ['admin', 'Shield'],
  ['api', 'Server'],
  ['bot', 'Bot'],
  ['shop', 'ShoppingCart'],
  ['music', 'Music'],
  ['video', 'Video'],
  ['blog', 'Newspaper'],
];

const GRADIENTS = [
  'linear-gradient(145deg, #49a8ff, #1f6dff 52%, #8f7cff)',
  'linear-gradient(145deg, #7df2b7, #10b981 48%, #0891b2)',
  'linear-gradient(145deg, #ffe071, #f59e0b 48%, #ef5da8)',
  'linear-gradient(145deg, #72d7ff, #8b5cf6 52%, #ef5da8)',
  'linear-gradient(145deg, #ff7a7a, #ef4444 50%, #ffb84d)',
  'linear-gradient(145deg, #6ee7f9, #06b6d4 48%, #34d399)',
  'linear-gradient(145deg, #dbeafe, #60a5fa 48%, #64748b)',
];

function send(res, status, payload, cache = 's-maxage=60, stale-while-revalidate=300') {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.end(JSON.stringify(payload));
}

function hash(input) {
  return [...input].reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
}

function pickGradient(name) {
  return GRADIENTS[Math.abs(hash(name)) % GRADIENTS.length];
}

function pickIcon(name) {
  const normalized = name.toLowerCase();
  return ICON_HINTS.find(([hint]) => normalized.includes(hint))?.[1] ?? 'AppWindow';
}

function humanize(name) {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeUrl(value) {
  if (!value || typeof value !== 'string') return '';
  const url = value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`;
  try {
    const parsed = new URL(url);
    return parsed.href.replace(/\/$/, '');
  } catch {
    return '';
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

function iconScore(icon) {
  const rel = icon.rel ?? '';
  const sizes = icon.sizes ?? '';
  const size = sizes
    .split(/\s+/)
    .map((item) => Number(item.split('x')[0]))
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0] ?? 0;
  return size + (rel.includes('apple-touch-icon') ? 320 : 0) + (icon.href?.endsWith('.svg') ? 120 : 0);
}

function absoluteUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return '';
  }
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

async function resolveManifestIcon(manifestUrl, baseUrl) {
  try {
    const response = await fetchWithTimeout(manifestUrl, { headers: { Accept: 'application/manifest+json, application/json' } }, 3500);
    if (!response.ok) return '';
    const manifest = await response.json();
    const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
    const icon = icons
      .filter((item) => item?.src)
      .map((item) => ({ href: item.src, sizes: item.sizes ?? '', rel: 'manifest' }))
      .sort((a, b) => iconScore(b) - iconScore(a))[0];
    return icon ? absoluteUrl(icon.href, baseUrl) : '';
  } catch {
    return '';
  }
}

async function resolveLogoUrl(siteUrl) {
  try {
    const response = await fetchWithTimeout(siteUrl, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'macOS-dock-vercel-sync/1.0',
      },
    }, 4500);
    if (!response.ok) throw new Error(`Unable to fetch ${siteUrl}`);
    const html = await response.text();
    const tags = html.match(/<link\s+[^>]*>/gi) ?? [];
    const links = tags.map(parseAttrs);
    const manifestHref = links.find((attrs) => attrs.rel?.toLowerCase().includes('manifest'))?.href;
    const manifestIcon = manifestHref ? await resolveManifestIcon(absoluteUrl(manifestHref, siteUrl), siteUrl) : '';
    if (manifestIcon) return manifestIcon;

    const icon = links
      .filter((attrs) => attrs.href && attrs.rel?.toLowerCase().includes('icon'))
      .map((attrs) => ({
        href: attrs.href,
        rel: attrs.rel.toLowerCase(),
        sizes: attrs.sizes ?? '',
      }))
      .sort((a, b) => iconScore(b) - iconScore(a))[0];
    return icon ? absoluteUrl(icon.href, siteUrl) : `${new URL(siteUrl).origin}/favicon.ico`;
  } catch {
    try {
      return `${new URL(siteUrl).origin}/favicon.ico`;
    } catch {
      return '';
    }
  }
}

function deploymentUrl(project) {
  const latestDeployments = Array.isArray(project.latestDeployments) ? project.latestDeployments : [];
  const production = latestDeployments.find((item) => item?.target === 'production' && item?.state === 'READY');
  const ready = latestDeployments.find((item) => item?.state === 'READY');
  const selected = production ?? ready ?? latestDeployments[0] ?? {};
  const candidates = [
    project.targets?.production?.url,
    project.targets?.production?.alias?.[0],
    selected.alias?.[0],
    selected.url,
    project.alias?.[0],
    project.name ? `${project.name}.vercel.app` : '',
  ];
  return candidates.map(normalizeUrl).find(Boolean) ?? '';
}

function projectDashboardUrl(project, teamSlug) {
  if (!teamSlug || !project.name) return '';
  return `https://vercel.com/${teamSlug}/${project.name}`;
}

async function mapLimit(items, limit, mapper) {
  const results = [];
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await mapper(items[current], current);
    }
  });
  await Promise.all(workers);
  return results;
}

async function vercelRequest(path, token) {
  const response = await fetchWithTimeout(path, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  }, 8000);

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Vercel API ${response.status}: ${body}`);
  }

  return response.json();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    send(res, 405, { apps: [], configured: false, error: 'Method not allowed' }, 'no-store');
    return;
  }

  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    send(res, 200, {
      apps: [],
      configured: false,
      error: 'VERCEL_TOKEN is not configured on the server.',
    }, 'no-store');
    return;
  }

  try {
    const url = new URL('/v9/projects', VERCEL_API);
    url.searchParams.set('limit', process.env.VERCEL_DOCK_LIMIT ?? '100');
    url.searchParams.set('latestDeployments', '1');
    if (process.env.VERCEL_TEAM_ID) url.searchParams.set('teamId', process.env.VERCEL_TEAM_ID);
    if (process.env.VERCEL_TEAM_SLUG) url.searchParams.set('slug', process.env.VERCEL_TEAM_SLUG);

    const payload = await vercelRequest(url.href, token);
    const projects = Array.isArray(payload.projects) ? payload.projects : [];
    const includeSelf = process.env.VERCEL_DOCK_INCLUDE_SELF === 'true';
    const excluded = new Set(
      [
        ...(process.env.VERCEL_DOCK_EXCLUDE_PROJECTS ?? '').split(','),
        includeSelf ? '' : process.env.VERCEL_PROJECT_ID,
        includeSelf ? '' : process.env.VERCEL_PROJECT_NAME,
      ]
        .map((item) => item?.trim())
        .filter(Boolean),
    );

    const projectApps = projects
      .filter((project) => !excluded.has(project.id) && !excluded.has(project.name))
      .filter((project) => deploymentUrl(project));

    const apps = await mapLimit(projectApps, 8, async (project) => {
      const url = deploymentUrl(project);
      const logoUrl = await resolveLogoUrl(url);
      return {
        id: `vercel-${project.id ?? project.name}`,
        projectId: project.id ?? '',
        slug: project.name,
        name: humanize(project.name ?? 'Vercel App'),
        url,
        logoUrl,
        icon: pickIcon(project.name ?? ''),
        gradient: pickGradient(project.name ?? ''),
        updatedAt: project.updatedAt ?? project.createdAt ?? 0,
        framework: project.framework ?? '',
        gitRepo: project.link?.repo ?? '',
        gitOrg: project.link?.org ?? '',
        productionBranch: project.link?.productionBranch ?? '',
        vercelProjectUrl: projectDashboardUrl(project, process.env.VERCEL_TEAM_SLUG),
        source: 'vercel',
      };
    });

    apps.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    send(res, 200, {
      apps,
      configured: true,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    send(res, 502, {
      apps: [],
      configured: true,
      error: error instanceof Error ? error.message : 'Unable to sync Vercel projects.',
    }, 'no-store');
  }
}
