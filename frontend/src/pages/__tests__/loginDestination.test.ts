import { loginDestination } from '../Login';

describe('loginDestination', () => {
  it('sends an admin to the dashboard', () => {
    expect(loginDestination('admin')).toBe('/admin');
    expect(loginDestination('admin', '/admin/blog')).toBe('/admin/blog');
  });

  it('sends a guest to the blog so private posts are visible', () => {
    expect(loginDestination('guest')).toBe('/blog');
    expect(loginDestination('guest', '/admin')).toBe('/blog');
  });
});
