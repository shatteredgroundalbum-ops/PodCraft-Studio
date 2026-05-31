import React, { Children } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { ArrowLeftIcon, ShieldIcon } from 'lucide-react';
type Section = {
  id: string;
  heading: string;
  paragraphs?: string[];
  list?: string[];
};
const sections: Section[] = [
{
  id: 'information-we-collect',
  heading: '1. Information We Collect',
  paragraphs: [
  'Podify collects only the information reasonably necessary to create, secure, maintain, and operate a user account.',
  'This information may include:'],

  list: [
  'Name',
  'Username',
  'Email address',
  'Account identifier',
  'Password authentication data',
  'Subscription status',
  'Billing status',
  'Account preferences',
  'Security-related account information']

},
{
  id: 'information-we-do-not-collect',
  heading: '2. Information We Do Not Collect',
  paragraphs: [
  'Podify does not collect user content for storage or ownership purposes.',
  'Except as described elsewhere in this policy, Podify does not collect or maintain permanent copies of:'],

  list: [
  'Podcast recordings',
  'Episode audio',
  'Video files',
  'Scripts',
  'Production notes',
  'Episode artwork',
  'Music files',
  'Sound effects',
  'Images',
  'Media assets',
  'Editing projects',
  'Master files',
  'Exported episodes',
  'Project files',
  'Production documents']

},
{
  id: 'user-content-ownership',
  heading: '3. User Content Ownership',
  paragraphs: [
  'Users retain ownership of all content they create, upload, import, record, edit, master, export, or otherwise manage through Podify.',
  'Podify does not claim ownership of:'],

  list: [
  'Recordings',
  'Episodes',
  'Scripts',
  'Artwork',
  'Music',
  'Production assets',
  'Project files',
  'Media libraries',
  'Exported content']

},
{
  id: 'content-storage',
  heading: '4. Content Storage',
  paragraphs: [
  'Podify is designed to allow users to choose where their content is stored.',
  'Content may be stored in locations selected by the user, including:'],

  list: [
  'Local device storage',
  'User-selected cloud storage providers',
  'User-managed servers',
  'User-managed backup systems',
  'User-managed storage environments']

},
{
  id: 'future-cloud-storage',
  heading: '5. Future Cloud Storage Services',
  paragraphs: [
  'Podify may elect to provide optional cloud storage services in the future.',
  'If Podify provides cloud storage:'],

  list: [
  'Users retain ownership of all content.',
  'Users retain access to all stored content.',
  'Users may download content at any time.',
  'Users may export content at any time.',
  'Users may migrate content to another provider at any time.']

},
{
  id: 'billing-information',
  heading: '6. Billing Information',
  paragraphs: [
  'If a subscription is purchased, Podify may maintain information necessary for:'],

  list: [
  'Subscription management',
  'Billing support',
  'Payment verification',
  'Accounting requirements',
  'Tax compliance']

},
{
  id: 'team-collaboration',
  heading: '7. Team Collaboration',
  paragraphs: [
  'Podify may provide collaboration features that allow users to work together on projects.',
  'Workspace Owners and Administrators may manage access permissions.',
  'Users are responsible for information they choose to share within collaborative environments.',
  "Podify's role is limited to facilitating access and collaboration functionality."]

},
{
  id: 'distribution-assistance',
  heading: '8. Distribution Assistance',
  paragraphs: [
  'Podify does not publish content on behalf of users.',
  'Podify is not a podcast publisher.',
  'Podify is not responsible for publication decisions.',
  'Podify may, at its sole discretion, provide tools that assist users with distributing content to supported third-party platforms.',
  'Such tools may allow users to:'],

  list: [
  'Export content',
  'Connect third-party services',
  'Submit content to supported platforms',
  'Automate distribution workflows']

},
{
  id: 'ai-features',
  heading: '9. AI Features',
  paragraphs: [
  'Podify may provide AI-assisted production tools.',
  'These tools may assist with:'],

  list: [
  'Planning',
  'Scripting',
  'Editing recommendations',
  'Production workflows',
  'Metadata suggestions',
  'Audio recommendations']

},
{
  id: 'security',
  heading: '10. Security',
  paragraphs: [
  'Podify uses reasonable administrative and technical safeguards designed to protect account information.',
  'Security measures may include:'],

  list: [
  'Authentication systems',
  'Access controls',
  'Encryption where appropriate',
  'Security monitoring',
  'Account protection mechanisms']

},
{
  id: 'information-sharing',
  heading: '11. Information Sharing',
  paragraphs: [
  'Podify does not sell personal information.',
  'Podify does not sell user content.',
  'Podify does not monetize user-created podcast recordings, projects, scripts, or production assets.',
  'Information may only be disclosed:'],

  list: [
  'When required by law',
  'When required by court order',
  'To protect platform security',
  'To provide requested services',
  'With user authorization']

},
{
  id: 'third-party-services',
  heading: '12. Third-Party Services',
  paragraphs: [
  'Users may choose to connect third-party services.',
  'Examples may include:'],

  list: [
  'Cloud storage providers',
  'Authentication providers',
  'Payment providers',
  'Distribution services']

},
{
  id: 'data-retention',
  heading: '13. Data Retention',
  paragraphs: ['Account information may be retained as necessary to:'],
  list: [
  'Operate accounts',
  'Maintain subscriptions',
  'Comply with legal obligations',
  'Resolve disputes',
  'Enforce agreements']

},
{
  id: 'account-deletion',
  heading: '14. Account Deletion',
  paragraphs: [
  'Users may request deletion of their Podify account.',
  'Upon deletion:'],

  list: [
  'Account access may be terminated.',
  'Account information may be removed.',
  'Certain records may be retained when required by law.']

},
{
  id: 'childrens-privacy',
  heading: "15. Children's Privacy",
  paragraphs: [
  'Podify is not intended for children under the age of 13.',
  'Podify does not knowingly collect personal information from children under 13.',
  'If such information is discovered, reasonable efforts will be made to remove it.']

},
{
  id: 'international-users',
  heading: '16. International Users',
  paragraphs: [
  'Users may access Podify from different countries and jurisdictions.',
  'By using Podify, users acknowledge that account information may be processed in jurisdictions where Podify or its service providers operate.']

},
{
  id: 'changes-to-policy',
  heading: '17. Changes to This Privacy Policy',
  paragraphs: [
  'Podify may update this Privacy Policy periodically.',
  'Updated versions become effective upon publication.',
  'Continued use of Podify after changes become effective constitutes acceptance of the revised Privacy Policy.']

},
{
  id: 'contact-information',
  heading: '18. Contact Information',
  paragraphs: [
  'Questions regarding this Privacy Policy should be directed to Podify Support through the official support channels provided within the platform.']

},
{
  id: 'your-rights',
  heading: '19. Your Rights',
  paragraphs: ['Subject to applicable law, users may request:'],
  list: [
  'Access to account information',
  'Correction of account information',
  'Deletion of account information',
  'Export of account-related data maintained by Podify']

},
{
  id: 'acceptance',
  heading: '20. Acceptance',
  paragraphs: [
  'By creating an account or using Podify, you acknowledge that you have read, understood, and agree to this Privacy Policy.']

}];

