// Shared expo-camera stand-in for the scan render tests. The native camera
// cannot mount here, so CameraView renders nothing and exposes only the
// takePictureAsync the screens call through their ref.
import { forwardRef, useImperativeHandle } from 'react';

type Permission = { granted: boolean; canAskAgain: boolean };

// Getters, not values: jest.mock factories run before the test file's own
// variables are initialised, so both are read when the screen calls them.
export function cameraMock(
  getTakePicture: () => jest.Mock,
  getPermission: () => Permission = () => ({ granted: true, canAskAgain: true }),
) {
  return {
    useCameraPermissions: () => [getPermission(), jest.fn()],
    CameraView: forwardRef(function CameraView(_props: unknown, ref) {
      useImperativeHandle(ref, () => ({ takePictureAsync: getTakePicture() }));
      return null;
    }),
  };
}
