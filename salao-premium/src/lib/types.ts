export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

export interface BusinessSettings {
  id: number;
  name: string;
  tagline: string;
  logo_url: string | null;
  hero_image_url: string | null;
  about_image_url: string | null;
  description: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  timezone: string;
  slot_interval_minutes: number;
  min_advance_minutes: number;
  max_advance_days: number;
  auto_confirm: boolean;
  cancellation_policy: string | null;
  updated_at: string;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  duration_minutes: number;
  price_cents: number;
  price_from: boolean;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Professional {
  id: string;
  slug: string;
  name: string;
  specialty: string | null;
  bio: string | null;
  photo_url: string | null;
  instagram: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface ProfessionalWithServices extends Professional {
  service_ids: string[];
}

export interface WorkingHour {
  id: string;
  professional_id: string | null;
  weekday: number;
  start_time: string; // "HH:MM:SS"
  end_time: string;
}

export interface BlockedTime {
  id: string;
  professional_id: string | null;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  code: string;
  professional_id: string;
  customer_name: string;
  customer_phone: string;
  customer_whatsapp: string;
  customer_email: string | null;
  notes: string | null;
  starts_at: string;
  ends_at: string;
  total_duration_minutes: number;
  total_price_cents: number;
  status: AppointmentStatus;
  any_professional: boolean;
  cancelled_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentService {
  appointment_id: string;
  service_id: string | null;
  position: number;
  service_name: string;
  price_cents: number;
  duration_minutes: number;
}

export interface AppointmentEvent {
  id: number;
  appointment_id: string;
  action: string;
  from_status: AppointmentStatus | null;
  to_status: AppointmentStatus | null;
  details: Record<string, unknown> | null;
  actor_id: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  author_name: string;
  photo_url: string | null;
  rating: number;
  comment: string;
  review_date: string;
  source: string | null;
  is_published: boolean;
}

export interface GalleryImage {
  id: string;
  image_url: string;
  alt: string;
  category: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface BusyInterval {
  professional_id: string | null;
  starts_at: string;
  ends_at: string;
  kind: "appointment" | "block";
}

/** Resultado público do agendamento (sem dados de outros clientes). */
export interface BookingResult {
  appointmentId: string;
  code: string;
  professionalId: string;
  professionalName: string;
  startsAt: string;
  endsAt: string;
  totalDurationMinutes: number;
  totalPriceCents: number;
  status: AppointmentStatus;
  emailSent: boolean;
}
