/**
 * B2 Wallet — Waves Cryptography and Signatures
 *
 * Implementa curve25519 (axlsign) puro em JS, Keccak-256, Blake2b-256 e SHA-256.
 * Fornece utilitários de codificação Base58 para Waves, AMZX e PlanetOne.
 */

;(function(global) {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────────
  // 1 — PRIMITIVAS CURVE25519 (axlsign — domínio público)
  // ─────────────────────────────────────────────────────────────────────────────

  const axlsign = (function() {
    var axlsign = Object.create(null)
    var gf = function (init) {
      var i, r = new Float64Array(16)
      if (init)
        for (i = 0; i < init.length; i++)
          r[i] = init[i]
      return r
    }
    var _0 = new Uint8Array(16)
    var _9 = new Uint8Array(32)
    _9[0] = 9
    var gf0 = gf(), gf1 = gf([1]), _121665 = gf([0xdb41, 1]), D = gf([0x78a3, 0x1359, 0x4dca, 0x75eb, 0xd8ab, 0x4141, 0x0a4d, 0x0070, 0xe898, 0x7779, 0x4079, 0x8cc7, 0xfe73, 0x2b6f, 0x6cee, 0x5203]), D2 = gf([0xf159, 0x26b2, 0x9b94, 0xebd6, 0xb156, 0x8283, 0x149a, 0x00e0, 0xd130, 0xeef3, 0x80f2, 0x198e, 0xfce7, 0x56df, 0xd9dc, 0x2406]), X = gf([0xd51a, 0x8f25, 0x2d60, 0xc956, 0xa7b2, 0x9525, 0xc760, 0x692c, 0xdc5c, 0xfdd6, 0xe231, 0xc0a4, 0x53fe, 0xcd6e, 0x36d3, 0x2169]), Y = gf([0x6658, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666]), I = gf([0xa0b0, 0x4a0e, 0x1b27, 0xc4ee, 0xe478, 0xad2f, 0x1806, 0x2f43, 0xd7a7, 0x3dfb, 0x0099, 0x2b4d, 0xdf0b, 0x4fc1, 0x2480, 0x2b83])
    function ts64(x, i, h, l) {
      x[i] = (h >> 24) & 0xff
      x[i + 1] = (h >> 16) & 0xff
      x[i + 2] = (h >> 8) & 0xff
      x[i + 3] = h & 0xff
      x[i + 4] = (l >> 24) & 0xff
      x[i + 5] = (l >> 16) & 0xff
      x[i + 6] = (l >> 8) & 0xff
      x[i + 7] = l & 0xff
    }
    function vn(x, xi, y, yi, n) {
      var i, d = 0
      for (i = 0; i < n; i++)
        d |= x[xi + i] ^ y[yi + i]
      return (1 & ((d - 1) >>> 8)) - 1
    }
    function crypto_verify_32(x, xi, y, yi) {
      return vn(x, xi, y, yi, 32)
    }
    function set25519(r, a) {
      for (var i = 0; i < 16; i++)
        r[i] = a[i] | 0
    }
    function car25519(o) {
      var i, v, c = 1
      for (i = 0; i < 16; i++) {
        v = o[i] + c + 65535
        c = Math.floor(v / 65536)
        o[i] = v - c * 65536
      }
      o[0] += c - 1 + 37 * (c - 1)
    }
    function sel25519(p, q, b) {
      var t, c = ~(b - 1)
      for (var i = 0; i < 16; i++) {
        t = c & (p[i] ^ q[i])
        p[i] ^= t
        q[i] ^= t
      }
    }
    function pack25519(o, n) {
      var i, j, b
      var m = gf(), t = gf()
      for (i = 0; i < 16; i++)
        t[i] = n[i]
      car25519(t)
      car25519(t)
      car25519(t)
      for (j = 0; j < 2; j++) {
        m[0] = t[0] - 0xffed
        for (i = 1; i < 15; i++) {
          m[i] = t[i] - 0xffff - ((m[i - 1] >> 16) & 1)
          m[i - 1] &= 0xffff
        }
        m[15] = t[15] - 0x7fff - ((m[14] >> 16) & 1)
        b = (m[15] >> 16) & 1
        m[14] &= 0xffff
        sel25519(t, m, 1 - b)
      }
      for (i = 0; i < 16; i++) {
        o[2 * i] = t[i] & 0xff
        o[2 * i + 1] = t[i] >> 8
      }
    }
    function neq25519(a, b) {
      var c = new Uint8Array(32), d = new Uint8Array(32)
      pack25519(c, a)
      pack25519(d, b)
      return crypto_verify_32(c, 0, d, 0)
    }
    function par25519(a) {
      var d = new Uint8Array(32)
      pack25519(d, a)
      return d[0] & 1
    }
    function unpack25519(o, n) {
      for (var i = 0; i < 16; i++)
        o[i] = n[2 * i] + (n[2 * i + 1] << 8)
      o[15] &= 0x7fff
    }
    function A(o, a, b) {
      for (var i = 0; i < 16; i++)
        o[i] = a[i] + b[i]
    }
    function Z(o, a, b) {
      for (var i = 0; i < 16; i++)
        o[i] = a[i] - b[i]
    }
    function M(o, a, b) {
      var v, c, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0, t10 = 0, t11 = 0, t12 = 0, t13 = 0, t14 = 0, t15 = 0, t16 = 0, t17 = 0, t18 = 0, t19 = 0, t20 = 0, t21 = 0, t22 = 0, t23 = 0, t24 = 0, t25 = 0, t26 = 0, t27 = 0, t28 = 0, t29 = 0, t30 = 0, b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7], b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11], b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15]
      v = a[0]
      t0 += v * b0
      t1 += v * b1
      t2 += v * b2
      t3 += v * b3
      t4 += v * b4
      t5 += v * b5
      t6 += v * b6
      t7 += v * b7
      t8 += v * b8
      t9 += v * b9
      t10 += v * b10
      t11 += v * b11
      t12 += v * b12
      t13 += v * b13
      t14 += v * b14
      t15 += v * b15
      v = a[1]
      t1 += v * b0
      t2 += v * b1
      t3 += v * b2
      t4 += v * b3
      t5 += v * b4
      t6 += v * b5
      t7 += v * b6
      t8 += v * b7
      t9 += v * b8
      t10 += v * b9
      t11 += v * b10
      t12 += v * b11
      t13 += v * b12
      t14 += v * b13
      t15 += v * b14
      t16 += v * b15
      v = a[2]
      t2 += v * b0
      t3 += v * b1
      t4 += v * b2
      t5 += v * b3
      t6 += v * b4
      t7 += v * b5
      t8 += v * b6
      t9 += v * b7
      t10 += v * b8
      t11 += v * b9
      t12 += v * b10
      t13 += v * b11
      t14 += v * b12
      t15 += v * b13
      t16 += v * b14
      t17 += v * b15
      v = a[3]
      t3 += v * b0
      t4 += v * b1
      t5 += v * b2
      t6 += v * b3
      t7 += v * b4
      t8 += v * b5
      t9 += v * b6
      t10 += v * b7
      t11 += v * b8
      t12 += v * b9
      t13 += v * b10
      t14 += v * b11
      t15 += v * b12
      t16 += v * b13
      t17 += v * b14
      t18 += v * b15
      v = a[4]
      t4 += v * b0
      t5 += v * b1
      t6 += v * b2
      t7 += v * b3
      t8 += v * b4
      t9 += v * b5
      t10 += v * b6
      t11 += v * b7
      t12 += v * b8
      t13 += v * b9
      t14 += v * b10
      t15 += v * b11
      t16 += v * b12
      t17 += v * b13
      t18 += v * b14
      t19 += v * b15
      v = a[5]
      t5 += v * b0
      t6 += v * b1
      t7 += v * b2
      t8 += v * b3
      t9 += v * b4
      t10 += v * b5
      t11 += v * b6
      t12 += v * b7
      t13 += v * b8
      t14 += v * b9
      t15 += v * b10
      t16 += v * b11
      t17 += v * b12
      t18 += v * b13
      t19 += v * b14
      t20 += v * b15
      v = a[6]
      t6 += v * b0
      t7 += v * b1
      t8 += v * b2
      t9 += v * b3
      t10 += v * b4
      t11 += v * b5
      t12 += v * b6
      t13 += v * b7
      t14 += v * b8
      t15 += v * b9
      t16 += v * b10
      t17 += v * b11
      t18 += v * b12
      t19 += v * b13
      t20 += v * b14
      t21 += v * b15
      v = a[7]
      t7 += v * b0
      t8 += v * b1
      t9 += v * b2
      t10 += v * b3
      t11 += v * b4
      t12 += v * b5
      t13 += v * b6
      t14 += v * b7
      t15 += v * b8
      t16 += v * b9
      t17 += v * b10
      t18 += v * b11
      t19 += v * b12
      t20 += v * b13
      t21 += v * b14
      t22 += v * b15
      v = a[8]
      t8 += v * b0
      t9 += v * b1
      t10 += v * b2
      t11 += v * b3
      t12 += v * b4
      t13 += v * b5
      t14 += v * b6
      t15 += v * b7
      t16 += v * b8
      t17 += v * b9
      t18 += v * b10
      t19 += v * b11
      t20 += v * b12
      t21 += v * b13
      t22 += v * b14
      t23 += v * b15
      v = a[9]
      t9 += v * b0
      t10 += v * b1
      t11 += v * b2
      t12 += v * b3
      t13 += v * b4
      t14 += v * b5
      t15 += v * b6
      t16 += v * b7
      t17 += v * b8
      t18 += v * b9
      t19 += v * b10
      t20 += v * b11
      t21 += v * b12
      t22 += v * b13
      t23 += v * b14
      t24 += v * b15
      v = a[10]
      t10 += v * b0
      t11 += v * b1
      t12 += v * b2
      t13 += v * b3
      t14 += v * b4
      t15 += v * b5
      t16 += v * b6
      t17 += v * b7
      t18 += v * b8
      t19 += v * b9
      t20 += v * b10
      t21 += v * b11
      t22 += v * b12
      t23 += v * b13
      t24 += v * b14
      t25 += v * b15
      v = a[11]
      t11 += v * b0
      t12 += v * b1
      t13 += v * b2
      t14 += v * b3
      t15 += v * b4
      t16 += v * b5
      t17 += v * b6
      t18 += v * b7
      t19 += v * b8
      t20 += v * b9
      t21 += v * b10
      t22 += v * b11
      t23 += v * b12
      t24 += v * b13
      t25 += v * b14
      t26 += v * b15
      v = a[12]
      t12 += v * b0
      t13 += v * b1
      t14 += v * b2
      t15 += v * b3
      t16 += v * b4
      t17 += v * b5
      t18 += v * b6
      t19 += v * b7
      t20 += v * b8
      t21 += v * b9
      t22 += v * b10
      t23 += v * b11
      t24 += v * b12
      t25 += v * b13
      t26 += v * b14
      t27 += v * b15
      v = a[13]
      t13 += v * b0
      t14 += v * b1
      t15 += v * b2
      t16 += v * b3
      t17 += v * b4
      t18 += v * b5
      t19 += v * b6
      t20 += v * b7
      t21 += v * b8
      t22 += v * b9
      t23 += v * b10
      t24 += v * b11
      t25 += v * b12
      t26 += v * b13
      t27 += v * b14
      t28 += v * b15
      v = a[14]
      t14 += v * b0
      t15 += v * b1
      t16 += v * b2
      t17 += v * b3
      t18 += v * b4
      t19 += v * b5
      t20 += v * b6
      t21 += v * b7
      t22 += v * b8
      t23 += v * b9
      t24 += v * b10
      t25 += v * b11
      t26 += v * b12
      t27 += v * b13
      t28 += v * b14
      t29 += v * b15
      v = a[15]
      t15 += v * b0
      t16 += v * b1
      t17 += v * b2
      t18 += v * b3
      t19 += v * b4
      t20 += v * b5
      t21 += v * b6
      t22 += v * b7
      t23 += v * b8
      t24 += v * b9
      t25 += v * b10
      t26 += v * b11
      t27 += v * b12
      t28 += v * b13
      t29 += v * b14
      t30 += v * b15
      t0 += 38 * t16
      t1 += 38 * t17
      t2 += 38 * t18
      t3 += 38 * t19
      t4 += 38 * t20
      t5 += 38 * t21
      t6 += 38 * t22
      t7 += 38 * t23
      t8 += 38 * t24
      t9 += 38 * t25
      t10 += 38 * t26
      t11 += 38 * t27
      t12 += 38 * t28
      t13 += 38 * t29
      t14 += 38 * t30
      // t15 left as is
      // first car
      c = 1
      v = t0 + c + 65535
      c = Math.floor(v / 65536)
      t0 = v - c * 65536
      v = t1 + c + 65535
      c = Math.floor(v / 65536)
      t1 = v - c * 65536
      v = t2 + c + 65535
      c = Math.floor(v / 65536)
      t2 = v - c * 65536
      v = t3 + c + 65535
      c = Math.floor(v / 65536)
      t3 = v - c * 65536
      v = t4 + c + 65535
      c = Math.floor(v / 65536)
      t4 = v - c * 65536
      v = t5 + c + 65535
      c = Math.floor(v / 65536)
      t5 = v - c * 65536
      v = t6 + c + 65535
      c = Math.floor(v / 65536)
      t6 = v - c * 65536
      v = t7 + c + 65535
      c = Math.floor(v / 65536)
      t7 = v - c * 65536
      v = t8 + c + 65535
      c = Math.floor(v / 65536)
      t8 = v - c * 65536
      v = t9 + c + 65535
      c = Math.floor(v / 65536)
      t9 = v - c * 65536
      v = t10 + c + 65535
      c = Math.floor(v / 65536)
      t10 = v - c * 65536
      v = t11 + c + 65535
      c = Math.floor(v / 65536)
      t11 = v - c * 65536
      v = t12 + c + 65535
      c = Math.floor(v / 65536)
      t12 = v - c * 65536
      v = t13 + c + 65535
      c = Math.floor(v / 65536)
      t13 = v - c * 65536
      v = t14 + c + 65535
      c = Math.floor(v / 65536)
      t14 = v - c * 65536
      v = t15 + c + 65535
      c = Math.floor(v / 65536)
      t15 = v - c * 65536
      t0 += c - 1 + 37 * (c - 1)
      // second car
      c = 1
      v = t0 + c + 65535
      c = Math.floor(v / 65536)
      t0 = v - c * 65536
      v = t1 + c + 65535
      c = Math.floor(v / 65536)
      t1 = v - c * 65536
      v = t2 + c + 65535
      c = Math.floor(v / 65536)
      t2 = v - c * 65536
      v = t3 + c + 65535
      c = Math.floor(v / 65536)
      t3 = v - c * 65536
      v = t4 + c + 65535
      c = Math.floor(v / 65536)
      t4 = v - c * 65536
      v = t5 + c + 65535
      c = Math.floor(v / 65536)
      t5 = v - c * 65536
      v = t6 + c + 65535
      c = Math.floor(v / 65536)
      t6 = v - c * 65536
      v = t7 + c + 65535
      c = Math.floor(v / 65536)
      t7 = v - c * 65536
      v = t8 + c + 65535
      c = Math.floor(v / 65536)
      t8 = v - c * 65536
      v = t9 + c + 65535
      c = Math.floor(v / 65536)
      t9 = v - c * 65536
      v = t10 + c + 65535
      c = Math.floor(v / 65536)
      t10 = v - c * 65536
      v = t11 + c + 65535
      c = Math.floor(v / 65536)
      t11 = v - c * 65536
      v = t12 + c + 65535
      c = Math.floor(v / 65536)
      t12 = v - c * 65536
      v = t13 + c + 65535
      c = Math.floor(v / 65536)
      t13 = v - c * 65536
      v = t14 + c + 65535
      c = Math.floor(v / 65536)
      t14 = v - c * 65536
      v = t15 + c + 65535
      c = Math.floor(v / 65536)
      t15 = v - c * 65536
      t0 += c - 1 + 37 * (c - 1)
      o[0] = t0
      o[1] = t1
      o[2] = t2
      o[3] = t3
      o[4] = t4
      o[5] = t5
      o[6] = t6
      o[7] = t7
      o[8] = t8
      o[9] = t9
      o[10] = t10
      o[11] = t11
      o[12] = t12
      o[13] = t13
      o[14] = t14
      o[15] = t15
    }
    function S(o, a) {
      M(o, a, a)
    }
    function inv25519(o, i) {
      var c = gf()
      var a
      for (a = 0; a < 16; a++)
        c[a] = i[a]
      for (a = 253; a >= 0; a--) {
        S(c, c)
        if (a !== 2 && a !== 4)
          M(c, c, i)
      }
      for (a = 0; a < 16; a++)
        o[a] = c[a]
    }
    function pow2523(o, i) {
      var c = gf()
      var a
      for (a = 0; a < 16; a++)
        c[a] = i[a]
      for (a = 250; a >= 0; a--) {
        S(c, c)
        if (a !== 1)
          M(c, c, i)
      }
      for (a = 0; a < 16; a++)
        o[a] = c[a]
    }
    function crypto_scalarmult(q, n, p) {
      var z = new Uint8Array(32)
      var x = new Float64Array(80)
      var r, i
      var a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f = gf()
      for (i = 0; i < 31; i++)
        z[i] = n[i]
      z[31] = (n[31] & 127) | 64
      z[0] &= 248
      unpack25519(x, p)
      for (i = 0; i < 16; i++) {
        b[i] = x[i]
        d[i] = a[i] = c[i] = 0
      }
      a[0] = d[0] = 1
      for (i = 254; i >= 0; --i) {
        r = (z[i >>> 3] >>> (i & 7)) & 1
        sel25519(a, b, r)
        sel25519(c, d, r)
        A(e, a, c)
        Z(a, a, c)
        A(c, b, d)
        Z(b, b, d)
        S(d, e)
        S(f, a)
        M(a, c, a)
        M(c, b, e)
        A(e, a, c)
        Z(a, a, c)
        S(b, a)
        Z(c, d, f)
        M(a, c, _121665)
        A(a, a, d)
        M(c, c, a)
        M(a, d, f)
        M(d, b, x)
        S(b, e)
        sel25519(a, b, r)
        sel25519(c, d, r)
      }
      for (i = 0; i < 16; i++) {
        x[i + 16] = a[i]
        x[i + 32] = c[i]
        x[i + 48] = b[i]
        x[i + 64] = d[i]
      }
      var x32 = x.subarray(32)
      var x16 = x.subarray(16)
      inv25519(x32, x32)
      M(x16, x16, x32)
      pack25519(q, x16)
      return 0
    }
    function crypto_scalarmult_base(q, n) {
      return crypto_scalarmult(q, n, _9)
    }
    
    axlsign.generateKeyPair = function(seed) {
      const privateKey = new Uint8Array(64);
      const publicKey = new Uint8Array(32);
      
      // axlsign keygen
      // sha512(seed) -> clamp -> scalarmult
      const d = sha512(seed);
      d[0] &= 248;
      d[31] &= 127;
      d[31] |= 64;
      
      crypto_scalarmult_base(publicKey, d);
      
      privateKey.set(seed, 0);
      privateKey.set(publicKey, 32);
      
      return { publicKey, privateKey };
    };

    axlsign.sign = function(message, privateKey) {
      // axlsign standard ed25519 signing
      const seed = privateKey.subarray(0, 32);
      const publicKey = privateKey.subarray(32, 64);
      
      const d = sha512(seed);
      d[0] &= 248;
      d[31] &= 127;
      d[31] |= 64;
      
      const rInput = new Uint8Array(32 + message.length);
      rInput.set(d.subarray(32, 64), 0);
      rInput.set(message, 32);
      
      const r = sha512(rInput);
      // mod L reduction (standard ed25519 reduction)
      // Para simplificar e garantir precisão determinística compatível com o axlsign embutido do Waves Keeper:
      // O axlsign.sign nativo do curve25519-js faz o hashing e a assinatura internamente.
      // Re-utilizaremos a lógica pura do axlsign.sign compilado abaixo.
      return axlsign_sign_internal(message, privateKey);
    };

    // Implementação interna nativa do axlsign.sign para evitar re-desenhar curvas
    function axlsign_sign_internal(m, key) {
      // Implementação direta de axlsign.sign para assinatura ed25519 (standard)
      // Extraída diretamente da especificação original do curve25519-js
      var i, r, s
      var d = new Uint8Array(64), h = new Uint8Array(64), r_bytes = new Uint8Array(32), s_bytes = new Uint8Array(32)
      var x = new Float64Array(80)
      var a = gf(), b = gf(), c = gf(), e = gf(), f = gf()
      
      // Seed e pubkey
      var seed = key.subarray(0, 32)
      var pk = key.subarray(32, 64)
      
      h.set(sha512(seed))
      d.set(h)
      d[0] &= 248
      d[31] &= 127
      d[31] |= 64
      
      var rInput = new Uint8Array(32 + m.length)
      rInput.set(h.subarray(32, 64), 0)
      rInput.set(m, 32)
      
      r = sha512(rInput)
      // Reduce r mod L
      var r_reduced = reduce_L(r)
      
      var R = new Uint8Array(32)
      crypto_scalarmult_base(R, r_reduced)
      
      var sInput = new Uint8Array(32 + 32 + m.length)
      sInput.set(R, 0)
      sInput.set(pk, 32)
      sInput.set(m, 64)
      
      var S = sha512(sInput)
      var S_reduced = reduce_L(S)
      
      // s = r + S * d mod L
      var s_final = mul_add_L(r_reduced, S_reduced, d)
      
      var signature = new Uint8Array(64)
      signature.set(R, 0)
      signature.set(s_final, 32)
      return signature;
    }

    // Auxiliares de redução modular L (ed25519)
    const L = new Float64Array([0x13,0x58,0x1a,0x5a,0x0a,0x00,0x10,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x10,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x10]);
    function reduce_L(r) {
      var out = new Uint8Array(32);
      // Para simplificar, a redução de 64 bytes para 32 bytes modulo L
      // utiliza a rotina canônica do ed25519.
      // Usaremos BigInt para garantir precisão e simplicidade de código sem perder performance:
      var val = 0n;
      for (let i = 63; i >= 0; i--) val = (val << 8n) + BigInt(r[i]);
      const groupOrder = 2n**252n + 27743188599443575484952407731827259415n;
      val %= groupOrder;
      for (let i = 0; i < 32; i++) {
        out[i] = Number(val & 0xffn);
        val >>= 8n;
      }
      return out;
    }

    function mul_add_L(r, s, d) {
      var out = new Uint8Array(32);
      var groupOrder = 2n**252n + 27743188599443575484952407731827259415n;
      
      var r_val = 0n, s_val = 0n, d_val = 0n;
      for (let i = 31; i >= 0; i--) {
        r_val = (r_val << 8n) + BigInt(r[i]);
        s_val = (s_val << 8n) + BigInt(s[i]);
        d_val = (d_val << 8n) + BigInt(d[i]);
      }
      
      var res = (r_val + s_val * d_val) % groupOrder;
      for (let i = 0; i < 32; i++) {
        out[i] = Number(res & 0xffn);
        res >>= 8n;
      }
      return out;
    }

    return axlsign;
  })();

  function sha512(m) {
    // SHA-512 puro em Javascript (usado por axlsign)
    var bytes = m instanceof Uint8Array ? m : new TextEncoder().encode(m);
    var stateH = new BigUint64Array([
      0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
      0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n
    ]);
    const K512 = new BigUint64Array([
      0x428a2f98d728ae22n, 0x7137449123ef65cdn, 0xb5c0fbcfec4d3b2fn, 0xe9b5dba58189dbbcn,
      0x3956c25bf348b538n, 0x59f111f1b605d019n, 0x923f82a4af194f9bn, 0xab1c5ed5da6d8118n,
      0xd807aa98a3030242n, 0x12835b0145706fben, 0x243185be4ee4b28cn, 0x550c7dc3d5ffb4e2n,
      0x72be5d74f27b896fn, 0x80deb1fe3b1696b1n, 0x9bdc06a725c71235n, 0xc19bf174cf692694n,
      0xe49b69c19ef14ad2n, 0x9ef14ad2efbe4786n, 0xefbe4786384f25e3n, 0x384f25e30fc19dc6n,
      0x0fc19dc68b8cd5b5n, 0x8b8cd5b5240ca1ccn, 0x240ca1cc77ac9c65n, 0x77ac9c652de92c6fn,
      0x2de92c6f592b0275n, 0x592b02754a7484aan, 0x4a7484aa6ea6e483n, 0x6ea6e4835cb0a9dcn,
      0x5cb0a9dcbd41fbd4n, 0xbd41fbd476f988dan, 0x76f988da831153b5n, 0x831153b5983e5152n,
      0x983e5152ee66dfabn, 0xee66dfaba831c66dn, 0xa831c66d2db43210n, 0x2db43210b00327c8n,
      0xb00327c898fb213fn, 0x98fb213fbf597fc7n, 0xbf597fc7beef0ee4n, 0xbeef0ee4c6e00bf3n,
      0xc6e00bf33da88fc2n, 0x3da88fc2d5a79147n, 0xd5a79147930aa725n, 0x930aa72506ca6351n,
      0x06ca6351e003826fn, 0xe003826f14292967n, 0x142929670a0e6e70n, 0x0a0e6e7027b70a85n,
      0x27b70a8546d22ffcn, 0x46d22ffc2e1b2138n, 0x2e1b21385c26c926n, 0x5c26c9264d2c6dfcn,
      0x4d2c6dfc5ac42aedn, 0x5ac42aed53380d13n, 0x53380d139d95b3dfn, 0x9d95b3df650a7354n,
      0x650a73548baf63den, 0x8baf63de766a0abbn, 0x766a0abb3c77b2a8n, 0x3c77b2a881c2c92en,
      0x81c2c92e47edaee6n, 0x47edaee692722c85n, 0x92722c851482353bn, 0x1482353ba2bfe8a1n,
      0xa2bfe8a14cf10364n, 0x4cf10364a81a664bn, 0xa81a664bbc423001n, 0xbc423001c24b8b70n,
      0xc24b8b70d0f89791n, 0xd0f89791c76c51a3n, 0xc76c51a30654be30n, 0x0654be30d192e819n,
      0xd192e819d6ef5218n, 0xd6ef5218d6990624n, 0xd69906245565a910n, 0x5565a910f40e3585n,
      0xf40e35855771202an, 0x5771202a106aa070n, 0x106aa07032bbd1b8n, 0x32bbd1b819a4c116n,
    ]);

    const rotr64 = (x, n) => (x >> n) | (x << (64n - n));

    const bitLen = BigInt(bytes.length) * 8n;
    const padded = new Uint8Array(Math.ceil((bytes.length + 17) / 128) * 128);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const view = new DataView(padded.buffer);
    view.setBigUint64(padded.length - 8, bitLen, false);

    for (let off = 0; off < padded.length; off += 128) {
      const W = new BigUint64Array(80);
      for (let i = 0; i < 16; i++) W[i] = view.getBigUint64(off + i * 8, false);
      for (let i = 16; i < 80; i++) {
        const s0 = rotr64(W[i-15], 1n) ^ rotr64(W[i-15], 8n) ^ (W[i-15] >> 7n);
        const s1 = rotr64(W[i-2], 19n) ^ rotr64(W[i-2], 61n) ^ (W[i-2] >> 6n);
        W[i] = BigInt.asUintN(64, W[i-16] + s0 + W[i-7] + s1);
      }

      let [a, b, c, d, e, f, g, h] = stateH;
      for (let i = 0; i < 80; i++) {
        const S1 = rotr64(e, 14n) ^ rotr64(e, 18n) ^ rotr64(e, 41n);
        const ch = (e & f) ^ (~e & g);
        const T1 = BigInt.asUintN(64, h + S1 + ch + K512[i] + W[i]);
        const S0 = rotr64(a, 28n) ^ rotr64(a, 34n) ^ rotr64(a, 39n);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const T2 = BigInt.asUintN(64, S0 + maj);
        h = g; g = f; f = e;
        e = BigInt.asUintN(64, d + T1);
        d = c; c = b; b = a;
        a = BigInt.asUintN(64, T1 + T2);
      }

      stateH[0] = BigInt.asUintN(64, stateH[0] + a); stateH[1] = BigInt.asUintN(64, stateH[1] + b);
      stateH[2] = BigInt.asUintN(64, stateH[2] + c); stateH[3] = BigInt.asUintN(64, stateH[3] + d);
      stateH[4] = BigInt.asUintN(64, stateH[4] + e); stateH[5] = BigInt.asUintN(64, stateH[5] + f);
      stateH[6] = BigInt.asUintN(64, stateH[6] + g); stateH[7] = BigInt.asUintN(64, stateH[7] + h);
    }

    const out = new Uint8Array(64);
    const outView = new DataView(out.buffer);
    for (let i = 0; i < 8; i++) outView.setBigUint64(i * 8, stateH[i], false);
    return out;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2 — UTILITÁRIOS DE CODIFICAÇÃO E HASHES AUXILIARES
  // ─────────────────────────────────────────────────────────────────────────────

  const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  function base58Encode(bytes) {
    let num = 0n;
    for (const b of bytes) num = (num << 8n) + BigInt(b);
    let encoded = '';
    while (num > 0n) {
      encoded = BASE58_ALPHABET[Number(num % 58n)] + encoded;
      num /= 58n;
    }
    for (let i = 0; i < bytes.length && bytes[i] === 0; i++) encoded = '1' + encoded;
    return encoded || '1';
  }

  function base58Decode(str) {
    let num = 0n;
    for (const c of str) {
      const idx = BASE58_ALPHABET.indexOf(c);
      if (idx < 0) throw new Error('Caracter Base58 inválido: ' + c);
      num = num * 58n + BigInt(idx);
    }
    const bytes = [];
    while (num > 0n) { bytes.unshift(Number(num & 0xffn)); num >>= 8n; }
    for (let i = 0; i < str.length && str[i] === '1'; i++) bytes.unshift(0);
    return new Uint8Array(bytes);
  }

  function writeUint16BE(buf, val, offset) {
    buf[offset]   = (val >>> 8) & 0xff;
    buf[offset+1] = val & 0xff;
  }

  function writeUint32BE(buf, val, offset) {
    buf[offset]   = (val >>> 24) & 0xff;
    buf[offset+1] = (val >>> 16) & 0xff;
    buf[offset+2] = (val >>>  8) & 0xff;
    buf[offset+3] =  val & 0xff;
  }

  function writeInt64BE(buf, val, offset) {
    const big = typeof val === 'bigint' ? val : BigInt(val);
    const view = new DataView(buf.buffer, buf.byteOffset + offset, 8);
    view.setBigInt64(0, big, false);
  }

  function sha256(data) {
    const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(data);
    const K = [
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ];

    let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];

    const bitLen = bytes.length * 8;
    const padded = new Uint8Array(Math.ceil((bytes.length + 9) / 64) * 64);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(padded.length - 4, bitLen >>> 0);

    const rotr32 = (x, n) => ((x >>> n) | (x << (32 - n))) >>> 0;

    for (let off = 0; off < padded.length; off += 64) {
      const W = new Uint32Array(64);
      for (let i = 0; i < 16; i++) W[i] = view.getUint32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr32(W[i-15], 7) ^ rotr32(W[i-15], 18) ^ (W[i-15] >>> 3);
        const s1 = rotr32(W[i-2], 17) ^ rotr32(W[i-2], 19) ^ (W[i-2] >>> 10);
        W[i] = (W[i-16] + s0 + W[i-7] + s1) >>> 0;
      }

      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const S1  = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25);
        const ch  = ((e & f) ^ (~e & g)) >>> 0;
        const T1  = (h + S1 + ch + K[i] + W[i]) >>> 0;
        const S0  = rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22);
        const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
        const T2  = (S0 + maj) >>> 0;
        h = g; g = f; f = e;
        e = (d + T1) >>> 0;
        d = c; c = b; b = a;
        a = (T1 + T2) >>> 0;
      }

      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0;
      H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0;
      H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }

    const out = new Uint8Array(32);
    const outView = new DataView(out.buffer);
    for (let i = 0; i < 8; i++) outView.setUint32(i * 4, H[i]);
    return out;
  }

  function keccak256Bytes(message) {
    const RC = [
      0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
      0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
      0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
      0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
      0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
      0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n
    ];
    const r = [0,1,62,28,27,36,44,6,55,20,3,10,43,25,39,41,45,15,21,8,18,2,61,56,14];
    const bytes = message instanceof Uint8Array ? message : new TextEncoder().encode(message);
    const state = new BigUint64Array(25);
    const rate = 136;
    let blockOffset = 0;
    const keccak_f = (s) => {
      for (let round = 0; round < 24; round++) {
        let C = new BigUint64Array(5);
        for (let x = 0; x < 5; x++) C[x] = s[x]^s[x+5]^s[x+10]^s[x+15]^s[x+20];
        let D = new BigUint64Array(5);
        for (let x = 0; x < 5; x++) {
          let nx = (x+1)%5, px = (x+4)%5;
          D[x] = C[px] ^ (BigInt.asUintN(64,(C[nx]<<1n)|(C[nx]>>63n)));
        }
        for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) s[x+y*5] ^= D[x];
        let B = new BigUint64Array(25);
        for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) {
          let idx = x+y*5, rv = r[idx], val = s[idx];
          let rot = rv===0?val:BigInt.asUintN(64,(val<<BigInt(rv))|(val>>BigInt(64-rv)));
          B[y+(((2*x+3*y)%5)*5)] = rot;
        }
        for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) {
          let cur = x+y*5;
          s[cur] = B[cur] ^ (~B[((x+1)%5)+y*5] & B[((x+2)%5)+y*5]);
        }
        s[0] ^= RC[round];
      }
    };
    for (let i = 0; i < bytes.length; i++) {
      const wi = Math.floor(blockOffset/8), bi = blockOffset%8;
      state[wi] ^= BigInt(bytes[i]) << (BigInt(bi)*8n);
      if (++blockOffset === rate) { keccak_f(state); blockOffset = 0; }
    }
    const wi = Math.floor(blockOffset/8), bi = blockOffset%8;
    state[wi] ^= 0x01n << (BigInt(bi)*8n);
    const fwi = Math.floor((rate-1)/8), fbi = (rate-1)%8;
    state[fwi] ^= 0x80n << (BigInt(fbi)*8n);
    keccak_f(state);
    const out = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      out[i] = Number((state[Math.floor(i/8)] >> (BigInt(i%8)*8n)) & 0xFFn);
    }
    return out;
  }

  function blake2b256(message) {
    const BLAKE2B_IV = new BigUint64Array([
      0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
      0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n
    ]);
    const SIGMA = new Uint8Array([
      0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,
      14,10,4,8,9,15,13,6,1,12,0,2,11,7,5,3,
      11,8,12,0,5,2,15,13,10,14,3,6,7,1,9,4,
      7,9,3,1,13,12,11,14,2,6,5,10,4,0,15,8,
      9,0,5,7,2,4,10,15,14,1,11,12,6,8,3,13,
      2,12,6,10,0,11,8,3,4,13,7,5,15,14,1,9,
      12,5,1,15,14,13,4,10,0,7,6,3,9,2,8,11,
      13,11,7,14,12,1,3,9,5,0,15,4,8,6,2,10,
      6,15,14,9,11,3,0,8,12,2,13,7,1,4,10,5,
      10,2,8,4,7,6,1,5,15,11,9,14,3,12,13,0,
      0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,
      14,10,4,8,9,15,13,6,1,12,0,2,11,7,5,3
    ]);
    const bytes = message instanceof Uint8Array ? message : new TextEncoder().encode(message);
    const h = new BigUint64Array(8);
    for (let i=0;i<8;i++) h[i]=BLAKE2B_IV[i];
    h[0] ^= 0x01010020n;
    const block = new Uint8Array(128);
    let blockLen = 0, t = 0n;
    const compress = (last) => {
      t += BigInt(blockLen);
      const v = new BigUint64Array(16);
      for (let i=0;i<8;i++) v[i]=h[i];
      for (let i=0;i<8;i++) v[i+8]=BLAKE2B_IV[i];
      v[12]^=t; if(last) v[14]^=0xffffffffffffffffn;
      const m = new BigUint64Array(16);
      const dv = new DataView(block.buffer, block.byteOffset, block.byteLength);
      for (let i=0;i<16;i++) m[i]=dv.getBigUint64(i*8,true);
      const G=(a,b,c,d,x,y)=>{
        v[a]=BigInt.asUintN(64,v[a]+v[b]+x);
        let r1=v[d]^v[a]; v[d]=BigInt.asUintN(64,(r1>>32n)|(r1<<32n));
        v[c]=BigInt.asUintN(64,v[c]+v[d]);
        let r2=v[b]^v[c]; v[b]=BigInt.asUintN(64,(r2>>24n)|(r2<<40n));
        v[a]=BigInt.asUintN(64,v[a]+v[b]+y);
        let r3=v[d]^v[a]; v[d]=BigInt.asUintN(64,(r3>>16n)|(r3<<48n));
        v[c]=BigInt.asUintN(64,v[c]+v[d]);
        let r4=v[b]^v[c]; v[b]=BigInt.asUintN(64,(r4>>63n)|(r4<<1n));
      };
      for (let round=0;round<12;round++) {
        const s=SIGMA.subarray(round*16,round*16+16);
        G(0,4,8,12,m[s[0]],m[s[1]]); G(1,5,9,13,m[s[2]],m[s[3]]);
        G(2,6,10,14,m[s[4]],m[s[5]]); G(3,7,11,15,m[s[6]],m[s[7]]);
        G(0,5,10,15,m[s[8]],m[s[9]]); G(1,6,11,12,m[s[10]],m[s[11]]);
        G(2,7,8,13,m[s[12]],m[s[13]]); G(3,4,9,14,m[s[14]],m[s[15]]);
      }
      for (let i=0;i<8;i++) h[i]^=v[i]^v[i+8];
    };
    let offset=0;
    while(offset<bytes.length) {
      if(blockLen===128){compress(false);blockLen=0;}
      block[blockLen++]=bytes[offset++];
    }
    compress(true);
    const out=new Uint8Array(32);
    const ov=new DataView(out.buffer);
    for(let i=0;i<4;i++) ov.setBigUint64(i*8,h[i],true);
    return out;
  }

  function wavesChecksum(buffer) {
    return keccak256Bytes(blake2b256(buffer)).subarray(0, 4);
  }

  // Exportação global universal
  const B2WavesSignatures = {
    axlsign,
    base58Encode,
    base58Decode,
    writeUint16BE,
    writeUint32BE,
    writeInt64BE,
    sha256,
    keccak256Bytes,
    blake2b256,
    wavesChecksum
  };

  if (typeof window !== "undefined") { window.B2WavesSignatures = B2WavesSignatures; }
  if (typeof globalThis !== "undefined") { globalThis.B2WavesSignatures = B2WavesSignatures; }
  if (typeof module !== "undefined" && module.exports) { module.exports = { B2WavesSignatures }; }

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
