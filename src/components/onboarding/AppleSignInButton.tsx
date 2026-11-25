// "Continue with Apple" for the sign up and sign in screen. The caller owns the
// Clerk flow (startSSOFlow with oauth_apple) and passes it in as onPress.
// Sign in with Apple is an iOS option only, so other platforms render nothing.
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/forms';

type Props = {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function AppleSignInButton({ onPress, disabled = false, loading = false }: Props) {
  const { t } = useTranslation();
  if (Platform.OS !== 'ios') return null;
  return (
    <Button
      title={t('signup.continueApple')}
      icon="logo-apple"
      variant="primary"
      loading={loading}
      disabled={disabled}
      onPress={onPress}
    />
  );
}
