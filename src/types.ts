// types.ts

export type TransactionType = 'income' | 'expense';
export type IntervalType = 'daily' | 'weekly' | 'monthly';

export interface Interval {
    value: number;
    type: IntervalType;
}

export interface Transaction {
    id: number;
    description: string;
    type: TransactionType;
    amount: number;
    isRecurring: boolean;
    interval: Interval;
    timestamp: string;
    isRecurringInstance?: boolean;
}

export interface EditingTransaction extends Transaction {
    dateKey: string;
}

export type EventsMap = Record<string, Transaction[]>;
export type TotalsMap = Record<string, number>;
