import Foundation
import UIKit
import UniformTypeIdentifiers
import TelegramCore
import SwiftSignalKit

// Service UI only. Public chats, profiles, composer and navigation remain upstream.
final class SimulatorEditorController: UITableViewController, UIDocumentPickerDelegate {
    private let account: Account
    private var projection: Disposable?
    private var document: SimulatorDocument { TelegramSimulatorWorkspace.shared.snapshot() }
    init(account: Account) {
        self.account = account
        super.init(style: .insetGrouped)
        title = "Редактор"
        navigationItem.leftBarButtonItem = UIBarButtonItem(title: "Готово", style: .done, target: self, action: #selector(close))
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
    deinit { projection?.dispose() }
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        tableView.reloadData()
        if let error = TelegramSimulatorWorkspace.shared.loadError { showError("Исходный файл сохранён. Импортируйте исправную копию.\n\(error)") }
    }
    @objc private func close() { dismiss(animated: true) }
    private func showError(_ text: String) {
        let alert = UIAlertController(title: "Не удалось сохранить", message: text, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        (navigationController?.topViewController ?? self).present(alert, animated: true)
    }
    private func save(_ update: (inout SimulatorDocument) throws -> Void, completion: (() -> Void)? = nil) {
        do {
            try TelegramSimulatorWorkspace.shared.change(update)
            projection?.dispose()
            projection = (TelegramSimulator.project(account: account) |> deliverOnMainQueue).start(completed: { [weak self] in
                self?.tableView.reloadData(); completion?()
            })
        } catch { showError(error.localizedDescription) }
    }
    override func numberOfSections(in tableView: UITableView) -> Int { 4 }
    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        switch section {
        case 0: return 1
        case 1: return document.profiles.count + 1
        case 2: return document.chats.count + 1
        default: return 2
        }
    }
    override func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        return ["Мой профиль", "Виртуальные собеседники", "Личные чаты", "Резервная копия"][section]
    }
    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = UITableViewCell(style: .subtitle, reuseIdentifier: nil)
        cell.accessoryType = .disclosureIndicator
        cell.accessibilityIdentifier = "simulator.section.\(indexPath.section).row.\(indexPath.row)"
        switch indexPath.section {
        case 0: cell.textLabel?.text = document.owner.displayName
        case 1:
            cell.textLabel?.text = indexPath.row == document.profiles.count ? "Добавить собеседника" : document.profiles[indexPath.row].displayName
        case 2:
            if indexPath.row == document.chats.count { cell.textLabel?.text = "Создать чат" }
            else {
                let chat = document.chats[indexPath.row]
                cell.textLabel?.text = document.profiles.first { $0.id == chat.profileId }?.displayName
                cell.detailTextLabel?.text = "\(document.messages.filter { $0.chatId == chat.id }.count) сообщений"
            }
        default: cell.textLabel?.text = indexPath.row == 0 ? "Экспортировать JSON" : "Импортировать JSON"
        }
        return cell
    }
    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        switch indexPath.section {
        case 0: editProfile(document.owner, owner: true)
        case 1: editProfile(indexPath.row == document.profiles.count ? SimulatorProfile() : document.profiles[indexPath.row], owner: false)
        case 2:
            if indexPath.row == document.chats.count { newChat() }
            else { editChat(document.chats[indexPath.row]) }
        default:
            if indexPath.row == 0 { exportBackup() }
            else {
                let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.json], asCopy: true)
                picker.delegate = self; present(picker, animated: true)
            }
        }
    }
    override func tableView(_ tableView: UITableView, canEditRowAt indexPath: IndexPath) -> Bool {
        return (indexPath.section == 1 && indexPath.row < document.profiles.count) || (indexPath.section == 2 && indexPath.row < document.chats.count)
    }
    override func tableView(_ tableView: UITableView, commit editingStyle: UITableViewCell.EditingStyle, forRowAt indexPath: IndexPath) {
        guard editingStyle == .delete else { return }
        let current = document
        let profileId = indexPath.section == 1 ? current.profiles[indexPath.row].id : nil
        let ids = profileId.map { id in current.chats.filter { $0.profileId == id }.map(\.id) } ?? [current.chats[indexPath.row].id]
        let alert = UIAlertController(title: "Удалить?", message: "Связанные переписки также будут удалены.", preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Отмена", style: .cancel))
        alert.addAction(UIAlertAction(title: "Удалить", style: .destructive) { [weak self] _ in
            self?.save { document in
                if let profileId = profileId { document.profiles.removeAll { $0.id == profileId } }
                document.chats.removeAll { ids.contains($0.id) }
                document.messages.removeAll { ids.contains($0.chatId) }
            }
        })
        present(alert, animated: true)
    }
    private func editProfile(_ initial: SimulatorProfile, owner: Bool) {
        let form = SimulatorProfileForm(profile: initial) { [weak self] profile in
            self?.save({ document in
                if owner { document.owner = profile }
                else if let index = document.profiles.firstIndex(where: { $0.id == profile.id }) { document.profiles[index] = profile }
                else { document.profiles.append(profile) }
            }, completion: { self?.navigationController?.popViewController(animated: true) })
        }
        navigationController?.pushViewController(form, animated: true)
    }
    private func newChat() {
        let available = document.profiles.filter { person in !document.chats.contains { $0.profileId == person.id } }
        guard !available.isEmpty else { showError("Сначала добавьте собеседника без существующего чата"); return }
        let alert = UIAlertController(title: "Собеседник", message: nil, preferredStyle: .actionSheet)
        for profile in available {
            alert.addAction(UIAlertAction(title: profile.displayName, style: .default) { [weak self] _ in self?.save { $0.chats.append(SimulatorChat(profileId: profile.id)) } })
        }
        alert.addAction(UIAlertAction(title: "Отмена", style: .cancel))
        alert.popoverPresentationController?.sourceView = tableView
        present(alert, animated: true)
    }
    private func editChat(_ chat: SimulatorChat) {
        let controller = SimulatorChatEditor(chat: chat, snapshot: { [weak self] in self?.document ?? SimulatorDocument() }, save: { [weak self] change, completion in self?.save(change, completion: completion) })
        navigationController?.pushViewController(controller, animated: true)
    }
    private func exportBackup() {
        do {
            // Export original bytes even if validation failed at launch.
            let workspace = TelegramSimulatorWorkspace.shared
            let data = workspace.loadError != nil ? try Data(contentsOf: workspace.fileURL) : try document.encoded()
            let url = FileManager.default.temporaryDirectory.appendingPathComponent("telegram-backup-\(UUID().uuidString).json")
            try data.write(to: url, options: .atomic)
            let picker = UIDocumentPickerViewController(forExporting: [url], asCopy: true)
            present(picker, animated: true)
        } catch { showError(error.localizedDescription) }
    }
    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let url = urls.first else { return }
        let access = url.startAccessingSecurityScopedResource()
        defer { if access { url.stopAccessingSecurityScopedResource() } }
        do {
            let size = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
            guard size < 50 * 1024 * 1024 else { throw SimulatorDataError.invalid("Файл больше 50 МБ") }
            let data = try Data(contentsOf: url)
            let incoming = try SimulatorDocument.decode(data)
            let alert = UIAlertController(title: "Заменить данные?", message: "В копии: \(incoming.profiles.count) профилей, \(incoming.messages.count) сообщений. Текущий файл сохранится отдельно.", preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "Отмена", style: .cancel))
            alert.addAction(UIAlertAction(title: "Заменить", style: .destructive) { [weak self] _ in
                do {
                    try TelegramSimulatorWorkspace.shared.restore(data)
                    guard let self = self else { return }
                    self.projection?.dispose()
                    self.projection = (TelegramSimulator.project(account: self.account) |> deliverOnMainQueue).start(completed: { [weak self] in self?.tableView.reloadData() })
                } catch { self?.showError(error.localizedDescription) }
            })
            present(alert, animated: true)
        } catch { showError(error.localizedDescription) }
    }
}

