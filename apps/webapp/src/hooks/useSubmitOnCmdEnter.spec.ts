import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSubmitOnCmdEnter } from './useSubmitOnCmdEnter';

function dispatchKeyDown(init: KeyboardEventInit) {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  document.dispatchEvent(event);
  return event;
}

describe('useSubmitOnCmdEnter', () => {
  it('fires onSubmit on Cmd+Enter (metaKey)', () => {
    const onSubmit = vi.fn();
    renderHook(() => useSubmitOnCmdEnter({ onSubmit }));

    const event = dispatchKeyDown({ key: 'Enter', metaKey: true });

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  it('fires onSubmit on Ctrl+Enter (ctrlKey)', () => {
    const onSubmit = vi.fn();
    renderHook(() => useSubmitOnCmdEnter({ onSubmit }));

    const event = dispatchKeyDown({ key: 'Enter', ctrlKey: true });

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  it('does NOT fire on plain Enter (no modifier)', () => {
    const onSubmit = vi.fn();
    renderHook(() => useSubmitOnCmdEnter({ onSubmit }));

    const event = dispatchKeyDown({ key: 'Enter' });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('does NOT fire on Cmd+Other key', () => {
    const onSubmit = vi.fn();
    renderHook(() => useSubmitOnCmdEnter({ onSubmit }));

    const event = dispatchKeyDown({ key: 's', metaKey: true });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('does NOT fire when disabled', () => {
    const onSubmit = vi.fn();
    renderHook(() => useSubmitOnCmdEnter({ onSubmit, disabled: true }));

    const event = dispatchKeyDown({ key: 'Enter', metaKey: true });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('does NOT fire while composing (IME)', () => {
    const onSubmit = vi.fn();
    renderHook(() => useSubmitOnCmdEnter({ onSubmit }));

    dispatchKeyDown({ key: 'Enter', metaKey: true, isComposing: true });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('unmount removes the listener', () => {
    const onSubmit = vi.fn();
    const { unmount } = renderHook(() => useSubmitOnCmdEnter({ onSubmit }));

    unmount();

    dispatchKeyDown({ key: 'Enter', metaKey: true });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('uses latest onSubmit and disabled between renders', () => {
    const firstOnSubmit = vi.fn();
    const secondOnSubmit = vi.fn();

    const { rerender } = renderHook(
      ({ onSubmit, disabled }) => useSubmitOnCmdEnter({ onSubmit, disabled }),
      { initialProps: { onSubmit: firstOnSubmit, disabled: true } },
    );

    // Disabled — shouldn't fire
    dispatchKeyDown({ key: 'Enter', metaKey: true });
    expect(firstOnSubmit).not.toHaveBeenCalled();

    // Re-render with new onSubmit and disabled=false
    rerender({ onSubmit: secondOnSubmit, disabled: false });

    dispatchKeyDown({ key: 'Enter', metaKey: true });
    expect(firstOnSubmit).not.toHaveBeenCalled();
    expect(secondOnSubmit).toHaveBeenCalledOnce();
  });
});
