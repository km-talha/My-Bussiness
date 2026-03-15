import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { LogIn } from 'lucide-react';

const Auth: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-zinc-950 p-4">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-md w-full text-center">
        <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-4xl mx-auto mb-8 shadow-lg shadow-emerald-200 dark:shadow-none">
          P
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">PureTaste</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">Business Manager Login</p>
        
        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm rounded-xl border border-rose-100 dark:border-rose-800">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>Sign in with Google</span>
            </>
          )}
        </button>
        
        <p className="mt-8 text-xs text-zinc-400 uppercase tracking-widest font-medium">
          Authorized Personnel Only
        </p>
      </div>
    </div>
  );
};

export default Auth;
