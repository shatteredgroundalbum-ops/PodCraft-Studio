import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, LogInIcon, ShieldIcon, MicIcon, AudioLinesIcon, RocketIcon } from 'lucide-react';
import { BrandPanel } from '../components/BrandPanel';
import { useAuth } from '../store/AuthStore';

export function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setError('');
    setIsLoading(true);
    const result = await signIn(email, password);
    setIsLoading(false);
    if (result.ok) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Sign in failed.');
    }
  };

  const features = [
    { icon: MicIcon, title: 'Professional Recording', description: 'High quality recording with multiple tracks and smart tools.' },
    { icon: AudioLinesIcon, title: 'Powerful Editing', description: 'Intuitive DAW-powered editor with mixing and mastering.' },
    { icon: RocketIcon, title: 'Ready to Publish', description: 'Transcripts, show notes, metadata and export — done.' },
  ];

  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex">
          <BrandPanel
            tagline={<>Plan.<br />Record.<br />Edit.<br /><span className="text-violet-500">Publish.</span></>}
            description="The complete podcast production workspace for creators who demand quality."
            features={features}
          />

          <div className="w-full lg:w-1/2 p-8 md:p-12">
            <div className="max-w-md mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
                <p className="text-gray-600">Sign in to your PodCraft Central workspace</p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all" />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">Password</label>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                    <span className="text-sm text-gray-700">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-sm text-violet-600 hover:text-violet-700 font-medium">Forgot password?</Link>
                </div>

                <button type="submit" disabled={isLoading}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  <LogInIcon className="w-5 h-5" />
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>

                <p className="text-center text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link to="/signup" className="text-violet-600 hover:text-violet-700 font-medium">Create one</Link>
                </p>
              </form>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 mt-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <ShieldIcon className="w-4 h-4" />
            <span>Your data is private and stored locally.</span>
          </div>
          <div className="flex items-center gap-2">
            <LockIcon className="w-4 h-4" />
            <span>Protected by local encryption</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
