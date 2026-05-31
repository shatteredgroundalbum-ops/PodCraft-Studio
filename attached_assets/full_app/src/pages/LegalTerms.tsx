import React from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { ArrowLeftIcon, FileTextIcon } from 'lucide-react';
type Section = {
  id: string;
  heading: string;
  paragraphs?: string[];
  list?: string[];
  secondaryParagraphs?: string[];
  secondaryList?: string[];
  trailingParagraphs?: string[];
};
const sections: Section[] = [
{
  id: 'platform-purpose',
  heading: '1. Platform Purpose',
  paragraphs: [
  'Podify is a podcast production platform designed to assist users with planning, recording, editing, mastering, collaboration, workflow management, and content export.',
  'Podify is not a podcast publisher.',
  'Podify is not a podcast hosting provider.',
  'Podify is not a media repository.',
  'Podify is not responsible for publishing decisions made by users.',
  'Users retain full responsibility for the content they create, publish, distribute, or otherwise make available through third-party services.']

},
{
  id: 'eligibility',
  heading: '2. Eligibility',
  paragraphs: [
  'You must be at least 13 years old to use Podify.',
  'If you are under the age of majority in your jurisdiction, you must have permission from a parent or legal guardian.',
  'You represent that you have the legal authority to enter into these Terms.']

},
{
  id: 'your-account',
  heading: '3. Your Account',
  paragraphs: ['You are responsible for:'],
  list: [
  'Maintaining accurate account information',
  'Maintaining the security of your account',
  'Maintaining the confidentiality of your password',
  'All activities occurring under your account'],

  trailingParagraphs: [
  'You must immediately notify Podify of any unauthorized access or security breach.']

},
{
  id: 'content-ownership',
  heading: '4. Content Ownership',
  paragraphs: [
  'Users retain ownership of all content created, uploaded, imported, recorded, edited, mastered, exported, or otherwise managed through Podify.',
  'Examples include:'],

  list: [
  'Podcast recordings',
  'Scripts',
  'Artwork',
  'Music',
  'Sound effects',
  'Media assets',
  'Production files',
  'Episode files',
  'Master files',
  'Exported content'],

  trailingParagraphs: [
  'Podify does not claim ownership of user-created content.']

},
{
  id: 'license',
  heading: '5. License Granted to Podify',
  paragraphs: [
  'To operate the Service, you grant Podify a limited, non-exclusive, worldwide license to:'],

  list: [
  'Store content',
  'Process content',
  'Display content to authorized users',
  'Publish content at your direction',
  'Distribute content at your direction',
  'Create backups of content',
  'Generate previews and thumbnails'],

  trailingParagraphs: [
  'This license exists solely for the purpose of operating the Service.']

},
{
  id: 'content-responsibility',
  heading: '6. Content Responsibility',
  paragraphs: [
  'You are solely responsible for content you create, upload, publish, or distribute.',
  'You represent that you own the content, or you have all necessary rights and permissions to use it.',
  'You are responsible for obtaining:'],

  list: [
  'Copyright permissions',
  'Music licenses',
  'Trademark permissions',
  'Guest releases',
  'Any other required rights']

},
{
  id: 'storage-responsibility',
  heading: '7. Storage Responsibility',
  paragraphs: [
  'Users are responsible for selecting and maintaining storage locations for their content.',
  'Podify may allow users to connect:'],

  list: [
  'Local storage',
  'User-selected cloud storage providers',
  'User-managed servers',
  'User-managed storage systems'],

  trailingParagraphs: [
  'Users are responsible for maintaining backups, managing storage providers, protecting stored content, and recovering lost content.',
  'Podify is not responsible for content loss occurring on user-controlled systems.']

},
{
  id: 'future-cloud-storage',
  heading: '8. Future Cloud Storage Services',
  paragraphs: [
  'If Podify elects to provide optional cloud storage services in the future:'],

  list: [
  'Users retain ownership of all stored content.',
  'Users retain access to stored content.',
  'Users may export content at any time.',
  'Users may download content at any time.',
  'Users may migrate content at any time.'],

  trailingParagraphs: [
  'If an account is deleted while content remains stored on Podify-operated cloud systems, users shall be provided a thirty (30) day retrieval period.',
  'Following expiration of that retrieval period, remaining content may be permanently deleted.']

},
{
  id: 'acceptable-use',
  heading: '9. Acceptable Use',
  paragraphs: ['Users may not use Podify to:'],
  list: [
  'Violate applicable laws',
  'Infringe intellectual property rights',
  'Circumvent platform security',
  'Distribute malicious software',
  'Engage in fraud or deception',
  'Impersonate another person',
  'Abuse platform resources',
  'Harass, threaten, or intimidate others']

},
{
  id: 'prohibited-content',
  heading: '10. Prohibited Content',
  paragraphs: [
  'Users may not use Podify to create, organize, distribute, promote, or support content that:'],

  list: [
  'Encourages violence against individuals',
  'Encourages violence against groups',
  'Encourages harm based on race',
  'Encourages harm based on ethnicity',
  'Encourages harm based on nationality',
  'Encourages harm based on religion',
  'Encourages harm based on sex',
  'Encourages harm based on gender',
  'Encourages harm based on age',
  'Encourages harm against children',
  'Promotes terrorism',
  'Promotes violent extremism',
  'Promotes unlawful violence',
  'Promotes human exploitation'],

  trailingParagraphs: [
  'Nothing in this section prohibits news reporting, educational content, historical discussion, academic analysis, commentary, criticism, or satire — provided such content does not promote or encourage prohibited conduct.']

},
{
  id: 'team-collaboration',
  heading: '11. Team Collaboration',
  paragraphs: [
  'Podify supports collaborative workspaces.',
  'Workspace Owners and Administrators may:'],

  list: [
  'Invite members',
  'Assign permissions',
  'Remove members',
  'Manage projects'],

  trailingParagraphs: [
  'Users are responsible for actions taken within their assigned permissions.']

},
{
  id: 'ai-features',
  heading: '12. AI Features',
  paragraphs: [
  'Podify may provide AI-assisted features.',
  'AI-generated outputs:'],

  list: [
  'May be inaccurate',
  'May contain errors',
  'Should be reviewed before use'],

  trailingParagraphs: [
  'You are solely responsible for decisions made based on AI-generated content. Podify makes no guarantee regarding the accuracy of AI-generated outputs.']

},
{
  id: 'distribution-assistance',
  heading: '13. Distribution Assistance',
  paragraphs: [
  'Podify does not publish content on behalf of users.',
  'Podify may, at its sole discretion, provide tools that assist users in distributing content to supported third-party platforms.',
  'Distribution assistance may include:'],

  list: [
  'Export tools',
  'Submission tools',
  'Platform integrations',
  'Workflow automation'],

  trailingParagraphs: [
  'Podify is under no obligation to support any particular distribution service, hosting provider, or platform.',
  'Users remain solely responsible for publishing decisions, distribution decisions, platform compliance, metadata accuracy, and rights management.',
  'Users may also choose to distribute content independently using any provider or service of their choice.']

},
{
  id: 'third-party-services',
  heading: '14. Third-Party Services',
  paragraphs: [
  'Podify may integrate with third-party services.',
  'Examples include:'],

  list: [
  'Distribution platforms',
  'Cloud storage providers',
  'AI providers',
  'Authentication providers',
  'Analytics providers'],

  trailingParagraphs: [
  'Podify is not responsible for third-party services, content, policies, availability, or actions.']

},
{
  id: 'subscription-plans',
  heading: '15. Subscription Plans',
  paragraphs: [
  'Certain features may require a paid subscription.',
  'Subscription details are presented at the time of purchase.',
  'Features, limits, and pricing may vary by plan.']

},
{
  id: 'billing',
  heading: '16. Billing',
  paragraphs: [
  'By purchasing a subscription, you authorize Podify to charge the selected payment method.',
  'You agree to provide accurate billing information.',
  'Failure to maintain valid payment information may result in suspension of paid features.']

},
{
  id: 'renewals',
  heading: '17. Renewals',
  paragraphs: [
  'Subscriptions automatically renew unless canceled before the renewal date.',
  'Renewal charges will be billed using the payment method on file.']

},
{
  id: 'cancellation',
  heading: '18. Cancellation',
  paragraphs: [
  'You may cancel your subscription at any time.',
  'Cancellation prevents future renewals.',
  'Previously paid fees are generally non-refundable except where required by law.']

},
{
  id: 'service-availability',
  heading: '19. Service Availability',
  paragraphs: [
  'Podify strives to provide reliable service but does not guarantee uninterrupted availability.',
  'Service interruptions may occur due to:'],

  list: [
  'Maintenance',
  'Upgrades',
  'Security incidents',
  'Infrastructure failures',
  'Third-party outages']

},
{
  id: 'privacy',
  heading: '20. Privacy',
  paragraphs: [
  'Your use of Podify is also governed by the Privacy Policy.',
  'The Privacy Policy explains how personal information is collected, used, and protected.']

},
{
  id: 'intellectual-property',
  heading: '21. Intellectual Property',
  paragraphs: [
  'Podify and its associated software, branding, logos, designs, interfaces, and platform features remain the exclusive property of Podify and its licensors.',
  'No ownership rights are transferred to users.']

},
{
  id: 'copyright-complaints',
  heading: '22. Copyright Complaints',
  paragraphs: [
  'Podify respects intellectual property rights.',
  'Copyright owners may submit complaints regarding allegedly infringing material.',
  'Podify may remove or disable access to content while investigating reported claims.']

},
{
  id: 'platform-enforcement',
  heading: '23. Platform Enforcement',
  paragraphs: ['Podify reserves the right to:'],
  list: [
  'Investigate suspected violations',
  'Restrict platform access',
  'Remove content from Podify-controlled systems',
  'Suspend accounts',
  'Terminate accounts'],

  trailingParagraphs: [
  'when reasonably necessary to protect users, protect the platform, enforce these Terms, or comply with legal obligations.',
  'Podify may take such action with or without prior notice where circumstances require.']

},
{
  id: 'limitation-of-responsibility',
  heading: '24. Limitation of Responsibility',
  paragraphs: ['Users are solely responsible for:'],
  list: [
  'Their content',
  'Their publishing activities',
  'Their distribution activities',
  'Their storage decisions',
  'Their backup practices'],

  secondaryParagraphs: ['Podify shall not be responsible for:'],
  secondaryList: [
  'Content loss on user-controlled systems',
  'Third-party platform decisions',
  'Third-party hosting services',
  'Third-party storage providers',
  'Third-party distribution providers'],

  trailingParagraphs: ['except where required by applicable law.']
},
{
  id: 'disclaimer',
  heading: '25. Disclaimer of Warranties',
  paragraphs: [
  'Podify is provided on an "as is" and "as available" basis.',
  'To the fullest extent permitted by law, Podify disclaims all warranties, including:'],

  list: [
  'Merchantability',
  'Fitness for a particular purpose',
  'Non-infringement',
  'Availability',
  'Reliability'],

  trailingParagraphs: ['Use of the Service is at your own risk.']
},
{
  id: 'limitation-of-liability',
  heading: '26. Limitation of Liability',
  paragraphs: [
  'To the fullest extent permitted by law, Podify and its affiliates shall not be liable for:'],

  list: [
  'Indirect damages',
  'Incidental damages',
  'Special damages',
  'Consequential damages',
  'Loss of profits',
  'Loss of revenue',
  'Loss of data',
  'Business interruption'],

  trailingParagraphs: [
  'The total liability of Podify shall not exceed the amount paid by the user during the twelve months preceding the claim.']

},
{
  id: 'indemnification',
  heading: '27. Indemnification',
  paragraphs: [
  'You agree to defend, indemnify, and hold harmless Podify and its affiliates from claims, damages, losses, liabilities, and expenses arising from:'],

  list: [
  'Your content',
  'Your use of the Service',
  'Your violation of these Terms',
  'Your violation of applicable law']

},
{
  id: 'governing-law',
  heading: '28. Governing Law',
  paragraphs: [
  'These Terms shall be governed by the laws of the jurisdiction in which Podify is operated, without regard to conflict-of-law principles.']

},
{
  id: 'changes-to-service',
  heading: '29. Changes to the Service',
  paragraphs: [
  'Podify may modify, update, replace, suspend, or discontinue features at any time.',
  'Podify is not obligated to continue providing any specific feature indefinitely.']

},
{
  id: 'changes-to-terms',
  heading: '30. Changes to These Terms',
  paragraphs: [
  'Podify may update these Terms periodically.',
  'Continued use of the Service after changes become effective constitutes acceptance of the revised Terms.']

},
{
  id: 'severability',
  heading: '31. Severability',
  paragraphs: [
  'If any provision of these Terms is found unenforceable, the remaining provisions shall remain in full force and effect.']

},
{
  id: 'entire-agreement',
  heading: '32. Entire Agreement',
  paragraphs: [
  'These Terms constitute the entire agreement between you and Podify regarding the Service and supersede all prior agreements and understandings.']

},
{
  id: 'contact',
  heading: '33. Contact Information',
  paragraphs: [
  'Questions regarding these Terms should be directed to Podify Support through the official support channels provided within the Service.']

},
{
  id: 'acceptance',
  heading: '34. Acceptance',
  paragraphs: [
  'By accessing or using Podify, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.']

}];

