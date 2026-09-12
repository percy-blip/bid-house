import type { AbilityDefinition, Character, DeploymentView, HouseSummary, Item, MarketHistory, MarketSummary, MemberOrder, Order, PrivateState, PublicAuction, PublicState, ServerConfig, ServerMessage } from "../shared/types.js";
type Tab = "bidder" | "inventory" | "order" | "market" | "house";
const tabs: Array<{
    id: Tab;
    label: string;
    icon: string;
}> = [{ id: "bidder", label: "Bidder", icon: "♟" }, { id: "inventory", label: "Inventory", icon: "◆" }, { id: "order", label: "Order", icon: "▤" }, { id: "market", label: "Market record", icon: "⌁" }, { id: "house", label: "Trade house", icon: "♜" }];
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const esc = (v: string) => v.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const asset = (p: string) => `/client-assets/${p}`, fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
let socket: WebSocket, state: PublicState | undefined, priv: PrivateState | undefined, config: ServerConfig | undefined, orders: MemberOrder[] = [], market: MarketSummary | undefined, marketHistory: MarketHistory | undefined;
let registerMode = false, authenticating = false, selectedCharacter = 0, pendingCharacter: string | undefined, active: Tab = "bidder", firstPick = false, houseDirectory = false;
const ui = { inventorySearch: "", inventoryCategory: "all", inventoryTier: "all", inventoryTag: "all", orderHouse: "all", orderFulfillable: false, marketSearch: "", marketCategory: "all", marketTier: "all", selectedTemplate: "", scroll: {} as Record<Tab, number> };
const send = (message: object) => { if (socket?.readyState === WebSocket.OPEN)
    socket.send(JSON.stringify(message)); };
const ability = (id: string) => state?.abilities.find(a => a.id === id);
const art = (category: string, tier: number) => asset(`items/art-${category.toLowerCase()}-${tier}.png`);
const char = (id: string) => state?.characters.find(c => c.id === id);
const house = (id: string) => state?.houses.find(h => h.id === id);
const shortTime = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return s >= 86400 ? `${Math.floor(s / 86400)}d ${Math.floor(s % 86400 / 3600)}h` : s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor(s % 3600 / 60)}m` : s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`; };
const tagList = (v: string[]) => `<div class="tags">${v.map(x => `<span class="tag">${esc(x)}</span>`).join("")}</div>`;
const itemArt = (i: {
    category: string;
    tier: number;
    name: string;
}) => `<div class="item-art t${i.tier}"><img src="${art(i.category, i.tier)}" alt="${esc(i.name)}"></div>`;
function toast(message: string, type: "success" | "error" | "info" = "info") { const el = document.createElement("div"); el.className = `toast ${type}`; el.textContent = message; $("toasts").append(el); setTimeout(() => el.remove(), 4000); }
function show(kind: "account" | "character" | "app") { for (const id of ["accountView", "characterView", "appView"])
    $(id).classList.toggle("hidden", id !== `${kind}View`); $("topbar").classList.toggle("hidden", kind !== "app"); $("mobileNav").classList.toggle("hidden", kind !== "app"); }
function connect() {
    socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`);
    socket.onopen = () => { $("connection").textContent = "Connected"; const token = localStorage.getItem("bidHouseToken"); if (token) {
        authenticating = true;
        send({ type: "AUTH", token });
    }
    else
        show("account"); };
    socket.onclose = () => { $("connection").textContent = "Reconnecting"; setTimeout(connect, 1000); };
    socket.onmessage = e => handle(JSON.parse(String(e.data)) as ServerMessage);
}
function handle(m: ServerMessage) {
    if (m.type === "AUTH_OK") {
        authenticating = false;
        firstPick = m.needsCharacter;
        if (firstPick) {
            selectedCharacter = 0;
            renderCharacters();
            show("character");
        }
        else {
            show("app");
            requestReads();
        }
    }
    else if (m.type === "HOUSE_LIST") {
        if (state)
            state.houses = m.houses;
        renderAll();
    }
    else if (m.type === "CONFIG") {
        config = m.config;
        renderAll();
    }
    else if (m.type === "MEMBER_ORDERS") {
        orders = m.orders;
        renderOrders();
    }
    else if (m.type === "MARKET_SUMMARY") {
        market = m.summary;
        renderMarket();
    }
    else if (m.type === "MARKET_HISTORY") {
        marketHistory = m.history;
        renderMarket();
    }
    else if (m.type === "WELCOME") {
        priv = m.privateState;
        show("app");
        requestReads();
        if (firstPick) {
            firstPick = false;
            navigate("bidder", true);
        }
        else if (state?.currentHouse)
            navigate("house", true);
        renderAll();
    }
    else if (m.type === "STATE") {
        state = m.publicState;
        renderCharacters();
        renderAll();
    }
    else if (m.type === "PRIVATE") {
        const old = new Set(priv?.items.map(i => i.id) ?? []);
        priv = m.privateState;
        const revealed = priv.items.find(i => !old.has(i.id));
        if (m.message)
            toast(m.message, "success");
        if (revealed && m.message?.startsWith("Opened"))
            showReveal(revealed);
        requestReads();
        renderAll();
    }
    else if (m.type === "ERROR") {
        if (authenticating) {
            localStorage.removeItem("bidHouseToken");
            show("account");
        }
        $("authError").textContent = m.message;
        toast(m.message, "error");
    }
    else if (m.type === "ANNOUNCEMENT")
        toast(m.message);
    else if (m.type === "FEATURED")
        toast("A featured lot has taken the spotlight", "success");
    else if (m.type === "SEASON_END")
        toast(`Season ${m.number} complete`, "success");
}
function requestReads() { send({ type: "CONFIG" }); send({ type: "MEMBER_ORDERS" }); send({ type: "MARKET_SUMMARY" }); }
function navMarkup() { return tabs.map(t => `<a href="#${t.id}" data-nav="${t.id}" class="${active === t.id ? "active" : ""}"><span aria-hidden="true">${t.icon}</span><b>${t.label}</b></a>`).join(""); }
function navigate(tab: Tab, replace = false) { if (!tabs.some(t => t.id === tab))
    tab = "bidder"; ui.scroll[active] = scrollY; active = tab; if (replace)
    history.replaceState(null, "", `#${tab}`);
else if (location.hash !== `#${tab}`)
    history.pushState(null, "", `#${tab}`); renderAll(); requestAnimationFrame(() => scrollTo(0, ui.scroll[tab] ?? 0)); }
