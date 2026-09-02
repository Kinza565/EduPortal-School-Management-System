"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedSignupMascot } from "@/components/auth/AnimatedSignupMascot";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Eye,
  EyeOff,
  Sparkles,
  User,
  Users,
  Mail,
  Lock,
  CheckCircle,
  ShieldCheck,
  Check,
  Layers,
  ArrowRight,
} from "lucide-react";
import type { Role } from "@/types/database";

type MascotState = "idle" | "nameFocused" | "emailFocused" | "passwordFocused" | "passwordTyping" | "passwordVisible" | "loading" | "success" | "error";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mascotState, setMascotState] = useState<MascotState>("idle");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<Role>("admin");
  const { signup } = useAuth();
  const router = useRouter();

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(mediaQuery.matches);
    updateMotion();
    mediaQuery.addEventListener("change", updateMotion);
    return () => mediaQuery.removeEventListener("change", updateMotion);
  }, []);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Calculate password strength directly (no useEffect needed)
  const passwordStrength = (() => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  })();

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setMascotState("passwordTyping");
    const timer = setTimeout(() => {
      if (document.activeElement?.id === "password" || document.activeElement?.id === "confirmPassword") {
        setMascotState("passwordFocused");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleNameFocus = useCallback(() => {
    setMascotState("nameFocused");
  }, []);

  const handleNameBlur = useCallback(() => {
    setMascotState("idle");
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

    // Validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setMascotState("error");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setMascotState("error");
      return;
    }

    setIsLoading(true);
    setMascotState("loading");

    try {
      const result = await signup(email, password, fullName, role);

      if (result.error) {
        setError(result.error);
        setMascotState("error");
        setIsLoading(false);
        return;
      }

      setMascotState("success");
      // Redirect to login after successful signup
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setMascotState("error");
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-amber-500";
    if (passwordStrength <= 4) return "bg-emerald-500";
    return "bg-emerald-600";
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength <= 2) return "Weak Password";
    if (passwordStrength <= 3) return "Medium Strength";
    if (passwordStrength <= 4) return "Strong Password";
    return "Extremely Secure";
  };

  return (
    <div className="flex min-h-screen bg-slate-50 selection:bg-emerald-500/30 selection:text-emerald-900">
      {/* Left Panel - Mascot, EdTech Branding & Interactive Onboarding Widgets */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-[#022c22] via-[#0f172a] to-[#042f2e] p-12 flex-col justify-between border-r border-slate-800">
        
        {/* Modern Interactive Background Grid and Glowing Orbs */}
        <div className="absolute inset-0 z-0">
          {/* Subtle Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          
          {/* Soft glowing ambient circles */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
          
          {/* Geometric subtle lines */}
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
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-white/10">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
                EduPortal
                <span className="text-[10px] uppercase tracking-wider bg-blue-500/20 text-blue-400 font-semibold px-1.5 py-0.5 rounded border border-blue-500/30">
                  SaaS
                </span>
              </span>
              <span className="text-slate-400 text-xs block">Premium School Management</span>
            </div>
          </div>
        </div>

        {/* Center Section: Mascot & Tasteful Floating Setup Milestones */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 py-12">
          
          {/* Mascot in a highly integrated premium glowing pod */}
          <div
            className={`relative p-8 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-xl shadow-2xl transition-all duration-1000 delay-200 transform ${
              mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            {/* Absolute positioning of floating onboarding widgets around the mascot */}
            {!reducedMotion && (
              <>
                {/* Widget 1: School Setup Checklist */}
                <div className="absolute -left-20 top-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 shadow-xl w-44 animate-float-1 hover:border-emerald-500/50 hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Setup Checklist</span>
                    <span className="p-1 rounded bg-emerald-500/10 text-emerald-400">
                      <Layers className="w-3 h-3" />
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-1.5 text-[9px] text-slate-300">
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[7px]"><Check className="w-2.5 h-2.5" /></span>
                      Add Teachers
                    </li>
                    <li className="flex items-center gap-1.5 text-[9px] text-slate-300">
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[7px]"><Check className="w-2.5 h-2.5" /></span>
                      Create Classes
                    </li>
                    <li className="flex items-center gap-1.5 text-[9px] text-slate-400">
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-[6px]">3</span>
                      Invite Parents
                    </li>
                  </ul>
                </div>

                {/* Widget 2: Setup Resource Counts */}
                <div className="absolute -right-20 bottom-4 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 shadow-xl w-44 animate-float-2 hover:border-blue-500/50 hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Resources Available</span>
                    <span className="p-1 rounded bg-blue-500/10 text-blue-400">
                      <BookOpen className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white">24,000+</div>
                  <p className="text-[9px] text-slate-400">Digital syllabi & academic papers instantly ready</p>
                </div>

                {/* Widget 3: Live Academic Progress Status */}
                <div className="absolute -right-16 top-16 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-xl w-40 animate-float-3 hover:border-teal-500/50 hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1 rounded bg-teal-500/10 text-teal-400">
                      <Sparkles className="w-3 h-3" />
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Fast-Onboarding</span>
                  </div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    School Setup Active
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">Takes less than 10 minutes</p>
                </div>
              </>
            )}

            {/* Mascot Wrapper */}
            <div className="relative">
              <AnimatedSignupMascot state={mascotState} reducedMotion={reducedMotion} />
              
              {/* Subtle halo glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full blur opacity-15" />
            </div>
          </div>

          {/* Slogan & Message */}
          <div
            className={`mt-10 text-center transition-all duration-1000 delay-300 transform ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
              Build a Smarter School.
            </h1>
            <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
              Everything you need to manage learning, administration, and campus success in one integrated professional platform.
            </p>
          </div>
        </div>

        {/* Trust & Secure Onboarding Info Footer */}
        <div
          className={`relative z-10 transition-all duration-1000 delay-400 transform ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex items-center gap-5 justify-center py-2.5 px-4 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-md max-w-xs mx-auto">
            <div className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">SECURE REGISTRATION</span>
            </div>
            <div className="h-4 w-[1px] bg-white/10" />
            <span className="text-slate-400 text-xs">GDPR Compliant</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Premium Clean Form Card */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 lg:p-16 bg-gradient-to-tr from-slate-50 via-slate-100/50 to-emerald-50/20 relative overflow-hidden">
        
        {/* Subtle Decorative Background Shapes */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-emerald-400/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-blue-400/5 rounded-full blur-[90px]" />
          
          {/* Abstract blueprint lines */}
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
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Onboarding System</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Create your account</h2>
            <p className="text-slate-500 text-sm">
              Setup your administrative profile to get started
            </p>
          </div>

          {/* Mascot in mini-mode on mobile/tablet to keep the page interactive */}
          <div
            className={`lg:hidden flex justify-center py-2 transition-all duration-1000 delay-150 transform ${
              mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            <div className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-md">
              <AnimatedSignupMascot state={mascotState} reducedMotion={reducedMotion} />
            </div>
          </div>

          {/* Registration Form Card */}
          <div
            className={`bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/60 p-7 md:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.03)] transition-all duration-1000 delay-200 transform ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <form onSubmit={handleSubmit} className="space-y-4.5">
              {/* Error Alert Panel */}
              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50/80 p-4 flex items-start gap-3 animate-shake">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs font-black">!</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-0.5">Registration Issue</h4>
                    <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              {/* Full Name Input */}
              <div className="space-y-1.5">
                <label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your first & last name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={handleNameFocus}
                    onBlur={handleNameBlur}
                    required
                    disabled={isLoading}
                    className="h-12 pl-11 pr-4 bg-slate-50/50 border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 text-sm font-medium placeholder:text-slate-400/80 focus:bg-white"
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email Address Input */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={handleEmailFocus}
                    onBlur={handleEmailBlur}
                    required
                    disabled={isLoading}
                    className="h-12 pl-11 pr-4 bg-slate-50/50 border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 text-sm font-medium placeholder:text-slate-400/80 focus:bg-white"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={handlePasswordChange}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                    required
                    disabled={isLoading}
                    className="h-12 pl-11 pr-12 bg-slate-50/50 border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 text-sm font-medium placeholder:text-slate-400/80 focus:bg-white"
                    autoComplete="new-password"
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

                {/* Highly polished responsive Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="space-y-1.5 pt-1 animate-fade-in">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i < passwordStrength ? getPasswordStrengthColor() : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-[11px] font-bold ${passwordStrength <= 2 ? "text-red-500" : passwordStrength <= 3 ? "text-amber-500" : "text-emerald-500"}`}>
                      {getPasswordStrengthLabel()}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Verify account password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                    required
                    disabled={isLoading}
                    className="h-12 pl-11 pr-4 bg-slate-50/50 border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 text-sm font-medium placeholder:text-slate-400/80 focus:bg-white"
                    autoComplete="new-password"
                  />
                  {confirmPassword && password === confirmPassword && (
                    <CheckCircle size={16} className="absolute right-4.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                  )}
                </div>
              </div>

              {/* Account Role Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Select Your Role
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { value: "admin" as Role, label: "Admin", icon: ShieldCheck },
                    { value: "teacher" as Role, label: "Teacher", icon: BookOpen },
                    { value: "parent" as Role, label: "Parent", icon: Users },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const selected = role === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRole(opt.value)}
                        className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 transition-all duration-300 ${
                          selected
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm ring-2 ring-emerald-500/20"
                            : "border-slate-200 bg-slate-50/50 text-slate-500 hover:border-slate-300 hover:bg-white"
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-[11px] font-bold">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Terms of Service agreements */}
              <p className="text-[11px] text-slate-500 leading-normal">
                By signing up, you agree to our{" "}
                <button type="button" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline">
                  Terms of Service
                </button>{" "}
                and{" "}
                <button type="button" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline">
                  Privacy Policy
                </button>
              </p>

              {/* Submit Registration Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/15 hover:shadow-xl hover:shadow-emerald-500/25 transition-all duration-300 disabled:opacity-70 hover:scale-[1.01] active:scale-[0.99] active:translate-y-0 text-sm flex items-center justify-center gap-2 border-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deploying profile...</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Create Account <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Navigation back to Sign-in */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </div>

          {/* Secure compliance tags */}
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
