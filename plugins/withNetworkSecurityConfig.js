const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Android Network Security Config 설정 플러그인
 *
 * 역할:
 *  1. android/app/src/main/res/xml/network_security_config.xml 생성 (인증서 피닝)
 *  2. AndroidManifest.xml에 networkSecurityConfig 속성 추가
 *  3. usesCleartextTraffic="false" 로 HTTP 평문 트래픽 차단
 *
 * 핀 정책:
 *  - Let's Encrypt는 인증서 갱신 때마다 발급 중간 CA를 바꿀 수 있으므로(YR1 ↔ YR2 ...) 중간 CA 핀만으로는
 *    로그인 장애가 난다. 체인 어디든 하나만 맞으면 통과하므로 루트(Root YR, ISRG Root X1/X2)를 함께 건다.
 *    구형 기기는 Root YR을 신뢰 저장소에 갖고 있지 않아 X1 교차서명 경로로 검증되므로 X1 핀이 필요하다.
 *  - PIN_EXPIRATION 이후에는 피닝이 꺼지고 일반 TLS 검증만 한다(fail-open). 업데이트하지 않은 구버전 앱이
 *    CA 교체로 영영 접속 불가가 되는 것을 막기 위함이므로, 날짜가 가까워지면 핀을 재확인하고 연장해 배포한다.
 *  - 해시 계산: openssl x509 -in <cert.pem> -pubkey -noout | openssl pkey -pubin -outform der \
 *      | openssl dgst -sha256 -binary | openssl base64
 *    현재 체인: openssl s_client -connect api.gwangsan.io.kr:443 -servername api.gwangsan.io.kr -showcerts
 *    CA 원본: https://letsencrypt.org/certificates/
 *  - iOS는 ios/app/AppDelegate.swift의 TrustKit 설정이 같은 값을 써야 한다(plugins/__tests__에서 검사).
 */
const PIN_EXPIRATION = '2027-12-31';

const CERTIFICATE_PINS = [
  { hash: 'nWN7PSep5XDQdge5zK24CnCRXHr3KvzhKEGxsdqCX9E=', label: "Let's Encrypt YR2 중간 CA" },
  { hash: 'LoMHBotttiDko50Gi13uXW71eIy7LAttI+rYT8wXF4w=', label: "Let's Encrypt YR1 중간 CA" },
  { hash: 'fk6IOKit1ild5647BH06ujSIq5XbCgqlbYl6ANhhi88=', label: 'ISRG Root YR' },
  { hash: 'C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=', label: 'ISRG Root X1' },
  { hash: 'diGVwiVYbubAI3RW4hB9xU8e/CH2GnkuvVFZE8zmgzI=', label: 'ISRG Root X2' },
];

const NSC_XML = `<?xml version="1.0" encoding="utf-8"?>
<!-- Certificate Pinning - Gwangsan Crossplatform (plugins/withNetworkSecurityConfig.js에서 생성) -->
<network-security-config>
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system"/>
    </trust-anchors>
  </base-config>
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">gwangsan.io.kr</domain>
    <pin-set expiration="${PIN_EXPIRATION}">
${CERTIFICATE_PINS.map(
  ({ hash, label }) => `      <!-- ${label} -->\n      <pin digest="SHA-256">${hash}</pin>`
).join('\n')}
    </pin-set>
  </domain-config>
</network-security-config>
`;

// 개발 서버(Metro) 연결용 - debug 빌드에서만 cleartext 허용, release에는 영향 없음
const NSC_XML_DEBUG = `<?xml version="1.0" encoding="utf-8"?>
<!-- Debug-only: Metro 번들러(HTTP) 연결을 위해 cleartext 허용. release 빌드에는 적용되지 않음 -->
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system"/>
      <certificates src="user"/>
    </trust-anchors>
  </base-config>
</network-security-config>
`;

/** @type {import('@expo/config-plugins').ConfigPlugin} */
const withNetworkSecurityConfig = (config) => {
  // Step 1: NSC XML 파일 생성 (release 기본값 - 인증서 피닝 적용)
  config = withDangerousMod(config, [
    'android',
    (expoConfig) => {
      const xmlDir = path.join(
        expoConfig.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml'
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, 'network_security_config.xml'), NSC_XML, 'utf-8');

      // Step 1b: debug variant 전용 NSC (cleartext 허용) - main 설정을 오버라이드
      const debugXmlDir = path.join(
        expoConfig.modRequest.platformProjectRoot,
        'app',
        'src',
        'debug',
        'res',
        'xml'
      );
      fs.mkdirSync(debugXmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(debugXmlDir, 'network_security_config.xml'),
        NSC_XML_DEBUG,
        'utf-8'
      );
      return expoConfig;
    },
  ]);

  // Step 2: AndroidManifest.xml에 속성 추가
  config = withAndroidManifest(config, (expoConfig) => {
    const manifest = expoConfig.modResults;
    const application = manifest.manifest.application?.[0];
    if (application) {
      application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
      application.$['android:usesCleartextTraffic'] = 'false';
    }
    return expoConfig;
  });

  return config;
};

module.exports = withNetworkSecurityConfig;
module.exports.PIN_EXPIRATION = PIN_EXPIRATION;
module.exports.CERTIFICATE_PINS = CERTIFICATE_PINS;
module.exports.NSC_XML = NSC_XML;
