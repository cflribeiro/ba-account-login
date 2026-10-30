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
  rememberBrowser: true,
  rememberTipOpen: false,
  codeEntryFrom: "security",
  toast: "",
  toastTimer: 0,
  newPassword: "",
  showNewPassword: false,
  passwordPanelOpen: false,
  passwordHadError: false,
  dropdownOpen: false,
  palette: "ds",
  live: "",
  focusId: null,
  restore: null,
};

const PASSWORD_RULES = [
  { id: "length", label: "8 characters minimum", test: (v) => v.length >= 8 },
  { id: "number", label: "At least 1 number", test: (v) => /\d/.test(v) },
  { id: "lower", label: "At least 1 lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "upper", label: "At least 1 uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "special", label: "At least 1 special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

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
  // Email-only 2FA: send code and go straight to entry (Figma A205).
  if (state.verifyMethod === "email") {
    enterEmailCode({ from: "sign-in", announce: true });
    return;
  }
  go("security");
}

function showToast(message) {
  state.toast = message;
  state.toastTimer += 1;
  const token = state.toastTimer;
  window.setTimeout(() => {
    if (state.toastTimer !== token) return;
    state.toast = "";
    render();
  }, 4000);
}

function enterEmailCode({ from, announce }) {
  state.verifyMethod = "email";
  state.screen = "email-code";
  state.codeEntryFrom = from;
  state.code = "";
  state.codeStatus = "";
  state.fieldErrors = {};
  state.resendIn = 60;
  state.rememberBrowser = true;
  state.focusId = "code";
  if (announce) {
    showToast("Verification email sent successfully.");
    state.live = "Verification email sent successfully.";
  }
  setHash("email-code");
  render();
}

function submitSecurity() {
  state.fieldErrors = {};
  state.code = "";
  state.codeStatus = "";
  if (state.verifyMethod === "auth") {
    state.codeEntryFrom = "security";
    go("auth-code");
    return;
  }
  enterEmailCode({ from: "security", announce: true });
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

function submitSetPassword() {
  const value = state.newPassword;
  if (!value) {
    state.fieldErrors = { newPassword: "Required" };
    state.passwordHadError = true;
    state.passwordPanelOpen = false;
    state.focusId = "new-password";
    render();
    return;
  }
  const { allMet } = passwordAnalysis(value);
  if (!allMet) {
    state.fieldErrors = { newPassword: "Password does not meet the requirements" };
    state.passwordHadError = true;
    state.passwordPanelOpen = false;
    state.focusId = "new-password";
    render();
    return;
  }
  state.fieldErrors = {};
  state.passwordHadError = false;
  state.passwordPanelOpen = false;
  state.newPassword = "";
  state.showNewPassword = false;
  state.live = "Password changed. Sign in with your new password.";
  go("sign-in");
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
    state.fieldErrors = {
      code: state.screen === "auth-code"
        ? "Invalid code"
        : "Invalid code. Check the code and try again.",
    };
    state.codeStatus = "invalid";
    render();
    return;
  }
  if (code === "111111") {
    state.fieldErrors = { code: "Code expired. Please request a new one." };
    state.codeStatus = "expired";
    render();
    return;
  }
  if (state.codeStatus === "expired" || state.codeStatus === "timeout") {
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

function iconInfo() {
  return dsIcon(`<path fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" d="M8 1C4.136 1 1 4.136 1 8C1 11.864 4.136 15 8 15C11.864 15 15 11.864 15 8C15 4.136 11.864 1 8 1ZM8.5 7V11H7.5V7H8.5ZM8.5 6V5H7.5V6H8.5Z"/>`);
}

function iconRuleInfo() {
  return dsIcon(`<path fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" d="M8 1C4.136 1 1 4.136 1 8C1 11.864 4.136 15 8 15C11.864 15 15 11.864 15 8C15 4.136 11.864 1 8 1ZM8.5 7V11H7.5V7H8.5ZM8.5 6V5H7.5V6H8.5Z"/>`, "rule-icon");
}

function iconRuleCheck() {
  return dsIcon(`<path fill="currentColor" d="M8 1.6C4.472 1.6 1.6 4.472 1.6 8s2.872 6.4 6.4 6.4 6.4-2.872 6.4-6.4S11.528 1.6 8 1.6Zm-0.85 8.8L4.883 8.15l.85-.85L7.15 8.7l3.117-3.1.85.85L7.15 10.4Z"/>`, "rule-icon is-met");
}

function iconRuleError() {
  return dsIcon(`<path fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" d="M8 1C4.136 1 1 4.136 1 8C1 11.864 4.136 15 8 15C11.864 15 15 11.864 15 8C15 4.136 11.864 1 8 1ZM8.5 4.5V9.5H7.5V4.5H8.5ZM8.5 11.5V10.5H7.5V11.5H8.5Z"/>`, "rule-icon is-fail");
}

function passwordAnalysis(value) {
  const rules = PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    met: rule.test(value),
  }));
  const metCount = rules.filter((rule) => rule.met).length;
  let strength = { label: "Weak", level: 1, tone: "weak" };
  if (metCount >= 5) strength = { label: "Strong", level: 3, tone: "strong" };
  else if (metCount >= 3) strength = { label: "Ok", level: 2, tone: "ok" };
  return { rules, metCount, allMet: metCount === rules.length, strength };
}

