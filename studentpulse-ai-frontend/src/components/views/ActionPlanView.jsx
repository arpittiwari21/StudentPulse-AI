import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getPlan,
  generateAiPlan,
  addTask,
  updateTask,
  deleteTask,
} from '../../api/student';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Calendar,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  X,
} from 'lucide-react';

export default function ActionPlanView() {
  const { token } = useAuth();
  const [plan, setPlan] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);

  // Add Task Modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(1);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskTargetDays, setTaskTargetDays] = useState(7);
  const [savingTask, setSavingTask] = useState(false);
  const [taskError, setTaskError] = useState('');

  const loadPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPlan(token);
      setPlan(res.plan);
      setTasks(res.tasks || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch action plan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, [token]);

  const handleGeneratePlan = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await generateAiPlan(token);
      // Reload active plan from DB
      await loadPlan();
    } catch (err) {
      setError(err.message || 'Failed to generate AI action plan.');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      await updateTask(token, taskId, { completed: !currentStatus });
      setTasks(
        tasks.map((t) =>
          t.id === taskId ? { ...t, completed: currentStatus ? 0 : 1 } : t
        )
      );
    } catch (err) {
      alert(err.message || 'Failed to update task.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(token, taskId);
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (err) {
      alert(err.message || 'Failed to delete task.');
    }
  };

  const handleOpenAddTask = (milestoneNum) => {
    setSelectedMilestone(milestoneNum);
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('Medium');
    setTaskTargetDays(7);
    setTaskError('');
    setShowTaskModal(true);
  };

  const handleSaveCustomTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setTaskError('Task title is required.');
      return;
    }

    setSavingTask(true);
    setTaskError('');
    try {
      const today = new Date();
      today.setDate(today.getDate() + parseInt(taskTargetDays));
      const targetDateStr = today.toISOString().split('T')[0];

      await addTask(token, {
        milestone: selectedMilestone,
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        priority: taskPriority,
        target_date: targetDateStr,
      });

      await loadPlan();
      setShowTaskModal(false);
    } catch (err) {
      setTaskError(err.message || 'Failed to add custom task.');
    } finally {
      setSavingTask(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <div className="panel skeleton" style={{ height: '140px', marginBottom: '24px' }} />
        <div className="panel skeleton" style={{ height: '380px' }} />
      </div>
    );
  }

  const interviewQuestions = plan?.interview_questions || [];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Action Bar */}
      <div className="panel" style={{ padding: '20px 24px', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>AI-Generated Preparation Roadmap</h3>
              {plan?.readiness_tier && (
                <span className={`pill ${plan.readiness_tier === 'Industry Ready' ? 'pill-ready' : 'pill-developing'}`}>
                  {plan.readiness_tier}
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              {plan
                ? `Plan generated on ${new Date(plan.generated_at).toLocaleDateString()} • Tailored to your target role & daily study hours`
                : 'No active plan found. Click generate to construct a 4-milestone plan.'}
            </p>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleGeneratePlan}
            disabled={generating}
            style={{ padding: '9px 16px' }}
          >
            {generating ? (
              <>
                <RefreshCw size={14} className="spinner" />
                <span>Running Gemini / Fallback Engine...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>{plan ? 'Regenerate AI Plan' : 'Generate AI Action Plan'}</span>
              </>
            )}
          </button>
        </div>

        {plan?.diagnosis && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 14px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: '6px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>AI Readiness Diagnosis: </strong>
            {plan.diagnosis}
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* 4-Milestone Sprint Roadmap */}
      <div className="panel" style={{ padding: '20px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>4-Milestone Sprint Roadmap</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Check off tasks, add custom milestones, and adjust target dates
            </p>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span className="font-mono tabular-nums">
              {tasks.filter((t) => t.completed).length} of {tasks.length}
            </span>{' '}
            tasks completed
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[1, 2, 3, 4].map((mNum) => {
            const milestoneTasks = tasks.filter((t) => t.milestone === mNum);
            const mTitles = {
              1: 'Milestone 1: Core Fundamentals & Framework Mastery',
              2: 'Milestone 2: Advanced Concepts & System Design',
              3: 'Milestone 3: Hands-on Project Implementation & Testing',
              4: 'Milestone 4: Mock Interviews & Behavioral Readiness',
            };

            return (
              <div
                key={mNum}
                style={{
                  border: '1px solid var(--border-default)',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  overflow: 'hidden',
                }}
              >
                {/* Milestone Bar */}
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderBottom: '1px solid var(--border-default)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '9999px',
                        backgroundColor: '#18181b',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {mNum}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {mTitles[mNum]}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleOpenAddTask(mNum)}
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    <Plus size={12} />
                    <span>Add Task</span>
                  </button>
                </div>

                {/* Tasks List */}
                {milestoneTasks.length === 0 ? (
                  <div style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No tasks yet for Milestone {mNum}. Click &quot;Add Task&quot; above to create one.
                  </div>
                ) : (
                  <div style={{ divideY: '1px solid var(--border-subtle)' }}>
                    {milestoneTasks.map((task) => {
                      const isDone = !!task.completed;
                      const prioClass =
                        task.priority === 'High'
                          ? 'pill-gap'
                          : task.priority === 'Medium'
                          ? 'pill-developing'
                          : 'pill-neutral';

                      return (
                        <div
                          key={task.id}
                          style={{
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '12px',
                            borderBottom: '1px solid var(--border-subtle)',
                            backgroundColor: isDone ? '#fafafa' : '#ffffff',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
                            <button
                              type="button"
                              onClick={() => handleToggleTask(task.id, isDone)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                color: isDone ? '#059669' : '#a1a1aa',
                                marginTop: '2px',
                              }}
                            >
                              {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                            </button>

                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                                  textDecoration: isDone ? 'line-through' : 'none',
                                }}
                              >
                                {task.title}
                              </div>
                              {task.description && (
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                                  {task.description}
                                </div>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                            <span className={`pill ${prioClass}`}>{task.priority}</span>
                            {task.target_date && (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Calendar size={11} />
                                <span className="font-mono tabular-nums">{task.target_date}</span>
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              style={{ background: 'none', border: 'none', color: '#a1a1aa', padding: '4px', cursor: 'pointer' }}
                              title="Delete task"
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mock Interview Q&A Flashcards Section */}
      <div className="panel" style={{ padding: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
            Project & Skill Mock Interview Flashcards
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Tailored questions generated from your projects and identified skill gaps using the STAR framework
          </p>
        </div>

        {interviewQuestions.length === 0 ? (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No interview questions generated yet. Click &quot;Generate AI Plan&quot; above to produce context-aware questions.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {interviewQuestions.map((q, idx) => {
              const isExpanded = activeQuestion === idx;
              return (
                <div
                  key={idx}
                  style={{
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveQuestion(isExpanded ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <HelpCircle size={15} style={{ color: '#2563eb', marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {q.question}
                        </div>
                        {q.focus_area && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Focus: <span className="font-mono">{q.focus_area}</span>
                            {q.project_title && ` • Linked Project: ${q.project_title}`}
                          </div>
                        )}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                  </button>

                  {isExpanded && (
                    <div
                      style={{
                        padding: '14px 16px',
                        backgroundColor: 'var(--bg-subtle)',
                        borderTop: '1px solid var(--border-default)',
                        fontSize: '13px',
                        lineHeight: 1.6,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                        Model STAR Response Breakdown:
                      </div>
                      <p style={{ margin: 0 }}>{q.sample_answer || q.answer || 'Provide a structured answer citing Situation, Task, Action, and Result.'}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Custom Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div
            className="panel"
            style={{ width: '100%', maxWidth: '440px', padding: '24px', backgroundColor: '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                Add Custom Task (Milestone {selectedMilestone})
              </h3>
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            {taskError && (
              <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '12px', marginBottom: '14px' }}>
                {taskError}
              </div>
            )}

            <form onSubmit={handleSaveCustomTask}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Task Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Implement JWT authentication with refresh token"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Description / Study Link
                </label>
                <textarea
                  rows={2}
                  placeholder="Details, documentation links, or exercises"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Target Completion
                  </label>
                  <select
                    value={taskTargetDays}
                    onChange={(e) => setTaskTargetDays(e.target.value)}
                  >
                    <option value={3}>In 3 Days</option>
                    <option value={7}>In 1 Week</option>
                    <option value={14}>In 2 Weeks</option>
                    <option value={30}>In 1 Month</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowTaskModal(false)}
                  disabled={savingTask}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={savingTask}>
                  {savingTask ? 'Adding...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
