"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Locale = "uz" | "en";

const copy = {
  uz: {
    nav: ["Protokol", "Robotlar", "Kampaniya", "Media"],
    eyebrow: "ORBITAL AES // EVAKUATSIYA PROTOKOLI 01",
    radStatus: "RAD: FAOL",
    bootSys: "TIZIM: ONE CORE ONLINE",
    bootCore: "yadro ulandi",
    lead: "Ikki robot. Bitta yadro. Hech kim tashlab ketilmaydi.",
    body: "AES portlashidan keyin Piko va Atlas yagona energiya yadrosini navbat bilan ishlatib, radiatsiya ularni ishdan chiqarmasidan oldin evakuatsiya kapsulasiga yetishi kerak.",
    play: "BEPUL O‘YNASH",
    learn: "QANDAY O‘YNALADI",
    status: "WEB + TELEGRAM • 10 LEVEL • WEEKLY CHALLENGE",
    rule: "Bitta qoida. O‘nlab qaror.",
    ruleBody: "Bir vaqtda faqat yadroni ko‘targan robot harakatlanadi. O‘chgan robot esa og‘irligi, joylashuvi va do‘stligi bilan puzzle’ning bir qismi bo‘lib qoladi.",
    question: "Hozir energiya kimda bo‘lishi kerak?",
    how: "PROTOKOL // TO‘RT QADAM",
    steps: [
      ["HARAKAT", "A/D yoki ←/→ bilan faol robotni yurgizing. Space — sakrash."],
      ["YADRONI UZATING", "Robotlar yaqin va yerda bo‘lsa E bosing. Boshqaruv darhol ikkinchi robotga o‘tadi."],
      ["O‘CHGAN TANADAN FOYDALANING", "Energiyasiz robot yurmaydi, lekin tugmani bosib turadi va platforma bo‘la oladi."],
      ["BIRGA CHIQING", "Evakuatsiya eshigi faqat Piko ham, Atlas ham detektorda turganda ochiladi."],
    ],
    robots: "Ikki xil kuch. Bitta umumiy maqsad.",
    piko: "Chaqqon, baland sakraydi va servis tunnellari hamda nozik terminallarga kira oladi.",
    atlas: "Og‘ir yuklarni suradi, katta mexanizmlarni ushlab turadi va Piko uchun yo‘l yaratadi.",
    campaign: "AES ichida 10 sektor",
    campaignBody: "Har sektor bitta yangi fikrni o‘rgatadi, keyin uni oldingi mexanikalar bilan birlashtiradi. Radiatsiya taymeri ilk harakatingizdan keyin ishga tushadi.",
    live: "Har hafta yangi protokol",
    liveBody: "Telegram profilingizni ulang, cloud save’ni yoqing va haftalik modifierlarda do‘stlaringiz vaqtini quving.",
    weekly: "Haftalik sinov",
    cloud: "Cloud progress",
    invite: "Do‘stlik bonusi",
    media: "Reaktor ichidan signal",
    cta: "Yadroni oling. Do‘stingizni toping. Birga chiqing.",
    ctaBody: "ONE CORE klaviatura, gamepad va mobil touch boshqaruvda ishlaydi. Progress shu qurilmada avtomatik saqlanadi.",
    footer: "Mustaqil sci-fi puzzle tajribasi. Uzbek va English tillarida.",
  },
  en: {
    nav: ["Protocol", "Robots", "Campaign", "Media"],
    eyebrow: "ORBITAL NUCLEAR FACILITY // EVAC PROTOCOL 01",
    radStatus: "RAD: ACTIVE",
    bootSys: "SYSTEM: ONE CORE ONLINE",
    bootCore: "core linked",
    lead: "Two robots. One core. No one gets left behind.",
    body: "After a nuclear facility rupture, Piko and Atlas must share a single energy core and reach the evacuation capsule before radiation disables them for good.",
    play: "PLAY FREE",
    learn: "HOW TO PLAY",
    status: "WEB + TELEGRAM • 10 LEVELS • WEEKLY CHALLENGE",
    rule: "One rule. Dozens of decisions.",
    ruleBody: "Only the robot carrying the core can move. The unpowered robot remains part of the puzzle through its weight, position, and bond with its friend.",
    question: "Who needs the energy right now?",
    how: "PROTOCOL // FOUR STEPS",
    steps: [
      ["MOVE", "Use A/D or ←/→ to move the powered robot. Space makes it jump."],
      ["TRANSFER THE CORE", "Stand close, both on the ground, and press E. Control moves to the other robot instantly."],
      ["USE THE DEAD WEIGHT", "An unpowered robot cannot move, but it can hold a plate or become a platform."],
      ["LEAVE TOGETHER", "The evacuation door only opens when both Piko and Atlas stand in the detector."],
    ],
    robots: "Two different strengths. One shared goal.",
    piko: "Agile, high-jumping, and small enough for service tunnels and precision terminals.",
    atlas: "Moves heavy cargo, holds industrial mechanisms, and creates a path for Piko.",
    campaign: "10 sectors inside the facility",
    campaignBody: "Each sector teaches one new idea, then combines it with every rule you know. The radiation timer starts on your first move.",
    live: "A new protocol every week",
    liveBody: "Link your Telegram profile, enable cloud save, and chase your friends’ times through rotating weekly modifiers.",
    weekly: "Weekly challenge",
    cloud: "Cloud progress",
    invite: "Friend bonus",
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
  { src: "/media/v2/shot-transfer.jpg", label: "01 // REACTOR WAKE", alt: "Piko standing beside Atlas, ready to hand over the core" },
  { src: "/media/v2/shot-deadweight.jpg", label: "02 // DEAD WEIGHT", alt: "An unpowered Atlas holding position while Piko carries the core" },
  { src: "/media/v2/shot-evac.jpg", label: "03 // NO ONE LEFT BEHIND", alt: "Piko and Atlas reaching the evacuation airlock together" },
];

export default function Home() {
  const [locale, setLocale] = useState<Locale>("uz");
  const [navOpen, setNavOpen] = useState(false);
  const t = copy[locale];

  useEffect(() => {
    const stored = window.localStorage.getItem("one-core-site-locale-v1");
    let localeFrame = 0;
    if (stored === "uz" || stored === "en") {
      document.documentElement.lang = stored;
      localeFrame = window.requestAnimationFrame(() => setLocale(stored));
    }
    if ("serviceWorker" in navigator && window.location.protocol === "https:") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    return () => window.cancelAnimationFrame(localeFrame);
  }, []);

  // Close the mobile menu on Escape (keyboard accessibility).
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const toggleLocale = () => {
    const next = locale === "uz" ? "en" : "uz";
    setLocale(next);
    document.documentElement.lang = next;
    window.localStorage.setItem("one-core-site-locale-v1", next);
  };

  return (
    <>
      <a className="skip-link" href="#main">{locale === "uz" ? "Kontentga o‘tish" : "Skip to content"}</a>
      <header className="console-header">
        <a className="brand" href="#top" aria-label="ONE CORE home"><span className="core-dot" /> ONE <b>CORE</b></a>
        <nav id="nav-primary" className={navOpen ? "nav-open" : ""} aria-label="Primary navigation" onClick={() => setNavOpen(false)}>
          <a href="#protocol">{t.nav[0]}</a><a href="#robots">{t.nav[1]}</a><a href="#campaign">{t.nav[2]}</a><a href="#media">{t.nav[3]}</a>
          <a href="/profile" style={{ color: "var(--cyan)", fontWeight: 700 }}>👤 PROFIL</a>
        </nav>
        <a href="/play" className="console-play">▶ {t.play}</a>
        <button className="lang-button" onClick={toggleLocale} aria-label="Change language">{locale.toUpperCase()} <span>⇄</span> {locale === "uz" ? "EN" : "UZ"}</button>
        <button className={"nav-toggle" + (navOpen ? " is-open" : "")} aria-label="Menu" aria-controls="nav-primary" aria-expanded={navOpen} onClick={() => setNavOpen((v) => !v)}><span /><span /><span /></button>
      </header>

      <main id="main">
        <section id="top" className="hero">
          <div className="hero-copy">
            <div className="telemetry">
              <span className="tele-tag">{t.eyebrow}</span>
              <span className="rad-meter" aria-hidden="true"><i /></span>
              <span className="tele-status">{t.radStatus}</span>
            </div>
            <pre className="boot" aria-hidden="true">{`> ${t.bootSys}\n> ${t.bootCore} ........ `}<b>OK</b>{`\n> PIKO ⇄ ATLAS ...... `}<b>STABLE</b>{" "}<span className="blink">▋</span></pre>
            <h1><span>ONE</span><em>CORE</em></h1>
            <p className="hero-lead">{t.lead}</p>
            <p className="hero-body">{t.body}</p>
            <div className="corelink">CORE LINK — <span className="piko">PIKO</span> ⇄ <span className="atlas">ATLAS</span> · <span className="ok">STABLE</span></div>
            <div className="hero-actions"><a href="/play" className="button primary">▶ {t.play}</a><a href="#protocol" className="button secondary">{t.learn}</a></div>
            <p className="status-line"><span /> {t.status}</p>
          </div>
          <div className="hero-visual">
            <Image priority unoptimized src="/media/v2/hero-industrial-v2.webp" width={1792} height={1024} sizes="(max-width: 980px) 100vw, 56vw" alt="Piko and Atlas escaping through a damaged nuclear power station" />
            <div className="hero-frame" aria-hidden="true" />
            <div className="signal-card"><small>CORE LINK</small><strong>PIKO ⇄ ATLAS</strong><i>STABLE</i></div>
          </div>
        </section>

        <section id="protocol" className="module module-grid rule-module">
          <div className="module-head reveal">
            <p className="module-id">MODULE 01 // CORE PROTOCOL</p>
            <h2>{t.rule}</h2>
            <p className="rule-lead">{t.ruleBody}</p>
            <blockquote>“{t.question}”</blockquote>
            <div className="core-diagram" aria-label="Core transfers between Piko and Atlas"><span className="unit piko-unit">PIKO</span><i>CORE</i><span className="energy-line" /><span className="unit atlas-unit">ATLAS</span></div>
          </div>
          <div className="reveal">
            <p className="module-id">{t.how}</p>
            <div className="steps-grid">{t.steps.map((step, index) => <article className="step-card" key={step[0]}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{step[0]}</h3><p>{step[1]}</p></div></article>)}</div>
            <div className="control-strip" aria-label="Game controls"><span><kbd>A</kbd><kbd>D</kbd> MOVE</span><span><kbd>SPACE</kbd> JUMP</span><span><kbd>E</kbd> TRANSFER / USE</span><span><kbd>R</kbd> RESTART</span></div>
            <div className="demo-shell"><video controls playsInline preload="metadata" poster="/media/v2/demo-poster.jpg"><source src="/media/v2/how-to-play.mp4" type="video/mp4" /></video><p>CORE TRAINING LOOP // 00:08</p></div>
          </div>
        </section>

        <section id="robots" className="module robots-module">
          <div className="section-heading reveal"><div><p className="module-id">MODULE 02 // SERVICE UNITS</p><h2>{t.robots}</h2></div></div>
          <div className="robot-grid reveal">
            <article className="robot-card piko-card"><div className="robot-sprite piko-sprite" role="img" aria-label="Piko robot" /><div><p className="robot-code">PX-01 // SCOUT</p><h3>PIKO</h3><p>{t.piko}</p></div><b>CYAN / AGILITY</b></article>
            <article className="robot-card atlas-card"><div className="robot-sprite atlas-sprite" role="img" aria-label="Atlas robot" /><div><p className="robot-code">AT-7 // INDUSTRIAL</p><h3>ATLAS</h3><p>{t.atlas}</p></div><b>AMBER / FORCE</b></article>
          </div>
        </section>

        <section id="campaign" className="module module-grid campaign-module">
          <div className="reveal"><p className="module-id">MODULE 03 // EVACUATION ROUTE</p><h2>{t.campaign}</h2><p className="module-body">{t.campaignBody}</p><div className="campaign-stats"><span><strong>10</strong> SECTORS</span><span><strong>02</strong> ROBOTS</span><span><strong>01</strong> CORE</span></div></div>
          <ol className="sector-list reveal">{sectors.map((sector, index) => <li key={sector}><span>{String(index + 1).padStart(2, "0")}</span><b>{sector}</b><i>{index < 3 ? "ACT I" : index < 6 ? "ACT II" : index < 9 ? "ACT III" : "FINAL"}</i></li>)}</ol>
        </section>

        <section className="module live-module">
          <div className="section-heading reveal"><div><p className="module-id">MODULE 04 // LIVE SERVICE</p><h2>{t.live}</h2><p className="module-body">{t.liveBody}</p></div></div>
          <div className="live-grid reveal">
            <article><span>01</span><h3>{t.weekly}</h3><p>TIME • TRANSFER LIMIT • NO RESTART</p></article>
            <article><span>02</span><h3>{t.cloud}</h3><p>TELEGRAM PROFILE • MULTI-DEVICE SAVE</p></article>
            <article><span>03</span><h3>{t.invite}</h3><p>REFERRAL SHARD • FRIEND LEADERBOARD</p></article>
          </div>
        </section>

        <section id="media" className="module media-module">
          <div className="section-heading reveal"><div><p className="module-id">MODULE 05 // VISUAL LOG</p><h2>{t.media}</h2></div></div>
          <div className="trailer-shell reveal"><video controls playsInline preload="metadata" poster="/media/v2/trailer-poster.jpg"><source src="/media/one-core-trailer.mp4" type="video/mp4" /></video><span className="trailer-label">GAMEPLAY TRANSMISSION // 00:21</span></div>
          <div className="gallery reveal">{gallery.map((item) => <figure key={item.src}><Image unoptimized width={1280} height={720} sizes="(max-width: 640px) 100vw, 33vw" src={item.src} alt={item.alt} /><figcaption>{item.label}</figcaption></figure>)}</div>
        </section>

        <section className="final-cta reveal"><p className="eyebrow">EVAC WINDOW OPEN</p><h2>{t.cta}</h2><p>{t.ctaBody}</p><a href="/play" className="button primary">▶ {t.play}</a></section>
        <footer><a className="brand" href="#top"><span className="core-dot" /> ONE <b>CORE</b></a><p>{t.footer}</p><div><a href="/play">Play</a><a href="/privacy">Privacy</a></div></footer>
      </main>
    </>
  );
}
