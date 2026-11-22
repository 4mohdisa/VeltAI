// E11 · About
// App version, build number, credits. (The third-party licenses row pointed at
// a dead domain — removed until a real licenses page exists.)
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { SettingsList } from '@/components/display/SettingsList';
import { Text } from '@/components/primitives/Text';
import { color } from '@/lib/design/tokens';
import { APP_VERSION, BUILD_NUMBER } from '@/lib/appVersion';

export default function AboutScreen() {
  const { t } = useTranslation();
  return (
    <Screen variant="floating" eyebrow={t('settings.aboutEyebrow')} title={t('settings.about')} showBack contentStyle={{ gap: 26 }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text variant="title1" color={color.label}>
          Lume
        </Text>
        <Text variant="footnote" color={color.secondaryLabel}>
          {t('settings.aboutDetails.tagline')}
        </Text>
      </View>

      <SettingsList
        rows={[
          { icon: 'pricetag-outline', label: t('settings.aboutDetails.version'), value: APP_VERSION, kind: 'plain' },
          { icon: 'construct-outline', label: t('settings.aboutDetails.build'), value: BUILD_NUMBER, kind: 'plain' },
          { icon: 'people-outline', label: t('settings.aboutDetails.credits'), value: t('settings.aboutDetails.creditsValue'), kind: 'plain' },
        ]}
      />
    </Screen>
  );
}
