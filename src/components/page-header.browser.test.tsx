import '@testing-library/jest-dom/vitest';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';

import { PageHeader } from './page-header';

afterEach(cleanup);

test.each([390, 1100])(
  'header hit targets support dragging at %i px',
  async (width) => {
    await page.viewport(width, 800);
    const onClick = vi.fn();
    const { container } = render(
      <PageHeader
        title='Profile'
        description='Changes save automatically'
        actions={
          <button type='button' onClick={onClick}>
            Edit
          </button>
        }
      />,
    );
    const header = container.querySelector('header')!;
    expect(header).toHaveAttribute('data-tauri-drag-region');
    const title = container.querySelector('h1')!;
    const content = title.parentElement!;
    for (const element of [title, content, container.querySelector('span')!]) {
      const rect = element.getBoundingClientRect();
      if (!rect.width) continue;
      // Match native drag handling: only the actual pointer target is checked.
      expect(
        document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        ),
      ).toBe(header);
    }
    const button = page.getByRole('button', { name: 'Edit' });
    const rect = button.element().getBoundingClientRect();
    const target = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
    expect(target).toBe(button.element());
    expect(target).not.toHaveAttribute('data-tauri-drag-region');
    await button.click();
    expect(onClick).toHaveBeenCalledOnce();
  },
);
