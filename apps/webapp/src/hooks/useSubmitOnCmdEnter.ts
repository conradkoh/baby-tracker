'use client';

import { useEffect, useRef } from 'react';

type UseSubmitOnCmdEnterOptions = {
  onSubmit: () => void | Promise<void>;
  disabled?: boolean;
};

export function useSubmitOnCmdEnter({
  onSubmit,
  disabled,
}: UseSubmitOnCmdEnterOptions): void {
  const onSubmitRef = useRef(onSubmit);
  const disabledRef = useRef(disabled);

  onSubmitRef.current = onSubmit;
  disabledRef.current = disabled;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === 'Enter' &&
        (e.metaKey || e.ctrlKey) &&
        e.isComposing === false &&
        !disabledRef.current
      ) {
        e.preventDefault();
        void onSubmitRef.current();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
