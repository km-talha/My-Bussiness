import React from 'react';
import { 
  Globe, 
  Moon, 
  Sun, 
  Shield, 
  LogOut, 
  User as UserIcon,
  Bell,
  Database
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const Settings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const user = auth.currentUser;

  const handleLogout = () => {
    signOut(auth);
  };

  const SettingItem = ({ icon: Icon, title, description, action, danger }: any) => (
    <div className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-3 rounded-xl",
          danger ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400" : "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>
      </div>
      <div>{action}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t('settings')}</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Manage your account and app preferences</p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm flex items-center gap-6">
          <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
            {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user?.displayName || 'Administrator'}</h2>
            <p className="text-zinc-500 dark:text-zinc-400">{user?.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider">
              Owner
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingItem 
            icon={Globe}
            title={t('language')}
            description="Choose your preferred interface language"
            action={
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                <button 
                  onClick={() => setLanguage('en')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                    language === 'en' ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500"
                  )}
                >
                  EN
                </button>
                <button 
                  onClick={() => setLanguage('bn')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                    language === 'bn' ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500"
                  )}
                >
                  BN
                </button>
              </div>
            }
          />

          <SettingItem 
            icon={isDarkMode ? Sun : Moon}
            title="Appearance"
            description="Switch between light and dark themes"
            action={
              <button 
                onClick={toggleDarkMode}
                className="w-12 h-6 bg-zinc-200 dark:bg-zinc-700 rounded-full relative transition-colors"
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white dark:bg-zinc-200 rounded-full transition-all",
                  isDarkMode ? "left-7" : "left-1"
                )} />
              </button>
            }
          />

          <SettingItem 
            icon={Bell}
            title="Notifications"
            description="Manage stock and order alerts"
            action={
              <button className="text-sm font-bold text-emerald-600 hover:underline">Configure</button>
            }
          />

          <SettingItem 
            icon={Database}
            title="Data Backup"
            description="Last synced: 2 minutes ago"
            action={
              <button className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                Sync Now
              </button>
            }
          />

          <SettingItem 
            icon={Shield}
            title="Security"
            description="PIN protection and access logs"
            action={
              <button className="text-sm font-bold text-emerald-600 hover:underline">Manage</button>
            }
          />

          <SettingItem 
            icon={LogOut}
            title="Sign Out"
            description="Securely log out of your account"
            danger
            action={
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
              >
                Logout
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default Settings;
