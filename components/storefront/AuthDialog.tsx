"use client";

import { useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { LoadingSpinner } from "../ui/loading-spinner";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface AuthDialogProps { open: boolean; onClose: () => void; onSubmit: (mode: "login" | "register", values: { name: string; email: string; password: string }) => Promise<void>; }
export default function AuthDialog({ open, onClose, onSubmit }: AuthDialogProps) {
  const [mode, setMode] = useState<"login" | "register">("login"); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [showPassword, setShowPassword] = useState(false); const [loading, setLoading] = useState(false);
  if (!open) return null;
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setLoading(true); try { await onSubmit(mode, { name, email, password }); onClose(); } catch (err) { toast.error(err instanceof Error ? err.message : "Unable to continue"); } finally { setLoading(false); } };
  return <div className="modal-backdrop" role="presentation"><form className="commerce-modal" onSubmit={submit}><Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></Button></TooltipTrigger><TooltipContent>Close</TooltipContent></Tooltip><p className="eyebrow">ACCOUNT ACCESS</p><h2 className="font-display">{mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}</h2>{mode === "register" && <label>NAME<Input required value={name} onChange={(event) => setName(event.target.value)} /></label>}<label>EMAIL<Input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>PASSWORD<span className="password-field"><Input required type={showPassword ? "text" : "password"} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /><Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</Button></TooltipTrigger><TooltipContent>{showPassword ? "Hide password" : "Show password"}</TooltipContent></Tooltip></span></label><Button className="checkout-btn" disabled={loading}>{loading ? <><LoadingSpinner /> PLEASE WAIT…</> : mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}</Button><Button type="button" variant="ghost" className="text-action" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Need an account? Register" : "Already registered? Sign in"}</Button></form></div>;
}
