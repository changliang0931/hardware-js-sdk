import axios from 'axios';
import semver from 'semver';
import MessagesJSON from '../data/messages/messages.json';
import { getTimeStamp } from '../utils';
import {
  getDeviceType,
  getDeviceFirmwareVersion,
  getDeviceBLEFirmwareVersion,
  getFirmwareUpdateField,
} from '../utils/deviceFeaturesUtils';

import type {
  ConnectSettings,
  DeviceTypeMap,
  AssetsMap,
  RemoteConfigResponse,
  Features,
  IDeviceFirmwareStatus,
  IDeviceBLEFirmwareStatus,
  ITransportStatus,
  IVersionArray,
} from '../types';
import { getReleaseChangelog, getReleaseStatus, findLatestRelease } from '../utils/release';

type FirmwareField = 'firmware' | 'firmware-v2' | 'firmware-v3';

export default class DataManager {
  static deviceMap: DeviceTypeMap = {
    classic: {
      firmware: [],
      ble: [],
    },
    mini: {
      firmware: [],
      ble: [],
    },
    touch: {
      firmware: [],
      ble: [],
    },
    pro: {
      firmware: [],
      ble: [],
    },
  };

  static assets: AssetsMap | null = null;

  static settings: ConnectSettings;

  static messages: { default: JSON } = {
    default: MessagesJSON as unknown as JSON,
  };

  static lastCheckTimestamp = 0;

  static getFirmwareStatus = (features: Features): IDeviceFirmwareStatus => {
    const deviceType = getDeviceType(features);
    const deviceFirmwareVersion = getDeviceFirmwareVersion(features);
    if (features.firmware_present === false) {
      return 'none';
    }

    if (deviceType === 'classic' && features.bootloader_mode) {
      return 'unknown';
    }

    const firmwareUpdateField = getFirmwareUpdateField(features, 'firmware');
    const targetDeviceConfigList = this.deviceMap[deviceType]?.[firmwareUpdateField] ?? [];
    const currentVersion = deviceFirmwareVersion.join('.');
    return getReleaseStatus(targetDeviceConfigList, currentVersion);
  };

  /**
   * Touch、Pro System UI Resource Update
   * ** Interval upgrade is not considered **
   */
  static getSysResourcesLatestRelease = (features: Features, forcedUpdateRes?: boolean) => {
    const deviceType = getDeviceType(features);
    const deviceFirmwareVersion = getDeviceFirmwareVersion(features);

    if (deviceType !== 'pro' && deviceType !== 'touch') return undefined;

    const firmwareUpdateField = getFirmwareUpdateField(features, 'firmware') as FirmwareField;
    const targetDeviceConfigList = this.deviceMap[deviceType]?.[firmwareUpdateField] ?? [];
    const currentVersion = deviceFirmwareVersion.join('.');
    const targetDeviceConfig = targetDeviceConfigList.filter(item =>
      forcedUpdateRes
        ? !!item.resource
        : semver.gt(item.version.join('.'), currentVersion) && !!item.resource
    );

    return findLatestRelease(targetDeviceConfig)?.resource;
  };

  /**
   * Touch、Pro System full UI Resource Update
   * ** Interval upgrade is not considered **
   */
  static getSysFullResource = (features: Features) => {
    const deviceType = getDeviceType(features);

    if (deviceType !== 'pro' && deviceType !== 'touch') return undefined;

    const firmwareUpdateField = getFirmwareUpdateField(features, 'firmware') as FirmwareField;
    const targetDeviceConfigList = this.deviceMap[deviceType]?.[firmwareUpdateField] ?? [];
    const targetDeviceConfig = targetDeviceConfigList.filter(item => !!item.fullResource);

    return findLatestRelease(targetDeviceConfig)?.fullResource;
  };

  static getBootloaderResource = (features: Features) => {
    const deviceType = getDeviceType(features);

    if (deviceType !== 'pro' && deviceType !== 'touch') return undefined;
    const firmwareUpdateField = getFirmwareUpdateField(features, 'firmware') as FirmwareField;
    const targetDeviceConfigList = this.deviceMap[deviceType]?.[firmwareUpdateField] ?? [];
    const targetDeviceConfig = targetDeviceConfigList.filter(item => !!item.bootloaderResource);

    return findLatestRelease(targetDeviceConfig)?.bootloaderResource;
  };

  static getBootloaderTargetVersion = (features: Features): IVersionArray | undefined => {
    const deviceType = getDeviceType(features);

    const firmwareUpdateField = getFirmwareUpdateField(features, 'firmware') as FirmwareField;
    const targetDeviceConfigList = this.deviceMap[deviceType]?.[firmwareUpdateField] ?? [];
    const targetDeviceConfig = targetDeviceConfigList.filter(item => !!item.bootloaderResource);

    return targetDeviceConfig?.[0]?.bootloaderVersion ?? undefined;
  };

