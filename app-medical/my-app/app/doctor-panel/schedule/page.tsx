import { redirect } from 'next/navigation';

// Weekly schedule was replaced by per-chamber schedules.
export default function DoctorSchedulePage() {
  redirect('/doctor-panel/chambers');
}