function renderChrome() { if (!state || !priv)
    return; $("coins").textContent = fmt(priv.player.coins); $("season").textContent = `Season ${state.season.number}`; $("desktopNav").innerHTML = navMarkup(); $("mobileNav").innerHTML = navMarkup(); for (const id of tabs.map(t => t.id))
    $(`${id}Tab`).classList.toggle("hidden", id !== active); }
function renderAll() { if (!state || !priv)
    return; renderChrome(); renderBidder(); renderInventory(); renderOrders(); renderMarket(); renderHouses(); }
function pageHead(kicker: string, title: string, sub: string, action = "") { return `<header class="page-head"><div><p class="kicker">${kicker}</p><h1>${title}</h1><p class="muted">${sub}</p></div>${action}</header>`; }
function levelProgress(d: DeploymentView) { const factor = config?.levelXpFactor ?? 100, spent = factor * (d.level - 1) * d.level / 2, next = d.level < (config?.levelCap ?? 20) ? factor * d.level : 0, pct = next ? Math.min(100, (d.xp - spent) / next * 100) : 100; return `<div class="xp-line"><span>Level ${d.level}</span><span>${fmt(d.xp)} XP</span></div><div class="progress"><i style="width:${pct}%"></i></div>`; }
function abilityCards(c: Character, d?: DeploymentView) { return [c.mainAbility, ...c.traits].map(id => { const a = ability(id); if (!a)
    return ""; const slot = priv!.player.abilities[id], remaining = Math.max(0, (slot?.readyAt ?? 0) - Date.now()), uses = a.maxUses === undefined ? "Unlimited uses" : `${Math.max(0, a.maxUses - (slot?.uses ?? 0))} uses left`; return `<div class="ability-chip"><b>${esc(a.name)}</b><span>${remaining ? shortTime(remaining) : "Ready"} · ${uses}</span><small>${Math.round(a.cooldownMs * (d?.cooldownMultiplier ?? 1) / 1000)}s cooldown</small></div>`; }).join(""); }
