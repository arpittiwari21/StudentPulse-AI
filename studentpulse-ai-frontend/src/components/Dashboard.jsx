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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      title: 'Cohort Analytics',
      subtitle: 'Candidate readiness tracking, tier filtering, and CSV export',
    },
  };

  const currentTabInfo = tabTitles[activeTab] || tabTitles.overview;

  const handleContextUpdated = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="flex min-h-screen bg-[#09090B]">
      {/* Fixed Left Sidebar with Responsive Mobile Drawer */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setMobileMenuOpen(false);
        }}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Workspace Area: Properly Offset for Sidebar on Desktop (md:ml-64, ml-0 on mobile) */}
      <div className="flex-1 min-w-0 flex flex-col md:ml-64 bg-[#09090B]">
        <Header
          title={currentTabInfo.title}
          subtitle={currentTabInfo.subtitle}
          onOpenContextModal={() => setShowContextModal(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        <main className="flex-1 min-w-0 overflow-x-hidden bg-[#09090B]">
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
