import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useEffect, useState } from 'react';

function SimpleWithEffect() {
  const [val, setVal] = useState('initial');
  useEffect(() => {
    setVal('updated');
  }, []);
  return <div data-testid="val">{val}</div>;
}

function JustDiv() {
  return <div data-testid="plain">plain</div>;
}

describe('Debug hooks', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders plain div', async () => {
    await act(async () => {
      render(<JustDiv />);
    });
    console.log('plain div body:', JSON.stringify(document.body.innerHTML));
    expect(screen.getByTestId('plain')).toBeInTheDocument();
  });

  it('renders component with useEffect', async () => {
    await act(async () => {
      render(<SimpleWithEffect />);
    });
    console.log('useEffect body:', JSON.stringify(document.body.innerHTML));
    const el = screen.queryByTestId('val');
    console.log('found val element:', el?.textContent);
    await waitFor(() => {
      expect(screen.getByTestId('val')).toHaveTextContent('updated');
    });
  });
});