function renderBidder() {
    if (!state || !priv)
        return;
    const deployed = new Set(priv.deployments.map(d => d.characterId)), owned = state.characters.filter(c => priv!.player.roster.includes(c.id) && !deployed.has(c.id)), allOwned = priv.player.roster.length >= state.characters.length, cost = config?.bidderPullCost ?? 150;
    $("bidderTab").innerHTML = pageHead("YOUR ROSTER", "Bidder", `Season ${state.season.number} · ${priv.deployments.length}/${config?.maxDeploys ?? 3} deployed`, `<button id="pullBidder" class="primary" ${allOwned || priv.player.coins < cost ? "disabled" : ""}>Pull bidder · ${cost} coins</button>`) +
        `<section><div class="section-heading"><h2>Your deployments</h2></div><div class="deployment-list">${priv.deployments.length ? priv.deployments.map(d => { const c = char(d.characterId)!, h = house(d.houseId), lock = d.redeployCooldownUntil > Date.now(); return `<article class="deployment-card"><img src="${asset(`characters/${c.id}.png`)}" alt="${esc(c.name)}"><div class="deployment-info"><div class="title-row"><div><h3>${esc(c.name)}</h3><p>${esc(h?.name ?? "Unknown house")}</p></div><span class="status ${lock ? "warn" : ""}">${lock ? `Locked ${shortTime(d.redeployCooldownUntil - Date.now())}` : "Active"}</span></div>${levelProgress(d)}<div class="ability-row">${abilityCards(c, d)}</div><div class="actions"><button data-enter="${d.houseId}" class="primary">Enter house</button><button data-move="${d.characterId}" ${lock ? "disabled" : ""}>Move</button><button data-recall="${d.characterId}" class="danger">Recall</button></div></div></article>`; }).join("") : `<div class="empty"><h3>No active deployments</h3><p>Choose an owned bidder, then send them to a trade house.</p></div>`}</div></section>
  <section><div class="section-heading"><h2>Available bidders</h2><span>${owned.length} idle</span></div><div class="roster-grid">${owned.length ? owned.map(c => bidderTile(c)).join("") : `<p class="empty">${allOwned ? "Every owned bidder is deployed." : "Pull another bidder to grow your roster."}</p>`}</div></section>`;
    $("pullBidder").onclick = () => send({ type: "PULL_BIDDER" });
    wireCommon($("bidderTab"));
    $("bidderTab").querySelectorAll<HTMLButtonElement>("[data-move]").forEach(b => b.onclick = () => openHousePicker(b.dataset.move!));
    $("bidderTab").querySelectorAll<HTMLButtonElement>("[data-recall]").forEach(b => b.onclick = () => confirmRecall(b.dataset.recall!));
    $("bidderTab").querySelectorAll<HTMLButtonElement>("[data-detail-character]").forEach(b => b.onclick = () => openCharacter(b.dataset.detailCharacter!));
    $("bidderTab").querySelectorAll<HTMLButtonElement>("[data-deploy-character]").forEach(b => b.onclick = () => openHousePicker(b.dataset.deployCharacter!, true));
}
function bidderTile(c: Character) { return `<article class="bidder-tile"><button class="portrait-button" data-detail-character="${c.id}"><img src="${asset(`characters/${c.id}.png`)}" alt="${esc(c.name)}"></button><h3>${esc(c.name)}</h3><p>${esc(c.passive)}</p>${tagList(c.traits.map(x => ability(x)?.name ?? x))}<button data-deploy-character="${c.id}" class="primary" ${priv!.deployments.length >= (config?.maxDeploys ?? 3) || ((priv!.player.movePenaltyUntil[c.id] ?? 0) > Date.now()) ? "disabled" : ""}>Choose house</button></article>`; }
function openCharacter(id: string) { const c = char(id); if (!c)
    return; openModal(`<p class="kicker">BIDDER DETAIL</p><div class="character-detail"><img src="${asset(`characters/${c.id}.png`)}" alt=""><div><h2>${esc(c.name)}</h2><p>${esc(c.passive)}</p></div></div><div class="ability-stack">${abilityCards(c, priv?.deployments.find(d => d.characterId === id))}</div>`); }
