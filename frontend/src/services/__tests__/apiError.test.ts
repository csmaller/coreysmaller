import { ApiError, apiErrorFromResponse } from '../apiError';

function responseWith(status: number, json: () => Promise<unknown>): Response {
  return { status, statusText: 'Failed', json } as unknown as Response;
}

describe('apiErrorFromResponse', () => {
  it('keeps the status and validation errors from the response', async () => {
    const error = await apiErrorFromResponse(
      responseWith(400, async () => ({ message: 'Validation failed', errors: ['Please enter your name.', 7] }))
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Validation failed');
    expect(error.status).toBe(400);
    expect(error.errors).toEqual(['Please enter your name.']);
  });

  it('falls back to the status when the response is not JSON', async () => {
    const error = await apiErrorFromResponse(
      responseWith(502, async () => {
        throw new SyntaxError('Unexpected token <');
      })
    );

    expect(error.message).toBe('API Error: 502 Failed');
    expect(error.errors).toEqual([]);
  });
});
