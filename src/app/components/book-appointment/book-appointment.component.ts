import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import jQuery from 'jquery';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HeaderComponent } from '../header/header.component';
import { RouterModule } from '@angular/router';

interface TimeSlot {
  time: string;
  available: boolean;
}

@Component({
  selector: 'app-book-appointment',
  templateUrl: './book-appointment.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    RouterModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule
  ]
})
export class BookAppointmentComponent implements OnInit, OnDestroy {
  specialties: any[] = [];
  doctors: any[] = [];
  selectedSpecialty: string = '';
  selectedDoctor: any = null;
  appointmentDate: Date | null = null;
  appointmentTime: string = '';
  reason: string = '';
  timeSlots: TimeSlot[] = [];

  // private wsSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    // private websocketService: WebsocketService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadSpecialties();
    // this.setupWebSocket();
    this.setupJQueryListeners();
  }

  ngOnDestroy() {
    // if (this.wsSubscription) {
    //   this.wsSubscription.unsubscribe();
    // }
    // this.websocketService.closeConnection();
  }

  // Comment out or remove the setupWebSocket method

  setupJQueryListeners() {
    jQuery('#specialtySelect').on('change', () => {
      this.onSpecialtyChange();
    });

    jQuery('#doctorSelect').on('change', () => {
      this.onDoctorChange();
    });

    jQuery('#appointmentDate').on('change', () => {
      this.onDateChange();
    });
  }

  loadSpecialties() {
    this.authService.getSpecialties().subscribe(
      data => {
        console.log('Received specialties:', data);
        this.specialties = data;
      },
      error => console.error('Error loading specialties:', error)
    );
  }

  onSpecialtyChange() {
    console.log('Selected specialty:', this.selectedSpecialty);
    if (this.selectedSpecialty) {
      this.authService.getDoctorsBySpecialty(this.selectedSpecialty).subscribe(
        data => {
          console.log('Received doctors:', data);
          this.doctors = data;
          if (this.doctors.length === 0) {
            console.log('No doctors found for the selected specialty');
            // You can show a message to the user here
          }
        },
        error => {
          console.error('Error fetching doctors:', error);
          // Handle the error (e.g., show an error message to the user)
        }
      );
    } else {
      this.doctors = [];
    }
    this.selectedDoctor = null;
    this.appointmentDate = null;
    this.appointmentTime = '';
    this.timeSlots = [];
  }

  onDoctorChange() {
    this.appointmentDate = null;
    this.appointmentTime = '';
    this.timeSlots = [];
  }

  onDateChange() {
    console.log('Date changed:', this.appointmentDate); // Add this line for debugging
    if (this.selectedDoctor && this.appointmentDate) {
      this.loadAvailableSlots();
    }
  }

  loadAvailableSlots() {
    if (this.selectedDoctor && this.appointmentDate) {
      const formattedDate = this.formatDate(this.appointmentDate);
      console.log('Loading available slots for doctor:', this.selectedDoctor, 'on date:', formattedDate);
      this.authService.getDoctorAvailableSlots(this.selectedDoctor, formattedDate).subscribe(
        data => {
          console.log('Received available slots:', data);
          this.timeSlots = data.all_slots;
          this.updateTimeSlotsUI();
        },
        error => console.error('Error fetching available slots:', error)
      );
    } else {
      console.log('Cannot load available slots: doctor or date not selected');
    }
  }

  updateTimeSlotsUI() {
    const $timeSelect = jQuery('#timeSelect');
    $timeSelect.empty();
    this.timeSlots.forEach(slot => {
      const $option = jQuery('<option>', {
        value: slot.time,
        text: this.formatTime(slot.time),
        disabled: !slot.available
      });
      $timeSelect.append($option);
    });
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

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date(2000, 0, 1, hours, minutes);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  bookAppointment() {
    if (!this.selectedDoctor || !this.appointmentDate || !this.appointmentTime || !this.reason) {
      console.error('All fields are required');
      return;
    }

    const [hours, minutes] = this.appointmentTime.split(':').map(Number);
    const appointmentDateTime = new Date(
      Date.UTC(
        this.appointmentDate.getFullYear(),
        this.appointmentDate.getMonth(),
        this.appointmentDate.getDate(),
        hours,
        minutes
      )
    );

    const appointmentData = {
      doctor: this.selectedDoctor,
      date: appointmentDateTime.toISOString(),
      reason: this.reason
    };

    console.log('Sending appointment data:', appointmentData);

    this.authService.bookAppointment(appointmentData).subscribe(
      response => {
        console.log('Appointment booked successfully:', response);
        this.router.navigate(['/patient-dashboard']);
      },
      error => {
        console.error('Error booking appointment:', error);
        if (error.error && error.error.error) {
          alert(error.error.error);
        } else {
          alert('An error occurred while booking the appointment. Please try again.');
        }
      }
    ).add(() => {
      this.loadAvailableSlots();
    });
  }

  isFormValid(): boolean {
    return this.selectedSpecialty && this.selectedDoctor && this.appointmentDate && 
           this.appointmentTime && this.reason;
  }
}