import { CommonParams, CoreApi } from '@onekeyfe/hd-core';
import React, { View, StyleSheet, Text } from 'react-native';
import type { Device } from './DeviceList';
import MethodInvoke from './MethodInvoke';

type CallStellarMethodsProps = {
  SDK: CoreApi;
  selectedDevice: Device | null;
  commonParams?: CommonParams;
};

export function CallStellarMethods({
  SDK,
  selectedDevice: currentDevice,
  commonParams,
}: CallStellarMethodsProps) {
  const connectId = currentDevice?.connectId ?? '';
  const deviceId = currentDevice?.features?.deviceId ?? '';
  return (
    <View>
      <Text style={{ textAlign: 'center', fontSize: 24 }}>Stellar Method Test</Text>
      <View style={styles.buttonContainer}>
        <MethodInvoke
          title="stellarGetAddress"
          options={[
            { name: 'path', value: "m/44'/148'/0'", type: 'string' },
            { name: 'showOnOneKey', value: false, type: 'boolean' },
          ]}
          onCall={data => SDK.stellarGetAddress(connectId, deviceId, { ...commonParams, ...data })}
        />

        <MethodInvoke
          title="stellarSignTransaction"
          options={[
            { name: 'path', value: "m/44'/148'/0'", type: 'string' },
            {
              name: 'networkPassphrase',
              value: 'Test SDF Network ; September 2015',
              type: 'string',
            },
            {
              name: 'transaction.source',
              value: 'GAXSFOOGF4ELO5HT5PTN23T5XE6D5QWL3YBHSVQ2HWOFEJNYYMRJENBV',
              type: 'string',
            },
            { name: 'transaction.fee', value: 100, type: 'number' },
            { name: 'transaction.sequence', value: 4294967296, type: 'number' },
          ]}
          onCall={data =>
            SDK.stellarSignTransaction(connectId, deviceId, {
              ...commonParams,
              // @ts-expect-error
              path: data.path,
              // @ts-expect-error
              networkPassphrase: data.networkPassphrase,
              transaction: {
                // @ts-expect-error
                ...data.transaction,
                memo: {
                  type: 0,
                },
                operations: [
                  {
                    type: 'payment',
                    source: 'GAXSFOOGF4ELO5HT5PTN23T5XE6D5QWL3YBHSVQ2HWOFEJNYYMRJENBV',
                    destination: 'GAXSFOOGF4ELO5HT5PTN23T5XE6D5QWL3YBHSVQ2HWOFEJNYYMRJENBV',
                    amount: '10000',
                    asset: {
                      type: 'NATIVE',
                    },
                  },
                ],
              },
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
