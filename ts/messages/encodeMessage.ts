const smaz = require('smaz');
const MAX_RESOLUTION = 100000-3;

function compressMessage(message: string): Uint8Array {
  return smaz.compress(message);
  //return compressed.toString('base64'); // Store the compressed result in base64
}

function decompressMessage(compressedMessage: Uint8Array): string {
  //const buffer = Buffer.from(compressedMessage, 'base64');
  return smaz.decompress(compressedMessage);
}

// Convert the compressed data into a numeric value (BigInt)
function convertCompressedToNumber(compressedData: Uint8Array): number[] {
  const encodedChunks: number[] = [];
  let num = 0;
  // Convert the Uint8Array into a single large number (BigInt)
  for (let i = 0; i < compressedData.length; i++) {
    let temp = (num << 8) | compressedData[i];
    if (temp > MAX_RESOLUTION) {
      encodedChunks.push(num);
      num = compressedData[i];
      continue;
    }
    num = temp;
  }
  encodedChunks.push(num);
  return encodedChunks;
}

// Decompress a numeric value (BigInt) back to the original compressed message (Uint8Array)
function convertNumberToCompressedData(encodedChunks: number[]): Uint8Array {
  let compressedData: number[] = [];

  encodedChunks.forEach(num => {
    const bytes: number[] = [];
    while (num > 0) {
      bytes.unshift(num & 255); // Get the least significant byte
      // TODO: Switch to shifting by 6 bits (or so) if use different scheme
      num >>= 8; // Shift right by 8 bits
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
