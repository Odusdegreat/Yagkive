"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import OrderReceipt from "@/components/storefront/OrderReceipt";
import type { VerifiedOrder } from "@/lib/api";
import { PDFDownloadLink } from "@react-pdf/renderer";

function PaymentVerification() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Confirming your payment…");
  const [order, setOrder] = useState<VerifiedOrder | null>(null);

  useEffect(() => {
    const reference = searchParams.get("reference") ?? searchParams.get("trxref");
    if (!reference) { setState("error"); setMessage("No Paystack payment reference was provided."); return; }
    void api.verifyPayment(reference).then((verifiedOrder) => { setOrder(verifiedOrder); setState("success"); setMessage(`Payment confirmed for order ${verifiedOrder.orderNumber}.`); }).catch((error) => { setState("error"); setMessage(error instanceof Error ? error.message : "We could not verify this payment."); });
  }, [searchParams]);

  return <main className="payment-page"><section className="payment-card">{state === "loading" && <LoadingSpinner className="size-8" label="Verifying payment" />}{state === "success" && <CheckCircle2 className="size-10 text-green-400" />}{state === "error" && <XCircle className="size-10 text-red-400" />}<p className="eyebrow">PAYMENT STATUS</p><h1 className="font-display">{state === "loading" ? "VERIFYING" : state === "success" ? "PAYMENT CONFIRMED" : "VERIFICATION NEEDED"}</h1><p>{message}</p>{state === "success" && order && <PDFDownloadLink document={<OrderReceipt order={order} />} fileName={`yagkive-${order.orderNumber}.pdf`}>{({ loading }) => <Button className="checkout-btn" disabled={loading}>{loading ? <><LoadingSpinner /> PREPARING RECEIPT…</> : "DOWNLOAD PDF RECEIPT"}</Button>}</PDFDownloadLink>}{state !== "loading" && <Button asChild variant="outline"><Link href="/">RETURN TO CATALOGUE</Link></Button>}</section></main>;
}

export default function PaymentVerificationPage() {
  return <Suspense fallback={<main className="payment-page"><LoadingSpinner className="size-8" label="Loading payment status" /></main>}><PaymentVerification /></Suspense>;
}
