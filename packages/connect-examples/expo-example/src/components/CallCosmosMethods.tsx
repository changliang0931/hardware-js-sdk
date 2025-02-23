import { CommonParams, CoreApi } from '@onekeyfe/hd-core';
import React, { View, StyleSheet, Text } from 'react-native';
import type { Device } from './DeviceList';
import MethodInvoke from './MethodInvoke';

type CallCosmosMethodsProps = {
  SDK: CoreApi;
  selectedDevice: Device | null;
  commonParams?: CommonParams;
};

export function CallCosmosMethods({
  SDK,
  selectedDevice: currentDevice,
  commonParams,
}: CallCosmosMethodsProps) {
  const connectId = currentDevice?.connectId ?? '';
  const deviceId = currentDevice?.features?.deviceId ?? '';
  return (
    <View>
      <Text style={{ textAlign: 'center', fontSize: 24 }}>Cosmos Method Test</Text>
      <View style={styles.buttonContainer}>
        <MethodInvoke
          title="cosmosGetAddress"
          options={[
            { name: 'path', value: "m/44'/118'/0'/0/0", type: 'string' },
            { name: 'hrp', value: undefined, type: 'string' },
            { name: 'showOnOneKey', value: false, type: 'boolean' },
          ]}
          onCall={data => SDK.cosmosGetAddress(connectId, deviceId, { ...commonParams, ...data })}
        />

        <MethodInvoke
          title="cosmosGetPublicKey"
          options={[
            { name: 'path', value: "m/44'/118'/0'/0/0", type: 'string' },
            { name: 'curve', value: 'secp256k1', type: 'string' },
            { name: 'showOnOneKey', value: false, type: 'boolean' },
          ]}
          onCall={data => SDK.cosmosGetPublicKey(connectId, deviceId, { ...commonParams, ...data })}
        />

        <MethodInvoke
          title="cosmosSignTransaction"
          options={[
            { name: 'path', value: "m/44'/118'/0'/0/0", type: 'string' },
            {
              name: 'rawTx',
              value:
                '4301355cc18d85809872bcbd63cb6ea5ac3c2814a1bacf2e50d8ec62367211917b79ecd1f1a98fa0d793d7cb92ebd9a479dc6aba0ae8570253aa87c0da32db5ed2bd401f3bbee52c2bc55761fd8486fae2e28f46499282f4267b8b90fc8c1cc97bb659b6cc927f2ec1701ef2928ddb84759ba5c557f549db',
              type: 'string',
            },
          ]}
          onCall={data =>
            SDK.cosmosSignTransaction(connectId, deviceId, {
              ...commonParams,
              ...data,
            } as unknown as any)
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
