"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Check, Heart, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CornerBrackets from "./CornerBrackets";
import type { Product } from "@/lib/products";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  wishlisted: boolean;
  onToggleWish: (id: string) => void;
}

export default function ProductCard({
  product,
  onAdd,
  wishlisted,
  onToggleWish,
}: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  const handleAdd = () => {
    onAdd(product);
    setJustAdded(true);
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <Card className="card group gap-0 ring-0" size="sm">
      <CornerBrackets />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("wish-btn", wishlisted && "wish-on")}
        onClick={() => onToggleWish(product.id)}
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={wishlisted}
      >
        <Heart size={15} strokeWidth={2} fill={wishlisted ? "currentColor" : "none"} />
      </Button>

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
          <span className="card-price">${product.price}</span>
        </div>
        <p className="card-note">{product.note}</p>
      </CardContent>

      <Button
        type="button"
        variant="outline"
        className={cn("add-bar", justAdded && "add-bar-done")}
        onClick={handleAdd}
        aria-label={`Add ${product.name} to cart`}
      >
        {justAdded ? (
          <>
            <Check size={15} /> ADDED
          </>
        ) : (
          <>
            <Plus size={15} /> ADD TO CART
          </>
        )}
      </Button>
    </Card>
  );
}
