import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from '../useMediaQuery';

describe('useMediaQuery', () => {
  const listeners = new Set<(event: { matches: boolean }) => void>();
  let matches = false;

  beforeEach(() => {
    listeners.clear();
    matches = false;
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      media: query,
      get matches() {
        return matches;
      },
      addEventListener: (_event: string, listener: (event: { matches: boolean }) => void) => {
        listeners.add(listener);
      },
      removeEventListener: (_event: string, listener: (event: { matches: boolean }) => void) => {
        listeners.delete(listener);
      },
    }));
  });

  it('tracks the current match and later changes', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    act(() => {
      matches = true;
      listeners.forEach((listener) => listener({ matches: true }));
    });

    expect(result.current).toBe(true);
  });
});
