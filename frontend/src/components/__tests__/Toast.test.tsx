import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from '../Toast';

describe('Toast', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('announces success politely and dismisses itself', () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(<Toast kind="success" message="Sent." onDismiss={onDismiss} />);

    expect(screen.getByRole('status')).toHaveTextContent('Sent.');

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('keeps errors up until they are dismissed', async () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Toast kind="error" message="Failed." onDismiss={onDismiss} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Failed.');

    act(() => {
      jest.advanceTimersByTime(60000);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('cancels the dismiss timer when it unmounts', () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    const { unmount } = render(<Toast kind="success" message="Sent." onDismiss={onDismiss} />);

    unmount();
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
