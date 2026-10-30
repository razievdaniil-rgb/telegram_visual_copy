import Foundation
import XCTest
@testable import SimulatorModel

final class SimulatorUIConfigurationTests: XCTestCase {
    func testLocalContainerDoesNotRequireAppGroups() {
        let shared = URL(fileURLWithPath: "/shared/group", isDirectory: true)
        let home = "/private/test-home"
        // Not the data container's root: the sandbox refuses a new directory there.
        let local = home + "/" + SimulatorUIConfiguration.localContainerComponent
        XCTAssertEqual(SimulatorUIConfiguration.applicationContainer(appGroupURL: nil, localMode: true, homeDirectory: home)?.path, local)
        XCTAssertEqual(SimulatorUIConfiguration.applicationContainer(appGroupURL: shared, localMode: true, homeDirectory: home)?.path, local)
        XCTAssertTrue(local.hasPrefix(home + "/Library/"))
        XCTAssertEqual(SimulatorUIConfiguration.applicationContainer(appGroupURL: shared, localMode: false, homeDirectory: home), shared)
        XCTAssertNil(SimulatorUIConfiguration.applicationContainer(appGroupURL: nil, localMode: false, homeDirectory: home))
    }

    func testLocalAvatarDefaultAndExplicitGearFallback() {
        let suite = "SimulatorUIConfigurationTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suite)!
        defer { defaults.removePersistentDomain(forName: suite) }
        XCTAssertEqual(SimulatorUIConfiguration.usesSettingsTabAvatar(localMode: true, hasOtherAccounts: false, defaults: defaults), SimulatorUIConfiguration.defaultSettingsTabAvatar)
        defaults.set(false, forKey: SimulatorUIConfiguration.settingsTabAvatarKey)
        XCTAssertFalse(SimulatorUIConfiguration.usesSettingsTabAvatar(localMode: true, hasOtherAccounts: false, defaults: defaults))
        defaults.set(true, forKey: SimulatorUIConfiguration.settingsTabAvatarKey)
        XCTAssertTrue(SimulatorUIConfiguration.usesSettingsTabAvatar(localMode: true, hasOtherAccounts: false, defaults: defaults))
        defaults.set("NO", forKey: SimulatorUIConfiguration.settingsTabAvatarKey)
        XCTAssertFalse(SimulatorUIConfiguration.usesSettingsTabAvatar(localMode: true, hasOtherAccounts: false, defaults: defaults))
        defaults.set("YES", forKey: SimulatorUIConfiguration.settingsTabAvatarKey)
        XCTAssertTrue(SimulatorUIConfiguration.usesSettingsTabAvatar(localMode: true, hasOtherAccounts: false, defaults: defaults))
        // The local preference must never change upstream multi-account behavior.
        XCTAssertFalse(SimulatorUIConfiguration.usesSettingsTabAvatar(localMode: false, hasOtherAccounts: false, defaults: defaults))
        defaults.set(false, forKey: SimulatorUIConfiguration.settingsTabAvatarKey)
        XCTAssertTrue(SimulatorUIConfiguration.usesSettingsTabAvatar(localMode: false, hasOtherAccounts: true, defaults: defaults))
    }
}
