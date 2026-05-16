import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Debug render', () => {
  it('with act wrapper', async () => {
    await act(async () => {
      render(<div data-testid="foo">hello</div>);
    });
    const html = document.body.innerHTML;
    console.log('body after act:', JSON.stringify(html));
    const el = screen.queryByTestId('foo');
    console.log('found after act:', el);
    expect(el).not.toBeNull();
  });

  it('with waitFor', async () => {
    render(<div data-testid="bar">world</div>);
    await waitFor(() => {
      expect(screen.getByTestId('bar')).toBeInTheDocument();
    });
  });

  it('check after microtask', async () => {
    render(<div data-testid="baz">test</div>);
    await new Promise(r => setTimeout(r, 0));
    console.log('body after microtask:', JSON.stringify(document.body.innerHTML));
    const el = screen.queryByTestId('baz');
    console.log('found after microtask:', el);
  });
});
