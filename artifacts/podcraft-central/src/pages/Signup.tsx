import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon, UserIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon,
  GlobeIcon, UserPlusIcon, CalendarIcon, MicIcon, AudioLinesIcon,
  SlidersHorizontalIcon, UploadIcon, ShieldIcon, XIcon, CheckCircle2Icon,
  ScrollTextIcon, FileTextIcon,
} from 'lucide-react';
import { BrandPanel } from '../components/BrandPanel';
import { useAuth } from '../store/AuthStore';
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from '../data/legalContent';
import { recordAcceptance } from '../services/legalService';

function LegalModal({
  title,
  content,
  onClose,
  onAgree,
  alreadyAccepted,
}: {
  title: string;
  content: string;
  onClose: () => void;
  onAgree: () => void;
  alreadyAccepted: boolean;
}) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (atBottom) setScrolledToBottom(true);
  };

  const lines = content.trim().split('\n');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: '85vh' }}>

        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
              <ScrollTextIcon className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {!scrolledToBottom && !alreadyAccepted && (
          <div className="px-6 py-2 bg-amber-50 border-b border-amber-100 flex-shrink-0">
            <p className="text-xs text-amber-700">Scroll to the bottom to enable the Agree button.</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm text-gray-700 space-y-2" onScroll={handleScroll}>
          {lines.map((line, i) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.slice(2, -2).includes('**')) {
              return <p key={i} className="font-bold text-gray-900 mt-4 first:mt-0">{trimmed.slice(2, -2)}</p>;
            }
            if (trimmed.startsWith('*') && trimmed.endsWith('*') && trimmed.length > 2) {
              return <p key={i} className="text-gray-500 italic text-xs">{trimmed.slice(1, -1)}</p>;
            }
            if (trimmed.startsWith('- ')) {
              return <li key={i} className="ml-5 list-disc leading-relaxed">{trimmed.slice(2)}</li>;
            }
            if (trimmed === '') return <div key={i} className="h-1" />;
            return <p key={i} className="leading-relaxed">{line}</p>;
          })}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-white transition-colors">
            Cancel
          </button>
          {alreadyAccepted ? (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle2Icon className="w-5 h-5" />
              Already agreed
            </div>
          ) : (
            <button
              onClick={() => { onAgree(); onClose(); }}
              disabled={!scrolledToBottom}
              className="px-6 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              <CheckCircle2Icon className="w-4 h-4" />
              I Agree
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timezone, setTimezone] = useState('(GMT-05:00) Eastern Time (US & Canada)');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState<'terms' | 'privacy' | null>(null);

  const bothAccepted = termsAccepted && privacyAccepted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!email) { setError('Please enter your email address.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) {
      setError('Password must contain at least one letter and one number.');
      return;
    }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!termsAccepted) {
      setError('You must read and agree to the Terms of Service before creating an account.');
      setModalOpen('terms');
      return;
    }
    if (!privacyAccepted) {
      setError('You must read and agree to the Privacy Policy before creating an account.');
      setModalOpen('privacy');
      return;
    }
    setError('');
    setIsLoading(true);
    const result = await signUp(fullName.trim(), email, password, timezone);
    if (result.ok && result.userId) {
      await Promise.all([
        recordAcceptance(result.userId, 'Terms of Service'),
        recordAcceptance(result.userId, 'Privacy Policy'),
      ]);
    }
    setIsLoading(false);
    if (result.ok) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Sign up failed. Please try again.');
    }
  };

  const features = [
    { icon: CalendarIcon, title: 'Plan Your Episodes', description: 'Organize ideas, scripts, guests and schedules.' },
    { icon: MicIcon, title: 'Record with Quality', description: 'Multi-track recording with professional tools.' },
    { icon: AudioLinesIcon, title: 'Edit & Mix', description: 'Powerful DAW editor for precise editing and mixing.' },
    { icon: SlidersHorizontalIcon, title: 'Master & Enhance', description: 'Polish your sound with mastering tools.' },
    { icon: UploadIcon, title: 'Publish Everywhere', description: 'Export and publish to all major platforms.' },
  ];

  const testimonial = {
    quote: 'PodCraft Central brings the entire podcast workflow into one powerful, beautiful workspace.',
    author: 'Alex Morgan', role: 'Podcast Producer',
    avatar: 'https://i.pravatar.cc/80?img=47',
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl">

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex">
          <BrandPanel
            tagline={<>Create.<br />Produce.<br /><span className="text-violet-500">Publish.</span></>}
            description="Everything you need to plan, record, edit, mix, master and publish professional podcasts."
            features={features}
            testimonial={testimonial}
            backgroundImage="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1600"
          />

          <div className="w-full lg:w-1/2 p-8 md:p-12 overflow-y-auto">
            <Link to="/login" className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium mb-8 transition-colors">
              <ArrowLeftIcon className="w-4 h-4" />
              Back to sign in
            </Link>

            <div className="max-w-md mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
                <p className="text-gray-600">Get started with PodCraft Central — your podcast production suite.</p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
                  <XIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-900 mb-2">Full name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all" />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">Email address</label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all" />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">Password</label>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters with a number and a letter.</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-2">Confirm password</label>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-900 mb-2">Time zone</label>
                  <div className="relative">
                    <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all appearance-none bg-white">
                      <option>(GMT-08:00) Pacific Time (US & Canada)</option>
                      <option>(GMT-07:00) Mountain Time (US & Canada)</option>
                      <option>(GMT-06:00) Central Time (US & Canada)</option>
                      <option>(GMT-05:00) Eastern Time (US & Canada)</option>
                      <option>(GMT+00:00) UTC</option>
                      <option>(GMT+01:00) Central European Time</option>
                      <option>(GMT+05:30) India Standard Time</option>
                      <option>(GMT+08:00) China Standard Time</option>
                    </select>
                  </div>
                </div>

                {/* Legal Agreements */}
                <div className="space-y-3 py-2">
                  <p className="text-sm font-medium text-gray-900">Legal agreements <span className="text-red-500">*</span></p>
                  <p className="text-xs text-gray-500">You must read and agree to both documents before creating your account.</p>

                  <div
                    onClick={() => setModalOpen('terms')}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${termsAccepted ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/30'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${termsAccepted ? 'bg-green-100' : 'bg-violet-50'}`}>
                        <ScrollTextIcon className={`w-4 h-4 ${termsAccepted ? 'text-green-600' : 'text-violet-600'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Terms of Service</p>
                        <p className="text-xs text-gray-500">Read before agreeing</p>
                      </div>
                    </div>
                    {termsAccepted ? (
                      <CheckCircle2Icon className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-1 rounded-md">Read &amp; Agree →</span>
                    )}
                  </div>

                  <div
                    onClick={() => setModalOpen('privacy')}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${privacyAccepted ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/30'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${privacyAccepted ? 'bg-green-100' : 'bg-violet-50'}`}>
                        <FileTextIcon className={`w-4 h-4 ${privacyAccepted ? 'text-green-600' : 'text-violet-600'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Privacy Policy</p>
                        <p className="text-xs text-gray-500">Read before agreeing</p>
                      </div>
                    </div>
                    {privacyAccepted ? (
                      <CheckCircle2Icon className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-1 rounded-md">Read &amp; Agree →</span>
                    )}
                  </div>

                  {bothAccepted && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
                      <CheckCircle2Icon className="w-4 h-4 flex-shrink-0" />
                      Both documents accepted — you're ready to create your account.
                    </motion.div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  <UserPlusIcon className="w-5 h-5" />
                  {isLoading ? 'Creating account…' : 'Create account'}
                </button>

                <p className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-violet-600 hover:text-violet-700 font-medium">Sign in</Link>
                </p>
              </form>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 mt-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <LockIcon className="w-4 h-4" />
            <span>Your data is private and stored locally.</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldIcon className="w-4 h-4" />
            <span>No data leaves your browser</span>
          </div>
        </div>
      </motion.div>

      {modalOpen === 'terms' && (
        <LegalModal
          title="Terms of Service"
          content={TERMS_OF_SERVICE}
          alreadyAccepted={termsAccepted}
          onClose={() => setModalOpen(null)}
          onAgree={() => { setTermsAccepted(true); setError(''); }}
        />
      )}
      {modalOpen === 'privacy' && (
        <LegalModal
          title="Privacy Policy"
          content={PRIVACY_POLICY}
          alreadyAccepted={privacyAccepted}
          onClose={() => setModalOpen(null)}
          onAgree={() => { setPrivacyAccepted(true); setError(''); }}
        />
      )}
    </div>
  );
}
