import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Search, 
  Phone, 
  Package, 
  DollarSign, 
  Plus,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Supplier } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { format } from 'date-fns';
import { motion } from 'motion/react';

const SupplierManagement: React.FC = () => {
  const { t } = useLanguage();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'suppliers'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'suppliers');
    });

    return () => unsubscribe();
  }, []);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('suppliers')}</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Manage your product sources and payments</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-sm">
          <Plus className="w-5 h-5" />
          <span>{t('addSupplier')}</span>
        </button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSuppliers.map((supplier) => (
          <motion.div 
            key={supplier.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{supplier.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-zinc-500">
                    <Phone className="w-3 h-3" />
                    <span>{supplier.phone}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Due Payment</p>
                <p className={cn(
                  "font-bold",
                  supplier.duePayments > 0 ? "text-rose-600" : "text-emerald-600"
                )}>
                  {supplier.duePayments} BDT
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400 mb-2">Supplied Products</p>
                <div className="flex flex-wrap gap-2">
                  {supplier.suppliedProducts.map((p, i) => (
                    <span key={i} className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-lg text-xs text-zinc-600 dark:text-zinc-400">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="text-xs text-zinc-500">
                  Last Purchase: {supplier.lastPurchaseDate ? format(new Date(supplier.lastPurchaseDate), 'MMM d, yyyy') : 'Never'}
                </div>
                <button className="text-sm font-bold text-emerald-600 flex items-center gap-1 hover:underline">
                  Manage <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default SupplierManagement;
