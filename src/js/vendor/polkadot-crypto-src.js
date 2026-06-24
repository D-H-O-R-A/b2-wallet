import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady, mnemonicGenerate, mnemonicToMiniSecret, mnemonicValidate, signatureVerify, decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { u8aToHex, hexToU8a, stringToU8a, u8aToString } from '@polkadot/util';
import { ApiPromise, HttpProvider, WsProvider } from '@polkadot/api';

const PolkadotCrypto = {
  Keyring,
  cryptoWaitReady,
  mnemonicGenerate,
  mnemonicToMiniSecret,
  mnemonicValidate,
  signatureVerify,
  decodeAddress,
  encodeAddress,
  u8aToHex,
  hexToU8a,
  stringToU8a,
  u8aToString,
  ApiPromise,
  HttpProvider,
  WsProvider
};

if (typeof window !== 'undefined') {
  window.PolkadotCrypto = PolkadotCrypto;
}
if (typeof globalThis !== 'undefined') {
  globalThis.PolkadotCrypto = PolkadotCrypto;
}

export {
  Keyring,
  cryptoWaitReady,
  mnemonicGenerate,
  mnemonicToMiniSecret,
  mnemonicValidate,
  signatureVerify,
  decodeAddress,
  encodeAddress,
  u8aToHex,
  hexToU8a,
  stringToU8a,
  u8aToString,
  ApiPromise,
  HttpProvider,
  WsProvider
};
