import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome, ${user.full_name}`);
      nav(user.role === "candidate" ? "/me" : "/app");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  const quick = (e, p) => { setEmail(e); setPassword(p); };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:block relative bg-gradient-to-br from-primary to-blue-800 text-white p-12">
        <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>
        <div className="mt-16">
          <img src="/favicon.png" alt="UGS" className="h-16 w-16 object-contain drop-shadow-lg" />
          <div className="mt-8 overline text-white/70">UGS HireFlow</div>
          <h1 className="mt-3 font-display text-5xl font-bold tracking-tighter">Recruitment,<br />operationalised.</h1>
          <p className="mt-4 text-white/85 max-w-md leading-relaxed">
            Sign in to your console to manage candidates, companies, and placements.
          </p>
        </div>
        <div className="absolute bottom-12 left-12 right-12 glass rounded-2xl p-5 bg-white/10 border-white/20">
          <div className="overline text-white/70 text-[10px]">Demo credentials</div>
          <div className="mt-2 space-y-1.5 text-sm">
            <button onClick={() => quick("admin@ugs.com", "Admin@123")} className="block hover:underline" data-testid="demo-admin">Admin · admin@ugs.com / Admin@123</button>
            <button onClick={() => quick("priya@ugs.com", "Employee@123")} className="block hover:underline" data-testid="demo-employee">Recruiter · priya@ugs.com / Employee@123</button>
            <button onClick={() => quick("arjun.k@example.com", "Candidate@123")} className="block hover:underline" data-testid="demo-candidate">Candidate · arjun.k@example.com / Candidate@123</button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="md:hidden inline-flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="md:hidden flex items-center gap-2.5 mb-6">
            <img src="/favicon.png" alt="UGS" className="h-10 w-10 object-contain" />
            <div className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-[#4A5FBF] via-[#5B8CB5] to-[#3EB489] bg-clip-text text-transparent">UGS HireFlow</div>
          </div>
          <div className="overline text-primary">Sign in</div>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-muted-foreground">Enter your credentials to continue.</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} data-testid="login-email" /></div>
            <div><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password" /></div>
            <Button type="submit" className="w-full h-11" disabled={loading} data-testid="login-submit">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="mt-6 text-sm text-muted-foreground text-center">
            New candidate? <Link to="/register" className="text-primary hover:underline">Register here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
