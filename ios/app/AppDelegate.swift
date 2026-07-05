internal import Expo
internal import React
internal import ReactAppDependencyProvider

@UIApplicationMain
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    #if !DEBUG
    // Certificate Pinning — TrustKit
    // Pins: Let's Encrypt YR1 중간 CA (주 핀) + ISRG Root YR (백업) + 리프 인증서 (백업)
    // 핀 갱신 명령: openssl s_client -connect api.gwangsan.io.kr:443 2>/dev/null \
    //   | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der \
    //   | openssl dgst -sha256 -binary | base64
    let trustKitConfig: [String: Any] = [
      kTSKSwizzleNetworkDelegates: true,
      kTSKPinnedDomains: [
        "gwangsan.io.kr": [
          kTSKIncludeSubdomains: true,
          kTSKEnforcePinning: true,
          kTSKDisableDefaultReportUri: true,
          kTSKPublicKeyHashes: [
            "LoMHBotttiDko50Gi13uXW71eIy7LAttI+rYT8wXF4w=",  // Let's Encrypt YR1 중간 CA
            "fk6IOKit1ild5647BH06ujSIq5XbCgqlbYl6ANhhi88=",  // ISRG Root YR (중간 CA 로테이션 대비 백업)
            "LJvhzltzFZmCqLJuDqFT7BtZJTQu+ViVV0IEfAsYeF4=",  // 리프 인증서 (백업)
          ],
        ]
      ]
    ]
    TrustKit.initSharedInstance(withConfiguration: trustKitConfig)
    #endif

    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
  override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
