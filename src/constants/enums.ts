/**
 * Centralized Enums for Corrule Application (Frontend Types)
 * TypeScript version for frontend consistency
 */

// ============================================================================
// USER ENUMS
// ============================================================================

export enum UserRole {
  USER = 'USER',
  VERIFIED_CONTRIBUTOR = 'VERIFIED_CONTRIBUTOR',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

// ============================================================================
// RULE ENUMS
// ============================================================================

export enum RuleStatus {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export enum RuleLanguage {
  YARA = 'YARA',
  SIGMA = 'SIGMA',
  SNORT = 'SNORT',
  SURICATA = 'SURICATA',
  CUSTOM = 'CUSTOM',
}

export enum RuleType {
  DETECTION = 'DETECTION',
  PREVENTION = 'PREVENTION',
  HUNTING = 'HUNTING',
  CORRELATION = 'CORRELATION',
}

export enum RulePlatform {
  WINDOWS = 'WINDOWS',
  LINUX = 'LINUX',
  MACOS = 'MACOS',
  NETWORK = 'NETWORK',
  CLOUD = 'CLOUD',
  ENDPOINT = 'ENDPOINT',
}

export enum RuleSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum RuleVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  UNLISTED = 'UNLISTED',
  PAID = 'PAID',
}

export enum PricingType {
  SINGLE_USE = 'SINGLE_USE',
  UNLIMITED = 'UNLIMITED',
  SUBSCRIPTION = 'SUBSCRIPTION',
  FREE = 'FREE',
}

// ============================================================================
// ACTIVITY ENUMS
// ============================================================================

export enum ActivityType {
  RULE_CREATED = 'RULE_CREATED',
  RULE_UPDATED = 'RULE_UPDATED',
  RULE_PUBLISHED = 'RULE_PUBLISHED',
  RULE_APPROVED = 'RULE_APPROVED',
  RULE_REJECTED = 'RULE_REJECTED',
  RULE_PURCHASED = 'RULE_PURCHASED',
  RULE_DOWNLOADED = 'RULE_DOWNLOADED',
  RULE_FORKED = 'RULE_FORKED',
  RULE_REVIEWED = 'RULE_REVIEWED',
  RULE_LIKED = 'RULE_LIKED',
  RULE_UNLIKED = 'RULE_UNLIKED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  ACHIEVEMENT_EARNED = 'ACHIEVEMENT_EARNED',
}

export enum ActivityTargetModel {
  RULE = 'Rule',
  USER = 'User',
  REVIEW = 'Review',
}

// ============================================================================
// NOTIFICATION ENUMS
// ============================================================================

export enum NotificationType {
  RULE_APPROVED = 'RULE_APPROVED',
  RULE_REJECTED = 'RULE_REJECTED',
  RULE_PURCHASED = 'RULE_PURCHASED',
  NEW_REVIEW = 'NEW_REVIEW',
  COMMENT_REPLY = 'COMMENT_REPLY',
  ACHIEVEMENT = 'ACHIEVEMENT',
  SYSTEM = 'SYSTEM',
}

// ============================================================================
// TRANSACTION ENUMS
// ============================================================================

export enum PaymentGateway {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  CRYPTO = 'CRYPTO',
  CREDITS = 'CREDITS',
  MOCK = 'MOCK',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
}

// ============================================================================
// BILLING ENUMS
// ============================================================================

export enum BillingRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum BankAccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
}

export enum BillingTransactionType {
  PURCHASE = 'PURCHASE',
  REFUND = 'REFUND',
  COMMISSION = 'COMMISSION',
  WITHDRAWAL = 'WITHDRAWAL',
}

export enum BillingTransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum WithdrawalMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  PAYPAL = 'PAYPAL',
  CRYPTO = 'CRYPTO',
}

// ============================================================================
// FRONTEND ENUMS
// ============================================================================

export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warning',
}

export enum PaymentMethod {
  STRIPE = 'stripe',
  BANK = 'bank',
}

export enum WarningSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum PeriodType {
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all values of an enum
 */
export const getEnumValues = <T extends Record<string, string>>(
  enumObj: T
): string[] => {
  return Object.values(enumObj);
};

/**
 * Check if a value exists in an enum
 */
export const isEnumValue = <T extends Record<string, string>>(
  enumObj: T,
  value: any
): value is T[keyof T] => {
  return Object.values(enumObj).includes(value);
};

/**
 * Get enum key from value
 */
export const getEnumKey = <T extends Record<string, string>>(
  enumObj: T,
  value: string
): keyof T | undefined => {
  return (Object.keys(enumObj) as (keyof T)[]).find(
    (key) => enumObj[key] === value
  );
};
