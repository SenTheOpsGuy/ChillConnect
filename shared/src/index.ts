// Shared types and utilities for ChillConnect platform

export enum UserRole {
  SEEKER = 'SEEKER',
  PROVIDER = 'PROVIDER',
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED'
}

export enum BookingType {
  INCALL = 'INCALL',
  OUTCALL = 'OUTCALL'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum TokenTransactionType {
  PURCHASE = 'PURCHASE',
  BOOKING_PAYMENT = 'BOOKING_PAYMENT',
  BOOKING_REFUND = 'BOOKING_REFUND',
  ESCROW_HOLD = 'ESCROW_HOLD',
  ESCROW_RELEASE = 'ESCROW_RELEASE',
  WITHDRAWAL = 'WITHDRAWAL'
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  isVerified: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isAgeVerified: boolean;
  consentGiven: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  bio?: string;
  location?: string;
  profilePhoto?: string;
  services?: string[];
  hourlyRate?: number;
  rating?: number;
  reviewCount: number;
  availability?: Record<string, any>;
  verificationDocs?: string[];
}

export interface Booking {
  id: string;
  seekerId: string;
  providerId: string;
  type: BookingType;
  status: BookingStatus;
  startTime: Date;
  endTime: Date;
  duration: number;
  tokenAmount: number;
  location?: string;
  notes?: string;
  assignedEmployeeId?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenPackage {
  tokens: number;
  priceINR: number;
  popular?: boolean;
  description: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatTime = (date: Date | string): string => {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case UserRole.SEEKER:
      return 'Seeker';
    case UserRole.PROVIDER:
      return 'Provider';
    case UserRole.EMPLOYEE:
      return 'Employee';
    case UserRole.MANAGER:
      return 'Manager';
    case UserRole.ADMIN:
      return 'Admin';
    case UserRole.SUPER_ADMIN:
      return 'Super Admin';
    default:
      return 'Unknown';
  }
};

export const getStatusColor = (status: BookingStatus): string => {
  switch (status) {
    case BookingStatus.PENDING:
      return 'warning';
    case BookingStatus.CONFIRMED:
      return 'primary';
    case BookingStatus.IN_PROGRESS:
      return 'primary';
    case BookingStatus.COMPLETED:
      return 'success';
    case BookingStatus.CANCELLED:
      return 'error';
    case BookingStatus.DISPUTED:
      return 'error';
    default:
      return 'gray';
  }
};