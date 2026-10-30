// Local simulator additions. Telegram source remains in its own pinned checkout.
import Foundation

// Startup instrumentation for the installed device build.
//
// An installed application starts without a debugger attached, so iOS applies the
// launch watchdog; a start that only takes too long is terminated and leaves the
// window's plain background with no report of its own. The Simulator applies no
// watchdog and runs on a far faster host, so neither the duration nor the
// termination can be observed there at all.
//
// Every stage is written through before the next one runs, so the file names the
// last stage a terminated start reached. It is kept under Documents, which
// `UIFileSharingEnabled` exposes through Files, so the record can be read off a
// phone without a Mac. Stage names are fixed strings: no message text, contact,
// phone number, token or key is recorded.
public final class SimulatorLaunchTrace {
    public static let shared = SimulatorLaunchTrace()

    private let lock = NSRecursiveLock()
    private let directory: URL
    private let currentURL: URL
    private let previousURL: URL
    private var startedAt: Date?
    private var lines: [String] = []
    private var previousText: String?
    private var completed = false

    private init() {
        self.directory = URL(fileURLWithPath: NSHomeDirectory(), isDirectory: true)
            .appendingPathComponent("Documents/TelegramSimulator", isDirectory: true)
        self.currentURL = self.directory.appendingPathComponent("launch-trace.txt")
        self.previousURL = self.directory.appendingPathComponent("launch-trace-previous.txt")
    }

    // Rotates the preceding record before the first stage of this start is written.
    public func begin(version: String, build: String) {
        guard TelegramSimulator.enabled else { return }
        self.lock.lock()
        defer { self.lock.unlock() }
        guard self.startedAt == nil else { return }
        if let data = try? Data(contentsOf: self.currentURL), let text = String(data: data, encoding: .utf8), !text.isEmpty {
            self.previousText = text
            let _ = try? FileManager.default.createDirectory(at: self.directory, withIntermediateDirectories: true)
            let _ = try? data.write(to: self.previousURL, options: .atomic)
        }
        self.startedAt = Date()
        self.lines = [
            "version \(version) build \(build)",
            "started \(SimulatorDocument.timestamp(Date()))"
        ]
        self.write()
    }

    public func mark(_ stage: String) {
        guard TelegramSimulator.enabled else { return }
        self.lock.lock()
        defer { self.lock.unlock() }
        // Stages that repeat during use (the projection runs again on every edit) must
        // not keep rewriting a record that is about the start only.
        guard let startedAt = self.startedAt, !self.completed, self.lines.count < stageLimit else { return }
        let elapsed = Int((Date().timeIntervalSince(startedAt) * 1000.0).rounded())
        let line = "\(elapsed) ms \(stage)"
        self.lines.append(line)
        self.write()
        NSLog("TelegramSimulator launch: %@", line)
    }

    // The sentinel that separates a completed start from a terminated one.
    public func finish() {
        self.mark(completionStage)
        self.lock.lock()
        self.completed = true
        self.lock.unlock()
    }

    public var report: String {
        self.lock.lock()
        defer { self.lock.unlock() }
        return self.lines.joined(separator: "\n")
    }

    // Non-nil only when the preceding start never reached its last stage, which is
    // the case this instrumentation exists for.
    public var previousIncompleteReport: String? {
        self.lock.lock()
        defer { self.lock.unlock() }
        guard let text = self.previousText, !text.isEmpty else { return nil }
        guard !text.contains(" \(completionStage)") else { return nil }
        return text
    }

    public var fileURL: URL {
        return self.currentURL
    }

    private func write() {
        let _ = try? FileManager.default.createDirectory(at: self.directory, withIntermediateDirectories: true)
        let text = self.lines.joined(separator: "\n") + "\n"
        let _ = try? Data(text.utf8).write(to: self.currentURL, options: .atomic)
    }
}

private let completionStage = "interface-visible"
private let stageLimit = 64
