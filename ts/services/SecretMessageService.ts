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

// const [isSendingSecret, setIsSendingSecret] = useState<boolean>(false);

export type SecretMessageGroup = [number, string, DraftBodyRanges];

export async function sendSecretMessage(
  sendMessage: SendMessage,
  secretMessagePairs: SecretMessageGroup[],
  conversation: ConversationModel | undefined
) {
  // setIsSendingSecret(true)
  if (!conversation) {
    log.error('Secret message: conversation does not exist');
    return;
  }
  log.info('send secret messages: ', secretMessagePairs)
  // (async () => {
  for (let [encodedMessage, coverMessage, bodyRanges] of secretMessagePairs) {
    // canSendRef.current = false;
    let currTime = Date.now();
    // while (Math.abs((currTime % 100000) - encodedMessage) > 100) {
    //   log.info(
    //     `CompositionInput: Current time ${currTime} target time ${encodedMessage}`
    //   );
    //   await new Promise(resolve => setTimeout(resolve, 10));
    //   currTime = Date.now();
    // }

    // const encryptedMessage = await encryptTimestamp(
    //   encodedMessage,
    //   conversation
    // );
    // log.info('Secret encrypted message: ', encryptedMessage);

    log.info(
      'TEST: real time',
      currTime,
      'encoded time:',
      Math.floor(currTime / 100000) * 100000 + encodedMessage
    );

    const didSend = sendMessage(
      coverMessage,
      bodyRanges,
      Math.floor(currTime / 100000) * 100000 + encodedMessage //encryptedMessage
    );

    // if (!didSend) {
    //   canSendRef.current = true;
    // }
  }
  // })();
}

// export async function delaySend() {

// }

export async function encryptTimestamp(
  timestamp: number,
  recipient: ServiceIdString
  // conversation: ConversationModel
): Promise<number> {
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

  // const encryptedTimestamp = await signalEncryptTimestamp(
  //   timestamp % 100000,
  //   protocolAddress,
  //   sessionStore
  // );
  // const signalMessage = SignalMessage.deserialize(Buffer.from(ciphertext));

  // const decryptedTimestamp = await signalDecryptTimestamp(
  //   signalMessage,
  //   encryptedTimestamp,
  //   protocolAddress,
  //   sessionStore
  // );
  // log.info(
  //   'Secret: encrypted: ',
  //   encryptedTimestamp,
  //   'decrypted: ',
  //   decryptedTimestamp
  // );
  // return encryptedTimestamp;
}

async function configureSession(serviceId: ServiceIdString): Promise<[Sessions, ProtocolAddress]> {
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

  return [sessionStore, protocolAddress]
}

// if (encodedMessage.length > 0) {
//   // log.info(
//   //   'Secret Message: Please send ',
//   //   encodedMessage.length,
//   //   ' more messages'
//   // );
//   // log.info('Secret Message: currently sending "', text, '"');

//   canSendRef.current = false;
//   // let currTime = Date.now();

//   const secretMessagePair: SecretMessagePair = [encodedMessage[0],text]
//   setSecretMessagePairs(prevSecretMessages => [...prevSecretMessages, secretMessagePair])

//   // while (Math.abs((currTime % 100000) - encodedMessage) > 100) {
//   //   log.info(
//   //     `CompositionInput: Current time ${currTime} target time ${encodedMessage}`
//   //   );
//   //   await new Promise(resolve => setTimeout(resolve, 10));
//   //   currTime = Date.now();
//   // }

//   // const didSendEnd = onSubmit(
//   //   text,
//   //   bodyRanges,
//   //   Math.floor(currTime / 100000) * 100000 + encodedMessage[0]
//   // );

//   // if (!didSendEnd) {
//   //   canSendRef.current = true;
//   // }

//   setEncodedMessage(encodedMessage.slice(1));
//   return;
// }

// (async () => {
//   for (let encodedMessage of encodedMessages) {
//     log.info(
//       `CompositionInput: Submitting message ${timestamp} with ${bodyRanges.length} ranges`
//     );
//     canSendRef.current = false;
//     let currTime = Date.now();
//     // while (Math.abs((currTime % 100000) - encodedMessage) > 100) {
//     //   log.info(
//     //     `CompositionInput: Current time ${currTime} target time ${encodedMessage}`
//     //   );
//     //   await new Promise(resolve => setTimeout(resolve, 10));
//     //   currTime = Date.now();
//     // }

//     const didSend = onSubmit(
//       encodedMessage.toString(),
//       bodyRanges,
//       Math.floor(currTime / 100000) * 100000 + encodedMessage
//     );

//     if (!didSend) {
//       canSendRef.current = true;
//     }
//   }
// })();

// Send ending secret message timestamp
// canSendRef.current = false;
// const didSend = onSubmit(
//   text,
//   bodyRanges,
//   Math.floor(Date.now() / 100000) * 100000 + encodedMessage[0]
// );
// if (!didSend) {
//   canSendRef.current = true;
// }
// setEncodedMessage(encodedMessage.slice(1));

// if (!conversation) {
//   log.debug('Secret: conversation null');
//   return;
// }
// const ourAci = window.textsecure.storage.user.getCheckedAci();
// log.debug('Secret: ourAci ', ourAci);
// const recipients = conversation.getRecipients(); // Excludes sender
// log.debug('Secret: recipients ', recipients);
