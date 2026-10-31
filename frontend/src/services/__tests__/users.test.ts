import { userService } from '../users';
import { apiService } from '../__mocks__/api';

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists users and creates an account from the response envelope', async () => {
    (apiService.get as jest.Mock).mockResolvedValue({
      data: [{ id: 2, email: 'guest@example.com', role: 'guest' }],
    });
    (apiService.post as jest.Mock).mockResolvedValue({
      data: { id: 3, email: 'new@example.com', role: 'admin' },
    });

    const users = await userService.list();
    const created = await userService.create({
      email: 'new@example.com',
      password: 'long-password-1',
      role: 'admin',
    });

    expect(apiService.get).toHaveBeenCalledWith('/auth/users');
    expect(users[0].role).toBe('guest');
    expect(apiService.post).toHaveBeenCalledWith('/auth/users', {
      email: 'new@example.com',
      password: 'long-password-1',
      role: 'admin',
    });
    expect(created.id).toBe(3);
  });
});
