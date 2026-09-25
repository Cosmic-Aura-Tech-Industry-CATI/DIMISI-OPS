export interface AccountEntry {
  id: string;
  date: string;
  name: string;
  credit: number;
  debit: number;
  balance: number;
  reason: string;
  isUploaded: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAccountEntryPayload {
  date: string;
  name: string;
  credit: number;
  debit: number;
  balance: number;
  reason: string;
  isUploaded?: boolean;
}

export interface UpdateAccountEntryPayload {
  name: string;
  reason: string;
  date?: string;
  credit?: number;
  debit?: number;
  balance?: number;
}

export interface AccountStats {
  totalBalance: number;
  totalCredit: number;
  totalDebit: number;
  entryCount: number;
  uploadedCount: number;
  manualCount: number;
}

export interface AccountFilters {
  query?: string;
  type?: "all" | "credit" | "debit" | "uploaded" | "manual";
  startDate?: string;
  endDate?: string;
}