private typealias SimulatorSave = (@escaping (inout SimulatorDocument) throws -> Void, @escaping () -> Void) -> Void

private extension UIViewController {
    // The service editor has no server to reject input, so it says what to change itself.
    func presentFieldNotice(_ message: String) {
        let alert = UIAlertController(title: "Проверьте поля", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}

private final class SimulatorProfileForm: UITableViewController, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
    private static let kinds: [SimulatorFieldRules.Field] = [.firstName, .lastName, .username, .phone, .bio]
    private var profile: SimulatorProfile
    private let onSave: (SimulatorProfile) -> Void
    private var fields: [UITextField] = []
    // Whether this person's circle appears above the chat list. Off for everyone by default:
    // having a story is a state a person is put into, not one they are in for existing.
    private let storySwitch = UISwitch()
    init(profile: SimulatorProfile, onSave: @escaping (SimulatorProfile) -> Void) {
        self.profile = profile; self.onSave = onSave
        super.init(style: .insetGrouped); title = "Профиль"
        storySwitch.isOn = profile.hasStory
        storySwitch.accessibilityIdentifier = "simulator.profile.story"
        let values = [profile.firstName, profile.lastName, profile.username, profile.phone, profile.bio]
        for (index, label) in ["Имя", "Фамилия", "Username", "Произвольный телефон", "О себе"].enumerated() {
            let field = UITextField(); field.placeholder = label
            // A document written before these rules existed opens trimmed, not rejected.
            field.text = SimulatorFieldRules.sanitize(values[index], for: Self.kinds[index])
            field.autocorrectionType = .no; field.accessibilityLabel = label
            field.accessibilityIdentifier = "simulator.profile.field.\(index)"
            switch Self.kinds[index] {
            case .username: field.keyboardType = .asciiCapable; field.autocapitalizationType = .none
            case .phone: field.keyboardType = .phonePad
            default: break
            }
            field.addTarget(self, action: #selector(didEdit(_:)), for: .editingChanged)
            fields.append(field)
        }
        navigationItem.rightBarButtonItem = UIBarButtonItem(title: "Сохранить", style: .done, target: self, action: #selector(commit))
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
    @objc private func didEdit(_ field: UITextField) {
        guard let index = fields.firstIndex(of: field) else { return }
        let sanitized = SimulatorFieldRules.sanitize(field.text ?? "", for: Self.kinds[index])
        guard sanitized != field.text else { return }
        // Leave the caret where the typing left it instead of jumping to the end.
        let tail = field.selectedTextRange.map { field.offset(from: $0.end, to: field.endOfDocument) } ?? 0
        field.text = sanitized
        if let position = field.position(from: field.endOfDocument, offset: -min(tail, sanitized.count)) {
            field.selectedTextRange = field.textRange(from: position, to: position)
        }
    }
    @objc private func commit() {
        view.endEditing(true)
        func value(_ index: Int) -> String { (fields[index].text ?? "").trimmingCharacters(in: .whitespacesAndNewlines) }
        var updated = profile
        updated.firstName = value(0); updated.lastName = value(1)
        updated.username = value(2); updated.phone = value(3); updated.bio = value(4)
        updated.story = storySwitch.isOn ? true : nil
        if let reason = SimulatorFieldRules.validate(updated) { presentFieldNotice(reason); return }
        profile = updated
        onSave(profile)
    }
    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int { 8 }
    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        if indexPath.row == 7 {
            let cell = UITableViewCell(style: .subtitle, reuseIdentifier: nil)
            cell.textLabel?.text = "История"
            cell.detailTextLabel?.text = "Кружок над списком чатов"
            cell.detailTextLabel?.textColor = .secondaryLabel
            cell.accessoryView = storySwitch
            cell.selectionStyle = .none
            return cell
        }
        let cell = UITableViewCell(style: .default, reuseIdentifier: nil)
        if indexPath.row < fields.count {
            let field = fields[indexPath.row]; field.translatesAutoresizingMaskIntoConstraints = false
            cell.contentView.addSubview(field)
            NSLayoutConstraint.activate([field.leadingAnchor.constraint(equalTo: cell.contentView.layoutMarginsGuide.leadingAnchor), field.trailingAnchor.constraint(equalTo: cell.contentView.layoutMarginsGuide.trailingAnchor), field.topAnchor.constraint(equalTo: cell.contentView.topAnchor, constant: 12), field.bottomAnchor.constraint(equalTo: cell.contentView.bottomAnchor, constant: -12)])
        } else { cell.textLabel?.text = indexPath.row == 5 ? "Выбрать аватар" : "Удалить аватар" }
        return cell
    }
    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        if indexPath.row == 5 {
            let picker = UIImagePickerController(); picker.sourceType = .photoLibrary
            picker.delegate = self; picker.allowsEditing = true; present(picker, animated: true)
        } else if indexPath.row == 6 { profile.avatar = nil }
    }
    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) { picker.dismiss(animated: true) }
    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
        if let image = (info[.editedImage] ?? info[.originalImage]) as? UIImage {
            let renderer = UIGraphicsImageRenderer(size: CGSize(width: 640, height: 640))
            let normalized = renderer.image { _ in
                let scale = max(640 / image.size.width, 640 / image.size.height)
                let size = CGSize(width: image.size.width * scale, height: image.size.height * scale)
                image.draw(in: CGRect(x: (640 - size.width) / 2, y: (640 - size.height) / 2, width: size.width, height: size.height))
            }
            if let data = normalized.jpegData(compressionQuality: 0.85) { profile.avatar = "data:image/jpeg;base64,\(data.base64EncodedString())" }
        }
        picker.dismiss(animated: true)
    }
}