  static getBootloaderRelatedFirmwareVersion = (features: Features): IVersionArray | undefined => {
    const deviceType = getDeviceType(features);

    if (!(deviceType === 'classic' || deviceType === 'mini')) return undefined;
    const firmwareUpdateField = getFirmwareUpdateField(features, 'firmware') as FirmwareField;
    const targetDeviceConfigList = this.deviceMap[deviceType]?.[firmwareUpdateField] ?? [];
    const targetDeviceConfig = targetDeviceConfigList.filter(
      item => !!item.bootloaderRelatedFirmwareVersion
    );

    return targetDeviceConfig?.[0]?.bootloaderRelatedFirmwareVersion ?? undefined;
  };

  static getFirmwareChangelog = (features: Features) => {
    const deviceType = getDeviceType(features);
    const deviceFirmwareVersion = getDeviceFirmwareVersion(features);

    if (
      features.firmware_present === false ||
      (deviceType === 'classic' && features.bootloader_mode)
    ) {
      return [];
    }

    const firmwareUpdateField = getFirmwareUpdateField(features, 'firmware') as FirmwareField;
    const targetDeviceConfigList = this.deviceMap[deviceType]?.[firmwareUpdateField] ?? [];
    const currentVersion = deviceFirmwareVersion.join('.');
    return getReleaseChangelog(targetDeviceConfigList, currentVersion);
  };

  static getFirmwareLatestRelease = (features: Features) => {
    const deviceType = getDeviceType(features);
    const firmwareUpdateField = getFirmwareUpdateField(features, 'firmware') as FirmwareField;
    const targetDeviceConfigList = this.deviceMap[deviceType]?.[firmwareUpdateField] ?? [];

    const target = findLatestRelease(targetDeviceConfigList);
    if (!target) return target;

    if (!target.resource) {
      const resource = this.getSysResourcesLatestRelease(features);
      return {
        ...target,
        resource,
      };
    }
    return target;
  };

  static getBLEFirmwareStatus = (features: Features): IDeviceBLEFirmwareStatus => {
    const deviceType = getDeviceType(features);
    const deviceBLEFirmwareVersion = getDeviceBLEFirmwareVersion(features);

    /** mini has no device ble_ver */
    if (!deviceBLEFirmwareVersion) {
      return 'none';
    }

    const targetDeviceConfigList = this.deviceMap[deviceType]?.ble ?? [];
    const currentVersion = deviceBLEFirmwareVersion.join('.');
    return getReleaseStatus(targetDeviceConfigList, currentVersion);
  };

  static getBleFirmwareChangelog = (features: Features) => {
    const deviceType = getDeviceType(features);
    const deviceBLEFirmwareVersion = getDeviceBLEFirmwareVersion(features);

    if (!deviceBLEFirmwareVersion) {
      return [];
    }

    const targetDeviceConfigList = this.deviceMap[deviceType]?.ble ?? [];
    const currentVersion = deviceBLEFirmwareVersion.join('.');
    return getReleaseChangelog(targetDeviceConfigList, currentVersion);
  };

  static getBleFirmwareLatestRelease = (features: Features) => {
    const deviceType = getDeviceType(features);
    const targetDeviceConfigList = this.deviceMap[deviceType]?.ble ?? [];
    return findLatestRelease(targetDeviceConfigList);
  };

  static getTransportStatus = (localVersion: string): ITransportStatus => {
    const latestTransportVersion = this.assets?.bridge?.version;
    if (!latestTransportVersion) return 'valid';
    const isLatest = semver.gte(localVersion, latestTransportVersion.join('.'));
    return isLatest ? 'valid' : 'outdated';
  };

  static async load(settings: ConnectSettings) {
    this.settings = settings;
    try {
      const url = settings.preRelease
        ? 'https://data.onekey.so/pre-config.json'
        : 'https://data.onekey.so/config.json';

      const { data } = await axios.get<RemoteConfigResponse>(
        `${url}?noCache=${getTimeStamp()}`,
        // because of iframe timeout is 10000
        {
          timeout: 7000,
        }
      );
      this.deviceMap = {
        classic: data.classic,
        mini: data.mini,
        touch: data.touch,
        pro: data.pro,
      };
      this.assets = {
        bridge: data.bridge,
      };
    } catch (e) {
      // ignore
    }
  }

  static async checkAndReloadData() {
    if (getTimeStamp() - this.lastCheckTimestamp > 1000 * 60 * 60 * 3) {
      await this.load(this.settings).then(() => {
        this.lastCheckTimestamp = getTimeStamp();
      });
    }
  }

  static getProtobufMessages() {
    return this.messages.default;
  }

  static getSettings(key?: undefined): ConnectSettings;

  static getSettings<T extends keyof ConnectSettings>(key: T): ConnectSettings[T];

  static getSettings(key?: keyof ConnectSettings) {
    if (!this.settings) return null;
    if (typeof key === 'string') {
      return this.settings[key];
    }
    return this.settings;
  }
}
