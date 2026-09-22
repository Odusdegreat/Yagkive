"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Heart, LogOut, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
// Simple classnames utility to avoid depending on external utils file
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
import { CATEGORIES, PRODUCTS } from "../../lib/products";
import type { Filter, Product } from "../../lib/products";
import { api } from "../../lib/api";
import type { ApiCartItem, ApiProduct, SessionUser } from "../../lib/api";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import Marquee from "./Marquee";
import CornerBrackets from "./CornerBrackets";
import ProductCard from "./ProductCard";
import CartDrawer from "./CartDrawer";
import AuthDialog from "./AuthDialog";
import CheckoutDialog from "./CheckoutDialog";

export default function Storefront() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<Filter>("All");
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [cart, setCart] = useState<ApiCartItem[]>([]);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [badgePulse, setBadgePulse] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [wishlistOnly, setWishlistOnly] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const heroProduct = products[0];
  const heroVisible = query.trim() === "" && !wishlistOnly;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (active !== "All" && p.category !== active) return false;
      if (wishlistOnly && !wishlist.has(p.id)) return false;
      if (q) {
        const hay = `${p.name} ${p.ref} ${p.note} ${p.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [active, products, query, wishlistOnly, wishlist]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const toDisplayProduct = (product: ApiProduct): Product => ({ id: product._id, ref: product.ref, name: product.name, category: (product.category?.name ?? "Accessories") as Product["category"], price: product.price, note: product.note || product.description || "Archive issue", icon: "jacket", image: product.images[0]?.url ?? "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=800&auto=format&fit=crop" });
  const loadCustomerData = async () => { const [serverCart, serverWishlist] = await Promise.all([api.cart(), api.wishlist()]); setCart(serverCart.items); setWishlist(new Set(serverWishlist.map((product) => product._id))); };

  useEffect(() => { void api.products().then(({ products: apiProducts }) => { if (apiProducts.length > 0) setProducts(apiProducts.map(toDisplayProduct)); }).catch(() => toast.error("Catalogue API is unavailable; previewing the local catalogue.")); void api.session().then(async ({ user: sessionUser }) => { setUser(sessionUser); await loadCustomerData(); }).catch(() => undefined); }, []);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.12, rootMargin: "0px 0px -48px" },
    );
    root.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [filtered.length, heroVisible]);

  const addToCart = async (product: Product): Promise<boolean> => {
    if (!user) { setAuthOpen(true); return false; }
    if (!/^[a-f\d]{24}$/i.test(product.id)) { toast.error("This is a catalogue preview. Add the products to MongoDB before adding them to your cart."); return false; }
    try { const data = await api.addCartItem(product.id); setCart(data.items); setBadgePulse(true); window.setTimeout(() => setBadgePulse(false), 500); toast.success("Added to your archive"); return true; }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to add the item"); return false; }
  };

  const changeQty = async (id: string, quantity: number) => { try { if (quantity < 1) { const data = await api.removeCartItem(id); setCart(data.items); } else { const data = await api.updateCartItem(id, quantity); setCart(data.items); } } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update cart"); } };

  const removeItem = async (id: string) => { try { const data = await api.removeCartItem(id); setCart(data.items); toast.success("Item removed from archive"); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to remove item"); } };

  const toggleWish = async (id: string) => { if (!user) { setAuthOpen(true); return; } if (!/^[a-f\d]{24}$/i.test(id)) { toast.error("This is a catalogue preview. Add the products to MongoDB before saving them."); return; } try { const data = await api.toggleWishlist(id); setWishlist((previous) => { const next = new Set(previous); data.wishlisted ? next.add(id) : next.delete(id); return next; }); toast.success(data.wishlisted ? "Saved to wishlist" : "Removed from wishlist"); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update wishlist"); } };
  const submitAuth = async (mode: "login" | "register", values: { name: string; email: string; password: string }) => { const data = mode === "login" ? await api.login(values.email, values.password) : await api.register(values.name, values.email, values.password); setUser(data.user); await loadCustomerData(); toast.success(`Welcome, ${data.user.name}.`); };
  const logout = async () => { try { await api.logout(); setUser(null); setCart([]); setWishlist(new Set()); toast.success("Signed out."); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to sign out"); } };
  const checkout = async (shippingAddress: Record<string, string>) => { const { payment } = await api.checkout(shippingAddress); window.location.assign(payment.authorization_url); };

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
    <div className="page" ref={pageRef}>
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
          <Image
            src="/images/yags.png"
            alt="Yagkive — Shop. Discover. Enjoy."
            width={300}
            height={120}
            priority
            className="logo-image"
          />
        </div>
        <nav className="nav-links">
          <a href="#catalogue" onClick={(e) => { e.preventDefault(); scrollToGrid(); }}>CATALOGUE</a>
          <Link href="/about">ABOUT</Link>
          <Link href="/contact">CONTACT</Link>
        </nav>
        <div className="header-icons">
          <Tooltip><TooltipTrigger asChild><Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("icon-btn", searchOpen && "icon-active")}
            aria-label="Search"
            aria-pressed={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search size={18} />
          </Button></TooltipTrigger><TooltipContent>Search catalogue</TooltipContent></Tooltip>
          {user ? (
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="icon-btn" aria-label="Sign out" onClick={() => void logout()}><LogOut size={18} /></Button></TooltipTrigger><TooltipContent>Sign out</TooltipContent></Tooltip>
          ) : (
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="icon-btn" aria-label="Sign in or create an account" onClick={() => setAuthOpen(true)}><UserRound size={18} /></Button></TooltipTrigger><TooltipContent>Sign in or create an account</TooltipContent></Tooltip>
          )}
          <Tooltip><TooltipTrigger asChild><Button
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
          </Button></TooltipTrigger><TooltipContent>{wishlistOnly ? "Show all products" : "View wishlist"}</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button
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
          </Button></TooltipTrigger><TooltipContent>Open cart</TooltipContent></Tooltip>
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
        <section className="hero reveal">
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
            <Button asChild variant="outline" className="btn-ghost"><Link href="/lookbook">VIEW LOOKBOOK</Link></Button>
          </div>
          <div className="spec-list">
            <div className="spec-item"><span>PIECES</span><span>{String(products.length).padStart(2, "0")}</span></div>
            <div className="spec-item"><span>RUN</span><span>LTD.</span></div>
            <div className="spec-item"><span>SHIPS</span><span>WORLDWIDE</span></div>
          </div>
        </div>
        <div className="hero-right" aria-label="Featured archive piece">
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
          <span className="hero-crosshair" aria-hidden="true" />
          <span className="hero-index" aria-hidden="true">04 / 24</span>
        </div>
        </div>
        </section>
      )}

      <div className="filters reveal">
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
            <div className="product-reveal reveal" key={p.id} style={{ "--reveal-delay": `${Math.min(idx, 8) * 65}ms` } as React.CSSProperties}>
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
        onCheckout={() => { if (!user) setAuthOpen(true); else setCheckoutOpen(true); }}
      />
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} onSubmit={submitAuth} />
      <CheckoutDialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} onCheckout={checkout} />
    </div>
  );
}
