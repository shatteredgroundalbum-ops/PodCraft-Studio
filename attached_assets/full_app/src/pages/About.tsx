import React from 'react';
import { AppLayout } from '../components/AppLayout';
import { PodifyLogo } from '../components/PodifyLogo';
import {
  HeartIcon,
  CalendarIcon,
  FileTextIcon,
  MicIcon,
  EditIcon,
  SlidersIcon,
  FolderIcon,
  UsersIcon,
  ListChecksIcon,
  DownloadIcon,
  SendIcon,
  LayoutGridIcon } from
'lucide-react';
const capabilities = [
{
  icon: CalendarIcon,
  label: 'Planning episodes'
},
{
  icon: FolderIcon,
  label: 'Organizing projects'
},
{
  icon: ListChecksIcon,
  label: 'Managing tasks'
},
{
  icon: FileTextIcon,
  label: 'Writing scripts'
},
{
  icon: MicIcon,
  label: 'Recording podcasts'
},
{
  icon: EditIcon,
  label: 'Editing audio'
},
{
  icon: SlidersIcon,
  label: 'Mastering audio'
},
{
  icon: LayoutGridIcon,
  label: 'Managing media assets'
},
{
  icon: UsersIcon,
  label: 'Team collaboration'
},
{
  icon: DownloadIcon,
  label: 'Exporting completed content'
},
{
  icon: SendIcon,
  label: 'Optional distribution assistance'
}];

const commitments = [
'User ownership',
'User privacy',
'Creative freedom',
'Platform security',
'Reliable production workflows',
'Transparent policies'];

export function About() {
  return (
    <AppLayout title="About Podify">
      <div className="mb-8">
        <p className="text-sm text-gray-500">
          Learn more about Podify and how the platform fits into your podcast
          production workflow.
        </p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Hero */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-violet-50 flex items-center justify-center flex-shrink-0">
              <PodifyLogo variant="dark" size="sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                What is Podify?
              </h1>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                Podify is a podcast production platform designed to help
                creators manage the entire podcast production workflow from a
                single environment.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Podify provides tools for
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {capabilities.map((cap) =>
              <div
                key={cap.label}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-700">
                
                  <cap.icon className="w-4 h-4 text-violet-600 flex-shrink-0" />
                  <span>{cap.label}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mt-5">
              Podify is designed to simplify podcast production while allowing
              creators to maintain ownership and control of their content.
            </p>
          </div>
        </div>

        {/* Version */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Version
            </p>
            <p className="text-lg font-bold text-gray-900">2.4.1</p>
            <p className="text-xs text-gray-500 mt-1">Released May 22, 2026</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Build
            </p>
            <p className="text-lg font-bold text-gray-900">26.05.22</p>
            <p className="text-xs text-gray-500 mt-1">Production channel</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              License
            </p>
            <p className="text-lg font-bold text-gray-900">Pro</p>
            <p className="text-xs text-gray-500 mt-1">Studio Creator plan</p>
          </div>
        </div>

        {/* Mission */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">
            Our mission
          </h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              Podify's mission is to provide creators with a streamlined
              production environment that reduces complexity and allows them to
              focus on creating great content.
            </p>
            <p>
              We believe creators should own their work, control their storage,
              and decide how and where their content is distributed.
            </p>
          </div>
        </div>

        {/* Content Ownership */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">
            Content ownership
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Creators retain ownership of their:
          </p>
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1.5 mb-4">
            {[
            'Recordings',
            'Episodes',
            'Scripts',
            'Artwork',
            'Music',
            'Media assets',
            'Production files',
            'Projects'].
            map((item) =>
            <li
              key={item}
              className="text-sm text-gray-700 flex items-center gap-2">
              
                <span className="w-1 h-1 rounded-full bg-violet-500 flex-shrink-0" />
                {item}
              </li>
            )}
          </ul>
          <p className="text-sm text-gray-600 leading-relaxed">
            Podify does not claim ownership of user-created content.
          </p>
        </div>

        {/* Storage Philosophy */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">
            Storage philosophy
          </h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              Podify is designed around user-controlled storage. Users decide
              where their content is stored.
            </p>
            <p className="text-gray-700 font-medium">
              Content may be stored on:
            </p>
            <ul className="space-y-1 pl-1">
              {[
              'Local devices',
              'User-selected cloud providers',
              'User-managed servers',
              'User-managed storage systems'].
              map((item) =>
              <li key={item} className="flex gap-3 text-gray-700">
                  <span className="text-violet-400 mt-1.5 flex-shrink-0">
                    •
                  </span>
                  <span>{item}</span>
                </li>
              )}
            </ul>
            <p>
              Podify does not currently operate as a podcast content hosting
              service.
            </p>
          </div>
        </div>

        {/* Distribution Philosophy */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">
            Distribution philosophy
          </h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              <span className="text-gray-900 font-medium">
                Podify is not a publisher.
              </span>{' '}
              Podify does not publish content on behalf of users.
            </p>
            <p>
              Users remain responsible for their publishing and distribution
              decisions.
            </p>
            <p>
              Where available, Podify may provide tools that assist with
              exporting or distributing content to supported third-party
              platforms. Users may also choose to distribute content
              independently using services of their choice.
            </p>
          </div>
        </div>

        {/* Collaboration */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">
            Collaboration
          </h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              Podify supports both individual creators and production teams.
              Collaboration features allow teams to:
            </p>
            <ul className="space-y-1 pl-1">
              {[
              'Share projects',
              'Assign tasks',
              'Review content',
              'Manage production workflows',
              'Coordinate episode development'].
              map((item) =>
              <li key={item} className="flex gap-3 text-gray-700">
                  <span className="text-violet-400 mt-1.5 flex-shrink-0">
                    •
                  </span>
                  <span>{item}</span>
                </li>
              )}
            </ul>
            <p>
              Team members only have access to resources authorized by workspace
              permissions.
            </p>
          </div>
        </div>

        {/* AI-Assisted Production */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">
            AI-assisted production
          </h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>Podify may include AI-assisted tools that help with:</p>
            <ul className="space-y-1 pl-1">
              {[
              'Planning',
              'Scripting',
              'Production workflows',
              'Editing assistance',
              'Metadata suggestions'].
              map((item) =>
              <li key={item} className="flex gap-3 text-gray-700">
                  <span className="text-violet-400 mt-1.5 flex-shrink-0">
                    •
                  </span>
                  <span>{item}</span>
                </li>
              )}
            </ul>
            <p>
              AI tools are intended to assist creators, not replace creative
              decision-making. Users remain responsible for reviewing and
              approving all generated content.
            </p>
          </div>
        </div>

        {/* Our Commitment */}
        <div className="bg-violet-50/40 border border-violet-100 rounded-xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">
            Our commitment
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Podify is committed to:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {commitments.map((c) =>
            <div
              key={c}
              className="px-3 py-2 rounded-lg bg-white border border-violet-100 text-sm text-gray-700 font-medium">
              
                {c}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mt-5">
            Our goal is to provide creators with powerful production tools while
            maintaining control, flexibility, and transparency.
          </p>
        </div>

        {/* Contact */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-2">Contact</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            For support, documentation, feature requests, or account assistance,
            please use the official Podify support channels available within the
            platform.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 py-4">
          Made with <HeartIcon className="w-3 h-3 text-red-400 fill-current" />{' '}
          by the Podify team. © 2026 Podify, Inc. All rights reserved.
        </div>
      </div>
    </AppLayout>);

}