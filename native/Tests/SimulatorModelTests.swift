import Foundation
import XCTest
@testable import SimulatorModel

final class SimulatorModelTests: XCTestCase {
    private func example() -> SimulatorDocument {
        var document = SimulatorDocument()
        document.profiles = [SimulatorProfile(id: "anna", firstName: "Анна", lastName: "Тест", phone: "+7 000 000-00-00", bio: "Виртуальный профиль", avatar: "data:image/png;base64,AQID")]
        document.chats = [SimulatorChat(id: "chat", profileId: "anna", presence: .typing, unread: 2, createdAt: "2026-10-26T10:20:30.123Z")]
        document.messages = [
            SimulatorMessage(id: "one", chatId: "chat", text: "Первая строка\nВторая 🙂", direction: .incoming, sentAt: "2026-10-26T10:20:30.123Z", receipt: .sent),
            SimulatorMessage(id: "two", chatId: "chat", text: "Ответ", direction: .outgoing, sentAt: "2026-10-26T10:21:45.456Z", receipt: .read, edited: true)
        ]
        return document
    }
    func testVersionOneRoundTripPreservesManualFields() throws {
        let document = example()
        let data = try document.encoded()
        XCTAssertEqual(try SimulatorDocument.decode(data), document)
        let object = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        XCTAssertNotNil(object["self"]); XCTAssertNil(object["owner"])
    }
    func testExistingPwaBackupEnvelopeIsAccepted() throws {
        let document = example()
        let raw = try JSONSerialization.jsonObject(with: document.encoded())
        let data = try JSONSerialization.data(withJSONObject: ["kind": "telegram-simulator-backup", "version": 1, "document": raw, "preferences": ["version": 1]])
        XCTAssertEqual(try SimulatorDocument.decode(data), document)
    }
    func testInvalidReferencesEnumsAndNativeTimestampAreRejected() throws {
        var document = example(); document.profiles = []
        XCTAssertThrowsError(try document.encoded())
        document = example(); document.messages[0].sentAt = "2040-01-01T00:00:00Z"
        XCTAssertThrowsError(try document.encoded())
        document = example(); document.messages[0].text = " \n "
        XCTAssertThrowsError(try document.encoded())
        document = example(); document.chats.append(SimulatorChat(profileId: "anna"))
        XCTAssertThrowsError(try document.encoded())
        let invalidEnum = String(decoding: try example().encoded(), as: UTF8.self).replacingOccurrences(of: "\"typing\"", with: "\"other\"")
        XCTAssertThrowsError(try SimulatorDocument.decode(Data(invalidEnum.utf8)))
    }
    func testStableNativeIds() {
        // Compatibility values: changing the ID scheme must not silently remap saved chats.
        XCTAssertEqual(SimulatorDocument.numericId("self"), 251894799241912)
        XCTAssertEqual(SimulatorDocument.numericId("anna"), 222667032143036)
        XCTAssertEqual(SimulatorDocument.messageId("one"), 567084309)
    }
    func testSaveRestartAndInvalidImportPreservePreviousDocument() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: directory) }
        let url = directory.appendingPathComponent("document.json")
        let repository = try SimulatorRepository(url: url)
        try repository.change { $0 = example() }
        let before = try Data(contentsOf: url)
        XCTAssertEqual(try SimulatorRepository(url: url).snapshot(), example())
        XCTAssertThrowsError(try repository.restore(Data("{broken".utf8)))
        XCTAssertEqual(repository.snapshot(), example())
        XCTAssertEqual(try Data(contentsOf: url), before)
    }
    func testWriteFailureDoesNotCommitInMemory() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: directory) }
        let blocker = directory.appendingPathComponent("not-a-directory")
        let repository = try SimulatorRepository(url: blocker.appendingPathComponent("document.json"))
        try Data([1]).write(to: blocker)
        XCTAssertThrowsError(try repository.change { $0 = example() })
        XCTAssertEqual(repository.snapshot(), SimulatorDocument())
    }
    func testCorruptExistingDocumentIsNotSilentlyReplaced() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: directory) }
        let url = directory.appendingPathComponent("document.json")
        let original = Data("invalid existing data".utf8)
        try original.write(to: url)
        XCTAssertThrowsError(try SimulatorRepository(url: url))
        XCTAssertEqual(try Data(contentsOf: url), original)
    }
}
