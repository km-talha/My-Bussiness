import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, onSnapshot, query, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FinanceTransaction } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { motion } from 'motion/react';

const FinanceManagement: React.FC = () => {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0
  });

  useEffect(() => {
    const q = query(collection(db, 'finance'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceTransaction));
      setTransactions(txs);

      const income = txs.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
      const expense = txs.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
      setSummary({
        totalIncome: income,
        totalExpense: expense,
        netProfit: income - expense
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'finance');
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('finance')}</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Track income, expenses, and profitability</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-sm">
          <Plus className="w-5 h-5" />
          <span>{t('addTransaction')}</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-zinc-500">Total Income</span>
          </div>
          <div className="text-3xl font-bold">{summary.totalIncome} BDT</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-zinc-500">Total Expense</span>
          </div>
          <div className="text-3xl font-bold">{summary.totalExpense} BDT</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-zinc-500">Net Profit</span>
          </div>
          <div className="text-3xl font-bold text-emerald-600">{summary.netProfit} BDT</div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="font-bold text-lg">Transaction History</h3>
          <button className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium">{tx.description}</div>
                    {tx.orderId && <div className="text-xs text-zinc-400">Order: #{tx.orderId.slice(0, 8)}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium rounded-lg">
                      {tx.category}
                    </span>
                  </td>
                  <td className={cn(
                    "px-6 py-4 font-bold",
                    tx.type === 'income' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {tx.type === 'income' ? '+' : '-'}{tx.amount} BDT
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {format(new Date(tx.date), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default FinanceManagement;
