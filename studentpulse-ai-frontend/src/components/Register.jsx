import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, BookOpen, AlertCircle, ArrowRight, GraduationCap, Eye, EyeOff } from 'lucide-react';

export default function Register({ onSwitchToLogin }) {
  const { register, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!name.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@kiet.edu')) {
      setLocalError('Please provide a valid institutional @kiet.edu email address.');
      return;
    }
    if (!enrollmentNo.trim()) {
      setLocalError('Please provide your university roll/enrollment number.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        enrollment_no: enrollmentNo.trim().toUpperCase(),
        password: password,
      });
    } catch (err) {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-[#09090B] relative overflow-hidden">
      {/* Background Neon Ambient Glow */}
      <div className="absolute w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(0,255,102,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div className="panel w-full max-w-md p-8 bg-[#111114] border border-[#222228] shadow-[0_0_40px_rgba(0,0,0,0.9)] rounded-2xl relative z-10">
        <div className="mb-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#18181D] border border-[#00FF66]/40 flex items-center justify-center text-[#00FF66] font-mono font-bold text-lg shadow-[0_0_20px_rgba(0,255,102,0.3)]">
            SP
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18181D] border border-[#222228] text-[11px] font-mono font-semibold text-[#00FF66] mb-3">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>KIET GROUP OF INSTITUTIONS</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Create Student Account
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1 font-mono">
            Initialize your student readiness & career preparation tracker
          </p>
        </div>

        {activeError && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{activeError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3.5">
            <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-[#6B7280]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amarjeet Kumar"
                className="pl-9 bg-[#18181D] border-[#222228] text-white"
                required
              />
            </div>
          </div>

          <div className="mb-3.5">
            <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
              Institutional Email (@kiet.edu)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-[#6B7280]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name.2628mcaXXXX@kiet.edu"
                className="pl-9 bg-[#18181D] border-[#222228] text-white"
                required
              />
            </div>
          </div>

          <div className="mb-3.5">
            <label className="text-xs font-semibold text-[#9CA3AF] block mb-1">
              University Roll / Enrollment No
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 absolute left-3 top-3 text-[#6B7280]" />
              <input
                type="text"
                value={enrollmentNo}
                onChange={(e) => setEnrollmentNo(e.target.value)}
                placeholder="e.g. 2628MCA0069"
                className="pl-9 uppercase font-mono bg-[#18181D] border-[#222228] text-white"
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
                placeholder="Minimum 6 characters"
                className="pl-9 pr-10 bg-[#18181D] border-[#222228] text-white"
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
              <span>Registering account...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-[#9CA3AF]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => { clearError(); onSwitchToLogin(); }}
            className="text-[#00FF66] font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
