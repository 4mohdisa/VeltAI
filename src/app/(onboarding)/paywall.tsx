// A18 · Paywall — the trust-building screen.
// Big "14 days free" headline, dated trial window, a "Why 14 days?" explainer,
// Start trial CTA, and a visible Restore Purchases (App Store rule). One price,
// shown plainly — no dark patterns.
import { View } from 'react-native';
import { router } from 'expo-router';
import { navigate } from '@/lib/nav';
import { Icon } from '@/components/primitives/Icon';

import { OnboardingStep } from '@/components/domain/OnboardingStep';
import { onboardingHref } from '@/lib/onboarding/steps';
import { Card } from '@/components/display/Card';
import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, space } from '@/lib/design/tokens';
import { formatCurrency, formatLongDate } from '@/lib/formatting';

export default function PaywallScreen() {
  const start = new Date();
  const end = new Date();
  end.setDate(start.getDate() + 14);

  return (
    <OnboardingStep step={17} continueLabel="Start free trial" hideContinue>
      <View style={{ gap: space.md }}>
        <Text variant="display" color={color.black}>
          14 days free.
        </Text>
        <Text variant="title3" color={color.gray700}>
          Then {formatCurrency(9.99)} per month. Cancel anytime.
        </Text>
      </View>

      <Card>
        <View style={{ gap: space.sm }}>
          <Row label="Trial starts" value={formatLongDate(start)} />
          <Row label="Trial ends" value={formatLongDate(end)} />
          <Row label="Then" value={`${formatCurrency(9.99)} / month`} />
          <Row label="Reminder" value="2 days before it ends" />
        </View>
      </Card>

      <Card style={{ backgroundColor: color.gray50 }}>
        <View style={{ gap: space.sm }}>
          <Text variant="bodyBold" color={color.black}>
            Why 14 days?
          </Text>
          <Text variant="callout" color={color.gray700}>
            Most apps give you 3 days — not enough to feel anything. In 14 you&apos;ll log real meals
            and build a gym streak. You&apos;ll know if Lumo earns its place before we charge you a
            cent.
          </Text>
        </View>
      </Card>

      <View style={{ gap: space.sm }}>
        <Button
          title="Start free trial"
          icon="sparkles"
          onPress={() => navigate(onboardingHref('generating'))}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.xl }}>
          <Button
            title="What's included"
            variant="tertiary"
            fullWidth={false}
            onPress={() => showToast({ message: 'Everything. One plan, one price.', tone: 'info' })}
          />
          <Button
            title="Restore Purchases"
            variant="tertiary"
            fullWidth={false}
            onPress={() => showToast({ message: 'Nothing to restore yet.', tone: 'info' })}
          />
          <Text variant="footnote" color={color.secondaryLabel} style={{ textAlign: 'center' }}>
            Already subscribed? Restore your purchase.
          </Text>
        </View>
      </View>
    </OnboardingStep>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
        <Icon name="checkmark-circle" size={16} color={color.black} />
        <Text variant="callout" color={color.gray500}>
          {label}
        </Text>
      </View>
      <Text variant="callout" color={color.black}>
        {value}
      </Text>
    </View>
  );
}
