"use client";

import { ArrowUpRight, Minus, Plus, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "../ui/sheet";
import type { CartItem } from "../../lib/products";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

export default function CartDrawer({
  open,
  onClose,
  items,
  onQty,
  onRemove,
}: CartDrawerProps) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="gap-0 border-l p-0"
        showCloseButton={false}
      >
        <SheetTitle className="sr-only">Your Archive</SheetTitle>

        <div className="drawer-head">
          <span className="eyebrow">YOUR ARCHIVE ({items.length})</span>
          <SheetClose asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="Close cart">
              <X size={18} />
            </Button>
          </SheetClose>
        </div>

        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={28} strokeWidth={1.2} />
              <p>Your archive is empty.</p>
              <span>Items you add will be catalogued here.</span>
            </div>
          ) : (
            items.map((item) => (
              <div className="drawer-item" key={item.id}>
                <div className="drawer-thumb">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="52px"
                    className="drawer-image"
                  />
                </div>
                <div className="drawer-info">
                  <div className="drawer-row">
                    <span className="drawer-name">{item.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="remove-btn size-6"
                      onClick={() => onRemove(item.id)}
                      aria-label={`Remove ${item.name}`}
                    >
                      <X size={13} />
                    </Button>
                  </div>
                  <span className="drawer-ref">{item.ref}</span>
                  <div className="drawer-row">
                    <div className="qty-stepper">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onQty(item.id, -1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </Button>
                      <span>{item.qty}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onQty(item.id, 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </Button>
                    </div>
                    <span className="drawer-price">${item.price * item.qty}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="drawer-foot">
            <div className="subtotal-row">
              <span>SUBTOTAL</span>
              <span>${subtotal}</span>
            </div>
            <Button type="button" className="checkout-btn">
              CHECKOUT <ArrowUpRight size={16} />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
