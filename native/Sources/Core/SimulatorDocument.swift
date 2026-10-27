// Local simulator additions. Telegram source remains in its own pinned checkout.
import Foundation

public enum SimulatorDirection: String, Codable { case incoming, outgoing }
public enum SimulatorReceipt: String, Codable { case sent, read }
public enum SimulatorPresence: String, Codable { case online, recently, typing }

public struct SimulatorProfile: Codable, Equatable {
    public var id: String
    public var firstName: String
    public var lastName: String
    public var username: String
    public var phone: String
    public var bio: String
    public var avatar: String?
    public var color: String
    enum CodingKeys: String, CodingKey { case id, firstName, lastName, username, phone, bio, avatar, color }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(firstName, forKey: .firstName)
        try container.encode(lastName, forKey: .lastName)
        try container.encode(username, forKey: .username)
        try container.encode(phone, forKey: .phone)
        try container.encode(bio, forKey: .bio)
        try container.encode(color, forKey: .color)
        // The version-1 web decoder requires an explicit null, not an omitted key.
        if let avatar = avatar { try container.encode(avatar, forKey: .avatar) }
        else { try container.encodeNil(forKey: .avatar) }
    }

    public init(id: String = UUID().uuidString, firstName: String = "", lastName: String = "", username: String = "", phone: String = "", bio: String = "", avatar: String? = nil, color: String = "#5F9BE5") {
        self.id = id; self.firstName = firstName; self.lastName = lastName
        self.username = username; self.phone = phone; self.bio = bio
        self.avatar = avatar; self.color = color
    }
    public var displayName: String {
        let value = "\(firstName) \(lastName)".trimmingCharacters(in: .whitespacesAndNewlines)
        return value.isEmpty ? "Без имени" : value
    }
}

public struct SimulatorChat: Codable, Equatable {
    public var id: String
    public var profileId: String
    public var presence: SimulatorPresence
    public var unread: Int
    public var createdAt: String

    public init(id: String = UUID().uuidString, profileId: String, presence: SimulatorPresence = .recently, unread: Int = 0, createdAt: String = SimulatorDocument.timestamp(Date())) {
        self.id = id; self.profileId = profileId; self.presence = presence
        self.unread = unread; self.createdAt = createdAt
    }
}

public struct SimulatorMessage: Codable, Equatable {
    public var id: String
    public var chatId: String
    public var text: String
    public var direction: SimulatorDirection
    public var sentAt: String
    public var receipt: SimulatorReceipt
    public var edited: Bool

    public init(id: String = UUID().uuidString, chatId: String, text: String, direction: SimulatorDirection = .outgoing, sentAt: String = SimulatorDocument.timestamp(Date()), receipt: SimulatorReceipt = .read, edited: Bool = false) {
        self.id = id; self.chatId = chatId; self.text = text; self.direction = direction
        self.sentAt = sentAt; self.receipt = receipt; self.edited = edited
    }
}

public enum SimulatorDataError: LocalizedError {
    case invalid(String)
    public var errorDescription: String? {
        switch self { case let .invalid(reason): return reason }
    }
}

public struct SimulatorDocument: Codable, Equatable {
    public var version: Int = 1
    public var owner: SimulatorProfile
    public var profiles: [SimulatorProfile] = []
    public var chats: [SimulatorChat] = []
    public var messages: [SimulatorMessage] = []
    enum CodingKeys: String, CodingKey { case version, owner = "self", profiles, chats, messages }

    public init() { owner = SimulatorProfile(id: "self", firstName: "Мой профиль") }

