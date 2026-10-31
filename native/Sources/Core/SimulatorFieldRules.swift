// Local simulator additions. Telegram source remains in its own pinned checkout.
import Foundation

// The service editor writes straight into the document; there is no server to reject what
// it is given. These limits are Telegram's own, so a saved profile cannot describe a state
// the original interface is unable to display.
//
// The stored format is unchanged and `SimulatorDocument.validated()` stays as permissive as
// before: a document written before these rules existed still loads, and the editor trims
// it when the form opens rather than refusing to show it.
public enum SimulatorFieldRules {
    public enum Field {
        case firstName
        case lastName
        case username
        case phone
        case bio
        case messageText
    }

    public static func limit(_ field: Field) -> Int {
        switch field {
        case .firstName, .lastName: return 64
        case .username: return 32
        case .phone: return 20
        case .bio: return 70
        case .messageText: return 4096
        }
    }

    private static let usernameCharacters = Set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_")
    private static let phoneCharacters = Set("0123456789+-() ")

    // Applied on every keystroke and when a form opens, so pasted text cannot bypass it.
    public static func sanitize(_ text: String, for field: Field) -> String {
        let maximum = limit(field)
        var result = ""
        result.reserveCapacity(min(text.count, maximum))
        for character in text {
            switch field {
            case .username:
                guard usernameCharacters.contains(character) else { continue }
            case .phone:
                guard phoneCharacters.contains(character) else { continue }
            case .messageText:
                guard character.isNewline || !isControl(character) else { continue }
            case .firstName, .lastName, .bio:
                guard !character.isNewline, !isControl(character) else { continue }
            }
            result.append(character)
            if result.count >= maximum { break }
        }
        return result
    }

    // Reported next to the field that has to change, never as a silent refusal to save.
    public static func validate(_ profile: SimulatorProfile) -> String? {
        if profile.firstName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return "Укажите имя — без него профиль отображается как «Без имени»."
        }
        if let reason = length(profile.firstName, .firstName, "Имя") { return reason }
        if let reason = length(profile.lastName, .lastName, "Фамилия") { return reason }
        if !profile.username.isEmpty {
            if let reason = length(profile.username, .username, "Username") { return reason }
            if sanitize(profile.username, for: .username) != profile.username {
                return "Username: только латинские буквы, цифры и подчёркивание."
            }
            if let first = profile.username.first, !first.isLetter {
                return "Username должен начинаться с буквы."
            }
        }
        if !profile.phone.isEmpty {
            if let reason = length(profile.phone, .phone, "Телефон") { return reason }
            if sanitize(profile.phone, for: .phone) != profile.phone {
                return "Телефон: только цифры и символы + - ( )."
            }
            if !profile.phone.contains(where: { $0.isNumber }) {
                return "Телефон: нужна хотя бы одна цифра."
            }
        }
        if let reason = length(profile.bio, .bio, "О себе") { return reason }
        return nil
    }

    public static func validate(messageText: String) -> String? {
        if messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return "Введите текст сообщения."
        }
        return length(messageText, .messageText, "Текст сообщения")
    }

    // Telegram derives the unread badge from message IDs, so a counter larger than the
    // number of incoming messages would leave the read state inconsistent with the history.
    public static func clampUnread(_ value: Int, incomingMessages: Int) -> Int {
        return min(max(value, 0), max(incomingMessages, 0))
    }

    private static func length(_ value: String, _ field: Field, _ name: String) -> String? {
        guard value.count > limit(field) else { return nil }
        return "\(name): не больше \(limit(field)) символов, сейчас \(value.count)."
    }

    private static func isControl(_ character: Character) -> Bool {
        return character.unicodeScalars.contains { CharacterSet.controlCharacters.contains($0) }
    }
}
