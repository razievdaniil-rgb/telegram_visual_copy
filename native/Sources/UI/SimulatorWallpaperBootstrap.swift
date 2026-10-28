import Foundation
import AccountContext
import TelegramCore

// Seed the original prepared-vector cache before any public chat creates a
// background node. Rendering and gradient animation remain upstream code.
enum SimulatorWallpaperBootstrap {
    static func seed(context: AccountContext) {
        guard TelegramSimulator.enabled,
              case let .file(file) = SimulatorWallpapers.standard(),
              let url = Bundle.main.url(forResource: "SimulatorDefaultPattern", withExtension: "bin"),
              let data = try? Data(contentsOf: url), data.count > 8 else { return }
        context.account.postbox.mediaBox.storeCachedResourceRepresentation(
            file.file.resource, representationId: "prepared-pattern-wallpaper",
            keepDuration: .general, data: data)
        context.sharedContext.accountManager.mediaBox.storeCachedResourceRepresentation(
            file.file.resource, representationId: "prepared-pattern-wallpaper",
            keepDuration: .general, data: data)
    }
}
