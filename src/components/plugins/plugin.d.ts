import 'lexical';

declare module 'lexical' {
  interface LexicalEditor {
    /**
     * Shared runtime state between plugins indicating whether
     * the Emoji Picker is currently open.
     *
     * - `true`  → The emoji picker is visible.
     * - `false` or `undefined` → The emoji picker is closed.
     *
     * This value is maintained by `EmojiPickerPlugin` and can be
     * read by other plugins such as `EnterPlugin` to
     * adjust behavior (e.g., prevent sending on Enter when
     * the emoji picker is open so Enter selects the emoji instead).
     *
     * **Note:** This is a transient runtime flag only.
     * It is not persisted in the Lexical `EditorState`.
     */
    __emojiMenuOpen?: boolean;
  }
}
