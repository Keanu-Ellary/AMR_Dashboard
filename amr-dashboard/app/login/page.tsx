"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import { login } from "@/app/services/authService";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!email || !password) {
        toast.error("Please enter credentials.");
        return;
      }
      setIsLoading(true);
      try {
        const response = await login(email, password);
        if (response && response.status === 200) {
          toast.success("Authentication successful");
          setTimeout(() => window.location.href = "/home", 1000);
        } else { 
          toast.error("Invalid credentials");
        }
      } finally {
        setIsLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden shadow-soft border border-border h-[650px]">
        
        {/* Form Side */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-12 md:px-20">
          <header className="mb-10 text-center md:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase mb-2">
              AMR Surveillance
            </h1>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">
              Researcher Portal
            </p>
          </header>
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <input
                type="email"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all placeholder:text-gray-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@example.edu"
              />
            </div>
            
            <div className="relative">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Secure Password</label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all pr-12 placeholder:text-gray-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[38px] text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <div className="flex flex-col gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-foreground text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity shadow-subtle text-sm uppercase tracking-widest disabled:opacity-50"
              >
                {isLoading ? "Authenticating..." : "Authorize Access"}
              </button>
              
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-2">
                <Link href="/forgot-password" title="reset" className="hover:text-brand-600 transition-colors">Forgot Password</Link>
                <button type="button" onClick={() => window.history.back()} className="flex items-center gap-1 hover:text-risk-high transition-colors">
                  <ArrowLeft size={12} /> Return
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Visual Side */}
        <div className="w-full md:w-1/2 hidden md:block relative bg-gray-100">
          <img 
            src="/login-bg.jpg" 
            alt="Scientific Context"
            className="w-full h-full object-cover opacity-90 grayscale-[0.2]"
          />
          <div className="absolute inset-0 bg-brand-600/10 mix-blend-multiply" />
          <div className="absolute bottom-10 left-10 right-10 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Apies River Basin</p>
            <p className="text-sm font-medium italic">"Precision monitoring for public health security."</p>
          </div>
        </div>
      </div>
    </div>
  );
}