function passwordPanelHtml(value, { showFailIcons }) {
  const { rules, strength } = passwordAnalysis(value);
  const showStrength = value.length > 0;
  const rows = rules.map((rule) => {
    let icon = iconRuleInfo();
    if (rule.met) icon = iconRuleCheck();
    else if (showFailIcons) icon = iconRuleError();
    return `<div class="pw-rule${rule.met ? " is-met" : ""}${!rule.met && showFailIcons ? " is-fail" : ""}">${icon}<span>${esc(rule.label)}</span></div>`;
  }).join("");
  const strengthRow = showStrength
    ? `<div class="pw-strength" data-tone="${strength.tone}">
        <div class="pw-strength-copy">
          <span>Password Strength:</span>
          <strong>${esc(strength.label)}</strong>
        </div>
        <div class="pw-strength-bars" aria-hidden="true">
          <span class="pw-bar${strength.level >= 1 ? " is-on" : ""}"></span>
          <span class="pw-bar${strength.level >= 2 ? " is-on" : ""}"></span>
          <span class="pw-bar${strength.level >= 3 ? " is-on" : ""}"></span>
        </div>
      </div>`
    : "";
  return `<div class="pw-panel" id="pw-requirements" role="status" aria-live="polite">
      <div class="pw-rules">${rows}</div>
      ${strengthRow}
    </div>`;
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
    : `<p class="support">Need help? <a href="mailto:support@block.aero">Contact Customer Support</a></p>`;
  return `<div class="shell">
    <div class="brand">
      <img src="assets/lockup-horizontal.svg?v=2" width="197" height="48" alt="Block Aero">
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
  return `<h1 class="headline">Sign In</h1>
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
          <button type="button" class="inline-link" data-action="forgot">Forgot Password?</button>
        </div>
        <div class="password-wrap">
          <input class="control" id="password" name="password" type="${state.showPassword ? "text" : "password"}" autocomplete="current-password" placeholder="Enter password" value="${esc(state.password)}" ${passErr ? `aria-invalid="true" aria-describedby="password-error"` : ""}>
          <button type="button" class="icon-btn" data-action="toggle-password" aria-label="${state.showPassword ? "Hide password" : "Show password"}">${iconEye(!state.showPassword)}</button>
        </div>
        ${fieldError("password")}
      </div>
      <button class="btn primary" type="submit">Sign In</button>
    </form>
    <p class="actions quiet">Don’t have an account? <a href="https://block.aero/get-started#request" target="_blank" rel="noopener noreferrer">Get Started</a></p>`;
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
  return `${backControl("Back")}
    <h1 class="headline">Reset Password</h1>
    <p class="lede">Please provide your work email address and we will email you instructions to reset your password</p>
    <form id="forgot-form" novalidate>
      <div class="field">
        <div class="field-label"><label for="forgot-email">Work Email Address</label></div>
        <input class="control" id="forgot-email" type="email" autocomplete="username" placeholder="Enter work email address" value="${esc(state.forgotEmail)}" ${err ? `aria-invalid="true" aria-describedby="forgotEmail-error"` : ""}>
        ${fieldError("forgotEmail")}
      </div>
      <button class="btn primary" type="submit">Send Reset Link</button>
    </form>`;
}

function sentHtml() {
  const email = state.sentEmail || "that address";
  return `${backControl("Back")}
    <h1 class="headline">Reset Link has been sent</h1>
    <p class="lede">We have sent an email to <strong>${esc(email)}</strong> containing instructions to reset account password.</p>
    <p class="lede">Please check your spam folder if you do not receive our email from member@block.aero.</p>
    <p class="lede">Wrong email? <button type="button" class="inline-link" data-action="reenter-email">Please Re-enter Your Email Address</button></p>`;
}

function setPasswordHtml() {
  const err = state.fieldErrors.newPassword;
  const showFailIcons = state.passwordHadError && state.passwordPanelOpen;
  const invalid = Boolean(err);
  return `${backControl("Back")}
    <h1 class="headline">Reset Password</h1>
    <p class="lede">Please enter your new password</p>
    <form id="set-password-form" novalidate>
      <div class="field pw-field">
        <div class="field-label"><label for="new-password">New Password</label></div>
        <div class="password-wrap">
          <input class="control" id="new-password" name="new-password" type="${state.showNewPassword ? "text" : "password"}" autocomplete="new-password" placeholder="Enter new password" value="${esc(state.newPassword)}" ${invalid ? `aria-invalid="true" aria-describedby="newPassword-error"` : ""} aria-controls="pw-requirements" aria-expanded="${state.passwordPanelOpen}">
          <button type="button" class="icon-btn" data-action="toggle-new-password" aria-label="${state.showNewPassword ? "Hide password" : "Show password"}">${iconEye(!state.showNewPassword)}</button>
        </div>
        ${fieldError("newPassword")}
        ${state.passwordPanelOpen ? passwordPanelHtml(state.newPassword, { showFailIcons }) : ""}
      </div>
      <button class="btn primary" type="submit">Change Password</button>
    </form>`;
}

function rememberBrowserHtml() {
  return `<div class="check-row">
      <button type="button" class="check" role="checkbox" id="remember-browser" aria-checked="${state.rememberBrowser}" data-action="toggle-remember">
        <span class="check-mark" aria-hidden="true"></span>
        <span class="check-label">Remember this browser for 7 days</span>
      </button>
      <span class="info-tip-wrap">
        <button type="button" class="info-tip" id="remember-info" data-action="remember-info" aria-label="About remembering this browser" aria-describedby="remember-tip" aria-expanded="${state.rememberTipOpen}">${iconInfo()}</button>
        <span class="tooltip${state.rememberTipOpen ? " is-open" : ""}" id="remember-tip" role="tooltip">If the browser blocks or clears cookies, this feature may not work.</span>
      </span>
    </div>`;
}

function toastHtml() {
  if (!state.toast) return "";
  return `<div class="toast success" role="status" aria-live="polite">
      ${iconRuleCheck()}
      <p>${esc(state.toast)}</p>
    </div>`;
}

function emailResendButton() {
  const counting = state.resendIn > 0;
  const label = counting ? `${state.resendIn}s to Enter Code` : "Resend Code";
  return `<button type="button" class="btn secondary${counting ? " is-countdown" : ""}" id="resend" data-action="resend" ${counting ? "disabled" : ""}>${esc(label)}</button>`;
}

function codeHtml(kind) {
  const err = state.fieldErrors.code;
  const expired = state.codeStatus === "expired";
  const timedOut = state.codeStatus === "timeout";
  const invalid = state.codeStatus === "invalid";
  const auth = kind === "auth";
  const title = "Security Verification";
  const lede = auth
    ? "Please enter the 6 digit code from Google Authenticator"
    : "Please enter the verification code sent to your email";
  const label = auth ? "Google Verification Code" : "Verification Code";
  const placeholder = timedOut ? "Verification timeout, resend verification" : "Enter";
  const inputValue = timedOut ? "" : esc(state.code);
  const inputDisabled = timedOut ? "disabled" : "";
  const submitDisabled = expired || timedOut ? "disabled" : "";
  const requestNew = expired
    ? `<button type="button" class="btn secondary" data-action="request-new-code" id="request-new-code">Request New Code</button>`
    : "";
  const resendControl = !auth && !expired
    ? (timedOut
      ? `<button type="button" class="btn secondary" id="resend" data-action="resend">Resend Verification Email</button>`
      : emailResendButton())
    : "";

  return `${backControl("Back")}
    <h1 class="headline">${title}</h1>
    <p class="lede">${lede}</p>
    <form id="code-form" novalidate>
      <div class="field">
        <div class="field-label"><label for="code">${label}</label></div>
        <input class="control" id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="${esc(placeholder)}" value="${inputValue}" ${inputDisabled} ${err || invalid || expired ? `aria-invalid="true" aria-describedby="code-error"` : ""}>
        ${fieldError("code")}
      </div>
      <button class="btn primary" type="submit" ${submitDisabled}>Submit</button>
      ${requestNew}
      ${resendControl}
      ${rememberBrowserHtml()}
    </form>`;
}

function timeoutHtml() {
  return `${backControl("Back")}
    <h1 class="headline">This Link Expired</h1>
    <p class="lede">This reset link is no longer valid. Request a new one from the sign-in page.</p>
    <button type="button" class="btn primary" data-action="forgot">Reset Password</button>`;
}

function handoffHtml() {
  return `<article class="doc">
    <img class="doc-logo" src="assets/lockup-horizontal.svg?v=2" width="197" height="48" alt="Block Aero">
    <h1>Account sign-in</h1>
    <p>The release puts the new lockup, the tagline, and a network choice on the account shell that already exists. The button, fields, dialogs, type, and color roles stay the ones in the design system. The other account screens that share this layout come with it.</p>

    <h2>What ships</h2>
    <ul>
      <li>Lockup at 213px wide, intrinsic height, above the tagline. Headline is Sign In.</li>
      <li>Tagline, once: A digital passport for every aero asset</li>
      <li>Side photograph is the engine hangar still. The other two stills are not on the page yet.</li>
      <li>Network choice on the sign-in form, using the dropdown field.</li>
      <li>Reset Password, reset email sent, set new password with requirements panel and strength meter, email-only 2FA (direct code entry with countdown resend + toast), method choice when authenticator is available, invalid/expired/timeout code states, remember-browser, and expired reset link.</li>
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
      <li>Get Started still opens https://block.aero/get-started#request. Support is Contact Customer Support (mailto support@block.aero).</li>
    </ul>

    <h2>How a network change works</h2>
    <ul>
      <li>This page never signs a person in against another host. No password, code, or token is added to the address.</li>
      <li>Production opens https://portal.block.aero/account/login. Sandbox opens https://sandbox.portal.block.aero/account/login.</li>
      <li>Choosing the network you are already on stays on this page. Sign In submits on this host.</li>
      <li>Choosing another network opens that host’s sign-in address in this window. There is no confirmation. Email, password, and code are cleared and are not added to the address.</li>
      <li>The button stays Sign In. Sign-in always happens on the host shown in the address.</li>
    </ul>

    <h2>Networks</h2>
    <ul>
      <li>The list is Production and Sandbox. There is no way to add a network on this page.</li>
      <li>The icon at the top right opens the screen list for review. It is not part of the sign-in page.</li>
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
        <button type="button" class="btn primary" style="background:#286AD3">Sign In</button>
        <p>Design system · #286AD3</p>
      </div>
      <div class="swatch">
        <button type="button" class="btn primary" style="background:#1C5FC0">Sign In</button>
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
    case "set-password": return setPasswordHtml();
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
  if (state.screen === "set-password" && state.passwordHadError && state.passwordPanelOpen) {
    return "set-password-error-focus";
  }
  if (state.screen === "set-password" && state.fieldErrors.newPassword === "Password does not meet the requirements") {
    return "set-password-error";
  }
  if (state.screen === "set-password" && state.passwordPanelOpen && state.newPassword) {
    const { strength } = passwordAnalysis(state.newPassword);
    if (strength.tone === "strong") return "set-password-strong";
    if (strength.tone === "ok") return "set-password-ok";
    return "set-password-weak";
  }
  if (state.screen === "set-password" && state.passwordPanelOpen) return "set-password-focus";
  if (state.screen === "email-code" && state.codeStatus === "invalid") return "email-code-invalid";
  if (state.screen === "email-code" && state.codeStatus === "expired") return "email-code-expired";
  if (state.screen === "email-code" && state.codeStatus === "timeout") return "email-code-timeout";
  if (state.screen === "auth-code" && state.codeStatus === "invalid") return "auth-code-invalid";
  return state.screen;
}

