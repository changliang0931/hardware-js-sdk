import { Platform } from 'react-native';
import type { ConnectSettings, CoreApi } from '@onekeyfe/hd-core';
import { logger } from './logger';

// eslint-disable-next-line import/no-mutable-exports
let HardwareSDK: CoreApi;
let initialized = false;

// eslint-disable-next-line no-async-promise-executor
const promise: Promise<CoreApi> = new Promise(async resolve => {
  if (initialized) {
    resolve(HardwareSDK);
    return;
  }

  const settings: Partial<ConnectSettings> = {
    debug: true,
    logger,
  };

  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    HardwareSDK = (await import('@onekeyfe/hd-ble-sdk')).default as unknown as CoreApi;
  } else {
    HardwareSDK = (await import('@onekeyfe/hd-web-sdk')).default as unknown as CoreApi;
    settings.connectSrc = 'https://localhost:8088/';
  }

  try {
    await HardwareSDK.init(settings);
    initialized = true;
    resolve(HardwareSDK);
  } catch (e) {
    console.error(e);
    // eslint-disable-next-line no-promise-executor-return
    return null;
  }
});

export const getHardwareSDKInstance = async () => {
  const SDK = await promise;
  return SDK;
};

export { HardwareSDK };
