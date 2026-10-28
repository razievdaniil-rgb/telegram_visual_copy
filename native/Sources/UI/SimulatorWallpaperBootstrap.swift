import Foundation
import AccountContext
import TelegramCore
import MediaResources

// Seed the original prepared-vector cache before any public chat creates a
// background node. Rendering and gradient animation remain upstream code.
enum SimulatorWallpaperBootstrap {
    static func seed(context: AccountContext) {
        guard TelegramSimulator.enabled,
              case let .file(file) = SimulatorWallpapers.standard(),
              let url = Bundle.main.url(forResource: "SimulatorDefaultPattern", withExtension: "bin"),
              let data = try? Data(contentsOf: url), data.count > 8 else { return }
        let representation = CachedPreparedPatternWallpaperRepresentation()
        context.engine.resources.storeCachedRepresentation(
            resource: EngineMediaResource(file.file.resource), representation: representation, data: data)
        context.sharedContext.accountManager.mediaBox.storeCachedResourceRepresentation(
            file.file.resource, representation: representation, data: data)
    }
}
