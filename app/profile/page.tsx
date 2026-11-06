"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Locale = "uz" | "en";

const profileCopy = {
  uz: {
    backToGame: "O‘YINGA QAYTISH",
    teleTag: "OPERATOR KONSOLI // ID:",
    loadingProfile: "KIBERNETIK PROFIL YUKLANMOQDA...",
    guestTitle: "AVTOMATIK TIZIMGA ULANISH",
    guestDesc: "Siz hali Telegram bot orqali ulanmadingiz. Botga kiring, u sizni avtomatik o‘yinchi sifatida ro‘yxatdan o‘tkazib, profil va maxsus tokenni beradi.",
    openBot: "TELEGRAM BOTNI OCHISH",
    playAsGuest: "MEHMON SIFATIDA O‘YNASH",
    rankTitle: "KIBERNETIK OPERATOR",
    onlineStatus: "ONLAYN // BULUTLI SAQLASH",
    batteryHeader: "YADRO ZARYADI (CORE ENERGY)",
    batteryOptimal: "100% [OPTIMAL]",
    batteryMode: "Rejim: 1-Core Solo / 2-Batareya Co-op",
    batteryDrain: "Zaryad sarfi: Normal",
    playBtn: "O‘YINNI BOSHLASH (PLAY) ↗",
    coopBtn: "2-O‘YINCHI CO-OP REJIMI ⚡",
    inviteBtn: "DO‘STLARNI TAKLIF QILISH (+SHARD)",
    copiedText: "HAVOLA NUSXALANDI",
    shareMessage: "Men bilan AESdan qutulish missiyasini o‘yna! 2 kishilik Co-op yoki yakkaxon yadro rejimi:",
    statsSection: "TELEMETRIYA VA REKORDLAR",
    completedSectors: "O‘TILGAN SEKTORLAR",
    bestTime: "ENG YAXSHI VAQT",
    invitedFriends: "CHAQIRILGAN DO‘STLAR",
    inventoryItems: "INVENTAR BUYUMLARI",
    sectorsTitle: "AES SEKTORLARI (BOSQICHLAR)",
    sectorLabel: "SEKTOR",
    sectorDone: "O‘TGAN",
    sectorLocked: "KUTILMOQDA",
    recordPrefix: "Rekord:",
    needEnergy: "Zaryad kerak",
    inventoryTitle: "INVENTAR VA YADRO ZARYADLAGICHLARI",
    sourceLabel: "Manba:",
    qtyLabel: "Soni:",
  },
  en: {
    backToGame: "BACK TO GAME",
    teleTag: "OPERATOR CONSOLE // ID:",
    loadingProfile: "LOADING CYBER PROFILE...",
    guestTitle: "CONNECT WITH TELEGRAM",
    guestDesc: "You are not authenticated yet. Open the Telegram bot to automatically register your profile with instant token access.",
    openBot: "OPEN TELEGRAM BOT",
    playAsGuest: "PLAY AS GUEST",
    rankTitle: "CYBER OPERATOR",
    onlineStatus: "ONLINE // CLOUD SAVE",
    batteryHeader: "CORE ENERGY GAUGE",
    batteryOptimal: "100% [OPTIMAL]",
    batteryMode: "Mode: 1-Core Solo / 2-Battery Co-op",
    batteryDrain: "Power drain: Normal",
    playBtn: "START GAME (PLAY) ↗",
    coopBtn: "2-PLAYER CO-OP MODE ⚡",
    inviteBtn: "INVITE FRIENDS (+SHARD)",
    copiedText: "LINK COPIED",
    shareMessage: "Escape the damaged nuclear facility with me in ONE CORE! 2-player co-op or solo core run:",
    statsSection: "TELEMETRY & RECORDS",
    completedSectors: "SECTORS CLEARED",
    bestTime: "BEST RECORD TIME",
    invitedFriends: "FRIENDS INVITED",
    inventoryItems: "INVENTORY ITEMS",
    sectorsTitle: "FACILITY SECTORS (LEVELS)",
    sectorLabel: "SECTOR",
    sectorDone: "CLEARED",
    sectorLocked: "LOCKED",
    recordPrefix: "Record:",
    needEnergy: "Energy required",
    inventoryTitle: "INVENTORY & ENERGY CELLS",
    sourceLabel: "Source:",
    qtyLabel: "Qty:",
  },
};

