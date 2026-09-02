"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedLoginMascot } from "@/components/auth/AnimatedLoginMascot";
import Link from "next/link";
import {
  GraduationCap,
  Star,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Users,
  Calendar,
  ArrowRight,
} from "lucide-react";

type MascotState = "idle" | "emailFocused" | "passwordFocused" | "passwordTyping" | "passwordVisible" | "loading" | "success" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mascotState, setMascotState] = useState<MascotState>("idle");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, profile, login } = useAuth();
  const router = useRouter();

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let currentReduced = false;
    const updateMotion = () => {
      currentReduced = mediaQuery.matches;
      setReducedMotion(currentReduced);
    };
    updateMotion();
    mediaQuery.addEventListener("change", updateMotion);
    return () => mediaQuery.removeEventListener("change", updateMotion);
  }, []);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      if (profile.role === "admin") {
        router.push("/admin/dashboard");
      } else if (profile.role === "teacher") {
        router.push("/teacher/dashboard");
      } else if (profile.role === "parent") {
        router.push("/parent/dashboard");
      }
    }
  }, [user, profile, router]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setMascotState("passwordTyping");
    const timer = setTimeout(() => {
      if (document.activeElement?.id === "password") {
        setMascotState("passwordFocused");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleEmailFocus = useCallback(() => {
    setMascotState("emailFocused");
  }, []);

  const handleEmailBlur = useCallback(() => {
    setMascotState("idle");
  }, []);

  const handlePasswordFocus = useCallback(() => {
    setMascotState(showPassword ? "passwordVisible" : "passwordFocused");
  }, [showPassword]);

  const handlePasswordBlur = useCallback(() => {
    setMascotState("idle");
  }, []);

  const handleTogglePassword = useCallback(() => {
    setShowPassword((prev) => {
      const newValue = !prev;
      setMascotState(newValue ? "passwordVisible" : "passwordFocused");
      return newValue;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setMascotState("loading");

    try {
      const result = await login(email, password);

      if (result.error) {
        setError("Invalid email or password. Please try again.");
        setMascotState("error");
        setIsLoading(false);
        return;
      }

      setMascotState("success");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setMascotState("error");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 selection:bg-blue-500/30 selection:text-blue-900">
      {/* Left Panel - Mascot, EdTech Branding & Premium Dashboard Previews */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-[#0a0f1d] via-[#0f172a] to-[#1e1b4b] p-12 flex-col justify-between border-r border-slate-800">
        
        {/* Modern Interactive Background Grid and Glowing Orbs */}
        <div className="absolute inset-0 z-0">
          {/* Subtle Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          
          {/* Soft glowing ambient circles */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
          
          {/* Geometric subtle lines for EdTech structure */}
          <div className="absolute top-10 right-10 w-48 h-48 border border-white/[0.03] rounded-full" />
          <div className="absolute bottom-16 left-10 w-64 h-64 border border-white/[0.03] rounded-full" />
        </div>

        {/* Branding/Logo Section */}
        <div
          className={`relative z-10 transition-all duration-1000 transform ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/10">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
                EduPortal
                <span className="text-[10px] uppercase tracking-wider bg-emerald-500/20 text-emerald-400 font-semibold px-1.5 py-0.5 rounded border border-emerald-500/30">
                  SaaS
                </span>
              </span>
              <span className="text-slate-400 text-xs block">Premium School Management</span>
            </div>
          </div>
        </div>

        {/* Center Section: Mascot & Tasteful Educational Floating Dashboard Widgets */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 py-12">
          
          {/* Mascot in a highly integrated premium glowing pod */}
          <div
            className={`relative p-8 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-xl shadow-2xl transition-all duration-1000 delay-200 transform ${
              mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            {/* Absolute positioning of floating widgets around the mascot */}
            {!reducedMotion && (
              <>
                {/* Widget 1: Attendance Rate */}
                <div className="absolute -left-20 top-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 shadow-xl w-44 animate-float-1 hover:border-blue-500/50 hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Attendance</span>
                    <span className="p-1 rounded-md bg-blue-500/10 text-blue-400">
                      <Calendar className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-white">96.2%</span>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" /> +0.8%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full" style={{ width: "96.2%" }} />
                  </div>
                </div>

                {/* Widget 2: Student Stats */}
                <div className="absolute -right-20 bottom-4 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 shadow-xl w-44 animate-float-2 hover:border-emerald-500/50 hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Academic Standings</span>
                    <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                      <Star className="w-3 h-3 fill-emerald-400/20" />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-white">GPA 3.86</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">A- Average</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">Highest standing this semester</p>
                </div>

                {/* Widget 3: Live Active Users */}
                <div className="absolute -right-16 top-16 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-xl w-40 animate-float-3 hover:border-indigo-500/50 hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-400">
                      <Users className="w-3 h-3" />
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Users</span>
                  </div>
                  <div className="text-base font-bold text-white">1,420 <span className="text-xs text-emerald-400 font-medium">Live</span></div>
                  <div className="flex -space-x-1.5 mt-2 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-4 h-4 rounded-full bg-slate-700 border border-slate-900 flex items-center justify-center text-[7px] text-white font-bold">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                    <div className="w-4 h-4 rounded-full bg-blue-500 border border-slate-900 flex items-center justify-center text-[6px] text-white font-bold">
                      +12
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Mascot Wrapper */}
            <div className="relative">
              <AnimatedLoginMascot state={mascotState} reducedMotion={reducedMotion} />
              
              {/* Subtle halo glow behind the mascot */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full blur opacity-15" />
            </div>
          </div>

          {/* Slogan & Message */}
          <div
            className={`mt-10 text-center transition-all duration-1000 delay-300 transform ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
              Smart tools for smarter schools.
            </h1>
            <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
              Streamline administration, connect your community, and accelerate educational progress inside a modern workspace.
            </p>
          </div>
        </div>

        {/* Trust & Secure Info Panel Footer */}
        <div
          className={`relative z-10 transition-all duration-1000 delay-400 transform ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex items-center gap-5 justify-center py-2.5 px-4 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-md max-w-xs mx-auto">
            <div className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">SECURE LOGIN</span>
            </div>
            <div className="h-4 w-[1px] bg-white/10" />
            <span className="text-slate-400 text-xs">SSL Encryption</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Premium Clean Form Card */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 lg:p-16 bg-gradient-to-tr from-slate-50 via-slate-100/50 to-blue-50/20 relative overflow-hidden">
        
        {/* Subtle Decorative Background Shapes */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-emerald-400/5 rounded-full blur-[90px]" />
          
          {/* Abstract education blueprint elements */}
          <div className="absolute top-1/4 right-[12%] w-16 h-16 border border-slate-200 rounded-full" />
          <div className="absolute bottom-1/4 left-[8%] w-24 h-24 border border-slate-200 rounded-full" />
        </div>

        {/* Form Container Card */}
        <div className="w-full max-w-[430px] space-y-7 relative z-10">
          
          {/* Logo visible on Tablet & Mobile ONLY */}
          <div
            className={`lg:hidden flex items-center justify-center gap-3 mb-8 transition-all duration-1000 transform ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-tight text-slate-900 block">
                EduPortal
              </span>
              <span className="text-slate-500 text-xs font-medium">School Management System</span>
            </div>
          </div>

          {/* Form Header Card */}
          <div
            className={`text-center space-y-2 transition-all duration-1000 delay-100 transform ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
          >
            {/* Small Premium Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Welcome Back</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Sign in to continue</h2>
            <p className="text-slate-500 text-sm">
              Enter your credentials to access your dashboard
            </p>
          </div>

          {/* Mascot in mini-mode on mobile/tablet to keep the page interactive */}
          <div
            className={`lg:hidden flex justify-center py-2 transition-all duration-1000 delay-150 transform ${
              mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            <div className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-md">
              <AnimatedLoginMascot state={mascotState} reducedMotion={reducedMotion} />
            </div>
          </div>

          {/* Login Form Form Container Card */}
          <div
            className={`bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/60 p-7 md:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.03)] transition-all duration-1000 delay-200 transform ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Alert Panel */}
              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50/80 p-4 flex items-start gap-3 animate-shake">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs font-black">!</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-0.5">Authentication Error</h4>
                    <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              {/* Email Address Input */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g. administrator@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={handleEmailFocus}
                    onBlur={handleEmailBlur}
                    required
                    disabled={isLoading}
                    className="h-12 px-4 bg-slate-50/50 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 text-sm font-medium placeholder:text-slate-400/80 focus:bg-white"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline transition-colors focus-visible:outline-none"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter account password"
                    value={password}
                    onChange={handlePasswordChange}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                    required
                    disabled={isLoading}
                    className="h-12 pl-4 pr-12 bg-slate-50/50 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 text-sm font-medium placeholder:text-slate-400/80 focus:bg-white"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={handleTogglePassword}
                    className="absolute right-4.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200 focus-visible:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me Toggle */}
              <div className="flex items-center">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4.5 h-4.5 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition-colors select-none">
                    Remember my session
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/15 hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-70 hover:scale-[1.01] active:scale-[0.99] active:translate-y-0 text-sm flex items-center justify-center gap-2 border-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying session...</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Sign In <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Navigation to Registration */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition-colors">
                  Create Account
                </Link>
              </p>
            </div>
          </div>

          {/* Secure SSL Tag in footer */}
          <div
            className={`text-center space-y-3 transition-all duration-1000 delay-300 transform ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
          >
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure &bull; ISO-27001 Certified &bull; EduPortal
            </p>
          </div>
        </div>
      </div>

      {/* Modern CSS Keyframes Local Styling */}
      <style jsx>{`
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(-1.5deg); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1.2deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
        .animate-float-1 {
          animation: float-1 6s ease-in-out infinite;
        }
        .animate-float-2 {
          animation: float-2 8s ease-in-out infinite;
          animation-delay: 1.5s;
        }
        .animate-float-3 {
          animation: float-3 7s ease-in-out infinite;
          animation-delay: 0.8s;
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
