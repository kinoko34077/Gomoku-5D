import { useEffect, useRef, useState } from 'react';

export function useDebugModeToggle(initialValue = false) {
  const [debugMode, setDebugMode] = useState(initialValue);
  const debugChordRef = useRef('');
  const debugPivotHeldRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

      const key = event.key.toUpperCase();
      if (key === 'P') {
        debugPivotHeldRef.current = true;
        debugChordRef.current = '';
        return;
      }

      if (!debugPivotHeldRef.current || key.length !== 1 || key < 'A' || key > 'Z') return;
      debugChordRef.current = (debugChordRef.current + key).slice(-5);
      if (debugChordRef.current === 'DEBUG') {
        event.preventDefault();
        setDebugMode(prev => !prev);
        debugChordRef.current = '';
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key.toUpperCase() === 'P') {
        debugPivotHeldRef.current = false;
        debugChordRef.current = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return { debugMode, setDebugMode };
}
