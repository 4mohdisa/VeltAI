// Connected apps — link Strava / WHOOP over OAuth and import their workouts.
// Reads GET /api/integrations; connect opens the provider's OAuth URL in a
// browser (expo-web-browser), sync imports activities. When the backend has no
// credentials configured the connect call 503s and the row explains the
// provider isn't available yet. Offline-safe: a failed list reads as nothing
// connected, so the eyebrow says "Nothing connected" and each provider row
// shows its own not-connected status (blurb and Connect button), under a
// LoadFailedNotice with Retry so the failure is not mistaken for the truth.
import { useCallback, useEffect, useState } from 'react';
import { PixelRatio, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import Svg, { Path } from 'react-native-svg';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { LoadFailedNotice, Skeleton } from '@/components/display';
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
  blurbKey: 'profile.integrations.stravaBlurb' | 'profile.integrations.whoopBlurb';
  connect: () => Promise<{ url: string }>;
  sync: () => Promise<{ imported: number; skipped: number }>;
};

const PROVIDERS: OAuthProvider[] = [
  {
    key: 'strava',
    name: 'Strava',
    glyph: 'M3.6 18.4l4.6-8.6 3.4 4.6 3.2-6.6 3 5.2 3-5.8',
    stroke: accent.orange,
    blurbKey: 'profile.integrations.stravaBlurb',
    connect: api.integrations.connectStrava,
    sync: api.integrations.syncStrava,
  },
  {
    key: 'whoop',
    name: 'WHOOP',
    glyph:
      'M8.6 4.6h6.8a3.4 3.4 0 013.4 3.4v8a3.4 3.4 0 01-3.4 3.4H8.6A3.4 3.4 0 015.2 16V8a3.4 3.4 0 013.4-3.4ZM9.4 9.4l2.6 5.2 2.6-5.2',
    stroke: color.label,
    blurbKey: 'profile.integrations.whoopBlurb',
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
function ago(iso: string | null | undefined, t: TFunction): string {
  if (!iso) return '';
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return t('profile.integrations.justNow');
  if (mins < 60) return t('profile.integrations.minutesAgo', { count: mins });
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return t('profile.integrations.hoursAgo', { count: hrs });
  return t('profile.integrations.daysAgo', { count: Math.round(hrs / 24) });
}

export default function IntegrationsScreen() {
  const { t } = useTranslation();
  const [conns, setConns] = useState<IntegrationConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // Reusable reload for the action handlers (event-driven setState is fine).
  const load = useCallback(async () => {
    try {
      setConns(await api.integrations.list());
      setFailed(false);
    } catch {
      setConns([]); // backend down → every provider shows as not connected
      setFailed(true);
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
        if (alive) {
          setConns([]);
          setFailed(true);
        }
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
    ? t('profile.connectionsSyncing')
    : connectedCount === 0
      ? t('profile.connectionsNone')
      : t('profile.connectionsCount', { count: connectedCount, total: PROVIDERS.length });

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
        showToast({ message: t('profile.integrations.unavailable', { name: p.name }), tone: 'info' });
      } else {
        showToast({ message: t('profile.integrations.connectFailed', { name: p.name }), tone: 'error' });
      }
    } finally {
      setBusy(null);
    }
  };

  const onSync = async (p: OAuthProvider) => {
    setBusy(p.key);
    try {
      const res = await p.sync();
      showToast({ message: t('profile.integrations.syncDone', { name: p.name, imported: res.imported, skipped: res.skipped }), tone: 'success' });
      await load();
    } catch {
      showToast({ message: t('profile.integrations.syncFailed', { name: p.name }), tone: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const onDisconnect = async (p: OAuthProvider) => {
    setBusy(p.key);
    try {
      await api.integrations.disconnect(p.key);
      showToast({ message: t('profile.integrations.disconnected', { name: p.name }), tone: 'info' });
      await load();
    } catch {
      showToast({ message: t('profile.integrations.disconnectFailed', { name: p.name }), tone: 'error' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen variant="floating" eyebrow={eyebrow} title={t('profile.connectedApps')} showBack contentStyle={{ gap: space.xl }}>
      <Text variant="footnote" color={color.secondaryLabel}>
        {t('profile.integrations.intro')}
      </Text>
      <View style={{ gap: space.sm }}>
        {failed ? <LoadFailedNotice message={t('integrationsDetails.loadFailed')} onRetry={load} /> : null}
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
                          ? conn?.last_sync_at
                            ? t('profile.integrations.connectedSynced', { time: ago(conn.last_sync_at, t) })
                            : t('profile.integrations.connected')
                          : t(p.blurbKey)}
                      </Text>
                    </View>
                  </View>

                  {connected ? (
                    <View style={{ flexDirection: 'row', gap: space.sm }}>
                      <View style={{ flex: 1 }}>
                        <Button title={t('profile.integrations.syncNow')} variant="secondary" loading={working} onPress={() => onSync(p)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button title={t('profile.integrations.disconnect')} variant="tertiary" disabled={working} onPress={() => onDisconnect(p)} />
                      </View>
                    </View>
                  ) : (
                    <Button title={t('profile.integrations.connect', { name: p.name })} variant="primary" loading={working} onPress={() => onConnect(p)} />
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
