import Foundation
import Postbox
import SwiftSignalKit

// This checkout is a local simulator, not a second Telegram client.
// The switch is fixed at build time; there is no online/login mode in this target.
public enum TelegramSimulator {
    public static let enabled: Bool = true
    public static var ownerPeerId: PeerId { peerId("self") }
    public static func peerId(_ id: String) -> PeerId {
        return PeerId(namespace: Namespaces.Peer.CloudUser, id: PeerId.Id._internalFromInt64Value(SimulatorDocument.numericId(id)))
    }
    public static func messageId(_ message: SimulatorMessage, in document: SimulatorDocument) -> MessageId? {
        guard let chat = document.chats.first(where: { $0.id == message.chatId }) else { return nil }
        return MessageId(peerId: peerId(chat.profileId), namespace: Namespaces.Message.Cloud, id: SimulatorDocument.messageId(message.id))
    }
    public static func profile(_ profile: SimulatorProfile) -> TelegramUser {
        var photo: [TelegramMediaImageRepresentation] = []
        if let avatar = profile.avatar, let part = avatar.split(separator: ",", maxSplits: 1).last,
           let data = Data(base64Encoded: String(part)) {
            let resource = LocalFileMediaResource(fileId: SimulatorDocument.numericId(avatar), size: Int64(data.count))
            photo = [TelegramMediaImageRepresentation(dimensions: PixelDimensions(width: 640, height: 640), resource: resource, progressiveSizes: [], immediateThumbnailData: nil)]
        }
        return TelegramUser(id: peerId(profile.id), accessHash: .personal(0), firstName: profile.firstName, lastName: profile.lastName, username: profile.username.isEmpty ? nil : profile.username, phone: profile.phone, photo: photo, botInfo: nil, restrictionInfo: nil, flags: [], emojiStatus: nil, usernames: [], storiesHidden: true, nameColor: nil, backgroundEmojiId: nil, profileColor: nil, profileBackgroundEmojiId: nil, subscriberCount: nil, verificationIconFileId: nil)
    }
    public static func prepareAccount(_ manager: AccountManager<TelegramAccountManagerTypes>) -> Signal<Void, NoError> {
        return manager.transaction { transaction -> Void in
            // A separate bundle/container must be used. Never reuse an installed Telegram's data.
            if let record = transaction.getRecords().first {
                transaction.setCurrentId(record.id)
            } else {
                transaction.setCurrentId(transaction.createRecord([]))
            }
            transaction.removeAuth()
        }
    }
    public static func initialize(transaction: Transaction) {
        let document = TelegramSimulatorWorkspace.shared.snapshot()
        transaction.setState(AuthorizedAccountState(isTestingEnvironment: false, masterDatacenterId: 2, peerId: ownerPeerId, state: AuthorizedAccountState.State(pts: 0, qts: 0, date: 1, seq: 0), invalidatedChannels: []))
        transaction.updatePeersInternal([profile(document.owner)], update: { _, next in next })
    }
    public static func project(account: Account) -> Signal<Void, NoError> {
        let document = TelegramSimulatorWorkspace.shared.snapshot()
        for profile in [document.owner] + document.profiles {
            if let avatar = profile.avatar, let part = avatar.split(separator: ",", maxSplits: 1).last, let data = Data(base64Encoded: String(part)) {
                account.postbox.mediaBox.storeResourceData(LocalFileMediaResource(fileId: SimulatorDocument.numericId(avatar)).id, data: data, synchronous: true)
            }
        }
        return account.postbox.transaction { transaction -> Void in
            let previousContacts = transaction.getContactPeerIds()
            let currentContacts = Set(document.profiles.map { peerId($0.id) })
            let previousInclusions = Dictionary(uniqueKeysWithValues: previousContacts.map { ($0, transaction.getPeerChatListInclusion($0)) })
            // Remove old projection, including deleted profiles/chats, inside the same transaction.
            for id in previousContacts.union(currentContacts) {
                transaction.deleteMessagesInRange(peerId: id, namespace: Namespaces.Message.Cloud, minId: 1, maxId: Int32.max - 1, forEachMedia: nil)
                transaction.updatePeerChatListInclusion(id, inclusion: .notIncluded)
                transaction.removeHole(peerId: id, threadId: nil, namespace: Namespaces.Message.Cloud, space: .everywhere, range: 1 ... (Int32.max - 1))
            }
            for group in [PeerGroupId.root, Namespaces.PeerGroup.archive] {
                for hole in transaction.allChatListHoles(groupId: group) {
                    transaction.replaceChatListHole(groupId: group, index: hole.index, hole: nil)
                }
            }
            let people = [document.owner] + document.profiles
            transaction.updatePeersInternal(people.map(profile), update: { _, next in next })
            transaction.replaceContactPeerIds(currentContacts)
            for person in people {
                transaction.updatePeerCachedData(peerIds: Set([peerId(person.id)]), update: { _, _ in CachedUserData().withUpdatedAbout(person.bio) })
            }
            for chat in document.chats {
                let id = peerId(chat.profileId)
                let presence: UserPresenceStatus = chat.presence == .recently ? .recently(isHidden: false) : .present(until: Int32.max)
                transaction.updatePeerPresencesInternal(presences: [id: TelegramUserPresence(status: presence, lastActivity: 0)], merge: { _, next in next })
                let existing = previousInclusions[id] ?? .notIncluded
                let inclusion: PeerChatListInclusion = existing.groupId != nil ? existing : .ifHasMessagesOrOneOf(groupId: .root, pinningIndex: nil, minTimestamp: Int32(clamping: Int64(SimulatorDocument.date(chat.createdAt)?.timeIntervalSince1970 ?? 1)))
                transaction.updatePeerChatListInclusion(id, inclusion: inclusion)
                let messages = document.messages.filter { $0.chatId == chat.id }.sorted {
                    if $0.sentAt == $1.sentAt { return $0.id < $1.id }
                    return (SimulatorDocument.date($0.sentAt) ?? .distantPast) < (SimulatorDocument.date($1.sentAt) ?? .distantPast)
                }
                let stored: [StoreMessage] = messages.compactMap { message in
                    guard let messageId = messageId(message, in: document), let date = SimulatorDocument.date(message.sentAt) else { return nil }
                    let attributes: [MessageAttribute] = message.edited ? [EditedMessageAttribute(date: Int32(date.timeIntervalSince1970), isHidden: false)] : []
                    return StoreMessage(id: messageId, customStableId: nil, globallyUniqueId: nil, groupingKey: nil, threadId: nil, timestamp: Int32(date.timeIntervalSince1970), flags: message.direction == .incoming ? [.Incoming] : [], tags: [], globalTags: [], localTags: [], forwardInfo: nil, authorId: message.direction == .incoming ? id : ownerPeerId, text: message.text, attributes: attributes, media: [])
                }
                let _ = transaction.addMessages(stored, location: .Random)
                let maxId = messages.map { SimulatorDocument.messageId($0.id) }.max() ?? 0
                let maxRead = messages.filter { $0.direction == .outgoing && $0.receipt == .read }.map { SimulatorDocument.messageId($0.id) }.max() ?? 0
                transaction.resetIncomingReadStates([id: [Namespaces.Message.Cloud: .idBased(maxIncomingReadId: 0, maxOutgoingReadId: maxRead, maxKnownId: maxId, count: Int32(chat.unread), markedUnread: chat.unread > 0)]])
            }
        }
    }
    public static func send(account: Account, peerId: PeerId, messages: [EnqueueMessage]) -> Signal<[MessageId?], NoError> {
        var added: [SimulatorMessage] = []
        do {
            try TelegramSimulatorWorkspace.shared.change { document in
                guard let chat = document.chats.first(where: { self.peerId($0.profileId) == peerId }) else { throw SimulatorDataError.invalid("Создайте личный чат в редакторе") }
                for message in messages {
                    guard case let .message(text, _, _, media, _, _, _, _, _, _) = message, media == nil, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw SimulatorDataError.invalid("Симулятор поддерживает только текстовые сообщения") }
                    let local = SimulatorMessage(chatId: chat.id, text: text, receipt: .sent)
                    document.messages.append(local); added.append(local)
                }
            }
        } catch {
            TelegramSimulatorWorkspace.shared.report(error)
            return .single([])
        }
        let document = TelegramSimulatorWorkspace.shared.snapshot()
        return project(account: account) |> map { added.map { messageId($0, in: document) } }
    }
    public static func edit(account: Account, id: MessageId, text: String) -> Signal<RequestEditMessageResult, RequestEditMessageError> {
        do {
            try TelegramSimulatorWorkspace.shared.change { document in
                guard let index = document.messages.firstIndex(where: { messageId($0, in: document) == id }), document.messages[index].direction == .outgoing else { throw SimulatorDataError.invalid("Недоступно") }
                document.messages[index].text = text; document.messages[index].edited = true
            }
        } catch {
            TelegramSimulatorWorkspace.shared.report(error)
            return .fail(.generic)
        }
        return project(account: account) |> castError(RequestEditMessageError.self) |> map { .done(true) }
    }
    public static func delete(account: Account, ids: [MessageId]) -> Signal<Void, NoError> {
        do {
            try TelegramSimulatorWorkspace.shared.change { document in
                let original = document
                document.messages.removeAll { message in messageId(message, in: original).map { ids.contains($0) } ?? false }
            }
        } catch {
            TelegramSimulatorWorkspace.shared.report(error)
            return .complete()
        }
        return project(account: account)
    }
    public static func receipt(for id: MessageId) -> Bool? {
        let document = TelegramSimulatorWorkspace.shared.snapshot()
        return document.messages.first(where: { messageId($0, in: document) == id }).map { $0.receipt == .read }
    }
    public static func isTyping(peerId: PeerId) -> Bool {
        return TelegramSimulatorWorkspace.shared.snapshot().chats.contains { self.peerId($0.profileId) == peerId && $0.presence == .typing }
    }
    public static func markRead(peerId: PeerId) {
        let workspace = TelegramSimulatorWorkspace.shared
        guard workspace.snapshot().chats.contains(where: { self.peerId($0.profileId) == peerId && $0.unread > 0 }) else { return }
        do {
            try workspace.change { document in
                if let index = document.chats.firstIndex(where: { self.peerId($0.profileId) == peerId }) { document.chats[index].unread = 0 }
            }
        } catch { workspace.report(error) }
    }
}

