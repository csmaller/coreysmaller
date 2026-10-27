import { authService } from '../auth';
import { apiService } from '../__mocks__/api';

describe('authService.getProfile', () => {
  it('reads the role from the API envelope so admin pages stay open', async () => {
    (apiService.get as jest.Mock).mockResolvedValue({
      data: { id: 1, email: 'me@example.com', role: 'admin' },
      success: true,
    });

    const user = await authService.getProfile();

    expect(user.role).toBe('admin');
    expect(user.email).toBe('me@example.com');
  });
});
