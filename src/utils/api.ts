import { Transaction } from '../types';
import { authFetch } from './authFetch';
import { NewTransactionInput } from '../types'; // wherever it's defined

const API_URL = import.meta.env.VITE_API_URL

export const getAllTransactions = async (): Promise<Transaction[]> => {
    const res = await authFetch(`${API_URL}/transactions`);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
};

export const createTransaction = async (data: NewTransactionInput) => {
    const res = await authFetch(`${API_URL}/transactions`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create transaction');
    return res.json();
};

export const updateTransaction = async (id: number, data: Partial<Transaction>) => {
    const res = await authFetch(`${API_URL}/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update transaction');
    return res.json();
};

export const deleteTransaction = async (id: number) => {
    const res = await authFetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete transaction');
};