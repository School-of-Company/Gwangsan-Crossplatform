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
    // 핀 목록·만료일은 plugins/withNetworkSecurityConfig.js(Android)와 같아야 한다 — 정책과 해시 계산법은 그 파일 참고.
    // 만료일 이후에는 피닝이 꺼져(fail-open) CA 교체 시 구버전 앱이 접속 불가가 되지 않는다.
    let trustKitConfig: [String: Any] = [
      kTSKSwizzleNetworkDelegates: true,
      kTSKPinnedDomains: [
        "gwangsan.io.kr": [
          kTSKIncludeSubdomains: true,
          kTSKEnforcePinning: true,
          kTSKDisableDefaultReportUri: true,
          kTSKExpirationDate: "2027-12-31",
          kTSKPublicKeyHashes: [
            "nWN7PSep5XDQdge5zK24CnCRXHr3KvzhKEGxsdqCX9E=",  // Let's Encrypt YR2 중간 CA
            "LoMHBotttiDko50Gi13uXW71eIy7LAttI+rYT8wXF4w=",  // Let's Encrypt YR1 중간 CA
            "fk6IOKit1ild5647BH06ujSIq5XbCgqlbYl6ANhhi88=",  // ISRG Root YR
            "C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=",  // ISRG Root X1
            "diGVwiVYbubAI3RW4hB9xU8e/CH2GnkuvVFZE8zmgzI=",  // ISRG Root X2
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
