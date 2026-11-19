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
  Check,
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
    <div className="px-6 py-6 flex flex-col gap-6 bg-[#09090B] min-h-screen">
      {/* Sub-navigation & Header Controls */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="inline-flex p-1 bg-[#111114] rounded-xl border border-[#222228]">
          <button
            type="button"
            onClick={() => setActiveSection('assessments')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSection === 'assessments'
                ? 'bg-[#18181D] text-[#00FF66] border border-[#00FF66]/30 shadow-[0_0_10px_rgba(0,255,102,0.15)]'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 inline mr-1.5" />
            <span>Academic Scores ({assessments.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('projects')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSection === 'projects'
                ? 'bg-[#18181D] text-[#00FF66] border border-[#00FF66]/30 shadow-[0_0_10px_rgba(0,255,102,0.15)]'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5 inline mr-1.5" />
            <span>Project Repositories ({projects.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('certifications')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSection === 'certifications'
                ? 'bg-[#18181D] text-[#00FF66] border border-[#00FF66]/30 shadow-[0_0_10px_rgba(0,255,102,0.15)]'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 inline mr-1.5" />
            <span>Certifications ({certifications.length})</span>
          </button>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => openModal(activeSection === 'assessments' ? 'assessment' : activeSection === 'projects' ? 'project' : 'certification')}
        >
          <Plus className="w-4 h-4" />
          <span>
            {activeSection === 'assessments' && 'Add Academic Assessment'}
            {activeSection === 'projects' && 'Add Project Repository'}
            {activeSection === 'certifications' && 'Add Certification'}
          </span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-[#18181D] border border-red-500/30 rounded-xl text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Section 1: Academic Assessments */}
      {activeSection === 'assessments' && (
        <div className="panel overflow-hidden rounded-2xl">
          <div className="p-5 border-b border-[#222228] flex justify-between items-center bg-[#0C0C0F]">
            <div>
              <h3 className="text-sm font-bold text-white m-0">Academic Assessments</h3>
              <p className="text-xs text-[#9CA3AF] m-0 mt-0.5">
                Coursework and examination performance factored into the 35% Academic Index
              </p>
            </div>
          </div>

          {assessments.length === 0 ? (
            <div className="p-12 text-center text-[#6B7280]">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#00FF66]" />
              <div className="text-xs font-semibold text-white">No academic assessments logged yet</div>
              <p className="text-xs mt-1 text-[#6B7280]">Add scores for Data Structures, Python, DBMS, or OS to establish your academic index.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Semester</th>
                    <th>Score / Max</th>
                    <th>Percentage</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a) => {
                    const pct = Math.round((a.score / (a.max_score || 100)) * 100);
                    const isPassing = pct >= 60;
                    return (
                      <tr key={a.id}>
                        <td className="font-semibold text-white">{a.subject}</td>
                        <td className="capitalize text-[#9CA3AF]">{a.type || 'Exam'}</td>
                        <td className="font-mono tabular-nums text-white">Sem {a.semester || 1}</td>
                        <td className="font-mono tabular-nums text-white">
                          {a.score} / {a.max_score}
                        </td>
                        <td className="font-mono tabular-nums font-bold text-[#00FF66]">
                          {pct}%
                        </td>
                        <td>
                          <span className={`pill ${isPassing ? 'pill-ready' : 'pill-gap'}`}>
                            {isPassing ? 'Verified' : 'Needs Review'}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteAssessment(a.id)}
                            className="p-1.5 text-[#6B7280] hover:text-[#EF4444] hover:bg-[#18181D] rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
        <div className="panel overflow-hidden rounded-2xl">
          <div className="p-5 border-b border-[#222228] flex justify-between items-center bg-[#0C0C0F]">
            <div>
              <h3 className="text-sm font-bold text-white m-0">Project Repositories & Evidence</h3>
              <p className="text-xs text-[#9CA3AF] m-0 mt-0.5">
                Practical code evidence matched against benchmark target role skill matrices
              </p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="p-12 text-center text-[#6B7280]">
              <FolderGit2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#00FF66]" />
              <div className="text-xs font-semibold text-white">No projects logged yet</div>
              <p className="text-xs mt-1 text-[#6B7280]">Add full-stack, AI, or backend projects to provide skill verification evidence.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project Title & Description</th>
                    <th>Complexity</th>
                    <th>Tech Stack Evidence</th>
                    <th>Links</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => {
                    const techList = (p.tech_stack || '').split(',').map((t) => t.trim()).filter(Boolean);
                    const compClass =
                      p.complexity === 'Advanced' ? 'pill-ready' : p.complexity === 'Intermediate' ? 'pill-developing' : 'pill-neutral';
                    return (
                      <tr key={p.id}>
                        <td className="max-w-[320px]">
                          <div className="font-semibold text-white">{p.title}</div>
                          {p.description && (
                            <div className="text-xs text-[#9CA3AF] mt-1 line-clamp-2">
                              {p.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`pill ${compClass}`}>{p.complexity || 'Intermediate'}</span>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1.5">
                            {techList.map((tech, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-md bg-[#18181D] text-[#00FF66] border border-[#222228] text-[11px] font-mono">
                                {tech}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            {p.repo_url && (
                              <a
                                href={p.repo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-[#00FF66] hover:underline inline-flex items-center gap-1 font-mono"
                              >
                                Repo <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {p.live_url && (
                              <a
                                href={p.live_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-[#60A5FA] hover:underline inline-flex items-center gap-1 font-mono"
                              >
                                Live <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(p.id)}
                            className="p-1.5 text-[#6B7280] hover:text-[#EF4444] hover:bg-[#18181D] rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
        <div className="panel overflow-hidden rounded-2xl">
          <div className="p-5 border-b border-[#222228] flex justify-between items-center bg-[#0C0C0F]">
            <div>
              <h3 className="text-sm font-bold text-white m-0">Certifications & Badges</h3>
              <p className="text-xs text-[#9CA3AF] m-0 mt-0.5">
                Industry-recognized credentials boosting your consistency and skill indices
              </p>
            </div>
          </div>

          {certifications.length === 0 ? (
            <div className="p-12 text-center text-[#6B7280]">
              <Award className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#00FF66]" />
              <div className="text-xs font-semibold text-white">No certifications logged yet</div>
              <p className="text-xs mt-1 text-[#6B7280]">Add AWS, Python, HackerRank, or Coursera credentials.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Issuer</th>
                    <th>Type</th>
                    <th>Issued Date</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {certifications.map((c) => (
                    <tr key={c.id}>
                      <td className="font-semibold text-white">{c.title}</td>
                      <td className="text-[#9CA3AF]">{c.issuer || 'Online'}</td>
                      <td>
                        <span className="pill pill-neutral font-mono">{c.type || 'Certification'}</span>
                      </td>
                      <td className="font-mono tabular-nums text-[#9CA3AF]">{c.issued_date || 'N/A'}</td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteCertification(c.id)}
                          className="p-1.5 text-[#6B7280] hover:text-[#EF4444] hover:bg-[#18181D] rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
            className="panel p-6 w-full max-w-md bg-[#111114] border border-[#222228] shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-white m-0">
                {modalType === 'assessment' && 'Add Academic Assessment'}
                {modalType === 'project' && 'Add Project Repository'}
                {modalType === 'certification' && 'Add Certification'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 text-[#9CA3AF] hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs mb-4">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {modalType === 'assessment' && (
                <>
                  <div className="mb-3.5">
                    <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
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

                  <div className="grid grid-cols-2 gap-3 mb-3.5">
                    <div>
                      <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
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
                      <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
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

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div>
                      <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
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
                      <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
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
                  <div className="mb-3.5">
                    <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
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

                  <div className="mb-3.5">
                    <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Brief architecture, models, or algorithms summary"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="mb-3.5">
                    <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
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

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div>
                      <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
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
                      <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
                        Repository URL
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
                  <div className="mb-3.5">
                    <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
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

                  <div className="mb-3.5">
                    <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
                      Issuer / Organization
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Amazon Web Services, Coursera, HackerRank"
                      value={formData.issuer || ''}
                      onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div>
                      <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
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
                      <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
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

              <div className="flex justify-end gap-3 mt-5">
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