export function LegalPrivacy() {
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
              <ShieldIcon className="w-3.5 h-3.5" />
              Privacy Policy
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              Podify Privacy Policy
            </h1>
            <p className="text-sm text-gray-500">
              Effective Date: [Insert Date]
            </p>
          </div>

          {/* Intro */}
          <div className="mb-10 p-5 bg-violet-50/40 border border-violet-100 rounded-xl space-y-3">
            <p className="text-[15px] text-gray-700 leading-relaxed">
              Podify is committed to protecting user privacy and maintaining
              user control over personal information and creative content.
            </p>
            <p className="text-[15px] text-gray-700 leading-relaxed">
              Podify is a podcast production platform that provides tools for
              planning, recording, editing, mastering, collaboration, exporting,
              and workflow management.
            </p>
            <ul className="space-y-1.5 text-[15px] text-gray-700">
              <li className="flex gap-3">
                <span className="text-violet-400 mt-1.5 flex-shrink-0">•</span>
                <span>Podify is not a podcast publisher.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-violet-400 mt-1.5 flex-shrink-0">•</span>
                <span>Podify is not a podcast hosting provider.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-violet-400 mt-1.5 flex-shrink-0">•</span>
                <span>Podify is not a media repository.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-violet-400 mt-1.5 flex-shrink-0">•</span>
                <span>Podify is not a content ownership platform.</span>
              </li>
            </ul>
            <p className="text-[15px] text-gray-700 leading-relaxed font-medium">
              Users retain ownership and control of their content.
            </p>
            <p className="text-[15px] text-gray-700 leading-relaxed">
              This Privacy Policy explains what information Podify collects, how
              it is used, and how it is protected. By creating an account or
              using Podify, you agree to this Privacy Policy.
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
                  key={i}
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
                </div>
              </section>
            )}
          </div>

          {/* Footer note */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <p className="text-xs text-gray-500 leading-relaxed">
              This Privacy Policy was last updated on the effective date shown
              above. Continued use of Podify after any update constitutes
              acceptance of the revised Privacy Policy.
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