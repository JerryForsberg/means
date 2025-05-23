// types.ts

export type TransactionType = 'income' | 'expense';
export type IntervalType = 'daily' | 'weekly' | 'monthly';


export interface Transaction {
    id: number;
    date: string;
    description: string;
    type: TransactionType;
    amount: number;
    isRecurring: boolean;
    intervalValue: number;
    intervalType: IntervalType;
    recurrenceEndDate?: string;
    createdAt: string;
    updatedAt?: string;
    isRecurringInstance?: boolean;
}

export type NewTransactionInput = Omit<Transaction, 'id' | 'isRecurringInstance' | 'createdAt' | 'updatedAt'>;


export interface EditingTransaction extends Transaction {
    dateKey: string;
}

export type EventsMap = Record<string, Transaction[]>;
export type TotalsMap = Record<string, number>;
