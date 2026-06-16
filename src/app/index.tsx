// Entry redirect. Reads the onboarding flag from secure-store and routes the
// user into either the main tabs or the onboarding flow. Defaults to onboarding
// (the flag is false until A19 completes), so the 19-screen flow shows first.
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { color } from '@/lib/design/tokens';
import { getHasCompletedOnboarding } from '@/lib/storage/secureStore';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let active = true;
    getHasCompletedOnboarding().then((done) => {
      if (!active) return;
      setCompleted(done);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: color.white,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={color.black} />
      </View>
    );
  }

  return <Redirect href={completed ? '/(tabs)' : '/(onboarding)/welcome'} />;
}
