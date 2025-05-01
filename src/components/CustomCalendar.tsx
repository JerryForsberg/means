// CustomCalendar.tsx
import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Transaction, TransactionType, IntervalType, EventsMap, TotalsMap, EditingTransaction, NewTransactionInput } from '../types';
import DateModal from './DateModal';
import { useApi } from '../utils/api'; // Assuming you have an API utility to fetch transactions

const CustomCalendar: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [editingTransaction, setEditingTransaction] = useState<EditingTransaction | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
    const { createTransaction, deleteTransaction, getAllTransactions, updateTransaction } = useApi();

    const handleDateChange = (date: Date | null) => {
        setSelectedDate(date);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedDate(null);
    };

    const generateDateRange = (startDate: Date, endDate: Date): string[] => {
        const dates: string[] = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    };

    const eventsMap = useMemo(() => {
        const map: Record<string, Transaction[]> = {};
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

    const getRecurringTransactions = (dateKey: string, allTransactions: Transaction[]): Transaction[] => {
        const result: Transaction[] = [];
        const currentDate = new Date(dateKey);

        allTransactions.forEach((tx) => {
            if (!tx.isRecurring) return;

            const transactionDate = new Date(tx.date);
            const { value, type } = tx.interval;

            const diffInDays = Math.floor(
                (currentDate.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (type === 'daily') {
                if (diffInDays > 0 && diffInDays % value === 0) {
                    result.push({ ...tx, isRecurringInstance: true });
                }
            } else if (type === 'weekly') {
                if (diffInDays > 0 && diffInDays % (value * 7) === 0) {
                    result.push({ ...tx, isRecurringInstance: true });
                }
            } else if (type === 'monthly') {
                const diffInMonths =
                    currentDate.getMonth() -
                    transactionDate.getMonth() +
                    12 * (currentDate.getFullYear() - transactionDate.getFullYear());

                const expectedDate = addMonthsSafely(transactionDate, diffInMonths);

                if (
                    diffInMonths > 0 &&
                    diffInMonths % value === 0 &&
                    currentDate.getTime() === expectedDate.getTime()
                ) {
                    result.push({ ...tx, isRecurringInstance: true });
                }
            }
        });

        return result;
    };

    const calculateCumulativeTotals = (
        eventsMap: EventsMap,
        allTransactions: Transaction[]
    ): TotalsMap => {
        const recurringDates: string[] = [];

        // Identify recurring date keys (don't mutate eventsMap here)
        allTransactions.forEach((tx) => {
            if (tx.isRecurring) {
                let currentDate = new Date(tx.date);
                const { value, type } = tx.interval;

                while (currentDate <= new Date()) {
                    const recurringKey = currentDate.toISOString().split('T')[0];
                    recurringDates.push(recurringKey);

                    if (type === 'daily') currentDate.setDate(currentDate.getDate() + value);
                    else if (type === 'weekly') currentDate.setDate(currentDate.getDate() + value * 7);
                    else if (type === 'monthly') currentDate = addMonthsSafely(currentDate, value);
                }
            }
        });

        const allKeys = [...Object.keys(eventsMap), ...recurringDates];
        const uniqueDates = [...new Set(allKeys)];
        const earliest = new Date(Math.min(...uniqueDates.map(d => new Date(d).getTime())));
        const latest = new Date();
        latest.setFullYear(latest.getFullYear() + 1);

        const fullRange = generateDateRange(earliest, latest);
        let runningTotal = 0;
        const totals: TotalsMap = {};

        fullRange.forEach((date) => {
            const originals = eventsMap[date] || [];
            const recurring = getRecurringTransactions(date, allTransactions);
            const dayTransactions = [...originals, ...recurring];
            const dayTotal = calculateDayTotal(dayTransactions);
            runningTotal += dayTotal;
            totals[date] = runningTotal;
        });

        return totals;
    };

    const cumulativeTotals = useMemo(() => {
        return calculateCumulativeTotals(eventsMap, allTransactions);
    }, [eventsMap, allTransactions]);

    const selectedKey = selectedDate?.toISOString().split('T')[0] || '';

    const transactionsForSelectedDate = useMemo(() => {
        const originals = eventsMap[selectedKey] || [];
        const recurring = getRecurringTransactions(selectedKey, allTransactions);
        return [...originals, ...recurring];
    }, [selectedKey, eventsMap, allTransactions]);


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
            interval: { value: intervalValue, type: intervalType },
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

    const calculateDayTotal = (transactions: Transaction[]) => {
        return transactions.reduce((total, t) => total + (t.type === 'income' ? t.amount : -t.amount), 0);
    };


    const addMonthsSafely = (date: Date, months: number): Date => {
        const newDate = new Date(date);
        newDate.setMonth(newDate.getMonth() + months);
        if (newDate.getDate() !== date.getDate()) newDate.setDate(0);
        return newDate;
    };

    const renderDayContent = (day: Date) => {
        const dateKey = day.toISOString().split('T')[0];
        const originals = eventsMap[dateKey] || [];
        const recurring = getRecurringTransactions(dateKey, allTransactions);
        const all = [...originals, ...recurring];
        const total = cumulativeTotals[dateKey] || 0;

        return (
            <div className="h-full p-2 rounded-md bg-white border border-gray-200 flex flex-col justify-between text-sm">
                <div className="text-gray-800 font-semibold">{day.getDate()}</div>

                <div className="text-xs text-gray-500 mt-1">
                    {all.length} {all.length === 1 ? 'transaction' : 'transactions'}
                </div>

                <div
                    className={`font-bold mt-1 ${total >= 0 ? 'text-green-600' : 'text-red-500'
                        }`}
                >
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

                    {/* Transactions list */}
                    <div className="mb-4 space-y-2 max-h-60 overflow-y-auto">
                        {transactionsForSelectedDate.map((t) => (
                            <div
                                key={t.id}
                                className="flex justify-between items-center p-2 border border-gray-200 rounded"
                            >
                                <div>
                                    <p className="font-medium">{t.description}</p>
                                    <p
                                        className={`text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-500'
                                            }`}
                                    >
                                        {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                                    </p>
                                </div>
                                {!t.isRecurringInstance && (
                                    <div className="flex gap-2">
                                        <button
                                            className="text-sm text-yellow-600 hover:underline"
                                            onClick={() =>
                                                handleEditTransaction(selectedDate!.toISOString().split('T')[0], t)
                                            }
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="text-sm text-red-500 hover:underline"
                                            onClick={() =>
                                                handleRemoveTransaction(t.id)
                                            }
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Form to add/edit */}
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
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="isRecurring"
                                defaultChecked={editingTransaction?.isRecurring || false}
                            />
                            <label>Recurring</label>
                        </div>
                        <div className="flex gap-3">
                            <input
                                type="number"
                                name="intervalValue"
                                min="1"
                                defaultValue={editingTransaction?.interval?.value || 1}
                                className="w-1/3 border px-2 py-1 rounded"
                            />
                            <select
                                name="intervalType"
                                defaultValue={editingTransaction?.interval?.type || 'daily'}
                                className="w-2/3 border px-3 py-2 rounded"
                            >
                                <option value="daily">Days</option>
                                <option value="weekly">Weeks</option>
                                <option value="monthly">Months</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            {editingTransaction ? 'Update' : 'Add'} Transaction
                        </button>
                    </form>
                </DateModal>

            </div>
        </div>
    );
};

export default CustomCalendar;
