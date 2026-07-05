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
 * 핀 갱신 주기:
 *  - Let's Encrypt는 인증서 갱신 시 발급 중간 CA가 바뀔 수 있다 (예: R13 → YR1, 2026-07-03 갱신 확인).
 *    중간 CA 핀은 CA가 바뀌면 반드시 재확인/갱신해야 하며, 90일 인증서 갱신 주기마다 확인 권장.
 *  - CA 로테이션 대비 ISRG Root YR 핀을 백업으로 포함
 *  - 핀 확인 (리프): openssl s_client -connect api.gwangsan.io.kr:443 -servername api.gwangsan.io.kr -showcerts 2>/dev/null \
 *      | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der \
 *      | openssl dgst -sha256 -binary | base64
 *  - 핀 확인 (중간 CA): openssl s_client -connect api.gwangsan.io.kr:443 -servername api.gwangsan.io.kr -showcerts 2>/dev/null \
 *      | awk '/BEGIN CERTIFICATE/,/END CERTIFICATE/{ if(/BEGIN/){n++}; if(n==2) print }' \
 *      | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der \
 *      | openssl dgst -sha256 -binary | base64
 *  - 최종 갱신: 2026-07-04 (배포 환경 로그인 Network Error 장애 대응, YR1/Root YR 계열로 전환됨을 확인)
 *  - iOS는 ios/app/AppDelegate.swift의 TrustKit 핀도 함께 갱신할 것
 */
const NSC_XML = `<?xml version="1.0" encoding="utf-8"?>
<!--
  Certificate Pinning - Gwangsan Crossplatform
  Primary : Let's Encrypt YR1 중간 CA (인증서 갱신 후에도 유효)
  Backup  : ISRG Root YR + api.gwangsan.io.kr 리프 인증서
-->
<network-security-config>
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system"/>
    </trust-anchors>
  </base-config>
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">gwangsan.io.kr</domain>
    <pin-set>
      <!-- Let's Encrypt YR1 중간 CA (주 핀) -->
      <pin digest="SHA-256">LoMHBotttiDko50Gi13uXW71eIy7LAttI+rYT8wXF4w=</pin>
      <!-- ISRG Root YR (중간 CA 로테이션 대비 백업 핀) -->
      <pin digest="SHA-256">fk6IOKit1ild5647BH06ujSIq5XbCgqlbYl6ANhhi88=</pin>
      <!-- api.gwangsan.io.kr 리프 인증서 (백업 핀) -->
      <pin digest="SHA-256">LJvhzltzFZmCqLJuDqFT7BtZJTQu+ViVV0IEfAsYeF4=</pin>
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
