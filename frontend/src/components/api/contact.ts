import { apiService } from '../../services/api';

export interface ContactSubmission {
  name: string;
  email: string;
  message: string;
  website?: string;
}

export async function submitContactForm(values: ContactSubmission): Promise<void> {
  await apiService.post('/contact', values);
}
