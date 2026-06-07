-- Add migration script here
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
		created_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%d %H:%M:%f', 'now')),
		updated_at TEXT NOT NULL DEFAULT (strftime ('%Y-%m-%d %H:%M:%f', 'now'))
	);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (sender);

CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages (receiver);

CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages (sender, receiver);