// The review screen: list, filter, open, resolve, edit, export, share.
//
// The export is the feature that changes the workflow — one markdown document
// of every open report, laid out for a model to diagnose from. See ../export.ts.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Share, TextInput, View } from 'react-native';
// The legacy API (documentDirectory/readAsStringAsync) is still shipped in
// SDK 56 and is a much smaller surface than the new File/Directory classes for
// what this needs. Revisit if it is removed.
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { Text } from '@/components/primitives/Text';
import { reportsToJSON, reportsToMarkdown } from '../export';
import { SEVERITIES, type DebugReport, type Resolution, type Severity } from '../types';
import { loadReports, screenshotUri, setResolution, subscribeReports, syncPending, updateReport } from './store';
import { showToast } from '@/components/display/toastStore';

const INK = '#1C1C1E';
const PAPER = '#FFFFFF';
const MUTED = '#6B6B6B';

const SEV_COLOR: Record<Severity, string> = {
  blocker: '#B3261E',
  major: '#B26A00',
  minor: '#4A4A4A',
  cosmetic: '#8A8A8A',
};

export function DebugScreen({ onClose }: { onClose: () => void }) {
  const [reports, setReports] = useState<DebugReport[]>([]);
  const [sev, setSev] = useState<Severity | 'all'>('all');
  const [area, setArea] = useState<string>('all');
  const [showResolved, setShowResolved] = useState(false);
  const [open, setOpen] = useState<DebugReport | null>(null);

  useEffect(() => {
    void loadReports().then(setReports);
    return subscribeReports(setReports);
  }, []);

  const areas = useMemo(() => ['all', ...new Set(reports.map((r) => r.area))], [reports]);

  const visible = useMemo(
    () =>
      reports.filter(
        (r) =>
          (showResolved || r.resolution === 'open') &&
          (sev === 'all' || r.severity === sev) &&
          (area === 'all' || r.area === area),
      ),
    [reports, sev, area, showResolved],
  );

  const exportFile = useCallback(
    async (kind: 'md' | 'json') => {
      const all = await loadReports();
      const body = kind === 'md' ? reportsToMarkdown(all, { generatedAt: new Date().toISOString() }) : reportsToJSON(all);
      const path = `${FileSystem.cacheDirectory}lume-reports.${kind}`;
      await FileSystem.writeAsStringAsync(path, body);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, {
          mimeType: kind === 'md' ? 'text/markdown' : 'application/json',
          dialogTitle: 'Lume test reports',
        });
      } else {
        // Fallback: the text itself through the system share sheet.
        await Share.share({ message: body });
      }
    },
    [],
  );

  const chip = (label: string, on: boolean, onPress: () => void, tint = INK) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={{
        paddingHorizontal: 11,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: on ? tint : '#F0F0F0',
        marginRight: 7,
        marginBottom: 7,
      }}
    >
      <Text variant="footnote" color={on ? PAPER : INK}>
        {label}
      </Text>
    </Pressable>
  );

  const openCount = reports.filter((r) => r.resolution === 'open').length;
  const unsynced = reports.filter((r) => !r.synced).length;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: PAPER, paddingTop: 60, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Text variant="title2" color={INK} style={{ flex: 1 }}>
            Reports ({openCount} open)
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text variant="body" color={MUTED}>
              Done
            </Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <Pressable
            onPress={() => void exportFile('md')}
            style={{ backgroundColor: INK, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginRight: 8 }}
          >
            <Text variant="footnote" color={PAPER}>
              Export markdown
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void exportFile('json')}
            style={{ backgroundColor: '#F0F0F0', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginRight: 8 }}
          >
            <Text variant="footnote" color={INK}>
              JSON
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              void syncPending().then(({ ok, failed, error }) => {
                showToast({
                  message: failed === 0
                    ? `Synced ${ok} report${ok === 1 ? '' : 's'}.`
                    : `${failed} report${failed === 1 ? '' : 's'} could not sync — ${error ?? 'unknown error'} (they are safe on this device).`,
                  tone: failed === 0 ? 'success' : 'error',
                });
              });
            }}
            style={{ backgroundColor: '#F0F0F0', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 }}
          >
            <Text variant="footnote" color={INK}>
              Sync ({unsynced})
            </Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {chip('all', sev === 'all', () => setSev('all'))}
          {SEVERITIES.map((s) => chip(s, sev === s, () => setSev(s), SEV_COLOR[s]))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {areas.map((a) => chip(a, area === a, () => setArea(a)))}
          {chip(showResolved ? 'hide resolved' : 'show resolved', showResolved, () => setShowResolved((v) => !v))}
        </View>

        <ScrollView style={{ flex: 1 }}>
          {visible.length === 0 ? (
            <Text variant="footnote" color={MUTED}>
              Nothing here. Long-press the bubble, or shake, to file one.
            </Text>
          ) : (
            visible.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => setOpen(r)}
                style={{ borderBottomWidth: 1, borderBottomColor: '#EEE', paddingVertical: 12 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: SEV_COLOR[r.severity] }} />
                  <Text variant="body" color={INK} style={{ flex: 1 }}>
                    {r.title}
                  </Text>
                  {!r.synced ? (
                    <Text variant="footnote" color={MUTED}>
                      ●
                    </Text>
                  ) : null}
                </View>
                <Text variant="footnote" color={MUTED}>
                  {r.severity} · {r.kind} · {r.area} · {r.context.route} · {r.createdAt.slice(0, 16).replace('T', ' ')}
                  {r.draft ? ' · draft' : ''}
                  {r.resolution !== 'open' ? ` · ${r.resolution}` : ''}
                </Text>
              </Pressable>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {open ? <ReportDetail report={open} onClose={() => setOpen(null)} /> : null}
    </Modal>
  );
}

