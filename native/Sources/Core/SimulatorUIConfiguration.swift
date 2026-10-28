import Foundation

// Keep both settings-tab presentations in the same compiled application.
// The launch preference is for repeatable QA; the normal installation uses the default.
public enum SimulatorUIConfiguration {
    public static let defaultSettingsTabAvatar = true
    public static let settingsTabAvatarKey = "TelegramSimulator.settingsTabAvatar"

    public static func usesSettingsTabAvatar(localMode: Bool, hasOtherAccounts: Bool, defaults: UserDefaults = .standard) -> Bool {
        guard localMode else { return hasOtherAccounts }
        guard defaults.object(forKey: settingsTabAvatarKey) != nil else { return defaultSettingsTabAvatar }
        return defaults.bool(forKey: settingsTabAvatarKey)
    }
}
