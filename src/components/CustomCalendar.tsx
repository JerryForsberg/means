// CustomCalendar.tsx
import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Transaction, TransactionType, IntervalType, EventsMap, TotalsMap, EditingTransaction, NewTransactionInput } from '../types';
import DateModal from './DateModal';
import { useApi } from '../utils/api';

const CustomCalendar: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [editingTransaction, setEditingTransaction] = useState<EditingTransaction | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
    const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null);
    const [showDisclaimer, setShowDisclaimer] = useState(false);
    const { createTransaction, deleteTransaction, getAllTransactions, updateTransaction } = useApi();

    const handleDateChange = (date: Date | null) => {
        setSelectedDate(date);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedDate(null);
    };

    const generateDateRange = (start: Date, end: Date): string[] => {
        const dates: string[] = [];
        const current = new Date(start);
        while (current <= end) {
            dates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
        }
        return dates;
    };

    const eventsMap = useMemo(() => {
        const map: EventsMap = {};
        try {
            for (const tx of allTransactions) {
                const key = new Date(tx.date).toISOString().split('T')[0];
                if (!map[key]) map[key] = [];
                map[key].push(tx);
            }
        } catch (err) {
            console.error('Failed to build eventsMap:', err, allTransactions);
        }
        return map;
    }, [allTransactions]);

    function incrementDate(date: Date, type: string, value: number): Date {
        const d = new Date(date);
        if (type === 'daily') d.setDate(d.getDate() + value);
        else if (type === 'weekly') d.setDate(d.getDate() + value * 7);
        else if (type === 'monthly') d.setMonth(d.getMonth() + value);
        return d;
    }

    const recurringTransactionMap = useMemo(() => {
        const map: EventsMap = {};

        allTransactions.forEach((tx) => {
            if (!tx.isRecurring) return;
            let current = new Date(tx.date);
            const { intervalType, intervalValue } = tx;
            const originalDateKey = new Date(tx.date).toISOString().split('T')[0];

            const endDate = tx.recurrenceEndDate
                ? new Date(tx.recurrenceEndDate)
                : new Date(new Date().setFullYear(new Date().getFullYear() + 1))

            while (current <= endDate) {
                const key = current.toISOString().split('T')[0];

                if (key === originalDateKey) {
                    current = incrementDate(current, intervalType, intervalValue);
                    continue; // ✅ skip original date to avoid duplication
                }

                if (!map[key]) map[key] = [];
                map[key].push({ ...tx, isRecurringInstance: true });
                current = incrementDate(current, intervalType, intervalValue);
            }
        });

        return map;
    }, [allTransactions]);

    // const calculateDayTotal = (transactions: Transaction[]) => {
    //     return transactions.reduce((total, t) => total + (t.type === 'income' ? t.amount : -t.amount), 0);
    // };

    const cumulativeTotals = useMemo(() => {
        const totals: TotalsMap = {};
        const allDates = allTransactions.map(tx => new Date(tx.date));
        const earliestDate = allDates.length > 0
            ? new Date(Math.min(...allDates.map(d => d.getTime())))
            : new Date();
        const end = new Date()
        end.setFullYear(new Date().getFullYear() + 1);
        const fullDateRange = generateDateRange(earliestDate, end);

        let runningTotal = 0;

        fullDateRange.forEach((dateKey) => {
            const originals = eventsMap[dateKey] || [];
            const recurring = recurringTransactionMap[dateKey] || [];
            const transactions = [...originals, ...recurring];

            const dayTotal = transactions.reduce((sum, t) => {
                return sum + (t.type === 'income' ? t.amount : -t.amount);
            }, 0);

            runningTotal += dayTotal;
            totals[dateKey] = runningTotal;
        });

        return totals;
    }, [eventsMap, recurringTransactionMap, allTransactions]);

    const selectedKey = selectedDate?.toISOString().split('T')[0] || '';

    const transactionsForSelectedDate = useMemo(() => {
        const originals = eventsMap[selectedKey] || [];
        const recurring = recurringTransactionMap[selectedKey] || [];
        return [...originals, ...recurring];
    }, [selectedKey, eventsMap, recurringTransactionMap]);

    useEffect(() => {
        getAllTransactions()
            .then((data) => {
                setAllTransactions(data);
            })
            .catch(console.error);
    }, []);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (!selectedDate) return;

        const description = (form.description as HTMLInputElement).value;
        const type = (form.type as HTMLSelectElement).value as TransactionType;
        const amount = parseFloat((form.amount as HTMLInputElement).value) || 0;
        const isRecurring = (form.isRecurring as HTMLInputElement).checked;
        const intervalValue = parseInt((form.intervalValue as HTMLInputElement).value, 10) || 1;
        const intervalType = (form.intervalType as HTMLSelectElement).value as IntervalType;


        const transactionInput: NewTransactionInput = {
            date: selectedDate!.toISOString(),
            description,
            type,
            amount,
            isRecurring,
            intervalValue,
            intervalType,
            recurrenceEndDate: recurrenceEndDate ? recurrenceEndDate.toISOString() : undefined,
        };

        try {
            if (editingTransaction) {
                const updated = await updateTransaction(editingTransaction.id, transactionInput);
                setAllTransactions(prev => prev.map(tx => tx.id === updated.id ? updated : tx));
            } else {
                const created = await createTransaction(transactionInput);
                setAllTransactions(prev => [...prev, created]);
            }

            setEditingTransaction(null);
            form.reset();
            setIsModalOpen(false);
        } catch (err) {
            console.error('Failed to save transaction:', err);
        }
    };

    const handleEditTransaction = (dateKey: string, transaction: Transaction) => {
        setEditingTransaction({ ...transaction, dateKey });
        setSelectedDate(new Date(dateKey));
    };

    const handleRemoveTransaction = async (transactionId: number) => {
        try {
            await deleteTransaction(transactionId);
            setAllTransactions(prev => prev.filter(tx => tx.id !== transactionId));
        } catch (err) {
            console.error('Failed to delete transaction:', err);
        }
    };

    const renderDayContent = (day: Date) => {
        const dateKey = day.toISOString().split('T')[0];
        const originals = eventsMap[dateKey] || [];
        const recurring = recurringTransactionMap[dateKey] || [];
        const all = [...originals, ...recurring];
        const total = cumulativeTotals[dateKey] || 0;

        return (
            <div className="h-full p-2 rounded-md bg-white border border-gray-200 flex flex-col justify-between text-sm">
                <div className="text-gray-800 font-semibold">{day.getDate()}</div>
                <div className="text-xs text-gray-500 mt-1">
                    {all.length} {all.length === 1 ? 'transaction' : 'transactions'}
                </div>
                <div className={`font-bold mt-1 ${total >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    ${Math.abs(total).toFixed(2)}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen px-4 py-6">
            <h2 className="text-3xl font-bold mb-6">Means Budget Planner</h2>
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full max-w-none">
                    {showDisclaimer && (
                        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                                <h2 className="text-lg font-bold mb-2">Disclaimer</h2>
                                <p className="text-sm text-gray-700">
                                    This budgeting application is intended as a demonstration project for portfolio purposes only.
                                    It is not intended for real financial planning, and should not be used to store sensitive personal or financial data.
                                    By using this application, you acknowledge that data is handled for demonstration purposes and at your own risk.
                                </p>
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => setShowDisclaimer(false)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    <DatePicker
                        selected={null}
                        openToDate={new Date()}
                        onChange={handleDateChange}
                        inline
                        renderDayContents={(_, date) => date ? renderDayContent(date) : null}
                        calendarClassName="!w-full !max-w-full custom-datepicker"
                    />
                </div>
                <DateModal isOpen={isModalOpen} onClose={handleCloseModal}>
                    <h3 className="text-lg font-bold mb-4">
                        {editingTransaction ? 'Edit' : 'Add'} Transaction for{' '}
                        {selectedDate?.toLocaleDateString()}
                    </h3>

                    <div className="mb-4 space-y-2 max-h-60 overflow-y-auto">
                        {transactionsForSelectedDate.map((t) => (
                            <div key={t.id} className="flex justify-between items-center p-2 border border-gray-200 rounded">
                                <div>
                                    <p className="font-medium">{t.description}</p>
                                    <p className={`text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                                        {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                                    </p>
                                </div>
                                {!t.isRecurringInstance && (
                                    <div className="flex gap-2">
                                        <button
                                            className="text-sm text-yellow-600 hover:underline"
                                            onClick={() => handleEditTransaction(selectedDate!.toISOString().split('T')[0], t)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="text-sm text-red-500 hover:underline"
                                            onClick={() => handleRemoveTransaction(t.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            name="description"
                            required
                            placeholder="Description"
                            defaultValue={editingTransaction?.description || ''}
                            className="w-full border px-3 py-2 rounded"
                        />
                        <select
                            name="type"
                            defaultValue={editingTransaction?.type || 'income'}
                            className="w-full border px-3 py-2 rounded"
                        >
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                        <input
                            type="number"
                            name="amount"
                            min="0"
                            step="0.01"
                            required
                            placeholder="Amount"
                            defaultValue={editingTransaction?.amount || ''}
                            className="w-full border px-3 py-2 rounded"
                        />
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="isRecurring"
                                    defaultChecked={editingTransaction?.isRecurring || false}
                                />
                                <label>Recurring</label>
                            </div>
                            <DatePicker
                                selected={recurrenceEndDate}
                                onChange={(date) => setRecurrenceEndDate(date)}
                                placeholderText="Recurrence ends (optional)"
                                className="border px-3 py-2 rounded w-full"
                                dateFormat="yyyy-MM-dd"
                            />
                        </div>
                        <div className="flex gap-3">
                            <input
                                type="number"
                                name="intervalValue"
                                min="1"
                                defaultValue={editingTransaction?.intervalValue || 1}
                                className="w-1/3 border px-2 py-1 rounded"
                            />
                            <select
                                name="intervalType"
                                defaultValue={editingTransaction?.intervalType || 'daily'}
                                className="w-2/3 border px-3 py-2 rounded"
                            >
                                <option value="daily">Days</option>
                                <option value="weekly">Weeks</option>
                                <option value="monthly">Months</option>
                            </select>
                        </div>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            {editingTransaction ? 'Update' : 'Add'} Transaction
                        </button>
                    </form>
                </DateModal>
            </div>
            <footer>
                <button onClick={() => setShowDisclaimer(true)} className="text-sm text-gray-600 underline">
                    Disclaimer
                </button>
            </footer>
        </div>
    );
};

export default CustomCalendar;
