import Foundation
import Postbox

// Native Telegram wallpaper models and renderer; only their offline data source differs.
public enum SimulatorWallpapers {
    public static func standard() -> TelegramWallpaper {
        let resource = CloudDocumentMediaResource(datacenterId: 4, fileId: 5789658100176783156, accessHash: 2106033778341319685, size: 183832, fileReference: Data(), fileName: "pattern.tgv")
        return .file(TelegramWallpaper.File(
            id: 5951821522514477057, accessHash: 542913527008942388,
            isCreator: false, isDefault: false, isPattern: true, isDark: false,
            slug: "fqv01SQemVIBAAAApND8LDRUhRU",
            file: TelegramMediaFile(
                fileId: MediaId(namespace: Namespaces.Media.CloudFile, id: 5789658100176783156), partialReference: nil, resource: resource,
                previewRepresentations: [TelegramMediaImageRepresentation(dimensions: PixelDimensions(width: 155, height: 320), resource: CloudDocumentSizeMediaResource(datacenterId: 1, documentId: 5789658100176783156, accessHash: 2106033778341319685, sizeSpec: "m", fileReference: Data()), progressiveSizes: [], immediateThumbnailData: nil, hasVideo: false, isPersonal: false)],
                videoThumbnails: [], immediateThumbnailData: nil, mimeType: "application/x-tgwallpattern", size: 183832,
                attributes: [.ImageSize(size: PixelDimensions(width: 1440, height: 2960)), .FileName(fileName: "pattern.tgv")], alternativeRepresentations: []),
            settings: WallpaperSettings(colors: [0xdbddbb, 0x6ba587, 0xd5d88d, 0x88b884], intensity: 50)
        ))
    }

    public static func catalog() -> [TelegramWallpaper] {
        let pattern = standard()
        return [pattern,
                pattern.withUpdatedSettings(WallpaperSettings(colors: [0xdbeafa, 0x8ab8df, 0xc5dcf4, 0x91b4d7], intensity: 50)),
                pattern.withUpdatedSettings(WallpaperSettings(colors: [0xe8d9f0, 0xb59ac8, 0xf0dbe9, 0xc9abcf], intensity: 50)),
                .color(0xffffff), .color(0xdde8f3),
                .gradient(TelegramWallpaper.Gradient(id: nil, colors: [0xc9e4f8, 0xe6d9f4], settings: WallpaperSettings()))]
    }

    public static func seedResources(account: Account) {
        guard case let .file(file) = standard() else { return }
        let mediaBox = account.postbox.mediaBox
        if mediaBox.completedResourcePath(id: file.file.resource.id) == nil,
           let url = Bundle.main.url(forResource: "SimulatorDefaultPattern", withExtension: "tgv"),
           let data = try? Data(contentsOf: url), !data.isEmpty {
            mediaBox.storeResourceData(file.file.resource.id, data: data, synchronous: true)
        }
        if let preview = file.file.previewRepresentations.first,
           mediaBox.completedResourcePath(id: preview.resource.id) == nil,
           let url = Bundle.main.url(forResource: "SimulatorDefaultPatternPreview", withExtension: "png"),
           let data = try? Data(contentsOf: url) {
            mediaBox.storeResourceData(preview.resource.id, data: data, synchronous: true)
        }
    }
}
