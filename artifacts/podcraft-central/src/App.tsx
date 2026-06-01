import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthStore';
import { MediaStoreProvider } from './store/MediaStore';
import { AIConfigProvider, useAIConfig } from './store/AIConfigStore';
import { MediaProviderProvider } from './store/MediaProviderStore';
import { AISetupWizard } from './components/AISetupWizard';

import { Splash } from './pages/Splash';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Studio } from './pages/Studio';
import { Tasks } from './pages/Tasks';
import { Analytics } from './pages/Analytics';
import { Templates } from './pages/Templates';
import { MediaLibrary } from './pages/MediaLibrary';
import { Calendar } from './pages/Calendar';
import { Team } from './pages/Team';
import { Settings } from './pages/Settings';
import { Help } from './pages/Help';
import { About } from './pages/About';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Legal } from './pages/Legal';
import { AIProducer } from './pages/AIProducer';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
      <Route path="/media-library" element={<ProtectedRoute><MediaLibrary /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
      <Route path="/settings/*" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
      <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
      <Route path="/knowledge-base/*" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
      <Route path="/legal/*" element={<ProtectedRoute><Legal /></ProtectedRoute>} />
      <Route path="/ai-producer" element={<ProtectedRoute><AIProducer /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AIWizardController() {
  const { user } = useAuth();
  const { config, showWizard, openWizard } = useAIConfig();

  useEffect(() => {
    if (user && !config.setupComplete && !showWizard) {
      openWizard();
    }
  }, [user, config.setupComplete]);

  if (!showWizard || !user) return null;
  return <AISetupWizard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MediaStoreProvider>
          <AIConfigProvider>
            <MediaProviderProvider>
              <AppRoutes />
              <AIWizardController />
            </MediaProviderProvider>
          </AIConfigProvider>
        </MediaStoreProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
