import { NUM_SECRET_DIGITS_MOD } from "../services/SecretMessageService";

const smaz = require('smaz');
const MAX_ENCODING = NUM_SECRET_DIGITS_MOD-3;

function compressMessage(message: string): Uint8Array {
  return smaz.compress(message);
}

function decompressMessage(compressedMessage: Uint8Array): string {
  return smaz.decompress(compressedMessage);
}

function convertCompressedToNumber(compressedData: Uint8Array): number[] {
  const encodedChunks: number[] = [];
  let num = 0;
  for (let i = 0; i < compressedData.length; i++) {
    let temp = (num << 8) | compressedData[i];
    if (temp > MAX_ENCODING) {
      encodedChunks.push(num);
      num = compressedData[i];
      continue;
    }
    num = temp;
  }
  encodedChunks.push(num);
  return encodedChunks;
}

function convertNumberToCompressedData(encodedChunks: number[]): Uint8Array {
  let compressedData: number[] = [];

  encodedChunks.forEach(num => {
    const bytes: number[] = [];
    while (num > 0) {
      bytes.unshift(num & 255); // Get least significant byte
      num >>= 8;
    }
    compressedData = compressedData.concat(bytes);
  });
  return new Uint8Array(compressedData);
}

export function compressAndEncodeMessage(message: string): number[] {
  const compressedMessage = compressMessage(message);
  return convertCompressedToNumber(compressedMessage);
}

export function decompressAndDecodeMessage(
  compressedNumbers: number[]
): string {
  const decodedData = convertNumberToCompressedData(compressedNumbers);
  return decompressMessage(decodedData);
}
