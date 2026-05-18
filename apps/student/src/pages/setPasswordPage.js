import { eyeIcon, eyeOffIcon } from "../lib/icons";
import { state, saveState } from "../state/appState";
import { authState } from "../state/authState";
import { supabase } from "../supabaseClient";
import { triggerRender } from "../lib/renderBus";

async function getAccessTokenForFunctionInvoke() {
  const { data: sessionData } = await supabase.auth.getSession();
  let accessToken = sessionData?.session?.access_token ?? null;
  const expiresAt = sessionData?.session?.expires_at ?? 0;
  if (!accessToken || expiresAt * 1000 < Date.now() + 60_000) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError) {
      accessToken = refreshed?.session?.access_token ?? null;
    }
  }
  return accessToken;
}

async function getFunctionInvokeErrorMessage(error) {
  if (!error) return "";
  const fallback = String(error?.message ?? "").trim();
  if (!error?.context) return fallback;
  try {
    const body = await error.context.json();
    const detail = String(body?.detail ?? "").trim();
    const serverError = String(body?.error ?? body?.message ?? "").trim();
    if (serverError && detail) return `${serverError}: ${detail}`;
    if (serverError) return serverError;
    if (detail) return detail;
  } catch {
    try {
      const text = String(await error.context.text()).trim();
      if (text) return text;
    } catch {
      // Ignore context parsing errors and fall back to the client error message.
    }
  }
  return fallback;
}

function getFunctionPayloadErrorMessage(payload) {
  if (!payload || typeof payload !== "object") return "";
  const detail = String(payload?.detail ?? "").trim();
  const serverError = String(payload?.error ?? payload?.message ?? "").trim();
  if (serverError && detail) return `${serverError}: ${detail}`;
  return serverError || detail;
}

export function renderSetPassword(app) {
  app.innerHTML = `
    <div class="app">
      <main class="content" style="margin:12px;">
        <div style="max-width:420px;margin:20px auto;padding:20px;border:1px solid #ddd;border-radius:12px;background:#fff;">
          <h2 style="margin:0 0 6px;">Set New Password</h2>
          <p style="margin-top:0;line-height:1.6;">新しいパスワードを設定します。</p>

          <label>New Password</label>
          <div class="pass-field">
            <input id="newPass" type="password" class="pass-input" />
            <button class="pass-toggle" type="button" id="toggleNewPass" aria-label="Show password">
              ${eyeOffIcon()}
            </button>
          </div>

          <label>Confirm Password</label>
          <div class="pass-field">
            <input id="confirmPass" type="password" class="pass-input" />
            <button class="pass-toggle" type="button" id="toggleConfirmPass" aria-label="Show password">
              ${eyeOffIcon()}
            </button>
          </div>

          <button class="nav-btn" id="updateBtn" style="width:100%;">Update password</button>
          <p id="msg" style="color:#b00;margin-top:12px;min-height:20px;"></p>
        </div>
      </main>
    </div>
  `;
  const passEl = app.querySelector("#newPass");
  const confirmEl = app.querySelector("#confirmPass");
  const msgEl = app.querySelector("#msg");
  const toggleNew = app.querySelector("#toggleNewPass");
  const toggleConfirm = app.querySelector("#toggleConfirmPass");
  const updateBtn = app.querySelector("#updateBtn");
  let submitting = false;

  toggleNew?.addEventListener("click", () => {
    const next = passEl.type === "password" ? "text" : "password";
    passEl.type = next;
    toggleNew.innerHTML = next === "text" ? eyeIcon() : eyeOffIcon();
  });
  toggleConfirm?.addEventListener("click", () => {
    const next = confirmEl.type === "password" ? "text" : "password";
    confirmEl.type = next;
    toggleConfirm.innerHTML = next === "text" ? eyeIcon() : eyeOffIcon();
  });
  updateBtn?.addEventListener("click", async () => {
    if (submitting) return;
    msgEl.textContent = "";
    const password = passEl.value;
    const confirm = confirmEl.value;
    if (!password || password.length < 8) {
      msgEl.textContent = "8文字以上のパスワードを入力してください。";
      return;
    }
    if (password !== confirm) {
      msgEl.textContent = "パスワードが一致しません。";
      return;
    }
    submitting = true;
    updateBtn.disabled = true;
    updateBtn.textContent = "Updating...";
    try {
      const accessToken = await getAccessTokenForFunctionInvoke();
      if (!accessToken) {
        msgEl.textContent = "セッションが切れました。もう一度ログインしてください。";
        return;
      }
      const { data, error } = await supabase.functions.invoke("set-student-password", {
        body: { password },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (error) {
        const message = await getFunctionInvokeErrorMessage(error);
        msgEl.textContent = message || "Failed to update password.";
        return;
      }
      if (data?.error) {
        const message = getFunctionPayloadErrorMessage(data);
        msgEl.textContent = message || "Failed to update password.";
        return;
      }

      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // Ignore sign-out failures here; the next auth refresh will clear the stale session.
      }

      authState.mustChangePassword = false;
      authState.recoveryMode = false;
      if (authState.profile) authState.profile.force_password_change = false;
      state.phase = "login";
      state.requireLogin = true;
      saveState();
      triggerRender();
    } finally {
      submitting = false;
      updateBtn.disabled = false;
      updateBtn.textContent = "Update password";
    }
  });
}
