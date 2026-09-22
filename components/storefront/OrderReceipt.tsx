"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { VerifiedOrder } from "@/lib/api";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    color: "#0e1b2e",
    fontFamily: "Helvetica",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#ff5a1f",
    paddingBottom: 14,
    marginBottom: 20,
  },
  brand: { fontSize: 24, fontFamily: "Helvetica-Bold", letterSpacing: 2 },
  eyebrow: { color: "#c9491b", fontSize: 9, marginTop: 4 },
  title: { fontSize: 17, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  muted: { color: "#486172" },
  grid: { flexDirection: "row", gap: 16, marginBottom: 20 },
  column: { flexGrow: 1, flexBasis: 0 },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    marginBottom: 6,
    color: "#486172",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#d7e0e5",
  },
  itemName: { fontFamily: "Helvetica-Bold", maxWidth: "65%" },
  total: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: "#0e1b2e",
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#486172",
    fontSize: 8,
  },
});
const money = (amount: number) => `$${amount.toLocaleString("en-US")}`;

export default function OrderReceipt({ order }: { order: VerifiedOrder }) {
  const address = order.shippingAddress;
  return (
    <Document title={`Yagkive receipt ${order.orderNumber}`} author="Yagkive">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>YAGKIVE</Text>
          <Text style={styles.eyebrow}>
            TECHNICAL ARCHIVE — PAYMENT RECEIPT
          </Text>
        </View>
        <Text style={styles.title}>ORDER {order.orderNumber}</Text>
        <Text style={styles.muted}>
          Payment confirmed ·{" "}
          {new Date(order.createdAt).toLocaleDateString("en-US", {
            dateStyle: "long",
          })}
        </Text>
        <View style={styles.grid}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>DELIVER TO</Text>
            <Text>{address.fullName}</Text>
            <Text>{address.phone}</Text>
            <Text>{address.addressLine1}</Text>
            {address.addressLine2 && <Text>{address.addressLine2}</Text>}
            <Text>
              {address.city}, {address.state}
            </Text>
            <Text>{address.country}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>PAYMENT</Text>
            <Text>Status: Confirmed</Text>
            <Text>Currency: {order.currency}</Text>
          </View>
        </View>
        <Text style={styles.sectionTitle}>ITEMS</Text>
        {order.items.map((item, index) => (
          <View style={styles.row} key={`${item.name}-${index}`}>
            <Text style={styles.itemName}>
              {item.name} × {item.quantity}
            </Text>
            <Text>{money(item.price * item.quantity)}</Text>
          </View>
        ))}
        <View style={styles.total}>
          <Text>TOTAL PAID</Text>
          <Text>{money(order.total)}</Text>
        </View>
        <Text style={styles.footer}>
          Yagkive Archive Goods · Thank you for your order.
        </Text>
      </Page>
    </Document>
  );
}
