import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Share2, 
  Printer,
  ChevronRight,
  MoreHorizontal,
  CheckCircle2,
  Package,
  Truck,
  XCircle,
  Clock
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  getDocs,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Order, OrderItem, OrderStatus, Product, ProductVariant } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { format } from 'date-fns';
import { toPng } from 'html-to-image';
import { motion, AnimatePresence } from 'motion/react';

const OrderManagement: React.FC = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { 
        status: newStatus,
        deliveredAt: newStatus === 'delivered' ? new Date().toISOString() : null
      });

      // If delivered, decrease stock (In a real app, this should be a transaction or cloud function)
      if (newStatus === 'delivered') {
        const itemsSnapshot = await getDocs(collection(db, `orders/${orderId}/items`));
        const batch = writeBatch(db);
        
        for (const itemDoc of itemsSnapshot.docs) {
          const item = itemDoc.data() as OrderItem;
          const variantRef = doc(db, `products/${item.productId}/variants`, item.variantId);
          // This is a bit risky without a transaction, but for this demo:
          const variantSnap = await getDocs(query(collection(db, `products/${item.productId}/variants`)));
          const variantData = variantSnap.docs.find(d => d.id === item.variantId)?.data() as ProductVariant;
          if (variantData) {
            batch.update(variantRef, { stockQuantity: variantData.stockQuantity - item.quantity });
          }
        }
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const generateInvoice = async () => {
    if (!invoiceRef.current) return;
    try {
      const dataUrl = await toPng(invoiceRef.current, { cacheBust: true });
      const link = document.createElement('a');
      link.download = `invoice-${selectedOrder?.id?.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Invoice generation failed', err);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         o.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'packed': return <Package className="w-4 h-4 text-blue-500" />;
      case 'shipped': return <Truck className="w-4 h-4 text-indigo-500" />;
      case 'delivered': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-rose-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('orders')}</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Track and manage customer orders</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-sm shadow-emerald-200 dark:shadow-none"
        >
          <Plus className="w-5 h-5" />
          <span>{t('addOrder')}</span>
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input 
            type="text"
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {(['all', 'pending', 'packed', 'shipped', 'delivered', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                statusFilter === status 
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" 
                  : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              )}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Order ID</th>
                <th className="px-6 py-4 font-semibold">{t('name')}</th>
                <th className="px-6 py-4 font-semibold">{t('status')}</th>
                <th className="px-6 py-4 font-semibold">{t('total')}</th>
                <th className="px-6 py-4 font-semibold">{t('date')}</th>
                <th className="px-6 py-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-zinc-400">#{order.id?.slice(0, 8)}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-xs text-zinc-500">{order.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <select 
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id!, e.target.value as OrderStatus)}
                        className="bg-transparent text-sm font-medium outline-none cursor-pointer hover:text-emerald-600 transition-colors"
                      >
                        <option value="pending">Pending</option>
                        <option value="packed">Packed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold">{order.totalAmount} BDT</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {format(new Date(order.createdAt), 'MMM d, HH:mm')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal (Hidden Invoice for Capture) */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-xl font-bold">Order Details</h2>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-8 max-h-[70vh] overflow-y-auto">
                {/* Invoice Preview */}
                <div ref={invoiceRef} className="bg-white text-black p-8 border border-zinc-200 rounded-xl shadow-sm">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h1 className="text-2xl font-black text-emerald-600 uppercase tracking-tighter">PureTaste</h1>
                      <p className="text-xs text-zinc-500">Business Manager Invoice</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase text-zinc-400">Invoice #</p>
                      <p className="font-mono text-sm">{selectedOrder.id?.slice(0, 12)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-zinc-400 mb-1">Bill To</p>
                      <p className="font-bold">{selectedOrder.customerName}</p>
                      <p className="text-sm text-zinc-600">{selectedOrder.phone}</p>
                      <p className="text-sm text-zinc-600 max-w-[200px]">{selectedOrder.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-zinc-400 mb-1">Date</p>
                      <p className="text-sm">{format(new Date(selectedOrder.createdAt), 'MMMM d, yyyy')}</p>
                      <p className="text-[10px] font-bold uppercase text-zinc-400 mt-4 mb-1">Status</p>
                      <p className="text-sm font-bold uppercase">{selectedOrder.status}</p>
                    </div>
                  </div>

                  <table className="w-full mb-8">
                    <thead className="border-b-2 border-zinc-100">
                      <tr>
                        <th className="py-2 text-left text-[10px] font-bold uppercase text-zinc-400">Item</th>
                        <th className="py-2 text-center text-[10px] font-bold uppercase text-zinc-400">Qty</th>
                        <th className="py-2 text-right text-[10px] font-bold uppercase text-zinc-400">Price</th>
                        <th className="py-2 text-right text-[10px] font-bold uppercase text-zinc-400">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {/* In a real app, we'd fetch items here. For now, showing a placeholder or we'd need to fetch them when selecting order */}
                      <tr>
                        <td className="py-3 text-sm font-medium">Sample Product</td>
                        <td className="py-3 text-center text-sm">1</td>
                        <td className="py-3 text-right text-sm">500 BDT</td>
                        <td className="py-3 text-right text-sm font-bold">500 BDT</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="flex justify-end">
                    <div className="w-48 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Subtotal</span>
                        <span>{selectedOrder.totalAmount - selectedOrder.deliveryCharge} BDT</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Delivery</span>
                        <span>{selectedOrder.deliveryCharge} BDT</span>
                      </div>
                      <div className="flex justify-between border-t border-zinc-200 pt-2 font-bold text-lg">
                        <span>Total</span>
                        <span className="text-emerald-600">{selectedOrder.totalAmount} BDT</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-zinc-100 text-center">
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Thank you for your business!</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex gap-4">
                <button 
                  onClick={generateInvoice}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold transition-all hover:scale-[1.02]"
                >
                  <Download className="w-5 h-5" />
                  Save as Image
                </button>
                <button className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 transition-colors">
                  <Printer className="w-5 h-5" />
                </button>
              </div>
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

export default OrderManagement;
