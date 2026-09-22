"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { LoadingSpinner } from "../ui/loading-spinner";
import { CommerceDialog } from "../ui/commerce-dialog";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { CheckoutQuote, CountryLocation } from "@/lib/api";

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  onCheckout: (
    address: Record<string, string>,
    quoteToken: string,
    key: string,
  ) => Promise<void>;
}
export default function CheckoutDialog({
  open,
  onClose,
  onCheckout,
}: CheckoutDialogProps) {
  return (
    <CommerceDialog open={open} onClose={onClose} title="Delivery details">
      {open && <CheckoutForm onClose={onClose} onCheckout={onCheckout} />}
    </CommerceDialog>
  );
}
function CheckoutForm({
  onClose,
  onCheckout,
}: Omit<CheckoutDialogProps, "open">) {
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<CountryLocation[]>([]);
  const [countryCode, setCountryCode] = useState("NG");
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const requestKey = useRef("");
  const requestBody = useRef("");
  const selectedCountry = countries.find(
    (country) => country.code === countryCode,
  );
  useEffect(() => {
    let cancelled = false;
    Promise.all([api.countries(), api.quote()])
      .then(([locations, price]) => {
        if (cancelled) return;
        setCountries(locations);
        setQuote(price);
        setError("");
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Unable to prepare checkout.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || !quote || !selectedCountry) return;
    setLoading(true);
    const address = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    ) as Record<string, string>;
    try {
      const phone = await api.formatPhone(countryCode, address.phone);
      if (!phone.isValid)
        throw new Error("Enter a valid phone number for the selected country.");
      const shippingAddress = {
        ...address,
        country: selectedCountry.name,
        phone: phone.e164,
      };
      const body = JSON.stringify({
        shippingAddress,
        fingerprint: quote.fingerprint,
        chargeAmount: quote.chargeAmount,
      });
      let quoteToken = quote.quoteToken;
      if (requestBody.current !== body) {
        // Persist the exact attempt across reloads; retries must not create a second order.
        const saved = sessionStorage.getItem("yagkive-checkout");
        let previous: {
          body: string;
          key: string;
          quoteToken: string;
          createdAt: number;
        } | null = null;
        try {
          previous = saved ? JSON.parse(saved) : null;
        } catch {
          /* replace malformed local state */
        }
        const reusable =
          previous?.body === body &&
          Date.now() - previous.createdAt < 30 * 60 * 1000;
        requestKey.current = reusable ? previous!.key : crypto.randomUUID();
        quoteToken = reusable ? previous!.quoteToken : quote.quoteToken;
        requestBody.current = body;
        sessionStorage.setItem(
          "yagkive-checkout",
          JSON.stringify({
            body,
            key: requestKey.current,
            quoteToken,
            createdAt: reusable ? previous!.createdAt : Date.now(),
          }),
        );
      }
      const savedAttempt = JSON.parse(
        sessionStorage.getItem("yagkive-checkout")!,
      );
      await onCheckout(
        shippingAddress,
        savedAttempt.quoteToken,
        requestKey.current,
      );
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 409 &&
        /quote expired|checkout expired|cart changed/i.test(err.message)
      ) {
        sessionStorage.removeItem("yagkive-checkout");
        requestBody.current = "";
        requestKey.current = "";
        setQuote(null);
      }
      toast.error(
        err instanceof Error ? err.message : "Unable to start checkout",
      );
      setError(err instanceof Error ? err.message : "Unable to start checkout");
    } finally {
      setLoading(false);
    }
  };
  return (
    <form className="commerce-form" onSubmit={submit}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="modal-close"
        disabled={loading}
        onClick={onClose}
        aria-label="Close checkout"
      >
        <X size={18} />
      </Button>
      <p className="eyebrow">CHECKOUT</p>
      <h2 className="font-display">DELIVERY DETAILS</h2>
      {error && (
        <div role="alert">
          <p>{error}</p>
          <Button
            type="button"
            disabled={loading}
            onClick={() => {
              requestBody.current = "";
              setQuote(null);
              setError("");
              setAttempt((value) => value + 1);
            }}
          >
            Refresh checkout total
          </Button>
        </div>
      )}
      <label>
        FULL NAME
        <Input required minLength={2} name="fullName" autoComplete="name" />
      </label>
      <label>
        DELIVERY COUNTRY
        <select
          value={countryCode}
          disabled={!countries.length || loading}
          onChange={(event) => setCountryCode(event.target.value)}
        >
          {countries.length === 0 ? (
            <option value="NG">Loading countries…</option>
          ) : (
            countries.map((country) => (
              <option value={country.code} key={country.code}>
                {country.name} ({country.dialCode})
              </option>
            ))
          )}
        </select>
      </label>
      <label>
        PHONE
        <Input
          required
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder={selectedCountry?.dialCode}
        />
      </label>
      <label>
        ADDRESS
        <Input
          required
          minLength={3}
          name="addressLine1"
          autoComplete="address-line1"
        />
      </label>
      <label>
        ADDRESS LINE 2 (OPTIONAL)
        <Input name="addressLine2" autoComplete="address-line2" />
      </label>
      <label>
        CITY
        <Input
          required
          minLength={2}
          name="city"
          autoComplete="address-level2"
        />
      </label>
      <label>
        STATE / REGION
        <Input
          required
          minLength={2}
          name="state"
          autoComplete="address-level1"
        />
      </label>
      <label>
        POSTAL CODE (OPTIONAL)
        <Input name="postalCode" autoComplete="postal-code" />
      </label>
      {quote ? (
        <div className="payment-note" aria-live="polite">
          <p>
            Total: USD {quote.total.toFixed(2)} · Shipping: USD{" "}
            {quote.shippingFee.toFixed(2)}
          </p>
          <p>
            Exchange rate: 1 USD = {quote.exchangeRate.toLocaleString()} NGN
          </p>
          <strong>
            Paystack will charge NGN{" "}
            {quote.chargeAmount.toLocaleString("en-NG", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </strong>
        </div>
      ) : (
        !error && <p role="status">Calculating your total…</p>
      )}
      <Button
        className="checkout-btn"
        disabled={loading || !quote || !selectedCountry}
      >
        {loading ? (
          <>
            <LoadingSpinner /> OPENING PAYMENT…
          </>
        ) : (
          "CONTINUE TO PAYSTACK"
        )}
      </Button>
    </form>
  );
}
