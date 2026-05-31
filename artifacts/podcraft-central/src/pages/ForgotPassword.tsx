import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MailIcon, ArrowLeftIcon, SendIcon, ShieldCheckIcon,
  MicIcon, AudioLinesIcon, SlidersHorizontalIcon, LockIcon,
} from 'lucide-react';
import { BrandPanel } from '../components/BrandPanel';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setError('');
    setSubmitted(true);
  };

  const features = [
    { icon: MicIcon, title: 'Local-First Storage', description: 'All your data lives in your browser — no cloud required.' },
    { icon: ShieldCheckIcon, title: 'Private by Default', description: 'Nothing leaves your device unless you export it.' },
    { icon: AudioLinesIcon, title: 'Full Studio Suite', description: 'Record, edit, master, and publish from one workspace.' },
    { icon: SlidersHorizontalIcon, title: 'Professional Tools', description: 'Mastering presets, level metering, and more.' },
  ];

  const testimonial = {
    quote: "The most private podcast studio I've ever used. Everything stays on my machine.",
    author: 'Jordan Park', role: 'Independent Podcaster',
    avatar: 'https://i.pravatar.cc/80?img=12',
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl">

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex min-h-[600px]">
          <BrandPanel
            tagline={<>Your data.<br />Your device.<br /><span className="text-violet-500">Your control.</span></>}
            description="PodCraft Central is fully local. Your recordings, projects, and data never leave your browser."
            features={features}
            testimonial={testimonial}
            backgroundImage="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1600"
          />

          <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium mb-10 transition-colors self-start">
              <ArrowLeftIcon className="w-4 h-4" />
              Back to sign in
            </Link>

            <div className="max-w-md mx-auto w-full">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center mx-auto">
                    <ShieldCheckIcon className="w-8 h-8 text-violet-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">Good to know!</h1>
                    <p className="text-gray-600 leading-relaxed">
                      Since PodCraft Central stores everything locally in your browser, there's no
                      email-based password reset. Your account password is stored only on your device.
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                    <p className="text-sm font-semibold text-amber-800 mb-1">What you can do:</p>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• Try a different password — you may have used a variation</li>
                      <li>• Create a new account if you can't remember it</li>
                      <li>• Check if "Remember me" was enabled on your browser</li>
                    </ul>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link
                      to="/login"
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg text-center transition-colors">
                      Back to Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg text-center transition-colors">
                      Create New Account
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-6">
                    <LockIcon className="w-7 h-7 text-violet-600" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot your password?</h1>
                  <p className="text-gray-600 mb-8">
                    Enter your email and we'll explain what options are available for local accounts.
                  </p>

                  {error && (
                    <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                        Email address
                      </label>
                      <div className="relative">
                        <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@email.com"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                      <SendIcon className="w-5 h-5" />
                      Continue
                    </button>
                  </form>

                  <p className="mt-6 text-center text-sm text-gray-600">
                    Remember your password?{' '}
                    <Link to="/login" className="text-violet-600 hover:text-violet-700 font-medium">
                      Sign in
                    </Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 mt-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <LockIcon className="w-4 h-4" />
            <span>Your data is private and stored locally.</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4" />
            <span>No data leaves your browser</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
