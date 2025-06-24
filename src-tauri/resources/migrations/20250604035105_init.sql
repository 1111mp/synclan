-- Add migration script here
--
-- Table messages
CREATE TABLE
	IF NOT EXISTS messages (
		id TEXT NOT NULL PRIMARY KEY,
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

-- Table User
CREATE TABLE
	IF NOT EXISTS users (
		id TEXT NOT NULL PRIMARY KEY,
		username TEXT UNIQUE,
		auto_message_clean INTEGER DEFAULT -1,
		created_at DATETIME NOT NULL DEFAULT (strftime ('%Y-%m-%d %H:%M:%f', 'now')),
		updated_at DATETIME NOT NULL DEFAULT (strftime ('%Y-%m-%d %H:%M:%f', 'now'))
	);

-- Trigger
CREATE TRIGGER IF NOT EXISTS update_users_updated_at AFTER
UPDATE ON users FOR EACH ROW WHEN OLD.updated_at = NEW.updated_at -- 避免循环
BEGIN
UPDATE users
SET
	updated_at = strftime ('%Y-%m-%d %H:%M:%f', 'now')
WHERE
	id = OLD.id;

END;