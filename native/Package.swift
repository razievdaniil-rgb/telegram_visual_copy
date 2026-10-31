// swift-tools-version: 6.0
import PackageDescription

// Portable domain tests. The iOS app itself is built by upstream Bazel, not SwiftPM.
let package = Package(
    name: "TelegramSimulatorModel",
    platforms: [.macOS(.v13), .iOS(.v15)],
    products: [.library(name: "SimulatorModel", targets: ["SimulatorModel"])],
    targets: [
        .target(name: "SimulatorModel", path: "Sources/Core", exclude: ["TelegramSimulator.swift", "SimulatorLocalization.swift", "SimulatorWallpapers.swift", "SimulatorLaunchTrace.swift"], sources: ["SimulatorDocument.swift", "SimulatorFieldRules.swift", "SimulatorUIConfiguration.swift"]),
        .testTarget(name: "SimulatorModelTests", dependencies: ["SimulatorModel"], path: "Tests")
    ],
    swiftLanguageModes: [.v5]
)
