import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  UserIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  GlobeIcon,
  UserPlusIcon,
  CalendarIcon,
  MicIcon,
  AudioLinesIcon,
  SlidersHorizontalIcon,
  UploadIcon,
  ShieldIcon } from
'lucide-react';
import { BrandPanel } from '../components/BrandPanel';
export function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };
  const features = [
  {
    icon: CalendarIcon,
    title: 'Plan Your Episodes',
    description: 'Organize ideas, scripts, guests and schedules.'
  },
  {
    icon: MicIcon,
    title: 'Record with Quality',
    description: 'Multi-track recording with professional tools.'
  },
  {
    icon: AudioLinesIcon,
    title: 'Edit & Mix',
    description: 'Powerful DAW editor for precise editing and mixing.'
  },
  {
    icon: SlidersHorizontalIcon,
    title: 'Master & Enhance',
    description:
    'Polish your sound with mastering tools and loudness control.'
  },
  {
    icon: UploadIcon,
    title: 'Publish Everywhere',
    description: 'Export and publish your podcast to all major platforms.'
  }];

  const testimonial = {
    quote:
    'Podify brings the entire podcast workflow into one powerful, beautiful workspace.',
    author: 'Alex Morgan',
    role: 'Podcast Producer',
    avatar: 'https://i.pravatar.cc/80?img=47'
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
        className="w-full max-w-6xl">
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex">
          <BrandPanel
            tagline={
            <>
                Create.
                <br />
                Produce.
                <br />
                <span className="text-violet-500">Publish.</span>
              </>
            }
            description="Everything you need to plan, record, edit, mix, master and publish professional podcasts."
            features={features}
            testimonial={testimonial}
            backgroundImage="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1600" />
          

          <div className="w-full lg:w-1/2 p-8 md:p-12">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium mb-8 transition-colors">
              
              <ArrowLeftIcon className="w-4 h-4" />
              Back to sign in
            </Link>

            <div className="max-w-md mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Create your account
                </h1>
                <p className="text-gray-600">
                  Get started with Podify — your podcast production suite.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-gray-900 mb-2">
                    
                    Full name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all" />
                    
                  </div>
                </div>

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

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-900 mb-2">
                    
                    Password
                  </label>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all" />
                    
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      
                      {showPassword ?
                      <EyeOffIcon className="w-5 h-5" /> :

                      <EyeIcon className="w-5 h-5" />
                      }
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 8 characters with a number and a letter.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-900 mb-2">
                    
                    Confirm password
                  </label>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all" />
                    
                    <button
                      type="button"
                      onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      
                      {showConfirmPassword ?
                      <EyeOffIcon className="w-5 h-5" /> :

                      <EyeIcon className="w-5 h-5" />
                      }
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="timezone"
                    className="block text-sm font-medium text-gray-900 mb-2">
                    
                    Time zone
                  </label>
                  <div className="relative">
                    <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      id="timezone"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all appearance-none bg-white">
                      
                      <option>(GMT-05:00) Eastern Time (US & Canada)</option>
                      <option>(GMT-08:00) Pacific Time (US & Canada)</option>
                      <option>(GMT-06:00) Central Time (US & Canada)</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                  
                  <span className="text-sm text-gray-700">
                    I agree to the{' '}
                    <a
                      href="#"
                      className="text-violet-600 hover:text-violet-700 font-medium">
                      
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a
                      href="#"
                      className="text-violet-600 hover:text-violet-700 font-medium">
                      
                      Privacy Policy
                    </a>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  
                  <UserPlusIcon className="w-5 h-5" />
                  {isLoading ? 'Creating account...' : 'Create account'}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">
                      or continue with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      Continue with Google
                    </span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor">
                      
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      Continue with Apple
                    </span>
                  </button>
                </div>

                <p className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-violet-600 hover:text-violet-700 font-medium">
                    
                    Sign in
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 mt-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <LockIcon className="w-4 h-4" />
            <span>Your data is private and secure.</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldIcon className="w-4 h-4" />
            <span>Protected by Firebase</span>
          </div>
        </div>
      </motion.div>
    </div>);

}