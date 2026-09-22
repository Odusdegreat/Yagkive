"use client";

import { ArrowUpRight, Minus, Plus, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTitle } from "../ui/sheet";
import type { ApiCartItem } from "../../lib/api";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: ApiCartItem[];
  onQty: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  open,
  onClose,
  items,
  onQty,
  onRemove, onCheckout,
}: CartDrawerProps) {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-[90vw] max-w-[400px] gap-0 border-l p-0 sm:w-96"
        showCloseButton={false}
      >
        <SheetTitle className="sr-only">Your Archive</SheetTitle>

        <div className="drawer-head">
          <span className="eyebrow">YOUR ARCHIVE ({items.length})</span>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label="Close cart" onClick={onClose}><X size={18} /></Button></TooltipTrigger><TooltipContent>Close cart</TooltipContent></Tooltip>
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
              <div className="drawer-item" key={item._id}>
                <div className="drawer-thumb">
                  <Image
                    src={item.product.images[0]?.url ?? "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=300&auto=format&fit=crop"}
                    alt={item.product.name}
                    fill
                    sizes="52px"
                    className="drawer-image"
                  />
                </div>
                <div className="drawer-info">
                  <div className="drawer-row">
                    <span className="drawer-name">{item.product.name}</span>
                    <Tooltip><TooltipTrigger asChild><Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="remove-btn size-6"
                      onClick={() => onRemove(item._id)}
                      aria-label={`Remove ${item.product.name}`}
                    >
                      <X size={13} />
                    </Button></TooltipTrigger><TooltipContent>Remove item</TooltipContent></Tooltip>
                  </div>
                  <span className="drawer-ref">{item.product.ref}</span>
                  <div className="drawer-row">
                    <div className="qty-stepper">
                      <Tooltip><TooltipTrigger asChild><Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onQty(item._id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </Button></TooltipTrigger><TooltipContent>Decrease quantity</TooltipContent></Tooltip>
                      <span>{item.quantity}</span>
                      <Tooltip><TooltipTrigger asChild><Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onQty(item._id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </Button></TooltipTrigger><TooltipContent>Increase quantity</TooltipContent></Tooltip>
                    </div>
                    <span className="drawer-price">${(item.product.price * item.quantity).toLocaleString()}</span>
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
              <span>${subtotal.toLocaleString()}</span>
            </div>
            <Button type="button" className="checkout-btn" onClick={onCheckout}>
              CHECKOUT <ArrowUpRight size={16} />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
