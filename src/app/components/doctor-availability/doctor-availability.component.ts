import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HeaderComponent } from '../header/header.component';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-doctor-availability',
  templateUrl: './doctor-availability.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    HeaderComponent,
    MatCardModule,
    RouterModule
  ]
})
export class DoctorAvailabilityComponent implements OnInit {
  availabilities: any[] = [];
  newAvailability = {
    date: new Date(),
    start_time: '',
    end_time: '',
    is_available: true
  };
  timeSlots: string[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadAvailabilities();
    this.generateTimeSlots();
  }

  loadAvailabilities() {
    this.authService.getDoctorAvailabilities().subscribe(
      data => {
        this.availabilities = data;
      },
      error => console.error('Error loading availabilities:', error)
    );
  }

  generateTimeSlots() {
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date(2000, 0, 1, hour, minute);
        this.timeSlots.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      }
    }
  }

  addAvailability() {
    const formattedDate = this.formatDate(this.newAvailability.date);
    const availabilityData = {
      ...this.newAvailability,
      date: formattedDate,
      start_time: this.convertTo24Hour(this.newAvailability.start_time),
      end_time: this.convertTo24Hour(this.newAvailability.end_time)
    };

    this.authService.addDoctorAvailability(availabilityData).subscribe(
      data => {
        this.availabilities.push(data);
        this.newAvailability = {
          date: new Date(),
          start_time: '',
          end_time: '',
          is_available: true
        };
      },
      error => console.error('Error adding availability:', error)
    );
  }

  updateAvailability(availability: any) {
    this.authService.updateDoctorAvailability(availability.id, availability).subscribe(
      data => {
        const index = this.availabilities.findIndex(a => a.id === data.id);
        if (index !== -1) {
          this.availabilities[index] = data;
        }
      },
      error => console.error('Error updating availability:', error)
    );
  }

  deleteAvailability(id: number) {
    if (confirm('Are you sure you want to delete this availability?')) {
      this.authService.deleteDoctorAvailability(id).subscribe(
        () => {
          this.availabilities = this.availabilities.filter(a => a.id !== id);
        },
        error => console.error('Error deleting availability:', error)
      );
    }
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  private convertTo24Hour(time12h: string): string {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12 + '';
    }
    return `${hours.padStart(2, '0')}:${minutes}`;
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const date = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
}