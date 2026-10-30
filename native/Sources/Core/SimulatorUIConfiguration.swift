import Foundation

// Keep both settings-tab presentations in the same compiled application.
// The launch preference is for repeatable QA; the normal installation uses the default.
public enum SimulatorUIConfiguration {
    public static let defaultSettingsTabAvatar = false
    public static let settingsTabAvatarKey = "TelegramSimulator.settingsTabAvatar"

    // The local app has no extensions and must not require a paid App Groups entitlement.
    //
    // Upstream's container is an App Group container, whose root is meant to hold
    // "telegram-data" directly. The local fallback kept that shape but moved it into the
    // application's own data container, where the root is not the app's to extend: a
    // device reported `Sandbox: deny(1) file-write-create .../telegram-data`, the start
    // failed its write-ability check, and the database could not be opened. Documents and
    // Library are writable there, so the local container is Application Support, the
    // sanctioned place for data an app keeps for itself.
    public static let localContainerComponent = "Library/Application Support/LocalSimulator"

    public static func applicationContainer(appGroupURL: URL?, localMode: Bool, homeDirectory: String = NSHomeDirectory()) -> URL? {
        guard localMode else { return appGroupURL }
        return URL(fileURLWithPath: homeDirectory, isDirectory: true)
            .appendingPathComponent(localContainerComponent, isDirectory: true)
    }

    public static func usesSettingsTabAvatar(localMode: Bool, hasOtherAccounts: Bool, defaults: UserDefaults = .standard) -> Bool {
        guard localMode else { return hasOtherAccounts }
        guard defaults.object(forKey: settingsTabAvatarKey) != nil else { return defaultSettingsTabAvatar }
        return defaults.bool(forKey: settingsTabAvatarKey)
    }
}
