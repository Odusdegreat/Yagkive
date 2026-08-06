"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Heart, Search, ShoppingBag, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
// Simple classnames utility to avoid depending on external utils file
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
import { CATEGORIES, PRODUCTS } from "../../lib/products";
import type { CartItem, Filter, Product } from "../../lib/products";
import Marquee from "./Marquee";
import CornerBrackets from "./CornerBrackets";
import ProductCard from "./ProductCard";
import CartDrawer from "./CartDrawer";

export default function Storefront() {
  const [active, setActive] = useState<Filter>("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [badgePulse, setBadgePulse] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [wishlistOnly, setWishlistOnly] = useState(false);

  const heroProduct = PRODUCTS[0];
  const heroVisible = query.trim() === "" && !wishlistOnly;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      if (active !== "All" && p.category !== active) return false;
      if (wishlistOnly && !wishlist.has(p.id)) return false;
      if (q) {
        const hay = `${p.name} ${p.ref} ${p.note} ${p.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [active, query, wishlistOnly, wishlist]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const found = prev.find((i) => i.id === product.id);
      if (found) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setBadgePulse(true);
    window.setTimeout(() => setBadgePulse(false), 500);
  };

  const changeQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i))
        .filter(Boolean)
    );
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));

  const toggleWish = (id: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const gridRef = useRef<HTMLDivElement | null>(null);
  const scrollToGrid = () => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const resetHome = () => {
    setQuery("");
    setSearchOpen(false);
    setWishlistOnly(false);
    setActive("All");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="page">
      <div className="blueprint-grid" aria-hidden="true" />

      <header className="header">
        <div
          className="logo"
          role="button"
          tabIndex={0}
          aria-label="Back to top"
          onClick={resetHome}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              resetHome();
            }
          }}
        >
          <span className="logo-mark font-display">YAGKIVE</span>
          <span className="logo-sub">TECHNICAL ARCHIVE — EST. 04</span>
        </div>
        <nav className="nav-links">
          <a href="#catalogue" onClick={(e) => { e.preventDefault(); scrollToGrid(); }}>CATALOGUE</a>
          <a href="#about">ABOUT</a>
          <a href="#contact">CONTACT</a>
        </nav>
        <div className="header-icons">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("icon-btn", searchOpen && "icon-active")}
            aria-label="Search"
            aria-pressed={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search size={18} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("icon-btn wishlist-btn", wishlistOnly && "icon-active")}
            aria-label={wishlistOnly ? "Show all items" : "Show wishlist"}
            aria-pressed={wishlistOnly}
            onClick={() => setWishlistOnly((v) => !v)}
          >
            <Heart size={18} />
            {wishlist.size > 0 && (
              <Badge className={`cart-badge ${wishlistOnly ? "cart-badge-pulse" : ""}`}>
                {wishlist.size}
              </Badge>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="icon-btn cart-btn"
            aria-label="Open cart"
            onClick={() => setDrawerOpen(true)}
          >
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <Badge className={`cart-badge ${badgePulse ? "cart-badge-pulse" : ""}`}>
                {cartCount}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      {searchOpen && (
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SEARCH CATALOGUE — NAME, REF, SPEC..."
            aria-label="Search catalogue"
            autoFocus
            className="search-input"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="search-clear"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X size={16} />
            </Button>
          )}
        </div>
      )}

      <Marquee />

      {heroVisible && (
        <section className="hero">
          <div className="hero-left">
          <span className="hero-tag">
            <span className="dot" /> CATALOGUE 04 — NOW OPEN
          </span>
          <h1 className="hero-title font-display">
            FIELD-TESTED.
            <br />
            ARCHIVE-GRADE.
          </h1>
          <p className="hero-desc">
            Every piece catalogued, specced, and issued in limited run. Utility
            garments built from the same source patterns as the originals —
            nothing decorative, everything load-bearing.
          </p>
          <div className="hero-ctas">
            <Button type="button" className="btn-primary" onClick={scrollToGrid}>
              BROWSE CATALOGUE <ArrowUpRight size={15} />
            </Button>
            <Button type="button" variant="outline" className="btn-ghost">
              VIEW LOOKBOOK
            </Button>
          </div>
          <div className="spec-list">
            <div className="spec-item"><span>PIECES</span><span>{String(PRODUCTS.length).padStart(2, "0")}</span></div>
            <div className="spec-item"><span>RUN</span><span>LTD.</span></div>
            <div className="spec-item"><span>SHIPS</span><span>WORLDWIDE</span></div>
          </div>
        </div>
        <div className="hero-right">
          <div
            className="hero-frame"
            role="button"
            tabIndex={0}
            aria-label="Browse catalogue"
            onClick={scrollToGrid}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                scrollToGrid();
              }
            }}
          >
          <CornerBrackets />
          <Image
            src={heroProduct.image}
            alt={heroProduct.name}
            fill
            priority
            sizes="(max-width: 860px) 92vw, 340px"
            className="hero-image"
          />
          <span className="ref-tag" style={{ position: "absolute" }}>REF.014-A</span>
        </div>
        </div>
        </section>
      )}

      <div className="filters">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            type="button"
            variant="outline"
            size="sm"
            className={cn("pill", active === cat && "pill-active")}
            onClick={() => setActive(cat)}
          >
            {cat.toUpperCase()}
          </Button>
        ))}
      </div>

      <section className="grid" ref={gridRef} id="catalogue">
        {filtered.length === 0 ? (
          <div className="grid-empty">
            <p>NO MATCHING RECORDS.</p>
            <span>
              {wishlistOnly
                ? "Nothing wishlisted here yet. Tap the heart on a piece to archive it."
                : "Try a different keyword or category."}
            </span>
          </div>
        ) : (
          filtered.map((p, idx) => (
            <div key={p.id} style={{ animationDelay: `${idx * 60}ms` }}>
              <ProductCard
                product={p}
                onAdd={addToCart}
                wishlisted={wishlist.has(p.id)}
                onToggleWish={toggleWish}
              />
            </div>
          ))
        )}
      </section>

      <footer className="footer">
        <p>© {new Date().getFullYear()} YAGKIVE ARCHIVE GOODS. ALL SPECS FINAL.</p>
        <p>DISPATCHED FROM CATALOGUE 04</p>
      </footer>

      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={cart}
        onQty={changeQty}
        onRemove={removeItem}
      />
    </div>
  );
}
