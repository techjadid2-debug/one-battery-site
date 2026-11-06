"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type LoadState = "idle" | "loading" | "ready" | "error";
type Player = {
  id: string;
  displayName: string;
  photoUrl: string | null;
  referralCode: string;
};
type Challenge = {
  id: string;
  level: number;
  modifier: string;
  endsAt: number;
  rewardItemId: string;
};
type LeaderboardRow = {
  display_name: string;
  time_ms: number;
};
type CatalogItem = {
  id: string;
  name: string;
  type: string;
  stars: number;
  accent: string;
};
type GameMessage = {
  type?: string;
  version?: number;
  current?: number;
  total?: number;
  message?: string;
  level?: number;
  level_id?: string;
  time_remaining?: number;
  elapsed_ms?: number;
  transfer_count?: number;
  challenge_id?: string;
  [key: string]: unknown;
};
type TelegramWebApp = {
  initData: string;
  initDataUnsafe?: { start_param?: string };
  ready(): void;
  expand(): void;
  lockOrientation?(): void;
  openTelegramLink?(url: string): void;
  openInvoice?(url: string, callback?: (status: string) => void): void;
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

type Locale = "uz" | "en";

const playCopy = {
  uz: {
    liveService: "JONLI XIZMAT",
    subBrand: "WEB • TELEGRAM • BULUTLI SAQLASH",
    coreLinkReady: "YADRO TIZIMI TAYYOR // LANDSCAPE (YOTIQ) TAVSIYA ETILADI",
    leadDesc: "Ovozni yoqing, telefonni yotiq tuting va AES reaktoridan ikkala robot bilan birga chiqing.",
    campaignBtn: "BOSQICHLARNI BOSHLASH",
    weeklyBtn: "HAFTALIK SINOV",
    cloudLink: "BULUTLI SAQLASH //",
    guestSave: "MEHMON REJIMI // TELEGRAM ORQALI CLOUD SAVE OCHING",
    weeklyProtocol: "HAFTALIK PROTOKOL",
    sector: "SEKTOR",
    weeklySub: "Hafta yakunigacha eng yaxshi vaqtni qayd eting va eksklyuziv nishon yuting.",
    emptyRank: "Birinchi rekord sizniki bo‘lishi mumkin.",
    coreStore: "YADRO DO‘KONI // STARS",
    share: "ULASHISH",
    profile: "PROFIL",
    guest: "MEHMON",
    login: "KIRISH",
    deviceOrient: "Qurilmani yotiq holatga buring",
    deviceOrientSub: "16:9 keng formatli o‘yin uchun telefonni yonboshga aylantiring.",
    fullscreenBtn: "TO‘LIQ EKRAN",
    pcNoticeTitle: "Kompyuterda o‘ynayapsizmi?",
    pcNoticeDesc: "Telegram Desktop oynasi tor bo‘lishi mumkin. Katta 16:9 monitor ekranida klaviatura bilan qulay o‘ynash uchun brauzerda oching:",
    pcNoticeBtn: "🖥 Brauzerda to‘liq ekranda ochish ↗",
    langPrompt: "Til / Language",
    controlsTip: "🎮 Boshqaruv: Telefonda sensorli tugmalar, Kompyuterda WASD / Yo‘nalish tugmalari va E",
    connLost: "Ulanish uzildi",
    retry: "QAYTA URINISH",
    slowNet: "Tarmoq sekin ishlayapti. Yana biroz kuting yoki qayta urinib ko‘ring.",
    midLoad: "Reaktor sektorlari yuklanmoqda…",
    fastLoad: "AES sektorlari va robot tizimlari tayyorlanmoqda…",
    challengeLink: "HAFTALIK PROTOKOL TAYYORLANMOQDA",
    bootSeq: "YADRO TIZIMI ISHGA TUSHMOQDA",
    timeoutError: "O‘yin yuklanishi kutilganidan uzoq davom etdi.",
    gameError: "O‘yin ishga tushmadi.",
    referralCopied: "Taklif havolasi nusxalandi.",
    referralBonus: "Do‘stlik bonusi: 1 referral shard inventarga qo‘shildi.",
    recordSaved: "Haftalik natijangiz leaderboardga yozildi.",
    telegramConnected: "Telegram profilingiz ulandi. Cloud save faol.",
    itemAdded: "inventarga qo‘shildi.",
    modifiers: {
      transfer_limit: "8 ta transfer limiti",
      critical_timer: "30% tezroq radiatsiya",
      no_restart: "Restartsiz urinish",
      precision_route: "15% qisqa vaqt",
    } as Record<string, string>,
  },
  en: {
    liveService: "LIVE SERVICE",
    subBrand: "WEB • TELEGRAM • CLOUD SAVE",
    coreLinkReady: "CORE LINK READY // LANDSCAPE RECOMMENDED",
    leadDesc: "Turn on sound, hold device in landscape, and escape the facility together.",
    campaignBtn: "START CAMPAIGN",
    weeklyBtn: "WEEKLY PROTOCOL",
    cloudLink: "CLOUD LINK //",
    guestSave: "GUEST SAVE // OPEN CLOUD SAVE VIA TELEGRAM",
    weeklyProtocol: "WEEKLY PROTOCOL",
    sector: "SECTOR",
    weeklySub: "Set the best time by week's end and earn an exclusive badge.",
    emptyRank: "You could set the very first record.",
    coreStore: "CORE STORE // STARS",
    share: "SHARE",
    profile: "PROFILE",
    guest: "GUEST",
    login: "LOGIN",
    deviceOrient: "Rotate your device to landscape",
    deviceOrientSub: "Turn your device sideways for the optimal 16:9 widescreen experience.",
    fullscreenBtn: "FULLSCREEN",
    pcNoticeTitle: "Playing on PC / Mac?",
    pcNoticeDesc: "Telegram Desktop window can be narrow. For full 16:9 widescreen view with keyboard, open in browser:",
    pcNoticeBtn: "🖥 Open in Full Browser ↗",
    langPrompt: "Language / Til",
    controlsTip: "🎮 Controls: Mobile touch D-pad & buttons, PC uses WASD / Arrow keys & E",
    connLost: "Connection Interrupted",
    retry: "RETRY",
    slowNet: "Network is slow. Please wait or try again.",
    midLoad: "Reactor sectors are loading…",
    fastLoad: "Facility sectors and robot systems booting…",
    challengeLink: "WEEKLY PROTOCOL LINK",
    bootSeq: "CORE BOOT SEQUENCE",
    timeoutError: "Game loading took longer than expected.",
    gameError: "Failed to start the game.",
    referralCopied: "Invite link copied to clipboard.",
    referralBonus: "Friend bonus: 1 referral shard added to inventory.",
    recordSaved: "Your weekly run was added to leaderboard.",
    telegramConnected: "Telegram profile linked. Cloud save active.",
    itemAdded: "added to inventory.",
    modifiers: {
      transfer_limit: "8 transfer limit",
      critical_timer: "30% faster radiation",
      no_restart: "No-restart run",
      precision_route: "15% tighter time",
    } as Record<string, string>,
  },
};

function formatElapsed(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatRun(milliseconds: number) {
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function PlayPage() {
  const [locale, setLocale] = useState<Locale>("uz");
  const [state, setState] = useState<LoadState>("idle");
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");
  const [player, setPlayer] = useState<Player | null>(null);
  const [rawAuthToken, setRawAuthToken] = useState<string>("");
  const [isTgDesktop, setIsTgDesktop] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [botUsername, setBotUsername] = useState("");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [challengeActive, setChallengeActive] = useState(false);
  const [serviceNotice, setServiceNotice] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginNonce, setLoginNonce] = useState("");
  const [loginDeepLink, setLoginDeepLink] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const shell = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const referralClaimed = useRef(false);

  const t = playCopy[locale];

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("one-core-site-locale-v1") as Locale | null;
      if (stored === "uz" || stored === "en") setLocale(stored);
    } catch {
      // ignore
    }

    const detectPlatform = () => {
      const isMouse = !window.matchMedia("(pointer: coarse)").matches;
      const isNarrow = window.innerWidth < 880;
      if (isMouse && isNarrow) {
        setIsTgDesktop(true);
      }
    };
    detectPlatform();
    window.addEventListener("resize", detectPlatform);
    return () => window.removeEventListener("resize", detectPlatform);
  }, []);

  const setGameLocale = (next: Locale) => {
    setLocale(next);
    try {
      window.localStorage.setItem("one-core-site-locale-v1", next);
    } catch {
      // ignore
    }
  };

  const toggleLocale = () => {
    setGameLocale(locale === "uz" ? "en" : "uz");
  };

  const toggleFullscreen = () => {
    const tg = window.Telegram?.WebApp as (TelegramWebApp & { requestFullscreen?(): void }) | undefined;
    if (typeof tg?.requestFullscreen === "function") {
      try { tg.requestFullscreen(); } catch {}
    }
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => null);
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => null);
    }
  };

  const started = state !== "idle";

  const loadProfile = async () => {
    const response = await fetch("/api/me", { cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json() as { user?: Player | null; botUsername?: string };
    setPlayer(data.user ?? null);
    setBotUsername(data.botUsername ?? "");
    return data.user ?? null;
  };

  const claimStartReferral = async (startParam: string | undefined) => {
    if (referralClaimed.current || !startParam?.startsWith("ref_")) return;
    referralClaimed.current = true;
    const response = await fetch("/api/referrals/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: startParam.slice(4) }),
    });
    if (response.ok) setServiceNotice(t.referralBonus);
  };

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      await loadProfile().catch(() => null);
      const challengeResponse = await fetch("/api/challenges/current", { cache: "no-store" }).catch(() => null);
      if (!cancelled && challengeResponse?.ok) {
        const data = await challengeResponse.json() as { challenge: Challenge; leaderboard: LeaderboardRow[] };
        setChallenge(data.challenge);
        setLeaderboard(data.leaderboard ?? []);
      }
      const catalogResponse = await fetch("/api/catalog", { cache: "no-store" }).catch(() => null);
      if (!cancelled && catalogResponse?.ok) {
        const data = await catalogResponse.json() as { items: CatalogItem[] };
        setCatalog(data.items ?? []);
      }
      // Check for auth token in URL query parameter (?auth=...)
      const searchParams = new URLSearchParams(window.location.search);
      const urlAuthToken = searchParams.get("auth");
      if (urlAuthToken) {
        setRawAuthToken(urlAuthToken);
        const tokenRes = await fetch("/api/auth/token", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token: urlAuthToken }),
        }).catch(() => null);
        if (!cancelled && tokenRes?.ok) {
          const data = await tokenRes.json() as { user: Player };
          setPlayer(data.user);
        }
      }

      const telegram = window.Telegram?.WebApp as (TelegramWebApp & { platform?: string; requestFullscreen?(): void }) | undefined;
      if (!telegram) return;
      telegram.ready();
      telegram.expand();
      if (typeof telegram.requestFullscreen === "function") {
        try { telegram.requestFullscreen(); } catch {}
      }
      if (typeof telegram.lockOrientation === "function") {
        try { telegram.lockOrientation(); } catch {}
      }
      const tgPlat = telegram.platform;
      if (tgPlat === "tdesktop" || tgPlat === "macos" || tgPlat === "web" || tgPlat === "weba") {
        setIsTgDesktop(true);
      }
      if (!telegram.initData) return;
      const authResponse = await fetch("/api/auth/telegram-mini-app", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData: telegram.initData }),
      }).catch(() => null);
      if (!cancelled && authResponse?.ok) {
        const data = await authResponse.json() as { user: Player };
        setPlayer(data.user);
        await claimStartReferral(telegram.initDataUnsafe?.start_param);
      }
    };
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js?59";
    script.async = true;
    script.onload = () => void bootstrap();
    script.onerror = () => void bootstrap();
    document.head.appendChild(script);
    return () => {
      cancelled = true;
      script.remove();
    };
  }, []);

  useEffect(() => {
    if (state !== "loading") return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(seconds);
      if (seconds >= 90) {
        setError("O‘yin yuklanishi kutilganidan uzoq davom etdi.");
        setState("error");
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [attempt, state]);

  useEffect(() => {
    const onMessage = (event: MessageEvent<GameMessage>) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "one-core:loading") {
        const current = Number(data.current ?? 0);
        const total = Number(data.total ?? 0);
        if (total > 0) setProgress(Math.max(2, Math.min(99, Math.round((current / total) * 100))));
        return;
      }
      if (data.type === "one-core:ready") {
        setProgress(100);
        setState("ready");
        return;
      }
      if (data.type === "one-core:error") {
        setError(data.message || "O‘yin ishga tushmadi.");
        setState("error");
        return;
      }
      if (!data.type?.startsWith("one-core:") || data.version !== 1) return;
      const eventName = data.type.slice("one-core:".length);
      const payload = { ...data };
      delete payload.type;
      void fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: eventName, level: data.level, payload }),
      });
      if (["level-started", "level-failed", "level-completed"].includes(eventName)) {
        void fetch("/api/progress", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            event: eventName,
            level: data.level,
            levelId: data.level_id,
            timeRemaining: data.time_remaining,
          }),
        });
      }
      if (
        eventName === "level-completed"
        && challengeActive
        && challenge
        && data.challenge_id === challenge.id
      ) {
        void fetch(`/api/challenges/${encodeURIComponent(challenge.id)}/score`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            timeMs: data.elapsed_ms,
            transferCount: data.transfer_count,
            runProof: `${data.level_id}:${data.elapsed_ms}:${data.transfer_count}`,
          }),
        }).then((response) => {
          if (response.ok) setServiceNotice("Haftalik natijangiz leaderboardga yozildi.");
        });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [challenge, challengeActive]);

  const requestImmersiveMode = async () => {
    try {
      if (shell.current?.requestFullscreen) await shell.current.requestFullscreen();
      const orientation = screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
      await orientation.lock?.("landscape");
    } catch {
      // Fullscreen and orientation lock are optional browser enhancements.
    }
  };

  const start = (weekly = false) => {
    setChallengeActive(weekly);
    setProgress(2);
    setElapsed(0);
    setError("");
    setState("loading");
    void requestImmersiveMode();
  };

  const retry = () => {
    setAttempt((value) => value + 1);
    setProgress(2);
    setElapsed(0);
    setError("");
    setState("loading");
  };

  const requestBotCode = async () => {
    setLoginOpen(true);
    setServiceNotice("");
    const response = await fetch("/api/auth/telegram-code/request", { method: "POST" });
    const data = await response.json() as { nonce?: string; deepLink?: string; error?: string };
    if (!response.ok || !data.nonce || !data.deepLink) {
      setServiceNotice(data.error ?? "Telegram login hozircha tayyor emas.");
      return;
    }
    setLoginNonce(data.nonce);
    setLoginDeepLink(data.deepLink);
  };

  const verifyBotCode = async () => {
    const response = await fetch("/api/auth/telegram-code/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nonce: loginNonce, code: loginCode }),
    });
    const data = await response.json() as { user?: Player; error?: string };
    if (!response.ok || !data.user) {
      setServiceNotice(data.error ?? "Kod tasdiqlanmadi.");
      return;
    }
    setPlayer(data.user);
    setLoginOpen(false);
    setServiceNotice("Telegram profilingiz ulandi. Cloud save faol.");
  };

  const shareReferral = async () => {
    if (!player || !botUsername) return;
    const referralUrl = `https://t.me/${botUsername}?startapp=ref_${player.referralCode}`;
    const text = "ONE CORE’da mening vaqtimni yenga olasanmi?";
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "referral-shared", payload: { channel: "telegram" } }),
    });
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(text)}`);
    } else if (navigator.share) {
      await navigator.share({ title: "ONE CORE", text, url: referralUrl }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(referralUrl);
      setServiceNotice("Taklif havolasi nusxalandi.");
    }
  };

  const buyItem = async (item: CatalogItem) => {
    if (!player) {
      await requestBotCode();
      return;
    }
    const response = await fetch("/api/payments/stars/invoice", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ itemId: item.id }),
    });
    const data = await response.json() as { invoiceUrl?: string; error?: string };
    if (!response.ok || !data.invoiceUrl) {
      setServiceNotice(data.error ?? "Stars invoice ochilmadi.");
      return;
    }
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "purchase-opened", payload: { itemId: item.id } }),
    });
    if (window.Telegram?.WebApp?.openInvoice) {
      window.Telegram.WebApp.openInvoice(data.invoiceUrl, (status) => {
        if (status === "paid") setServiceNotice(`${item.name} inventarga qo‘shildi.`);
      });
    } else {
      window.open(data.invoiceUrl, "_blank", "noopener,noreferrer");
    }
  };

  const sendGameAction = (action: string, pressed: boolean) => {
    if (frame.current?.contentWindow) {
      frame.current.contentWindow.postMessage({
        type: "one-core:action",
        action,
        pressed,
      }, "*");
    }
    if (pressed && window.Telegram?.WebApp?.HapticFeedback) {
      try {
        window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
      } catch {}
    }
  };

  const challengeQuery = challengeActive && challenge
    ? `&level=${challenge.level}&challenge=${encodeURIComponent(challenge.id)}&modifier=${encodeURIComponent(challenge.modifier)}`
    : "";
  const loadingCopy = elapsed >= 45
    ? t.slowNet
    : elapsed >= 20
      ? t.midLoad
      : t.fastLoad;

  return (
    <main className="play-page">
      <header className="play-bar">
        <Link href="/" className="brand"><span className="core-dot" /> ONE <b>CORE</b></Link>
        <span className="live-status"><i /> {t.liveService}</span>
        <p>{t.subBrand}</p>

        <div className="play-bar-right">
          {/* Til almashtirish: UZ / EN */}
          <button
            className="lang-button"
            onClick={toggleLocale}
            title={locale === "uz" ? "Switch to English" : "O‘zbek tiliga o‘tish"}
            aria-label="Change language"
          >
            <b>{locale.toUpperCase()}</b>
            <span style={{ opacity: 0.65 }}>⇄</span>
            <span style={{ color: "var(--cyan)" }}>{locale === "uz" ? "EN" : "UZ"}</span>
          </button>

          {/* To‘liq ekran tugmasi */}
          <button
            className="fullscreen-button"
            onClick={toggleFullscreen}
            title={t.fullscreenBtn}
            aria-label="To‘liq ekran rejimi"
          >
            {isFullscreen ? "🗗" : "⛶"}
          </button>

          {player ? (
            <Link href="/profile" className="player-chip-link" title={t.profile}>
              <span className="chip-avatar">{player.displayName.slice(0, 1).toUpperCase()}</span>
              <b className="chip-name">{player.displayName}</b>
              <i className="chip-role">{t.profile}</i>
            </Link>
          ) : (
            <Link href="/profile" className="player-chip-link guest" title={t.login}>
              <span className="chip-avatar">?</span>
              <b className="chip-name">{t.guest}</b>
              <i className="chip-role">{t.login}</i>
            </Link>
          )}

          <Link href="/" className="play-bar-close-btn" aria-label="Bosh sahifaga qaytish">✕</Link>
        </div>
      </header>

      <div className="game-shell" ref={shell}>
        {state === "idle" ? <div className="start-gate">
          <div className="start-layout">
            <div className="start-card">
              <p className="eyebrow">{t.coreLinkReady}</p>
              <h1><span>ONE</span><em>CORE</em></h1>
              <p>{t.leadDesc}</p>
              <div className="start-actions">
                <button className="button primary" onClick={() => start(false)}>{t.campaignBtn} <span>→</span></button>
                {challenge ? <button className="button secondary weekly-button" onClick={() => start(true)}>{t.weeklyBtn} #{challenge.level} <span>↗</span></button> : null}
                {player ? (
                  <button className="button secondary" onClick={() => void shareReferral()} title="Do‘stga taklif yuborish">
                    🔗 {t.share} <span>+</span>
                  </button>
                ) : null}
              </div>

              {/* Til tanlash tugmalari (Har doim ko‘rinadigan UZ / EN panel) */}
              <div className="start-lang-switcher">
                <span className="lang-prompt">{t.langPrompt}:</span>
                <button
                  type="button"
                  className={`lang-choice-btn ${locale === "uz" ? "active" : ""}`}
                  onClick={() => setGameLocale("uz")}
                >
                  🇺🇿 O‘zbekcha
                </button>
                <button
                  type="button"
                  className={`lang-choice-btn ${locale === "en" ? "active" : ""}`}
                  onClick={() => setGameLocale("en")}
                >
                  🇬🇧 English
                </button>
              </div>

              {/* Kompyuter / Telegram Desktop uchun qulay brauzer tavsiyasi */}
              {isTgDesktop ? (
                <div className="desktop-browser-card">
                  <div className="desktop-browser-header">
                    <span className="desktop-badge">🖥 PC / MAC</span>
                    <b>{t.pcNoticeTitle}</b>
                  </div>
                  <p>{t.pcNoticeDesc}</p>
                  <a
                    href={`/api/auth/session?next=/play${rawAuthToken ? `&auth=${encodeURIComponent(rawAuthToken)}` : ""}`}
                    target="_blank"
                    rel="noreferrer"
                    className="desktop-open-btn"
                  >
                    {t.pcNoticeBtn}
                  </a>
                </div>
              ) : null}

              <p className="controls-hint-text">{t.controlsTip}</p>
              <small>{player ? `${t.cloudLink} ${player.displayName.toUpperCase()}` : t.guestSave}</small>
            </div>

            <aside className="service-panel" aria-label="Haftalik challenge">
              <p className="module-id">{t.weeklyProtocol}</p>
              {challenge ? <>
                <div className="challenge-level"><span>{t.sector}</span><strong>{String(challenge.level).padStart(2, "0")}</strong></div>
                <h2>{t.modifiers[challenge.modifier] ?? challenge.modifier}</h2>
                <p>{t.weeklySub}</p>
                <div className="leaderboard-mini">
                  {leaderboard.length ? leaderboard.slice(0, 3).map((row, index) => (
                    <div key={`${row.display_name}-${index}`}><span>{index + 1}</span><b>{row.display_name}</b><time>{formatRun(row.time_ms)}</time></div>
                  )) : <div className="empty-rank">{t.emptyRank}</div>}
                </div>
                {catalog.length ? <div className="store-mini">
                  <p>{t.coreStore}</p>
                  {catalog.slice(0, 2).map((item) => <button key={item.id} onClick={() => void buyItem(item)}>
                    <i style={{ background: item.accent }} /><span><b>{item.name}</b><small>{item.type}</small></span><strong>★ {item.stars}</strong>
                  </button>)}
                </div> : null}
              </> : <p>{t.challengeLink}</p>}
            </aside>
          </div>

          {loginOpen ? <div className="login-sheet" role="dialog" aria-modal="true" aria-label="Telegram bilan kirish">
            <button className="sheet-close" onClick={() => setLoginOpen(false)}>✕</button>
            <p className="module-id">TELEGRAM CLOUD LINK</p>
            <h2>Progressingizni saqlang</h2>
            <p>Botni oching, u yuborgan 6 xonali kodni shu yerga kiriting.</p>
            {loginDeepLink ? <a className="button primary" href={loginDeepLink} target="_blank" rel="noreferrer">BOTNI OCHISH ↗</a> : <button className="button secondary" onClick={() => void requestBotCode()}>QAYTA URINISH</button>}
            <div className="code-row">
              <input value={loginCode} onChange={(event) => setLoginCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" aria-label="Telegram kodi" />
              <button onClick={() => void verifyBotCode()} disabled={loginCode.length !== 6}>TASDIQLASH</button>
            </div>
          </div> : null}

          {serviceNotice ? <div className="service-toast" role="status">{serviceNotice}</div> : null}
        </div> : null}

        {started ? (
          <div className="game-viewport-wrap">
            <iframe
              key={`${attempt}-${challengeActive ? challenge?.id : "campaign"}-${locale}`}
              ref={frame}
              title="Play ONE CORE"
              src={`/game/?attempt=${attempt}&lang=${locale}${challengeQuery}`}
              allow="autoplay; fullscreen; gamepad; clipboard-write"
              allowFullScreen
            />

            {/* Tik holat uchun: Bitta bosh barmoq bilan qulay boshqaruv paneli */}
            <div className="one-thumb-deck" role="toolbar" aria-label="Bir barmoq bilan boshqaruv">
              {/* Asosiy harakatlar: Sakrash va Yadro almashtirish */}
              <div className="thumb-actions-row">
                <button
                  type="button"
                  className="thumb-action-btn jump-btn"
                  onPointerDown={(e) => { e.preventDefault(); sendGameAction("jump", true); }}
                  onPointerUp={(e) => { e.preventDefault(); sendGameAction("jump", false); }}
                  onPointerLeave={() => sendGameAction("jump", false)}
                  onPointerCancel={() => sendGameAction("jump", false)}
                >
                  <span className="btn-icon">⚡</span>
                  <span className="btn-label">{locale === "uz" ? "SAKRASH" : "JUMP"}</span>
                </button>

                <button
                  type="button"
                  className="thumb-action-btn core-btn"
                  onPointerDown={(e) => { e.preventDefault(); sendGameAction("interact", true); }}
                  onPointerUp={(e) => { e.preventDefault(); sendGameAction("interact", false); }}
                  onPointerLeave={() => sendGameAction("interact", false)}
                  onPointerCancel={() => sendGameAction("interact", false)}
                >
                  <span className="btn-icon">🔄</span>
                  <span className="btn-label">{locale === "uz" ? "YADRO / ALMASH" : "CORE / SWAP"}</span>
                </button>
              </div>

              {/* Yo‘nalish paneli: Chapga, Tezkor Sakrash, O‘ngga */}
              <div className="thumb-movement-row">
                <button
                  type="button"
                  className="thumb-dir-btn left-btn"
                  onPointerDown={(e) => { e.preventDefault(); sendGameAction("move_left", true); }}
                  onPointerUp={(e) => { e.preventDefault(); sendGameAction("move_left", false); }}
                  onPointerLeave={() => sendGameAction("move_left", false)}
                  onPointerCancel={() => sendGameAction("move_left", false)}
                >
                  <span className="dir-icon">◀</span>
                  <span className="dir-text">{locale === "uz" ? "CHAPGA" : "LEFT"}</span>
                </button>

                <button
                  type="button"
                  className="thumb-dir-center-btn"
                  onPointerDown={(e) => { e.preventDefault(); sendGameAction("jump", true); }}
                  onPointerUp={(e) => { e.preventDefault(); sendGameAction("jump", false); }}
                  onPointerLeave={() => sendGameAction("jump", false)}
                  onPointerCancel={() => sendGameAction("jump", false)}
                >
                  <span className="center-icon">▲</span>
                  <span className="center-label">{locale === "uz" ? "SAKRA" : "JUMP"}</span>
                </button>

                <button
                  type="button"
                  className="thumb-dir-btn right-btn"
                  onPointerDown={(e) => { e.preventDefault(); sendGameAction("move_right", true); }}
                  onPointerUp={(e) => { e.preventDefault(); sendGameAction("move_right", false); }}
                  onPointerLeave={() => sendGameAction("move_right", false)}
                  onPointerCancel={() => sendGameAction("move_right", false)}
                >
                  <span className="dir-text">{locale === "uz" ? "O‘NGGA" : "RIGHT"}</span>
                  <span className="dir-icon">▶</span>
                </button>
              </div>

              <div className="thumb-deck-bar">
                <span>📱 {locale === "uz" ? "Tik holatda bir barmoq bilan boshqaring • Yotqizsangiz to‘liq ekranga o‘tadi" : "One-thumb portrait play • Rotate for full widescreen"}</span>
              </div>
            </div>
          </div>
        ) : null}

        {state === "loading" ? <div className="game-loader" role="status" aria-live="polite">
          <div className="loader-core" aria-hidden="true"><span /><i /></div>
          <p className="eyebrow">{challengeActive ? t.challengeLink : t.bootSeq}</p>
          <h2>{progress}%</h2>
          <div className="loader-track" aria-label={`Yuklanmoqda: ${progress}%`}><span style={{ width: `${progress}%` }} /></div>
          <div className="loader-meta"><span>{loadingCopy}</span><time>{formatElapsed(elapsed)}</time></div>
          {elapsed >= 45 ? <button className="loader-retry" onClick={retry}>{t.retry} ↻</button> : null}
        </div> : null}

        {state === "error" ? <div className="game-loader game-error" role="alert">
          <div className="loader-core" aria-hidden="true"><span /><i /></div>
          <p className="eyebrow">{t.connLost.toUpperCase()}</p>
          <h2>{t.connLost}</h2>
          <p>{error}</p>
          <button className="button primary" onClick={retry}>{t.retry} <span>↻</span></button>
        </div> : null}
      </div>
    </main>
  );
}
