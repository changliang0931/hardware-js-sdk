import { Transport } from '@onekeyfe/hd-transport';
import { ERRORS, HardwareErrorCode } from '@onekeyfe/hd-shared';
import DataManager from './DataManager';
import { getLogger, LoggerNames } from '../utils';
// eslint-disable-next-line import/no-cycle
import { DevicePool } from '../device/DevicePool';

const Log = getLogger(LoggerNames.Transport);
const BleLogger = getLogger(LoggerNames.HdBleTransport);
const HttpLogger = getLogger(LoggerNames.HdTransportHttp);
/**
 * transport 在同一个环境中只会存在一个
 * 这里设计成单例获取
 * 方便进行环境判断，读取不同的 transport
 */
export default class TransportManager {
  static transport: Transport;

  static defaultMessages: JSON | Record<string, any>;

  static currentMessages: JSON | Record<string, any>;

  static reactNativeInit = false;

  static load() {
    Log.debug('transport manager load');
    this.defaultMessages = DataManager.getProtobufMessages();
    this.currentMessages = this.defaultMessages;
  }

  static async configure() {
    try {
      const env = DataManager.getSettings('env');
      Log.debug('Initializing transports');
      if (env === 'react-native') {
        if (!this.reactNativeInit) {
          await this.transport.init(BleLogger, DevicePool.emitter);
          this.reactNativeInit = true;
        } else {
          Log.debug('React Native Do Not Initializing transports');
        }
      } else {
        await this.transport.init(HttpLogger);
      }
      Log.debug('Configuring transports');
      await this.transport.configure(JSON.stringify(this.defaultMessages));
      Log.debug('Configuring transports done');
    } catch (error) {
      Log.debug('Initializing transports error: ', error);
      if (error.code === 'ECONNABORTED') {
        throw ERRORS.TypedError(HardwareErrorCode.BridgeTimeoutError);
      }
    }
  }

  static async reconfigure(messages?: JSON | number[] | null) {
    if (Array.isArray(messages)) {
      messages = DataManager.getProtobufMessages();
    }
    if (this.currentMessages === messages || !messages) {
      return;
    }
    try {
      await this.transport.configure(JSON.stringify(messages));
      this.currentMessages = messages;
    } catch (error) {
      throw ERRORS.TypedError(
        HardwareErrorCode.TransportInvalidProtobuf,
        `Transport_InvalidProtobuf:  ${error.message as unknown as string}`
      );
    }
  }

  static setTransport(TransportConstructor: any) {
    const env = DataManager.getSettings('env');
    if (env === 'react-native') {
      /** Actually initializes the ReactNativeTransport */
      this.transport = new TransportConstructor({ scanTimeout: 3000 }) as unknown as Transport;
    } else {
      /** Actually initializes the HttpTransport */
      this.transport = new TransportConstructor() as unknown as Transport;
    }
    Log.debug('set transport: ', this.transport);
  }

  static getTransport() {
    return this.transport;
  }

  static getDefaultMessages() {
    return this.defaultMessages;
  }

  static getCurrentMessages() {
    return this.currentMessages;
  }
}
