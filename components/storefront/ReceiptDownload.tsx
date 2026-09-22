"use client";
import { PDFDownloadLink } from "@react-pdf/renderer";
import type { VerifiedOrder } from "@/lib/api";
import OrderReceipt from "./OrderReceipt";

export default function ReceiptDownload({ order }: { order: VerifiedOrder }) {
  return (
    <PDFDownloadLink
      className="checkout-btn"
      document={<OrderReceipt order={order} />}
      fileName={`yagkive-${order.orderNumber}.pdf`}
    >
      {({ loading, error }) =>
        error
          ? "Receipt unavailable. Please reload to retry."
          : loading
            ? "PREPARING RECEIPT…"
            : "DOWNLOAD PDF RECEIPT"
      }
    </PDFDownloadLink>
  );
}
