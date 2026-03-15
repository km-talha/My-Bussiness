import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    dashboard: 'Dashboard',
    orders: 'Orders',
    products: 'Products',
    inventory: 'Inventory',
    customers: 'Customers',
    suppliers: 'Suppliers',
    finance: 'Finance',
    reports: 'Reports',
    marketing: 'Marketing',
    settings: 'Settings',
    todayOrders: "Today's Orders",
    todayRevenue: "Today's Revenue",
    todayExpenses: "Today's Expenses",
    todayProfit: "Today's Profit",
    pendingOrders: 'Pending Orders',
    lowStock: 'Low Stock Alerts',
    recentOrders: 'Recent Orders',
    topSelling: 'Top Selling Product',
    addOrder: 'Add Order',
    addProduct: 'Add Product',
    addStock: 'Add Stock',
    addCustomer: 'Add Customer',
    addSupplier: 'Add Supplier',
    addTransaction: 'Add Transaction',
    status: 'Status',
    amount: 'Amount',
    date: 'Date',
    name: 'Name',
    phone: 'Phone',
    address: 'Address',
    category: 'Category',
    brand: 'Brand',
    price: 'Price',
    quantity: 'Quantity',
    total: 'Total',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    login: 'Login',
    logout: 'Logout',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    language: 'Language',
    bangla: 'Bangla',
    english: 'English',
  },
  bn: {
    dashboard: 'ড্যাশবোর্ড',
    orders: 'অর্ডার',
    products: 'পণ্য',
    inventory: 'ইনভেন্টরি',
    customers: 'কাস্টমার',
    suppliers: 'সরবরাহকারী',
    finance: 'ফাইন্যান্স',
    reports: 'রিপোর্ট',
    marketing: 'মার্কেটিং',
    settings: 'সেটিংস',
    todayOrders: 'আজকের অর্ডার',
    todayRevenue: 'আজকের আয়',
    todayExpenses: 'আজকের খরচ',
    todayProfit: 'আজকের লাভ',
    pendingOrders: 'পেন্ডিং অর্ডার',
    lowStock: 'স্টক কম অ্যালার্ট',
    recentOrders: 'সাম্প্রতিক অর্ডার',
    topSelling: 'সেরা বিক্রিত পণ্য',
    addOrder: 'অর্ডার যোগ করুন',
    addProduct: 'পণ্য যোগ করুন',
    addStock: 'স্টক যোগ করুন',
    addCustomer: 'কাস্টমার যোগ করুন',
    addSupplier: 'সরবরাহকারী যোগ করুন',
    addTransaction: 'লেনদেন যোগ করুন',
    status: 'অবস্থা',
    amount: 'পরিমাণ',
    date: 'তারিখ',
    name: 'নাম',
    phone: 'ফোন',
    address: 'ঠিকানা',
    category: 'ক্যাটাগরি',
    brand: 'ব্র্যান্ড',
    price: 'মূল্য',
    quantity: 'পরিমাণ',
    total: 'মোট',
    save: 'সংরক্ষণ',
    cancel: 'বাতিল',
    edit: 'সম্পাদনা',
    delete: 'মুছে ফেলুন',
    search: 'অনুসন্ধান',
    login: 'লগইন',
    logout: 'লগআউট',
    darkMode: 'ডার্ক মোড',
    lightMode: 'লাইট মোড',
    language: 'ভাষা',
    bangla: 'বাংলা',
    english: 'ইংরেজি',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
