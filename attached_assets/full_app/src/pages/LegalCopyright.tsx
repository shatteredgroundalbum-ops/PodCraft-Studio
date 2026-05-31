import React from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { ArrowLeftIcon, ScaleIcon } from 'lucide-react';
type Section = {
  id: string;
  heading: string;
  paragraphs?: string[];
  list?: string[];
  trailingParagraphs?: string[];
};
const sections: Section[] = [
{
  id: 'introduction',
  heading: '1. Introduction',
  paragraphs: [
  'Podify respects intellectual property rights and expects all users to do the same.',
  'This Copyright Policy explains how Podify handles copyright complaints, intellectual property disputes, and alleged copyright infringement occurring through use of the platform.',
  'Podify is a podcast production platform that allows users to create, edit, manage, organize, and export content.',
  'Users remain solely responsible for ensuring they possess the rights necessary to use content they upload, import, create, edit, distribute, or otherwise manage through Podify.']

},
{
  id: 'ip-rights',
  heading: '2. Intellectual Property Rights',
  paragraphs: [
  'Users must respect the intellectual property rights of others.',
  'Users may only use content for which they have:'],

  list: [
  'Ownership rights',
  'License rights',
  'Written permission',
  'Legal authorization',
  'Public domain rights',
  'Other lawful rights of use'],

  trailingParagraphs: ['This applies to:']
},
{
  id: 'ip-rights-content',
  heading: '2a. Covered Content Types',
  list: [
  'Audio recordings',
  'Music',
  'Sound effects',
  'Scripts',
  'Images',
  'Artwork',
  'Logos',
  'Video',
  'Written content',
  'Voice recordings',
  'Production assets']

},
{
  id: 'user-responsibility',
  heading: '3. User Responsibility',
  paragraphs: [
  'Users are solely responsible for determining whether they possess the rights necessary to use content.',
  'Users represent and warrant that they possess all necessary rights to:'],

  list: [
  'Upload content',
  'Import content',
  'Edit content',
  'Export content',
  'Publish content',
  'Distribute content'],

  trailingParagraphs: ['Podify does not verify ownership of user content.']
},
{
  id: 'copyright-infringement',
  heading: '4. Copyright Infringement',
  paragraphs: [
  'Copyright infringement occurs when copyrighted material is used without authorization from the copyright owner or applicable legal exception.',
  'Examples may include:'],

  list: [
  'Unauthorized music use',
  'Unauthorized audio clips',
  'Unauthorized artwork',
  'Unauthorized images',
  'Unauthorized video content',
  'Unauthorized scripts',
  'Unauthorized recordings'],

  trailingParagraphs: [
  'Users are responsible for ensuring compliance with copyright laws.']

},
{
  id: 'fair-use',
  heading: '5. Fair Use and Legal Exceptions',
  paragraphs: [
  'Certain jurisdictions recognize legal exceptions to copyright protection.',
  'Examples may include:'],

  list: [
  'Fair use',
  'Fair dealing',
  'Commentary',
  'Criticism',
  'News reporting',
  'Research',
  'Education',
  'Scholarship'],

  trailingParagraphs: [
  'Because copyright laws vary by jurisdiction, users remain responsible for determining whether a legal exception applies.',
  'Podify does not provide legal advice.']

},
{
  id: 'copyright-complaints',
  heading: '6. Copyright Complaints',
  paragraphs: [
  'Copyright owners or authorized representatives may submit copyright complaints if they believe copyrighted material has been used unlawfully through Podify.',
  'Complaints should include sufficient information to identify:'],

  list: [
  'The copyrighted work',
  'The allegedly infringing content',
  'Ownership information',
  'Contact information',
  'Supporting documentation'],

  trailingParagraphs: ['Incomplete complaints may delay review.']
},
{
  id: 'dmca-notice',
  heading: '7. Required DMCA Notice Information',
  paragraphs: [
  'If submitting a notice under the Digital Millennium Copyright Act (DMCA), the notice should include:'],

  list: [
  'Identification of the copyrighted work claimed to be infringed',
  'Identification of the allegedly infringing material',
  'Sufficient information to locate the material',
  'Contact information of the complaining party',
  'A statement of good-faith belief that the use is unauthorized',
  'A statement that the information is accurate',
  'A statement made under penalty of perjury that the complaining party is authorized to act on behalf of the copyright owner',
  'Physical or electronic signature']

},
{
  id: 'review-process',
  heading: '8. Review Process',
  paragraphs: ['Upon receipt of a valid complaint, Podify may:'],
  list: [
  'Review the complaint',
  'Request additional information',
  'Contact involved parties',
  'Restrict access to disputed content',
  'Take enforcement action where appropriate'],

  trailingParagraphs: [
  'Podify reserves the right to investigate reported claims before taking action.']

},
{
  id: 'counter-notifications',
  heading: '9. Counter-Notifications',
  paragraphs: [
  'Users who believe content was removed or restricted in error may submit a counter-notification where permitted by applicable law.',
  'Counter-notifications should include:'],

  list: [
  'Identification of the affected content',
  'User contact information',
  'Statement of good-faith belief that removal was in error',
  'Consent to applicable legal requirements',
  'Electronic or physical signature'],

  trailingParagraphs: [
  'Submission of a counter-notification does not guarantee restoration of content.']

},
{
  id: 'repeat-infringers',
  heading: '10. Repeat Infringers',
  paragraphs: [
  'Podify may restrict, suspend, or terminate accounts associated with repeated copyright violations.',
  'Factors considered may include:'],

  list: [
  'Number of complaints',
  'Validity of complaints',
  'Severity of violations',
  'User response history'],

  trailingParagraphs: [
  'Podify reserves the right to determine what constitutes repeated infringement.']

},
{
  id: 'trademarks',
  heading: '11. Trademarks',
  paragraphs: ['Users must respect trademark rights.'],
  list: [
  'Use trademarks unlawfully',
  'Misrepresent affiliation',
  'Impersonate organizations',
  'Create misleading branding'],

  trailingParagraphs: [
  'Users may not engage in any of the above behaviors. Trademark disputes may be reviewed separately from copyright complaints.']

},
{
  id: 'ownership-of-user-content',
  heading: '12. Ownership of User Content',
  paragraphs: [
  'Users retain ownership of content they lawfully create and own.',
  'Podify does not claim ownership of:'],

  list: [
  'Podcast episodes',
  'Recordings',
  'Scripts',
  'Artwork',
  'Music owned by users',
  'Production assets',
  'Media libraries'],

  trailingParagraphs: [
  'Users remain responsible for establishing ownership and protecting their intellectual property rights.']

},
{
  id: 'platform-role',
  heading: '13. Platform Role',
  paragraphs: [
  'Podify is a production platform.',
  'Podify is not a publisher.',
  'Podify is not a content owner.',
  'Podify does not assume responsibility for verifying ownership of content uploaded, imported, created, edited, exported, published, or distributed by users.',
  'Users remain solely responsible for rights management.']

},
{
  id: 'false-claims',
  heading: '14. False Claims',
  paragraphs: [
  'Knowingly submitting false copyright complaints or false counter-notifications may result in:'],

  list: [
  'Rejection of the submission',
  'Account restrictions',
  'Account suspension',
  'Account termination',
  'Potential legal consequences'],

  trailingParagraphs: [
  'Users should ensure all submitted information is accurate.']

},
{
  id: 'limitation-of-responsibility',
  heading: '15. Limitation of Responsibility',
  paragraphs: [
  'Podify cannot guarantee detection of all copyright violations.',
  'Users remain solely responsible for:'],

  list: ['Rights clearance', 'Licensing', 'Permissions', 'Legal compliance'],
  trailingParagraphs: [
  'Nothing in this policy transfers responsibility for intellectual property compliance from the user to Podify.']

},
{
  id: 'changes',
  heading: '16. Changes to This Policy',
  paragraphs: [
  'Podify may update this Copyright Policy periodically.',
  'Updated versions become effective upon publication.',
  'Continued use of Podify after changes become effective constitutes acceptance of the revised policy.']

},
{
  id: 'contact',
  heading: '17. Contact Information',
  paragraphs: [
  'Copyright complaints, DMCA notices, counter-notifications, and intellectual property inquiries should be submitted through the official Podify copyright contact channels.']

},
{
  id: 'summary',
  heading: '18. Summary',
  paragraphs: [
  'Podify respects intellectual property rights and expects users to do the same.',
  'Users must possess appropriate rights before using copyrighted material.',
  'Copyright owners may submit complaints regarding allegedly infringing content.',
  'Users may submit counter-notifications where permitted by law.',
  'Users remain solely responsible for copyright compliance, licensing, permissions, and rights management for content created, uploaded, edited, exported, published, or distributed through Podify.']

}];

export function LegalCopyright() {
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
              <ScaleIcon className="w-3.5 h-3.5" />
              Copyright & DMCA
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              Podify Copyright Policy and DMCA Notice
            </h1>
            <p className="text-sm text-gray-500">
              Effective Date: [Insert Date]
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
              This Copyright Policy was last updated on the effective date shown
              above. Continued use of Podify after any update constitutes
              acceptance of the revised policy.
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