public final class TelegramSimulatorWorkspace {
    public static let shared = TelegramSimulatorWorkspace()
    private let lock = NSRecursiveLock()
    private var repository: SimulatorRepository?
    public private(set) var loadError: String?
    public let fileURL: URL
    public let changed = ValuePromise<Int>(0, ignoreRepeated: false)
    private let errorPipe = ValuePipe<String>()
    public var errors: Signal<String, NoError> { errorPipe.signal() }
    public func report(_ error: Error) { errorPipe.putNext(error.localizedDescription) }
    private init() {
        fileURL = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("TelegramSimulator/document-v1.json")
        do { repository = try SimulatorRepository(url: fileURL) }
        catch { loadError = error.localizedDescription }
    }
    public func snapshot() -> SimulatorDocument {
        lock.lock(); defer { lock.unlock() }
        return repository?.snapshot() ?? SimulatorDocument()
    }
    public func change(_ update: (inout SimulatorDocument) throws -> Void) throws {
        lock.lock(); defer { lock.unlock() }
        guard let repository = repository else { throw SimulatorDataError.invalid(loadError ?? "Хранилище недоступно") }
        try repository.change(update)
        changed.set(0)
    }
    public func restore(_ data: Data) throws {
        lock.lock(); defer { lock.unlock() }
        let document = try SimulatorDocument.decode(data)
        // The editor explicitly confirms replacement. Back up the old bytes even if corrupt.
        if FileManager.default.fileExists(atPath: fileURL.path) {
            let backup = fileURL.deletingLastPathComponent().appendingPathComponent("before-import-\(UUID().uuidString).json")
            try FileManager.default.copyItem(at: fileURL, to: backup)
        }
        try FileManager.default.createDirectory(at: fileURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try document.encoded().write(to: fileURL, options: .atomic)
        repository = try SimulatorRepository(url: fileURL); loadError = nil
        changed.set(0)
    }
}
