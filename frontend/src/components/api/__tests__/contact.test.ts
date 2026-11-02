import { submitContactForm } from '../contact';
import { apiService } from '../../../services/__mocks__/api';

describe('submitContactForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('posts the note to the contact endpoint', async () => {
    const note = {
      name: 'Ada',
      email: 'ada@example.com',
      message: 'Hello from the form.',
    };

    await submitContactForm(note);

    expect(apiService.post).toHaveBeenCalledWith('/contact', note);
  });
});
