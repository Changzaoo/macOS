export type VercelDockApp = {
  id: string;
  projectId: string;
  slug: string;
  name: string;
  url: string;
  canonicalUrl?: string;
  fallbackUrl?: string;
  logoUrl?: string;
  icon: string;
  gradient?: string;
  updatedAt?: number;
  framework?: string;
  gitRepo?: string;
  gitOrg?: string;
  productionBranch?: string;
  vercelProjectUrl?: string;
  source: 'vercel';
};

export type VercelSyncState = {
  status: 'idle' | 'syncing' | 'ready' | 'offline' | 'error';
  configured: boolean;
  lastSyncedAt?: string;
  error?: string;
};