private final class SimulatorChatEditor: UITableViewController {
    private let chatId: String
    private let snapshot: () -> SimulatorDocument
    private let save: SimulatorSave
    private var chat: SimulatorChat? { snapshot().chats.first { $0.id == chatId } }
    private var messages: [SimulatorMessage] { snapshot().messages.filter { $0.chatId == chatId }.sorted { (SimulatorDocument.date($0.sentAt) ?? .distantPast) < (SimulatorDocument.date($1.sentAt) ?? .distantPast) } }
    init(chat: SimulatorChat, snapshot: @escaping () -> SimulatorDocument, save: @escaping SimulatorSave) {
        chatId = chat.id; self.snapshot = snapshot; self.save = save
        super.init(style: .insetGrouped); title = "Переписка"
        navigationItem.rightBarButtonItem = UIBarButtonItem(title: "Сообщение", style: .plain, target: self, action: #selector(addMessage))
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
    override func viewWillAppear(_ animated: Bool) { super.viewWillAppear(animated); tableView.reloadData() }
    @objc private func addMessage() { edit(SimulatorMessage(chatId: chatId, text: "")) }
    override func numberOfSections(in tableView: UITableView) -> Int { 2 }
    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int { section == 0 ? 2 : messages.count }
    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = UITableViewCell(style: .subtitle, reuseIdentifier: nil)
        if indexPath.section == 0 {
            if indexPath.row == 0 {
                cell.textLabel?.text = "Статус собеседника"
                cell.detailTextLabel?.text = chat?.presence.rawValue
            } else { cell.textLabel?.text = "Непрочитанные: \(chat?.unread ?? 0)" }
        } else {
            let message = messages[indexPath.row]
            cell.textLabel?.text = message.text; cell.textLabel?.numberOfLines = 3
            cell.detailTextLabel?.text = "\(message.direction == .incoming ? "Входящее" : "Исходящее") · \(message.sentAt) · \(message.receipt.rawValue)"
        }
        cell.accessoryType = .disclosureIndicator; return cell
    }
    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        if indexPath.section == 1 { edit(messages[indexPath.row]); return }
        if indexPath.row == 0 {
            let alert = UIAlertController(title: "Статус", message: nil, preferredStyle: .actionSheet)
            for (label, value) in [("В сети", SimulatorPresence.online), ("Был(а) недавно", .recently), ("Печатает…", .typing)] {
                alert.addAction(UIAlertAction(title: label, style: .default) { [weak self] _ in
                    guard let self = self else { return }
                    self.save({ document in if let i = document.chats.firstIndex(where: { $0.id == self.chatId }) { document.chats[i].presence = value } }, { [weak self] in self?.tableView.reloadData() })
                })
            }
            alert.addAction(UIAlertAction(title: "Отмена", style: .cancel)); alert.popoverPresentationController?.sourceView = tableView
            present(alert, animated: true)
        } else {
            let alert = UIAlertController(title: "Непрочитанные", message: nil, preferredStyle: .alert)
            alert.addTextField { $0.keyboardType = .numberPad; $0.text = String(self.chat?.unread ?? 0) }
            alert.addAction(UIAlertAction(title: "Отмена", style: .cancel))
            alert.addAction(UIAlertAction(title: "Сохранить", style: .default) { [weak self, weak alert] _ in
                guard let self = self else { return }
                let entered = (alert?.textFields?.first?.text ?? "").trimmingCharacters(in: .whitespaces)
                guard let count = Int(entered) else { self.presentFieldNotice("Непрочитанные: введите число."); return }
                let incoming = self.messages.filter { $0.direction == .incoming }.count
                let clamped = SimulatorFieldRules.clampUnread(count, incomingMessages: incoming)
                self.save({ document in if let i = document.chats.firstIndex(where: { $0.id == self.chatId }) { document.chats[i].unread = clamped } }, { [weak self] in
                    self?.tableView.reloadData()
                    if clamped != count { self?.presentFieldNotice("Непрочитанных не может быть больше, чем входящих сообщений в чате: \(incoming). Сохранено \(clamped).") }
                })
            })
            present(alert, animated: true)
        }
    }
    private func edit(_ message: SimulatorMessage) {
        let form = SimulatorMessageForm(message: message) { [weak self] updated in
            guard let self = self else { return }
            self.save({ document in
                if let i = document.messages.firstIndex(where: { $0.id == updated.id }) { document.messages[i] = updated }
                else { document.messages.append(updated) }
            }, { [weak self] in self?.navigationController?.popViewController(animated: true) })
        }
        navigationController?.pushViewController(form, animated: true)
    }
    override func tableView(_ tableView: UITableView, canEditRowAt indexPath: IndexPath) -> Bool { indexPath.section == 1 }
    override func tableView(_ tableView: UITableView, commit editingStyle: UITableViewCell.EditingStyle, forRowAt indexPath: IndexPath) {
        guard editingStyle == .delete else { return }
        let id = messages[indexPath.row].id
        save({ $0.messages.removeAll { $0.id == id } }, { [weak self] in self?.tableView.reloadData() })
    }
}

