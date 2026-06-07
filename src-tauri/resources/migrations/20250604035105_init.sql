-- Add migration script here
--
-- Table messages
CREATE TABLE
	IF NOT EXISTS messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		uuid TEXT NOT NULL UNIQUE,
		-- message sender
		sender TEXT NOT NULL,
		-- message receiver
		receiver TEXT NOT NULL,
		-- message type
		msg_type TEXT NOT NULL,
		content TEXT,
		extra TEXT,
		created_at DATETIME NOT NULL DEFAULT (strftime ('%Y-%m-%d %H:%M:%f', 'now')),
		updated_at DATETIME NOT NULL DEFAULT (strftime ('%Y-%m-%d %H:%M:%f', 'now'))
	);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (sender);

CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages (receiver);

CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages (sender, receiver);

-- Trigger
CREATE TRIGGER IF NOT EXISTS update_messages_updated_at AFTER
UPDATE ON messages FOR EACH ROW WHEN OLD.updated_at = NEW.updated_at -- 避免递归
BEGIN
UPDATE messages
SET
	updated_at = strftime ('%Y-%m-%d %H:%M:%f', 'now')
WHERE
	id = OLD.id;

END;

-- Table MessageAck
CREATE TABLE
	IF NOT EXISTS message_acks (
		receiver TEXT PRIMARY KEY,
		last_ack INTEGER DEFAULT NULL
	);

CREATE INDEX IF NOT EXISTS idx_message_acks_receiver_last_ack ON message_acks (receiver, last_ack);

-- Table Clients
CREATE TABLE
	IF NOT EXISTS clients (
		-- fingerprint id
		id TEXT NOT NULL PRIMARY KEY,
		name TEXT UNIQUE DEFAULT NULL,
		avatar TEXT DEFAULT NULL,
		auto_message_clean INTEGER DEFAULT -1,
		created_at DATETIME NOT NULL DEFAULT (strftime ('%Y-%m-%d %H:%M:%f', 'now')),
		updated_at DATETIME NOT NULL DEFAULT (strftime ('%Y-%m-%d %H:%M:%f', 'now'))
	);

-- Trigger
CREATE TRIGGER IF NOT EXISTS update_clients_updated_at AFTER
UPDATE ON clients FOR EACH ROW WHEN OLD.updated_at = NEW.updated_at -- 避免循环
BEGIN
UPDATE clients
SET
	updated_at = strftime ('%Y-%m-%d %H:%M:%f', 'now')
WHERE
	id = OLD.id;

END;