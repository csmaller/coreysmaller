import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Contact } from '../Contact';
import { submitContactForm } from '../../components/api/contact';
import { ApiError } from '../../services/apiError';

jest.mock('../../utils/seo', () => ({
  generateTitle: (title?: string) => title || 'Corey Smaller',
  generateCanonicalUrl: () => 'https://coreysmaller.com',
  generateOpenGraphTags: () => [],
  generateTwitterTags: () => [],
  generateRobotsTag: () => 'index,follow',
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuthContext: () => ({
    isAuthenticated: false,
    user: null,
    logout: jest.fn(),
    login: jest.fn(),
    isLoading: false,
    error: null,
    clearError: jest.fn(),
  }),
}));

jest.mock('../../components/api/contact', () => ({
  submitContactForm: jest.fn(),
}));

describe('Contact page', () => {
  beforeEach(() => {
    (submitContactForm as jest.Mock).mockReset();
    (submitContactForm as jest.Mock).mockResolvedValue(undefined);
  });

  it('uses the poster form and a nav link to this page', () => {
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Say hi.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');
    expect(screen.getByRole('link', { name: 'Send a note' })).toHaveAttribute('href', '/contact');
    expect(screen.getByLabelText('Name')).toHaveClass('field');
    expect(screen.getByRole('button', { name: 'Send message' })).toHaveClass('btn', 'btn-primary');
  });

  it('sends a valid note and shows the thanks message', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Name'), 'Ada');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Message'), 'Hello from the form.');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(submitContactForm).toHaveBeenCalledWith({
      name: 'Ada',
      email: 'ada@example.com',
      message: 'Hello from the form.',
    });
    expect(await screen.findByText('Thanks! Your message has been sent.')).toBeInTheDocument();
  });

  it('keeps an incomplete note on the page', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(submitContactForm).not.toHaveBeenCalled();
    expect(screen.getByText('Please enter your name.')).toBeInTheDocument();
  });

  it('shows an error when the note cannot be sent', async () => {
    (submitContactForm as jest.Mock).mockRejectedValue(new Error('mail failed'));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Name'), 'Ada');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Message'), 'Hello from the form.');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText('Sorry, your message could not be sent. Please try again.')).toBeInTheDocument();
  });

  async function submitValidNote() {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Name'), 'Ada');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Message'), 'Hello from the form.');
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    return user;
  }

  it('shows a success toast and clears the form', async () => {
    await submitValidNote();

    expect(await screen.findByRole('status')).toHaveTextContent('Thanks! Your message has been sent.');
    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(screen.getByLabelText('Message')).toHaveValue('');
  });

  it('shows the specific validation errors from the server and keeps the note', async () => {
    (submitContactForm as jest.Mock).mockRejectedValue(
      new ApiError('Validation failed', 400, [
        'Your name may not contain < or > characters.',
        'Your message may not be greater than 5000 characters.',
      ])
    );

    await submitValidNote();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your name may not contain < or > characters. Your message may not be greater than 5000 characters.'
    );
    expect(screen.getByLabelText('Message')).toHaveValue('Hello from the form.');
  });

  it('shows the rate limit message from the server', async () => {
    (submitContactForm as jest.Mock).mockRejectedValue(
      new ApiError('Too many requests. Please try again later.', 429)
    );

    await submitValidNote();

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many requests. Please try again later.');
  });

  it('does not show raw server errors', async () => {
    (submitContactForm as jest.Mock).mockRejectedValue(new ApiError('API Error: 502 Bad Gateway', 502));

    await submitValidNote();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sorry, your message could not be sent. Please try again.'
    );
  });

  it('explains when the server cannot be reached', async () => {
    (submitContactForm as jest.Mock).mockRejectedValue(new TypeError('Failed to fetch'));

    await submitValidNote();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not reach the server. Please check your connection and try again.'
    );
  });

  it('clears an error toast when the note is resent', async () => {
    (submitContactForm as jest.Mock).mockRejectedValueOnce(new Error('mail failed'));

    const user = await submitValidNote();
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Thanks! Your message has been sent.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('sends the honeypot only when it has been filled in', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Name'), 'Bot');
    await user.type(screen.getByLabelText('Email'), 'bot@example.com');
    await user.type(screen.getByLabelText('Message'), 'Buy things.');
    await user.type(container.querySelector('input[name="website"]') as HTMLInputElement, 'https://spam.example.com');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(submitContactForm).toHaveBeenCalledWith({
      name: 'Bot',
      email: 'bot@example.com',
      message: 'Buy things.',
      website: 'https://spam.example.com',
    });
  });
});
