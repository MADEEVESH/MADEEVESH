const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { parseHTML } = require("linkedom");

const script = fs.readFileSync(path.join(__dirname, "../www/plan-policy.js"), "utf8");
vm.runInThisContext(script);

function page(html, pathname) {
  const { document } = parseHTML(`<!doctype html><html><head></head><body>${html}</body></html>`);
  const result = globalThis.applyStorePolicy(document, { pathname });
  return { document, result };
}

function hidden(el) {
  return el.getAttribute("data-servicesite-hidden") === "1" || el.style.display === "none";
}

const planHtml = `
  <h1 class="text-4xl">Choose your plan</h1>
  <p class="mt-2 text-sm text-muted-foreground">Billed monthly in USD. Cancel any time.</p>
  <p class="mt-4 rounded-lg bg-muted p-3 text-sm">Building and previewing is free — a plan is only needed to publish your website online.</p>
  <div class="mt-8 grid gap-6 md:grid-cols-2">
    <div class="rounded-2xl border bg-card p-8 shadow-soft border-accent">
      <h2 class="text-3xl">Beginner</h2>
      <p class="mt-1 text-muted-foreground">For getting your business online.</p>
      <p class="mt-6 text-4xl">$19.99<span class="text-sm text-muted-foreground"> / month</span></p>
      <ul><li>✓ Up to 2 websites</li></ul>
      <button type="button">Current plan</button>
    </div>
    <div class="rounded-2xl border bg-card p-8 shadow-soft">
      <h2 class="text-3xl">Pro</h2>
      <p class="mt-1 text-muted-foreground">For growing and multi-location businesses.</p>
      <p class="mt-6 text-4xl">$39.99<span class="text-sm text-muted-foreground"> / month</span></p>
      <ul><li>✓ Up to 5 websites</li></ul>
      <button type="button">Switch to Pro</button>
    </div>
  </div>
  <div><button type="button">Cancel plan</button></div>
`;

test("plan page keeps the current plan and removes prices and purchase controls", () => {
  const { document, result } = page(planHtml, "/dashboard/plan");
  assert.equal(result.mode, "current");
  assert.equal(document.querySelector("h1").textContent, "Your plan");
  assert.match(document.getElementById("servicesite-plan-note").textContent, /not in this app/);

  const cards = [...document.querySelectorAll("div.rounded-2xl")];
  assert.equal(hidden(cards[0]), false);
  assert.equal(hidden(cards[1]), true);
  assert.equal(hidden(cards[0].querySelector("p.text-4xl")), true);
  assert.equal(cards[0].querySelector("h2").textContent, "Beginner");
  assert.equal(hidden(document.querySelector("button")), true);
  assert.equal([...document.querySelectorAll("button")].every(hidden), true);
  assert.equal(document.body.textContent.includes("$19.99") && hidden(cards[0].querySelector("p.text-4xl")), true);
  assert.doesNotMatch(document.body.innerHTML.replace(/data-servicesite-hidden="1"[\s\S]*?<\/p>/g, ""), /\$19\.99|\$39\.99/);
});

test("plan page with no subscription shows no catalog and no buy button", () => {
  const html = planHtml.replace("border-accent", "").replace(">Current plan<", ">Subscribe to Beginner<");
  const { document, result } = page(html, "/dashboard/plan?checkout=success");
  assert.equal(result.mode, "none");
  assert.equal([...document.querySelectorAll("div.rounded-2xl")].every(hidden), true);
  assert.equal([...document.querySelectorAll("button")].every(hidden), true);
  assert.match(document.getElementById("servicesite-plan-note").textContent, /does not sell plans/);
  assert.equal(document.querySelector("h1").textContent, "Your plan");
});

test("pricing page removes prices, purchase links, and price metadata", () => {
  const { document } = page(
    `<h1>Simple monthly plans</h1>
     <div class="rounded-2xl border bg-card p-8 shadow-soft">
       <h2>Pro</h2>
       <p>For growing and multi-location businesses.</p>
       <p class="mt-6 text-5xl">$39.99<span> / month</span></p>
       <a href="/auth">Get started</a>
     </div>`,
    "/pricing"
  );
  const meta = document.createElement("meta");
  meta.setAttribute("name", "description");
  meta.setAttribute("content", "Beginner $19.99 a month: up to 2 single-page websites.");
  document.head.appendChild(meta);
  const result = globalThis.applyStorePolicy(document, { pathname: "/pricing" });

  assert.equal(result.mode, "pricing");
  assert.equal(document.querySelector("h1").textContent, "Plans");
  assert.equal(hidden(document.querySelector("p.text-5xl")), true);
  const link = document.querySelector("a");
  assert.equal(hidden(link), true);
  assert.equal(link.hasAttribute("href"), false);
  assert.equal(meta.getAttribute("content").includes("$"), false);
  assert.match(document.getElementById("servicesite-plan-note").textContent, /not available in the app/);
});

test("dashboard and sign-in stay intact", () => {
  const { document, result } = page(
    `<h1>Dashboard</h1><a href="/pricing">Pricing</a><a href="/dashboard/plan">Plan</a><p>2 bookings today</p>`,
    "/dashboard"
  );
  assert.equal(result.mode, "pass");
  assert.equal(document.querySelector("h1").textContent, "Dashboard");
  assert.equal(hidden(document.querySelector("a[href='/dashboard/plan']")), false);
  assert.equal(document.querySelectorAll("a[href='/pricing']").length, 0);
  assert.equal(hidden(document.querySelector("a")), true);
  assert.equal(document.getElementById("servicesite-plan-note"), null);
});

test("applying the policy twice does not duplicate the note", () => {
  const { document } = page(planHtml, "/dashboard/plan");
  globalThis.applyStorePolicy(document, "/dashboard/plan");
  assert.equal(document.querySelectorAll("#servicesite-plan-note").length, 1);
});

test("a paddle checkout frame is removed from view", () => {
  const { document } = page(`<iframe src="https://buy.paddle.com/checkout"></iframe><h1>Editor</h1>`, "/editor/site");
  assert.equal(hidden(document.querySelector("iframe")), true);
});
