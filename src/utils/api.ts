import { Transaction } from '../types';

//update URL

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const getAllTransactions = async (): Promise<Transaction[]> => {
    const res = await fetch(`${API_URL}/transactions`);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
};

export const createTransaction = async (data: Omit<Transaction, 'id' | 'timestamp'>) => {
    const res = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create transaction');
    return res.json();
};

export const updateTransaction = async (id: number, data: Partial<Transaction>) => {
    const res = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update transaction');
    return res.json();
};

export const deleteTransaction = async (id: number) => {
    const res = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete transaction');
};