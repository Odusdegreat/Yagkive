import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

interface ReceiptItem {
  name?: string | null;
  price?: number | null;
  quantity?: number | null;
}
interface ReceiptAddress {
  fullName?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}
export interface ReceiptOrder {
  orderNumber: string;
  total?: number | null;
  currency?: string | null;
  createdAt?: Date | null;
  items: ReceiptItem[];
  shippingAddress?: ReceiptAddress | null;
}

const styles = StyleSheet.create({
  page: { padding: 42, fontSize: 10, color: "#0e1b2e" },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#ff5a1f",
    paddingBottom: 14,
    marginBottom: 22,
  },
  brand: { fontSize: 24, fontFamily: "Helvetica-Bold", letterSpacing: 2 },
  eyebrow: { marginTop: 4, color: "#c9491b", fontSize: 9 },
  heading: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 5 },
  muted: { color: "#486172", marginBottom: 20 },
  section: { marginBottom: 18 },
  label: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#486172",
    marginBottom: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#d7e0e5",
  },
  total: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#0e1b2e",
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 42,
    right: 42,
    textAlign: "center",
    color: "#486172",
    fontSize: 8,
  },
});
const money = (amount: number) => `$${amount.toLocaleString("en-US")}`;

export async function generateReceiptPdf(order: ReceiptOrder): Promise<Buffer> {
  const address = order.shippingAddress ?? {};
  const document = React.createElement(
    Document,
    { title: `Yagkive receipt ${order.orderNumber}`, author: "Yagkive" },
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.brand }, "YAGKIVE"),
        React.createElement(
          Text,
          { style: styles.eyebrow },
          "TECHNICAL ARCHIVE — PAYMENT RECEIPT",
        ),
      ),
      React.createElement(
        Text,
        { style: styles.heading },
        `ORDER ${order.orderNumber}`,
      ),
      React.createElement(
        Text,
        { style: styles.muted },
        `Payment confirmed · ${(order.createdAt ?? new Date()).toLocaleDateString("en-NG", { dateStyle: "long" })}`,
      ),
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.label }, "DELIVERY DETAILS"),
        React.createElement(Text, null, address.fullName ?? ""),
        React.createElement(Text, null, address.phone ?? ""),
        React.createElement(Text, null, address.addressLine1 ?? ""),
        address.addressLine2
          ? React.createElement(Text, null, address.addressLine2)
          : null,
        React.createElement(
          Text,
          null,
          [address.city, address.state].filter(Boolean).join(", "),
        ),
        React.createElement(Text, null, address.country ?? ""),
      ),
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.label }, "ITEMS"),
        ...order.items.map((item, index) =>
          React.createElement(
            View,
            { style: styles.row, key: `${item.name ?? "item"}-${index}` },
            React.createElement(
              Text,
              null,
              `${item.name ?? "Item"} × ${item.quantity ?? 0}`,
            ),
            React.createElement(
              Text,
              null,
              money((item.price ?? 0) * (item.quantity ?? 0)),
            ),
          ),
        ),
      ),
      React.createElement(
        View,
        { style: styles.total },
        React.createElement(Text, null, "TOTAL PAID"),
        React.createElement(Text, null, money(order.total ?? 0)),
      ),
      React.createElement(
        Text,
        { style: styles.footer },
        "Yagkive Archive Goods · Thank you for your order.",
      ),
    ),
  );
  return Buffer.from(await renderToBuffer(document));
}
