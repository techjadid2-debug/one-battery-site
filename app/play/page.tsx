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

const modifierCopy: Record<string, string> = {
  transfer_limit: "8 ta transfer limiti",
  critical_timer: "30% tezroq radiatsiya",
  no_restart: "Restartsiz urinish",
  precision_route: "15% qisqa vaqt",
};

function formatElapsed(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatRun(milliseconds: number) {
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function PlayPage() {
  const [state, setState] = useState<LoadState>("idle");
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");
  const [player, setPlayer] = useState<Player | null>(null);
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
    if (response.ok) setServiceNotice("Do‘stlik bonusi: 1 referral shard inventarga qo‘shildi.");
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
      const telegram = window.Telegram?.WebApp;
      if (!telegram?.initData) return;
      telegram.ready();
      telegram.expand();
      telegram.lockOrientation?.();
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

  const challengeQuery = challengeActive && challenge
    ? `&level=${challenge.level}&challenge=${encodeURIComponent(challenge.id)}&modifier=${encodeURIComponent(challenge.modifier)}`
    : "";
  const loadingCopy = elapsed >= 45
    ? "Tarmoq sekin ishlayapti. Yana biroz kuting yoki qayta urinib ko‘ring."
    : elapsed >= 20
      ? "Reaktor sektorlari odatdagidan sekinroq yuklanmoqda…"
      : "AES sektorlari va robot tizimlari tayyorlanmoqda…";

  return (
    <main className="play-page">
      <header className="play-bar">
        <Link href="/" className="brand"><span className="core-dot" /> ONE <b>CORE</b></Link>
        <span className="live-status"><i /> LIVE SERVICE</span>
        <p>WEB • TELEGRAM • CLOUD SAVE</p>
        {player ? (
          <button className="player-chip" onClick={() => void shareReferral()} title="Do‘stga taklif yuborish">
            <span>{player.displayName.slice(0, 1).toUpperCase()}</span>
            <b>{player.displayName}</b>
            <i>SHARE +</i>
          </button>
        ) : (
          <button className="player-chip guest" onClick={() => void requestBotCode()}>
            <span>?</span><b>GUEST</b><i>TELEGRAM +</i>
          </button>
        )}
        <Link href="/" aria-label="Bosh sahifaga qaytish">✕</Link>
      </header>

      <div className="game-shell" ref={shell}>
        {state === "idle" ? <div className="start-gate">
          <div className="start-layout">
            <div className="start-card">
              <p className="eyebrow">CORE LINK READY // LANDSCAPE RECOMMENDED</p>
              <h1><span>ONE</span><em>CORE</em></h1>
              <p>Ovozni yoqing, qurilmani yotiq tuting va AESdan ikkala robot bilan birga chiqing.</p>
              <div className="start-actions">
                <button className="button primary" onClick={() => start(false)}>CAMPAIGN <span>→</span></button>
                {challenge ? <button className="button secondary weekly-button" onClick={() => start(true)}>WEEKLY #{challenge.level} <span>↗</span></button> : null}
              </div>
              <small>{player ? `CLOUD LINK // ${player.displayName.toUpperCase()}` : "GUEST SAVE // TELEGRAM ORQALI CLOUD SAVE OCHING"}</small>
            </div>

            <aside className="service-panel" aria-label="Haftalik challenge">
              <p className="module-id">WEEKLY PROTOCOL</p>
              {challenge ? <>
                <div className="challenge-level"><span>SECTOR</span><strong>{String(challenge.level).padStart(2, "0")}</strong></div>
                <h2>{modifierCopy[challenge.modifier] ?? challenge.modifier}</h2>
                <p>Hafta yakunigacha eng yaxshi vaqtni qo‘ying va eksklyuziv badge oling.</p>
                <div className="leaderboard-mini">
                  {leaderboard.length ? leaderboard.slice(0, 3).map((row, index) => (
                    <div key={`${row.display_name}-${index}`}><span>{index + 1}</span><b>{row.display_name}</b><time>{formatRun(row.time_ms)}</time></div>
                  )) : <div className="empty-rank">Birinchi rekord sizniki bo‘lishi mumkin.</div>}
                </div>
                {catalog.length ? <div className="store-mini">
                  <p>CORE STORE // STARS</p>
                  {catalog.slice(0, 2).map((item) => <button key={item.id} onClick={() => void buyItem(item)}>
                    <i style={{ background: item.accent }} /><span><b>{item.name}</b><small>{item.type}</small></span><strong>★ {item.stars}</strong>
                  </button>)}
                </div> : null}
              </> : <p>Challenge kanali tayyorlanmoqda…</p>}
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
          <iframe
            key={`${attempt}-${challengeActive ? challenge?.id : "campaign"}`}
            ref={frame}
            title="Play ONE CORE"
            src={`/game/?attempt=${attempt}${challengeQuery}`}
            allow="autoplay; fullscreen; gamepad"
            allowFullScreen
          />
        ) : null}

        {state === "loading" ? <div className="game-loader" role="status" aria-live="polite">
          <div className="loader-core" aria-hidden="true"><span /><i /></div>
          <p className="eyebrow">{challengeActive ? "WEEKLY PROTOCOL LINK" : "CORE BOOT SEQUENCE"}</p>
          <h2>{progress}%</h2>
          <div className="loader-track" aria-label={`Yuklanmoqda: ${progress}%`}><span style={{ width: `${progress}%` }} /></div>
          <div className="loader-meta"><span>{loadingCopy}</span><time>{formatElapsed(elapsed)}</time></div>
          {elapsed >= 45 ? <button className="loader-retry" onClick={retry}>QAYTA URINISH ↻</button> : null}
        </div> : null}

        {state === "error" ? <div className="game-loader game-error" role="alert">
          <div className="loader-core" aria-hidden="true"><span /><i /></div>
          <p className="eyebrow">CORE LINK INTERRUPTED</p>
          <h2>Ulanish uzildi</h2>
          <p>{error}</p>
          <button className="button primary" onClick={retry}>QAYTA URINISH <span>↻</span></button>
        </div> : null}

        <div className="rotate-note"><div><p className="eyebrow">DEVICE ORIENTATION</p><h2>Telefonni yotiq holatga aylantiring</h2><p>Rotate your device to landscape.</p></div></div>
      </div>
    </main>
  );
}