    public static func timestamp(_ date: Date) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.string(from: date)
    }
    public static func date(_ value: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: value) { return date }
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: value)
    }
    // Stable across launches, Swift versions and architectures (unlike Hasher).
    public static func numericId(_ value: String) -> Int64 {
        var hash: UInt64 = 14695981039346656037
        for byte in value.utf8 { hash = (hash ^ UInt64(byte)) &* 1099511628211 }
        return Int64(hash & 0x0000ffffffffffff) + 1
    }
    public static func messageId(_ value: String) -> Int32 {
        return Int32(numericId(value) % Int64(Int32.max - 1)) + 1
    }
    // Cloud message IDs must increase with timeline order. Hashes are suitable
    // for stable identity, but Telegram history/read-state code orders by ID.
    // This derived mapping leaves the saved version-1 document unchanged.
    public func timelineIds() -> [String: Int32] {
        var result: [String: Int32] = [:]
        for chat in chats {
            let ordered = messages.filter { $0.chatId == chat.id }.map {
                (message: $0, date: Self.date($0.sentAt) ?? .distantPast)
            }.sorted {
                $0.date == $1.date ? $0.message.id < $1.message.id : $0.date < $1.date
            }
            for (index, entry) in ordered.enumerated() {
                result[entry.message.id] = Int32(clamping: index + 1)
            }
        }
        return result
    }
    public func validated() throws -> SimulatorDocument {
        func require(_ condition: Bool, _ reason: String) throws {
            if !condition { throw SimulatorDataError.invalid(reason) }
        }
        try require(version == 1 && owner.id == "self", "Неподдерживаемая версия документа")
        try require(Set(profiles.map(\.id)).count == profiles.count, "Повторяющиеся профили")
        try require(profiles.allSatisfy { !$0.id.isEmpty && $0.id != owner.id }, "Некорректный ID профиля")
        let people = [owner] + profiles
        try require(Set(people.map { Self.numericId($0.id) }).count == people.count, "Коллизия ID профиля")
        for profile in people {
            if let avatar = profile.avatar {
                let parts = avatar.components(separatedBy: ",")
                try require(parts.count == 2 && parts[0].hasPrefix("data:image/") && parts[0].hasSuffix(";base64") && Data(base64Encoded: parts[1]) != nil, "Аватар должен быть встроенным изображением")
            }
        }
        try require(Set(chats.map(\.id)).count == chats.count && Set(chats.map(\.profileId)).count == chats.count, "Для собеседника допускается один личный чат")
        for chat in chats {
            try require(!chat.id.isEmpty && profiles.contains { $0.id == chat.profileId }, "Чат ссылается на отсутствующий профиль")
            try require(chat.unread >= 0 && chat.unread <= Int(Int32.max) && Self.date(chat.createdAt) != nil, "Некорректные параметры чата")
        }
        try require(Set(messages.map(\.id)).count == messages.count, "Повторяющиеся сообщения")
        for message in messages {
            try require(!message.id.isEmpty && chats.contains { $0.id == message.chatId }, "Сообщение ссылается на отсутствующий чат")
            try require(!message.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, "Пустой текст сообщения")
            guard let date = Self.date(message.sentAt) else { throw SimulatorDataError.invalid("Неверная дата сообщения") }
            // Telegram stores timestamps in signed 32-bit seconds.
            try require(date.timeIntervalSince1970 >= 1 && date.timeIntervalSince1970 < Double(Int32.max), "Дата выходит за диапазон Telegram: 1970–2038")
        }
        for chat in chats {
            let ids = messages.filter { $0.chatId == chat.id }.map { Self.messageId($0.id) }
            try require(Set(ids).count == ids.count, "Коллизия ID сообщения")
        }
        return self
    }
    public static func decode(_ data: Data) throws -> SimulatorDocument {
        // Also accepts the existing web backup envelope; UI preferences remain web-specific.
        if let envelope = try JSONSerialization.jsonObject(with: data) as? [String: Any],
           envelope["kind"] as? String == "telegram-simulator-backup" {
            guard envelope["version"] as? Int == 1, let document = envelope["document"] else {
                throw SimulatorDataError.invalid("Неподдерживаемая резервная копия")
            }
            return try JSONDecoder().decode(Self.self, from: JSONSerialization.data(withJSONObject: document)).validated()
        }
        return try JSONDecoder().decode(Self.self, from: data).validated()
    }
    public func encoded() throws -> Data {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
        return try encoder.encode(try validated())
    }
}

// One authority: JSON is committed atomically before its Postbox projection is updated.
// A failed write leaves both the in-memory document and the previous file intact.
public final class SimulatorRepository {
    private let lock = NSRecursiveLock()
    private let url: URL
    private var document: SimulatorDocument
    public init(url: URL) throws {
        self.url = url
        if FileManager.default.fileExists(atPath: url.path) {
            document = try SimulatorDocument.decode(Data(contentsOf: url))
        } else { document = SimulatorDocument() }
    }
    public func snapshot() -> SimulatorDocument {
        lock.lock(); defer { lock.unlock() }
        return document
    }
    @discardableResult public func change(_ update: (inout SimulatorDocument) throws -> Void) throws -> SimulatorDocument {
        lock.lock(); defer { lock.unlock() }
        var next = document
        try update(&next)
        let data = try next.encoded()
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try data.write(to: url, options: .atomic)
        document = next
        return next
    }
    @discardableResult public func restore(_ data: Data) throws -> SimulatorDocument {
        let next = try SimulatorDocument.decode(data)
        return try change { $0 = next }
    }
}
