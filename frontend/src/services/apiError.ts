// Error thrown for non-2xx API responses, keeping the details the UI may need
export class ApiError extends Error {
  readonly status: number;
  readonly errors: string[];

  constructor(message: string, status: number, errors: string[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export async function apiErrorFromResponse(response: Response): Promise<ApiError> {
  let message = `API Error: ${response.status} ${response.statusText}`;
  let errors: string[] = [];

  try {
    const errorData = await response.json();
    if (errorData.message) {
      message = errorData.message;
    }
    if (Array.isArray(errorData.errors)) {
      errors = errorData.errors.filter((item: unknown): item is string => typeof item === 'string');
    }
  } catch {
    // Use default error message if response is not JSON
  }

  return new ApiError(message, response.status, errors);
}
