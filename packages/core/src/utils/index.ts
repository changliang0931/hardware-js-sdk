export * from './assets';
export * from './versionUtils';
export * from './patch';
export {
  getDeviceType,
  getDeviceTypeByBleName,
  getDeviceTypeByDeviceId,
  getDeviceUUID,
  getDeviceLabel,
  getFirmwareUpdateField,
  supportInputPinOnSoftware,
} from './deviceFeaturesUtils';
export { getHDPath, getScriptType, getOutputScriptType } from '../api/helpers/pathUtils';

export {
  checkNeedUpdateBootForTouch,
  checkNeedUpdateBootForClassicAndMini,
} from '../api/firmware/updateBootloader';

export { getLogger, enableLog, LoggerNames, getLog, setLoggerPostMessage } from './logger';

export { getHomeScreenHex } from './homescreen';

export const wait = (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });
