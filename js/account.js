const KNOWN = [
  {
    id: "production",
    label: "Aviation Blockchain Network - Production",
    origin: "https://portal.block.aero",
    host: "production",
  },
  {
    id: "sandbox",
    label: "Aviation Blockchain Network - Sandbox",
    origin: "https://sandbox.portal.block.aero",
    host: "sandbox",
  },
];

const state = {
  screen: "sign-in",
  host: "production",
  selectedId: "production",
  email: "",
  password: "",
  showPassword: false,
  code: "",
  forgotEmail: "",
  sentEmail: "",
  verifyMethod: "auth",
  fieldErrors: {},
  banner: "",
  codeStatus: "",
  resendIn: 0,
  dropdownOpen: false,
  palette: "ds",
  live: "",
  focusId: null,
  restore: null,
};

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function allNetworks() {
  return KNOWN;
}

function currentOrigin() {
  return state.host === "sandbox" ? KNOWN[1].origin : KNOWN[0].origin;
}

function selectedNetwork() {
  return allNetworks().find((network) => network.id === state.selectedId) || KNOWN[0];
}

function sameHost(network) {
  return network.origin === currentOrigin();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setHash(screen) {
  const next = `#/${screen}`;
  if (location.hash !== next) history.pushState(null, "", next);
}

function go(screen) {
  state.screen = screen;
  state.dropdownOpen = false;
  setHash(screen);
  render();
}

function navigateTo(network) {
  state.host = network.host === "sandbox" ? "sandbox" : "production";
  state.selectedId = network.id;
  state.email = "";
  state.password = "";
  state.code = "";
  state.showPassword = false;
  state.banner = "";
  state.fieldErrors = {};
  state.codeStatus = "";
  state.dropdownOpen = false;
  state.screen = "sign-in";
  state.focusId = "email";
  state.live = `This window is now ${network.origin}/account/login.`;
  setHash("sign-in");
  render();
}

function pickNetwork(id) {
  const network = allNetworks().find((item) => item.id === id);
  state.dropdownOpen = false;
  if (!network || sameHost(network)) {
    if (network) state.selectedId = network.id;
    state.focusId = "network";
    render();
    return;
  }
  navigateTo(network);
}

function submitSignIn() {
  const network = selectedNetwork();
  if (!sameHost(network)) {
    navigateTo(network);
    return;
  }

  const email = state.email.trim();
  const errors = {};
  if (!email) errors.email = "Required field";
  else if (!validEmail(email)) errors.email = "Invalid email";
  if (!state.password) errors.password = "Required field";

  if (state.password === "incorrect" && !errors.email) {
    state.banner = "";
    state.fieldErrors = {
      email: "Incorrect email",
      password: "Incorrect password",
    };
    render();
    return;
  }
  state.fieldErrors = errors;
  if (Object.keys(errors).length) {
    state.banner = "";
    render();
    return;
  }
  state.banner = "";
  state.code = "";
  state.codeStatus = "";
  state.fieldErrors = {};
  state.verifyMethod = email.toLowerCase().includes("auth@") ? "auth" : "email";
  go("security");
}

function submitSecurity() {
  state.fieldErrors = {};
  state.code = "";
  state.codeStatus = "";
  go(state.verifyMethod === "auth" ? "auth-code" : "email-code");
}

function submitForgot() {
  const email = state.forgotEmail.trim();
  if (!email) {
    state.fieldErrors = { forgotEmail: "Required field" };
    render();
    return;
  }
  if (!validEmail(email)) {
    state.fieldErrors = { forgotEmail: "Invalid email" };
    render();
    return;
  }
  state.fieldErrors = {};
  state.sentEmail = email;
  go("sent");
}

function submitCode() {
  const code = state.code.trim();
  if (!code) {
    state.fieldErrors = { code: "Required field" };
    state.codeStatus = "";
    render();
    return;
  }
  if (!/^\d{6}$/.test(code)) {
    state.fieldErrors = { code: "Code must be 6 digits." };
    state.codeStatus = "";
    render();
    return;
  }
  if (code === "000000") {
    state.fieldErrors = { code: "Invalid code. Check the code and try again." };
    state.codeStatus = "invalid";
    render();
    return;
  }
  if (code === "111111") {
    state.fieldErrors = { code: "Code expired. Request a new one." };
    state.codeStatus = "expired";
    render();
    return;
  }
  state.fieldErrors = {};
  state.codeStatus = "";
  state.code = "";
  state.live = "Sign-in succeeded. This prototype stops before the portal.";
  go("sign-in");
}

function dsIcon(paths, className) {
  const cls = className ? ` class="${className}"` : "";
  return `<svg${cls} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">${paths}</svg>`;
}

function iconEye(hidden) {
  const slash = hidden
    ? `<path d="M3.25 3.25 12.75 12.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`
    : "";
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M1.75 8c1.05-2.35 3.4-4 6.25-4s5.2 1.65 6.25 4c-1.05 2.35-3.4 4-6.25 4s-5.2-1.65-6.25-4Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="8" cy="8" r="1.75" stroke="currentColor" stroke-width="1.5"/>${slash}</svg>`;
}

function iconChevron() {
  return dsIcon(`<path fill="currentColor" d="M4.66669 6.66667L8.00002 10L11.3334 6.66667H4.66669Z"/>`);
}

function iconCheck() {
  return dsIcon(`<path fill="currentColor" d="M5.99998 10.78L3.21998 8L2.27332 8.94L5.99998 12.6667L14 4.66667L13.06 3.72667L5.99998 10.78Z"/>`, "check");
}

function iconArrowLeft() {
  return dsIcon(`<path fill="currentColor" d="M10.2733 11.06L7.21998 8L10.2733 4.94L9.33331 4L5.33331 8L9.33331 12L10.2733 11.06Z"/>`);
}

function backControl(label) {
  return `<button type="button" class="text-btn" data-action="back">${iconArrowLeft()}<span>${esc(label)}</span></button>`;
}

function fieldError(name) {
  return state.fieldErrors[name] ? `<p class="error" id="${name}-error">${esc(state.fieldErrors[name])}</p>` : "";
}

function networkField() {
  const network = selectedNetwork();
  const options = allNetworks().map((item, index) => {
    const selected = item.id === network.id;
    return `<button type="button" class="option" id="opt-${index}" role="option" aria-selected="${selected}" data-action="pick-network" data-id="${esc(item.id)}">
        <span>${esc(item.label)}</span>
        ${selected ? iconCheck() : ""}
      </button>`;
  }).join("");
  const menu = state.dropdownOpen ? `<div class="menu" role="listbox" aria-labelledby="network-label">${options}</div>` : "";

  return `<div class="field network">
    <div class="field-label"><span id="network-label">Network</span></div>
    <div class="select-wrap">
      <button type="button" class="select" id="network" data-action="toggle-network" aria-haspopup="listbox" aria-expanded="${state.dropdownOpen}" aria-labelledby="network-label network-value">
        <span id="network-value">${esc(network.label)}</span>
        ${iconChevron()}
      </button>
      ${menu}
    </div>
  </div>`;
}

function productShell(body) {
  const support = state.screen === "sign-in"
    ? ""
    : `<p class="support">Need help? <a href="mailto:support@block.aero">support@block.aero</a></p>`;
  return `<div class="shell">
    <div class="brand">
      <img src="assets/lockup-horizontal.svg" width="209" height="48" alt="Block Aero">
      <p class="tagline">A digital passport for every aero asset</p>
    </div>
    <div class="form-scroll">
      <div class="form-block">
        ${body}
      </div>
    </div>
    ${support}
  </div>`;
}

function signInHtml() {
  const emailErr = state.fieldErrors.email;
  const passErr = state.fieldErrors.password;
  return `<h1 class="headline">Sign in</h1>
    <form id="signin-form" novalidate>
      ${networkField()}
      <div class="field">
        <div class="field-label"><label for="email">Work Email Address</label></div>
        <input class="control" id="email" name="email" type="email" autocomplete="username" placeholder="Enter work email address" value="${esc(state.email)}" ${emailErr ? `aria-invalid="true" aria-describedby="email-error"` : ""}>
        ${fieldError("email")}
      </div>
      <div class="field">
        <div class="field-label">
          <label for="password">Password</label>
          <button type="button" class="inline-link" data-action="forgot">Forgot password?</button>
        </div>
        <div class="password-wrap">
          <input class="control" id="password" name="password" type="${state.showPassword ? "text" : "password"}" autocomplete="current-password" placeholder="Enter password" value="${esc(state.password)}" ${passErr ? `aria-invalid="true" aria-describedby="password-error"` : ""}>
          <button type="button" class="icon-btn" data-action="toggle-password" aria-label="${state.showPassword ? "Hide password" : "Show password"}">${iconEye(!state.showPassword)}</button>
        </div>
        ${fieldError("password")}
      </div>
      <button class="btn primary" type="submit">Sign in</button>
    </form>
    <p class="actions quiet">New to Block Aero? <a href="https://block.aero/get-started#request" target="_blank" rel="noopener noreferrer">Get started</a></p>`;
}

function securityHtml() {
  const auth = state.verifyMethod === "auth";
  return `${backControl("Back")}
    <h1 class="headline">Security Verification</h1>
    <p class="lede">Please select verification method</p>
    <form id="security-form" novalidate>
      <div class="radio-list" role="radiogroup" aria-label="Verification method">
        <button type="button" class="radio" role="radio" aria-checked="${auth}" data-action="verify-method" data-method="auth" id="verify-auth">
          <span class="radio-mark" aria-hidden="true"></span>
          <span>Google Authenticator</span>
        </button>
        <button type="button" class="radio" role="radio" aria-checked="${!auth}" data-action="verify-method" data-method="email" id="verify-email">
          <span class="radio-mark" aria-hidden="true"></span>
          <span>Email</span>
        </button>
      </div>
      <button class="btn primary" type="submit">Continue</button>
    </form>`;
}

function forgotHtml() {
  const err = state.fieldErrors.forgotEmail;
  return `${backControl("Back to Login Page")}
    <h1 class="headline">Forgot password</h1>
    <p class="lede">Enter the work email for your account. A reset link is sent from this network.</p>
    <form id="forgot-form" novalidate>
      <div class="field">
        <div class="field-label"><label for="forgot-email">Work Email Address</label></div>
        <input class="control" id="forgot-email" type="email" autocomplete="username" placeholder="Enter work email address" value="${esc(state.forgotEmail)}" ${err ? `aria-invalid="true" aria-describedby="forgotEmail-error"` : ""}>
        ${fieldError("forgotEmail")}
      </div>
      <button class="btn primary" type="submit">Send reset link</button>
    </form>`;
}

function sentHtml() {
  return `${backControl("Back to Login Page")}
    <h1 class="headline">Check your email</h1>
    <p class="lede">If an account exists for ${esc(state.sentEmail || "that address")}, a reset link is on its way. The link expires in 30 minutes.</p>`;
}

function codeHtml(kind) {
  const err = state.fieldErrors.code;
  const title = kind === "auth" ? "Authenticator code" : "Check your email";
  const lede = kind === "auth"
    ? "Enter the 6-digit code from your authenticator app."
    : `A 6-digit code was sent to ${esc(state.email || "your email")}. It expires in 10 minutes.`;
  const sent = state.codeStatus === "sent" ? `<p class="helper" role="status">Code sent.</p>` : "";
  const resendLabel = state.resendIn > 0 ? `Resend code in ${state.resendIn}s` : "Resend code";
  return `${backControl("Back")}
    <h1 class="headline">${title}</h1>
    <p class="lede">${lede}</p>
    <form id="code-form" novalidate>
      <div class="field">
        <div class="field-label"><label for="code">Verification code</label></div>
        <input class="control" id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6-digit code" value="${esc(state.code)}" ${err ? `aria-invalid="true" aria-describedby="code-error"` : ""}>
        ${fieldError("code")}
        ${sent}
      </div>
      <button class="btn primary" type="submit">Verify</button>
    </form>
    <p class="actions">
      <button type="button" class="linkish" id="resend" data-action="resend" ${state.resendIn > 0 ? "disabled" : ""}>${resendLabel}</button>
    </p>`;
}

function timeoutHtml() {
  return `${backControl("Back to Login Page")}
    <h1 class="headline">This link expired</h1>
    <p class="lede">Code expired. Request a new one by signing in again.</p>`;
}

function handoffHtml() {
  return `<article class="doc">
    <img class="doc-logo" src="assets/lockup-horizontal.svg" width="209" height="48" alt="Block Aero">
    <h1>Account sign-in</h1>
    <p>The release puts the new lockup, the tagline, and a network choice on the account shell that already exists. The button, fields, dialogs, type, and color roles stay the ones in the design system. The other account screens that share this layout come with it.</p>

    <h2>What ships</h2>
    <ul>
      <li>Lockup at 226px wide, intrinsic height, above the tagline. Headline is Sign in.</li>
      <li>Tagline, once: A digital passport for every aero asset</li>
      <li>Side photograph is the engine hangar still. The other two stills are not on the page yet.</li>
      <li>Network choice on the sign-in form, using the dropdown field.</li>
      <li>Forgot password, reset email, security verification method choice, email code, authenticator code, invalid code, expired code, and expired link.</li>
      <li>Incorrect credentials show field errors on email and password, not a page banner.</li>
    </ul>

    <h2>What stays on the system</h2>
    <ul>
      <li>Panel is background-primary-default, #F2F4F8. The proposed paper, #F3F5F8, is the same role.</li>
      <li>Button is background-accent-default, #286AD3. Hover is #1C4A94. The proposed #1C5FC0 is a comparison only.</li>
      <li>Sandbox is the same sign-in screen. There is no banner and no top line. Ember is not a token.</li>
      <li>Type is Open Sans. Body is 14/20. The page title is 32/40. Dialog titles are 24/32.</li>
      <li>Fields are the text, password, and dropdown fields.</li>
      <li>Errors follow the writing pattern: what went wrong, then what to do.</li>
      <li>Get started still opens https://block.aero/get-started#request. Support is still support@block.aero.</li>
    </ul>

    <h2>How a network change works</h2>
    <ul>
      <li>This page never signs a person in against another host. No password, code, or token is added to the address.</li>
      <li>Production opens https://portal.block.aero/account/login. Sandbox opens https://sandbox.portal.block.aero/account/login.</li>
      <li>Choosing the network you are already on stays on this page. Sign in submits on this host.</li>
      <li>Choosing another network opens that host’s sign-in address in this window. There is no confirmation. Email, password, and code are cleared and are not added to the address.</li>
      <li>The button stays Sign in. Sign-in always happens on the host shown in the address.</li>
    </ul>

    <h2>Networks</h2>
    <ul>
      <li>The list is Production and Sandbox. There is no way to add a network on this page.</li>
      <li>The screen list in the corner is for review. It is not part of the sign-in page.</li>
    </ul>

    <h2>Stage photographs</h2>
    <ul>
      <li>assets/engine-hangar.jpg — Engine hangar</li>
      <li>assets/rotable-store.jpg — Rotable store</li>
      <li>assets/engine-inspection.jpg — Engine inspection</li>
    </ul>
    <p>These are stand-ins in the same subjects as the hangar restyle. Replace the files and keep the names when the final stills arrive. The logo is assets/lockup-horizontal.svg.</p>

    <h2>Color comparison</h2>
    <p>The chips below show the design-system color and the proposed color together. Layout, type, and behavior stay on the design system.</p>
    <div class="swatches">
      <div class="swatch">
        <button type="button" class="btn primary" style="background:#286AD3">Sign in</button>
        <p>Design system · #286AD3</p>
      </div>
      <div class="swatch">
        <button type="button" class="btn primary" style="background:#1C5FC0">Sign in</button>
        <p>Proposed · #1C5FC0</p>
      </div>
      <div class="swatch">
        <div class="chip" style="background:#F2F4F8"></div>
        <p>Panel · #F2F4F8</p>
      </div>
      <div class="swatch">
        <div class="chip" style="background:#F3F5F8"></div>
        <p>Proposed paper · #F3F5F8</p>
      </div>
      <div class="swatch">
        <div class="chip" style="background:#FF9A3E"></div>
        <p>Sandbox line · #FF9A3E</p>
      </div>
      <div class="swatch">
        <div class="chip" style="background:#E8761A"></div>
        <p>Proposed ember · #E8761A</p>
      </div>
    </div>

    <h2>Unchanged</h2>
    <p>Authentication, tenant resolution, two-factor checks, and the forgot-password API stay on the host the person is signing in to. Routing inside the portal is not part of this release.</p>
  </article>`;
}

function screenBody() {
  switch (state.screen) {
    case "forgot": return forgotHtml();
    case "sent": return sentHtml();
    case "security": return securityHtml();
    case "email-code": return codeHtml("email");
    case "auth-code": return codeHtml("auth");
    case "timeout": return timeoutHtml();
    default: return signInHtml();
  }
}

function reviewValue() {
  if (state.screen === "sign-in" && (state.fieldErrors.email === "Incorrect email" || state.fieldErrors.password === "Incorrect password")) {
    return "sign-in-error";
  }
  if (state.screen === "email-code" && state.codeStatus === "invalid") return "email-code-invalid";
  if (state.screen === "email-code" && state.codeStatus === "expired") return "email-code-expired";
  return state.screen;
}

let syncingReview = false;
let networkOpenedAt = 0;

function syncReview() {
  const screen = document.getElementById("rev-screen");
  syncingReview = true;
  if (screen && document.activeElement !== screen) screen.value = reviewValue();
  syncingReview = false;
}

function render() {
  const active = document.activeElement;
  const restoreId = state.focusId || (active && active.id);
  const start = active && active.selectionStart;
  const end = active && active.selectionEnd;
  state.restore = restoreId ? { id: restoreId, start, end } : null;

  document.body.dataset.screen = state.screen;
  document.body.dataset.palette = state.palette;
  document.documentElement.dataset.palette = state.palette;
  document.getElementById("account").dataset.host = state.host;
  document.title = `${({
    "sign-in": "Sign in",
    forgot: "Forgot password",
    sent: "Check your email",
    security: "Security Verification",
    "email-code": "Check your email",
    "auth-code": "Authenticator code",
    timeout: "This link expired",
    handoff: "Account sign-in",
  }[state.screen])} · Block Aero`;

  document.getElementById("panel").innerHTML = state.screen === "handoff" ? handoffHtml() : productShell(screenBody());
  document.getElementById("live").textContent = state.live;
  syncReview();
  fitForm();
  placeContent();

  const restore = state.restore;
  state.focusId = null;
  state.restore = null;
  if (restore && restore.id) {
    const next = document.getElementById(restore.id);
    if (next) {
      next.focus();
      if (typeof restore.start === "number" && next.setSelectionRange) {
        try { next.setSelectionRange(restore.start, restore.end); } catch { /* not a text field */ }
      }
    }
  }
}

function fitForm() {
  const column = document.querySelector(".form-col");
  const scroll = document.querySelector(".form-scroll");
  const block = document.querySelector(".form-block");
  if (!column || !scroll || !block) return;
  column.style.setProperty("--fit", "1");
  block.style.marginTop = "0px";
  const fits = () => {
    if (block.scrollHeight > scroll.clientHeight + 1) return false;
    const btn = block.querySelector(".btn.primary");
    if (!btn) return true;
    const br = btn.getBoundingClientRect();
    const sr = scroll.getBoundingClientRect();
    return br.bottom <= sr.bottom + 1 && br.top >= sr.top - 1;
  };
  if (fits()) return;
  let low = 0.5;
  let high = 1;
  for (let step = 0; step < 10; step += 1) {
    const mid = (low + high) / 2;
    column.style.setProperty("--fit", String(mid));
    if (fits()) low = mid;
    else high = mid;
  }
  column.style.setProperty("--fit", String(low));
}

/** Keep brand top-pinned; ease content down on tall screens without mid-column float.
 *  margin-top = clamp(minGap, freeSpace / 2, maxGap)
 *  minGap ≈ logo rhythm (48); maxGap caps drift (~22vh, hard cap 200) so short copy
 *  stays in the upper band instead of true vertical center. */
function placeContent() {
  const column = document.querySelector(".form-col");
  const scroll = document.querySelector(".form-scroll");
  const block = document.querySelector(".form-block");
  if (!column || !scroll || !block) return;

  const fit = Number(column.style.getPropertyValue("--fit") || "1") || 1;
  const minGap = Math.round(48 * fit);
  const maxGap = Math.round(Math.min(200, Math.max(minGap, window.innerHeight * 0.22)));
  const free = scroll.clientHeight - block.offsetHeight;

  let top = 0;
  if (free > 0) {
    const ideal = free / 2;
    top = Math.min(maxGap, Math.max(minGap, ideal));
    top = Math.min(top, free);
  }
  block.style.marginTop = `${top}px`;
}

function onInput(event) {
  const id = event.target.id;
  if (id === "email") state.email = event.target.value;
  if (id === "password") state.password = event.target.value;
  if (id === "code") {
    state.code = event.target.value;
    if (state.codeStatus === "sent") state.codeStatus = "";
  }
  if (id === "forgot-email") state.forgotEmail = event.target.value;
}

function onSubmit(event) {
  event.preventDefault();
  if (event.target.id === "signin-form") submitSignIn();
  if (event.target.id === "forgot-form") submitForgot();
  if (event.target.id === "security-form") submitSecurity();
  if (event.target.id === "code-form") submitCode();
}

function onClick(event) {
  const action = event.target.closest("[data-action]");
  if (!action) return;
  const name = action.dataset.action;
  if (action.closest(".select-wrap") || name === "pick-network") {
    event.stopPropagation();
  }
  if (name === "forgot") go("forgot");
  if (name === "back") {
    state.banner = "";
    state.fieldErrors = {};
    state.codeStatus = "";
    if (state.screen === "email-code" || state.screen === "auth-code") go("security");
    else if (state.screen === "security" || state.screen === "forgot" || state.screen === "sent" || state.screen === "timeout") go("sign-in");
    else go("sign-in");
  }
  if (name === "verify-method") {
    state.verifyMethod = action.dataset.method === "email" ? "email" : "auth";
    state.focusId = action.id;
    render();
  }
  if (name === "toggle-password") {
    state.showPassword = !state.showPassword;
    state.focusId = "password";
    render();
  }
  if (name === "toggle-network" || action.id === "network") {
    if (state.dropdownOpen && Date.now() - networkOpenedAt < 400) return;
    state.dropdownOpen = !state.dropdownOpen;
    if (state.dropdownOpen) networkOpenedAt = Date.now();
    state.focusId = state.dropdownOpen ? "opt-0" : "network";
    render();
  }
  if (name === "pick-network") pickNetwork(action.dataset.id);
  if (name === "resend") {
    state.resendIn = 30;
    state.codeStatus = "sent";
    state.fieldErrors = {};
    render();
  }
}

function applyReview(value) {
  state.dropdownOpen = false;
  state.banner = "";
  state.codeStatus = "";
  state.fieldErrors = {};
  state.focusId = null;
  if (value === "sign-in" || value === "sign-in-error") {
    state.screen = "sign-in";
    if (value === "sign-in-error") {
      state.email = state.email || "work@email.com";
      state.password = "incorrect";
      state.fieldErrors = {
        email: "Incorrect email",
        password: "Incorrect password",
      };
    }
  } else if (value === "forgot") state.screen = "forgot";
  else if (value === "sent") {
    state.screen = "sent";
    state.sentEmail = state.sentEmail || state.forgotEmail || "ada@block.aero";
  } else if (value === "security") {
    state.screen = "security";
    state.verifyMethod = "auth";
  } else if (value === "email-code" || value === "email-code-invalid" || value === "email-code-expired") {
    state.screen = "email-code";
    state.verifyMethod = "email";
    state.email = state.email || "ada@block.aero";
    if (value === "email-code-invalid") {
      state.code = "000000";
      state.fieldErrors = { code: "Invalid code. Check the code and try again." };
      state.codeStatus = "invalid";
    }
    if (value === "email-code-expired") {
      state.code = "111111";
      state.fieldErrors = { code: "Code expired. Request a new one." };
      state.codeStatus = "expired";
    }
  } else if (value === "auth-code") {
    state.screen = "auth-code";
    state.verifyMethod = "auth";
    state.email = state.email || "auth@block.aero";
  }   else if (value === "timeout") state.screen = "timeout";
  else if (value === "handoff") state.screen = "handoff";
  const hashScreen = state.screen;
  const next = `#/${hashScreen}`;
  if (location.hash !== next) history.pushState(null, "", next);
  render();
}

function onKey(event) {
  if (state.dropdownOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
    const options = [...document.querySelectorAll(".option")];
    if (!options.length) return;
    event.preventDefault();
    const index = options.indexOf(document.activeElement);
    const next = event.key === "ArrowDown"
      ? options[Math.min(options.length - 1, index + 1)]
      : options[Math.max(0, index - 1)];
    (index === -1 ? options[0] : next).focus();
    return;
  }
  if (event.key === "ArrowDown" && document.activeElement && document.activeElement.id === "network" && !state.dropdownOpen) {
    event.preventDefault();
    state.dropdownOpen = true;
    state.focusId = "opt-0";
    render();
    return;
  }
  if (state.dropdownOpen && (event.key === "Enter" || event.key === " ")) {
    const option = document.activeElement;
    if (option && option.dataset.action === "pick-network") {
      event.preventDefault();
      pickNetwork(option.dataset.id);
      return;
    }
  }
  if (event.key === "Escape") {
    if (state.dropdownOpen) {
      state.dropdownOpen = false;
      state.focusId = "network";
      render();
    }
    return;
  }
}

function readRoute() {
  const name = (location.hash || "#/sign-in").replace(/^#\//, "").split("?")[0];
  const known = ["sign-in", "forgot", "sent", "security", "email-code", "auth-code", "timeout", "handoff"];
  state.screen = known.includes(name) ? name : "sign-in";
  state.dropdownOpen = false;
  render();
}

function init() {
  document.getElementById("panel").addEventListener("click", onClick);
  document.getElementById("panel").addEventListener("input", onInput);
  document.getElementById("panel").addEventListener("submit", onSubmit);
  document.addEventListener("keydown", onKey);
  document.addEventListener("click", (event) => {
    if (!state.dropdownOpen) return;
    if (Date.now() - networkOpenedAt < 400) return;
    if (event.target.closest(".select-wrap")) return;
    state.dropdownOpen = false;
    render();
  });
  document.querySelector(".review").addEventListener("click", onClick);
  document.getElementById("rev-screen").addEventListener("change", (event) => {
    if (syncingReview) return;
    applyReview(event.target.value);
  });
  window.setInterval(() => {
    if (state.resendIn <= 0) return;
    state.resendIn -= 1;
    const button = document.getElementById("resend");
    if (!button) return;
    button.textContent = state.resendIn ? `Resend code in ${state.resendIn}s` : "Resend code";
    button.disabled = state.resendIn > 0;
  }, 1000);
  window.addEventListener("popstate", readRoute);
  window.addEventListener("hashchange", readRoute);
  window.addEventListener("resize", () => {
    fitForm();
    placeContent();
  });
  if (!location.hash) history.replaceState(null, "", "#/sign-in");
  readRoute();
}

init();
