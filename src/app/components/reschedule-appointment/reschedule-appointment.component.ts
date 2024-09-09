import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../services/auth.service';
import { Appointment } from '../../models/appointment.model';

@Component({
  selector: 'app-reschedule-appointment',
  templateUrl: './reschedule-appointment.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatNativeDateModule,
    MatSelectModule,
    MatFormFieldModule
  ]
})
export class RescheduleAppointmentComponent implements OnInit {
  newDate: Date;
  timeSlots: any[] = [];
  selectedTime: string = '';
  minDate: Date = new Date(); // Set to today's date

  constructor(
    public dialogRef: MatDialogRef<RescheduleAppointmentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { appointment: Appointment },
    private authService: AuthService
  ) {
    this.newDate = new Date(this.data.appointment.date);
  }

  ngOnInit() {
    this.loadAvailableSlots();
  }

  onDateChange() {
    this.loadAvailableSlots();
  }

  loadAvailableSlots() {
    const formattedDate = this.formatDate(this.newDate);
    const doctorId = this.data.appointment.doctor.id || this.data.appointment.doctor.username;
    this.authService.getDoctorAvailableSlots(doctorId.toString(), formattedDate).subscribe(
      data => {
        this.timeSlots = data.all_slots;
        const currentTime = new Date(this.data.appointment.date).toTimeString().slice(0, 5);
        if (this.timeSlots.find(slot => slot.time === currentTime && slot.available)) {
          this.selectedTime = currentTime;
        } else {
          this.selectedTime = '';
        }
      },
      error => console.error('Error fetching available slots:', error)
    );
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onReschedule(): void {
    if (this.newDate && this.selectedTime) {
      const [hours, minutes] = this.selectedTime.split(':');
      const rescheduleDate = new Date(
        Date.UTC(
          this.newDate.getFullYear(),
          this.newDate.getMonth(),
          this.newDate.getDate(),
          parseInt(hours),
          parseInt(minutes)
        )
      );
      const isoDateTime = rescheduleDate.toISOString();
      this.authService.rescheduleAppointment(this.data.appointment.id, isoDateTime).subscribe(
        (updatedAppointment: Appointment) => {
          console.log('Appointment rescheduled successfully:', updatedAppointment);
          this.dialogRef.close(updatedAppointment);
        },
        error => {
          console.error('Error rescheduling appointment:', error);
          // Handle error (e.g., show an error message to the user)
          this.dialogRef.close(null);
        }
      );
    } else {
      this.dialogRef.close(null);
    }
  }

  isRescheduleDisabled(): boolean {
    return !this.newDate || !this.selectedTime;
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date(2000, 0, 1, hours, minutes);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
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
}