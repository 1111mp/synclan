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
		type TEXT NOT NULL,
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

-- Table Devices
CREATE TABLE
	IF NOT EXISTS devices (
	  id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		avatar TEXT,
		fingerprint_id TEXT,
		role TEXT NOT NULL DEFAULT 'client',
		platform TEXT,
		browser TEXT,
		created_at INTEGER NOT NULL DEFAULT (unixepoch()),
		updated_at INTEGER NOT NULL DEFAULT (unixepoch())
	);

CREATE INDEX IF NOT EXISTS idx_devices_fingerprint_id ON devices(fingerprint_id);

-- Trigger
CREATE TRIGGER IF NOT EXISTS update_devices_updated_at
AFTER UPDATE OF
    name,
    avatar,
    fingerprint_id,
    platform,
    browser
ON devices
FOR EACH ROW
BEGIN
    UPDATE devices
    SET updated_at = unixepoch()
    WHERE id = NEW.id;
END;
