import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import ContextModal from './ContextModal';
import OverviewView from './views/OverviewView';
import EvidenceView from './views/EvidenceView';
import ActionPlanView from './views/ActionPlanView';
import CohortView from './views/CohortView';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showContextModal, setShowContextModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const tabTitles = {
    overview: {
      title: 'Readiness & Skill Intelligence Overview',
      subtitle: 'Real-time student success analytics and evaluation indicators',
    },
    evidence: {
      title: 'Academic & Practical Evidence Locker',
      subtitle: 'Log and manage assessment scores, repositories, and certifications',
    },
    'action-plan': {
      title: 'AI Action Roadmap & Mock Interview Prep',
      subtitle: 'Adaptive milestone sprints and project-specific mock questions',
    },
    cohort: {
      title: 'Faculty & Coordinator Cohort Analytics',
      subtitle: 'Candidate readiness tracking, tier filtering, and CSV export',
    },
  };

  const currentTabInfo = tabTitles[activeTab] || tabTitles.overview;

  const handleContextUpdated = () => {
    // Triggers re-render and re-fetch in views
    setRefreshKey((k) => k + 1);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-canvas)' }}>
      {/* Fixed Left Sidebar */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Workspace Area */}
      <div style={{ marginLeft: '240px', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Header
          title={currentTabInfo.title}
          subtitle={currentTabInfo.subtitle}
          onOpenContextModal={() => setShowContextModal(true)}
        />

        <main style={{ flex: 1 }}>
          {activeTab === 'overview' && (
            <OverviewView key={refreshKey} onNavigateTab={setActiveTab} />
          )}
          {activeTab === 'evidence' && <EvidenceView key={refreshKey} />}
          {activeTab === 'action-plan' && <ActionPlanView key={refreshKey} />}
          {activeTab === 'cohort' && <CohortView key={refreshKey} />}
        </main>
      </div>

      {/* Context Modal */}
      <ContextModal
        isOpen={showContextModal}
        onClose={() => setShowContextModal(false)}
        onContextUpdated={handleContextUpdated}
      />
    </div>
  );
}
