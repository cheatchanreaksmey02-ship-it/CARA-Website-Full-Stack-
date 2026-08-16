// ============================================================
// Auth helpers — used by login.html, register.html, forgot/reset
// password pages, and every page that needs to know who's logged in.
// Requires supabase-config.js to be loaded first.
// ============================================================

async function registerUser(fullName, email, password) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });
  return { data, error };
}

async function loginUser(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  return { data, error };
}

async function logoutUser() {
  await supabaseClient.auth.signOut();
  const inAdmin = window.location.pathname.includes("/admin/");
  window.location.href = inAdmin ? "../html/index.html" : "index.html";
}

async function sendPasswordReset(email) {
  const redirectTo = window.location.origin + window.location.pathname.replace("forgot-password.html", "reset-password.html");
  const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });
  return { data, error };
}

async function updatePassword(newPassword) {
  const { data, error } = await supabaseClient.auth.updateUser({ password: newPassword });
  return { data, error };
}

// Returns { user, profile } or { user: null, profile: null }
async function getCurrentUser() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return { user: null, profile: null };
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();
  return { user: session.user, profile };
}

// Call on any page to update the navbar (adds Login/Logout + Admin link)
async function refreshNavAuthState() {
  const { user, profile } = await getCurrentUser();
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  // remove any previously injected auth items
  navbar.querySelectorAll("[data-auth-item]").forEach(el => el.remove());

  if (user) {
    if (profile && profile.role === "admin") {
      const adminLi = document.createElement("li");
      adminLi.setAttribute("data-auth-item", "");
      adminLi.innerHTML = `<a href="../admin/dashboard.html">Admin</a>`;
      navbar.insertBefore(adminLi, document.getElementById("lg-bag"));
    }
    const accountLi = document.createElement("li");
    accountLi.setAttribute("data-auth-item", "");
    accountLi.innerHTML = `<a href="account.html">My Account</a>`;
    navbar.insertBefore(accountLi, document.getElementById("lg-bag"));

    const logoutLi = document.createElement("li");
    logoutLi.setAttribute("data-auth-item", "");
    logoutLi.innerHTML = `<a href="#" id="nav-logout">Logout</a>`;
    navbar.insertBefore(logoutLi, document.getElementById("lg-bag"));
    document.getElementById("nav-logout").addEventListener("click", (e) => {
      e.preventDefault();
      logoutUser();
    });
  } else {
    const loginLi = document.createElement("li");
    loginLi.setAttribute("data-auth-item", "");
    loginLi.innerHTML = `<a href="login.html">Login</a>`;
    navbar.insertBefore(loginLi, document.getElementById("lg-bag"));
  }
}

// Protect a page: redirect to login if not authenticated.
// loginPath/homePath let callers in subfolders (e.g. admin/) pass "../login.html".
// Pass requireAdmin = true to also require role === 'admin'.
async function requireAuth(requireAdmin = false, loginPath = "login.html", homePath = "index.html") {
  const { user, profile } = await getCurrentUser();
  if (!user) {
    window.location.href = loginPath;
    return null;
  }
  if (requireAdmin && (!profile || profile.role !== "admin")) {
    window.location.href = homePath;
    return null;
  }
  return { user, profile };
}

document.addEventListener("DOMContentLoaded", refreshNavAuthState);
