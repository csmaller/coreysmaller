import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '../useErrorHandler';

describe('useErrorHandler', () => {
  it('stores and clears an error', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.setError('Saved with a warning', 'warning');
    });

    expect(result.current.error).toMatchObject({
      message: 'Saved with a warning',
      type: 'warning',
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('returns the async result and records thrown errors', async () => {
    const { result } = renderHook(() => useErrorHandler());

    let value: string | null = null;
    await act(async () => {
      value = await result.current.handleAsyncError(async () => 'ok');
    });
    expect(value).toBe('ok');
    expect(result.current.error).toBeNull();

    let failed: string | null = 'untouched';
    await act(async () => {
      failed = await result.current.handleAsyncError(async () => {
        throw new Error('network down');
      });
    });
    expect(failed).toBeNull();
    expect(result.current.error?.message).toBe('network down');

    await act(async () => {
      await result.current.handleAsyncError(async () => {
        throw 'plain failure';
      }, 'Could not save');
    });
    expect(result.current.error?.message).toBe('Could not save');

    await act(async () => {
      await result.current.handleAsyncError(async () => {
        throw { message: 'from object' };
      });
    });
    expect(result.current.error?.message).toBe('from object');

    await act(async () => {
      await result.current.handleAsyncError(async () => {
        throw 404;
      });
    });
    expect(result.current.error?.message).toBe('An unexpected error occurred');
  });
});
