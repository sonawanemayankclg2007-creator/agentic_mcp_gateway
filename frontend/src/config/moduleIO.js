/** Shared layout + theming for module-specific chat inputs and output cards */

export const MODULE_KEYS = ['DevOps', 'FinOps', 'Pricing', 'Talent', 'Supply Chain', 'GeoSpatial']

export const MODULE_IO = {
  DevOps: {
    key: 'DevOps',
    label: 'DevOps',
    tagline: 'Triage · PR · Slack',
    placeholder: 'Paste a GitHub issue URL or describe the incident…',
    inputMode: 'url',
    multiline: false,
    shellClass:
      'border-violet-500/25 focus-within:border-violet-400/50 focus-within:shadow-[0_0_28px_-8px_rgba(139,92,246,0.55)]',
    fieldClass: 'font-mono text-[13px]',
    accent: '#8b5cf6',
    quickActions: [
      { label: 'Sample issue URL', value: 'https://github.com/acme/api/issues/142' },
      { label: 'Login bug', value: 'Login fails on mobile Safari — session cookie not set' },
    ],
  },
  FinOps: {
    key: 'FinOps',
    label: 'FinOps',
    tagline: 'Cost · anomalies · forecast',
    placeholder: 'Paste anomaly narrative, owner, or lightweight cost JSON…',
    inputMode: 'finance',
    multiline: true,
    minRows: 4,
    shellClass:
      'border-sky-500/25 focus-within:border-sky-400/50 focus-within:shadow-[0_0_28px_-8px_rgba(56,189,248,0.45)]',
    fieldClass: 'font-mono text-[12px] leading-relaxed',
    accent: '#38bdf8',
    quickActions: [
      { label: 'Spend spike', value: 'AWS us-east-1 EC2 +42% WoW vs 4-week baseline — owner infra@' },
      { label: 'JSON hint', value: '{"service":"RDS","delta_pct":18.2,"period":"2025-03"}' },
    ],
  },
  Pricing: {
    key: 'Pricing',
    label: 'Pricing',
    tagline: 'SKUs · elasticity · alerts',
    placeholder: 'SKU, category, or “compare tier-2 hubs in EU”…',
    inputMode: 'sku',
    multiline: false,
    shellClass:
      'border-amber-400/30 focus-within:border-amber-400/55 focus-within:shadow-[0_0_28px_-8px_rgba(251,191,36,0.35)]',
    fieldClass: 'text-sm tracking-wide',
    accent: '#fbbf24',
    quickActions: [
      { label: 'SKU', value: 'SKU-ELECTRON-DOCK-01' },
      { label: 'Category', value: 'USB-C hubs · B2B tier' },
    ],
  },
  Talent: {
    key: 'Talent',
    label: 'Talent',
    tagline: 'Roles · match · shortlist',
    placeholder: 'Paste the job description or bullets for the ideal profile…',
    inputMode: 'jd',
    multiline: true,
    minRows: 5,
    shellClass:
      'border-fuchsia-400/25 focus-within:border-fuchsia-400/50 focus-within:shadow-[0_0_28px_-8px_rgba(244,114,182,0.4)]',
    fieldClass: 'text-[13px] leading-relaxed',
    accent: '#f472b6',
    quickActions: [
      {
        label: 'Senior React',
        value: 'Senior React Engineer — design system, TypeScript, remote EU. 5+ yrs.',
      },
    ],
  },
  'Supply Chain': {
    key: 'Supply Chain',
    label: 'Supply Chain',
    tagline: 'Demand · scenarios · risk',
    placeholder: 'Demand file ref, SKU cluster, or supplier delay context…',
    inputMode: 'ops',
    multiline: true,
    minRows: 3,
    shellClass:
      'border-emerald-400/25 focus-within:border-emerald-400/50 focus-within:shadow-[0_0_28px_-8px_rgba(52,211,153,0.4)]',
    fieldClass: 'text-sm',
    accent: '#34d399',
    quickActions: [
      { label: 'Demand file', value: 'demand_q2_nam.csv · SKU clustering by DC-04' },
      { label: 'Bottleneck', value: 'Supplier LT for component X slipped 9d — need scenarios' },
    ],
  },
  GeoSpatial: {
    key: 'GeoSpatial',
    label: 'GeoSpatial',
    tagline: 'Sites · scores · maps',
    placeholder: 'Street address, plus codes, or lat/lon + use case…',
    inputMode: 'geo',
    multiline: false,
    shellClass:
      'border-red-400/25 focus-within:border-red-400/45 focus-within:shadow-[0_0_28px_-8px_rgba(248,113,113,0.35)]',
    fieldClass: 'text-sm',
    accent: '#f87171',
    quickActions: [
      { label: 'Address', value: '221B Baker St, London — retail suitability' },
      { label: 'Lat/lon', value: '51.5074,-0.1278 · last-mile hub' },
    ],
  },
}

export function getModuleIO(module) {
  return MODULE_IO[module] || MODULE_IO.DevOps
}
