/**
 * GitSwitch Main App Component
 */

import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Profiles from './pages/Profiles/Profiles';
import Repositories from './pages/Repositories/Repositories';
import Settings from './pages/Settings/Settings';
import Onboarding from './pages/Onboarding/Onboarding';
import { useSettings } from './hooks/useSettings';

function App() {
    const { settings, loading } = useSettings();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin" style={{
                    width: 40,
                    height: 40,
                    border: '3px solid var(--border-primary)',
                    borderTopColor: 'var(--accent-blue)',
                    borderRadius: '50%'
                }} />
            </div>
        );
    }

    // Show onboarding if first run not complete
    if (!settings?.firstRunComplete) {
        return <Onboarding />;
    }

    return (
        <HashRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/profiles" element={<Profiles />} />
                    <Route path="/repositories" element={<Repositories />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </HashRouter>
    );
}

export default App;
