import Link from "next/link";

export default function PrivacyPage() {
  return <main className="privacy-page">
    <Link className="brand" href="/"><span className="core-dot" /> ONE <b>CORE</b></Link>
    <p className="eyebrow">PLAYER DATA // PRIVACY</p>
    <h1>Privacy</h1>
    <p>ONE CORE can be played as a guest. Telegram linking is optional on the public web build and enables cloud progress, weekly leaderboards, referrals, inventory and purchases.</p>

    <h2>Local and cloud progress</h2>
    <p>Guest progress and accessibility preferences are stored on the device through Godot&apos;s local storage. After Telegram linking, completed levels, best times, attempts and failures are also stored in the game database so progress can follow the player between devices.</p>

    <h2>Telegram identity</h2>
    <p>The server validates Telegram&apos;s signed login payload before using the Telegram user ID, display name, username, language and optional profile photo. Bot login codes expire after ten minutes and can be used only once.</p>

    <h2>Gameplay analytics</h2>
    <p>ONE CORE records product events such as level starts, completions, failures, restarts, checkpoints, challenge scores and referral shares. Guest analytics use a random first-party identifier. We do not use third-party advertising trackers or sell player data.</p>

    <h2>Payments and referrals</h2>
    <p>Digital purchases inside Telegram use Telegram Stars. We store the purchased item, amount, payment provider identifier and entitlement status so inventory and refunds can be handled. Referral links store the inviter and invitee account relationship and can be claimed once per account.</p>

    <h2>Controls</h2>
    <p>Players can continue without Telegram linking. Account deletion, data export, payment support and refund instructions will be handled through the game bot&apos;s support command before public monetization is enabled.</p>

    <Link className="button secondary" href="/">← BACK / ORQAGA</Link>
  </main>;
}
