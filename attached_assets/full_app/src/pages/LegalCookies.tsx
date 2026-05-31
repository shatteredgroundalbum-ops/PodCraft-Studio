import React from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { ArrowLeftIcon, CookieIcon } from 'lucide-react';
type Section = {
  id: string;
  heading: string;
  paragraphs?: string[];
  list?: string[];
  trailingParagraphs?: string[];
};
const sections: Section[] = [
{
  id: 'what-are-cookies',
  heading: '1. What Are Cookies?',
  paragraphs: [
  'Cookies are small text files stored on a device by a website or application.',
  'Cookies help applications:'],

  list: [
  'Remember user preferences',
  'Maintain login sessions',
  'Improve security',
  'Support platform functionality'],

  trailingParagraphs: [
  'Cookies do not typically contain personally identifiable information by themselves.']

},
{
  id: 'how-podify-uses-cookies',
  heading: '2. How Podify Uses Cookies',
  paragraphs: [
  'Podify uses cookies primarily for operational purposes.',
  'Examples include:'],

  list: [
  'User authentication',
  'Login session management',
  'Security verification',
  'Preference storage',
  'Platform functionality'],

  trailingParagraphs: [
  'Podify does not use cookies to sell user information.']

},
{
  id: 'essential-cookies',
  heading: '3. Essential Cookies',
  paragraphs: [
  'Essential cookies are necessary for Podify to function.',
  'These cookies may be used to:'],

  list: [
  'Maintain user login sessions',
  'Verify authentication status',
  'Protect user accounts',
  'Support security features',
  'Remember account preferences'],

  trailingParagraphs: [
  'Disabling essential cookies may prevent Podify from functioning correctly.']

},
{
  id: 'security-cookies',
  heading: '4. Security Cookies',
  paragraphs: [
  'Security cookies help protect user accounts and the platform.',
  'These cookies may be used to:'],

  list: [
  'Detect unauthorized access attempts',
  'Prevent fraudulent activity',
  'Maintain session security',
  'Verify account authentication'],

  trailingParagraphs: [
  'These cookies help maintain platform integrity and user account protection.']

},
{
  id: 'preference-cookies',
  heading: '5. Preference Cookies',
  paragraphs: [
  'Preference cookies may be used to remember user-selected settings.',
  'Examples may include:'],

  list: [
  'Interface preferences',
  'Theme settings',
  'Display preferences',
  'Workspace preferences'],

  trailingParagraphs: [
  'These cookies improve convenience by reducing the need to repeatedly configure settings.']

},
{
  id: 'analytics-cookies',
  heading: '6. Analytics Cookies',
  paragraphs: [
  'Podify may use limited analytics technologies to understand platform performance and improve functionality.',
  'Examples may include:'],

  list: [
  'Feature usage statistics',
  'Error tracking',
  'Performance monitoring',
  'Stability monitoring'],

  trailingParagraphs: [
  'Analytics information is used to improve platform operation and reliability.',
  'Podify does not use analytics cookies to build advertising profiles.']

},
{
  id: 'third-party-cookies',
  heading: '7. Third-Party Cookies',
  paragraphs: [
  'Podify may utilize trusted third-party service providers for:'],

  list: [
  'Authentication',
  'Payment processing',
  'Platform security',
  'Performance monitoring'],

  trailingParagraphs: [
  'These providers may use their own cookies or similar technologies. Such services operate under their own policies and terms.',
  'Users should review the policies of any third-party services they choose to use.']

},
{
  id: 'advertising-cookies',
  heading: '8. Advertising Cookies',
  paragraphs: [
  'Podify does not use advertising cookies for targeted advertising.',
  'Podify does not sell user information to advertisers.',
  'Podify does not use third-party advertising networks to profile users based on podcast content, projects, recordings, or production assets.']

},
{
  id: 'content-storage',
  heading: '9. Content Storage and Cookies',
  paragraphs: [
  'Podify does not use cookies to store podcast recordings, project files, media assets, or production content.',
  'Production content remains stored in locations selected by the user.',
  'Cookies are used only for platform operation, security, and functionality.']

},
{
  id: 'managing-cookies',
  heading: '10. Managing Cookies',
  paragraphs: ['Most web browsers allow users to:'],
  list: [
  'View cookies',
  'Delete cookies',
  'Block cookies',
  'Restrict cookies'],

  trailingParagraphs: [
  'Users may manage cookie settings through their browser preferences.',
  'Please note that disabling certain cookies may affect platform functionality.']

},
{
  id: 'changes',
  heading: '11. Changes to This Cookie Policy',
  paragraphs: [
  'Podify may update this Cookie Policy periodically.',
  'Updated versions become effective upon publication.',
  'Continued use of Podify after changes become effective constitutes acceptance of the revised Cookie Policy.']

},
{
  id: 'contact',
  heading: '12. Contact Information',
  paragraphs: [
  'Questions regarding this Cookie Policy should be directed to Podify Support through the official support channels provided within the platform.']

},
{
  id: 'summary',
  heading: '13. Summary',
  paragraphs: [
  'Podify uses a limited number of cookies and similar technologies to:'],

  list: [
  'Authenticate users',
  'Maintain secure sessions',
  'Remember preferences',
  'Improve platform reliability',
  'Support essential functionality'],

  trailingParagraphs: [
  'Podify does not use cookies to sell user information, track users across unrelated websites, or create advertising profiles.',
  "Podify's use of cookies is intended to support platform functionality, security, and user experience."]

}];

