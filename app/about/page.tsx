import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Compass, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const principles = [
  { icon: Compass, number: "01", title: "DISCOVER", text: "We look beyond the obvious for functional pieces, considered details, and references worth keeping." },
  { icon: ShieldCheck, number: "02", title: "CURATE", text: "Every release is edited with intention — a focused catalogue over an endless feed." },
  { icon: Sparkles, number: "03", title: "ENJOY", text: "Good design should work hard, travel well, and feel right long after the first wear." },
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <header className="about-header">
        <Link href="/" className="about-brand">
          <Image src="/images/yags.png" alt="Yagkive — Shop. Discover. Enjoy." width={300} height={120} priority className="about-logo-image" />
        </Link>
        <Button asChild variant="outline" className="about-back">
          <Link href="/"><ArrowLeft size={15} /> BACK TO CATALOGUE</Link>
        </Button>
      </header>

      <section className="about-hero">
        <p className="eyebrow">ABOUT YAGKIVE / EST. 04</p>
        <h1 className="font-display">BUILT FOR<br />WHAT’S NEXT.</h1>
        <p className="about-lede">Yagkive is a living archive of useful objects and technical staples — collected for people who move with purpose.</p>
      </section>

      <section className="about-statement">
        <div><p className="eyebrow">THE ARCHIVE</p><span>01 — 03</span></div>
        <p>We believe the best everyday pieces balance utility, restraint, and character. Our catalogue is a record of those finds: gear that earns its place, silhouettes that outlast a season, and details that reward a closer look.</p>
      </section>

      <section className="about-message">
        <p className="eyebrow">A MESSAGE FROM YAGKIVE</p>
        <div>
          <h2 className="font-display">KEEP WHAT<br />MATTERS CLOSE.</h2>
          <p>Thanks for being here. Yagkive was made for curious people: the ones who notice the construction, ask where something came from, and choose pieces they will return to again and again.</p>
          <p>Whether you are discovering your first entry or adding to a collection, we are glad you found the archive.</p>
          <span>— THE YAGKIVE TEAM</span>
        </div>
      </section>

      <section className="about-images" aria-label="Yagkive archive selections">
        <div className="about-image about-image-large">
          <Image src="https://images.unsplash.com/photo-1544441893-675973e31985?q=85&w=1400&auto=format&fit=crop" alt="Technical outerwear from the Yagkive archive" fill sizes="(max-width: 640px) 100vw, 64vw" />
          <span>FIELD REFERENCE / OUTER LAYER</span>
        </div>
        <div className="about-image about-image-small">
          <Image src="https://images.unsplash.com/photo-1558002038-1055907df827?q=85&w=1000&auto=format&fit=crop" alt="Footwear from the Yagkive archive" fill sizes="(max-width: 640px) 100vw, 36vw" />
          <span>FIELD REFERENCE / FOOTWEAR</span>
        </div>
      </section>

      <section className="about-principles">
        {principles.map(({ icon: Icon, number, title, text }) => (
          <article key={number} className="about-principle">
            <div className="about-principle-top"><span>{number}</span><Icon size={20} strokeWidth={1.5} /></div>
            <h2 className="font-display">{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="about-cta">
        <p className="eyebrow">THE NEXT ENTRY IS WAITING</p>
        <h2 className="font-display">FIND YOUR<br />NEXT ISSUE.</h2>
        <Button asChild className="btn-primary"><Link href="/#catalogue">SHOP THE CATALOGUE <ArrowUpRight size={15} /></Link></Button>
      </section>
    </main>
  );
}
