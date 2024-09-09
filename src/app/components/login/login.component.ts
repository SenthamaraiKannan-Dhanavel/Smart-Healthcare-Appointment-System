import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.authService.getUserRole() === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard']);
    }
  }

  onSubmit() {
    this.errorMessage = '';
    if (this.loginForm.valid) {
      this.isSubmitting = true;
      this.authService.login(this.loginForm.value).subscribe(
        response => {
          console.log('Login successful', response);
          const userRole = this.authService.getUserRole();
          if (userRole === 'doctor') {
            this.router.navigate(['/doctor-dashboard']);
          } else {
            this.router.navigate(['/patient-dashboard']);
          }
        },
        error => {
          console.error('Login failed', error);
          if (error.error && error.error.details) {
            if (error.error.details.non_field_errors) {
              this.errorMessage = 'Invalid username or password. Please try again.';
            } else {
              this.errorMessage = 'An error occurred during login. Please try again.';
            }
          } else {
            this.errorMessage = 'An unexpected error occurred. Please try again later.';
          }
          this.isSubmitting = false;
        }
      );
    } else {
      this.errorMessage = 'Please fill in all required fields correctly.';
    }
  }

  // Helper methods for template
  get usernameControl() { return this.loginForm.get('username'); }
  get passwordControl() { return this.loginForm.get('password'); }
}