function openHousePicker(characterId: string, deploy = false) { const lock = priv!.player.movePenaltyUntil[characterId] ?? 0; if (lock > Date.now()) {
    toast(`Redeploy available in ${shortTime(lock - Date.now())}`, "error");
    return;
} openModal(`<p class="kicker">${deploy ? "CHOOSE HOUSE" : "MOVE BIDDER"}</p><h2>Send ${esc(char(characterId)?.name ?? characterId)}</h2><div class="picker-list">${state!.houses.filter(h => !priv!.deployments.some(d => d.characterId === characterId && d.houseId === h.id)).map(h => `<button data-pick-house="${h.id}" ${h.memberCount >= (config?.houseCap ?? 20) ? "disabled" : ""}><b>${esc(h.name)}</b><span>${Math.round(h.heat * 100)}% heat · ${h.memberCount} members</span></button>`).join("")}</div>`); $("modalContent").querySelectorAll<HTMLButtonElement>("[data-pick-house]").forEach(b => b.onclick = e => { e.preventDefault(); send(deploy ? { type: "DEPLOY", houseId: b.dataset.pickHouse, characterId } : { type: "REDEPLOY", toHouseId: b.dataset.pickHouse, characterId }); closeModal(); }); }
function confirmRecall(id: string) { openModal(`<p class="kicker">RECALL BIDDER</p><h2>Recall ${esc(char(id)?.name ?? id)}?</h2><p>They return idle immediately and cannot deploy again for 24 hours.</p><button id="confirmRecall" class="danger wide">Recall bidder</button>`); $("confirmRecall").onclick = e => { e.preventDefault(); send({ type: "RECALL", characterId: id }); closeModal(); }; }
function renderInventory() {
    if (!priv || !state)
        return;
    const categories = [...new Set(priv.items.map(i => i.category))], tags = [...new Set(priv.items.flatMap(i => i.tags))].sort(), items = priv.items.filter(i => (!ui.inventorySearch || i.name.toLowerCase().includes(ui.inventorySearch.toLowerCase())) && (ui.inventoryCategory === "all" || i.category === ui.inventoryCategory) && (ui.inventoryTier === "all" || String(i.tier) === ui.inventoryTier) && (ui.inventoryTag === "all" || i.tags.includes(ui.inventoryTag)));
    $("inventoryTab").innerHTML = pageHead("PRIVATE COLLECTION", "Inventory", `${priv.items.length} items · authenticity is visible only to you`) + `<div class="box-strip"><img src="${asset("icons/box-basic.svg")}" alt=""><div><b>${priv.player.boxes} box${priv.player.boxes === 1 ? "" : "es"}</b><span>${priv.player.boxes ? "A sealed acquisition awaits." : `Auto-buy costs ${config?.boxPrice ?? 100} coins.`}</span></div><button id="openBox" class="primary" ${!priv.player.boxes && priv.player.coins < (config?.boxPrice ?? 100) ? "disabled" : ""}>${priv.player.boxes ? "Open box" : `Buy & open · ${config?.boxPrice ?? 100}`}</button></div>
  <div class="filters"><input id="inventorySearch" type="search" placeholder="Search collection" value="${esc(ui.inventorySearch)}"><select id="inventoryCategory"><option value="all">All categories</option>${categories.map(x => `<option ${ui.inventoryCategory === x ? "selected" : ""}>${x}</option>`).join("")}</select><select id="inventoryTier"><option value="all">All tiers</option>${[1, 2, 3, 4].map(x => `<option value="${x}" ${ui.inventoryTier === String(x) ? "selected" : ""}>Tier ${x}</option>`).join("")}</select><select id="inventoryTag"><option value="all">All tags</option>${tags.map(x => `<option ${ui.inventoryTag === x ? "selected" : ""}>${x}</option>`).join("")}</select></div>
  <div class="item-grid">${items.length ? items.map(i => `<button class="item-card t${i.tier}" data-item="${i.id}">${itemArt(i)}${i.fake ? `<img class="fake-ribbon" src="${asset("frames/ribbon-fake-owner.svg")}" alt="Fake — visible only to you">` : ""}<span><b>${esc(i.name)}</b><small>T${i.tier} · ${esc(i.category)}</small></span></button>`).join("") : `<div class="empty"><h3>No matching items</h3><button id="clearInventoryFilters">Clear filters</button></div>`}</div>`;
    $("openBox").onclick = () => send({ type: "OPEN_BOX" });
    bindFilter("inventorySearch", "inventorySearch", renderInventory);
    bindSelect("inventoryCategory", "inventoryCategory", renderInventory);
    bindSelect("inventoryTier", "inventoryTier", renderInventory);
    bindSelect("inventoryTag", "inventoryTag", renderInventory);
    $("clearInventoryFilters")?.addEventListener("click", () => { ui.inventorySearch = ""; ui.inventoryCategory = ui.inventoryTier = ui.inventoryTag = "all"; renderInventory(); });
    $("inventoryTab").querySelectorAll<HTMLButtonElement>("[data-item]").forEach(b => b.onclick = () => openItem(b.dataset.item!));
}
function openItem(id: string) { const i = priv!.items.find(x => x.id === id); if (!i)
    return; openModal(`<p class="kicker">ITEM DETAIL</p><div class="item-detail">${itemArt(i)}<div><h2>${esc(i.name)}</h2><p>Tier ${i.tier} · ${esc(i.category)}</p>${tagList(i.tags)}<p class="private-note">${i.fake ? "Private authenticity: fake" : "Private authenticity: genuine"}</p></div></div><div class="actions vertical"><button id="listItem" class="primary" ${priv!.deployments.length ? "" : "disabled"}>List item</button><button id="findOrders">Find matching orders</button><button id="viewMarket">View market record</button></div>`); $("listItem").onclick = e => { e.preventDefault(); openListing(i); }; $("findOrders").onclick = e => { e.preventDefault(); ui.orderFulfillable = true; closeModal(); navigate("order"); }; $("viewMarket").onclick = e => { e.preventDefault(); ui.selectedTemplate = `${i.category}:${i.tier}`; send({ type: "MARKET_HISTORY", templateKey: ui.selectedTemplate, limit: 20 }); closeModal(); navigate("market"); }; }
