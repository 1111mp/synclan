import { render } from '@testing-library/react';
import { BLUR_COMMAND, FOCUS_COMMAND, createEditor } from 'lexical';
import { afterEach, expect, test, vi } from 'vitest';

import { IsFocusedPlugin } from './is-focused-plugin';

const context = vi.hoisted(() => ({ editor: null as unknown }));
vi.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [context.editor],
}));

afterEach(() => {
  document.body.replaceChildren();
});

test('reports focus acquired before the plugin mounts, then tracks blur and refocus', () => {
  const editor = createEditor({
    namespace: 'focus-test',
    onError: (error) => {
      throw error;
    },
  });
  context.editor = editor;
  const root = document.createElement('div');
  root.tabIndex = 0;
  document.body.append(root);
  editor.setRootElement(root);
  root.focus();
  const onFocusChange = vi.fn();

  const { unmount } = render(<IsFocusedPlugin onFocusChange={onFocusChange} />);
  expect(onFocusChange).toHaveBeenLastCalledWith(true);

  editor.dispatchCommand(BLUR_COMMAND, new FocusEvent('blur'));
  expect(onFocusChange).toHaveBeenLastCalledWith(false);
  editor.dispatchCommand(FOCUS_COMMAND, new FocusEvent('focus'));
  expect(onFocusChange).toHaveBeenLastCalledWith(true);

  unmount();
  editor.setRootElement(null);
});
