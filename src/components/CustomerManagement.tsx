import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  Star,
  ChevronRight,
  History
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Customer } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { format } from 'date-fns';
import { motion } from 'motion/react';

const CustomerManagement: React.FC = () => {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('totalSpending', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'customers');
    });

    return () => unsubscribe();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t('customers')}</h1>
        <p className="text-zinc-500 dark:text-zinc-400">View customer history and loyalty points</p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input 
          type="text"
          placeholder={t('search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <motion.div 
            key={customer.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold text-xl">
                {customer.name.charAt(0)}
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold">
                <Star className="w-3 h-3 fill-current" />
                <span>{customer.loyaltyPoints} pts</span>
              </div>
            </div>

            <h3 className="font-bold text-lg mb-1">{customer.name}</h3>
            <div className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{customer.address}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Total Orders</p>
                <p className="font-bold">{customer.totalOrders}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Total Spent</p>
                <p className="font-bold text-emerald-600">{customer.totalSpending} BDT</p>
              </div>
            </div>

            <button className="w-full mt-6 py-2 flex items-center justify-center gap-2 text-sm font-medium text-zinc-400 group-hover:text-emerald-600 transition-colors">
              <History className="w-4 h-4" />
              <span>View History</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CustomerManagement;
