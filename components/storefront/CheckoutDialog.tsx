"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { LoadingSpinner } from "../ui/loading-spinner";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { api } from "@/lib/api";
import type { CountryLocation } from "@/lib/api";

interface CheckoutDialogProps { open: boolean; onClose: () => void; onCheckout: (address: Record<string, string>) => Promise<void>; }
export default function CheckoutDialog({ open, onClose, onCheckout }: CheckoutDialogProps) {
  const [loading, setLoading] = useState(false); const [countries, setCountries] = useState<CountryLocation[]>([]); const [countryCode, setCountryCode] = useState("NG");
  const selectedCountry = countries.find((country) => country.code === countryCode);
  useEffect(() => { void api.countries().then(setCountries).catch(() => toast.error("Unable to load delivery locations.")); }, []);
  if (!open) return null;
  const submit = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); setLoading(true); const address = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>; try { const phone = await api.formatPhone(countryCode, address.phone); if (!phone.isValid) throw new Error("Enter a valid phone number for the selected country."); await onCheckout({ ...address, country: selectedCountry?.name ?? "Nigeria", phone: phone.e164 }); } catch (err) { toast.error(err instanceof Error ? err.message : "Unable to start checkout"); setLoading(false); } };
  return <div className="modal-backdrop" role="presentation"><form className="commerce-modal" onSubmit={submit}><Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></Button></TooltipTrigger><TooltipContent>Close checkout</TooltipContent></Tooltip><p className="eyebrow">CHECKOUT</p><h2 className="font-display">DELIVERY DETAILS</h2><label>FULL NAME<Input required name="fullName" /></label><label>DELIVERY COUNTRY<span className="country-picker">{selectedCountry && <img src={selectedCountry.flagImage} alt="" />}<select value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>{countries.length === 0 ? <option value="NG">🇳🇬 Nigeria (+234)</option> : countries.map((country) => <option value={country.code} key={country.code}>{country.flagEmoji} {country.name} ({country.dialCode})</option>)}</select></span></label><label>PHONE <span className="phone-input"><span>{selectedCountry?.dialCode ?? "+234"}</span><Input required name="phone" inputMode="tel" placeholder="801 234 5678" /></span></label><label>ADDRESS<Input required name="addressLine1" /></label><label>CITY<Input required name="city" /></label><label>STATE / REGION<Input required name="state" /></label><input type="hidden" name="postalCode" value="" /><p className="payment-note">Catalogue prices are in USD. Paystack charges the converted amount in NGN.</p><Button className="checkout-btn" disabled={loading}>{loading ? <><LoadingSpinner /> OPENING PAYMENT…</> : "CONTINUE TO PAYSTACK"}</Button></form></div>;
}
