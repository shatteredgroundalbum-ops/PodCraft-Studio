import React from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { ArrowLeftIcon, CopyrightIcon } from 'lucide-react';
type Section = {
  id: string;
  heading: string;
  paragraphs?: string[];
  list?: string[];
  trailingParagraphs?: string[];
};
const sections: Section[] = [
{
  id: 'purpose',
  heading: '1. Purpose',
  paragraphs: [
  'Podify is a podcast production platform designed to help creators plan, record, edit, master, organize, collaborate on, and export podcast content.',
  'This Acceptable Use Policy establishes the standards for using Podify and its services.',
  'By using Podify, you agree to comply with this Acceptable Use Policy.',
  'Failure to comply may result in warnings, restrictions, suspension, termination, or other enforcement actions.']

},
{
  id: 'creative-freedom',
  heading: '2. Creative Freedom',
  paragraphs: [
  'Podify supports creative expression and recognizes the importance of open discussion and diverse viewpoints.',
  'Users may create content involving:'],

  list: [
  'News and journalism',
  'Commentary and opinion',
  'Education and training',
  'Historical discussion',
  'Documentary content',
  'Research',
  'Criticism',
  'Satire',
  'Entertainment',
  'Fictional storytelling',
  'Religious discussion',
  'Political discussion',
  'Cultural discussion'],

  trailingParagraphs: [
  'Podify does not endorse user-created content.',
  'Users remain solely responsible for their content.']

},
{
  id: 'user-responsibility',
  heading: '3. User Responsibility',
  paragraphs: ['Users are responsible for:'],
  list: [
  'Their content',
  'Their projects',
  'Their recordings',
  'Their scripts',
  'Their media assets',
  'Their exports',
  'Their publishing decisions',
  'Their distribution decisions'],

  trailingParagraphs: [
  'Users are responsible for ensuring their content complies with applicable laws and regulations.']

},
{
  id: 'prohibited-harmful-content',
  heading: '4. Prohibited Harmful Content',
  paragraphs: [
  'Users may not use Podify to create, organize, promote, distribute, or support content that:'],

  list: [
  'Encourages violence against individuals',
  'Encourages violence against groups',
  'Encourages murder',
  'Encourages assault',
  'Encourages terrorism',
  'Encourages violent extremism',
  'Encourages physical harm',
  'Encourages criminal acts',
  'Encourages abuse'],

  trailingParagraphs: [
  'Discussion of these subjects for educational, journalistic, historical, fictional, documentary, research, or analytical purposes is permitted.',
  'The distinction is whether the content promotes or encourages harm.']

},
{
  id: 'protected-groups',
  heading: '5. Protected Groups',
  paragraphs: [
  'Users may not use Podify to create content that promotes violence, abuse, or discrimination against individuals or groups based on:'],

  list: [
  'Race',
  'Color',
  'Ethnicity',
  'National origin',
  'Nationality',
  'Religion',
  'Sex',
  'Gender',
  'Gender identity',
  'Sexual orientation',
  'Disability',
  'Age',
  'Veteran status',
  'Other legally protected characteristics'],

  trailingParagraphs: [
  'Discussion, debate, criticism, education, reporting, satire, and analysis remain permitted provided the content does not advocate harm or violence.']

},
{
  id: 'child-safety',
  heading: '6. Child Safety',
  paragraphs: ['Podify has zero tolerance for content involving:'],
  list: [
  'Child exploitation',
  'Child abuse',
  'Sexual exploitation of minors',
  'Grooming',
  'Endangerment of children',
  'Promotion of harm toward children'],

  trailingParagraphs: [
  'Violations involving child safety may result in immediate account termination and referral to appropriate authorities where required by law.']

},
{
  id: 'terrorism',
  heading: '7. Terrorism and Violent Extremism',
  paragraphs: ['Users may not use Podify to:'],
  list: [
  'Promote terrorism',
  'Recruit for terrorist organizations',
  'Raise funds for terrorist organizations',
  'Support violent extremist organizations',
  'Encourage acts of terrorism',
  'Encourage acts of violent extremism'],

  trailingParagraphs: [
  'Educational, historical, journalistic, and research discussions remain permitted.']

},
{
  id: 'criminal-activity',
  heading: '8. Criminal Activity',
  paragraphs: [
  'Users may not use Podify to facilitate, organize, encourage, or promote:'],

  list: [
  'Human trafficking',
  'Drug trafficking',
  'Fraud',
  'Identity theft',
  'Financial scams',
  'Computer crimes',
  'Organized crime',
  'Criminal conspiracies',
  'Money laundering',
  'Other unlawful activities']

},
{
  id: 'harassment',
  heading: '9. Harassment and Abuse',
  paragraphs: ['Users may not use Podify to:'],
  list: [
  'Harass others',
  'Threaten others',
  'Intimidate others',
  'Encourage targeted abuse',
  'Encourage stalking',
  'Coordinate harassment campaigns'],

  trailingParagraphs: [
  'Podify is intended to support content creation, not abuse or intimidation.']

},
{
  id: 'intellectual-property',
  heading: '10. Intellectual Property',
  paragraphs: [
  'Users must respect intellectual property rights.',
  'Users may not upload, distribute, or use content without the necessary rights or permissions.',
  'Examples include:'],

  list: [
  'Copyrighted music',
  'Copyrighted recordings',
  'Copyrighted artwork',
  'Copyrighted images',
  'Copyrighted video',
  'Copyrighted written content'],

  trailingParagraphs: [
  'Users remain responsible for obtaining licenses and permissions where required.']

},
{
  id: 'fraud',
  heading: '11. Fraud and Misrepresentation',
  paragraphs: ['Users may not:'],
  list: [
  'Impersonate another person',
  'Falsely represent an organization',
  'Misrepresent ownership of content',
  'Misrepresent identity',
  'Mislead users regarding affiliations or authority']

},
{
  id: 'platform-security',
  heading: '12. Platform Security',
  paragraphs: ['Users may not:'],
  list: [
  'Attempt unauthorized access',
  'Circumvent security measures',
  'Interfere with platform operations',
  'Introduce malicious software',
  'Disrupt services',
  'Abuse platform infrastructure'],

  trailingParagraphs: [
  'Security violations may result in immediate enforcement action.']

},
{
  id: 'spam',
  heading: '13. Spam and Platform Abuse',
  paragraphs: ['Users may not use Podify to:'],
  list: [
  'Send spam',
  'Conduct unsolicited mass communications',
  'Manipulate platform systems',
  'Abuse platform resources',
  'Interfere with other users']

},
{
  id: 'ai-content',
  heading: '14. AI-Assisted Content',
  paragraphs: [
  'Podify may provide AI-assisted tools.',
  'Users remain responsible for all content generated, edited, exported, published, or distributed using AI-assisted features.',
  'Use of AI does not transfer responsibility from the user to Podify.',
  'All AI-assisted content must comply with this Acceptable Use Policy.']

},
{
  id: 'team-collaboration',
  heading: '15. Team Collaboration',
  paragraphs: ['Users participating in collaborative workspaces must:'],
  list: [
  'Respect team permissions',
  'Respect project ownership',
  'Respect collaborator rights',
  'Use shared resources appropriately'],

  trailingParagraphs: [
  'Unauthorized access to projects or content is prohibited.']

},
{
  id: 'distribution',
  heading: '16. Distribution and Publishing',
  paragraphs: [
  'Podify is not a publisher.',
  'Podify does not publish content on behalf of users.',
  'Podify may provide optional tools that assist users with distributing content to supported third-party platforms.',
  'Users remain solely responsible for:'],

  list: [
  'Publishing decisions',
  'Distribution decisions',
  'Platform compliance',
  'Rights management',
  'Metadata accuracy']

},
{
  id: 'enforcement',
  heading: '17. Enforcement',
  paragraphs: ['Podify reserves the right to:'],
  list: [
  'Investigate violations',
  'Restrict functionality',
  'Suspend accounts',
  'Terminate accounts',
  'Remove content from Podify-controlled systems when applicable'],

  trailingParagraphs: [
  'Enforcement actions may be taken when reasonably necessary to protect users, protect the platform, enforce platform policies, or comply with legal obligations.']

},
{
  id: 'reporting',
  heading: '18. Reporting Violations',
  paragraphs: [
  'Users may report suspected violations through official Podify support channels.',
  'Reports should contain sufficient information to allow investigation.',
  'Podify may review reported content and account activity when investigating alleged violations.']

},
{
  id: 'appeals',
  heading: '19. Appeals',
  paragraphs: [
  'Users may request review of certain enforcement decisions.',
  'Podify reserves the right to make final determinations regarding policy enforcement.',
  'Submission of an appeal does not guarantee reversal of a decision.']

},
{
  id: 'changes',
  heading: '20. Changes to This Policy',
  paragraphs: [
  'Podify may update this Acceptable Use Policy periodically.',
  'Updated versions become effective upon publication.',
  'Continued use of Podify after changes become effective constitutes acceptance of the revised policy.']

},
{
  id: 'summary',
  heading: '21. Summary',
  paragraphs: [
  'Podify exists to help creators produce, organize, collaborate on, and manage podcast content.',
  'Users are free to create content involving:'],

  list: [
  'Education',
  'Journalism',
  'Commentary',
  'Criticism',
  'Research',
  'History',
  'Entertainment',
  'Fiction'],

  trailingParagraphs: [
  'Users may not use Podify to promote violence, terrorism, exploitation, or unlawful activity; promote harm against protected groups; abuse other users; violate intellectual property rights; or abuse platform systems.',
  'All users are expected to use Podify responsibly, lawfully, and respectfully.']

}];

export function LegalAcceptableUse() {
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
              <CopyrightIcon className="w-3.5 h-3.5" />
              Acceptable Use Policy
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              Podify Acceptable Use Policy
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
              This Acceptable Use Policy was last updated on the effective date
              shown above. Continued use of Podify after any update constitutes
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