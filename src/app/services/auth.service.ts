import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Appointment } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api/users/';
  private userRole: string | null = null;

  constructor(private http: HttpClient, private router: Router) { }

  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}register/`, user).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.error && typeof error.error === 'object') {
          const errorMessages = Object.values(error.error).flat();
          return throwError(() => new Error(errorMessages.join(' ')));
        }
        return throwError(() => new Error('An unexpected error occurred'));
      })
    );
  }

  login(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}login/`, user).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          this.userRole = response.is_doctor ? 'doctor' : 'patient';
          localStorage.setItem('userRole', this.userRole);
        }
      })
    );
  }

  getUserRole(): string | null {
    return this.userRole || localStorage.getItem('userRole');
  }

  getPatientDashboard(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}patient-dashboard/`, this.getAuthHeaders());
  }

  getDoctorDashboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}doctor-dashboard/`, this.getAuthHeaders());
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    this.userRole = null;
    this.router.navigate(['/login']);
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      })
    };
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getSpecialties(): Observable<any> {
    return this.http.get(`${this.apiUrl}specialties/`);
  }

  getDoctorsBySpecialty(specialtyId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}doctors-by-specialty/?specialty=${specialtyId}`, this.getAuthHeaders()).pipe(
      tap(response => console.log('Doctors by specialty response:', response)),
      catchError(error => {
        console.error('Error in getDoctorsBySpecialty:', error);
        return throwError(error);
      })
    );
  }

  bookAppointment(appointmentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}book-appointment/`, appointmentData, this.getAuthHeaders());
  }

  cancelAppointment(appointmentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}cancel-appointment/${appointmentId}/`, {}, this.getAuthHeaders());
  }

  rescheduleAppointment(appointmentId: number, newDate: string): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}reschedule-appointment/${appointmentId}/`, { date: newDate }, this.getAuthHeaders());
  }

  getDoctorAvailabilities(): Observable<any> {
    return this.http.get(`${this.apiUrl}doctor-availability/`, this.getAuthHeaders());
  }

  addDoctorAvailability(availability: any): Observable<any> {
    return this.http.post(`${this.apiUrl}doctor-availability/`, availability, this.getAuthHeaders());
  }

  updateDoctorAvailability(id: number, availability: any): Observable<any> {
    return this.http.put(`${this.apiUrl}doctor-availability/${id}/`, availability, this.getAuthHeaders());
  }

  deleteDoctorAvailability(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}doctor-availability/${id}/`, this.getAuthHeaders());
  }

  getDoctorAvailableSlots(doctorId: string, date: string): Observable<any> {
    console.log(`Fetching available slots for doctor ${doctorId} on ${date}`);
    return this.http.get(`${this.apiUrl}doctor-available-slots/${doctorId}/${date}/`, this.getAuthHeaders()).pipe(
      tap(response => console.log('Doctor available slots response:', response)),
      catchError(error => {
        console.error('Error in getDoctorAvailableSlots:', error);
        return throwError(() => error);
      })
    );
  }
}
