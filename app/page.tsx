"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Locale = "uz" | "en";

const copy = {
  uz: {
    nav: ["O‘yin", "O‘rganish", "Robotlar", "Kampaniya", "Media"],
    eyebrow: "ORBITAL AES // EVAKUATSIYA PROTOKOLI 01",
    lead: "Ikki robot. Bitta yadro. Hech kim tashlab ketilmaydi.",
    body: "AES portlashidan keyin Piko va Atlas yagona energiya yadrosini navbat bilan ishlatib, radiatsiya ularni ishdan chiqarmasidan oldin evakuatsiya kapsulasiga yetishi kerak.",
    play: "BEPUL O‘YNASH",
    learn: "QANDAY O‘YNALADI",
    status: "WEBDA BEPUL • 10 LEVEL • ≈90 DAQIQA",
    rule: "Bitta qoida. O‘nlab qaror.",
    ruleBody: "Bir vaqtda faqat yadroni ko‘targan robot harakatlanadi. O‘chgan robot esa og‘irligi, joylashuvi va do‘stligi bilan puzzle’ning bir qismi bo‘lib qoladi.",
    question: "Hozir energiya kimda bo‘lishi kerak?",
    how: "To‘rt qadamda asosiy qoida",
    howBody: "O‘yin birinchi sektordanoq hammasini harakat orqali o‘rgatadi. Mana evakuatsiya protokoli:",
    steps: [
      ["HARAKAT", "A/D yoki ←/→ bilan faol robotni yurgizing. Space — sakrash."],
      ["YADRONI UZATING", "Robotlar yaqin bo‘lsa E bosing. Boshqaruv darhol ikkinchi robotga o‘tadi."],
      ["O‘CHGAN TANADAN FOYDALANING", "Energiyasiz robot yurmaydi, lekin tugmani bosib turadi va platforma bo‘la oladi."],
      ["BIRGA CHIQING", "Evakuatsiya eshigi faqat Piko ham, Atlas ham detektorda turganda ochiladi."],
    ],
    robots: "Ikki xil kuch. Bitta umumiy maqsad.",
    piko: "Chaqqon, baland sakraydi va servis tunnellari hamda nozik terminallarga kira oladi.",
    atlas: "Og‘ir yuklarni suradi, katta mexanizmlarni ushlab turadi va Piko uchun yo‘l yaratadi.",
    campaign: "AES ichida 10 sektor",
    campaignBody: "Har sektor bitta yangi fikrni o‘rgatadi, keyin uni oldingi mexanikalar bilan birlashtiradi. Radiatsiya taymeri ilk harakatingizdan keyin ishga tushadi.",
    media: "Reaktor ichidan signal",
    cta: "Yadroni oling. Do‘stingizni toping. Birga chiqing.",
    ctaBody: "ONE CORE klaviatura, gamepad va mobil touch boshqaruvda ishlaydi. Progress shu qurilmada avtomatik saqlanadi.",
    footer: "Mustaqil sci-fi puzzle tajribasi. Uzbek va English tillarida.",
  },
  en: {
    nav: ["Game", "Learn", "Robots", "Campaign", "Media"],
    eyebrow: "ORBITAL NUCLEAR FACILITY // EVAC PROTOCOL 01",
    lead: "Two robots. One core. No one gets left behind.",
    body: "After a nuclear facility rupture, Piko and Atlas must share a single energy core and reach the evacuation capsule before radiation disables them for good.",
    play: "PLAY FREE",
    learn: "HOW TO PLAY",
    status: "FREE ON WEB • 10 LEVELS • ≈90 MINUTES",
    rule: "One rule. Dozens of decisions.",
    ruleBody: "Only the robot carrying the core can move. The unpowered robot remains part of the puzzle through its weight, position, and bond with its friend.",
    question: "Who needs the energy right now?",
    how: "The core rule in four steps",
    howBody: "The first sector teaches everything through play. This is your evacuation protocol:",
    steps: [
      ["MOVE", "Use A/D or ←/→ to move the powered robot. Space makes it jump."],
      ["TRANSFER THE CORE", "Stand close and press E. Control moves to the other robot instantly."],
      ["USE THE DEAD WEIGHT", "An unpowered robot cannot move, but it can hold a plate or become a platform."],
      ["LEAVE TOGETHER", "The evacuation door only opens when both Piko and Atlas stand in the detector."],
    ],
    robots: "Two different strengths. One shared goal.",
    piko: "Agile, high-jumping, and small enough for service tunnels and precision terminals.",
    atlas: "Moves heavy cargo, holds industrial mechanisms, and creates a path for Piko.",
    campaign: "10 sectors inside the facility",
    campaignBody: "Each sector teaches one new idea, then combines it with every rule you know. The radiation timer starts on your first move.",
    media: "Signal from inside the reactor",
    cta: "Take the core. Find your friend. Get out together.",
    ctaBody: "ONE CORE supports keyboard, gamepad, and mobile touch controls. Progress saves automatically on this device.",
    footer: "An independent sci-fi puzzle experience. Available in Uzbek and English.",
  },
};

