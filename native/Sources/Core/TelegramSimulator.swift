import Foundation
import Postbox
import SwiftSignalKit

// This checkout is a local simulator, not a second Telegram client.
// The switch is fixed at build time; there is no online/login mode in this target.
public enum TelegramSimulator {
    public static let enabled: Bool = true

    // Startup instrumentation: the stage record and the screen that replaces a blank
    // window when the interface never appears. Both exist for diagnosing a start that
    // fails on a device, and both are deviations from the original — the screen is not
    // Telegram's, and reading the record off a phone needs `UIFileSharingEnabled`.
    // Build 17 started on a physical iPhone, so the client build keeps neither.
    // Turning this on again also means restoring the `Telegram/BUILD` plist change.
    public static let launchDiagnostics: Bool = false
    public static var ownerPeerId: PeerId { peerId("self") }
    public static func peerId(_ id: String) -> PeerId {
        return PeerId(namespace: Namespaces.Peer.CloudUser, id: PeerId.Id._internalFromInt64Value(SimulatorDocument.numericId(id)))
    }
    // Both places that draw a story circle ask this, so one switch moves both.
    public static func hasStory(_ peerId: PeerId) -> Bool {
        let document = TelegramSimulatorWorkspace.shared.snapshot()
        if peerId == ownerPeerId { return document.owner.hasStory }
        return document.profiles.contains { self.peerId($0.id) == peerId && $0.hasStory }
    }
    // Feed the original header component, without a Telegram service or story media.
    // These circles preview local virtual profiles; opening/publishing is guarded in UI.
    //
    // A story is something a person either has or does not, so it is a stored field rather
    // than a consequence of existing: a contact is listed here only while their own switch
    // is on. With no story anywhere the original hides the whole strip by itself, which is
    // what it does online when nobody has posted.
    public static func storySubscriptions(isHidden: Bool) -> Signal<EngineStorySubscriptions, NoError> {
        return TelegramSimulatorWorkspace.shared.changed.get() |> map { _ in
            let document = TelegramSimulatorWorkspace.shared.snapshot()
            func item(_ person: SimulatorProfile, count: Int) -> EngineStorySubscriptions.Item {
                return EngineStorySubscriptions.Item(peer: EnginePeer(profile(person)), hasUnseen: count > 0, hasUnseenCloseFriends: false, hasLiveItems: false, hasPending: false, storyCount: count, unseenCount: count, lastTimestamp: 1)
            }
            let owner = item(document.owner, count: document.owner.hasStory ? 1 : 0)
            let others = document.profiles.filter { $0.hasStory }.map { item($0, count: 1) }
            return EngineStorySubscriptions(accountItem: isHidden ? nil : owner, items: isHidden ? [] : others, hasMoreToken: nil)
        }
    }
    private static let menuDefaultsKey = "TelegramSimulator.menuDefaults.v1"
    private static func configureMenu(transaction: Transaction) {
        // Preserve folders subsequently changed through Telegram's own settings.
        transaction.updatePreferencesEntry(key: PreferencesKeys.chatListFilters, { entry in
            var state = entry?.get(ChatListFiltersState.self) ?? ChatListFiltersState.default
            if state.filters.isEmpty {
                let folders: [(Int32, String, ChatListFilterPeerCategories)] = [(2, "Группы", .groups), (3, "WORK", [.contacts, .nonContacts]), (4, "Боты", .bots)]
                state.filters = [.allChats] + folders.map { id, title, categories in
                    .filter(id: id, title: ChatFolderTitle(text: title, entities: [], enableAnimations: false), emoticon: nil, data: ChatListFilterData(isShared: false, hasSharedLinks: false, categories: categories, excludeMuted: false, excludeRead: false, excludeArchived: true, includePeers: ChatListFilterIncludePeers(), excludePeers: [], color: nil))
                }
            }
            return PreferencesEntry(state)
        })
    }
    public static func messageId(_ message: SimulatorMessage, in document: SimulatorDocument) -> MessageId? {
        return resolveMessageId(message, in: document, timeline: document.timelineIds())
    }
    private static func resolveMessageId(_ message: SimulatorMessage, in document: SimulatorDocument, timeline: [String: Int32]) -> MessageId? {
        guard let chat = document.chats.first(where: { $0.id == message.chatId }) else { return nil }
        guard let id = timeline[message.id] else { return nil }
        return MessageId(peerId: peerId(chat.profileId), namespace: Namespaces.Message.Cloud, id: id)
    }
    public static func profile(_ profile: SimulatorProfile) -> TelegramUser {
        var photo: [TelegramMediaImageRepresentation] = []
        if let avatar = profile.avatar, let part = avatar.split(separator: ",", maxSplits: 1).last,
           let data = Data(base64Encoded: String(part)) {
            let resource = LocalFileMediaResource(fileId: SimulatorDocument.numericId(avatar), size: Int64(data.count))
            photo = [TelegramMediaImageRepresentation(dimensions: PixelDimensions(width: 640, height: 640), resource: resource, progressiveSizes: [], immediateThumbnailData: nil)]
        }
        // Telegram's API never sends an empty string for a field a user has not filled in:
        // it omits it, and every original screen is written against that. A present-but-empty
        // name or phone is a shape the profile card never receives online, and it made the
        // card crash on a device. Absent is absent here too.
        func stated(_ value: String) -> String? { value.isEmpty ? nil : value }
        return TelegramUser(id: peerId(profile.id), accessHash: .personal(0), firstName: stated(profile.firstName), lastName: stated(profile.lastName), username: stated(profile.username), phone: stated(profile.phone), photo: photo, botInfo: nil, restrictionInfo: nil, flags: [], emojiStatus: nil, usernames: [], storiesHidden: true, nameColor: nil, backgroundEmojiId: nil, profileColor: nil, profileBackgroundEmojiId: nil, subscriberCount: nil, verificationIconFileId: nil)
    }
    public static func prepareAccount(_ manager: AccountManager<TelegramAccountManagerTypes>) -> Signal<Void, NoError> {
        SimulatorLaunchTrace.shared.mark("prepare-account")
        return manager.transaction { transaction -> Void in
            transaction.updateSharedData(SharedDataKeys.localizationSettings, { current in
                // Telegram normally downloads Russian after login; this app is offline.
                current ?? PreferencesEntry(SimulatorLocalization.russian())
            })
            // A separate bundle/container must be used. Never reuse an installed Telegram's data.
            if let record = transaction.getRecords().first {
                transaction.setCurrentId(record.id)
            } else {
                transaction.setCurrentId(transaction.createRecord([]))
            }
            transaction.removeAuth()
        } |> afterNext { _ in
            SimulatorLaunchTrace.shared.mark("account-record")
        }
    }
    public static func initialize(transaction: Transaction) {
        SimulatorLaunchTrace.shared.mark("account-state")
        let document = TelegramSimulatorWorkspace.shared.snapshot()
        transaction.setState(AuthorizedAccountState(isTestingEnvironment: false, masterDatacenterId: 2, peerId: ownerPeerId, state: AuthorizedAccountState.State(pts: 0, qts: 0, date: 1, seq: 0), invalidatedChannels: []))
        transaction.updatePeersInternal([profile(document.owner)], update: { _, next in next })
    }
    public static func project(account: Account, outgoingInfo: [String: OutgoingMessageInfoAttribute] = [:]) -> Signal<Void, NoError> {
        SimulatorLaunchTrace.shared.mark("projection")
        SimulatorWallpapers.seedResources(account: account)
        let indexed = TelegramSimulatorWorkspace.shared.indexedSnapshot()
        let document = indexed.document
        let timelineIds = indexed.timeline
        let configureMenu = !UserDefaults.standard.bool(forKey: menuDefaultsKey)
        for profile in [document.owner] + document.profiles {
            if let avatar = profile.avatar, let part = avatar.split(separator: ",", maxSplits: 1).last, let data = Data(base64Encoded: String(part)) {
                account.postbox.mediaBox.storeResourceData(LocalFileMediaResource(fileId: SimulatorDocument.numericId(avatar)).id, data: data, synchronous: true)
            }
        }
        return account.postbox.transaction { transaction -> Void in
            if configureMenu { self.configureMenu(transaction: transaction) }
            let previousContacts = transaction.getContactPeerIds()
            let currentContacts = Set(document.profiles.map { peerId($0.id) })
            let previousInclusions = Dictionary(uniqueKeysWithValues: previousContacts.map { ($0, transaction.getPeerChatListInclusion($0)) })
            // Preserve message rows/stable IDs during edits and sends so the original
            // list transition animates only the changed content, not the entire history.
            let wantedMessages = Dictionary(uniqueKeysWithValues: document.messages.compactMap { message -> (MessageId, UInt32)? in
                guard let chat = document.chats.first(where: { $0.id == message.chatId }), let id = timelineIds[message.id] else { return nil }
                return (MessageId(peerId: peerId(chat.profileId), namespace: Namespaces.Message.Cloud, id: id), UInt32(SimulatorDocument.messageId(message.id)))
            })
            let wantedChats = Set(document.chats.map { peerId($0.profileId) })
            for id in previousContacts.union(currentContacts) {
                var from = MessageIndex.upperBound(peerId: id, namespace: Namespaces.Message.Cloud)
                let to = MessageIndex.lowerBound(peerId: id, namespace: Namespaces.Message.Cloud)
                var obsolete: [MessageId] = []
                while true {
                    let batch = transaction.getMessages(peerId: id, namespace: Namespaces.Message.Cloud, from: from, includeFrom: false, to: to, limit: 100)
                    obsolete.append(contentsOf: batch.filter { wantedMessages[$0.id] != $0.stableId }.map(\.id))
                    guard let oldest = batch.min(by: { $0.index < $1.index }) else { break }
                    from = oldest.index
                }
                transaction.deleteMessages(obsolete, forEachMedia: nil)
                if !wantedChats.contains(id) {
                    transaction.updatePeerChatListInclusion(id, inclusion: .notIncluded)
                }
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
                transaction.updatePeerCachedData(peerIds: Set([peerId(person.id)]), update: { _, current in
                    // Original ChatHistoryView waits for BusinessIntro to become known.
                    // Local profiles have no business intro; never wait for a server response.
                    // An unfilled "about" is absent, not empty, for the same reason as the name.
                    var cached = (current as? CachedUserData ?? CachedUserData())
                        .withUpdatedAbout(person.bio.isEmpty ? nil : person.bio)
                        .withUpdatedBusinessIntro(nil)
                    if let stored = person.birthday, let parts = SimulatorDocument.birthday(stored) {
                        cached = cached.withUpdatedBirthday(TelegramBirthday(day: parts.day, month: parts.month, year: parts.year))
                    } else {
                        cached = cached.withUpdatedBirthday(nil)
                    }
                    return cached
                })
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
                    guard let localId = timelineIds[message.id], let date = SimulatorDocument.date(message.sentAt) else { return nil }
                    let messageId = MessageId(peerId: id, namespace: Namespaces.Message.Cloud, id: localId)
                    var attributes: [MessageAttribute] = message.edited ? [EditedMessageAttribute(date: Int32(date.timeIntervalSince1970), isHidden: false)] : []
                    // The original bubble draws its reply block from this attribute and finds
                    // the quoted message through Postbox's associated messages, both of which
                    // live in this same peer. A reply to a removed message simply loses it.
                    if let replyToId = message.replyToId, replyToId != message.id,
                       let replyLocalId = timelineIds[replyToId],
                       messages.contains(where: { $0.id == replyToId }) {
                        attributes.append(ReplyMessageAttribute(messageId: MessageId(peerId: id, namespace: Namespaces.Message.Cloud, id: replyLocalId), threadMessageId: nil, quote: nil, isQuote: false, innerSubject: nil))
                    }
                    if message.direction == .outgoing {
                        // The original history transition waits for this correlation ID
                        // before animating the new bubble and clearing the composer.
                        let previousInfo = transaction.getMessage(messageId)?.attributes.compactMap { $0 as? OutgoingMessageInfoAttribute }.first
                        if let info = outgoingInfo[message.id] ?? previousInfo {
                            attributes.append(info)
                        }
                    }
                    return StoreMessage(id: messageId, customStableId: UInt32(SimulatorDocument.messageId(message.id)), globallyUniqueId: nil, groupingKey: nil, threadId: nil, timestamp: Int32(date.timeIntervalSince1970), flags: message.direction == .incoming ? [.Incoming] : [], tags: [], globalTags: [], localTags: [], forwardInfo: nil, authorId: message.direction == .incoming ? id : ownerPeerId, text: message.text, attributes: attributes, media: [])
                }
                var added: [StoreMessage] = []
                for message in stored {
                    guard case let .Id(messageId) = message.id else { continue }
                    if transaction.messageExists(id: messageId) {
                        transaction.updateMessage(messageId, update: { _ in .update(message) })
                    } else {
                        added.append(message)
                    }
                }
                let _ = transaction.addMessages(added, location: .Random)
                let maxId = messages.compactMap { timelineIds[$0.id] }.max() ?? 0
                let maxRead = messages.filter { $0.direction == .outgoing && $0.receipt == .read }.compactMap { timelineIds[$0.id] }.max() ?? 0
                let incoming = messages.filter { $0.direction == .incoming }
                let readIncoming = incoming.prefix(max(0, incoming.count - chat.unread)).compactMap { timelineIds[$0.id] }.max() ?? 0
                transaction.resetIncomingReadStates([id: [Namespaces.Message.Cloud: .idBased(maxIncomingReadId: chat.unread == 0 ? maxId : readIncoming, maxOutgoingReadId: maxRead, maxKnownId: maxId, count: Int32(chat.unread), markedUnread: chat.unread > 0)]])
            }
        } |> afterNext { _ in
            if configureMenu { UserDefaults.standard.set(true, forKey: menuDefaultsKey) }
            SimulatorLaunchTrace.shared.mark("projection-done")
        }
    }
    public static func send(account: Account, peerId: PeerId, messages: [EnqueueMessage]) -> Signal<[MessageId?], NoError> {
        var added: [SimulatorMessage] = []
        var outgoingInfo: [String: OutgoingMessageInfoAttribute] = [:]
        do {
            try TelegramSimulatorWorkspace.shared.change { document in
                guard let chat = document.chats.first(where: { self.peerId($0.profileId) == peerId }) else { throw SimulatorDataError.invalid("Создайте личный чат в редакторе") }
                for message in messages {
                    guard case let .message(text, _, _, media, _, replyTo, _, _, correlationId, _) = message, media == nil, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw SimulatorDataError.invalid("Симулятор поддерживает только текстовые сообщения") }
                    // The composer answers by Postbox ID; the document keeps its own IDs, so
                    // translate it back through the same timeline the projection assigns.
                    var replyToId: String?
                    if let replyTo = replyTo {
                        let timeline = document.timelineIds()
                        replyToId = document.messages.first(where: { $0.chatId == chat.id && timeline[$0.id] == replyTo.messageId.id })?.id
                    }
                    let local = SimulatorMessage(chatId: chat.id, text: text, receipt: .sent, replyToId: replyToId)
                    document.messages.append(local); added.append(local)
                    outgoingInfo[local.id] = OutgoingMessageInfoAttribute(uniqueId: SimulatorDocument.numericId(local.id), flags: [], acknowledged: true, correlationId: correlationId, bubbleUpEmojiOrStickersets: [], partialReference: nil)
                }
            }
        } catch {
            TelegramSimulatorWorkspace.shared.report(error)
            return .single([])
        }
        let indexed = TelegramSimulatorWorkspace.shared.indexedSnapshot()
        let ids = added.map { resolveMessageId($0, in: indexed.document, timeline: indexed.timeline) }
        return project(account: account, outgoingInfo: outgoingInfo) |> map { ids }
    }
    public static func edit(account: Account, id: MessageId, text: String) -> Signal<RequestEditMessageResult, RequestEditMessageError> {
        do {
            try TelegramSimulatorWorkspace.shared.change { document in
                let timeline = document.timelineIds()
                guard let index = document.messages.firstIndex(where: { resolveMessageId($0, in: document, timeline: timeline) == id }), document.messages[index].direction == .outgoing else { throw SimulatorDataError.invalid("Недоступно") }
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
                let timeline = original.timelineIds()
                document.messages.removeAll { message in resolveMessageId(message, in: original, timeline: timeline).map { ids.contains($0) } ?? false }
            }
        } catch {
            TelegramSimulatorWorkspace.shared.report(error)
            return .complete()
        }
        return project(account: account)
    }
    // The original profile editors hand their fields to account.updateProfile /
    // contacts.addContact and keep a modal spinner up until the server answers. Network
    // requests are .never() in this app, so that spinner would never be dismissed: apply
    // the change to the document instead and let the same completion path run.
    public static func updateProfile(account: Account, peerId: PeerId, firstName: String? = nil, lastName: String? = nil, bio: String? = nil) -> Signal<Void, NoError> {
        do {
            try TelegramSimulatorWorkspace.shared.change { document in
                func apply(_ profile: inout SimulatorProfile) {
                    // The original editors have no client-side limits: online it is the
                    // server that trims a name and rejects an empty one. There is no server
                    // here, so the same limits are applied before the document is written,
                    // leaving that screen exactly as upstream draws it.
                    var updated = profile
                    if let firstName = firstName { updated.firstName = limited(firstName, .firstName) }
                    if let lastName = lastName { updated.lastName = limited(lastName, .lastName) }
                    if let bio = bio { updated.bio = limited(bio, .bio) }
                    guard !(updated.firstName.isEmpty && updated.lastName.isEmpty) else { return }
                    profile = updated
                }
                if peerId == ownerPeerId {
                    apply(&document.owner)
                } else if let index = document.profiles.firstIndex(where: { self.peerId($0.id) == peerId }) {
                    apply(&document.profiles[index])
                } else {
                    throw SimulatorDataError.invalid("Профиль недоступен для правки")
                }
            }
        } catch {
            TelegramSimulatorWorkspace.shared.report(error)
            // Completing closes the original spinner; the unchanged profile stays on screen.
            return .complete()
        }
        return project(account: account)
    }
    private static func limited(_ value: String, _ field: SimulatorFieldRules.Field) -> String {
        return SimulatorFieldRules.sanitize(value, for: field).trimmingCharacters(in: .whitespacesAndNewlines)
    }
    public static func updateBirthday(account: Account, birthday: TelegramBirthday?) -> Signal<Never, NoError> {
        do {
            try TelegramSimulatorWorkspace.shared.change { document in
                document.owner.birthday = birthday.map { SimulatorDocument.birthdayString(day: $0.day, month: $0.month, year: $0.year) }
            }
        } catch {
            TelegramSimulatorWorkspace.shared.report(error)
            return .complete()
        }
        return project(account: account) |> ignoreValues
    }
    // The avatar editor writes the cropped image into the media box and then expects an
    // upload. Read it back from there instead and keep it in the document, so the picture
    // survives a restart like every other local field.
    public static func updateAvatar(account: Account, resource: MediaResource?) -> Signal<UpdatePeerPhotoStatus, UploadPeerPhotoError> {
        guard let resource = resource else { return storeAvatar(account: account, dataURL: nil) }
        return account.postbox.mediaBox.resourceData(resource)
        |> filter { $0.complete }
        |> take(1)
        |> castError(UploadPeerPhotoError.self)
        |> mapToSignal { data -> Signal<UpdatePeerPhotoStatus, UploadPeerPhotoError> in
            guard let bytes = try? Data(contentsOf: URL(fileURLWithPath: data.path)), !bytes.isEmpty else {
                return .fail(.generic)
            }
            let isPNG = bytes.count > 8 && bytes.prefix(4).elementsEqual([0x89, 0x50, 0x4E, 0x47])
            let mime = isPNG ? "image/png" : "image/jpeg"
            return storeAvatar(account: account, dataURL: "data:\(mime);base64,\(bytes.base64EncodedString())")
        }
    }
    private static func storeAvatar(account: Account, dataURL: String?) -> Signal<UpdatePeerPhotoStatus, UploadPeerPhotoError> {
        do {
            try TelegramSimulatorWorkspace.shared.change { document in document.owner.avatar = dataURL }
        } catch {
            TelegramSimulatorWorkspace.shared.report(error)
            return .fail(.generic)
        }
        let representations = profile(TelegramSimulatorWorkspace.shared.snapshot().owner).photo
        return project(account: account)
        |> castError(UploadPeerPhotoError.self)
        |> map { _ in UpdatePeerPhotoStatus.complete(representations) }
    }
    public static func receipt(for id: MessageId) -> Bool? {
        let indexed = TelegramSimulatorWorkspace.shared.indexedSnapshot()
        let document = indexed.document
        guard let chat = document.chats.first(where: { peerId($0.profileId) == id.peerId }) else { return nil }
        return document.messages.first(where: { $0.chatId == chat.id && indexed.timeline[$0.id] == id.id }).map { $0.receipt == .read }
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
    private var timelineCache: [String: Int32]?
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
    fileprivate func indexedSnapshot() -> (document: SimulatorDocument, timeline: [String: Int32]) {
        lock.lock(); defer { lock.unlock() }
        let document = repository?.snapshot() ?? SimulatorDocument()
        if timelineCache == nil { timelineCache = document.timelineIds() }
        return (document, timelineCache!)
    }
    public func change(_ update: (inout SimulatorDocument) throws -> Void) throws {
        lock.lock(); defer { lock.unlock() }
        guard let repository = repository else { throw SimulatorDataError.invalid(loadError ?? "Хранилище недоступно") }
        try repository.change(update)
        timelineCache = nil
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
        timelineCache = nil
        changed.set(0)
    }
}
