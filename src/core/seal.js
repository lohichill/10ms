// src/core/seal.js
// 10ms core · seal: băm nguồn thành dấu niêm phong 16 hex ký tự.
// Thuần, zero dep. P4 (cùng nguồn → cùng seal) · D18 (seal gắn bản chạy).

// FNV-1a 32-bit, xử lý 2 byte mỗi ký tự (không bỏ sót byte thấp).
function fnv1a(str, offset, prime) {
  let h = offset >>> 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h ^= c & 0xff;
    h = Math.imul(h, prime) >>> 0;
    h ^= (c >>> 8) & 0xff;
    h = Math.imul(h, prime) >>> 0;
  }
  return h >>> 0;
}

// Hai pass với hằng số khác nhau → 16 hex (64-bit danh nghĩa).
function seal(source) {
  if (typeof source !== 'string') {
    const e = new Error('seal');
    e.detail = {
      error: 'seal',
      pos: { line: 1, col: 1 },
      expected: 'source string',
      fix: 'seal(readFile(".10ms"))',
      seed: 0,
    };
    throw e;
  }
  const a = fnv1a(source, 2166136261, 16777619);
  const b = fnv1a(source, (2166136261 ^ 0x9e3779b9) >>> 0, (16777619 ^ 0x1b) >>> 0);
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}

// Cùng nguồn + cùng seal → true. Ngược lại → false. Không ném.
function verifySeal(source, expected) {
  return seal(source) === expected;
}

module.exports = { seal, verifySeal };