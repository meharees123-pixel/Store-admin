import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  mobileNumber = '';
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
  ) {}

  submit(): void {
    this.errorMessage = '';
    if (!this.mobileNumber.trim()) {
      this.errorMessage = 'Phone number is required.';
      return;
    }

    this.isSubmitting = true;
    this.api
      .login({ mobileNumber: this.mobileNumber.trim() })
      .subscribe({
        next: (user) => {
          const token = user?.firebaseToken;
          if (!token) {
            this.errorMessage = 'Login succeeded but no token was returned.';
            return;
          }
          this.auth.setPhone(this.mobileNumber.trim());
          this.auth.setToken(String(token));
          this.router.navigateByUrl('/dashboard');
        },
        error: (err) => {
          const msg = err?.error?.message;
          this.errorMessage = msg ? String(msg) : 'Login failed.';
        },
        complete: () => {
          this.isSubmitting = false;
        },
      });
  }
}
