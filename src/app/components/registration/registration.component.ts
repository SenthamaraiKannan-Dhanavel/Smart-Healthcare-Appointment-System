import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent]
})
export class RegistrationComponent implements OnInit {
  registrationForm: FormGroup;
  errorMessage: string = '';
  specialties: any[] = [];
  errorMessages: string[] = [];

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private router: Router
  ) {
    this.registrationForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      isDoctor: [false],
      specialty: ['']
    });
  }

  ngOnInit() {
    this.loadSpecialties();
    this.registrationForm.get('isDoctor')?.valueChanges.subscribe(isDoctor => {
      const specialtyControl = this.registrationForm.get('specialty');
      if (isDoctor) {
        specialtyControl?.setValidators(Validators.required);
      } else {
        specialtyControl?.clearValidators();
      }
      specialtyControl?.updateValueAndValidity();
    });
  }

  loadSpecialties() {
    console.log('Loading specialties...');
    this.authService.getSpecialties().subscribe(
      (specialties) => {
        console.log('Received specialties:', specialties);
        this.specialties = specialties;
      },
      (error) => {
        console.error('Error loading specialties:', error);
      }
    );
  }

  onSubmit() {
    this.errorMessages = [];
    if (this.registrationForm.valid) {
      const userData = {
        username: this.registrationForm.get('username')?.value,
        email: this.registrationForm.get('email')?.value,
        password: this.registrationForm.get('password')?.value,
        is_doctor: this.registrationForm.get('isDoctor')?.value,
        specialty: this.registrationForm.get('specialty')?.value
      };
      this.authService.register(userData).subscribe(
        response => {
          console.log('Registration successful', response);
          this.router.navigate(['/login']);
        },
        (error: Error) => {
          console.error('Registration failed', error);
          this.errorMessages.push(error.message);
        }
      );
    } else {
      this.errorMessages.push('Please fill in all required fields correctly.');
    }
  }
}
