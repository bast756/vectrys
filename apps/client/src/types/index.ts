// ============================================================
// VECTRYS — TypeScript Types
// Mirroir du Prisma Schema + API Response Types
// ============================================================

// ─── USER & AUTH ─────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  lang: string;
  avatar_url?: string;
  role: 'guest' | 'host' | 'owner' | 'admin';
  terms_accepted: boolean;
  cgu_accepted_at?: string;
  cgv_accepted_at?: string;
  rgpd_accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// ─── BOOKING & RESERVATION ───────────────────────────────────

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled';

export interface Reservation {
  id: string;
  booking_code: string;
  property_id: string;
  guest_id: string;
  status: BookingStatus;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  total_price: number;
  house_rules_accepted: boolean;
  rules_accepted_at?: string;
  checked_in_at?: string;
  checked_out_at?: string;
  created_at: string;
  updated_at: string;

  // Relations
  guest?: User;
  property?: Property;
}

// ─── PROPERTY ────────────────────────────────────────────────

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  zip_code?: string;
  country: string;
  lat: number;
  lng: number;

  // Welcome info
  wifi_ssid?: string;
  wifi_password?: string;
  house_rules?: string;
  check_in_instructions?: string;
  check_out_instructions?: string;
  parking_info?: string;
  garbage_info?: string;
  emergency_phone?: string;

  // Media
  photos: string[];
  image_urls?: string[];
  welcome_video_url?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

// ─── SERVICES ────────────────────────────────────────────────

export type ServiceCategory =
  | 'breakfast'
  | 'cleaning'
  | 'grocery'
  | 'transport'
  | 'experience'
  | 'equipment'
  | 'other';

export interface Service {
  id: string;
  property_id: string;
  category: ServiceCategory;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  available: boolean;
  preparation_time_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  service_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;

  // Relations
  service?: Service;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  reservation_id: string;
  status: OrderStatus;
  total_amount: number;
  delivery_notes?: string;
  delivery_time?: string;
  created_at: string;
  updated_at: string;
  client_secret?: string;
  stripe_payment_id?: string;

  // Relations
  items: OrderItem[];
}

// ─── CHAT ────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  conversation_id?: string;
  text: string;
  from: 'guest' | 'host' | 'system';
  timestamp: string;
  read: boolean;
  attachment_url?: string;
  translatedContent?: string | null;
}

export interface Conversation {
  id: string;
  reservation_id: string;
  last_message?: ChatMessage;
  unread_count: number;
  host_online: boolean;
}

// ─── REVIEWS ─────────────────────────────────────────────────

export interface Review {
  id: string;
  reservation_id: string;
  guest_id: string;
  rating: number;
  cleanliness_rating?: number;
  communication_rating?: number;
  value_rating?: number;
  comment?: string;
  created_at: string;
}

// ─── CHECKOUT ────────────────────────────────────────────────

export interface CheckoutTask {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  required: boolean;
  order: number;
}

// ─── TRANSPORT ───────────────────────────────────────────────

export interface TransportOption {
  id: string;
  type: 'train' | 'bus' | 'metro' | 'taxi' | 'car_rental';
  name: string;
  description: string;
  from_location: string;
  to_location: string;
  duration_minutes: number;
  price_range?: string;
  booking_url?: string;
  icon?: string;
}

// ─── WEATHER ─────────────────────────────────────────────────

export interface WeatherData {
  city: string;
  country: string;
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    description: string;
    icon: string;
    wind_speed: number;
  };
  forecast: Array<{
    date: string;
    temp_min: number;
    temp_max: number;
    description: string;
    icon: string;
    precipitation_probability: number;
  }>;
}

// ─── NOTIFICATIONS ───────────────────────────────────────────

export type NotificationType =
  | 'booking_confirmed'
  | 'checkin_reminder'
  | 'checkout_reminder'
  | 'service_delivered'
  | 'message_received'
  | 'review_request';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  created_at: string;
}

// ─── AI FEATURES ─────────────────────────────────────────────

export interface AITranslation {
  original_text: string;
  translated_text: string;
  source_lang: string;
  target_lang: string;
}

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIChatResponse {
  message: string;
  suggestions?: string[];
}

// ─── API RESPONSES ───────────────────────────────────────────

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    total_pages: number;
    per_page: number;
    total: number;
  };
}

// ─── ERROR TYPES ─────────────────────────────────────────────

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// ─── FORMS & VALIDATION ──────────────────────────────────────

export interface LoginForm {
  email: string;
  password: string;
}

export interface BookingCodeForm {
  code: string;
}

export interface TermsAcceptance {
  cguAccepted: boolean;
  rgpdAccepted: boolean;
}

export interface ProfileUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  lang?: string;
  avatar_url?: string;
}

export interface ReviewForm {
  rating: number;
  cleanliness_rating?: number;
  communication_rating?: number;
  value_rating?: number;
  comment?: string;
}

// ─── WEBSOCKET EVENTS ────────────────────────────────────────

export interface WsMessage {
  event: 'message' | 'typing' | 'presence' | 'error';
  data: any;
}

export interface WsTypingEvent {
  reservation_id: string;
  from: 'guest' | 'host';
  isTyping: boolean;
}

export interface WsPresenceEvent {
  reservation_id: string;
  user: 'host' | 'guest';
  online: boolean;
}

// ─── SUBSCRIPTION & BILLING ──────────────────────────────────

export type PlanId = 'free' | 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatusType = 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired';
export type BillingInterval = 'monthly' | 'yearly';

export interface PlanFeatures {
  max_properties: number;
  cleancheck_verifications: number;
  ai_responses: number;
  channel_sync: boolean;
  dynamic_pricing: boolean;
  white_label: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  monthly_price: number;
  yearly_price: number;
  monthly_price_cents: number;
  yearly_price_cents: number;
  features: PlanFeatures;
}

export interface SubscriptionInvoice {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  invoice_url?: string;
  invoice_pdf?: string;
  paid_at?: string;
  period_start?: string;
  period_end?: string;
}

export interface SubscriptionData {
  id?: string;
  plan: PlanId;
  status: SubscriptionStatusType;
  billing_interval: BillingInterval;
  trial_end?: string;
  trial_days_left?: number;
  current_period_start?: string;
  current_period_end?: string;
  cancelled_at?: string;
  features: PlanFeatures;
  invoices: SubscriptionInvoice[];
}
