import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../ErrorBoundary';

function MaybeBoom({ crash }: { crash: boolean }) {
  if (crash) {
    throw new Error('boom');
  }
  return <div>Recovered</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <div>Quiet</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Quiet')).toBeInTheDocument();
  });

  it('shows a fallback and can retry', async () => {
    const user = userEvent.setup();
    let crash = true;

    const { rerender } = render(
      <ErrorBoundary>
        <MaybeBoom crash={crash} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    crash = false;
    rerender(
      <ErrorBoundary>
        <MaybeBoom crash={crash} />
      </ErrorBoundary>
    );

    await user.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });

  it('uses a custom fallback when one is provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <MaybeBoom crash />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });
});
