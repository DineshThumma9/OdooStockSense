import { apiClient } from './client';

export interface UserRead {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'staff';
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserRead;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<TokenResponse>('/auth/login', { email, password }).then((r) => r.data),

  signup: (name: string, email: string, password: string, role: 'manager' | 'staff' = 'staff') =>
    apiClient.post<TokenResponse>('/auth/signup', { name, email, password, role }).then((r) => r.data),

  requestOtp: (email: string) =>
    apiClient.post<{ message: string }>('/auth/reset/request', { email }).then((r) => r.data),

  verifyOtp: (email: string, otp: string) =>
    apiClient.post<{ valid: boolean }>('/auth/reset/verify', { email, otp }).then((r) => r.data),

  resetPassword: (email: string, otp: string, new_password: string) =>
    apiClient.post<{ message: string }>('/auth/reset/confirm', { email, otp, new_password }).then((r) => r.data),

  getProfile: () =>
    apiClient.get<UserRead>('/profile').then((r) => r.data),
};
