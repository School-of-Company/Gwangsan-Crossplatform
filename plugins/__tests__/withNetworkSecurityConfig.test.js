/* global __dirname, describe, it, expect */
const fs = require('fs');
const path = require('path');
const { CERTIFICATE_PINS, NSC_XML, PIN_EXPIRATION } = require('../withNetworkSecurityConfig');

const appDelegate = fs.readFileSync(
  path.join(__dirname, '..', '..', 'ios', 'app', 'AppDelegate.swift'),
  'utf-8'
);

const pinHashes = CERTIFICATE_PINS.map(({ hash }) => hash);

describe('인증서 핀 설정', () => {
  it('핀은 SHA-256 SPKI 해시(base64 44자) 형식이고 중복이 없다', () => {
    pinHashes.forEach((hash) => expect(hash).toMatch(/^[A-Za-z0-9+/]{43}=$/));
    expect(new Set(pinHashes).size).toBe(pinHashes.length);
  });

  it('TrustKit은 최소 2개 핀을 요구하므로 백업 핀을 포함해 2개 이상이다', () => {
    expect(pinHashes.length).toBeGreaterThanOrEqual(2);
  });

  it('Android NSC XML의 pin-set에 만료일과 모든 핀이 들어간다', () => {
    expect(NSC_XML).toContain(`<pin-set expiration="${PIN_EXPIRATION}">`);
    const xmlPins = [...NSC_XML.matchAll(/<pin digest="SHA-256">([^<]+)<\/pin>/g)].map((m) => m[1]);
    expect(xmlPins).toEqual(pinHashes);
  });

  it('만료일은 yyyy-MM-dd 형식의 실제 날짜다', () => {
    expect(PIN_EXPIRATION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(new Date(`${PIN_EXPIRATION}T00:00:00Z`).getTime())).toBe(false);
  });

  it('iOS TrustKit 설정이 Android와 같은 핀 목록과 만료일을 쓴다', () => {
    const hashesBlock = appDelegate.match(/kTSKPublicKeyHashes:\s*\[([\s\S]*?)\]/);
    expect(hashesBlock).not.toBeNull();
    const iosPins = [...hashesBlock[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

    expect(iosPins).toEqual(pinHashes);
    expect(appDelegate).toContain(`kTSKExpirationDate: "${PIN_EXPIRATION}"`);
  });
});