export function LegalTerms() {
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
              <FileTextIcon className="w-3.5 h-3.5" />
              Terms of Service
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              Podify Terms of Service
            </h1>
            <p className="text-sm text-gray-500">
              Effective Date: [Insert Date]
            </p>
          </div>

          {/* Intro */}
          <div className="mb-12 p-5 bg-violet-50/40 border border-violet-100 rounded-xl">
            <p className="text-[15px] text-gray-700 leading-relaxed">
              By creating an account, accessing, or using Podify, you agree to
              these Terms of Service. If you do not agree, do not use the
              Service.
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
                  {section.secondaryParagraphs?.map((p, i) =>
                <p
                  key={`sp-${i}`}
                  className="text-[15px] text-gray-700 leading-relaxed">
                  
                      {p}
                    </p>
                )}
                  {section.secondaryList &&
                <ul className="space-y-1.5 pl-1">
                      {section.secondaryList.map((item) =>
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
              These Terms of Service were last updated on the effective date
              shown above. Continued use of Podify after any update constitutes
              acceptance of the revised Terms.
            </p>
          </div>
        </article>

        {/* Sticky TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              On this page
            </p>
            <ul className="space-y-1.5 border-l border-gray-200 max-h-[calc(100vh-4rem)] overflow-y-auto">
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