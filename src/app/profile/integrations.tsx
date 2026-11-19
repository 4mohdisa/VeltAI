// Connected apps — link Strava / WHOOP over OAuth and import their workouts.
// Reads GET /api/integrations; connect opens the provider's OAuth URL in a
// browser (expo-web-browser), sync imports activities. When the backend has no
// credentials configured the connect call 503s and the row explains the
// provider isn't available yet. Offline-safe: a failed list degrades to every
// provider showing "Not connected".
import { useCallback, useEffect, useState } from 'react';
import { PixelRatio, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Svg, { Path } from 'react-native-svg';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Skeleton } from '@/components/display';
import { mixHex } from '@/components/domain/GymCalendar';
import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { accent, categoryAccent, color, radius, space } from '@/lib/design/tokens';
import { api, ApiError } from '@/lib/api';
import { track } from '@/lib/analytics';
import type { IntegrationConnection } from '@/lib/types';
import { APP_SCHEME } from '@/lib/appVersion';

type OAuthProvider = {
  key: string;
  name: string;
  /** The design's drawn glyph (Profile bundle b09a5e65 :664-670), stroked in `stroke`. */
  glyph: string;
  stroke: string;
  blurb: string;
  connect: () => Promise<{ url: string }>;
  sync: () => Promise<{ imported: number; skipped: number }>;
};

const PROVIDERS: OAuthProvider[] = [
  {
    key: 'strava',
    name: 'Strava',
    glyph: 'M3.6 18.4l4.6-8.6 3.4 4.6 3.2-6.6 3 5.2 3-5.8',
    stroke: accent.orange,
    blurb: 'Import your runs, rides and swims as gym sessions.',
    connect: api.integrations.connectStrava,
    sync: api.integrations.syncStrava,
  },
  {
    key: 'whoop',
    name: 'WHOOP',
    glyph:
      'M8.6 4.6h6.8a3.4 3.4 0 013.4 3.4v8a3.4 3.4 0 01-3.4 3.4H8.6A3.4 3.4 0 015.2 16V8a3.4 3.4 0 013.4-3.4ZM9.4 9.4l2.6 5.2 2.6-5.2',
    stroke: color.label,
    blurb: 'Import WHOOP workouts with their calorie burn.',
    connect: api.integrations.connectWhoop,
    sync: api.integrations.syncWhoop,
  },
];

/** The design's provider row (Profile bundle b09a5e65 :442, :447). No token
 *  covers either: an 11 gap between the glyph and the name block, and a
 *  600 16/21 name. */
const PROVIDER_ROW_GAP = 11;
const PROVIDER_NAME_SIZE = 16;
const PROVIDER_NAME_LINE_HEIGHT = 21;

/** The design's glyph chip (bundle :443-444, :822): a 34 square tinted with the
 *  provider colour at 14% on white, holding a 19 glyph stroked at 1.9. No token
 *  covers these. */
const PROVIDER_CHIP_SIZE = 34;
const PROVIDER_CHIP_TINT = 0.14;
const PROVIDER_GLYPH_SIZE = 19;
const PROVIDER_GLYPH_STROKE = 1.9;

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
    <Screen variant="floating" eyebrow={eyebrow} title="Connected apps" showBack contentStyle={{ gap: space.xl }}>
      <Text variant="footnote" color={color.secondaryLabel}>
        Link a fitness app to import workouts automatically.
      </Text>
      <View style={{ gap: space.sm }}>
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: PROVIDER_ROW_GAP }}>
                    <View
                      style={{
                        width: PROVIDER_CHIP_SIZE,
                        height: PROVIDER_CHIP_SIZE,
                        borderRadius: radius.sm,
                        backgroundColor: mixHex(p.stroke, color.white, PROVIDER_CHIP_TINT),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Svg width={PROVIDER_GLYPH_SIZE} height={PROVIDER_GLYPH_SIZE} viewBox="0 0 24 24" fill="none">
                        <Path
                          d={p.glyph}
                          stroke={p.stroke}
                          strokeWidth={PROVIDER_GLYPH_STROKE}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </View>
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text
                        variant="bodyBold"
                        color={color.label}
                        style={{ fontSize: PROVIDER_NAME_SIZE, lineHeight: PROVIDER_NAME_LINE_HEIGHT * PixelRatio.getFontScale() }}
                      >
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
      </View>
    </Screen>
  );
}
