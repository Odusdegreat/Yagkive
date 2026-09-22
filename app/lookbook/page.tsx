"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api";
import type { ApiProduct } from "@/lib/api";
import { PRODUCTS } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface LookbookItem { id: string; name: string; ref: string; note: string; price: number; image: string; category: string; }
const fallbackItems: LookbookItem[] = PRODUCTS.map((product) => ({ id: product.id, name: product.name, ref: product.ref, note: product.note, price: product.price, image: product.image, category: product.category }));
const toLookbookItem = (product: ApiProduct): LookbookItem => ({ id: product._id, name: product.name, ref: product.ref, note: product.note || product.description, price: product.price, image: product.images[0]?.url ?? fallbackItems[0].image, category: product.category?.name ?? "Archive" });

export default function LookbookPage() {
  const [items, setItems] = useState<LookbookItem[]>(fallbackItems);
  const [loading, setLoading] = useState(true);
  useEffect(() => { void api.products().then(({ products }) => { if (products.length) setItems(products.map(toLookbookItem)); }).catch(() => undefined).finally(() => setLoading(false)); }, []);
  const feature = items[0];
  return <main className="lookbook-page"><header className="lookbook-header"><Link href="/" className="lookbook-brand"><Image src="/images/yags.png" alt="Yagkive — Shop. Discover. Enjoy." width={300} height={120} priority className="lookbook-logo-image" /></Link><Button asChild variant="outline" className="lookbook-back"><Link href="/"><ArrowLeft size={15} /> BACK TO CATALOGUE</Link></Button></header><section className="lookbook-intro"><p className="eyebrow">CATALOGUE 04 / FIELD SERIES</p><h1 className="font-display">ISSUED FOR<br />THE FIELD.</h1><p>Technical pieces documented in motion, built for daily use and repeated wear. Every reference is part of the archive.</p></section>{loading ? <div className="lookbook-loading"><LoadingSpinner className="size-7" label="Loading lookbook" /></div> : <><section className="lookbook-feature"><div className="lookbook-feature-image"><Image src={feature.image} alt={feature.name} fill priority loading="eager" sizes="(max-width: 760px) 100vw, 58vw" className="lookbook-image" /></div><div className="lookbook-feature-copy"><p className="eyebrow">FEATURED ISSUE / {feature.ref}</p><h2 className="font-display">{feature.name}</h2><p>{feature.note}</p><span>${feature.price.toLocaleString()}</span><Button asChild className="btn-primary"><Link href="/#catalogue">SHOP THE CATALOGUE <ArrowUpRight size={15} /></Link></Button></div></section><section className="lookbook-grid">{items.slice(1).map((item, index) => <article className={`lookbook-entry lookbook-entry-${index % 3}`} key={item.id}><div className="lookbook-entry-image"><Image src={item.image} alt={item.name} fill sizes="(max-width: 640px) 100vw, 50vw" className="lookbook-image" /></div><div className="lookbook-entry-copy"><span>{String(index + 2).padStart(2, "0")} / {item.category}</span><h2 className="font-display">{item.name}</h2><p>{item.ref} · ${item.price.toLocaleString()}</p></div></article>)}</section></>}</main>;
}