export function LegalCookies() {
  return (
    <AppLayout>
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link
          to="/legal"
          className="inline-flex items-center gap-1 hover:text-violet-700 font-medium">
          
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Legal & Policies
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-12 max-w-6xl">
        <article>
          {/* Header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-semibold px-2.5 py-1 rounded-md mb-4">
              <CookieIcon className="w-3.5 h-3.5" />
              Cookie Policy
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              Podify Cookie Policy
            </h1>
            <p className="text-sm text-gray-500">
              Effective Date: [Insert Date]
            </p>
          </div>

          {/* Intro */}
          <div className="mb-12 p-5 bg-violet-50/40 border border-violet-100 rounded-xl space-y-3">
            <p className="text-[15px] text-gray-700 leading-relaxed">
              This Cookie Policy explains how Podify uses cookies and similar
              technologies when you access or use the Podify platform.
            </p>
            <p className="text-[15px] text-gray-700 leading-relaxed">
              Podify uses a limited number of cookies and similar technologies
              necessary to provide platform functionality, maintain account
              security, and improve the user experience.
            </p>
            <p className="text-[15px] text-gray-700 leading-relaxed">
              By using Podify, you consent to the use of cookies as described in
              this Cookie Policy.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-10">
            {sections.map((section) =>
            <section key={section.id} id={section.id} className="scroll-mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {section.heading}
                </h2>
                <div className="space-y-4">
                  {section.paragraphs?.map((p, i) =>
                <p
                  key={`p-${i}`}
                  className="text-[15px] text-gray-700 leading-relaxed">
                  
                      {p}
                    </p>
                )}
                  {section.list &&
                <ul className="space-y-1.5 pl-1">
                      {section.list.map((item) =>
                  <li
                    key={item}
                    className="text-[15px] text-gray-700 leading-relaxed flex gap-3">
                    
                          <span className="text-violet-400 mt-1.5 flex-shrink-0">
                            •
                          </span>
                          <span>{item}</span>
                        </li>
                  )}
                    </ul>
                }
                  {section.trailingParagraphs?.map((p, i) =>
                <p
                  key={`t-${i}`}
                  className="text-[15px] text-gray-700 leading-relaxed">
                  
                      {p}
                    </p>
                )}
                </div>
              </section>
            )}
          </div>

          {/* Footer note */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <p className="text-xs text-gray-500 leading-relaxed">
              This Cookie Policy was last updated on the effective date shown
              above. Continued use of Podify after any update constitutes
              acceptance of the revised Cookie Policy.
            </p>
          </div>
        </article>

        {/* Sticky TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              On this page
            </p>
            <ul className="space-y-1.5 border-l border-gray-200">
              {sections.map((section) =>
              <li key={section.id}>
                  <a
                  href={`#${section.id}`}
                  className="block pl-3 -ml-px border-l border-transparent hover:border-violet-500 text-sm text-gray-600 hover:text-violet-700 py-1 transition-colors">
                  
                    {section.heading}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </AppLayout>);

}