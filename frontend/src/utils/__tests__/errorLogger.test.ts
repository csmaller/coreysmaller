import { errorLogger } from '../errorLogger';

describe('errorLogger', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('includes the signed-in user when one is stored', () => {
    localStorage.setItem('user', JSON.stringify({ id: '42' }));

    errorLogger.logError(new Error('broken'));

    expect(console.error).toHaveBeenCalledWith(
      'Error logged:',
      expect.objectContaining({ message: 'broken', userId: '42' })
    );
  });

  it('ignores a stored user that is not json', () => {
    localStorage.setItem('user', '{');

    errorLogger.logApiError('/blog', 'GET', 500, 'nope');

    expect(console.error).toHaveBeenCalledWith(
      'Error logged:',
      expect.objectContaining({
        message: 'API Error: GET /blog - 500 nope',
      })
    );
  });

  it('records warnings and user actions', () => {
    errorLogger.logWarning('slow query', { ms: 40 });
    errorLogger.logUserAction('opened post', { id: 7 });

    expect(console.warn).toHaveBeenCalledWith(
      'Warning logged:',
      expect.objectContaining({ message: 'slow query' })
    );
    expect(console.info).toHaveBeenCalledWith(
      'Info logged:',
      expect.objectContaining({ message: 'User Action: opened post' })
    );
  });
});
