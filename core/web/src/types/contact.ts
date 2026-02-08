// =====================================================
// Contact Message Types
// =====================================================

import { CONTACT_MESSAGE_STATUS } from "@/lib/constants";

/**
 * Contact message status enum values
 */
export type ContactMessageStatus =
  (typeof CONTACT_MESSAGE_STATUS)[keyof typeof CONTACT_MESSAGE_STATUS];

/**
 * Contact message entity
 */
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Contact form submission data
 */
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Contact message query parameters
 */
export interface GetContactMessagesParams {
  page?: number;
  limit?: number;
  status?: ContactMessageStatus;
  search?: string;
  sortBy?: "createdAt" | "status";
  sortOrder?: "asc" | "desc";
}

/**
 * Update contact message data
 */
export interface UpdateContactMessageData {
  status?: ContactMessageStatus;
}

/**
 * Contact submission response
 */
export interface ContactSubmissionResponse {
  id: string;
  createdAt: string;
}