let networkOpenedAt = 0;

function setReviewOpen(open) {
  const toggle = document.getElementById("rev-toggle");
  const menu = document.getElementById("rev-menu");
  if (!toggle || !menu) return;
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  menu.hidden = !open;
}

function syncReview() {
  const current = reviewValue();
  document.querySelectorAll("#rev-menu [data-screen]").forEach((button) => {
    button.setAttribute("aria-selected", button.dataset.screen === current ? "true" : "false");
  });
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
  document.title = `Block Aero - ${({
    "sign-in": "Sign In",
    forgot: "Reset Password",
    sent: "Reset Link has been sent",
    "set-password": "Reset Password",
    security: "Security Verification",
    "email-code": "Security Verification",
    "auth-code": "Security Verification",
    timeout: "This Link Expired",
    handoff: "Account sign-in",
  }[state.screen] || "Sign In")}`;

  document.getElementById("panel").innerHTML = state.screen === "handoff" ? handoffHtml() : productShell(screenBody());
  let toastHost = document.getElementById("toast-host");
  if (!toastHost) {
    toastHost = document.createElement("div");
    toastHost.id = "toast-host";
    document.body.appendChild(toastHost);
  }
  toastHost.innerHTML = toastHtml();
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

function contentMinGap(block) {
  const mobileMin = Number.parseFloat(getComputedStyle(block).getPropertyValue("--mobile-content-min")) || 0;
  return mobileMin || 80;
}

function fitForm() {
  const column = document.querySelector(".form-col");
  const scroll = document.querySelector(".form-scroll");
  const block = document.querySelector(".form-block");
  if (!column || !scroll || !block) return;
  column.style.setProperty("--fit", "1");
  // Reserve logo→content gap while fitting so --fit shrinks field/button rhythm first.
  const reserved = contentMinGap(block);
  block.style.marginTop = `${reserved}px`;
  const fitsWithGap = () => {
    const mt = Number.parseFloat(block.style.marginTop) || 0;
    if (block.offsetHeight + mt > scroll.clientHeight + 1) return false;
    const btn = block.querySelector(".btn.primary");
    if (!btn) return true;
    const br = btn.getBoundingClientRect();
    const sr = scroll.getBoundingClientRect();
    return br.bottom <= sr.bottom + 1 && br.top >= sr.top - 1;
  };
  if (fitsWithGap()) return;
  let low = 0.45;
  let high = 1;
  for (let step = 0; step < 10; step += 1) {
    const mid = (low + high) / 2;
    column.style.setProperty("--fit", String(mid));
    block.style.marginTop = `${reserved}px`;
    if (fitsWithGap()) low = mid;
    else high = mid;
  }
  column.style.setProperty("--fit", String(low));
  block.style.marginTop = `${reserved}px`;
}

/** Place brand + form.
 *  Mid desktop: fixed CSS top pad + fixed brand→form gap so the lockup never jumps between screens.
 *  Tall desktop (≥860px): CSS pad clamps + ease the Sign In block down a bit.
 *  Mobile: fixed minGap only — short screens stay under the lockup. */
function placeContent() {
  const column = document.querySelector(".form-col");
  const scroll = document.querySelector(".form-scroll");
  const block = document.querySelector(".form-block");
  if (!column || !scroll || !block) return;

  const fit = Number(column.style.getPropertyValue("--fit") || "1") || 1;
  const mobileMin = Number.parseFloat(
    getComputedStyle(block).getPropertyValue("--mobile-content-min")
  ) || 0;
  const minGap = mobileMin
    ? Math.round(Math.max(mobileMin * 0.9, mobileMin * Math.max(fit, 0.85)))
    : Math.round(80 * fit);
  const tallDesktop = !mobileMin && window.matchMedia("(min-width: 1101px) and (min-height: 860px)").matches;

  // Always clear any leftover inline pads from older equal-split logic.
  column.style.paddingTop = "";
  column.style.paddingBottom = "";
  scroll.style.flex = "";

  if (mobileMin) {
    const free = scroll.clientHeight - block.offsetHeight;
    block.style.marginTop = `${Math.min(minGap, Math.max(0, free))}px`;
    return;
  }

  // Tall screens: ease brand→form gap; outer pads stay on CSS.
  if (tallDesktop) {
    block.style.marginTop = "0px";
    const free = scroll.clientHeight - block.offsetHeight;
    const padTop = Number.parseFloat(getComputedStyle(column).paddingTop) || minGap;
    let top = Math.min(minGap, Math.max(0, free));
    if (free > minGap) {
      const maxGap = Math.round(Math.min(Math.max(padTop + 56, minGap), 144, window.innerHeight * 0.16));
      const ideal = Math.min(free * 0.38, Math.max(padTop + 28, minGap));
      top = Math.min(maxGap, Math.max(minGap, ideal));
    }
    block.style.marginTop = `${top}px`;
    return;
  }

  // Mid desktop: lockup position is CSS-only; keep brand→form gap fixed across screens.
  block.style.marginTop = `${minGap}px`;
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
  if (id === "new-password") {
    state.newPassword = event.target.value;
    if (state.passwordHadError || state.fieldErrors.newPassword) {
      state.passwordHadError = false;
      const next = { ...state.fieldErrors };
      delete next.newPassword;
      state.fieldErrors = next;
    }
    state.passwordPanelOpen = true;
    state.focusId = "new-password";
    render();
  }
}

function onSubmit(event) {
  event.preventDefault();
  if (event.target.id === "signin-form") submitSignIn();
  if (event.target.id === "forgot-form") submitForgot();
  if (event.target.id === "set-password-form") submitSetPassword();
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
  if (name === "reenter-email") {
    state.forgotEmail = state.sentEmail || state.forgotEmail;
    go("forgot");
  }
  if (name === "back") {
    state.banner = "";
    state.fieldErrors = {};
    state.passwordPanelOpen = false;
    state.passwordHadError = false;
    state.toast = "";
    const fromTimeout = state.screen === "email-code" && state.codeStatus === "timeout";
    const emailDirect = state.screen === "email-code" && state.codeEntryFrom === "sign-in";
    state.codeStatus = "";
    if (fromTimeout || emailDirect || state.screen === "timeout") go("sign-in");
    else if (state.screen === "email-code" || state.screen === "auth-code") go("security");
    else if (state.screen === "security" || state.screen === "forgot" || state.screen === "sent" || state.screen === "set-password") go("sign-in");
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
  if (name === "toggle-new-password") {
    state.showNewPassword = !state.showNewPassword;
    state.passwordPanelOpen = true;
    state.focusId = "new-password";
    render();
  }
  if (name === "toggle-remember") {
    state.rememberBrowser = !state.rememberBrowser;
    state.focusId = "remember-browser";
    render();
  }
  if (name === "remember-info") {
    state.rememberTipOpen = !state.rememberTipOpen;
    state.live = state.rememberTipOpen
      ? "If the browser blocks or clears cookies, this feature may not work."
      : "";
    state.focusId = action.id || null;
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
  if (name === "resend" || name === "request-new-code") {
    state.resendIn = name === "resend" ? 60 : 0;
    state.code = "";
    state.codeStatus = "";
    state.fieldErrors = {};
    state.focusId = "code";
    if (name === "resend") {
      showToast("Verification email sent successfully.");
      state.live = "Verification email sent successfully.";
    } else {
      state.live = "Enter the new verification code.";
    }
    render();
  }
}

function applyReview(value) {
  state.dropdownOpen = false;
  state.banner = "";
  state.codeStatus = "";
  state.fieldErrors = {};
  state.focusId = null;
  state.passwordPanelOpen = false;
  state.passwordHadError = false;
  state.showNewPassword = false;
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
  } else if (
    value === "set-password"
    || value === "set-password-focus"
    || value === "set-password-weak"
    || value === "set-password-ok"
    || value === "set-password-strong"
    || value === "set-password-error"
    || value === "set-password-error-focus"
  ) {
    state.screen = "set-password";
    state.newPassword = "";
    if (value === "set-password-focus") {
      state.passwordPanelOpen = true;
      state.focusId = "new-password";
    } else if (value === "set-password-weak") {
      state.newPassword = "a1";
      state.passwordPanelOpen = true;
      state.focusId = "new-password";
    } else if (value === "set-password-ok") {
      state.newPassword = "Abcdef1";
      state.passwordPanelOpen = true;
      state.focusId = "new-password";
    } else if (value === "set-password-strong") {
      state.newPassword = "Abcdef1!";
      state.passwordPanelOpen = true;
      state.focusId = "new-password";
    } else if (value === "set-password-error") {
      state.newPassword = "a1";
      state.passwordHadError = true;
      state.fieldErrors = { newPassword: "Password does not meet the requirements" };
    } else if (value === "set-password-error-focus") {
      state.newPassword = "a1";
      state.passwordHadError = true;
      state.passwordPanelOpen = true;
      state.fieldErrors = { newPassword: "Password does not meet the requirements" };
      state.focusId = "new-password";
    }
  } else if (value === "security") {
    state.screen = "security";
    state.verifyMethod = "auth";
  } else if (value === "email-code" || value === "email-code-invalid" || value === "email-code-expired" || value === "email-code-timeout") {
    state.screen = "email-code";
    state.verifyMethod = "email";
    state.codeEntryFrom = "sign-in";
    state.email = state.email || "ada@block.aero";
    state.rememberBrowser = true;
    state.resendIn = 60;
    state.toast = "";
    if (value === "email-code") {
      state.code = "";
      showToast("Verification email sent successfully.");
    }
    if (value === "email-code-invalid") {
      state.code = "000000";
      state.fieldErrors = { code: "Invalid code. Check the code and try again." };
      state.codeStatus = "invalid";
    }
    if (value === "email-code-expired") {
      state.code = "111111";
      state.fieldErrors = { code: "Code expired. Please request a new one." };
      state.codeStatus = "expired";
      state.resendIn = 0;
    }
    if (value === "email-code-timeout") {
      state.code = "";
      state.resendIn = 0;
      state.codeStatus = "timeout";
    }
  } else if (value === "auth-code" || value === "auth-code-invalid") {
    state.screen = "auth-code";
    state.verifyMethod = "auth";
    state.email = state.email || "auth@block.aero";
    state.rememberBrowser = true;
    if (value === "auth-code-invalid") {
      state.code = "123456";
      state.fieldErrors = { code: "Invalid code" };
      state.codeStatus = "invalid";
    }
  } else if (value === "timeout") state.screen = "timeout";
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
    } else if (state.rememberTipOpen) {
      state.rememberTipOpen = false;
      state.focusId = "remember-info";
      render();
    }
    return;
  }
}

