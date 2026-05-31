import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MailIcon, ArrowLeftIcon, SendIcon, ShieldIcon } from 'lucide-react';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Link to="/login" className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium mb-8 transition-colors">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to sign in
          </Link>

          <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mb-6">
            <ShieldIcon className="w-6 h-6 text-violet-600" />
          </div>

          {submitted ? (
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
              <p className="text-gray-600 text-sm">
                Since PodCraft Central stores data locally, password reset isn't available via email.
                If you remember your password, you can sign in directly.
              </p>
              <Link to="/login" className="block mt-4 w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg text-center transition-colors">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot your password?</h1>
              <p className="text-gray-600 text-sm mb-6">Enter your email address and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">Email address</label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                  <SendIcon className="w-5 h-5" />
                  Send Reset Link
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
