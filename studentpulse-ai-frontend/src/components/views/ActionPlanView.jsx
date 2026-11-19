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
  Calendar,
  HelpCircle,
  RefreshCw,
  X,
  Zap,
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
      await generateAiPlan(token);
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
      <div className="px-6 py-6 flex flex-col gap-6 bg-[#09090B] min-h-screen">
        <div className="panel skeleton h-[160px] rounded-2xl" />
        <div className="panel skeleton h-[420px] rounded-2xl" />
      </div>
    );
  }

  const interviewQuestions = plan?.interview_questions || [];

  return (
    <div className="px-6 py-6 flex flex-col gap-6 bg-[#09090B] min-h-screen">
      {/* Top Action Bar */}
      <div className="panel p-6 rounded-2xl border-t-2 border-t-[#00FF66] bg-[#111114]">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]" />
              <h3 className="text-base font-bold text-white tracking-tight m-0">
                AI Adaptive Milestone Roadmap
              </h3>
              {plan?.readiness_tier && (
                <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30">
                  {plan.readiness_tier}
                </span>
              )}
            </div>
            <p className="text-xs text-[#9CA3AF] m-0">
              {plan
                ? `Generated on ${new Date(plan.generated_at).toLocaleDateString()} • Context-tuned to your daily study pacing`
                : 'No active plan. Click to generate a tailored 4-milestone roadmap.'}
            </p>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleGeneratePlan}
            disabled={generating}
          >
            {generating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Running Gemini Engine...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>{plan ? 'Regenerate AI Action Plan' : 'Generate AI Action Plan'}</span>
              </>
            )}
          </button>
        </div>

        {plan?.diagnosis && (
          <div className="mt-4 p-4 bg-[#18181D] border border-[#222228] border-l-4 border-l-[#00FF66] rounded-xl text-xs text-[#E4E4E7] leading-relaxed">
            <strong className="text-[#00FF66] font-mono">AI Diagnosis: </strong>
            {plan.diagnosis}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-[#18181D] border border-red-500/30 rounded-xl text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* 4-Milestone Sprint Roadmap */}
      <div className="panel p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight m-0">
              4-Milestone Sprint Roadmap
            </h3>
            <p className="text-xs text-[#9CA3AF] m-0 mt-0.5">
              Check off tasks, add custom milestones, and adjust completion target dates
            </p>
          </div>
          <div className="text-xs font-mono text-[#9CA3AF] bg-[#18181D] px-3 py-1.5 rounded-lg border border-[#222228]">
            <span className="text-[#00FF66] font-bold">
              {tasks.filter((t) => t.completed).length}
            </span>{' '}
            / {tasks.length} tasks completed
          </div>
        </div>

        <div className="flex flex-col gap-5">
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
                className="border border-[#222228] rounded-xl bg-[#0C0C0F] overflow-hidden"
              >
                {/* Milestone Bar */}
                <div className="p-4 bg-[#111114] border-b border-[#222228] flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-[#18181D] border border-[#00FF66]/30 text-[#00FF66] text-xs font-mono font-bold flex items-center justify-center">
                      {mNum}
                    </div>
                    <span className="text-xs font-bold text-white tracking-tight">
                      {mTitles[mNum]}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn-secondary text-[11px] py-1.5 px-3"
                    onClick={() => handleOpenAddTask(mNum)}
                  >
                    <Plus size={12} />
                    <span>Add Task</span>
                  </button>
                </div>

                {/* Tasks List */}
                {milestoneTasks.length === 0 ? (
                  <div className="p-4 text-xs text-[#6B7280] text-center font-mono">
                    No tasks for Milestone {mNum}. Click &quot;Add Task&quot; above to append one.
                  </div>
                ) : (
                  <div className="divide-y divide-[#18181D]">
                    {milestoneTasks.map((task) => {
                      const isDone = !!task.completed;
                      const prioClass =
                        task.priority === 'High'
                          ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                          : task.priority === 'Medium'
                          ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30'
                          : 'bg-[#6B7280]/10 text-[#9CA3AF] border-[#6B7280]/30';

                      return (
                        <div
                          key={task.id}
                          className={`p-4 flex items-start justify-between gap-3 transition-colors ${
                            isDone ? 'bg-[#09090B]/60' : 'hover:bg-[#111114]/40'
                          }`}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleTask(task.id, isDone)}
                              className="p-0 bg-transparent border-0 cursor-pointer text-[#6B7280] hover:text-[#00FF66] mt-0.5 shrink-0"
                            >
                              {isDone ? (
                                <CheckCircle2 size={18} className="text-[#00FF66] drop-shadow-[0_0_6px_rgba(0,255,102,0.5)]" />
                              ) : (
                                <Circle size={18} />
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <div
                                className={`text-xs font-semibold ${
                                  isDone ? 'line-through text-[#6B7280]' : 'text-white'
                                }`}
                              >
                                {task.title}
                              </div>
                              {task.description && (
                                <div className="text-[11px] text-[#9CA3AF] mt-1 line-clamp-2">
                                  {task.description}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md border ${prioClass}`}>
                              {task.priority}
                            </span>
                            {task.target_date && (
                              <span className="text-[11px] text-[#9CA3AF] flex items-center gap-1 font-mono">
                                <Calendar size={11} className="text-[#6B7280]" />
                                <span>{task.target_date}</span>
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1 text-[#6B7280] hover:text-[#EF4444] rounded transition-colors"
                              title="Delete task"
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
      <div className="panel p-6 rounded-2xl">
        <div className="mb-5">
          <h3 className="text-base font-bold text-white tracking-tight m-0">
            Project & Skill Mock Interview Flashcards
          </h3>
          <p className="text-xs text-[#9CA3AF] m-0 mt-0.5">
            Tailored technical interview questions generated from your projects and identified skill gaps
          </p>
        </div>

        {interviewQuestions.length === 0 ? (
          <div className="p-8 text-center text-[#6B7280] text-xs font-mono">
            No interview questions generated yet. Click &quot;Generate AI Plan&quot; above to synthesize custom questions.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {interviewQuestions.map((q, idx) => {
              const isExpanded = activeQuestion === idx;
              return (
                <div
                  key={idx}
                  className="border border-[#222228] rounded-xl overflow-hidden bg-[#0C0C0F]"
                >
                  <button
                    type="button"
                    onClick={() => setActiveQuestion(isExpanded ? null : idx)}
                    className="w-full p-4 flex items-center justify-between text-left cursor-pointer gap-3 hover:bg-[#111114] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <HelpCircle size={16} className="text-[#00FF66] mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">
                          {q.question}
                        </div>
                        {q.focus_area && (
                          <div className="text-[11px] text-[#9CA3AF] font-mono mt-1">
                            Focus: <span className="text-[#00FF66]">{q.focus_area}</span>
                            {q.project_title && ` • Project: ${q.project_title}`}
                          </div>
                        )}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-[#9CA3AF]" /> : <ChevronDown size={16} className="text-[#9CA3AF]" />}
                  </button>

                  {isExpanded && (
                    <div className="p-4 bg-[#111114] border-t border-[#222228] text-xs leading-relaxed text-[#E4E4E7]">
                      <div className="text-[10px] font-mono font-bold text-[#00FF66] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Zap size={11} />
                        <span>Recommended STAR Answer Strategy:</span>
                      </div>
                      <p className="m-0 text-slate-300">
                        {q.sample_answer || q.answer || 'Provide a structured response covering Situation, Task, Action, and Measurable Result.'}
                      </p>
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
            className="panel p-6 w-full max-w-md bg-[#111114] border border-[#222228] rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-white m-0">
                Add Custom Task (Milestone {selectedMilestone})
              </h3>
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="p-1 text-[#9CA3AF] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {taskError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs mb-4">
                {taskError}
              </div>
            )}

            <form onSubmit={handleSaveCustomTask}>
              <div className="mb-3.5">
                <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Implement JWT refresh token rotation"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3.5">
                <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
                  Description / Study Material
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes, architecture links, or references"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
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
                  <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
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

              <div className="flex justify-end gap-3 mt-5">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowTaskModal(false)}
                  disabled={savingTask}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={savingTask}>
                  {savingTask ? 'Saving...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
