// Connected apps — link Strava / WHOOP over OAuth and import their workouts.
// Reads GET /api/integrations; connect opens the provider's OAuth URL in a
// browser (expo-web-browser), sync imports activities. When the backend has no
// credentials configured the connect call 503s and the row explains the
// provider isn't available yet. Offline-safe: a failed list degrades to every
// provider showing "Not connected".
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Skeleton } from '@/components/display';
import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { categoryAccent, color, radius, space } from '@/lib/design/tokens';
import { api, ApiError } from '@/lib/api';
import { track } from '@/lib/analytics';
import type { IntegrationConnection } from '@/lib/types';
import { APP_SCHEME } from '@/lib/appVersion';

type OAuthProvider = {
  key: string;
  name: string;
  emoji: string;
  blurb: string;
  connect: () => Promise<{ url: string }>;
  sync: () => Promise<{ imported: number; skipped: number }>;
};

const PROVIDERS: OAuthProvider[] = [
  {
    key: 'strava',
    name: 'Strava',
    emoji: '🏃',
    blurb: 'Import your runs, rides and swims as gym sessions.',
    connect: api.integrations.connectStrava,
    sync: api.integrations.syncStrava,
  },
  {
    key: 'whoop',
    name: 'WHOOP',
    emoji: '⌚',
    blurb: 'Import WHOOP workouts with their calorie burn.',
    connect: api.integrations.connectWhoop,
    sync: api.integrations.syncWhoop,
  },
];

// ago renders a compact relative time; '' for a null timestamp.
function ago(iso: string | null | undefined): string {
  if (!iso) return '';
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function IntegrationsScreen() {
  const [conns, setConns] = useState<IntegrationConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  // Reusable reload for the action handlers (event-driven setState is fine).
  const load = useCallback(async () => {
    try {
      setConns(await api.integrations.list());
    } catch {
      setConns([]); // backend down → everything reads "not connected"
    }
  }, []);

  // Initial fetch is inlined (not a call to a setState function) so the
  // React-compiler lint doesn't flag a synchronous setState in the effect.
  useEffect(() => {
    let alive = true;
    api.integrations
      .list()
      .then((list) => {
        if (alive) setConns(list);
      })
      .catch(() => {
        if (alive) setConns([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const statusOf = (key: string) => conns.find((c) => c.provider === key);

  // Eyebrow reports what is actually connected — no invented Apple Health row
  // (the app cannot connect to it at all; see UI_PASS_GAPS.md).
  const connectedCount = PROVIDERS.filter((p) => statusOf(p.key)?.connected).length;
  const eyebrow = loading
    ? 'Sync'
    : connectedCount === 0
      ? 'Nothing connected'
      : `${connectedCount} of ${PROVIDERS.length} connected`;

  const onConnect = async (p: OAuthProvider) => {
    setBusy(p.key);
    try {
      const { url } = await p.connect();
      // The return URL must use the scheme app.json actually registers. It was
      // once hardcoded on both sides to a scheme app.json did NOT register, so
      // a callback that escaped the auth session had nowhere to return to.
      // APP_SCHEME reads app.json, so a rename cannot re-open that gap.
      const result = await WebBrowser.openAuthSessionAsync(url, `${APP_SCHEME}://integrations/${p.key}/success`);
      if (result.type === 'success') track('integration_connected', { provider: p.key });
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 503) {
        showToast({ message: `${p.name} isn't available yet — coming soon.`, tone: 'info' });
      } else {
        showToast({ message: `Couldn't connect ${p.name}.`, tone: 'error' });
      }
    } finally {
      setBusy(null);
    }
  };

  const onSync = async (p: OAuthProvider) => {
    setBusy(p.key);
    try {
      const res = await p.sync();
      showToast({ message: `${p.name}: imported ${res.imported}, skipped ${res.skipped}.`, tone: 'success' });
      await load();
    } catch {
      showToast({ message: `Couldn't sync ${p.name}.`, tone: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const onDisconnect = async (p: OAuthProvider) => {
    setBusy(p.key);
    try {
      await api.integrations.disconnect(p.key);
      showToast({ message: `${p.name} disconnected.`, tone: 'info' });
      await load();
    } catch {
      showToast({ message: `Couldn't disconnect ${p.name}.`, tone: 'error' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen variant="floating" eyebrow={eyebrow} title="Connected apps" showBack>
      <Text variant="footnote" color={color.secondaryLabel}>
        Link a fitness app to import workouts automatically.
      </Text>

      {loading ? (
        <>
          <Skeleton height={140} rounded={radius.xl} />
          <Skeleton height={140} rounded={radius.xl} />
        </>
      ) : (
        PROVIDERS.map((p) => {
          const conn = statusOf(p.key);
          const connected = conn?.connected ?? false;
          const working = busy === p.key;
          return (
            <Card key={p.key} variant="elevated">
              <View style={{ gap: space.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <Text variant="statSmall">{p.emoji}</Text>
                  <View style={{ flex: 1, gap: space.xs }}>
                    <Text variant="title3" color={color.label}>
                      {p.name}
                    </Text>
                    <Text
                      variant="footnote"
                      color={connected ? categoryAccent.positive : color.secondaryLabel}
                    >
                      {connected
                        ? `Connected${conn?.last_sync_at ? ` · synced ${ago(conn.last_sync_at)}` : ''}`
                        : p.blurb}
                    </Text>
                  </View>
                </View>

                {connected ? (
                  <View style={{ flexDirection: 'row', gap: space.sm }}>
                    <View style={{ flex: 1 }}>
                      <Button title="Sync now" variant="secondary" loading={working} onPress={() => onSync(p)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button title="Disconnect" variant="tertiary" disabled={working} onPress={() => onDisconnect(p)} />
                    </View>
                  </View>
                ) : (
                  <Button title={`Connect ${p.name}`} variant="primary" loading={working} onPress={() => onConnect(p)} />
                )}
              </View>
            </Card>
          );
        })
      )}

    </Screen>
  );
}
