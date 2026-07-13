import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CaptchaHost } from '../src/CaptchaHost.js';
import type { CaptchaPlugin } from '@funnycaptcha/core';

const fakePlugin: CaptchaPlugin = {
  id: 'fake',
  category: 'recognize',
  create: (container) => {
    container.innerHTML = '<div data-testid="fake-mount">fake</div>';
    return {
      mount() {}, reset() {}, destroy() {}, onResult() {},
    };
  },
  describe: () => ({ name: 'fake', description: '', tags: [] }),
};

describe('CaptchaHost', () => {
  it('mounts plugin into container', () => {
    render(<CaptchaHost plugin={fakePlugin} config={{ locale: 'zh', theme: 'light' }} />);
    expect(screen.getByTestId('fake-mount')).toBeInTheDocument();
  });
  it('renders nothing visible before mount (container exists)', () => {
    const { container } = render(<CaptchaHost plugin={fakePlugin} config={{ locale: 'en', theme: 'dark' }} />);
    expect(container.firstChild).not.toBeNull();
  });
});