function readRoute() {
  const name = (location.hash || "#/sign-in").replace(/^#\//, "").split("?")[0];
  const known = ["sign-in", "forgot", "sent", "set-password", "security", "email-code", "auth-code", "timeout", "handoff"];
  const previous = state.screen;
  state.screen = known.includes(name) ? name : "sign-in";
  state.dropdownOpen = false;
  if (state.screen !== "set-password") {
    state.passwordPanelOpen = false;
    state.passwordHadError = false;
  }
  if (state.screen === "email-code" && previous !== "email-code") {
    state.verifyMethod = "email";
    state.codeEntryFrom = "sign-in";
    state.rememberBrowser = true;
    if (!state.resendIn && state.codeStatus !== "timeout" && state.codeStatus !== "expired") {
      state.resendIn = 60;
      showToast("Verification email sent successfully.");
    }
  }
  render();
}

function onPasswordFocusIn(event) {
  if (state.screen !== "set-password") return;
  if (!event.target.closest(".pw-field")) return;
  if (!state.passwordPanelOpen) {
    state.passwordPanelOpen = true;
    state.focusId = event.target.id === "new-password" ? "new-password" : state.focusId;
    render();
  }
}

function onPasswordFocusOut(event) {
  if (state.screen !== "set-password") return;
  // Skip blur from nodes removed during render (innerHTML replace).
  if (!event.target.isConnected) return;
  const field = event.target.closest(".pw-field");
  if (!field) return;
  const next = event.relatedTarget;
  if (next && field.contains(next)) return;
  window.setTimeout(() => {
    if (state.screen !== "set-password") return;
    const active = document.activeElement;
    const wrap = document.querySelector(".pw-field");
    if (wrap && active && wrap.contains(active)) return;
    if (!state.passwordPanelOpen) return;
    state.passwordPanelOpen = false;
    render();
  }, 0);
}

function init() {
  const panel = document.getElementById("panel");
  panel.addEventListener("click", onClick);
  panel.addEventListener("input", onInput);
  panel.addEventListener("submit", onSubmit);
  panel.addEventListener("focusin", onPasswordFocusIn);
  panel.addEventListener("focusout", onPasswordFocusOut);
  document.addEventListener("keydown", onKey);
  document.addEventListener("click", (event) => {
    if (state.dropdownOpen) {
      if (Date.now() - networkOpenedAt < 400) return;
      if (event.target.closest(".select-wrap")) return;
      state.dropdownOpen = false;
      render();
      return;
    }
    if (state.rememberTipOpen && !event.target.closest(".info-tip-wrap")) {
      state.rememberTipOpen = false;
      render();
    }
  });
  document.getElementById("rev-toggle").addEventListener("click", (event) => {
    event.stopPropagation();
    const open = document.getElementById("rev-toggle").getAttribute("aria-expanded") !== "true";
    setReviewOpen(open);
  });
  document.getElementById("rev-menu").addEventListener("click", (event) => {
    const option = event.target.closest("[data-screen]");
    if (!option) return;
    event.stopPropagation();
    setReviewOpen(false);
    applyReview(option.dataset.screen);
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest(".review")) return;
    setReviewOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setReviewOpen(false);
  });
  window.setInterval(() => {
    if (state.resendIn <= 0) return;
    state.resendIn -= 1;
    const button = document.getElementById("resend");
    if (!button) return;
    if (state.codeStatus === "timeout") return;
    if (state.resendIn > 0) {
      button.textContent = `${state.resendIn}s to Enter Code`;
      button.disabled = true;
      button.classList.add("is-countdown");
    } else {
      button.textContent = "Resend Code";
      button.disabled = false;
      button.classList.remove("is-countdown");
    }
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