private final class SimulatorMessageForm: UITableViewController, UITextViewDelegate {
    private var message: SimulatorMessage
    private let onSave: (SimulatorMessage) -> Void
    private let text = UITextView()
    private let direction = UISegmentedControl(items: ["Входящее", "Исходящее"])
    private let receipt = UISegmentedControl(items: ["Одна галочка", "Две галочки"])
    private let date = UIDatePicker()
    private var dateChanged = false
    private let edited = UISwitch()
    init(message: SimulatorMessage, onSave: @escaping (SimulatorMessage) -> Void) {
        self.message = message; self.onSave = onSave
        super.init(style: .insetGrouped); title = "Сообщение"
        text.text = SimulatorFieldRules.sanitize(message.text, for: .messageText)
        text.font = .systemFont(ofSize: 17); text.accessibilityLabel = "Текст сообщения"
        text.delegate = self
        direction.selectedSegmentIndex = message.direction == .incoming ? 0 : 1
        receipt.selectedSegmentIndex = message.receipt == .sent ? 0 : 1
        direction.accessibilityIdentifier = "simulator.message.direction"
        receipt.accessibilityIdentifier = "simulator.message.receipt"
        date.accessibilityIdentifier = "simulator.message.date"
        date.datePickerMode = .dateAndTime; date.preferredDatePickerStyle = .compact
        date.minimumDate = Date(timeIntervalSince1970: 1)
        date.maximumDate = Date(timeIntervalSince1970: Double(Int32.max) - 1)
        date.date = SimulatorDocument.date(message.sentAt) ?? Date()
        date.addTarget(self, action: #selector(didChangeDate), for: .valueChanged)
        edited.isOn = message.edited
        navigationItem.rightBarButtonItem = UIBarButtonItem(title: "Сохранить", style: .done, target: self, action: #selector(commit))
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
    @objc private func didChangeDate() { dateChanged = true }
    func textViewDidChange(_ textView: UITextView) {
        let sanitized = SimulatorFieldRules.sanitize(textView.text ?? "", for: .messageText)
        guard sanitized != textView.text else { return }
        let selection = textView.selectedRange
        textView.text = sanitized
        textView.selectedRange = NSRange(location: min(selection.location, (sanitized as NSString).length), length: 0)
    }
    @objc private func commit() {
        view.endEditing(true)
        let value = text.text ?? ""
        if let reason = SimulatorFieldRules.validate(messageText: value) { presentFieldNotice(reason); return }
        message.text = value
        message.direction = direction.selectedSegmentIndex == 0 ? .incoming : .outgoing
        message.receipt = receipt.selectedSegmentIndex == 0 ? .sent : .read
        // Do not erase the original seconds when changing unrelated fields.
        if dateChanged { message.sentAt = SimulatorDocument.timestamp(date.date) }
        message.edited = edited.isOn; onSave(message)
    }
    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int { 5 }
    override func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat { indexPath.row == 0 ? 180 : 58 }
    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = UITableViewCell(style: .default, reuseIdentifier: nil)
        if indexPath.row == 4 { cell.textLabel?.text = "Метка «изменено»"; cell.accessoryView = edited; return cell }
        let controls: [UIView] = [text, direction, receipt, date]
        let control = controls[indexPath.row]; control.translatesAutoresizingMaskIntoConstraints = false
        cell.contentView.addSubview(control)
        NSLayoutConstraint.activate([control.leadingAnchor.constraint(equalTo: cell.contentView.layoutMarginsGuide.leadingAnchor), control.trailingAnchor.constraint(equalTo: cell.contentView.layoutMarginsGuide.trailingAnchor), control.topAnchor.constraint(equalTo: cell.contentView.topAnchor, constant: 10), control.bottomAnchor.constraint(equalTo: cell.contentView.bottomAnchor, constant: -10)])
        return cell
    }
}
