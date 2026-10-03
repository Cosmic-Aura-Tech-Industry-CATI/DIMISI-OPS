/**
 * Utilities for the Accounts module.
 * Formatting helpers and form validators.
 */

import type {
  AccountTransaction,
  CreateTransactionPayload,
  UpdateTransactionPayload,
} from "../types/accounts.types";

/**
 * Formats a numeric currency value into the standard Indian Rupee format: ₹12,34,567.00
 */
export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return "₹0.00";
  }
  const numeric = Number(amount);
  return `₹${numeric.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats an ISO or raw date string into "DD MMM YYYY" (e.g., "24 Sep 2026").
 */
export function formatDate(dateValue: string | Date | undefined | null): string {
  if (!dateValue) return "—";
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return String(dateValue);

    const day = String(d.getDate()).padStart(2, "0");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${day} ${month} ${year}`;
  } catch {
    return String(dateValue);
  }
}

/**
 * Formats an ISO string to HTML date input format "YYYY-MM-DD".
 */
export function toInputDateFormat(dateValue: string | Date | undefined | null): string {
  if (!dateValue) return "";
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

/**
 * Validates mutual exclusivity of Credit and Debit amounts.
 */
export function validateTransactionAmounts(
  credit: number,
  debit: number,
): { valid: boolean; error?: string } {
  if (credit > 0 && debit > 0) {
    return {
      valid: false,
      error: "A transaction cannot have both credit and debit amounts.",
    };
  }
  if (credit <= 0 && debit <= 0) {
    return {
      valid: false,
      error: "A transaction must have either a credit or debit amount greater than zero.",
    };
  }
  return { valid: true };
}

/**
 * Validates Create Transaction payload before API dispatch.
 */
export function validateCreateTransaction(
  payload: Partial<CreateTransactionPayload>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!payload.transactionDate || !payload.transactionDate.trim()) {
    errors.transactionDate = "Transaction date is required";
  }

  if (!payload.partyName || !payload.partyName.trim()) {
    errors.partyName = "Party / Account name is required";
  } else if (payload.partyName.trim().length > 100) {
    errors.partyName = "Party name cannot exceed 100 characters";
  }

  if (!payload.purpose || !payload.purpose.trim()) {
    errors.purpose = "Purpose / Description is required";
  } else if (payload.purpose.trim().length > 500) {
    errors.purpose = "Purpose cannot exceed 500 characters";
  }

  const credit = Number(payload.creditAmount) || 0;
  const debit = Number(payload.debitAmount) || 0;

  if (credit < 0) errors.creditAmount = "Credit amount cannot be negative";
  if (debit < 0) errors.debitAmount = "Debit amount cannot be negative";

  const amountValidation = validateTransactionAmounts(credit, debit);
  if (!amountValidation.valid && amountValidation.error) {
    if (credit > 0 && debit > 0) {
      errors.creditAmount = amountValidation.error;
      errors.debitAmount = amountValidation.error;
    } else {
      errors.creditAmount = amountValidation.error;
    }
  }

  return errors;
}

/**
 * Validates Update Transaction payload.
 */
export function validateUpdateTransaction(
  payload: Partial<UpdateTransactionPayload>,
  isUploaded = false,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (payload.partyName !== undefined) {
    if (!payload.partyName.trim()) {
      errors.partyName = "Party / Account name is required";
    } else if (payload.partyName.trim().length > 100) {
      errors.partyName = "Party name cannot exceed 100 characters";
    }
  }

  if (payload.purpose !== undefined) {
    if (!payload.purpose.trim()) {
      errors.purpose = "Purpose / Description is required";
    } else if (payload.purpose.trim().length > 500) {
      errors.purpose = "Purpose cannot exceed 500 characters";
    }
  }

  if (!isUploaded) {
    if (payload.transactionDate !== undefined && !payload.transactionDate.trim()) {
      errors.transactionDate = "Transaction date is required";
    }

    const credit = Number(payload.creditAmount) || 0;
    const debit = Number(payload.debitAmount) || 0;

    if (credit < 0) errors.creditAmount = "Credit amount cannot be negative";
    if (debit < 0) errors.debitAmount = "Debit amount cannot be negative";

    const amountValidation = validateTransactionAmounts(credit, debit);
    if (!amountValidation.valid && amountValidation.error) {
      if (credit > 0 && debit > 0) {
        errors.creditAmount = amountValidation.error;
        errors.debitAmount = amountValidation.error;
      } else {
        errors.creditAmount = amountValidation.error;
      }
    }
  }

  return errors;
}

/**
 * Helper to get creator display name or label.
 */
export function getCreatorDisplay(createdBy: AccountTransaction["createdBy"]): string {
  if (!createdBy) return "Director";
  if (typeof createdBy === "string") return "Director";
  return createdBy.name || createdBy.email || "Director";
}
