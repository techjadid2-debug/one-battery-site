"use client";

import { useEffect, useState } from "react";

type Locale = "uz" | "en";

const copy = {
  uz: {
    nav: ["O‘yin", "Robotlar", "Kampaniya", "Media"],
    eyebrow: "ORBITAL AES // EVAKUATSIYA PROTOKOLI 01",
    lead: "Ikki robot. Bitta yadro. Hech kim tashlab ketilmaydi.",
    body: "AES portlashidan keyin Piko va Atlas yagona energiya yadrosini navbat bilan ishlatib, radiatsiya ularni ishdan chiqarmasidan oldin evakuatsiya kapsulasiga yetishi kerak.",
    play: "BEPUL O‘YNASH",
    trailer: "TRAILERNI KO‘RISH",
    status: "WEBDA BEPUL • 10 LEVEL • ≈90 DAQIQA",
    rule: "Bitta qoida. O‘nlab qaror.",
    ruleBody: "Bir vaqtda faqat yadroni ko‘targan robot harakatlanadi. O‘chgan robot esa og‘irligi, joylashuvi va do‘stligi bilan puzzle’ning bir qismi bo‘lib qoladi.",
    question: "Hozir energiya kimda bo‘lishi kerak?",
    robots: "Ikki xil kuch. Bitta umumiy maqsad.",
    piko: "Chaqqon, baland sakraydi va servis tunnellari hamda nozik terminallarga kira oladi.",
    atlas: "Og‘ir yuklarni suradi, katta mexanizmlarni ushlab turadi va Piko uchun yo‘l yaratadi.",
    campaign: "AES ichida 10 sektor",
    campaignBody: "Har sektor bitta yangi fikrni o‘rgatadi, keyin uni oldingi mexanikalar bilan birlashtiradi.",
    media: "Reaktor ichidan signal",
    cta: "Yadroni oling. Do‘stingizni toping. Birga chiqing.",
    ctaBody: "ONE CORE klaviatura, gamepad va mobil touch boshqaruvda ishlaydi.",
    footer: "Mustaqil sci-fi puzzle tajribasi. Uzbek va English tillarida.",
  },
  en: {
    nav: ["Game", "Robots", "Campaign", "Media"],
    eyebrow: "ORBITAL NUCLEAR FACILITY // EVAC PROTOCOL 01",
    lead: "Two robots. One core. No one gets left behind.",
    body: "After a nuclear facility rupture, Piko and Atlas must share a single energy core and reach the evacuation capsule before radiation disables them for good.",
    play: "PLAY FREE",
    trailer: "WATCH TRAILER",
    status: "FREE ON WEB • 10 LEVELS • ≈90 MINUTES",
    rule: "One rule. Dozens of decisions.",
    ruleBody: "Only the robot carrying the core can move. The unpowered robot remains part of the puzzle through its weight, position, and bond with its friend.",
    question: "Who needs the energy right now?",
    robots: "Two different strengths. One shared goal.",
    piko: "Agile, high-jumping, and small enough for service tunnels and precision terminals.",
    atlas: "Moves heavy cargo, holds industrial mechanisms, and creates a path for Piko.",
    campaign: "10 sectors inside the facility",
    campaignBody: "Each sector teaches one new idea, then combines it with every rule you already know.",
    media: "Signal from inside the reactor",
    cta: "Take the core. Find your friend. Get out together.",
    ctaBody: "ONE CORE supports keyboard, gamepad, and mobile touch controls.",
    footer: "An independent sci-fi puzzle experience. Available in Uzbek and English.",
  },
};

const sectors = [
  "Reactor Wake", "Dead Weight", "No One Left Behind", "Shield Cycle", "Cable Maze",
  "Core Relay", "Magnetic Crane", "Cooling Failure", "Blackout Protocol", "The Final Latch",
];

const gallery = [
  { src: "/media/shield-cycle.png", label: "04 // SHIELD CYCLE" },
  { src: "/media/cooling-failure.png", label: "08 // COOLING FAILURE" },
  { src: "/media/final-latch.png", label: "10 // THE FINAL LATCH" },
];

