export type NotificationChannel = 'email' | 'sms' | 'push';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface Notification {
  id: string;
  patientId: string;
  patientName: string;
  channel: NotificationChannel;
  message: string;
  status: NotificationStatus;
  sentAt?: string;
  orderId: string;
}

export interface NotificationConfig {
  emailEnabled: boolean;
  smsEnabled: boolean;
  email?: string;
  phone?: string;
}
