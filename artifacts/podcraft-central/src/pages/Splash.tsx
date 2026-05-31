import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2Icon } from 'lucide-react';
import { PodCraftLogo } from '../components/PodCraftLogo';
import { useAuth } from '../store/AuthStore';

export function Splash() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      navigate(user ? '/dashboard' : '/login');
    }, 2200);
    return () => clearTimeout(timer);
  }, [navigate, user, isLoading]);

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gray-900">
      <div className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1200)' }} />
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-purple-900/80 to-gray-900/95" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center space-y-8">
          <PodCraftLogo variant="light" size="lg" animated />

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-px w-64 mx-auto bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="space-y-2">
            <p className="text-2xl md:text-3xl text-gray-200 font-light">
              Plan. Record. Edit.{' '}
              <span className="text-violet-400 font-semibold">Publish.</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col items-center gap-3 pt-8">
            <Loader2Icon className="w-8 h-8 text-violet-400 animate-spin" />
            <p className="text-gray-400 text-sm">Loading your workspace...</p>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="absolute bottom-8 text-gray-500 text-sm">
          Your podcast. Your workflow. Your way.
        </motion.p>
      </div>
    </div>
  );
}
