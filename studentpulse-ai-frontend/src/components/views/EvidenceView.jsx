import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAssessments,
  addAssessment,
  deleteAssessment,
  getProjects,
  addProject,
  deleteProject,
  getCertifications,
  addCertification,
  deleteCertification,
} from '../../api/student';
import {
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  FolderGit2,
  Award,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function EvidenceView() {
  const { token } = useAuth();
  const [activeSection, setActiveSection] = useState('assessments'); // 'assessments' | 'projects' | 'certifications'

  const [assessments, setAssessments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('assessment'); // 'assessment' | 'project' | 'certification'

  // Form states
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadAllEvidence = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assRes, projRes, certRes] = await Promise.all([
        getAssessments(token),
        getProjects(token),
        getCertifications(token),
      ]);
      setAssessments(assRes);
      setProjects(projRes);
      setCertifications(certRes);
    } catch (err) {
      setError(err.message || 'Failed to load evidence records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllEvidence();
  }, [token]);

  const openModal = (type) => {
    setModalType(type);
    setFormData({});
    setModalError('');
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setFormData({});
    setModalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');

    try {
      if (modalType === 'assessment') {
        if (!formData.subject || !formData.score || !formData.max_score) {
          throw new Error('Subject name, score, and max score are required.');
        }
        await addAssessment(token, {
          subject: formData.subject.trim(),
          score: parseFloat(formData.score),
          max_score: parseFloat(formData.max_score),
          semester: formData.semester ? parseInt(formData.semester) : 1,
          type: formData.type || 'exam',
        });
        const updated = await getAssessments(token);
        setAssessments(updated);
      } else if (modalType === 'project') {
        if (!formData.title || !formData.tech_stack) {
          throw new Error('Project title and tech stack are required.');
        }
        await addProject(token, {
          title: formData.title.trim(),
          description: formData.description || '',
          tech_stack: formData.tech_stack.trim(),
          complexity: formData.complexity || 'Intermediate',
          repo_url: formData.repo_url || '',
          live_url: formData.live_url || '',
        });
        const updated = await getProjects(token);
        setProjects(updated);
      } else if (modalType === 'certification') {
        if (!formData.title) {
          throw new Error('Certification title is required.');
        }
        await addCertification(token, {
          title: formData.title.trim(),
          issuer: formData.issuer || '',
          type: formData.type || 'certification',
          issued_date: formData.issued_date || '',
        });
        const updated = await getCertifications(token);
        setCertifications(updated);
      }
      closeModal();
    } catch (err) {
      setModalError(err.message || 'Failed to add entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssessment = async (id) => {
    if (!window.confirm('Delete this assessment record?')) return;
    try {
      await deleteAssessment(token, id);
      setAssessments(assessments.filter((a) => a.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete assessment.');
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Delete this project entry?')) return;
    try {
      await deleteProject(token, id);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete project.');
    }
  };

  const handleDeleteCertification = async (id) => {
    if (!window.confirm('Delete this certification record?')) return;
    try {
      await deleteCertification(token, id);
      setCertifications(certifications.filter((c) => c.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete certification.');
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sub-navigation & Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'inline-flex', padding: '3px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
          <button
            type="button"
            onClick={() => setActiveSection('assessments')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: activeSection === 'assessments' ? 600 : 500,
              color: activeSection === 'assessments' ? 'var(--text-primary)' : 'var(--text-secondary)',
              backgroundColor: activeSection === 'assessments' ? '#ffffff' : 'transparent',
              borderRadius: '6px',
              border: activeSection === 'assessments' ? '1px solid var(--border-default)' : '1px solid transparent',
            }}
          >
            <BookOpen size={13} />
            <span>Academic Scores ({assessments.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('projects')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: activeSection === 'projects' ? 600 : 500,
              color: activeSection === 'projects' ? 'var(--text-primary)' : 'var(--text-secondary)',
              backgroundColor: activeSection === 'projects' ? '#ffffff' : 'transparent',
              borderRadius: '6px',
              border: activeSection === 'projects' ? '1px solid var(--border-default)' : '1px solid transparent',
            }}
          >
            <FolderGit2 size={13} />
            <span>Project Repositories ({projects.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('certifications')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: activeSection === 'certifications' ? 600 : 500,
              color: activeSection === 'certifications' ? 'var(--text-primary)' : 'var(--text-secondary)',
              backgroundColor: activeSection === 'certifications' ? '#ffffff' : 'transparent',
              borderRadius: '6px',
              border: activeSection === 'certifications' ? '1px solid var(--border-default)' : '1px solid transparent',
            }}
          >
            <Award size={13} />
            <span>Certifications ({certifications.length})</span>
          </button>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => openModal(activeSection === 'assessments' ? 'assessment' : activeSection === 'projects' ? 'project' : 'certification')}
        >
          <Plus size={14} />
          <span>
            {activeSection === 'assessments' && 'Add Assessment'}
            {activeSection === 'projects' && 'Add Project'}
            {activeSection === 'certifications' && 'Add Certification'}
          </span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Section 1: Academic Assessments */}
      {activeSection === 'assessments' && (
        <div className="panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Academic Assessments</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Coursework and examination performance factored into the 35% Academic Index
              </p>
            </div>
          </div>

          {assessments.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BookOpen size={28} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
              <div style={{ fontSize: '13px', fontWeight: 500 }}>No academic assessments logged yet</div>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Add scores for Data Structures, Python, DBMS, or OS to establish your academic index.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Semester</th>
                    <th>Score / Max</th>
                    <th>Percentage</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a) => {
                    const pct = Math.round((a.score / (a.max_score || 100)) * 100);
                    const isPassing = pct >= 60;
                    return (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 600 }}>{a.subject}</td>
                        <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{a.type || 'Exam'}</td>
                        <td className="font-mono tabular-nums">Sem {a.semester || 1}</td>
                        <td className="font-mono tabular-nums">
                          {a.score} / {a.max_score}
                        </td>
                        <td className="font-mono tabular-nums" style={{ fontWeight: 600 }}>
                          {pct}%
                        </td>
                        <td>
                          <span className={`pill ${isPassing ? 'pill-ready' : 'pill-gap'}`}>
                            {isPassing ? 'Cleared' : 'Needs Review'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteAssessment(a.id)}
                            style={{ background: 'none', border: 'none', color: '#a1a1aa', padding: '4px', cursor: 'pointer' }}
                            title="Delete"
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Section 2: Projects */}
      {activeSection === 'projects' && (
        <div className="panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Project Repositories & Evidence</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Practical code evidence matched against benchmark target role skill matrices
              </p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FolderGit2 size={28} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
              <div style={{ fontSize: '13px', fontWeight: 500 }}>No projects logged yet</div>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Add full-stack, AI, or backend projects to provide skill verification evidence.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project Title & Description</th>
                    <th>Complexity</th>
                    <th>Tech Stack Evidence</th>
                    <th>Links</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => {
                    const techList = (p.tech_stack || '').split(',').map((t) => t.trim()).filter(Boolean);
                    const compClass =
                      p.complexity === 'Advanced' ? 'pill-ready' : p.complexity === 'Intermediate' ? 'pill-developing' : 'pill-neutral';
                    return (
                      <tr key={p.id}>
                        <td style={{ maxWidth: '320px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</div>
                          {p.description && (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                              {p.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`pill ${compClass}`}>{p.complexity || 'Intermediate'}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {techList.map((tech, idx) => (
                              <span key={idx} className="pill pill-neutral font-mono">
                                {tech}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {p.repo_url && (
                              <a
                                href={p.repo_url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '12px', color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                              >
                                Repo <ExternalLink size={11} />
                              </a>
                            )}
                            {p.live_url && (
                              <a
                                href={p.live_url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '12px', color: '#047857', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                              >
                                Demo <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(p.id)}
                            style={{ background: 'none', border: 'none', color: '#a1a1aa', padding: '4px', cursor: 'pointer' }}
                            title="Delete"
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Section 3: Certifications */}
      {activeSection === 'certifications' && (
        <div className="panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Certifications & Badges</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Industry-recognized credentials boosting your consistency and skill indices
              </p>
            </div>
          </div>

          {certifications.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Award size={28} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
              <div style={{ fontSize: '13px', fontWeight: 500 }}>No certifications logged yet</div>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Add AWS, Python, HackerRank, or Coursera credentials.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Issuer</th>
                    <th>Type</th>
                    <th>Issued Date</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {certifications.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.title}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{c.issuer || 'Online'}</td>
                      <td>
                        <span className="pill pill-neutral font-mono">{c.type || 'Certification'}</span>
                      </td>
                      <td className="font-mono tabular-nums">{c.issued_date || 'N/A'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteCertification(c.id)}
                          style={{ background: 'none', border: 'none', color: '#a1a1aa', padding: '4px', cursor: 'pointer' }}
                          title="Delete"
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="panel"
            style={{ width: '100%', maxWidth: '460px', padding: '24px', backgroundColor: '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                {modalType === 'assessment' && 'Add Academic Assessment'}
                {modalType === 'project' && 'Add Project Repository'}
                {modalType === 'certification' && 'Add Certification'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            {modalError && (
              <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '12px', marginBottom: '14px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {modalType === 'assessment' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Subject Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Data Structures & Algorithms"
                      value={formData.subject || ''}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        Score Obtained
                      </label>
                      <input
                        type="number"
                        placeholder="85"
                        value={formData.score || ''}
                        onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        Maximum Score
                      </label>
                      <input
                        type="number"
                        placeholder="100"
                        value={formData.max_score || ''}
                        onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        Assessment Type
                      </label>
                      <select
                        value={formData.type || 'exam'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option value="exam">Semester Exam</option>
                        <option value="quiz">Quiz / Sessional</option>
                        <option value="assignment">Assignment / Lab</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        Semester
                      </label>
                      <select
                        value={formData.semester || '1'}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      >
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                        <option value="3">Semester 3</option>
                        <option value="4">Semester 4</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {modalType === 'project' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Project Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. StudentPulse AI Platform"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Brief summary of architecture, APIs, or algorithms"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Tech Stack (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="Python, Flask, React, SQLite, Gemini API"
                      value={formData.tech_stack || ''}
                      onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        Complexity Tier
                      </label>
                      <select
                        value={formData.complexity || 'Intermediate'}
                        onChange={(e) => setFormData({ ...formData, complexity: e.target.value })}
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        GitHub / Repo URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/..."
                        value={formData.repo_url || ''}
                        onChange={(e) => setFormData({ ...formData, repo_url: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              {modalType === 'certification' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Certification Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AWS Certified Cloud Practitioner"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Issuer / Platform
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Amazon Web Services, Coursera, HackerRank"
                      value={formData.issuer || ''}
                      onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        Credential Type
                      </label>
                      <select
                        value={formData.type || 'certification'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option value="certification">Certification</option>
                        <option value="hackathon">Hackathon</option>
                        <option value="course">Course Badge</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        Issued Date
                      </label>
                      <input
                        type="date"
                        value={formData.issued_date || ''}
                        onChange={(e) => setFormData({ ...formData, issued_date: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
