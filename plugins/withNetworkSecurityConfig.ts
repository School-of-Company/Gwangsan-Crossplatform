import { ConfigPlugin, withAndroidManifest, withDangerousMod } from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Android Network Security Config 설정 플러그인
 *
 * 역할:
 *  1. android/app/src/main/res/xml/network_security_config.xml 생성 (인증서 피닝)
 *  2. AndroidManifest.xml에 networkSecurityConfig 속성 추가
 *  3. usesCleartextTraffic="false" 로 HTTP 평문 트래픽 차단
 *
 * 핀 갱신 주기:
 *  - Let's Encrypt R13 중간 CA 핀은 CA 교체 시에만 변경 필요 (90일 인증서 갱신과 무관)
 *  - 핀 확인: openssl s_client -connect api.gwangsan.io.kr:443 2>/dev/null \
 *      | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der \
 *      | openssl dgst -sha256 -binary | base64
 */
const NSC_XML = `<?xml version="1.0" encoding="utf-8"?>
<!--
  Certificate Pinning - Gwangsan Crossplatform
  Primary : Let's Encrypt R13 중간 CA (인증서 갱신 후에도 유효)
  Backup  : api.gwangsan.io.kr 리프 인증서
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
      <!-- Let's Encrypt R13 중간 CA (주 핀) -->
      <pin digest="SHA-256">AlSQhgtJirc8ahLyekmtX+Iw+v46yPYRLJt9Cq1GlB0=</pin>
      <!-- api.gwangsan.io.kr 리프 인증서 (백업 핀) -->
      <pin digest="SHA-256">p50MoRVG3nfXUrJGJrfLe5fP+kwk3vgJ/l++gKla2d4=</pin>
    </pin-set>
  </domain-config>
</network-security-config>
`;

const withNetworkSecurityConfig: ConfigPlugin = (config) => {
  // Step 1: NSC XML 파일 생성
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

export default withNetworkSecurityConfig;
