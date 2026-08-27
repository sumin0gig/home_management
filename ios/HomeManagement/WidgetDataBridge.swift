import Foundation
import WidgetKit

// Bridges the top-3 chore snapshot from JS into the App Group's shared
// UserDefaults so the WidgetKit extension (ios/HomeManagementWidget) can read
// it without needing its own network/auth access.
//
// NOTE: this file is not yet part of any Xcode target. See the iOS widget
// setup steps for how to add it to the main app target.
@objc(WidgetDataBridge)
class WidgetDataBridge: NSObject {
  static let appGroupId = "group.com.homemanagement.widget"
  static let storageKey = "ChoreWidget.topChores"

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc(saveTopChores:)
  func saveTopChores(_ json: String) {
    let defaults = UserDefaults(suiteName: WidgetDataBridge.appGroupId)
    defaults?.set(json, forKey: WidgetDataBridge.storageKey)

    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
  }
}
