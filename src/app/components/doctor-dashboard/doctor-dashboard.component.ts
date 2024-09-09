import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { RouterModule } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';

interface Appointment {
  id: number;
  patient: {
    username: string;
    full_name: string;
  };
  date: string;
  reason: string;
  status: string;
}

@Component({
  selector: 'app-doctor-dashboard',
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, HeaderComponent, RouterModule, MatExpansionModule]
})
export class DoctorDashboardComponent implements OnInit, OnDestroy {
  currentAppointments: Appointment[] = [];
  canceledAppointments: Appointment[] = [];
  errorMessage: string = '';
  private wsSubscription: Subscription = new Subscription();
  
  // Add this line to control the expansion panel state
  currentAppointmentsExpanded: boolean = true;

  constructor(private authService: AuthService, private webSocketService: WebSocketService) {}

  ngOnInit() {
    this.loadAppointments();
    this.setupWebSocket();
  }

  ngOnDestroy() {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    this.webSocketService.close(); // Changed from websocketService to webSocketService
  }

  setupWebSocket() {
    this.webSocketService.connect();
    this.wsSubscription = this.webSocketService.connect().subscribe(
      (message: any) => {
        console.log('Received WebSocket message:', message);
        switch (message.action) {
          case 'appointment_booked':
            this.handleNewAppointment(message.appointment);
            break;
          case 'appointment_cancelled':
            this.handleCancelledAppointment(message.appointment_id);
            break;
          case 'appointment_rescheduled':
            this.handleRescheduledAppointment(message.appointment);
            break;
        }
      },
      (error: Error) => console.error('WebSocket error:', error)
    );
  }

  handleNewAppointment(appointment: Appointment) {
    this.currentAppointments.unshift(appointment);
    this.sortAppointments();
  }

  handleCancelledAppointment(appointmentId: number) {
    const canceledAppointment = this.currentAppointments.find(a => a.id === appointmentId);
    if (canceledAppointment) {
      canceledAppointment.status = 'Cancelled';
      this.canceledAppointments.unshift(canceledAppointment);
      this.currentAppointments = this.currentAppointments.filter(a => a.id !== appointmentId);
      this.sortAppointments();
    }
  }

  handleRescheduledAppointment(updatedAppointment: Appointment) {
    const index = this.currentAppointments.findIndex(a => a.id === updatedAppointment.id);
    if (index !== -1) {
      this.currentAppointments[index] = updatedAppointment;
      this.sortAppointments();
    }
  }

  loadAppointments() {
    this.authService.getDoctorDashboard().subscribe(
      data => {
        console.log('Doctor dashboard data:', data);
        this.currentAppointments = data.appointments.filter((a: Appointment) => a.status !== 'Cancelled') || [];
        this.canceledAppointments = data.appointments.filter((a: Appointment) => a.status === 'Cancelled') || [];
        this.sortAppointments();
      },
      error => {
        console.error('Error fetching doctor dashboard:', error);
        this.errorMessage = 'Failed to load dashboard. Please try again later.';
      }
    );
  }

  sortAppointments() {
    this.currentAppointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.canceledAppointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  cancelAppointment(appointmentId: number) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.authService.cancelAppointment(appointmentId).subscribe(
        () => {
          console.log('Appointment cancelled successfully');
          this.handleCancelledAppointment(appointmentId);
        },
        error => {
          console.error('Error cancelling appointment:', error);
          this.errorMessage = 'Failed to cancel appointment. Please try again later.';
        }
      );
    }
  }

  formatAppointmentDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });
  }
}

