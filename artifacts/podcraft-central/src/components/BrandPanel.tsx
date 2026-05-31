import React from 'react';
import { PodCraftLogo } from './PodCraftLogo';
import { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatar: string;
}

interface BrandPanelProps {
  tagline: React.ReactNode;
  description: string;
  features: Feature[];
  testimonial?: Testimonial;
  backgroundImage?: string;
}

export function BrandPanel({ tagline, description, features, testimonial, backgroundImage }: BrandPanelProps) {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden rounded-l-2xl">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1600'})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-violet-900/80" />
      <div className="relative z-10 flex flex-col p-12 text-white w-full">
        <div className="mb-12">
          <PodCraftLogo variant="light" size="sm" />
        </div>
        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <div className="text-5xl font-bold leading-tight">{tagline}</div>
            <p className="text-gray-300 text-lg max-w-md">{description}</p>
          </div>
          <div className="space-y-6 pt-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          {testimonial && (
            <div className="mt-8 p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start gap-1 mb-3">
                <span className="text-violet-400 text-3xl leading-none">"</span>
              </div>
              <p className="text-gray-200 italic mb-4">{testimonial.quote}</p>
              <div className="flex items-center gap-3">
                <img src={testimonial.avatar} alt={testimonial.author} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-semibold text-white text-sm">{testimonial.author}</p>
                  <p className="text-gray-400 text-xs">{testimonial.role}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
