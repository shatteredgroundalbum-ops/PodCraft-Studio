import React from 'react';
import { HelpCircle, Bell, ChevronDown } from 'lucide-react';

export function StudioTopBar() {
  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-end px-5 flex-shrink-0 gap-3">
      <button className="text-gray-400 hover:text-gray-600 transition-colors" title="Help">
        <HelpCircle className="w-5 h-5" />
      </button>
      <button className="text-gray-400 hover:text-gray-600 transition-colors relative" title="Notifications">
        <Bell className="w-5 h-5" />
        <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
      </button>
      <button className="flex items-center gap-1.5 bg-violet-100 text-violet-700 pl-3 pr-2 py-1.5 rounded-full hover:bg-violet-200 transition-colors" title="Account">
        <span className="text-sm font-bold">PC</span>
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
}
