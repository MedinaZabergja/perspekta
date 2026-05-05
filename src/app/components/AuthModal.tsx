import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, name: string) => Promise<void>;
}

const getFriendlyErrorMessage = (message: string, mode: 'signin' | 'signup') => {
  if (message === 'Invalid login credentials') {
    return mode === 'signin'
      ? 'That email and password do not match a real account. If you used an older build, create the account once with Sign up first.'
      : message;
  }

  if (message.includes('already been registered')) {
    return 'This email already has a real account. Sign in with its password instead of creating it again.';
  }

  return message;
};

export default function AuthModal({ isOpen, onClose, onSignIn, onSignUp }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        await onSignIn(email, password);
      } else {
        if (!name.trim()) {
          setError('Please enter your name');
          setIsLoading(false);
          return;
        }
        await onSignUp(email, password, name);
        setError('Account created! Please check your email and confirm your account before signing in.');
        setPassword('');
        return;
      }
      // Close modal on success
      onClose();
      setEmail('');
      setPassword('');
      setName('');
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.message || 'An error occurred', mode));
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-[#3d3244]/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6">
            <motion.div
              className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full border border-[#F1C6D9]/20 shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl text-[#3d3244] font-medium">
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-[#B5A4AC] hover:text-[#F1C6D9] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <label className="block text-[#3d3244] text-sm">Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B5A4AC]" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        placeholder="Your name"
                        className="w-full pl-12 pr-4 py-3 bg-[#ffffff] border-2 border-[#F1C6D9]/30 rounded-2xl text-[#3d3244] placeholder-[#B5A4AC]/50 focus:border-[#F1C6D9] focus:outline-none transition-colors"
                        required={mode === 'signup'}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-[#3d3244] text-sm">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B5A4AC]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="your@email.com"
                      className="w-full pl-12 pr-4 py-3 bg-[#ffffff] border-2 border-[#F1C6D9]/30 rounded-2xl text-[#3d3244] placeholder-[#B5A4AC]/50 focus:border-[#F1C6D9] focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[#3d3244] text-sm">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B5A4AC]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3 bg-[#ffffff] border-2 border-[#F1C6D9]/30 rounded-2xl text-[#3d3244] placeholder-[#B5A4AC]/50 focus:border-[#F1C6D9] focus:outline-none transition-colors"
                      required
                      minLength={6}
                    />
                  </div>
                  {mode === 'signup' && (
                    <p className="text-xs text-[#B5A4AC] ml-2">At least 6 characters</p>
                  )}
                </div>

                {error && (
                  <div className="bg-[#F1C6D9]/20 border border-[#F1C6D9] rounded-2xl p-3 text-sm text-[#3d3244]">
                    {error}
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full px-8 py-3 rounded-full transition-all ${
                    isLoading
                      ? 'bg-[#e8f7f5] text-[#B5A4AC] cursor-not-allowed'
                      : 'bg-[#F1C6D9] text-white hover:bg-[#e5b0c7] shadow-sm'
                  }`}
                  whileHover={!isLoading ? { scale: 1.02 } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
                >
                  {isLoading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={switchMode}
                  className="text-sm text-[#B5A4AC] hover:text-[#F1C6D9] transition-colors"
                >
                  {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                  <span className="font-medium">
                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                  </span>
                </button>
              </div>

              <div className="mt-4 text-xs text-[#B5A4AC] text-center">
                Your data is stored securely and privately
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
