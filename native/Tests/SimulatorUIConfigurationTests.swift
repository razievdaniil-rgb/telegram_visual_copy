import Foundation
import XCTest
@testable import SimulatorModel

final class SimulatorUIConfigurationTests: XCTestCase {
    func testLocalAvatarDefaultAndExplicitGearFallback() {
        let suite = "SimulatorUIConfigurationTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suite)!
        defer { defaults.removePersistentDomain(forName: suite) }
        XCTAssertEqual(SimulatorUIConfiguration.usesSettingsTabAvatar(localMode: true, hasOtherAccounts: false, defaults: defaults), SimulatorUIConfiguration.defaultSettingsTabAvatar)
        defaults.set(false, forKey: SimulatorUIConfiguration.settingsTabAvatarKey)
        XCTAssertFalse(SimulatorUIConfiguration.usesSettingsTabAvatar(localMode: true, hasOtherAccounts: false, defaults: defaults))
        defaults.set(true, forKey: SimulatorUIConfiguration.settingsTabAvatarKey)
        XCTAssertTrue(SimulatorUIConfiguration.usesSettingsTabAvatar(localMode: true, hasOtherAccounts: false, defaults: defaults))
        // The local preference must never change upstream multi-account behavior.
        XCTAssertFalse(SimulatorUIConfiguration.usesSettingsTabAvatar(localMode: false, hasOtherAccounts: false, defaults: defaults))
        defaults.set(false, forKey: SimulatorUIConfiguration.settingsTabAvatarKey)
        XCTAssertTrue(SimulatorUIConfiguration.usesSettingsTabAvatar(localMode: false, hasOtherAccounts: true, defaults: defaults))
    }
}
