// Shared expo-camera stand-in for the scan render tests. The native camera
// cannot mount here, so CameraView renders nothing and exposes only the
// takePictureAsync the screens call through their ref.
import { forwardRef, useImperativeHandle } from 'react';

// A getter, not the spy itself: jest.mock factories run before the test
// file's own consts are initialised, so the spy is read at render time.
export function cameraMock(getTakePicture: () => jest.Mock) {
  return {
    useCameraPermissions: () => [{ granted: true, canAskAgain: true }, jest.fn()],
    CameraView: forwardRef(function CameraView(_props: unknown, ref) {
      useImperativeHandle(ref, () => ({ takePictureAsync: getTakePicture() }));
      return null;
    }),
  };
}