const sectors = [
  "Reactor Wake", "Dead Weight", "No One Left Behind", "Shield Cycle", "Cable Maze",
  "Core Relay", "Magnetic Crane", "Cooling Failure", "Blackout Protocol", "The Final Latch",
];

const gallery = [
  { src: "/media/v2/shield-cycle-v2.png", label: "04 // SHIELD CYCLE" },
  { src: "/media/v2/cooling-failure-v2.png", label: "08 // COOLING FAILURE" },
  { src: "/media/v2/final-latch-v2.png", label: "10 // THE FINAL LATCH" },
];

export default function Home() {
  const [locale, setLocale] = useState<Locale>("uz");
  const t = copy[locale];

  useEffect(() => {
    const stored = window.localStorage.getItem("one-core-site-locale-v1");
    const localeTimer = (stored === "uz" || stored === "en")
      ? window.setTimeout(() => setLocale(stored), 0)
      : undefined;
    if ("serviceWorker" in navigator && window.location.protocol === "https:") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    return () => {
      if (localeTimer !== undefined) window.clearTimeout(localeTimer);
    };
  }, []);

  const toggleLocale = () => {
    const next = locale === "uz" ? "en" : "uz";
    setLocale(next);
    window.localStorage.setItem("one-core-site-locale-v1", next);
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="ONE CORE home"><span className="core-dot" /> ONE <b>CORE</b></a>
        <nav aria-label="Primary navigation">
          <a href="#game">{t.nav[0]}</a><a href="#how">{t.nav[1]}</a><a href="#robots">{t.nav[2]}</a><a href="#campaign">{t.nav[3]}</a><a href="#media">{t.nav[4]}</a>
        </nav>
        <button className="lang-button" onClick={toggleLocale} aria-label="Change language">{locale.toUpperCase()} <span>⇄</span> {locale === "uz" ? "EN" : "UZ"}</button>
      </header>

      <section id="top" className="hero">
        <div className="hero-copy reveal">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1><span>ONE</span><em>CORE</em></h1>
          <p className="hero-lead">{t.lead}</p>
          <p className="hero-body">{t.body}</p>
          <div className="hero-actions"><a href="/play" className="button primary">{t.play} <span>→</span></a><a href="#how" className="button secondary">{t.learn}</a></div>
          <p className="status-line"><span /> {t.status}</p>
        </div>
        <div className="hero-visual">
          <Image priority unoptimized src="/media/v2/hero-industrial-v2.webp" width={1792} height={1024} sizes="(max-width: 980px) 100vw, 58vw" alt="Piko and Atlas escaping through a damaged nuclear power station" />
          <div className="hero-frame" aria-hidden="true" />
          <div className="signal-card"><small>CORE LINK</small><strong>PIKO ⇄ ATLAS</strong><i>STABLE</i></div>
        </div>
      </section>

      <section id="game" className="rule-section section-grid">
        <div><p className="section-index">01 / CORE PROTOCOL</p><h2>{t.rule}</h2></div>
        <div className="rule-copy"><p>{t.ruleBody}</p><blockquote>“{t.question}”</blockquote><div className="core-diagram" aria-label="Core transfers between Piko and Atlas"><span className="unit piko-unit">PIKO</span><i>CORE</i><span className="energy-line" /><span className="unit atlas-unit">ATLAS</span></div></div>
      </section>

      <section id="how" className="how-section">
        <div className="section-heading"><div><p className="section-index">02 / HOW TO PLAY</p><h2>{t.how}</h2><p className="section-body">{t.howBody}</p></div></div>
        <div className="how-grid">
          <div className="steps-grid">{t.steps.map((step, index) => <article className="step-card" key={step[0]}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{step[0]}</h3><p>{step[1]}</p></div></article>)}</div>
          <div className="demo-shell"><video autoPlay muted loop playsInline controls preload="metadata" poster="/media/v2/cooling-failure-v2.png"><source src="/media/v2/how-to-play.mp4" type="video/mp4" /></video><p>CORE TRAINING LOOP // 00:14</p></div>
        </div>
        <div className="control-strip" aria-label="Game controls"><span><kbd>A</kbd><kbd>D</kbd> MOVE</span><span><kbd>SPACE</kbd> JUMP</span><span><kbd>E</kbd> TRANSFER / USE</span><span><kbd>R</kbd> RESTART</span></div>
      </section>

      <section id="robots" className="robots-section">
        <div className="section-heading"><div><p className="section-index">03 / SERVICE UNITS</p><h2>{t.robots}</h2></div></div>
        <div className="robot-grid">
          <article className="robot-card piko-card"><div className="robot-sprite piko-sprite" role="img" aria-label="Piko robot" /><div><p className="robot-code">PX-01 // SCOUT</p><h3>PIKO</h3><p>{t.piko}</p></div><b>CYAN / AGILITY</b></article>
          <article className="robot-card atlas-card"><div className="robot-sprite atlas-sprite" role="img" aria-label="Atlas robot" /><div><p className="robot-code">AT-7 // INDUSTRIAL</p><h3>ATLAS</h3><p>{t.atlas}</p></div><b>AMBER / FORCE</b></article>
        </div>
      </section>

      <section id="campaign" className="campaign-section section-grid">
        <div><p className="section-index">04 / EVACUATION ROUTE</p><h2>{t.campaign}</h2><p className="section-body">{t.campaignBody}</p><div className="campaign-stats"><span><strong>10</strong> SECTORS</span><span><strong>02</strong> ROBOTS</span><span><strong>01</strong> CORE</span></div></div>
        <ol className="sector-list">{sectors.map((sector, index) => <li key={sector}><span>{String(index + 1).padStart(2, "0")}</span><b>{sector}</b><i>{index < 3 ? "ACT I" : index < 6 ? "ACT II" : index < 9 ? "ACT III" : "FINAL"}</i></li>)}</ol>
      </section>

      <section id="media" className="media-section">
        <div className="section-heading"><div><p className="section-index">05 / VISUAL LOG</p><h2>{t.media}</h2></div></div>
        <div className="trailer-shell"><video controls playsInline preload="metadata" poster="/media/v2/final-latch-v2.png"><source src="/media/one-core-trailer.mp4" type="video/mp4" /></video><span className="trailer-label">GAMEPLAY TRANSMISSION // 00:30</span></div>
        <div className="gallery">{gallery.map((item) => <figure key={item.src}><Image unoptimized width={1280} height={720} sizes="(max-width: 640px) 100vw, 33vw" src={item.src} alt={item.label} /><figcaption>{item.label}</figcaption></figure>)}</div>
      </section>

      <section className="final-cta"><p className="eyebrow">EVAC WINDOW OPEN</p><h2>{t.cta}</h2><p>{t.ctaBody}</p><a href="/play" className="button primary">{t.play} <span>→</span></a></section>
      <footer><a className="brand" href="#top"><span className="core-dot" /> ONE <b>CORE</b></a><p>{t.footer}</p><div><a href="/privacy">Privacy</a><a href="https://itch.io" target="_blank" rel="noreferrer">itch.io</a></div></footer>
    </main>
  );
}
