import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  AlertTriangle, 
  ArrowUp, 
  ArrowDown, 
  History,
  Plus
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, ProductVariant } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { motion } from 'motion/react';

const InventoryManagement: React.FC = () => {
  const { t } = useLanguage();
  const [inventory, setInventory] = useState<(ProductVariant & { productName: string, brandName: string })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), async (snapshot) => {
      const allInventory: any[] = [];
      for (const productDoc of snapshot.docs) {
        const product = productDoc.data() as Product;
        const variantsSnapshot = await getDocs(collection(db, `products/${productDoc.id}/variants`));
        variantsSnapshot.forEach(vDoc => {
          allInventory.push({
            id: vDoc.id,
            productName: product.name,
            brandName: product.brandName,
            ...vDoc.data()
          });
        });
      }
      setInventory(allInventory);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return () => unsubscribeProducts();
  }, []);

  const filteredInventory = inventory.filter(i => 
    i.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.size.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('inventory')}</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Track stock levels and movement</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-sm">
          <Plus className="w-5 h-5" />
          <span>{t('addStock')}</span>
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

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Size</th>
                <th className="px-6 py-4 font-semibold">Stock</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-xs text-zinc-500">{item.brandName}</div>
                  </td>
                  <td className="px-6 py-4 font-medium">{item.size}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{item.stockQuantity}</span>
                      <span className="text-xs text-zinc-400">units</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {item.stockQuantity <= item.lowStockThreshold ? (
                      <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Low Stock</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                        <ArrowUp className="w-4 h-4" />
                        <span>In Stock</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 text-zinc-400 hover:text-emerald-600 transition-colors">
                      <History className="w-5 h-5" />
                    </button>
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

export default InventoryManagement;
