# Bid House — UI Structure & Asset Spec (v1)

> Authored by K3 (spec pass) 2026-09-12. This is the design contract for the next Codex implementation runs (UI overhaul + asset pipeline). Implement against this exactly; deviations need a note in the handoff.

## 1. Design Language

**Fantasy:** you are a bidder walking into a velvet-and-brass auction house at night. Noir art-deco, candlelit, precious.

- **Palette (CSS custom properties):**
  - `--bg-deep: #14101A` (page background), `--bg-panel: #1E1826` (panels), `--bg-raised: #2A2134` (cards/hover)
  - `--ink: #EDE6F5` (primary text), `--ink-dim: #9A8FAE` (secondary)
  - `--gold: #D4A24E` (primary accent: prices, CTAs, featured), `--gold-bright: #F2C879`
  - `--gem: #7E5CE0` (secondary accent: abilities, xp), `--danger: #C94F4F`, `--success: #5CB87A`
  - tier colors: T1 `#8A8A93` · T2 `#5C9E6E` · T3 `#5E8FD4` · T4 `#C476E8` (legendary = gold-trimmed T4 frame)
  - fake-item whisper: items that are fake show NO visual difference to anyone except a private owner-only ribbon (see 4.4).
- **Type:** system stack only — UI sans (`system-ui`), numerals tabular for prices/timers. No webfonts.
- **Texture:** subtle CSS noise via repeating radial-gradient; no image backgrounds for panels (keep load light).
- **Shape language:** 8px radius cards, 1px borders `rgba(212,162,78,.18)`, gold hairline dividers.

## 2. Screen Map & Flow

```
Auth ──► Character Select (first deploy) ──► House Browser ──► Auction Hall
                ▲                                                    │
                └────────────── season end overlay ◄─────────────────┘
```

1. **AuthScreen** — split layout: left brand panel (logo, tagline, animated gavel glint), right login/register card with toggle. Errors inline.
2. **CharacterSelectScreen** — horizontal carousel of 6 bidder cards (portrait, name, passive, main ability, traits). Pick → goes to House Browser. Also reachable when deploying a new character.
3. **HouseBrowserScreen** — grid of house cards (§3.2). Player's deployments pinned on top with cooldown timers. "Deploy new" consumes a deploy slot (max 3).
4. **AuctionHallScreen** — the main game (§3.3). This is where players spend 95% of time.
5. **SeasonEndOverlay** — non-dismissable modal at season flip: "Season N Complete" banner, final fame/milestones earned, countdown to new season, gavel-slam animation, then reset view.

## 3. Layout Structure

### 3.1 Global chrome (Auction Hall top bar)
`[🏛 house switcher ▾] [ Season N · ends in 12d 4h (countdown ticks) ] ............ [💰 coins] [🌟 fame] [✦ xp] [⚙ logout]`
- Countdown turns gold under 24h, red under 1h. House switcher lists your deployments with live heat dots.

### 3.2 House Browser (lobby)
House card contents:
- House sigil (generated per-house, §5.4), name, specialty tag chip, fee rate, prime hour (UTC), member count, **heat meter** (5-segment bar from memberCount/HOUSE_CAP), live auctions/orders counts.
- Actions: "Enter" (deployed) / "Deploy character ▾" (slot available) / "Full" (at cap).

### 3.3 Auction Hall (main screen) — three columns, 12-col grid: `3 | 6 | 3`

**Left column — You:**
- **Character card**: portrait 96px, name, level ring (xp progress), passive text, redeploy cooldown timer if any.
- **Ability bar**: 3–4 slots (main + traits), icon + cooldown sweep + uses-left pips. Click → target picker modal if needed.
- **Inventory**: grid of item cards (64px tiles), filter chips (category / tier / tag), count badge. Click item → action sheet (List here / Fulfill order match highlights).
- **Open Box** button (box art icon + price); insufficient coins → disabled state.

**Center column — The Floor:**
- **Featured hero slot** (top, only when a featured auction is live): large item art, pulsing gold frame, "FEATURED" badge, countdown, bid panel.
- **Live auctions feed**: cards sorted by endsAt. Each card: item art, name, tier frame, tag chips, current bid (tabular), min-bid hint, countdown ring (ticks red <30s), bid input + button, bidder count, **ability buttons contextual to this auction** (peek/shield/etc. if off cooldown).
- Settled auctions collapse to a toast trail ("You won Vintage Orb for 320").

**Right column — The Board:**
- **Orders board**: 6 order cards. Each: requirement chips (tag/category + tier + fake-allowed skull icon), reward row (coins/fame/xp), "Fulfill" enabled when your inventory matches (server-validated anyway).
- **House ledger**: fee rate, specialty, heat, member list (name + character avatar chip).

### 3.4 Modals & overlays
- **BoxRevealOverlay**: darkened room, box art center, shake → lid pop → item card rises with tier-colored glow + fanfare text ("LEGENDARY"). Skip on click.
- **AbilityTargetModal**: list of valid targets (auction peek → pick auction; block → pick player).
- **BidConfirmInline** (not a modal): double-click bid or bid > 30% of your coins asks inline confirm.
- **Toasts**: top-right stack, 4s, success gold / error red.

