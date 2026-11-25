const form = document.getElementById("requestForm");
const list = document.getElementById("requestList");
const message = document.getElementById("formMessage");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
let requests = [];
let currentUser = null;

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[char]);
}
function statusClass(status) {
  return "s-" + status.toLowerCase().replace(/\s+/g, "-");
}
function updateStats() {
  document.getElementById("totalCount").textContent = requests.length;
  document.getElementById("pendingCount").textContent = requests.filter(r => r.status === "Pending").length;
  document.getElementById("progressCount").textContent = requests.filter(r => r.status === "In Progress").length;
  document.getElementById("resolvedCount").textContent = requests.filter(r => r.status === "Resolved").length;
}
function renderRequests() {
  const term = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const filtered = requests.filter(r => {
    const matches = [r.id, r.name, r.category, r.location].some(v => String(v).toLowerCase().includes(term));
    return matches && (status === "All" || r.status === status);
  });
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">${requests.length ? "No requests match your search." : "No requests yet. Submit your first service request above."}</div>`;
    return;
  }
  list.innerHTML = filtered.map(r => `
    <article class="request-card">
      <div class="request-main"><span class="request-id">${escapeHTML(r.id)}</span><b>${escapeHTML(r.category)} · ${escapeHTML(r.name)}</b><small>${escapeHTML(r.description)}</small></div>
      <div class="request-meta"><strong>${escapeHTML(r.location)}</strong><small>${new Date(r.createdAt).toLocaleString()}</small></div>
      <div class="request-meta"><strong>${escapeHTML(r.priority)} priority</strong><small>${escapeHTML(r.email)}</small></div>
      <div class="request-status">
        <span class="status-label ${statusClass(r.status)}">
          ${escapeHTML(r.status)}
        </span>

        ${currentUser && currentUser.role === "admin" ? `
          <select aria-label="Update status" data-id="${escapeHTML(r.id)}">
            <option ${r.status==="Pending"?"selected":""}>Pending</option>
            <option ${r.status==="In Progress"?"selected":""}>In Progress</option>
            <option ${r.status==="Resolved"?"selected":""}>Resolved</option>
            <option ${r.status==="Rejected"?"selected":""}>Rejected</option>
          </select>
        ` : ""}
      </div>
    </article>`).join("");
}
async function loadRequests() {
  try {
    requests = await api("/api/requests");
    updateStats();
    renderRequests();
  } catch (error) {
    list.innerHTML = `<div class="empty-state">Could not connect to the server. Please start the Node.js server and refresh.</div>`;
  }
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  message.textContent = "Submitting your request...";
  message.className = "form-message";
  const payload = Object.fromEntries(new FormData(form).entries());
  try {
    const created = await api("/api/requests", { method: "POST", body: JSON.stringify(payload) });
    form.reset();
    message.textContent = `Request submitted successfully! Your request ID is ${created.id}.`;
    message.className = "form-message success";
    await loadRequests();
    document.getElementById("requests").scrollIntoView({ behavior: "smooth" });
    showToast("Your request has been submitted.");
  } catch (error) {
    message.textContent = error.message;
    message.className = "form-message error";
  }
});
list.addEventListener("change", async event => {
  if (!event.target.matches("select[data-id]")) return;
  const id = event.target.dataset.id;
  try {
    await api(`/api/requests/${encodeURIComponent(id)}`, {
      method: "PATCH", body: JSON.stringify({ status: event.target.value })
    });
    await loadRequests();
    showToast("Request status updated.");
  } catch (error) {
    showToast(error.message);
    loadRequests();
  }
});
searchInput.addEventListener("input", renderRequests);
statusFilter.addEventListener("change", renderRequests);
document.getElementById("refreshBtn").addEventListener("click", loadRequests);
let toastTimer;
function showToast(text) {
  const toast = document.getElementById("toast");
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

async function checkLogin() {
  try {
    const result = await api("/api/me");

    if (!result.user) {
      window.location.href = "/login.html";
      return;
    }

    currentUser = result.user;

    const nav = document.querySelector(".topbar nav");

    if (nav) {
      nav.insertAdjacentHTML(
        "beforeend",
        `<span>Welcome, ${escapeHTML(currentUser.name)}</span>
         <button id="logoutBtn" type="button">Logout</button>`
      );
    }

    if (currentUser.role === "admin") {
      document.querySelector(".request-section").style.display = "none";
      document.querySelector(".admin-note").textContent =
        "Admin panel: Manage all customer service requests.";
    } else {
      document.querySelector(".admin-note").style.display = "none";

      const emailInput = form.querySelector('[name="email"]');
      const nameInput = form.querySelector('[name="name"]');

      emailInput.value = currentUser.email;
      emailInput.readOnly = true;

      nameInput.value = currentUser.name;
      nameInput.readOnly = true;
    }

    await loadRequests();

    document.getElementById("logoutBtn").addEventListener("click", async () => {
      try {
        await api("/api/logout", { method: "POST" });
        window.location.href = "/login.html";
      } catch (error) {
        showToast(error.message);
      }
    });

  } catch (error) {
    window.location.href = "/login.html";
  }
}

checkLogin();
