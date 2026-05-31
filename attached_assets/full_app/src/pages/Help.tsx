import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import {
  MessageSquareIcon,
  MailIcon,
  BookOpenIcon,
  UsersIcon,
  SendIcon,
  ChevronDownIcon,
  ChevronUpIcon } from
'lucide-react';
import { Link } from 'react-router-dom';
const supportChannels = [
{
  icon: MessageSquareIcon,
  title: 'Live Chat',
  description: 'Chat with our team in real time.',
  cta: 'Start chat',
  availability: 'Mon–Fri, 9am–6pm PT'
},
{
  icon: MailIcon,
  title: 'Email Support',
  description: 'Send us a message and we’ll reply within 24 hours.',
  cta: 'support@podify.com',
  availability: 'Average response: 4 hours'
},
{
  icon: BookOpenIcon,
  title: 'Knowledge Base',
  description: 'Browse guides, tutorials, and answers.',
  cta: 'Open Knowledge Base',
  availability: 'Self-serve, 24/7',
  href: '/knowledge-base'
},
{
  icon: UsersIcon,
  title: 'Community',
  description: 'Connect with other podcasters and the Podify team.',
  cta: 'Join community',
  availability: 'Discord & Slack'
}];

const faqs = [
{
  q: 'How do I connect my microphone?',
  a: 'Open the Studio, then click the Device or Microphone area in the top status bar. The setup dialog will list every audio input device available on your machine.'
},
{
  q: 'Where do my recordings go after I stop recording?',
  a: 'Raw recordings are automatically saved to your Media Library under Studio › Recordings. After mastering, masters appear in Studio › Masters.'
},
{
  q: 'Can I invite collaborators to my project?',
  a: 'Yes. Go to the Team page or open a project and use the Team tab to invite collaborators by email. You can assign roles and permissions per project.'
},
{
  q: 'How does the AI Producer work?',
  a: 'The AI Producer listens to your recording in real time and offers feedback on pacing, levels, and clarity. You can also chat with it during a session to ask for script or sound effect suggestions.'
},
{
  q: 'How do I cancel my subscription?',
  a: 'Visit Settings › Subscription and click Cancel Plan. You will retain access until the end of the current billing period.'
}];

export function Help() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSent(true);
    setMessage('');
    setTimeout(() => setSent(false), 3000);
  };
  return (
    <AppLayout title="Help & Support">
      <div className="mb-8">
        <p className="text-sm text-gray-500">
          We’re here to help. Choose how you’d like to get in touch.
        </p>
      </div>

      {/* Channels */}
      <section className="mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {supportChannels.map((c) => {
            const Inner =
            <>
                <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <c.icon className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {c.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-2">
                    {c.description}
                  </p>
                  <div className="text-xs text-gray-400 mb-3">
                    {c.availability}
                  </div>
                  <span className="text-sm font-medium text-violet-600 group-hover:text-violet-700">
                    {c.cta} →
                  </span>
                </div>
              </>;

            return c.href ?
            <Link
              key={c.title}
              to={c.href}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 hover:border-violet-300 hover:shadow-sm transition-all group">
              
                {Inner}
              </Link> :

            <button
              key={c.title}
              type="button"
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 hover:border-violet-300 hover:shadow-sm transition-all group text-left">
              
                {Inner}
              </button>;

          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQs */}
        <section className="lg:col-span-2">
          <h2 className="text-base font-bold text-gray-900 mb-4">
            Frequently asked questions
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {faqs.map((faq, i) =>
            <div key={i}>
                <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                
                  <span className="text-sm font-semibold text-gray-900">
                    {faq.q}
                  </span>
                  {openIndex === i ?
                <ChevronUpIcon className="w-4 h-4 text-gray-400" /> :

                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                }
                </button>
                {openIndex === i &&
              <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
                    {faq.a}
                  </div>
              }
              </div>
            )}
          </div>
        </section>

        {/* Contact form */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-4">
            Send us a message
          </h2>
          <form
            onSubmit={handleSend}
            className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                placeholder="What can we help with?"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Describe your issue or question..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500" />
              
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors">
              
              <SendIcon className="w-4 h-4" />
              Send message
            </button>
            {sent &&
            <p className="text-xs text-emerald-600 text-center">
                ✓ Message sent. We’ll get back to you within 24 hours.
              </p>
            }
          </form>
        </section>
      </div>
    </AppLayout>);

}