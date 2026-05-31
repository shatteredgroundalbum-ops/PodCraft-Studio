import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Splash } from './pages/Splash';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Studio } from './pages/Studio';
import { Calendar } from './pages/Calendar';
import { Tasks } from './pages/Tasks';
import { Templates } from './pages/Templates';
import { MediaLibrary } from './pages/MediaLibrary';
import { Analytics } from './pages/Analytics';
import { Team } from './pages/Team';
import { Settings } from './pages/Settings';
import { SettingsProfile } from './pages/SettingsProfile';
import { SettingsAccount } from './pages/SettingsAccount';
import { SettingsSecurity } from './pages/SettingsSecurity';
import { SettingsNotifications } from './pages/SettingsNotifications';
import { SettingsAppearance } from './pages/SettingsAppearance';
import { SettingsAudio } from './pages/SettingsAudio';
import { SettingsRecording } from './pages/SettingsRecording';
import { SettingsStorage } from './pages/SettingsStorage';
import { SettingsIntegrations } from './pages/SettingsIntegrations';
import { SettingsApiKeys } from './pages/SettingsApiKeys';
import { SettingsTeamPermissions } from './pages/SettingsTeamPermissions';
import { SettingsImportExport } from './pages/SettingsImportExport';
import { SettingsAdvanced } from './pages/SettingsAdvanced';
import { SettingsDangerZone } from './pages/SettingsDangerZone';
import { SettingsBilling } from './pages/SettingsBilling';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { KnowledgeBaseCategory } from './pages/KnowledgeBaseCategory';
import { KnowledgeBaseArticle } from './pages/KnowledgeBaseArticle';
import { Legal } from './pages/Legal';
import { LegalTerms } from './pages/LegalTerms';
import { LegalPrivacy } from './pages/LegalPrivacy';
import { LegalCookies } from './pages/LegalCookies';
import { LegalAcceptableUse } from './pages/LegalAcceptableUse';
import { LegalCopyright } from './pages/LegalCopyright';
import { LegalAi } from './pages/LegalAi';
import { Help } from './pages/Help';
import { About } from './pages/About';
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/media-library" element={<MediaLibrary />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/team" element={<Team />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/profile" element={<SettingsProfile />} />
        <Route path="/settings/account" element={<SettingsAccount />} />
        <Route path="/settings/security" element={<SettingsSecurity />} />
        <Route
          path="/settings/notifications"
          element={<SettingsNotifications />} />
        
        <Route path="/settings/appearance" element={<SettingsAppearance />} />
        <Route path="/settings/audio" element={<SettingsAudio />} />
        <Route path="/settings/recording" element={<SettingsRecording />} />
        <Route path="/settings/storage" element={<SettingsStorage />} />
        <Route
          path="/settings/integrations"
          element={<SettingsIntegrations />} />
        
        <Route path="/settings/api-keys" element={<SettingsApiKeys />} />
        <Route
          path="/settings/team-permissions"
          element={<SettingsTeamPermissions />} />
        
        <Route
          path="/settings/import-export"
          element={<SettingsImportExport />} />
        
        <Route path="/settings/billing" element={<SettingsBilling />} />
        <Route path="/settings/advanced" element={<SettingsAdvanced />} />
        <Route path="/settings/danger-zone" element={<SettingsDangerZone />} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />
        <Route
          path="/knowledge-base/category/:categoryId"
          element={<KnowledgeBaseCategory />} />
        
        <Route
          path="/knowledge-base/:slug"
          element={<KnowledgeBaseArticle />} />
        
        <Route path="/legal" element={<Legal />} />
        <Route path="/legal/terms" element={<LegalTerms />} />
        <Route path="/legal/privacy" element={<LegalPrivacy />} />
        <Route path="/legal/cookies" element={<LegalCookies />} />
        <Route path="/legal/acceptable-use" element={<LegalAcceptableUse />} />
        <Route path="/legal/copyright" element={<LegalCopyright />} />
        <Route path="/legal/ai-content" element={<LegalAi />} />
        <Route path="/help" element={<Help />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>);

}