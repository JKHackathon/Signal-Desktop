import { DraftBodyRanges } from '../types/BodyRange';
import { ServiceIdKind, ServiceIdString } from '../types/ServiceId';
import { Sessions } from '../LibSignalStores';
import {
  ProtocolAddress,
  signalEncryptTimestamp,
} from '@signalapp/libsignal-client';
import * as log from '../logging/log';
import { ConversationModel } from '../models/conversations';

type SendMessage = (
  message: string,
  bodyRanges: DraftBodyRanges,
  timestamp: number
) => unknown;

export const NUM_SECRET_DIGITS = 5;
export const NUM_SECRET_DIGITS_MOD = Math.pow(10, NUM_SECRET_DIGITS);
export const SENDING_SECRET_SIGNAL = NUM_SECRET_DIGITS_MOD - 1;
export const STOPPING_SECRET_SIGNAL = NUM_SECRET_DIGITS_MOD - 2;

// Indicates if secret message in the process of being transmitted
export const secretMessageStatus = {
  isSendingSecret: false,
};

// 
export type SecretMessageGroup = [number, string, DraftBodyRanges];

// Begin the process of sending the secret timestamps with cover messages
export async function sendSecretMessage(
  sendMessage: SendMessage,
  secretMessagePairs: SecretMessageGroup[],
  conversation: ConversationModel | undefined
) {
  secretMessageStatus.isSendingSecret = true;
  if (!conversation) {
    log.error('Secret message: conversation does not exist');
    return;
  }
  log.info('send secret messages: ', secretMessagePairs);

  for (let [encodedMessage, coverMessage, bodyRanges] of secretMessagePairs) {
    let currTime = Date.now();

    log.info(
      'TEST: real time',
      currTime,
      'encoded time:',
      Math.floor(currTime / NUM_SECRET_DIGITS_MOD) * NUM_SECRET_DIGITS_MOD +
        encodedMessage
    );

    sendMessage(
      coverMessage,
      bodyRanges,
      Math.floor(currTime / NUM_SECRET_DIGITS_MOD) * NUM_SECRET_DIGITS_MOD +
        encodedMessage
    );
  }
  log.info(
    'SecretMessageService: Finished secret sending',
    secretMessageStatus.isSendingSecret
  );
}

// encrypt timestamp using the current message's keys
export async function encryptTimestamp(
  timestamp: number,
  recipient: ServiceIdString
): Promise<number> {
  log.warn(
    'SecretMessageService encryptTimestamp isSendingSecret:',
    secretMessageStatus.isSendingSecret
  );
  if (!secretMessageStatus.isSendingSecret) {
    return timestamp;
  }

  const accountManager = window.getAccountManager();
  if (accountManager.areKeysOutOfDate(ServiceIdKind.ACI)) {
    log.warn(
      `sendMessageProto/${timestamp}: Keys are out of date; updating before send`
    );
    await accountManager.maybeUpdateKeys(ServiceIdKind.ACI);
    if (accountManager.areKeysOutOfDate(ServiceIdKind.ACI)) {
      throw new Error('Keys still out of date after update');
    }
  }

  const [sessionStore, protocolAddress] = await configureSession(recipient);

  return await signalEncryptTimestamp(timestamp, protocolAddress, sessionStore);
}

async function configureSession(
  serviceId: ServiceIdString
): Promise<[Sessions, ProtocolAddress]> {
  const ourAci = window.textsecure.storage.user.getCheckedAci();
  const deviceIds = await window.textsecure.storage.protocol.getDeviceIds({
    ourServiceId: ourAci,
    serviceId,
  });
  if (deviceIds.length === 0) {
    log.error('TEST SECRET: device ids empty!!!');
  }

  log.info('TEST SECRET: deviceIds', deviceIds);

  const sessionStore = new Sessions({ ourServiceId: ourAci });

  const protocolAddress = ProtocolAddress.new(serviceId, deviceIds[0]);

  log.info('TEST SECRET mine: session store', sessionStore);
  log.info('TEST SECRET mine: protocol address', protocolAddress);

  return [sessionStore, protocolAddress];
}
