import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { RouterModule } from '@angular/router';
import { RescheduleAppointmentComponent } from '../reschedule-appointment/reschedule-appointment.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { WebSocketService } from '../../services/websocket.service';
import { Subscription } from 'rxjs';
import { Appointment } from '../../models/appointment.model';

@Component({
  selector: 'app-patient-dashboard',
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, HeaderComponent, RouterModule, RescheduleAppointmentComponent, MatDialogModule]
})
export class PatientDashboardComponent implements OnInit, OnDestroy {
  appointments: Appointment[] = [];
  errorMessage: string = '';
  private wsSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private webSocketService: WebSocketService,
    private dialog: MatDialog,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAppointments();
    this.setupWebSocket();
  }

  ngOnDestroy() {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    this.webSocketService.close();
  }

  setupWebSocket() {
    this.webSocketService.connect();
    this.wsSubscription = this.webSocketService.messages$.subscribe(
      (message: any) => {
        console.log('Received WebSocket message:', message);
        if (message.action === 'appointment_update') {
          this.handleAppointmentUpdate(message.appointment);
        }
      },
      error => console.error('WebSocket error:', error)
    );
  }

  handleAppointmentUpdate(updatedAppointment: Appointment) {
    const index = this.appointments.findIndex(a => a.id === updatedAppointment.id);
    if (index !== -1) {
      this.appointments[index] = updatedAppointment;
    } else {
      this.appointments.push(updatedAppointment);
    }
    this.changeDetectorRef.detectChanges();
  }

  loadAppointments() {
    this.authService.getPatientDashboard().subscribe(
      data => {
        console.log('Patient dashboard data:', data);
        this.appointments = data.appointments.filter((appointment: Appointment) => appointment.status !== 'Cancelled') || [];
        this.changeDetectorRef.detectChanges();
      },
      error => {
        console.error('Error fetching patient dashboard:', error);
        this.errorMessage = 'Failed to load appointments. Please try again later.';
      }
    );
  }

  cancelAppointment(appointmentId: number) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.authService.cancelAppointment(appointmentId).subscribe(
        () => {
          console.log('Appointment cancelled successfully');
          this.appointments = this.appointments.filter(a => a.id !== appointmentId);
          this.changeDetectorRef.detectChanges();
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

  rescheduleAppointment(appointment: Appointment) {
    const dialogRef = this.dialog.open(RescheduleAppointmentComponent, {
      width: '400px',
      data: { appointment: appointment }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const index = this.appointments.findIndex(a => a.id === result.id);
        if (index !== -1) {
          this.appointments[index] = result;
          this.appointments = [...this.appointments]; // Trigger change detection
        }
      }
      this.loadAppointments(); // Reload all appointments to ensure consistency
    });
  }
}