## 4. Interaction & Motion Spec

- **Countdown rings**: SVG stroke-dashoffset, 1s tick.
- **Bid placed**: card pulses gold, current bid flips with a 150ms rise animation.
- **Anti-snipe extension**: ring flashes + "+5s" chip floats up.
- **Settle**: gavel icon slams (scaleY squash + screen-edge vignette flash 120ms), winner toast.
- **Ability activation**: icon flashes gem-purple, target line animates to the auction card.
- **Featured start**: hero slot slides down with gold shimmer sweep.
- **Cooldown sweep**: conic-gradient mask rotating.
- All motion ≤250ms, `ease-out`, respect `prefers-reduced-motion`.

## 4.4 Authenticity UX (critical privacy surface)
- Own inventory items that are fake: tiny corner ribbon "⚠ unverified" visible ONLY to the owner (client knows own fake flags from private state — never render fake status derived from public state).
- Auction cards NEVER show authenticity for others' items. Peek/Appraise ability result renders as a temporary gold "appraised" seal on that auction card for the peeker only.

## 5. Asset Manifest

Two generation tracks — **SVG** (icons, frames, chrome; crisp, dependency-free) and **imagegen** (portraits, item art, box art; painterly, then chroma-keyed). All assets land in `client-assets/` with exact filenames below. imagegen assets: flat magenta `#FF00FF` background → chroma-key to alpha → preserve authored RGB (do NOT whiten — these are drawn as-is).

### 5.1 SVG icons (`assets/icons/`, 24×24 viewBox, stroke 1.5, currentColor, `shape-rendering="crispEdges"` off — these are smooth icons)
| file | subject |
|---|---|
| `logo.svg` | gavel + house crest wordmark mark (also favicon) |
| `coin.svg` `fame.svg` `xp.svg` | currency trio (coin stack, laurel, star) |
| `box-basic.svg` `box-fine.svg` | loot box tiers |
| `order.svg` | clipboard/quill |
| `gavel.svg` | settle slam icon |
| `featured.svg` | gold starburst rosette |
| `peek.svg` `shield.svg` `refund.svg` `tax.svg` `block.svg` `appraise.svg` `coin-ability.svg` `cooldown.svg` | 8 ability verb icons (20 abilities reuse these verbs) |
| `skull.svg` | fake-allowed order marker |
| `heat-*.svg` | 5 heat segments (or 1 segment tinted via CSS) |
| `timer.svg` `bid.svg` `list.svg` | utility |

### 5.2 Item art — imagegen (`assets/items/`, 256×256, centered, magenta-keyed)
One painted illustration per **category+tier** = 20 files: `art-{category}-{tier}.png` (categories: art, relic, tech, fashion, oddity; tiers 1–4). Style: painterly still-life on dark velvet, dramatic single light source, gem-like rim light for T3+, gold leaf accents for T4. Item *instances* reuse category art + tier frame + name — no per-instance art needed at this scale.

### 5.3 Character portraits — imagegen (`assets/characters/`, 512×512 bust, magenta-keyed)
`mara.png brick.png june.png rex.png nia.png sol.png` — noir auction-house bidders, waist-up, art-deco backdrop hints, each with a signature color: Mara violet, Brick rust, Jade-green June, Rex gold, Nia black-silver, Sol azure.

### 5.4 House sigils — procedural SVG (`assets/sigils/`, generated at runtime OR shipped set)
Deterministic sigil from house name hash: shield shape + 2 symbols from a 12-glyph set + specialty-tag tint. Ship `sigil-base.svg` + `glyph-*.svg` ×12; client composes. No imagegen needed.

### 5.5 Tier frames & ribbons — SVG (`assets/frames/`)
`t1.svg … t4.svg` (card borders, 4:5 ratio, T4 gold-animated via SMIL or CSS), `ribbon-fake-owner.svg` (owner-only warning ribbon), `seal-appraised.svg`.

### 5.6 Totals
- SVG: ~35 files, all hand/deterministic.
- imagegen: 26 PNGs (20 items + 6 portraits), chroma-key pipeline, manifest + per-file verification (dims, alpha coverage, magenta remnants ≈ 0, RGB spread > 30).

## 6. Implementation Order for Codex Runs

1. **Run A (assets):** generate all SVGs + run imagegen pipeline for 26 PNGs with verification manifest. No game-code changes.
2. **Run B (UI overhaul):** restyle to §1 palette/type, rebuild screens per §2–3, wire modals/motion per §4, integrate assets from Run A, keep protocol as-is (except iter-3 house messages).
3. **Run C (QA):** screenshot sweep at 1440×900 + 390×844 (narrow: single-column, bottom nav), Codex-as-art-director review, fix pass.

## 7. Acceptance Criteria

- Every screen in §2 reachable and styled; no unstyled protocol dumps anywhere.
- Asset manifest: all files present, correct dims, alpha-clean (imagegen), valid SVG.
- Privacy spot-check: public auction HTML/WS payloads contain no fake flags or seller names on live auctions (grep the WS frames in a smoke run).
- `npm run build` + extended smoke green; screenshots attached in handoff.
