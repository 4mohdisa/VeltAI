// Report → markdown / JSON.
//
// The markdown is the point of this whole system. It is written to be pasted
// into Claude Code so a model can diagnose from real evidence — the route, the
// API trace, the console tail, the store slice — instead of from a human's
// recollection. That means: dense, complete, every field labelled, no prose
// padding, and the machine-readable parts fenced so they survive the paste.
//
// Deliberately NOT behind the impl/stub alias: it is pure string formatting
// with no native imports, so it is cheap to keep, and keeping it importable
// means the format can be unit-tested without the flag on.
import type { DebugReport } from './types';

const fence = (lang: string, body: string) => '```' + lang + '\n' + body + '\n```';

const yesNo = (v: boolean | null | undefined): string => (v === null || v === undefined ? 'unknown' : v ? 'yes' : 'no');

/** One report as a markdown section. */
export function reportToMarkdown(r: DebugReport): string {
  const c = r.context;
  const out: string[] = [];

  out.push(`## ${r.severity.toUpperCase()} · ${r.kind} · ${r.area} — ${r.title}`);
  out.push('');
  if (r.notes.trim()) {
    out.push(r.notes.trim());
    out.push('');
  }

  out.push('| | |');
  out.push('|---|---|');
  out.push(`| Report id | \`${r.id}\` |`);
  out.push(`| Captured | ${r.createdAt} |`);
  out.push(`| Trigger | ${r.trigger}${r.draft ? ' (auto-filed draft)' : ''} |`);
  out.push(`| Status | ${r.resolution} |`);
  out.push(`| Route | \`${c.route}\` |`);
  if (Object.keys(c.routeParams).length) {
    out.push(`| Route params | \`${JSON.stringify(c.routeParams)}\` |`);
  }
  if (c.componentTag) out.push(`| Component tag | \`${c.componentTag}\` |`);
  out.push(`| Build | ${c.appVersion} (${c.buildNumber})${c.gitSha ? ` · \`${c.gitSha}\`` : ''} |`);
  out.push(`| Device | ${c.device} · iOS ${c.osVersion} · ${c.screen.width}×${c.screen.height}@${c.screen.scale}x · ${c.locale} |`);
  out.push(`| Network | connected: ${yesNo(c.network.connected)}${c.network.type ? ` · ${c.network.type}` : ''} |`);
  out.push(`| Auth | signed in: ${yesNo(c.auth.signedIn)} · onboarded: ${yesNo(c.auth.onboarded)}${c.auth.userId ? ` · \`${c.auth.userId}\`` : ''} |`);
  out.push(`| Entitlement | active: ${yesNo(c.entitlement.active)}${c.entitlement.status ? ` · ${c.entitlement.status}` : ''} |`);
  out.push(`| Screenshot | ${r.screenshot ? `\`${r.screenshot}\`` : 'none'} |`);
  out.push('');

  // API trace first: it is the highest-signal section for most real bugs.
  out.push('### API calls (most recent last)');
  out.push('');
  if (c.api.length === 0) {
    out.push('_none recorded_');
  } else {
    out.push('| time | method | path | status | ms | error |');
    out.push('|---|---|---|---|---|---|');
    for (const a of c.api) {
      const t = a.at.slice(11, 23);
      out.push(`| ${t} | ${a.method} | \`${a.path}\` | ${a.status ?? '—'} | ${a.durationMs} | ${a.error ? a.error.replace(/\|/g, '\\|') : ''} |`);
    }
  }
  out.push('');

  out.push('### Console (most recent last)');
  out.push('');
  out.push(
    c.console.length === 0
      ? '_none recorded_'
      : fence('text', c.console.map((l) => `${l.at.slice(11, 23)} ${l.level.toUpperCase().padEnd(5)} ${l.text}`).join('\n')),
  );
  out.push('');

  out.push('### Breadcrumbs (most recent last)');
  out.push('');
  out.push(
    c.breadcrumbs.length === 0
      ? '_none recorded_'
      : fence(
          'text',
          c.breadcrumbs.map((b) => `${b.at.slice(11, 23)} ${b.name}${b.props ? ' ' + JSON.stringify(b.props) : ''}`).join('\n'),
        ),
  );
  out.push('');

  if (c.storeSlice) {
    out.push('### Store slice for this screen');
    out.push('');
    out.push(fence('json', JSON.stringify(c.storeSlice, null, 2)));
    out.push('');
  }

  return out.join('\n');
}

/** Every open report as one document, written for a model to read. */
export function reportsToMarkdown(reports: DebugReport[], meta?: { generatedAt?: string }): string {
  const open = reports.filter((r) => r.resolution === 'open');
  const bySeverity = (a: DebugReport, b: DebugReport) => {
    const order = { blocker: 0, major: 1, minor: 2, cosmetic: 3 } as const;
    return order[a.severity] - order[b.severity];
  };
  const sorted = [...open].sort(bySeverity);

  const head: string[] = [];
  head.push('# Lume — test session reports');
  head.push('');
  head.push(
    `${sorted.length} open report${sorted.length === 1 ? '' : 's'}${meta?.generatedAt ? `, exported ${meta.generatedAt}` : ''}. ` +
      'Captured on-device during TestFlight testing. Every section below is real evidence from the running app — ' +
      'route, API trace, console tail and store state at the moment of capture. Credentials are redacted at capture time.',
  );
  head.push('');

  if (sorted.length === 0) {
    head.push('_No open reports._');
    return head.join('\n') + '\n';
  }

  const counts = sorted.reduce<Record<string, number>>((a, r) => ({ ...a, [r.severity]: (a[r.severity] ?? 0) + 1 }), {});
  head.push(
    '**Severity:** ' +
      (['blocker', 'major', 'minor', 'cosmetic'] as const)
        .filter((s) => counts[s])
        .map((s) => `${counts[s]} ${s}`)
        .join(' · '),
  );
  head.push('');
  head.push('| # | severity | area | title | route |');
  head.push('|---|---|---|---|---|');
  sorted.forEach((r, i) => {
    head.push(`| ${i + 1} | ${r.severity} | ${r.area} | ${r.title.replace(/\|/g, '\\|')} | \`${r.context.route}\` |`);
  });
  head.push('');
  head.push('---');
  head.push('');

  return head.join('\n') + sorted.map(reportToMarkdown).join('\n---\n\n') + '\n';
}

export function reportsToJSON(reports: DebugReport[]): string {
  return JSON.stringify({ exportedReports: reports.length, reports }, null, 2);
}
