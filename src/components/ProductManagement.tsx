import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Image as ImageIcon,
  ChevronRight,
  ChevronDown,
  XCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Product, ProductVariant } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { motion, AnimatePresence } from 'motion/react';

const ProductManagement: React.FC = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', brandName: '', category: '', imageUrl: '', description: '' });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        createdAt: new Date().toISOString()
      });
      setIsAddModalOpen(false);
      setNewProduct({ name: '', brandName: '', category: '', imageUrl: '', description: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [variants, setVariants] = useState<Record<string, ProductVariant[]>>({});

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return () => unsubscribe();
  }, []);

  const fetchVariants = async (productId: string) => {
    if (variants[productId]) return;
    try {
      const snapshot = await getDocs(collection(db, `products/${productId}/variants`));
      const productVariants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductVariant));
      setVariants(prev => ({ ...prev, [productId]: productVariants }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `products/${productId}/variants`);
    }
  };

  const toggleExpand = (productId: string) => {
    if (expandedProduct === productId) {
      setExpandedProduct(null);
    } else {
      setExpandedProduct(productId);
      fetchVariants(productId);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('products')}</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Manage your catalog and variants</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-sm shadow-emerald-200 dark:shadow-none"
        >
          <Plus className="w-5 h-5" />
          <span>{t('addProduct')}</span>
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

      <div className="grid grid-cols-1 gap-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div 
              className="p-4 sm:p-6 flex items-center gap-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
              onClick={() => toggleExpand(product.id)}
            >
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 overflow-hidden flex-shrink-0">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg truncate">{product.name}</h3>
                  <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] uppercase font-bold tracking-wider rounded">
                    {product.brandName}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 truncate">{product.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                  <Edit2 className="w-5 h-5" />
                </button>
                {expandedProduct === product.id ? <ChevronDown className="w-5 h-5 text-zinc-400" /> : <ChevronRight className="w-5 h-5 text-zinc-400" />}
              </div>
            </div>

            <AnimatePresence>
              {expandedProduct === product.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-sm uppercase tracking-wider text-zinc-500">Variants & Stock</h4>
                      <button className="text-xs font-bold text-emerald-600 hover:underline">+ Add Variant</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {variants[product.id]?.map((variant) => (
                        <div key={variant.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold">{variant.size}</span>
                            <span className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full",
                              variant.stockQuantity <= variant.lowStockThreshold 
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" 
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            )}>
                              Stock: {variant.stockQuantity}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Buying Price:</span>
                              <span className="font-medium">{variant.buyingPrice} BDT</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Selling Price:</span>
                              <span className="font-medium text-emerald-600">{variant.sellingPrice} BDT</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!variants[product.id] || variants[product.id].length === 0) && (
                        <div className="col-span-full py-4 text-center text-zinc-500 text-sm italic">
                          No variants added for this product.
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      {/* Add Product Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-xl font-bold">{t('addProduct')}</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddProduct} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">{t('name')}</label>
                  <input 
                    required
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">{t('brand')}</label>
                    <input 
                      required
                      type="text"
                      value={newProduct.brandName}
                      onChange={(e) => setNewProduct({ ...newProduct, brandName: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">{t('category')}</label>
                    <input 
                      required
                      type="text"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Image URL</label>
                  <input 
                    type="url"
                    value={newProduct.imageUrl}
                    onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
                  >
                    {t('save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default ProductManagement;
