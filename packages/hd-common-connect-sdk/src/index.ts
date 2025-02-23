import EventEmitter from 'events';
import HardwareSdk, {
  ConnectSettings,
  enableLog,
  parseConnectSettings,
  initCore,
  Core,
  createErrorMessage,
  CORE_EVENT,
  CoreMessage,
  IFRAME,
  UI_EVENT,
  UiResponseEvent,
  LOG_EVENT,
  getLogger,
  LoggerNames,
  setLoggerPostMessage,
  FIRMWARE_EVENT,
  DEVICE_EVENT,
  DEVICE,
} from '@onekeyfe/hd-core';
import { ERRORS, createDeferred, Deferred, HardwareErrorCode } from '@onekeyfe/hd-shared';
import HttpTransport from '@onekeyfe/hd-transport-http';
import WebusbTransport from '@onekeyfe/hd-transport-webusb';

const eventEmitter = new EventEmitter();
const Log = getLogger(LoggerNames.HdCommonConnectSdk);

let _core: Core | undefined;
let _settings = parseConnectSettings();

let _messageID = 0;
export const messagePromises: { [key: number]: Deferred<any> } = {};

const dispose = () => {
  eventEmitter.removeAllListeners();
  _settings = parseConnectSettings();
};

const uiResponse = (response: UiResponseEvent) => {
  if (!_core) {
    throw ERRORS.TypedError(HardwareErrorCode.NotInitialized);
  }
  const { type, payload } = response;
  _core.handleMessage({ event: UI_EVENT, type, payload } as CoreMessage);
};

const cancel = (connectId?: string) => {
  if (_core === undefined) return;
  _core.handleMessage({ event: IFRAME.CANCEL, type: IFRAME.CANCEL, payload: { connectId } });
};

function handleMessage(message: CoreMessage) {
  const { event } = message;
  if (!_core) {
    return;
  }

  if (event !== LOG_EVENT) {
    Log.debug('hd-common-connect-sdk handleMessage', message);
  }
  switch (event) {
    case UI_EVENT:
      // pass UI event up
      eventEmitter.emit(message.event, message);
      eventEmitter.emit(message.type, message.payload);
      break;
    case LOG_EVENT:
    case FIRMWARE_EVENT:
      eventEmitter.emit(message.event, message);
      break;
    case DEVICE_EVENT:
      if (
        (
          [DEVICE.CONNECT, DEVICE.DISCONNECT, DEVICE.FEATURES, DEVICE.SUPPORT_FEATURES] as string[]
        ).includes(message.type)
      ) {
        eventEmitter.emit(message.type, message.payload);
      }
      break;
    default:
      Log.log('No need to be captured message', message.event);
  }
}

async function postMessage(message: CoreMessage, usePromise = true) {
  if (!_core) {
    throw ERRORS.TypedError('postMessage: _core not found');
  }

  if (usePromise) {
    _messageID++;
    messagePromises[_messageID] = createDeferred();
    // const { promise } = messagePromises[_messageID];
    const response = await _core.handleMessage({ ...message, id: `${_messageID}` });
    // return promise;
    return response;
  }

  _core.handleMessage(message);
}

const init = async (settings: Partial<ConnectSettings>) => {
  _settings = { ..._settings, ...settings, env: settings.env ?? 'node' };

  enableLog(!!settings.debug);

  Log.debug('init');

  try {
    console.log(_settings.env);
    const Transport = _settings.env === 'webusb' ? WebusbTransport : HttpTransport;
    _core = await initCore(_settings, Transport);
    _core?.on(CORE_EVENT, handleMessage);
    setLoggerPostMessage(handleMessage);

    return true;
  } catch (error) {
    Log.error(createErrorMessage(error));

    return false;
  }
};

const call = async (params: any) => {
  Log.debug('call: ', params);

  try {
    const response = await postMessage({ event: IFRAME.CALL, type: IFRAME.CALL, payload: params });
    if (response) {
      Log.debug('response: ', response);

      return response;
    }

    return createErrorMessage(ERRORS.TypedError(HardwareErrorCode.CallMethodNotResponse));
  } catch (error) {
    Log.error('__call error: ', error);
    return createErrorMessage(error);
  }
};

const updateSettings = () => Promise.resolve(true);

const HardwareCommonConnectSdk = HardwareSdk({
  eventEmitter,
  init,
  call,
  cancel,
  dispose,
  uiResponse,
  updateSettings,
});

export default HardwareCommonConnectSdk;
