import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Contact } from '../Contact';
import { submitContactForm } from '../../components/api/contact';

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
});
