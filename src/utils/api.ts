import { Transaction } from '../types';
import { NewTransactionInput } from '../types'; // wherever it's defined
import { useAuth0 } from '@auth0/auth0-react';

const API_URL = import.meta.env.VITE_API_URL

export const useApi = () => {
    const { getAccessTokenSilently } = useAuth0();

    const getAllTransactions = async (): Promise<Transaction[]> => {
        const token = await getAccessTokenSilently();
        const res = await fetch(`${API_URL}/transactions`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!res.ok) throw new Error('Failed to fetch transactions');
        return res.json();
    };

    const createTransaction = async (data: NewTransactionInput) => {
        const token = await getAccessTokenSilently();
        const res = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create transaction');
        return res.json();
    };

    const updateTransaction = async (id: number, data: Partial<Transaction>) => {
        const token = await getAccessTokenSilently();
        const res = await fetch(`${API_URL}/transactions/${id}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update transaction');
        return res.json();
    };

    const deleteTransaction = async (id: number) => {
        const token = await getAccessTokenSilently();
        const res = await fetch(`${API_URL}/transactions/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!res.ok) throw new Error('Failed to delete transaction');
    };

    return {
        getAllTransactions,
        createTransaction,
        updateTransaction,
        deleteTransaction,
    };
}