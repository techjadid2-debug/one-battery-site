"use client";

import { useRef, useState } from "react";

export default function PlayPage() {
  const [started, setStarted] = useState(false);
  const shell = useRef<HTMLDivElement>(null);

  const start = async () => {
    setStarted(true);
    try {
      if (shell.current?.requestFullscreen) await shell.current.requestFullscreen();
      const orientation = screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
      await orientation.lock?.("landscape");
    } catch {
      // Browsers may decline fullscreen/orientation; the responsive canvas still works.
    }
  };

  return (
    <main className="play-page">
      <header className="play-bar">
        <a href="/" className="brand"><span className="core-dot" /> ONE <b>CORE</b></a>
        <p>WEB BUILD // KEYBOARD • TOUCH • GAMEPAD</p>
        <a href="/" aria-label="Back to home">✕</a>
      </header>
      <div className="game-shell" ref={shell}>
        {!started ? <div className="start-gate"><div className="start-card">
          <p className="eyebrow">AUDIO LINK READY // LANDSCAPE RECOMMENDED</p>
          <h1><span>ONE</span><em>CORE</em></h1>
          <p>Start bosilganda brauzer audio tizimi ochiladi va o‘yin fullscreen rejimiga o‘tishga urinadi.</p>
          <button className="button primary" onClick={start}>START / BOSHLASH <span>→</span></button>
        </div></div> : null}
        {started ? <iframe title="Play ONE CORE" src="/game/index.html" allow="autoplay; fullscreen; gamepad" allowFullScreen /> : null}
        <div className="rotate-note"><div><p className="eyebrow">DEVICE ORIENTATION</p><h2>Telefonni yotiq holatga aylantiring</h2><p>Rotate your device to landscape.</p></div></div>
      </div>
    </main>
  );
}
