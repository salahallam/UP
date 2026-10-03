import "./style.css";
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  document.querySelector("#app").innerHTML = `
    <div class="fatal">
      <h1>Chatter</h1>
      <p>لم يتم إعداد Supabase بعد.</p>
      <small>أضف VITE_SUPABASE_URL و VITE_SUPABASE_PUBLISHABLE_KEY في Environment Variables ثم أعد النشر.</small>
    </div>`;
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(url, key);
const app = document.querySelector("#app");
let currentUser = null;
let channel = null;

const escapeHtml = (value = "") =>
  value.replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]));

function authView(mode = "login", error = "") {
  const login = mode === "login";
  app.innerHTML = `
    <main class="auth">
      <section class="auth-box">
        <div class="brand"><span class="brand-mark">C</span><span>Chatter</span></div>
        <h1>${login ? "تسجيل الدخول" : "إنشاء حساب"}</h1>
        <p class="muted">${login ? "ادخل إلى المحادثة العامة." : "أنشئ حسابك وابدأ المحادثة."}</p>
        ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
        <form id="authForm">
          <label>البريد الإلكتروني</label>
          <input id="email" type="email" autocomplete="email" required placeholder="example@email.com" />
          <label>كلمة السر</label>
          <input id="password" type="password" autocomplete="${login ? "current-password" : "new-password"}" minlength="6" required placeholder="••••••••" />
          <button class="primary" type="submit">${login ? "دخول" : "إنشاء الحساب"}</button>
        </form>
        <button class="link-btn" id="switch">${login ? "ليس لديك حساب؟ إنشاء حساب" : "لديك حساب بالفعل؟ تسجيل الدخول"}</button>
      </section>
    </main>`;
  document.querySelector("#switch").onclick = () => authView(login ? "signup" : "login");
  document.querySelector("#authForm").onsubmit = async (e) => {
    e.preventDefault();
    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;
    const btn = e.submitter;
    btn.disabled = true;
    btn.textContent = "جارٍ المعالجة...";
    let result;
    if (login) result = await supabase.auth.signInWithPassword({ email, password });
    else result = await supabase.auth.signUp({ email, password });
    if (result.error) {
      btn.disabled = false;
      btn.textContent = login ? "دخول" : "إنشاء الحساب";
      authView(mode, result.error.message);
      return;
    }
    if (!login && !result.data.session) {
      authView("login", "تم إنشاء الحساب. إذا كان تأكيد البريد مفعّلًا، افتح بريدك وأكد الحساب ثم سجّل الدخول.");
      return;
    }
    await startChat(result.data.session?.user || result.data.user);
  };
}

function chatView() {
  app.innerHTML = `
    <main class="chat-shell">
      <header class="topbar">
        <div>
          <div class="brand compact"><span class="brand-mark">C</span><span>Chatter</span></div>
          <div class="subtitle">المحادثة العامة</div>
        </div>
        <button id="logout" class="logout">خروج</button>
      </header>
      <section id="messages" class="messages">
        <div class="loading">جارٍ تحميل المحادثة...</div>
      </section>
      <form id="sendForm" class="composer">
        <input id="message" maxlength="2000" autocomplete="off" placeholder="اكتب رسالتك..." />
        <button class="send" type="submit" aria-label="إرسال">إرسال</button>
      </form>
    </main>`;
  document.querySelector("#logout").onclick = async () => {
    await supabase.auth.signOut();
  };
  document.querySelector("#sendForm").onsubmit = sendMessage;
}

async function loadMessages() {
  const { data, error } = await supabase
    .from("messages")
    .select("id, body, created_at, sender_id, profiles(email)")
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) {
    document.querySelector("#messages").innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
    return;
  }
  renderMessages(data || []);
}

function renderMessages(messages) {
  const box = document.querySelector("#messages");
  if (!box) return;
  if (!messages.length) {
    box.innerHTML = `<div class="empty"><strong>أهلًا بك 👋</strong><span>لا توجد رسائل بعد. ابدأ المحادثة.</span></div>`;
    return;
  }
  box.innerHTML = messages.map(m => {
    const mine = m.sender_id === currentUser.id;
    const email = m.profiles?.email || "مستخدم";
    const time = new Date(m.created_at).toLocaleTimeString("ar-MA", { hour: "2-digit", minute: "2-digit" });
    return `<article class="message ${mine ? "mine" : ""}">
      <div class="message-meta"><strong>${mine ? "أنت" : escapeHtml(email)}</strong><time>${time}</time></div>
      <div class="bubble">${escapeHtml(m.body)}</div>
    </article>`;
  }).join("");
  box.scrollTop = box.scrollHeight;
}

async function sendMessage(e) {
  e.preventDefault();
  const input = document.querySelector("#message");
  const body = input.value.trim();
  if (!body || !currentUser) return;
  input.disabled = true;
  const { error } = await supabase.from("messages").insert({ body, sender_id: currentUser.id });
  input.disabled = false;
  if (error) {
    alert(error.message);
    return;
  }
  input.value = "";
  input.focus();
}

function subscribe() {
  if (channel) supabase.removeChannel(channel);
  channel = supabase.channel("public-chat")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async () => {
      await loadMessages();
    })
    .subscribe();
}

async function startChat(user) {
  currentUser = user;
  if (!currentUser) return authView("login");
  chatView();
  await loadMessages();
  subscribe();
}

async function boot() {
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) await startChat(data.session.user);
  else authView("login");

  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) await startChat(session.user);
    else {
      if (channel) await supabase.removeChannel(channel);
      channel = null;
      currentUser = null;
      authView("login");
    }
  });
}

boot();
