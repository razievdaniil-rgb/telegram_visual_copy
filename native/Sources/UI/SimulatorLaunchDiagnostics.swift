import Foundation
import UIKit
import TelegramCore
import SwiftSignalKit

// Replaces the blank window background that a start which never installs the root
// controller would otherwise leave. It is attached only after the interface has
// failed to appear, and removes itself the moment the real interface is installed,
// so a working start never shows it. It reports stages, not a cause: a start that
// stops here still needs the recorded trace to be read.
final class SimulatorLaunchDiagnostics {
    // Long enough that a slow but succeeding start is never covered. A cold start of
    // the optimized build reaches the interface well inside this.
    private static let appearanceDelay: Double = 8.0
    private static let refreshInterval: Double = 2.0

    private let container: UIView
    private let isInterfaceVisible: () -> Bool
    private var view: UIView?
    private var label: UILabel?

    private init(container: UIView, isInterfaceVisible: @escaping () -> Bool) {
        self.container = container
        self.isInterfaceVisible = isInterfaceVisible
    }

    // Retained by its own scheduled work until the interface appears.
    static func watch(container: UIView, isInterfaceVisible: @escaping () -> Bool) {
        guard TelegramSimulator.enabled, TelegramSimulator.launchDiagnostics else { return }
        let diagnostics = SimulatorLaunchDiagnostics(container: container, isInterfaceVisible: isInterfaceVisible)
        Queue.mainQueue().after(SimulatorLaunchDiagnostics.appearanceDelay, {
            diagnostics.refresh()
        })
    }

    private func refresh() {
        if self.isInterfaceVisible() {
            self.view?.removeFromSuperview()
            self.view = nil
            self.label = nil
            return
        }
        if self.view == nil {
            self.present()
        }
        self.label?.text = self.text()
        self.label?.frame = self.textFrame()
        let retained = self
        Queue.mainQueue().after(SimulatorLaunchDiagnostics.refreshInterval, {
            retained.refresh()
        })
    }

    private func present() {
        let view = UIView(frame: self.container.bounds)
        view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.backgroundColor = UIColor.white
        let label = UILabel()
        label.numberOfLines = 0
        label.textColor = UIColor(white: 0.15, alpha: 1.0)
        label.font = UIFont.monospacedSystemFont(ofSize: 11.0, weight: .regular)
        view.addSubview(label)
        self.container.addSubview(view)
        self.view = view
        self.label = label
    }

    private func textFrame() -> CGRect {
        let insets = self.container.safeAreaInsets
        return CGRect(
            x: insets.left + 16.0,
            y: insets.top + 24.0,
            width: max(1.0, self.container.bounds.width - insets.left - insets.right - 32.0),
            height: max(1.0, self.container.bounds.height - insets.top - insets.bottom - 48.0)
        )
    }

    private func text() -> String {
        var result = "Интерфейс не открылся\n\n"
        result += "Этот экран заменяет пустой белый экран. Пришлите снимок разработчику.\n\n"
        result += "Этапы текущего запуска:\n"
        result += SimulatorLaunchTrace.shared.report
        if let previous = SimulatorLaunchTrace.shared.previousIncompleteReport {
            result += "\n\nПредыдущий запуск не дошёл до интерфейса:\n"
            result += previous
        }
        result += "\n\nПолный журнал: Файлы → На iPhone → Telegram →\nTelegramSimulator/launch-trace.txt"
        return result
    }
}
