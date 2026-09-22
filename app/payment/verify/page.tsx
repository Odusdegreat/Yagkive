"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CheckCircle2, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import AuthDialog from "@/components/storefront/AuthDialog";
import type { VerifiedOrder } from "@/lib/api";
const ReceiptDownload = dynamic(
  () => import("@/components/storefront/ReceiptDownload"),
  { ssr: false },
);

function PaymentVerification() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");
  const [state, setState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Confirming your payment…");
  const [order, setOrder] = useState<VerifiedOrder | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (!reference) return;
    api
      .verifyPayment(reference)
      .then((verifiedOrder) => {
        if (cancelled) return;
        setOrder(verifiedOrder);
        setState("success");
        setNeedsAuth(false);
        setMessage(
          verifiedOrder.status === "payment_review"
            ? `Payment received for ${verifiedOrder.orderNumber}. Availability changed; please contact us to arrange fulfillment or a refund.`
            : `Payment confirmed for order ${verifiedOrder.orderNumber}.`,
        );
        sessionStorage.removeItem("yagkive-checkout");
      })
      .catch((error) => {
        if (cancelled) return;
        setState("error");
        setNeedsAuth(error instanceof ApiError && error.status === 401);
        setMessage(
          error instanceof Error
            ? error.message
            : "We could not verify this payment.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [reference, attempt]);
  const retry = () => {
    setState("loading");
    setMessage("Confirming your payment…");
    setAttempt((value) => value + 1);
  };
  return (
    <main className="payment-page">
      <section className="payment-card">
        {reference && state === "loading" && (
          <LoadingSpinner className="size-8" label="Verifying payment" />
        )}
        {state === "success" && (
          <CheckCircle2 className="size-10 text-green-400" />
        )}
        {(!reference || state === "error") && (
          <XCircle className="size-10 text-red-400" />
        )}
        <p className="eyebrow">PAYMENT STATUS</p>
        <h1 className="font-display">
          {!reference
            ? "MISSING REFERENCE"
            : state === "loading"
              ? "VERIFYING"
              : state === "success"
                ? "PAYMENT RECEIVED"
                : "VERIFICATION NEEDED"}
        </h1>
        <p role="status">
          {reference ? message : "No Paystack payment reference was provided."}
        </p>
        {state === "success" && order && order.status !== "payment_review" && (
          <ReceiptDownload order={order} />
        )}
        {state === "success" && order?.status === "payment_review" && (
          <Button asChild>
            <Link href="/contact">CONTACT SUPPORT</Link>
          </Button>
        )}
        {state === "error" && reference && (
          <Button onClick={needsAuth ? () => setAuthOpen(true) : retry}>
            {needsAuth ? "SIGN IN TO VERIFY" : "RETRY VERIFICATION"}
          </Button>
        )}
        {(!reference || state !== "loading") && (
          <Button asChild variant="outline">
            <Link href="/">RETURN TO CATALOGUE</Link>
          </Button>
        )}
        <AuthDialog
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onSubmit={async (mode, values) => {
            if (mode === "login")
              await api.login(values.email, values.password);
            else await api.register(values.name, values.email, values.password);
            retry();
          }}
        />
      </section>
    </main>
  );
}
export default function PaymentVerificationPage() {
  return (
    <Suspense
      fallback={
        <main className="payment-page">
          <LoadingSpinner className="size-8" label="Loading payment status" />
        </main>
      }
    >
      <PaymentVerification />
    </Suspense>
  );
}
