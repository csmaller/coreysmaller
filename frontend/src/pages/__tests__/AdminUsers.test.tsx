import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminUsers } from '../AdminUsers';

jest.mock('../../services/users', () => ({
  userService: {
    list: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 2, email: 'guest@example.com', role: 'guest' }),
  },
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuthContext: () => ({ user: { email: 'me@example.com', role: 'admin' }, logout: jest.fn() }),
}));

import { userService } from '../../services/users';

describe('AdminUsers', () => {
  it('creates a user with email, password, and level', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminUsers />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Email'), 'guest@example.com');
    await user.type(screen.getByLabelText('Password'), 'a-long-password');
    await user.selectOptions(screen.getByLabelText('User level'), 'guest');
    await user.click(screen.getByRole('button', { name: 'Create user' }));

    expect(userService.create).toHaveBeenCalledWith({
      email: 'guest@example.com',
      password: 'a-long-password',
      role: 'guest',
    });
  });
});
