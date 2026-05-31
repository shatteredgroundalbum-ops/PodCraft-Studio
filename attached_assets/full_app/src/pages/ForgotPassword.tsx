import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  MailIcon,
  SendIcon,
  ShieldCheckIcon,
  HelpCircleIcon } from
'lucide-react';
import { PodifyLogo } from '../components/PodifyLogo';
export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };
  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{
          opacity: 0,
          y: 20
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          duration: 0.5
        }}
        className="w-full max-w-lg">
        
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium mb-8 transition-colors">
            
            <ArrowLeftIcon className="w-4 h-4" />
            Back to sign in
          </Link>

          <div className="flex justify-center mb-8">
            <PodifyLogo variant="dark" size="md" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Forgot your password?
            </h1>
            <p className="text-gray-600 max-w-md mx-auto">
              No worries. Enter your email address and we'll send you a link to
              reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900 mb-2">
                
                Email address
              </label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all" />
                
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
              
              <SendIcon className="w-5 h-5" />
              {isLoading ? 'Sending...' : 'Send reset email'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">
                  OR
                </span>
              </div>
            </div>

            <div className="bg-violet-50 rounded-xl p-6 border border-violet-100">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center">
                  <ShieldCheckIcon className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Secure & Private
                  </h3>
                  <p className="text-sm text-gray-600">
                    We'll never share your email with anyone. Your account is
                    safe with us.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600">
              Remember your password?{' '}
              <Link
                to="/login"
                className="text-violet-600 hover:text-violet-700 font-medium">
                
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500">
          <HelpCircleIcon className="w-4 h-4" />
          <span>Need help?</span>
          <a
            href="#"
            className="text-violet-600 hover:text-violet-700 font-medium">
            
            Contact Support
          </a>
        </div>
      </motion.div>
    </div>);

}