function ReportDetail({ report, onClose }: { report: DebugReport; onClose: () => void }) {
  const [notes, setNotes] = useState(report.notes);

  const resolve = async (r: Resolution) => {
    await setResolution(report.id, r);
    onClose();
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={{ flex: 1, backgroundColor: PAPER }} contentContainerStyle={{ padding: 18, gap: 10 }}>
        <View style={{ flexDirection: 'row' }}>
          <Text variant="title3" color={INK} style={{ flex: 1 }}>
            {report.title}
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text variant="body" color={MUTED}>
              Close
            </Text>
          </Pressable>
        </View>

        <Text variant="footnote" color={MUTED}>
          {report.severity} · {report.kind} · {report.area} · {report.trigger}
        </Text>

        {report.screenshot ? (
          <Image
            source={{ uri: screenshotUri(report.screenshot) }}
            style={{ width: '100%', height: 380, resizeMode: 'contain', backgroundColor: '#FAFAFA', borderRadius: 10 }}
          />
        ) : null}

        <Text variant="footnote" color={MUTED}>
          Notes
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          onBlur={() => void updateReport(report.id, { notes })}
          multiline
          placeholder="Add notes after the fact"
          placeholderTextColor={MUTED}
          style={{
            borderWidth: 1,
            borderColor: '#DDD',
            borderRadius: 10,
            padding: 10,
            minHeight: 70,
            textAlignVertical: 'top',
            color: INK,
          }}
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(['resolved', 'wontfix', 'duplicate', 'open'] as Resolution[]).map((r) => (
            <Pressable
              key={r}
              onPress={() => void resolve(r)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: report.resolution === r ? INK : '#F0F0F0',
              }}
            >
              <Text variant="footnote" color={report.resolution === r ? PAPER : INK}>
                {r}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text variant="footnote" color={MUTED} style={{ marginTop: 6 }}>
          Full context (this is what the export contains)
        </Text>
        <View style={{ backgroundColor: '#FAFAFA', borderRadius: 10, padding: 10 }}>
          <Text variant="footnote" color={INK} style={{ fontFamily: 'Courier' }}>
            {JSON.stringify(report.context, null, 2).slice(0, 6000)}
          </Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </Modal>
  );
}
