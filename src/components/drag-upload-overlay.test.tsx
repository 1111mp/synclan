import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { expect, test, vi } from 'vitest';

import { DragUploadOverlay } from './drag-upload-overlay';

function imageTransfer(file: File) {
  return {
    files: [file],
    items: [{ kind: 'file', type: file.type, getAsFile: () => file }],
    types: ['Files'],
  };
}

test('leaves pasted images to the editor without uploading them', async () => {
  const onDrop = vi.fn();
  const onPaste = vi.fn();
  render(
    <DragUploadOverlay onDrop={onDrop}>
      <div role='textbox' contentEditable onPaste={onPaste} />
    </DragUploadOverlay>,
  );
  const file = new File(['image'], 'clipboard.png', { type: 'image/png' });

  await act(async () => {
    fireEvent.paste(screen.getByRole('textbox'), {
      clipboardData: imageTransfer(file),
    });
  });

  expect(onPaste).toHaveBeenCalledOnce();
  expect(onDrop).not.toHaveBeenCalled();
});

test('still uploads files dropped onto the overlay', async () => {
  const onDrop = vi.fn();
  render(
    <DragUploadOverlay onDrop={onDrop}>
      <div>Drop target</div>
    </DragUploadOverlay>,
  );
  const file = new File(['image'], 'dropped.png', { type: 'image/png' });

  fireEvent.drop(screen.getByText('Drop target'), {
    dataTransfer: imageTransfer(file),
  });

  await waitFor(() => expect(onDrop).toHaveBeenCalledWith([file]));
  expect(onDrop).toHaveBeenCalledOnce();
});
