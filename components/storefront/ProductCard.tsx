"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Check, Heart, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CornerBrackets from "./CornerBrackets";
import type { Product } from "@/lib/products";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product, size?: string, color?: string) => Promise<boolean>;
  wishlisted: boolean;
  onToggleWish: (id: string) => void;
}

export default function ProductCard({
  product,
  onAdd,
  wishlisted,
  onToggleWish,
}: ProductCardProps) {
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const unavailable =
    product.stock === 0 ||
    (!!product.sizes?.length && !size) ||
    (!!product.colors?.length && !color);
  const [justAdded, setJustAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  const handleAdd = async () => {
    setAdding(true);
    let added = false;
    try {
      added = await onAdd(product, size || undefined, color || undefined);
    } finally {
      setAdding(false);
    }
    if (!added) return;
    setJustAdded(true);
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <Card className="card group gap-0 ring-0" size="sm">
      <CornerBrackets />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("wish-btn", wishlisted && "wish-on")}
            onClick={() => onToggleWish(product.id)}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wishlisted}
          >
            <Heart
              size={15}
              strokeWidth={2}
              fill={wishlisted ? "currentColor" : "none"}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {wishlisted ? "Remove from wishlist" : "Save to wishlist"}
        </TooltipContent>
      </Tooltip>

      <div className="card-art">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, 340px"
          className="card-image"
        />
        <span className="ref-tag">{product.ref}</span>
      </div>

      <CardContent className="card-body p-0">
        <div className="card-row">
          <h3 className="card-name">{product.name}</h3>
          <span className="card-price">${product.price.toLocaleString()}</span>
        </div>
        <p className="card-note">{product.note}</p>
        {!!product.sizes?.length && (
          <label className="variant-picker">
            Size
            <select
              aria-label={"Size for " + product.name}
              value={size}
              onChange={(event) => setSize(event.target.value)}
            >
              <option value="">Select size</option>
              {product.sizes.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        )}
        {!!product.colors?.length && (
          <label className="variant-picker">
            Color
            <select
              aria-label={"Color for " + product.name}
              value={color}
              onChange={(event) => setColor(event.target.value)}
            >
              <option value="">Select color</option>
              {product.colors.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        )}
        {product.stock === 0 && <p role="status">Sold out</p>}
      </CardContent>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn("add-bar", justAdded && "add-bar-done")}
            onClick={handleAdd}
            disabled={adding || unavailable}
            aria-label={`Add ${product.name} to cart`}
          >
            {adding ? (
              <>
                <LoadingSpinner /> ADDING
              </>
            ) : justAdded ? (
              <>
                <Check size={15} /> ADDED
              </>
            ) : (
              <>
                <Plus size={15} /> ADD TO CART
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Add {product.name} to cart</TooltipContent>
      </Tooltip>
    </Card>
  );
}
