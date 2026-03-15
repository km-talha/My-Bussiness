import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Order, FinanceTransaction, ProductVariant } from '../types';
import { format, startOfDay, endOfDay } from 'date-fns';
import { motion } from 'motion/react';

const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    todayExpenses: 0,
    todayProfit: 0,
    pendingOrders: 0,
    lowStockCount: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    // Today's Orders
    const ordersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', start.toISOString()),
      where('createdAt', '<=', end.toISOString())
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      const revenue = orders.reduce((acc, curr) => curr.status === 'delivered' ? acc + curr.totalAmount : acc, 0);
      setStats(prev => ({
        ...prev,
        todayOrders: orders.length,
        todayRevenue: revenue
      }));
    });

    // Pending Orders
    const pendingQuery = query(
      collection(db, 'orders'),
      where('status', '==', 'pending')
    );
    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      setStats(prev => ({ ...prev, pendingOrders: snapshot.size }));
    });

    // Recent Orders
    const recentQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsubscribeRecent = onSnapshot(recentQuery, (snapshot) => {
      setRecentOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });

    // Low Stock Alert (This is a bit more complex as it's in subcollections)
    // For now, let's just query all variants if possible or a subset
    // In a real app, we might have a dedicated low_stock collection or use a cloud function
    const productsQuery = collection(db, 'products');
    const unsubscribeProducts = onSnapshot(productsQuery, async (snapshot) => {
      let lowStockCount = 0;
      for (const productDoc of snapshot.docs) {
        const variantsQuery = collection(db, `products/${productDoc.id}/variants`);
        const variantsSnapshot = await getDocs(variantsQuery);
        variantsSnapshot.forEach(vDoc => {
          const v = vDoc.data() as ProductVariant;
          if (v.stockQuantity <= v.lowStockThreshold) {
            lowStockCount++;
          }
        });
      }
      setStats(prev => ({ ...prev, lowStockCount }));
    });

    // Today's Expenses
    const expensesQuery = query(
      collection(db, 'finance'),
      where('type', '==', 'expense'),
      where('date', '>=', start.toISOString()),
      where('date', '<=', end.toISOString())
    );
    const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const total = snapshot.docs.reduce((acc, curr) => acc + (curr.data().amount || 0), 0);
      setStats(prev => ({ ...prev, todayExpenses: total }));
    });

    return () => {
      unsubscribeOrders();
      unsubscribePending();
      unsubscribeRecent();
      unsubscribeProducts();
      unsubscribeExpenses();
    };
  }, []);

  useEffect(() => {
    setStats(prev => ({
      ...prev,
      todayProfit: prev.todayRevenue - prev.todayExpenses
    }));
  }, [stats.todayRevenue, stats.todayExpenses]);

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium mt-2",
              trend > 0 ? "text-emerald-600" : "text-rose-600"
            )}>
              {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", color)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t('dashboard')}</h1>
        <p className="text-zinc-500 dark:text-zinc-400">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t('todayOrders')} 
          value={stats.todayOrders} 
          icon={ShoppingBag} 
          color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
        />
        <StatCard 
          title={t('todayRevenue')} 
          value={`${stats.todayRevenue} BDT`} 
          icon={DollarSign} 
          color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" 
        />
        <StatCard 
          title={t('todayExpenses')} 
          value={`${stats.todayExpenses} BDT`} 
          icon={TrendingDown} 
          color="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400" 
        />
        <StatCard 
          title={t('todayProfit')} 
          value={`${stats.todayProfit} BDT`} 
          icon={TrendingUp} 
          color="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg">{t('recentOrders')}</h3>
              <button className="text-sm text-emerald-600 font-medium hover:underline">{t('viewAll')}</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-semibold">{t('name')}</th>
                    <th className="px-6 py-3 font-semibold">{t('status')}</th>
                    <th className="px-6 py-3 font-semibold">{t('amount')}</th>
                    <th className="px-6 py-3 font-semibold">{t('date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {recentOrders.length > 0 ? recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-xs text-zinc-500">{order.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-medium",
                          order.status === 'delivered' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          order.status === 'pending' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        )}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">{order.totalAmount} BDT</td>
                      <td className="px-6 py-4 text-sm text-zinc-500">
                        {format(new Date(order.createdAt), 'HH:mm')}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                        No recent orders
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">{t('pendingOrders')}</h3>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-4xl font-bold mb-2">{stats.pendingOrders}</div>
            <p className="text-sm text-zinc-500">{t('needsAttention')}</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">{t('lowStock')}</h3>
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <div className="text-4xl font-bold mb-2">{stats.lowStockCount}</div>
            <p className="text-sm text-zinc-500">{t('restockSoon')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default Dashboard;
