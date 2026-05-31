import React, { Component } from 'react';
import {
  ZapIcon,
  MicIcon,
  FileTextIcon,
  UsersIcon,
  SettingsIcon,
  PlayCircleIcon } from
'lucide-react';
export type KnowledgeBaseArticleSummary = {
  title: string;
  description: string;
  readTime: string;
  href: string;
  comingSoon?: boolean;
};
export type KnowledgeBaseCategory = {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{
    className?: string;
  }>;
  articles: KnowledgeBaseArticleSummary[];
};
export const knowledgeBaseCategories: KnowledgeBaseCategory[] = [
{
  id: 'getting-started',
  title: 'Getting Started',
  description:
  'Set up your account, create your first project, and start recording.',
  icon: ZapIcon,
  articles: [
  {
    title: 'Welcome to Podify',
    description:
    'An overview of Podify and how it organizes your workflow.',
    readTime: '5 min read',
    href: '/knowledge-base/welcome'
  },
  {
    title: 'Creating Your First Project',
    description: 'Set up the top-level container for your podcast series.',
    readTime: '6 min read',
    href: '/knowledge-base/create-your-first-project'
  },
  {
    title: 'Creating Your First Episode',
    description:
    'Add an Episode inside a Project and prepare for recording.',
    readTime: '7 min read',
    href: '/knowledge-base/create-your-first-episode'
  },
  {
    title: 'Navigating Podify',
    description:
    'Understand each section of the application and what it does.',
    readTime: '7 min read',
    href: '/knowledge-base/navigating-podify'
  },
  {
    title: 'Setting Up Your Workspace',
    description:
    'Configure devices, scripts, and assets before you record.',
    readTime: '8 min read',
    href: '/knowledge-base/setting-up-your-workspace'
  },
  {
    title: 'Your First Recording Session',
    description:
    'Walk through opening Studio and capturing your first take.',
    readTime: '9 min read',
    href: '/knowledge-base/completing-your-first-recording'
  },
  {
    title: 'Reviewing, Mastering, Exporting, and Publishing',
    description: 'Polish your recording and ship it to listeners.',
    readTime: '10 min read',
    href: '/knowledge-base/mastering-exporting-and-publishing'
  }]

},
{
  id: 'recording-and-studio',
  title: 'Recording & Studio',
  description:
  'Configure devices, master the Studio, and capture studio-quality audio.',
  icon: MicIcon,
  articles: [
  {
    title: 'Recording & Studio',
    description:
    'An overview of Studio and how it fits into your production workflow.',
    readTime: '10 min read',
    href: '/knowledge-base/studio-overview'
  },
  {
    title: 'Connecting a USB Microphone',
    description:
    'Connect your USB microphone and confirm it is detected by Studio.',
    readTime: '8 min read',
    href: '/knowledge-base/connecting-a-usb-microphone'
  },
  {
    title: 'Connecting an Audio Interface',
    description: 'Use an XLR mic and interface with Podify Studio.',
    readTime: '9 min read',
    href: '/knowledge-base/connecting-an-audio-interface'
  },
  {
    title: 'Device Detection and Troubleshooting',
    description:
    'Diagnose and fix microphone, interface, and headphone detection issues.',
    readTime: '10 min read',
    href: '/knowledge-base/device-detection-and-troubleshooting'
  },
  {
    title: 'Configuring Your Audio Device in Studio',
    description:
    'Select input, output, sample rate, and bit depth for clean recordings.',
    readTime: '8 min read',
    href: '/knowledge-base/configuring-your-audio-device-in-studio'
  },
  {
    title: 'Managing Levels and Gain',
    description: 'Set healthy recording levels and avoid clipping.',
    readTime: '9 min read',
    href: '/knowledge-base/managing-levels-and-gain'
  },
  {
    title: 'Reducing Background Noise',
    description: 'Practical tips for quieter recordings and cleaner takes.',
    readTime: '9 min read',
    href: '/knowledge-base/reducing-background-noise'
  },
  {
    title: 'Recording Multi-Track Interviews',
    description:
    'Capture each speaker on a separate track for cleaner edits.',
    readTime: '10 min read',
    href: '/knowledge-base/recording-multi-track-interviews'
  },
  {
    title: 'Using the AI Producer During Recording',
    description:
    'Get live guidance, suggestions, and reminders while you record.',
    readTime: '10 min read',
    href: '/knowledge-base/using-the-ai-producer-during-recording'
  },
  {
    title: 'Using the Script Panel While Recording',
    description:
    'Read along, mark cues, and stay on script without leaving Studio.',
    readTime: '8 min read',
    href: '/knowledge-base/using-the-script-panel-while-recording'
  }]

},
{
  id: 'editing-and-mastering',
  title: 'Editing & Mastering',
  description:
  'Polish your podcast with our AI Producer and mastering tools.',
  icon: FileTextIcon,
  articles: [
  {
    title: 'Introduction to Editing & Mastering',
    description:
    'Learn the difference between editing and mastering, when each stage occurs, and how they fit into the production workflow.',
    readTime: '8 min read',
    href: '/knowledge-base/introduction-to-editing-and-mastering'
  },
  {
    title: 'Reviewing Your Recording',
    description:
    'Evaluate a recording before editing begins, identify problems, and decide if re-recording is needed.',
    readTime: '8 min read',
    href: '/knowledge-base/reviewing-your-recording'
  },
  {
    title: 'Working with Multi-Track Recordings',
    description:
    'Manage separate tracks for hosts, guests, and co-hosts for greater editing flexibility.',
    readTime: '9 min read',
    href: '/knowledge-base/working-with-multi-track-recordings'
  },
  {
    title: 'Editing Audio',
    description:
    'Remove mistakes, tighten conversations, and prepare episodes for mastering.',
    readTime: '9 min read',
    href: '/knowledge-base/editing-audio'
  },
  {
    title: 'Trimming and Cutting Audio',
    description:
    'Remove unwanted sections, dead air, false starts, and recording mistakes.',
    readTime: '8 min read',
    href: '/knowledge-base/trimming-and-cutting-audio'
  },
  {
    title: 'Arranging Episode Segments',
    description:
    'Organize introductions, interviews, discussions, ads, transitions, and closing segments.',
    readTime: '9 min read',
    href: '/knowledge-base/arranging-episode-segments'
  },
  {
    title: 'Working with Music',
    description:
    'Add intro music, outro music, background music, transitions, and music beds.',
    readTime: '9 min read',
    href: '/knowledge-base/working-with-music'
  },
  {
    title: 'Working with Sound Effects',
    description:
    'Use sound effects effectively, organize SFX assets, and place effects throughout an episode.',
    readTime: '8 min read',
    href: '/knowledge-base/working-with-sound-effects'
  },
  {
    title: 'Volume Balancing',
    description:
    'Balance multiple speakers and maintain consistent levels across an episode.',
    readTime: '8 min read',
    href: '/knowledge-base/volume-balancing'
  },
  {
    title: 'Noise Reduction',
    description:
    'Remove unwanted background noise, hums, buzzes, room noise, and other distractions.',
    readTime: '8 min read',
    href: '/knowledge-base/noise-reduction'
  },
  {
    title: 'Using EQ (Equalization)',
    description:
    'Learn how EQ improves speech clarity and overall listening quality.',
    readTime: '9 min read',
    href: '/knowledge-base/using-eq-equalization'
  },
  {
    title: 'Using Compression',
    description:
    'Control dynamic range for a more consistent listening experience.',
    readTime: '9 min read',
    href: '/knowledge-base/using-compression'
  },
  {
    title: 'Using De-Essers',
    description: 'Reduce excessive "S" sounds and improve vocal quality.',
    readTime: '7 min read',
    href: '/knowledge-base/using-de-essers'
  },
  {
    title: 'Using Limiters',
    description:
    'Prevent clipping and protect the final master from distortion.',
    readTime: '8 min read',
    href: '/knowledge-base/using-limiters'
  },
  {
    title: 'Using Reverb and Effects',
    description:
    'Know when effects help, when to avoid them, and their impact on spoken-word content.',
    readTime: '8 min read',
    href: '/knowledge-base/using-reverb-and-effects'
  },
  {
    title: 'Introduction to Mastering',
    description:
    'Learn what mastering is, why it matters, and how it differs from editing.',
    readTime: '8 min read',
    href: '/knowledge-base/introduction-to-mastering'
  },
  {
    title: 'AI-Assisted Mastering',
    description:
    'How the AI Producer assists during mastering and how automated workflows operate.',
    readTime: '8 min read',
    href: '/knowledge-base/ai-assisted-mastering'
  },
  {
    title: 'Choosing a Mastering Style',
    description:
    'Differences between available mastering styles and when to use each one.',
    readTime: '8 min read',
    href: '/knowledge-base/choosing-a-mastering-style'
  },
  {
    title: 'Reviewing the Master',
    description:
    'Evaluate a mastered episode before export and publication.',
    readTime: '7 min read',
    href: '/knowledge-base/reviewing-the-master'
  },
  {
    title: 'Exporting Final Audio',
    description:
    'Create release-ready podcast files and prepare them for publishing.',
    readTime: '8 min read',
    href: '/knowledge-base/exporting-final-audio'
  },
  {
    title: 'Publishing Readiness Checklist',
    description:
    'Verify that an episode is fully ready for distribution and listeners.',
    readTime: '6 min read',
    href: '/knowledge-base/publishing-readiness-checklist'
  },
  {
    title: 'Common Editing Problems',
    description: 'Troubleshooting guide for common editing issues.',
    readTime: '8 min read',
    href: '/knowledge-base/common-editing-problems'
  },
  {
    title: 'Common Mastering Problems',
    description: 'Troubleshooting guide for common mastering issues.',
    readTime: '8 min read',
    href: '/knowledge-base/common-mastering-problems'
  },
  {
    title: 'Editing & Mastering Best Practices',
    description:
    'Professional workflow recommendations for consistent, high-quality episodes.',
    readTime: '8 min read',
    href: '/knowledge-base/editing-and-mastering-best-practices'
  }]

},
{
  id: 'collaboration',
  title: 'Collaboration',
  description: 'Invite team members, assign tasks, and manage permissions.',
  icon: UsersIcon,
  articles: [
  {
    title: 'Introduction to Collaboration',
    description:
    'How Podify supports team-based podcast production and where collaboration fits.',
    readTime: '7 min read',
    href: '/knowledge-base/introduction-to-collaboration'
  },
  {
    title: 'Inviting Team Members',
    description: 'Invite new members to Projects and production teams.',
    readTime: '6 min read',
    href: '/knowledge-base/inviting-team-members'
  },
  {
    title: 'Understanding Roles and Permissions',
    description:
    'How permissions work and how roles affect access across Podify.',
    readTime: '9 min read',
    href: '/knowledge-base/understanding-roles-and-permissions'
  },
  {
    title: 'Team Owner Responsibilities',
    description:
    'What Team Owners can do and how they manage projects, members, and permissions.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Administrator Responsibilities',
    description:
    'How Administrators help manage production teams and maintain workflow.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Producer Responsibilities',
    description:
    'How Producers coordinate projects, episodes, tasks, and schedules.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Editor Responsibilities',
    description:
    'How Editors work with recordings, masters, and episode production.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Contributor Responsibilities',
    description:
    'How Contributors participate in projects with controlled access.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Viewer Responsibilities',
    description:
    'How Viewers review project information without making changes.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Creating and Managing Teams',
    description:
    'Create teams, organize members, and maintain production groups.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Assigning Tasks and Tracking Progress',
    description:
    'Assign tasks to team members and track production progress.',
    readTime: '7 min read',
    href: '/knowledge-base/assigning-tasks-and-tracking-progress'
  },
  {
    title: 'Managing Episode Workflows',
    description:
    'How teams collaborate on episode production from planning through publishing.',
    readTime: '7 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Collaborating on Scripts',
    description:
    'How multiple team members participate in script development and review.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Managing Shared Media Assets',
    description:
    'How teams work with audio, music, images, videos, and documents.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Reviewing and Approving Content',
    description:
    'How approval workflows operate before content moves to mastering or publishing.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Notifications and Team Activity',
    description:
    'How team activity, assignments, and project updates are communicated.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Team Communication Best Practices',
    description: 'Keep production teams organized and efficient.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Managing External Contributors',
    description:
    'Work with guests, freelancers, contractors, and temporary collaborators.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Resolving Permission Issues',
    description:
    'Troubleshooting guide for access problems and permission conflicts.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Collaboration Best Practices',
    description:
    'Professional recommendations for maintaining productive podcast teams.',
    readTime: '7 min read',
    href: '#',
    comingSoon: true
  }]

},
{
  id: 'account-and-billing',
  title: 'Account & Billing',
  description: 'Manage your subscription, plans, and account preferences.',
  icon: SettingsIcon,
  articles: [
  {
    title: 'Introduction to Account & Billing',
    description:
    'How accounts, subscriptions, billing, and licensing work in Podify.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Creating Your Account',
    description:
    'Create a Podify account and complete initial account setup.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Managing Your Profile',
    description:
    'Update profile info, avatar, display name, and account details.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Managing Account Settings',
    description:
    'Configure account-level preferences and personal settings.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Managing Login & Security',
    description:
    'Maintain account security and manage authentication settings.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Password Management',
    description: 'Change, reset, and recover your account password.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Two-Factor Authentication',
    description: 'Enable and manage additional account security options.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Managing Email Preferences',
    description:
    'Control notifications, communication preferences, and email settings.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Understanding Subscription Plans',
    description:
    'Available subscription plans and the features included with each.',
    readTime: '7 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Upgrading Your Subscription',
    description:
    'Move between subscription tiers and access additional features.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Downgrading Your Subscription',
    description:
    'How downgrades work and how feature access may be affected.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Canceling a Subscription',
    description:
    'Cancel an active subscription and learn what happens after cancellation.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Managing Payment Methods',
    description: 'Add, update, remove, and verify payment methods.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Billing Information & Invoices',
    description:
    'How billing information, invoices, receipts, and records are managed.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Understanding Charges and Renewals',
    description:
    'How recurring billing cycles, renewals, and payment processing work.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Failed Payments and Billing Issues',
    description:
    'Troubleshooting payment failures, declined transactions, and billing problems.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Billing History',
    description:
    'Review previous payments, invoices, and account transactions.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Refunds and Billing Adjustments',
    description:
    'How refund requests, billing corrections, and adjustments are handled.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Managing Storage and Usage Limits',
    description:
    'How storage, media usage, and subscription limits affect your account.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Team Billing and Shared Subscriptions',
    description:
    'How billing works for organizations, teams, and collaborative productions.',
    readTime: '7 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Transferring Account Ownership',
    description:
    'How ownership transfers work for projects, teams, and organizations.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Account Deactivation',
    description:
    'Temporarily disable account access while preserving data.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Permanently Deleting Your Account',
    description:
    'Permanently remove an account and understand the consequences.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Privacy and Account Data',
    description:
    'How personal information, account data, and production assets are handled.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Account & Billing Best Practices',
    description:
    'Recommendations for secure accounts, managing subscriptions, and avoiding billing issues.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  }]

},
{
  id: 'publishing-and-distribution',
  title: 'Publishing & Distribution',
  description: 'Distribute your show to Spotify, Apple Podcasts, and more.',
  icon: PlayCircleIcon,
  articles: [
  {
    title: 'Introduction to Publishing & Distribution',
    description:
    'How completed episodes move from production to public distribution.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Understanding the Publishing Workflow',
    description:
    'The complete process from finished master to published episode.',
    readTime: '7 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Preparing an Episode for Release',
    description: 'Verify that an episode is ready for publication.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Creating Episode Metadata',
    description:
    'How titles, descriptions, categories, and info are used during distribution.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Writing Effective Episode Titles',
    description:
    'Best practices for clear, searchable, and engaging episode titles.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Writing Episode Descriptions',
    description:
    'Create episode summaries that help listeners understand and discover your content.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Managing Episode Artwork',
    description:
    'How artwork is associated with episodes and podcast branding.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Publishing an Episode',
    description: 'Publish an episode from within Podify.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Scheduling Episode Releases',
    description:
    'Schedule episodes for future publication dates and times.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Publishing Drafts vs Published Episodes',
    description:
    'Differences between unpublished, scheduled, and publicly available content.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Managing Podcast Series Information',
    description:
    'How show-level information affects every published episode.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Understanding RSS Feeds',
    description:
    'How podcast feeds work and why they are important for distribution.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Managing Your Podcast Feed',
    description: 'Configure and maintain podcast feed settings.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Distribution Overview',
    description:
    'How podcast directories and listening platforms receive and display your content.',
    readTime: '7 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Submitting Your Podcast to Directories',
    description:
    'How podcasts are submitted to listening platforms and directories.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Managing Distribution Platforms',
    description:
    'Connect, monitor, and manage podcast distribution destinations.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Updating Published Episodes',
    description:
    'How updates, corrections, and revisions are handled after publication.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Republishing Episodes',
    description: 'Re-release older episodes and manage updated content.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Managing Trailers and Bonus Content',
    description: 'How special content is published and distributed.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Publishing Private Episodes',
    description:
    'How restricted-access and private podcast content is managed.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Publishing Team Workflows',
    description:
    'How approvals and publishing responsibilities operate in collaborative environments.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Reviewing Published Content',
    description: 'Verify successful publication and distribution.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Monitoring Distribution Status',
    description: 'Identify and resolve distribution issues.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Common Publishing Problems',
    description: 'Troubleshooting publication errors and failed releases.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Common Distribution Problems',
    description:
    'Troubleshooting feed issues, platform issues, and synchronization delays.',
    readTime: '7 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Migrating a Podcast Feed',
    description:
    'Move a podcast between hosting providers while maintaining subscribers.',
    readTime: '7 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Archiving Episodes',
    description: 'Archive older content without disrupting distribution.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Unpublishing Episodes',
    description:
    'Remove published content and understand the impact on listeners.',
    readTime: '5 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Analytics After Publishing',
    description: 'How episode performance data is collected after release.',
    readTime: '6 min read',
    href: '#',
    comingSoon: true
  },
  {
    title: 'Publishing & Distribution Best Practices',
    description:
    'Recommendations for reliable publishing, audience growth, and distribution management.',
    readTime: '8 min read',
    href: '#',
    comingSoon: true
  }]

}];

export function getCategoryById(id: string): KnowledgeBaseCategory | undefined {
  return knowledgeBaseCategories.find((c) => c.id === id);
}