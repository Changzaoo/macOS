import type { VercelDockApp } from '../types/vercel';

type VercelProjectsResponse = {
  apps?: VercelDockApp[];
  configured?: boolean;
  syncedAt?: string;
  error?: string;
};

export type VercelAppsResult = {
  apps: VercelDockApp[];
  configured: boolean;
  syncedAt?: string;
  error?: string;
};

export async function fetchVercelDockApps(): Promise<VercelAppsResult> {
  const response = await fetch('/api/vercel/projects', {
    headers: { Accept: 'application/json' },
  });

  const payload: VercelProjectsResponse = await response.json().catch(() => ({} as VercelProjectsResponse));
  if (!response.ok) {
    return {
      apps: [],
      configured: payload.configured ?? true,
      error: payload.error ?? `Vercel sync failed with HTTP ${response.status}`,
    };
  }

  return {
    apps: Array.isArray(payload.apps) ? payload.apps.filter((app: VercelDockApp) => app.url && app.name) : [],
    configured: payload.configured ?? false,
    syncedAt: payload.syncedAt,
    error: payload.error,
  };
}
