// public/js/auth.js – FINAL (JWT)

/* =========================
   TIỆN ÍCH LẤY GIÁ TRỊ INPUT
========================= */
function val(id) {
  return document.getElementById(id)?.value.trim();
}

/* =========================
   HIỂN THỊ THÔNG BÁO
========================= */
function showMsg(text, color = "red") {
  const msg = document.getElementById('msg');
  msg.textContent = text;
  msg.style.color = color;
}

/* =========================
   ĐĂNG NHẬP (JWT)
========================= */
async function login() {
  const email = val('email');
  const password = val('password');

  if (!email || !password) {
    showMsg("Vui lòng nhập email và mật khẩu!");
    return;
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showMsg(data.message || "Đăng nhập thất bại!");
      return;
    }

    /* ===== LƯU JWT + USER ===== */
    localStorage.setItem('token', data.token);
    localStorage.setItem(
      'user',
      JSON.stringify({
        name: data.user.name,
        email: data.user.email,
        role: data.user.role || 'user'
      })
    );

    showMsg("Đăng nhập thành công!", "green");
    setTimeout(() => (location.href = '/'), 800);

  } catch (err) {
    showMsg("Không thể kết nối server!");
  }
}

/* =========================
   ĐĂNG KÝ
========================= */
async function register() {
  const name = val('name');
  const email = val('email');
  const password = val('password');

  if (!name || !email || !password) {
    showMsg("Vui lòng điền đầy đủ thông tin!");
    return;
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showMsg(data.message || "Đăng ký thất bại!");
      return;
    }

    showMsg("Đăng ký thành công! Chuyển sang đăng nhập...", "green");
    setTimeout(() => (location.href = '/login.html'), 1200);

  } catch (err) {
    showMsg("Không thể kết nối server!");
  }
}

/* =========================
   ĐĂNG XUẤT (JWT)
========================= */
function logout() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  location.href = '/login.html';
}
