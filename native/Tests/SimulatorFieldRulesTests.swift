import Foundation
import XCTest
@testable import SimulatorModel

final class SimulatorFieldRulesTests: XCTestCase {
    func testSanitizeDropsDisallowedCharactersAndTruncates() {
        XCTAssertEqual(SimulatorFieldRules.sanitize("@Pavel_Durov", for: .username), "Pavel_Durov")
        XCTAssertEqual(SimulatorFieldRules.sanitize("Паша durov!", for: .username), "durov")
        XCTAssertEqual(SimulatorFieldRules.sanitize("+7 (900) 123-45-67", for: .phone), "+7 (900) 123-45-67")
        XCTAssertEqual(SimulatorFieldRules.sanitize("+7abc900", for: .phone), "+7900")
        XCTAssertEqual(SimulatorFieldRules.sanitize("Иван\nИванов", for: .firstName), "ИванИванов")
        XCTAssertEqual(SimulatorFieldRules.sanitize("Первая\nВторая", for: .messageText), "Первая\nВторая")
        let long = String(repeating: "я", count: 200)
        XCTAssertEqual(SimulatorFieldRules.sanitize(long, for: .firstName).count, SimulatorFieldRules.limit(.firstName))
        XCTAssertEqual(SimulatorFieldRules.sanitize(long, for: .bio).count, SimulatorFieldRules.limit(.bio))
        // Sanitizing an acceptable value must leave it byte-for-byte alone.
        XCTAssertEqual(SimulatorFieldRules.sanitize("Иван", for: .firstName), "Иван")
    }

    func testProfileValidationNamesTheFieldToFix() {
        var profile = SimulatorProfile(firstName: "Иван", lastName: "Иванов", username: "ivan_2", phone: "+79001234567", bio: "Тест")
        XCTAssertNil(SimulatorFieldRules.validate(profile))
        profile.firstName = "   "
        XCTAssertEqual(SimulatorFieldRules.validate(profile), "Укажите имя — без него профиль отображается как «Без имени».")
        profile.firstName = "Иван"
        profile.username = "2ivan"
        XCTAssertEqual(SimulatorFieldRules.validate(profile), "Username должен начинаться с буквы.")
        profile.username = "ivan durov"
        XCTAssertEqual(SimulatorFieldRules.validate(profile), "Username: только латинские буквы, цифры и подчёркивание.")
        profile.username = String(repeating: "a", count: 33)
        XCTAssertEqual(SimulatorFieldRules.validate(profile), "Username: не больше 32 символов, сейчас 33.")
        profile.username = ""
        XCTAssertNil(SimulatorFieldRules.validate(profile))
        profile.phone = "номер"
        XCTAssertEqual(SimulatorFieldRules.validate(profile), "Телефон: только цифры и символы + - ( ).")
        profile.phone = "+-()"
        XCTAssertEqual(SimulatorFieldRules.validate(profile), "Телефон: нужна хотя бы одна цифра.")
        profile.phone = ""
        profile.bio = String(repeating: "я", count: 71)
        XCTAssertEqual(SimulatorFieldRules.validate(profile), "О себе: не больше 70 символов, сейчас 71.")
    }

    func testMessageTextValidationMatchesDocumentInvariant() {
        XCTAssertEqual(SimulatorFieldRules.validate(messageText: "  \n "), "Введите текст сообщения.")
        XCTAssertNil(SimulatorFieldRules.validate(messageText: "Привет"))
        let long = String(repeating: "я", count: 4097)
        XCTAssertEqual(SimulatorFieldRules.validate(messageText: long), "Текст сообщения: не больше 4096 символов, сейчас 4097.")
        // The stored document already refuses empty text; the form must refuse it first.
        var document = SimulatorDocument()
        document.profiles = [SimulatorProfile(id: "a", firstName: "А")]
        document.chats = [SimulatorChat(id: "c", profileId: "a")]
        document.messages = [SimulatorMessage(id: "m", chatId: "c", text: " ")]
        XCTAssertThrowsError(try document.validated())
    }

    func testUnreadCounterCannotExceedIncomingMessages() {
        XCTAssertEqual(SimulatorFieldRules.clampUnread(7, incomingMessages: 3), 3)
        XCTAssertEqual(SimulatorFieldRules.clampUnread(2, incomingMessages: 3), 2)
        XCTAssertEqual(SimulatorFieldRules.clampUnread(-1, incomingMessages: 3), 0)
        XCTAssertEqual(SimulatorFieldRules.clampUnread(4, incomingMessages: 0), 0)
    }
}
