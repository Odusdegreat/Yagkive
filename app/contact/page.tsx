"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = encodeURIComponent(`Yagkive enquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    toast.success("Opening your email app to send your message.");
    window.location.href = `mailto:hello@yagkive.com?subject=${subject}&body=${body}`;
  }

  return <main className="contact-page">
    <header className="contact-header">
      <Link href="/" className="contact-brand"><Image src="/images/yags.png" alt="Yagkive — Shop. Discover. Enjoy." width={300} height={120} priority className="contact-logo-image" /></Link>
      <Button asChild variant="outline" className="contact-back"><Link href="/"><ArrowLeft size={15} /> BACK TO CATALOGUE</Link></Button>
    </header>
    <section className="contact-layout">
      <div className="contact-intro"><p className="eyebrow">CONTACT / OPEN CHANNEL</p><h1 className="font-display">LET’S<br />TALK.</h1><p>Questions about an item, your order, or the archive? Send us a message and we’ll get back to you.</p><a href="mailto:hello@yagkive.com"><Mail size={16} /> HELLO@YAGKIVE.COM</a></div>
      <form className="contact-form" onSubmit={submit}>
        <label>YOUR NAME<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" /></label>
        <label>EMAIL ADDRESS<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label>MESSAGE<textarea required value={message} onChange={(event) => setMessage(event.target.value)} placeholder="How can we help?" rows={6} /></label>
        <Button type="submit" className="btn-primary">SEND MESSAGE <Send size={15} /></Button>
        <p className="contact-note">Submitting opens your default email app with your message ready to send.</p>
      </form>
    </section>
  </main>;
}