function openListing(i: Item) { openModal(`<p class="kicker">LIST ITEM</p><h2>${esc(i.name)}</h2><label>Trade house<select id="listingHouse">${priv!.deployments.map(d => `<option value="${d.houseId}">${esc(house(d.houseId)?.name ?? d.houseId)}</option>`).join("")}</select></label><label>Duration<input id="listingDuration" type="number" min="${config?.listingDurationMinSec ?? 30}" max="${config?.listingDurationMaxSec ?? 300}" value="${config?.listingDurationMinSec ?? 30}"></label><button id="confirmListing" class="primary wide">List item</button>`); $("confirmListing").onclick = e => { e.preventDefault(); send({ type: "LIST_ITEM", houseId: $<HTMLSelectElement>("listingHouse").value, itemId: i.id, durationSec: Number($<HTMLInputElement>("listingDuration").value) }); closeModal(); }; }
const matches = (o: Order, i: Item) => (!o.template.category || i.category === o.template.category) && (!o.template.tag || i.tags.includes(o.template.tag)) && i.tier >= o.template.tierMin && (o.template.fakeAllowed || !i.fake);
function renderOrders() {
    if (!state || !priv)
        return;
    const houseIds = [...new Set(orders.map(x => x.houseId))], rows = orders.filter(x => (ui.orderHouse === "all" || x.houseId === ui.orderHouse) && (!ui.orderFulfillable || priv!.items.filter(i => matches(x.order, i)).length >= x.order.template.count));
    $("orderTab").innerHTML = pageHead("MEMBER COMMISSIONS", "Order", `Orders from your deployed houses · Season ${state.season.number}`) + `<div class="filters"><select id="orderHouse"><option value="all">All my houses</option>${houseIds.map(id => `<option value="${id}" ${ui.orderHouse === id ? "selected" : ""}>${esc(house(id)?.name ?? id)}</option>`).join("")}</select><label class="check"><input id="orderFulfillable" type="checkbox" ${ui.orderFulfillable ? "checked" : ""}> Can fulfill</label></div><div class="order-grid">${rows.length ? rows.map(memberOrderCard).join("") : `<div class="empty"><h3>${priv.deployments.length ? "The board is quiet" : "Deploy a bidder to see orders"}</h3><p>${ui.orderFulfillable ? "Clear Can fulfill to see every accessible order." : "Orders only appear for houses where you have a bidder."}</p></div>`}</div>`;
    bindSelect("orderHouse", "orderHouse", renderOrders);
    $("orderFulfillable").onchange = e => { ui.orderFulfillable = (e.currentTarget as HTMLInputElement).checked; renderOrders(); };
    $("orderTab").querySelectorAll<HTMLButtonElement>("[data-order]").forEach(b => b.onclick = () => openFulfillment(b.dataset.house!, b.dataset.order!));
}
function memberOrderCard(m: MemberOrder) { const o = m.order, eligible = priv!.items.filter(i => matches(o, i)), req = o.template.category ?? `#${o.template.tag ?? "Any"}`; return `<article class="order-card"><div class="title-row"><div><p class="kicker">${esc(house(m.houseId)?.name ?? m.houseId)}</p><h3>${esc(req)} · Tier ${o.template.tierMin}+</h3></div><span class="count-badge">×${o.template.count}</span></div><div class="tags"><span class="tag">${o.template.fakeAllowed ? "Fakes accepted" : "Genuine required"}</span></div><div class="rewards"><span><b>${fmt(o.reward.coins)}</b> coins</span><span><b>${fmt(o.reward.fame)}</b> fame</span><span><b>${m.xpPaused ? 0 : o.reward.xp}</b> XP${m.xpPaused ? ` now · normally ${o.reward.xp}` : ""}</span></div><button data-order="${o.id}" data-house="${m.houseId}" class="primary" ${eligible.length < o.template.count ? "disabled" : ""}>Choose items · ${eligible.length} match</button></article>`; }
function openFulfillment(houseId: string, orderId: string) { const m = orders.find(x => x.houseId === houseId && x.order.id === orderId); if (!m)
    return; const eligible = priv!.items.filter(i => matches(m.order, i)), count = m.order.template.count; openModal(`<p class="kicker">FULFILL IN ${esc(house(houseId)?.name ?? houseId)}</p><h2>Choose exactly ${count} item${count === 1 ? "" : "s"}</h2><p>Selected items are consumed. The server revalidates every requirement.</p><div class="select-items">${eligible.map((i, n) => `<label class="select-item"><input type="checkbox" value="${i.id}" ${eligible.length === count || count === 1 && n === 0 ? "checked" : ""}>${itemArt(i)}<span>${esc(i.name)}</span></label>`).join("")}</div><button id="confirmFulfill" class="primary wide">Fulfill order</button>`); $("confirmFulfill").onclick = e => { e.preventDefault(); const ids = Array.from($("modalContent").querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked')).map(x => x.value); if (ids.length !== count) {
    toast(`Select exactly ${count} items`, "error");
    return;
} send({ type: "FULFILL_ORDER", houseId, orderId, itemIds: ids }); closeModal(); }; }
function renderMarket() {
    if (!state)
        return;
    if (!market) {
        $("marketTab").innerHTML = pageHead("PUBLIC ARCHIVE", "Market record", `Settled auction prices · Season ${state.season.number}`) + `<div class="empty">Loading market records…</div>`;
        return;
    }
    const rows = market.templates.filter(x => (!ui.marketSearch || x.name.toLowerCase().includes(ui.marketSearch.toLowerCase())) && (ui.marketCategory === "all" || x.category === ui.marketCategory) && (ui.marketTier === "all" || String(x.tier) === ui.marketTier)), selected = market.templates.find(x => x.templateKey === ui.selectedTemplate);
    $("marketTab").innerHTML = pageHead("PUBLIC ARCHIVE", "Market record", `Settled auction prices · Season ${market.season}`) + `<div class="filters"><input id="marketSearch" type="search" placeholder="Search templates" value="${esc(ui.marketSearch)}"><select id="marketCategory"><option value="all">All categories</option>${["Art", "Relic", "Tech", "Fashion", "Oddity"].map(x => `<option ${ui.marketCategory === x ? "selected" : ""}>${x}</option>`).join("")}</select><select id="marketTier"><option value="all">All tiers</option>${[1, 2, 3, 4].map(x => `<option value="${x}" ${ui.marketTier === String(x) ? "selected" : ""}>Tier ${x}</option>`).join("")}</select></div>${selected ? marketDetail(selected) : marketTable(rows)}`;
    bindFilter("marketSearch", "marketSearch", renderMarket);
    bindSelect("marketCategory", "marketCategory", renderMarket);
    bindSelect("marketTier", "marketTier", renderMarket);
    $("marketTab").querySelectorAll<HTMLButtonElement>("[data-template]").forEach(b => b.onclick = () => { ui.selectedTemplate = b.dataset.template!; marketHistory = undefined; send({ type: "MARKET_HISTORY", templateKey: ui.selectedTemplate, limit: 20 }); renderMarket(); });
    $("marketBack")?.addEventListener("click", () => { ui.selectedTemplate = ""; marketHistory = undefined; renderMarket(); });
    $("marketMore")?.addEventListener("click", () => send({ type: "MARKET_HISTORY", templateKey: ui.selectedTemplate, cursor: marketHistory?.nextCursor, limit: 20 }));
}
function marketTable(rows: MarketSummary["templates"]) { return `<div class="market-table"><div class="market-row header"><span>Item</span><span>Category</span><span>Tier</span><span>Average</span><span>Sales</span><span>Last price</span></div>${rows.map(x => `<button class="market-row" data-template="${x.templateKey}"><span class="market-name"><img src="${art(x.category, x.tier)}" alt=""><b>${esc(x.name)}</b></span><span>${x.category}</span><span>T${x.tier}</span><span>${x.averagePrice === null ? "No sales this season" : fmt(x.averagePrice)}</span><span>${x.count}</span><span>${x.lastPrice === null ? "—" : fmt(x.lastPrice)}</span></button>`).join("")}</div>`; }
function marketDetail(x: MarketSummary["templates"][number]) { return `<button id="marketBack" class="back">← All templates</button><article class="market-detail"><div class="template-hero">${itemArt(x)}<div><p class="kicker">${x.category} · TIER ${x.tier}</p><h2>${esc(x.name)}</h2><p>${x.count ? `${fmt(x.averagePrice!)} average from ${x.count} sale${x.count === 1 ? "" : "s"}` : "No sales this season"}</p></div></div><h3>Anonymous sale records</h3><div class="sale-list">${marketHistory ? marketHistory.rows.length ? marketHistory.rows.map(r => `<div><span>${new Date(r.settledAt).toLocaleString()}</span><b>${fmt(r.price)} coins</b>${tagList(r.tags)}</div>`).join("") : `<p class="empty">No sales this season.</p>` : `<p class="empty">Loading records…</p>`}</div>${marketHistory?.nextCursor ? `<button id="marketMore">Load more</button>` : ""}</article>`; }
function renderHouses() { if(houseDirectory&&state?.currentHouse){const current=state.currentHouse;delete state.currentHouse;renderHousesInternal();state.currentHouse=current;return;}renderHousesInternal(); }
function renderHousesInternal() { if (!state || !priv)
    return; const current = state.currentHouse; const mine = new Map(priv.deployments.map(d => [d.houseId, d])); $("houseTab").innerHTML = current ? renderFloor(current, mine.get(current.id)) : pageHead("THE DIRECTORY", "Trade house", `${priv.deployments.length}/${config?.maxDeploys ?? 3} deployment slots used`) + `<div class="house-grid">${state.houses.map(h => houseCard(h, mine.get(h.id))).join("")}</div>`; wireCommon($("houseTab")); $("houseTab").querySelectorAll<HTMLButtonElement>("[data-deploy-house]").forEach(b => b.onclick = () => { pendingCharacter = undefined; openBidderPicker(b.dataset.deployHouse!); }); $("houseBack")?.addEventListener("click", () => { send({ type: "HOUSE_LIST" }); if (state)
    delete state.currentHouse; renderHouses(); }); wireFloor(); }