type UserData = {
  id: string;
  telegramId: string;
  username: string | null;
  displayName: string;
  photoUrl: string | null;
  referralCode: string;
  createdAt: string;
};

type ProgressRow = {
  level_id: string;
  completed: number;
  best_time_remaining_ms: number;
  attempts: number;
  failures: number;
};

type InventoryRow = {
  item_id: string;
  source: string;
  quantity: number;
  acquired_at: string;
};

function formatTime(ms: number) {
  if (!ms || ms <= 0) return "--:--";
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  return `${String(min).padStart(2, "0")}:${String(remSec).padStart(2, "0")}`;
}

export default function ProfilePage() {
  const [locale, setLocale] = useState<Locale>("uz");
  const [user, setUser] = useState<UserData | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [botUsername, setBotUsername] = useState("onecore2_bot");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const t = profileCopy[locale];

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("one-core-site-locale-v1") as Locale | null;
      if (stored === "uz" || stored === "en") setLocale(stored);
    } catch {
      // ignore
    }
  }, []);

  const toggleLocale = () => {
    const next: Locale = locale === "uz" ? "en" : "uz";
    setLocale(next);
    try {
      window.localStorage.setItem("one-core-site-locale-v1", next);
    } catch {
      // ignore
    }
  };

  const loadData = async (authToken?: string) => {
    try {
      const url = authToken ? `/api/me?auth=${encodeURIComponent(authToken)}` : "/api/me";
      const res = await fetch(url, {
        cache: "no-store",
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json() as {
          user: UserData | null;
          progress?: ProgressRow[];
          inventory?: InventoryRow[];
          referralCount?: number;
          botUsername?: string;
        };
        if (data.user) {
          setUser(data.user);
          setProgress(data.progress ?? []);
          setInventory(data.inventory ?? []);
          setReferralCount(data.referralCount ?? 0);
          if (data.botUsername) setBotUsername(data.botUsername);
        }
      }
    } catch {
      // Gracefully handle network issues
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      // 1. Check if token passed in URL query param (?auth=...)
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("auth");

      if (urlToken) {
        try {
          const authRes = await fetch("/api/auth/token", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ token: urlToken }),
          });
          if (authRes.ok) {
            const authData = await authRes.json() as { user: UserData };
            if (!cancelled && authData.user) {
              setUser(authData.user);
            }
          }
        } catch {
          // Token error fallback
        }
        if (!cancelled) await loadData(urlToken);
        return;
      }

      // 2. Check if inside Telegram Mini App
      const tg = window.Telegram?.WebApp;
      if (tg?.initData) {
        tg.ready();
        tg.expand();
        try {
          const authRes = await fetch("/api/auth/telegram-mini-app", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ initData: tg.initData }),
          });
          if (authRes.ok) {
            const authData = await authRes.json() as { user: UserData };
            if (!cancelled && authData.user) {
              setUser(authData.user);
            }
          }
        } catch {
          // Mini-app auth error fallback
        }
      }

      // 3. Fallback to existing session cookie
      if (!cancelled) await loadData();
    };

    // Load Telegram WebApp script if needed
    if (!window.Telegram?.WebApp) {
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-web-app.js?59";
      script.async = true;
      script.onload = () => void initAuth();
      script.onerror = () => void initAuth();
      document.head.appendChild(script);
      return () => {
        cancelled = true;
        script.remove();
      };
    } else {
      void initAuth();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const shareReferral = async () => {
    if (!user) return;
    const refLink = `https://t.me/${botUsername}?startapp=ref_${user.referralCode}`;
    const text = `⚡ ONE CORE: ${t.shareMessage} ${refLink}`;

    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`);
    } else if (navigator.share) {
      await navigator.share({ title: "ONE CORE", text, url: refLink }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setStatusMessage(t.copiedText);
      setTimeout(() => {
        setCopied(false);
        setStatusMessage("");
      }, 3000);
    }
  };

  const completedCount = progress.filter((p) => p.completed > 0).length;
  const bestLevel = progress.reduce((best, cur) => cur.best_time_remaining_ms > best ? cur.best_time_remaining_ms : best, 0);

  return (
    <main className="profile-container">
      {/* Top HUD Navigation */}
      <header className="profile-header">
        <Link href="/play" className="brand">
          <span className="core-dot" /> ONE <b>CORE</b>
        </Link>
        <span className="tele-tag">{t.teleTag} {user ? user.telegramId : "UNLINKED"}</span>
        <div className="header-actions">
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
          <Link href="/play" className="header-back-btn">
            ⚡ {t.backToGame}
          </Link>
        </div>
      </header>

      <div className="profile-content">
        {loading ? (
          <div className="profile-loading">
            <div className="loading-spinner" />
            <p className="mono">{t.loadingProfile}</p>
          </div>
        ) : !user ? (
          <div className="profile-guest-card">
            <div className="guest-icon">⚠️</div>
            <h2>{t.guestTitle}</h2>
            <p>{t.guestDesc}</p>
            <div className="guest-actions">
              <a href={`https://t.me/${botUsername}?start=profile`} className="btn-primary" target="_blank" rel="noreferrer">
                🤖 {t.openBot} (@{botUsername})
              </a>
              <Link href="/play" className="btn-secondary">
                🕹 {t.playAsGuest}
              </Link>
            </div>
          </div>
        ) : (
          <div className="profile-grid">
            {/* Operator Card */}
            <section className="operator-card">
              <div className="avatar-wrapper">
                <div className="avatar-core">
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt={user.displayName} className="avatar-img" />
                  ) : (
                    <div className="avatar-neon-symbol">
                      <span>⚡</span>
                    </div>
                  )}
                </div>
                <div className="avatar-ring" />
              </div>

              <div className="operator-info">
                <div className="badge-row">
                  <span className="rank-badge">⚡ {t.rankTitle}</span>
                  <span className="status-badge">● {t.onlineStatus}</span>
                </div>
                <h1 className="operator-name">{user.displayName}</h1>
                <p className="operator-handle">
                  {user.username ? `@${user.username}` : `UID: ${user.telegramId}`}
                </p>
              </div>

              {/* Battery Meter */}
              <div className="battery-box">
                <div className="battery-header">
                  <span className="battery-label">🔋 {t.batteryHeader}</span>
                  <span className="battery-val">{t.batteryOptimal}</span>
                </div>
                <div className="battery-track">
                  <div className="battery-fill" style={{ width: "100%" }}>
                    <div className="battery-glint" />
                  </div>
                </div>
                <div className="battery-meta">
                  <span>{t.batteryMode}</span>
                  <span>{t.batteryDrain}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="card-buttons">
                <Link href="/play" className="btn-primary">
                  ⚡ {t.playBtn}
                </Link>
                <Link href="/play?mode=coop" className="btn-accent">
                  👥 {t.coopBtn}
                </Link>
                <button onClick={() => void shareReferral()} className="btn-secondary">
                  {copied ? `✅ ${t.copiedText}` : `🔗 ${t.inviteBtn}`}
                </button>
              </div>

              {statusMessage && <div className="toast-note">{statusMessage}</div>}
            </section>

            {/* Stats Dashboard */}
            <section className="stats-dashboard">
              <h2 className="section-title">📊 {t.statsSection}</h2>
              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-icon">🏆</div>
                  <div className="stat-body">
                    <span className="stat-number">{completedCount} / 10</span>
                    <span className="stat-title">{t.completedSectors}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">⏱</div>
                  <div className="stat-body">
                    <span className="stat-number">{formatTime(bestLevel)}</span>
                    <span className="stat-title">{t.bestTime}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-body">
                    <span className="stat-number">{referralCount}</span>
                    <span className="stat-title">{t.invitedFriends}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🎒</div>
                  <div className="stat-body">
                    <span className="stat-number">{inventory.length}</span>
                    <span className="stat-title">{t.inventoryItems}</span>
                  </div>
                </div>
              </div>

              {/* Sector Progress Breakdown */}
              <div className="sectors-box">
                <h3 className="sub-title">🗺 {t.sectorsTitle}</h3>
                <div className="sectors-grid">
                  {Array.from({ length: 10 }, (_, i) => {
                    const levelNum = i + 1;
                    const p = progress.find((row) => row.level_id === `level_${levelNum}` || Number(row.level_id) === levelNum);
                    const isDone = Boolean(p && p.completed > 0);
                    return (
                      <div key={levelNum} className={`sector-chip ${isDone ? "done" : "locked"}`}>
                        <div className="sector-header">
                          <span className="sector-tag">{t.sectorLabel} {String(levelNum).padStart(2, "0")}</span>
                          <span className="sector-status">{isDone ? `✅ ${t.sectorDone}` : `🔒 ${t.sectorLocked}`}</span>
                        </div>
                        <div className="sector-time">
                          {isDone ? `${t.recordPrefix} ${formatTime(p?.best_time_remaining_ms ?? 0)}` : t.needEnergy}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inventory Box */}
              {inventory.length > 0 && (
                <div className="inventory-box">
                  <h3 className="sub-title">🎒 {t.inventoryTitle}</h3>
                  <div className="inventory-list">
                    {inventory.map((item, idx) => (
                      <div key={`${item.item_id}-${idx}`} className="inventory-item">
                        <span className="item-icon">💎</span>
                        <div className="item-info">
                          <b>{item.item_id.toUpperCase()}</b>
                          <small>{t.sourceLabel} {item.source} • {t.qtyLabel} {item.quantity}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <style jsx>{`
        .profile-container {
          min-height: 100vh;
          background: radial-gradient(circle at 80% 10%, rgba(53, 214, 232, 0.12), transparent 30rem),
                      radial-gradient(circle at 10% 90%, rgba(239, 173, 70, 0.08), transparent 30rem),
                      #050d13;
          color: #eaf1ef;
          font-family: var(--font-sans, system-ui, sans-serif);
          padding-bottom: 40px;
        }

        .profile-header {
          position: sticky;
          top: 0;
          z-index: 50;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          background: rgba(5, 13, 19, 0.88);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(122, 158, 173, 0.25);
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono, monospace);
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #eaf1ef;
          text-decoration: none;
        }

        .brand b {
          color: #efad46;
        }

        .core-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ffe58a;
          box-shadow: 0 0 14px #efad46;
        }

        .tele-tag {
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          color: #94aab1;
          letter-spacing: 0.1em;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .lang-button {
          border: 1px solid rgba(122, 158, 173, 0.35);
          border-radius: 999px;
          padding: 6px 12px;
          color: #eaf1ef;
          background: rgba(16, 36, 46, 0.7);
          backdrop-filter: blur(10px);
          cursor: pointer;
          font: 600 11px/1 var(--font-mono, monospace);
          letter-spacing: 0.08em;
          transition: border-color 0.18s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .lang-button:hover {
          border-color: #35d6e8;
        }

        .header-back-btn {
          font-family: var(--font-mono, monospace);
          font-size: 12px;
          font-weight: 700;
          color: #050d13;
          background: #35d6e8;
          padding: 7px 16px;
          border-radius: 999px;
          text-decoration: none;
          box-shadow: 0 0 16px rgba(53, 214, 232, 0.4);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .header-back-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 22px rgba(53, 214, 232, 0.6);
        }

        .profile-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 20px;
        }

        .profile-loading {
          text-align: center;
          padding: 80px 20px;
        }

        .loading-spinner {
          width: 44px;
          height: 44px;
          margin: 0 auto 16px;
          border: 3px solid rgba(53, 214, 232, 0.2);
          border-top-color: #35d6e8;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .profile-guest-card {
          max-width: 540px;
          margin: 60px auto;
          background: #0a1720;
          border: 1px solid rgba(122, 158, 173, 0.3);
          border-radius: 16px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        }

        .guest-icon {
          font-size: 42px;
          margin-bottom: 12px;
        }

        .guest-actions {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 28px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
        }

        .operator-card {
          background: #0a1720;
          border: 1px solid rgba(53, 214, 232, 0.28);
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(53, 214, 232, 0.03);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .avatar-wrapper {
          position: relative;
          width: 96px;
          height: 96px;
          margin-bottom: 20px;
        }

        .avatar-core {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          background: #0e222c;
          border: 2px solid #35d6e8;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 24px rgba(53, 214, 232, 0.4);
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-neon-symbol {
          font-size: 38px;
          filter: drop-shadow(0 0 10px #ffe58a);
        }

        .avatar-ring {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px dashed rgba(53, 214, 232, 0.5);
          animation: spin 16s linear infinite;
        }

        .badge-row {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .rank-badge {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          font-weight: 700;
          color: #ffe58a;
          background: rgba(239, 173, 70, 0.15);
          border: 1px solid rgba(239, 173, 70, 0.4);
          padding: 4px 8px;
          border-radius: 6px;
          letter-spacing: 0.08em;
        }

        .status-badge {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          font-weight: 700;
          color: #5fe6a0;
          background: rgba(95, 230, 160, 0.12);
          border: 1px solid rgba(95, 230, 160, 0.35);
          padding: 4px 8px;
          border-radius: 6px;
        }

        .operator-name {
          margin: 6px 0 2px;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .operator-handle {
          margin: 0;
          font-family: var(--font-mono, monospace);
          color: #35d6e8;
          font-size: 14px;
        }

        .battery-box {
          width: 100%;
          margin: 24px 0;
          padding: 16px;
          background: #0e222c;
          border: 1px solid rgba(95, 230, 160, 0.25);
          border-radius: 12px;
          text-align: left;
        }

        .battery-header {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .battery-label {
          color: #aabfc6;
        }

        .battery-val {
          color: #5fe6a0;
        }

        .battery-track {
          width: 100%;
          height: 12px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 6px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(95, 230, 160, 0.4);
        }

        .battery-fill {
          height: 100%;
          background: linear-gradient(90deg, #35d6e8, #5fe6a0);
          box-shadow: 0 0 12px #5fe6a0;
          position: relative;
        }

        .battery-glint {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          animation: glint 2.5s infinite;
        }

        @keyframes glint {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .battery-meta {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          color: #94aab1;
          margin-top: 6px;
        }

        .card-buttons {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .btn-primary, .btn-accent, .btn-secondary {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 18px;
          border-radius: 10px;
          font-family: var(--font-mono, monospace);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
        }

        .btn-primary {
          background: linear-gradient(180deg, #8ff5c2, #5fe6a0);
          color: #06120f;
          box-shadow: 0 10px 24px -10px rgba(95, 230, 160, 0.6);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px -8px rgba(95, 230, 160, 0.8);
        }

        .btn-accent {
          background: linear-gradient(180deg, #5de1ef, #35d6e8);
          color: #050d13;
          box-shadow: 0 10px 24px -10px rgba(53, 214, 232, 0.5);
        }

        .btn-accent:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px -8px rgba(53, 214, 232, 0.7);
        }

        .btn-secondary {
          background: #0e222c;
          border: 1px solid rgba(122, 158, 173, 0.35);
          color: #eaf1ef;
        }

        .btn-secondary:hover {
          background: rgba(53, 214, 232, 0.1);
          border-color: #35d6e8;
        }

        .toast-note {
          margin-top: 10px;
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          color: #5fe6a0;
        }

        .stats-dashboard {
          background: #0a1720;
          border: 1px solid rgba(122, 158, 173, 0.22);
          border-radius: 16px;
          padding: 28px;
        }

        .section-title {
          font-family: var(--font-mono, monospace);
          font-size: 14px;
          letter-spacing: 0.12em;
          color: #35d6e8;
          margin-top: 0;
          margin-bottom: 20px;
        }

        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .stat-card {
          background: #0e222c;
          border: 1px solid rgba(122, 158, 173, 0.18);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .stat-icon {
          font-size: 26px;
        }

        .stat-number {
          display: block;
          font-size: 22px;
          font-weight: 700;
          font-family: var(--font-mono, monospace);
          color: #ffe58a;
        }

        .stat-title {
          display: block;
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          color: #94aab1;
          letter-spacing: 0.08em;
        }

        .sub-title {
          font-family: var(--font-mono, monospace);
          font-size: 12px;
          letter-spacing: 0.1em;
          color: #aabfc6;
          margin-bottom: 12px;
        }

        .sectors-box {
          margin-bottom: 28px;
        }

        .sectors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 10px;
        }

        .sector-chip {
          background: #0e222c;
          border-radius: 8px;
          padding: 10px 12px;
          border: 1px solid rgba(122, 158, 173, 0.16);
          font-family: var(--font-mono, monospace);
        }

        .sector-chip.done {
          border-color: rgba(95, 230, 160, 0.4);
          background: rgba(95, 230, 160, 0.05);
        }

        .sector-chip.locked {
          opacity: 0.65;
        }

        .sector-header {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .sector-tag {
          color: #35d6e8;
        }

        .sector-status {
          color: #aabfc6;
        }

        .sector-chip.done .sector-status {
          color: #5fe6a0;
        }

        .sector-time {
          font-size: 11px;
          color: #eaf1ef;
        }

        .inventory-list {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .inventory-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #0e222c;
          border: 1px solid rgba(53, 214, 232, 0.25);
          border-radius: 8px;
          padding: 8px 14px;
        }

        .inventory-item b {
          display: block;
          font-size: 12px;
          color: #5de1ef;
          font-family: var(--font-mono, monospace);
        }

        .inventory-item small {
          color: #94aab1;
          font-size: 10px;
        }
      `}</style>
    </main>
  );
}
