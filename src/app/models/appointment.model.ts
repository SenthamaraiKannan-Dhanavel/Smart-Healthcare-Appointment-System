export interface Appointment {
  id: number;
  patient: {
    username: string;
    full_name: string;
  };
  doctor: {
    id: number;
    username: string;
    full_name: string;
    specialty_name: string;
  };
  date: string;
  reason: string;
  status: string;
}