function houseCard(h: HouseSummary, d?: DeploymentView) { const full = h.memberCount >= (config?.houseCap ?? 20); return `<article class="house-card ${d ? "mine" : "locked"}"><div class="house-sigil">♜</div><p class="kicker">${esc(h.specialtyTag ?? "OPEN SPECIALTY")}</p><h3>${esc(h.name)}</h3><div class="house-facts"><span><b>${Math.round(h.feeRate * 100)}%</b> fee</span><span><b>${String(h.primeHour).padStart(2, "0")}:00</b> UTC</span><span><b>${h.memberCount}</b> members</span></div><div class="heat"><i style="width:${h.heat * 100}%"></i></div><p>${h.liveAuctions} live lots · ${h.liveOrders} orders</p>${d ? `<p class="assigned">${esc(char(d.characterId)?.name ?? d.characterId)} deployed</p><button data-enter="${h.id}" class="primary">Enter house</button>` : `<p class="locked-copy">Internals hidden · send a bidder to inspect</p><button data-deploy-house="${h.id}" ${full ? "disabled" : ""}>${full ? "Full" : "Choose bidder"}</button>`}</article>`; }
function openBidderPicker(houseId: string) { const deployed = new Set(priv!.deployments.map(d => d.characterId)), available = state!.characters.filter(c => priv!.player.roster.includes(c.id) && !deployed.has(c.id) && (priv!.player.movePenaltyUntil[c.id] ?? 0) <= Date.now()); openModal(`<p class="kicker">DEPLOY TO ${esc(house(houseId)?.name ?? houseId)}</p><h2>Choose an idle bidder</h2><div class="picker-list">${available.map(c => `<button data-pick-bidder="${c.id}"><b>${esc(c.name)}</b><span>${esc(c.passive)}</span></button>`).join("") || `<p>No eligible idle bidders. Recall or move an active bidder from the Bidder tab.</p>`}</div>`); $("modalContent").querySelectorAll<HTMLButtonElement>("[data-pick-bidder]").forEach(b => b.onclick = e => { e.preventDefault(); send({ type: "DEPLOY", houseId, characterId: b.dataset.pickBidder }); closeModal(); }); }
function renderFloor(h: NonNullable<PublicState["currentHouse"]>, d?: DeploymentView) { const c = d ? char(d.characterId) : undefined, featured = h.auctions.find(a => a.featured), regular = h.auctions.filter(a => !a.featured); return `<button id="houseBack" class="back">← All houses</button><div class="hall-head"><div><p class="kicker">TRADE HOUSE · LIVE</p><h1>${esc(h.name)}</h1></div><span>${h.memberCount} members · ${Math.round(h.heat * 100)}% heat</span></div><div class="hall-layout"><aside class="hall-rail">${c && d ? `<img class="rail-portrait" src="${asset(`characters/${c.id}.png`)}" alt=""><h2>${esc(c.name)}</h2>${levelProgress(d)}<div class="ability-stack">${abilityCards(c, d)}</div>` : ""}</aside><section class="floor"><h2>Live lots</h2>${featured ? auctionCard(featured, true) : ""}<div class="auction-feed">${regular.length ? regular.map(a => auctionCard(a, false)).join("") : `<p class="empty">The floor is quiet.</p>`}</div></section><aside class="hall-rail"><p class="kicker">HOUSE FACTS</p><h2>${esc(h.specialtyTag ?? "Open specialty")}</h2><div class="house-facts vertical"><span><b>${Math.round(h.feeRate * 100)}%</b> listing fee</span><span><b>${String(h.primeHour).padStart(2, "0")}:00</b> prime UTC</span><span><b>${h.liveOrders}</b> standing orders</span></div><button data-goto-order class="wide">View house orders</button><h3>In the room</h3><div class="members">${h.members.map(m => `<span><img src="${asset(`characters/${m.characterId}.png`)}" alt="">${esc(m.playerName)}</span>`).join("")}</div></aside></div>`; }
function auctionCard(a: PublicAuction, featured: boolean) { return `<article class="auction-card ${featured ? "featured" : ""}">${itemArt(a.item)}<div><p class="kicker">${featured ? "FEATURED LOT" : "LIVE LOT"}</p><h3>${esc(a.item.name)}</h3>${tagList(a.item.tags)}<div class="bid-state"><span><small>Current bid</small><b>${a.currentBid ? fmt(a.currentBid) : "No bids"}</b></span><span class="timer" data-end="${a.endsAt}">${shortTime(a.endsAt - Date.now())}</span></div><div class="bid-controls"><input id="bid-${a.id}" type="number" min="${a.minBid}" value="${a.minBid}" aria-label="Bid amount"><button data-bid="${a.id}" class="primary">Bid</button></div></div></article>`; }
function wireFloor() { $("houseTab").querySelectorAll<HTMLButtonElement>("[data-bid]").forEach(b => b.onclick = () => send({ type: "BID", houseId: state!.currentHouse!.id, auctionId: b.dataset.bid, amount: Number($<HTMLInputElement>(`bid-${b.dataset.bid}`).value) })); $("houseTab").querySelectorAll<HTMLButtonElement>("[data-goto-order]").forEach(b => b.onclick = () => { ui.orderHouse = state!.currentHouse!.id; navigate("order"); }); }
function wireCommon(root: HTMLElement) { root.querySelectorAll<HTMLButtonElement>("[data-enter]").forEach(b => b.onclick = () => { houseDirectory = false; send({ type: "ENTER_HOUSE", houseId: b.dataset.enter }); navigate("house"); }); }
function bindFilter(id: keyof typeof ui, key: "inventorySearch" | "marketSearch", render: () => void) { const el = $<HTMLInputElement>(String(id)); el.oninput = () => { ui[key] = el.value; render(); requestAnimationFrame(() => { const n = $<HTMLInputElement>(String(id)); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }); }; }
function bindSelect(id: string, key: "inventoryCategory" | "inventoryTier" | "inventoryTag" | "orderHouse" | "marketCategory" | "marketTier", render: () => void) { $<HTMLSelectElement>(id).onchange = e => { ui[key] = (e.currentTarget as HTMLSelectElement).value; render(); }; }
function openModal(html: string) { $("modalContent").innerHTML = html; $<HTMLDialogElement>("modal").showModal(); }
function closeModal() { $<HTMLDialogElement>("modal").close(); }
function showReveal(i: Item) { $("revealItem").innerHTML = `${itemArt(i)}<h2>${esc(i.name)}</h2><p>Tier ${i.tier} · ${esc(i.category)}</p>`; $("boxReveal").classList.remove("hidden"); }
function renderCharacters(scroll = false) { if (!state?.characters.length)
    return; selectedCharacter = (selectedCharacter + state.characters.length) % state.characters.length; $("characterCarousel").innerHTML = state.characters.map((c, n) => `<article class="character-card ${n === selectedCharacter ? "selected" : ""}"><img src="${asset(`characters/${c.id}.png`)}" alt="${esc(c.name)}"><div><p class="kicker">BIDDER ${String(n + 1).padStart(2, "0")}</p><h2>${esc(c.name)}</h2><p>${esc(c.passive)}</p>${tagList(c.traits.map(x => ability(x)?.name ?? x))}</div></article>`).join(""); $("carouselCount").textContent = `${selectedCharacter + 1} / ${state.characters.length}`; if (scroll)
    requestAnimationFrame(() => $("characterCarousel").children[selectedCharacter]?.scrollIntoView({ block: "nearest", inline: "center" })); }
