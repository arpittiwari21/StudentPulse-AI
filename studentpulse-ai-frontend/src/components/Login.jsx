import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, AlertCircle, ArrowRight, GraduationCap, UserCheck, Zap } from 'lucide-react';

export default function Login({ onSwitchToRegister }) {
  const { login, error, clearError, isServerOnline } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleLogin = async (loginEmail, loginPassword) => {
    setLocalError('');
    clearError();

    const targetEmail = (loginEmail || email).trim();
    const targetPassword = loginPassword || password;

    if (!targetEmail) {
      setLocalError('Please enter your @kiet.edu institutional email.');
      return;
    }
    if (!targetPassword) {
      setLocalError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        email: targetEmail,
        password: targetPassword,
      });
    } catch (err) {
      // Handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoStudent = () => {
    setEmail('student@kiet.edu');
    setPassword('Student@123');
    handleLogin('student@kiet.edu', 'Student@123');
  };

  const handleDemoFaculty = () => {
    setEmail('admin@kiet.edu');
    setPassword('Faculty@KIET2024');
    handleLogin('admin@kiet.edu', 'Faculty@KIET2024');
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-[#09090B] relative overflow-hidden">
      {/* Background Neon Ambient Glow */}
      <div className="absolute w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(0,255,102,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div className="panel w-full max-w-md p-8 bg-[#111114] border border-[#222228] shadow-[0_0_40px_rgba(0,0,0,0.9)] rounded-2xl relative z-10">
        {/* Emblem & Branding */}
        <div className="mb-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#18181D] border border-[#00FF66]/40 flex items-center justify-center text-[#00FF66] font-mono font-bold text-lg shadow-[0_0_20px_rgba(0,255,102,0.3)]">
            SP
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18181D] border border-[#222228] text-[11px] font-mono font-semibold text-[#00FF66] mb-3">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>KIET GROUP OF INSTITUTIONS</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            StudentPulse <span className="text-[#00FF66]">AI</span>
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1 font-mono">
            Student Success, Skill Readiness & Career Analytics
          </p>
        </div>

        {/* Offline Warning */}
        {!isServerOnline && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Backend server offline. Reconnecting to Flask API...</span>
          </div>
        )}

        {/* Active Error Banner */}
        {activeError && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{activeError}</span>
          </div>
        )}

        {/* 1-Click MSE-2 Evaluation Logins */}
        <div className="mb-6 p-3.5 bg-[#18181D] border border-[#222228] rounded-xl">
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00FF66] mb-2.5 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>1-Click MSE-2 Demo Access</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              className="py-2 px-3 text-xs font-semibold rounded-lg bg-[#111114] hover:bg-[#222228] text-white border border-[#32323C] hover:border-[#00FF66]/50 transition-all cursor-pointer"
              onClick={handleDemoStudent}
              disabled={isSubmitting}
            >
              Student Demo
            </button>
            <button
              type="button"
              className="py-2 px-3 text-xs font-semibold rounded-lg bg-[#111114] hover:bg-[#222228] text-white border border-[#32323C] hover:border-[#00FF66]/50 transition-all cursor-pointer"
              onClick={handleDemoFaculty}
              disabled={isSubmitting}
            >
              Faculty Demo
            </button>
          </div>
        </div>

        <div className="relative text-center my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#222228]"></div>
          </div>
          <div className="relative inline-block px-3 bg-[#111114] text-[11px] font-mono text-[#6B7280]">
            or sign in with credentials
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} noValidate>
          <div className="mb-4">
            <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
              Institutional Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-[#6B7280]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rollno.2628mcaXXXX@kiet.edu"
                className="pl-9 bg-[#18181D] border-[#222228] text-white"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-[#6B7280]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="pl-9 pr-10 bg-[#18181D] border-[#222228] text-white"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-2.5 top-2.5 text-[#6B7280] hover:text-white p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign in to Dashboard</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-[#9CA3AF]">
          New student?{' '}
          <button
            type="button"
            onClick={() => { clearError(); onSwitchToRegister(); }}
            className="text-[#00FF66] font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
          >
            Create an account
          </button>
        </div>
      </div>

      {/* Attribution Footer */}
      <div className="mt-6 max-w-md text-center text-[11px] text-[#6B7280] font-mono leading-relaxed">
        <div>Department of Computer Applications • MCA AI & Python Programming</div>
        <div className="text-[#9CA3AF] mt-1">
          Team: Amarjeet Kumar (2628MCA0069), Akhilesh Chaubey, Arpit Tiwari, Ankit Pathak, Archana Tiwari
        </div>
      </div>
    </div>
  );
}
