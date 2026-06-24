/**
 * B2 Wallet - Extension Detector & Early Layout Setup + BrowserBuffer Polyfill
 * Runs immediately in <head> to prevent flashes of unstyled content, layout reflows,
 * and to inject the critical lightweight BrowserBuffer polyfill for CSP-compliant crypto engines.
 * Strictly CSP compliant (loaded as external script).
 */
(function() {
  // 1. BrowserBuffer Polyfill (extends Uint8Array)
  class BrowserBuffer extends Uint8Array {
    toString(encoding) {
      if (encoding === 'hex') {
        return Array.from(this).map(b => b.toString(16).padStart(2, '0')).join('');
      }
      if (encoding === 'base64') {
        let binary = '';
        const len = this.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(this[i]);
        }
        return btoa(binary);
      }
      // utf-8 / utf8 standard
      return new TextDecoder().decode(this);
    }
    slice(start, end) {
      return new BrowserBuffer(super.subarray(start, end));
    }
  }

  BrowserBuffer.from = function(value, encoding) {
    if (value instanceof Uint8Array || Array.isArray(value)) {
      return new BrowserBuffer(value);
    }
    if (typeof value === 'string') {
      if (encoding === 'hex') {
        const match = value.match(/.{1,2}/g) || [];
        return new BrowserBuffer(match.map(byte => parseInt(byte, 16)));
      }
      if (encoding === 'base64') {
        const binary = atob(value);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return new BrowserBuffer(bytes);
      }
      // Default to UTF-8
      return new BrowserBuffer(new TextEncoder().encode(value));
    }
    return new BrowserBuffer(value);
  };

  BrowserBuffer.concat = function(list, totalLength) {
    if (totalLength === undefined) {
      totalLength = list.reduce((acc, val) => acc + val.length, 0);
    }
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of list) {
      result.set(buf, offset);
      offset += buf.length;
    }
    return new BrowserBuffer(result);
  };

  BrowserBuffer.alloc = function(size, fill = 0) {
    const buf = new BrowserBuffer(size);
    if (fill !== 0) {
      buf.fill(fill);
    }
    return buf;
  };

  BrowserBuffer.isBuffer = function(obj) {
    return obj instanceof BrowserBuffer || (obj && obj.constructor && obj.constructor.name === 'BrowserBuffer');
  };

  globalThis.Buffer = BrowserBuffer;
  window.Buffer = BrowserBuffer;

  // 2. Extension Layout setup
  const isExtensionPopup = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL && 
                            window.location.protocol.includes('extension') && 
                            !window.location.search.includes('fulltab=true')) ||
                            window.location.search.includes('popup=true');
  if (isExtensionPopup) {
    document.documentElement.classList.add('is-extension-popup');
  } else {
    document.documentElement.classList.add('is-fulltab');
  }
})();
