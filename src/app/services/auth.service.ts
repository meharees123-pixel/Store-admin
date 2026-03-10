import { Injectable } from '@angular/core';

const TOKEN_KEY = 'store_admin_firebase_token';
const PHONE_KEY = 'store_admin_phone';

@Injectable({ providedIn: 'root' })
export class AuthService {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PHONE_KEY);
  }

  setPhone(phone: string): void {
    localStorage.setItem(PHONE_KEY, phone);
  }

  getPhone(): string | null {
    return localStorage.getItem(PHONE_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}

