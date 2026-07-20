"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type LoadState = "idle" | "loading" | "ready" | "error";
type GameMessage = {
  type?: string;
  current?: number;
  total?: number;
  message?: string;
};

function formatElapsed(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function PlayPage() {
  const [state, setState] = useState<LoadState>("idle");
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");
  const shell = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  const started = state !== "idle";

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
      if (event.source !== frame.current?.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "one-core:loading") {
        const current = Number(data.current ?? 0);
        const total = Number(data.total ?? 0);
        if (total > 0) setProgress(Math.max(2, Math.min(99, Math.round((current / total) * 100))));
      }
      if (data.type === "one-core:ready") {
        setProgress(100);
        setState("ready");
      }
      if (data.type === "one-core:error") {
        setError(data.message || "O‘yin ishga tushmadi.");
        setState("error");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const requestImmersiveMode = async () => {
    try {
      if (shell.current?.requestFullscreen) await shell.current.requestFullscreen();
      const orientation = screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
      await orientation.lock?.("landscape");
    } catch {
      // Fullscreen and orientation lock are optional browser enhancements.
    }
  };

  const start = () => {
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

  const loadingCopy = elapsed >= 45
    ? "Tarmoq sekin ishlayapti. Yana biroz kuting yoki qayta urinib ko‘ring."
    : elapsed >= 20
      ? "Reaktor sektorlari odatdagidan sekinroq yuklanmoqda…"
      : "AES sektorlari va robot tizimlari tayyorlanmoqda…";

  return (
    <main className="play-page">
      <header className="play-bar">
        <Link href="/" className="brand"><span className="core-dot" /> ONE <b>CORE</b></Link>
        <p>WEB BUILD // KEYBOARD • TOUCH • GAMEPAD</p>
        <Link href="/" aria-label="Bosh sahifaga qaytish">✕</Link>
      </header>
      <div className="game-shell" ref={shell}>
        {state === "idle" ? <div className="start-gate"><div className="start-card">
          <p className="eyebrow">CORE LINK READY // LANDSCAPE RECOMMENDED</p>
          <h1><span>ONE</span><em>CORE</em></h1>
          <p>Ovozni yoqing, qurilmani yotiq tuting va AESdan ikkala robot bilan birga chiqing.</p>
          <button className="button primary" onClick={start}>START / BOSHLASH <span>→</span></button>
        </div></div> : null}

        {started ? (
          <iframe
            key={attempt}
            ref={frame}
            title="Play ONE CORE"
            src={`/game/?attempt=${attempt}`}
            allow="autoplay; fullscreen; gamepad"
            allowFullScreen
          />
        ) : null}

        {state === "loading" ? <div className="game-loader" role="status" aria-live="polite">
          <div className="loader-core" aria-hidden="true"><span /><i /></div>
          <p className="eyebrow">CORE BOOT SEQUENCE</p>
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
