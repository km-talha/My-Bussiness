import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Filter, 
  Search,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Customer } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { motion } from 'motion/react';

const MarketingManagement: React.FC = () => {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'repeat' | 'high-spending'>('all');

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('totalSpending', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'customers');
    });

    return () => unsubscribe();
  }, []);

  const filteredCustomers = customers.filter(c => {
    if (filter === 'repeat') return c.totalOrders > 1;
    if (filter === 'high-spending') return c.totalSpending > 5000;
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedCustomers(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const sendWhatsApp = () => {
    if (selectedCustomers.length === 0 || !message) return;
    
    // In a real app, this would loop or use a bulk API
    // For this demo, we'll open the first selected customer's WhatsApp
    const firstId = selectedCustomers[0];
    const customer = customers.find(c => c.id === firstId);
    if (customer) {
      const url = `https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t('marketing')}</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Send promotional messages via WhatsApp</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-lg">Target Audience</h3>
                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                  {(['all', 'repeat', 'high-spending'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        filter === f ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500"
                      )}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={toggleSelectAll}
                className="text-sm font-bold text-emerald-600 hover:underline"
              >
                {selectedCustomers.length === filteredCustomers.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Select</th>
                    <th className="px-6 py-3 font-semibold">Customer</th>
                    <th className="px-6 py-3 font-semibold">Phone</th>
                    <th className="px-6 py-3 font-semibold">Spending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredCustomers.map((customer) => (
                    <tr 
                      key={customer.id} 
                      className={cn(
                        "hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer",
                        selectedCustomers.includes(customer.id) && "bg-emerald-50/30 dark:bg-emerald-900/10"
                      )}
                      onClick={() => toggleSelect(customer.id)}
                    >
                      <td className="px-6 py-4">
                        <div className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                          selectedCustomers.includes(customer.id) 
                            ? "bg-emerald-600 border-emerald-600 text-white" 
                            : "border-zinc-300 dark:border-zinc-700"
                        )}>
                          {selectedCustomers.includes(customer.id) && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{customer.name}</td>
                      <td className="px-6 py-4 text-zinc-500">{customer.phone}</td>
                      <td className="px-6 py-4 font-bold">{customer.totalSpending} BDT</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="font-bold text-lg mb-4">Compose Message</h3>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your promotional message here..."
              className="w-full h-48 p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none mb-4"
            />
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Selected Recipients</span>
                <span className="font-bold">{selectedCustomers.length}</span>
              </div>
              <button 
                onClick={sendWhatsApp}
                disabled={selectedCustomers.length === 0 || !message}
                className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
              >
                <Send className="w-5 h-5" />
                <span>Send via WhatsApp</span>
              </button>
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
            <h4 className="font-bold text-emerald-800 dark:text-emerald-400 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Marketing Tips
            </h4>
            <ul className="text-sm text-emerald-700 dark:text-emerald-500 space-y-2 list-disc pl-4">
              <li>Offer exclusive discounts to repeat customers.</li>
              <li>Keep messages short and personalized.</li>
              <li>Include a clear call to action.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default MarketingManagement;