$("accountForm").addEventListener("submit", async (e) => { e.preventDefault(); $("authError").textContent = ""; try {
    const response = await fetch(registerMode ? "/api/register" : "/api/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: $<HTMLInputElement>("username").value, password: $<HTMLInputElement>("password").value }) }), body = await response.json() as {
        token?: string;
        error?: string;
    };
    if (!response.ok || !body.token)
        throw new Error(body.error ?? "Authentication failed");
    localStorage.setItem("bidHouseToken", body.token);
    authenticating = true;
    send({ type: "AUTH", token: body.token });
}
catch (error) {
    $("authError").textContent = error instanceof Error ? error.message : "Authentication failed";
} });
$("accountToggle").onclick = () => { registerMode = !registerMode; $("accountTitle").textContent = registerMode ? "Request membership" : "Welcome back"; $("accountSubmit").textContent = registerMode ? "Create account" : "Enter the house"; $("accountToggle").textContent = registerMode ? "Already a member? Log in" : "New bidder? Request membership"; };
$("characterPrev").onclick = () => { selectedCharacter--; renderCharacters(true); };
$("characterNext").onclick = () => { selectedCharacter++; renderCharacters(true); };
$("confirmCharacter").onclick = () => { const c = state?.characters[selectedCharacter]; if (!c || !state)
    return; pendingCharacter = c.id; openModal(`<p class="kicker">FIRST DEPLOYMENT</p><h2>Choose ${esc(c.name)}'s first house</h2><p>You will land in Bidder after deployment.</p><div class="picker-list">${state.houses.map(h => `<button data-first-house="${h.id}"><b>${esc(h.name)}</b><span>${Math.round(h.heat * 100)}% heat · ${h.memberCount} members</span></button>`).join("")}</div>`); $("modalContent").querySelectorAll<HTMLButtonElement>("[data-first-house]").forEach(b => b.onclick = e => { e.preventDefault(); send({ type: "DEPLOY", houseId: b.dataset.firstHouse, characterId: c.id }); closeModal(); }); };
$("logout").onclick = () => { localStorage.removeItem("bidHouseToken"); location.reload(); };
$("skipReveal").onclick = () => $("boxReveal").classList.add("hidden");
document.addEventListener("click", e => { const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("[data-nav]"); if (a) {
    e.preventDefault();
    navigate(a.dataset.nav as Tab);
} });
document.addEventListener("click",e=>{if((e.target as HTMLElement).closest("#houseBack"))houseDirectory=true;},{capture:true});
addEventListener("hashchange", () => navigate((location.hash.slice(1) || "bidder") as Tab, true));
setInterval(() => { document.querySelectorAll<HTMLElement>("[data-end]").forEach(el => el.textContent = shortTime(Number(el.dataset.end) - Date.now())); if (state)
    $("season").textContent = `Season ${state.season.number}`; }, 1000);
active = (tabs.some(t => t.id === location.hash.slice(1)) ? location.hash.slice(1) : "bidder") as Tab;
connect();