export default function Home() {
  const [locale, setLocale] = useState<Locale>("uz");
  const t = copy[locale];

  useEffect(() => {
    const stored = window.localStorage.getItem("one-core-site-locale-v1");
    if (stored === "uz" || stored === "en") setLocale(stored);
    if ("serviceWorker" in navigator && window.location.protocol === "https:") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  const toggleLocale = () => {
    const next = locale === "uz" ? "en" : "uz";
    setLocale(next);
    window.localStorage.setItem("one-core-site-locale-v1", next);
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="ONE CORE home">
          <span className="core-dot" /> ONE <b>CORE</b>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#game">{t.nav[0]}</a>
          <a href="#robots">{t.nav[1]}</a>
          <a href="#campaign">{t.nav[2]}</a>
          <a href="#media">{t.nav[3]}</a>
        </nav>
        <button className="lang-button" onClick={toggleLocale} aria-label="Change language">
          {locale.toUpperCase()} <span>⇄</span> {locale === "uz" ? "EN" : "UZ"}
        </button>
      </header>

      <section id="top" className="hero">
        <div className="hero-copy reveal">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1><span>ONE</span><em>CORE</em></h1>
          <p className="hero-lead">{t.lead}</p>
          <p className="hero-body">{t.body}</p>
          <div className="hero-actions">
            <a href="/play" className="button primary">{t.play} <span>→</span></a>
            <a href="#media" className="button secondary">{t.trailer}</a>
          </div>
          <p className="status-line"><span /> {t.status}</p>
        </div>
        <div className="hero-visual">
          <img src="/media/menu.png" width="1280" height="720" alt="ONE CORE game menu inside a dark orbital nuclear facility" />
          <div className="hero-frame" aria-hidden="true" />
          <div className="signal-card"><small>CORE LINK</small><strong>PIKO ⇄ ATLAS</strong><i>STABLE</i></div>
        </div>
      </section>

      <section id="game" className="rule-section section-grid">
        <div>
          <p className="section-index">01 / CORE PROTOCOL</p>
          <h2>{t.rule}</h2>
        </div>
        <div className="rule-copy">
          <p>{t.ruleBody}</p>
          <blockquote>“{t.question}”</blockquote>
          <div className="core-diagram" aria-label="Core transfers between Piko and Atlas">
            <span className="unit piko-unit">PIKO</span>
            <i>CORE</i>
            <span className="energy-line" />
            <span className="unit atlas-unit">ATLAS</span>
          </div>
        </div>
      </section>

      <section id="robots" className="robots-section">
        <div className="section-heading">
          <p className="section-index">02 / SERVICE UNITS</p>
          <h2>{t.robots}</h2>
        </div>
        <div className="robot-grid">
          <article className="robot-card piko-card">
            <div className="robot-silhouette piko-shape"><span /></div>
            <div><p className="robot-code">PX-01 // SCOUT</p><h3>PIKO</h3><p>{t.piko}</p></div>
            <b>CYAN / AGILITY</b>
          </article>
          <article className="robot-card atlas-card">
            <div className="robot-silhouette atlas-shape"><span /></div>
            <div><p className="robot-code">AT-7 // INDUSTRIAL</p><h3>ATLAS</h3><p>{t.atlas}</p></div>
            <b>AMBER / FORCE</b>
          </article>
        </div>
      </section>

      <section id="campaign" className="campaign-section section-grid">
        <div>
          <p className="section-index">03 / EVACUATION ROUTE</p>
          <h2>{t.campaign}</h2>
          <p className="section-body">{t.campaignBody}</p>
        </div>
        <ol className="sector-list">
          {sectors.map((sector, index) => (
            <li key={sector}><span>{String(index + 1).padStart(2, "0")}</span><b>{sector}</b><i>{index < 3 ? "ACT I" : index < 6 ? "ACT II" : index < 9 ? "ACT III" : "FINAL"}</i></li>
          ))}
        </ol>
      </section>

      <section id="media" className="media-section">
        <div className="section-heading">
          <p className="section-index">04 / VISUAL LOG</p>
          <h2>{t.media}</h2>
        </div>
        <div className="trailer-shell">
          <video controls playsInline preload="metadata" poster="/media/final-latch.png">
            <source src="/media/one-core-trailer.mp4" type="video/mp4" />
          </video>
          <span className="trailer-label">GAMEPLAY TRANSMISSION // 00:30</span>
        </div>
        <div className="gallery">
          {gallery.map((item) => <figure key={item.src}><img loading="lazy" width="1280" height="720" src={item.src} alt={item.label} /><figcaption>{item.label}</figcaption></figure>)}
        </div>
      </section>

      <section className="final-cta">
        <p className="eyebrow">EVAC WINDOW OPEN</p>
        <h2>{t.cta}</h2>
        <p>{t.ctaBody}</p>
        <a href="/play" className="button primary">{t.play} <span>→</span></a>
      </section>

      <footer>
        <a className="brand" href="#top"><span className="core-dot" /> ONE <b>CORE</b></a>
        <p>{t.footer}</p>
        <div><a href="/privacy">Privacy</a><a href="https://itch.io" target="_blank" rel="noreferrer">itch.io</a></div>
      </footer>
    </main>
  );
}
