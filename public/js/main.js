/* =====================================================
   public/js/main.js – FINAL
   JWT + MongoDB + UI hoàn chỉnh
===================================================== */

/* ==================== AUTH STATE ==================== */
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let token = localStorage.getItem('token');
let selectedRoom = null;

/* ==================== DỮ LIỆU PHÒNG (FRONTEND) ==================== */
const rooms = [
  ...Array.from({ length: 10 }, (_, i) => ({
    id: 101 + i,
    type: "Phòng Đơn",
    price: 800000,
    image: "phong1.jpg",
    description: `Phòng đơn hiện đại ${101 + i}, view thành phố, đầy đủ tiện nghi.`
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    id: 201 + i,
    type: "Phòng Đôi",
    price: 1200000,
    image: "phong2.jpg",
    description: `Phòng đôi sang trọng ${201 + i}, giường king size, ban công riêng.`
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    id: 301 + i,
    type: "Phòng VIP Suite",
    price: 2800000,
    image: "phong3.jpg",
    description: `Suite VIP ${301 + i} – 80m², jacuzzi, dịch vụ butler 24/7.`
  }))
];

/* ==================== LOAD TRANG ==================== */
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();

  if (document.getElementById('roomList')) {
    displayRooms(rooms);
  }

  loadNews();
  startSlider();
});


/* ==================== AUTH UI ==================== */
function updateAuthUI() {
  const loginBtn = document.getElementById('loginBtn');
  const userInfo = document.getElementById('userInfo');
  
  // Các phần tử Desktop
  const userName = document.getElementById('userName');
  const adminLink = document.getElementById('adminLink');
  
  // Các phần tử Mobile
  const userNameMobile = document.getElementById('userNameMobile');
  const adminLinkMobile = document.getElementById('adminLinkMobile');

  if (currentUser && token) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (userInfo) userInfo.style.display = 'flex';
    
    // Hiển thị tên cho cả 2 bản
    if (userName) userName.textContent = currentUser.name || currentUser.email;
    if (userNameMobile) userNameMobile.textContent = currentUser.name || currentUser.email;

    // Kiểm tra quyền Admin cho cả 2 bản
    const isAdmin = currentUser.role === 'admin';
    if (adminLink) adminLink.style.display = isAdmin ? 'inline-block' : 'none';
    if (adminLinkMobile) adminLinkMobile.style.display = isAdmin ? 'inline-block' : 'none';

  } else {
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (userInfo) userInfo.style.display = 'none';
    if (adminLink) adminLink.style.display = 'none';
    if (adminLinkMobile) adminLinkMobile.style.display = 'none';
  }
}

function logout() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  location.reload();
}

/* ==================== SEARCH ==================== */
function searchRooms() {
  const keyword = document
    .getElementById('searchInput')
    .value
    .trim()
    .toLowerCase();

  if (!keyword) return;

  // 1. GIỮ TÍNH NĂNG CŨ: lọc tại trang hiện tại
  const filtered = rooms.filter(r =>
    r.id.toString().includes(keyword) ||
    r.type.toLowerCase().includes(keyword) ||
    r.description.toLowerCase().includes(keyword)
  );

  displayRooms(filtered);

  // 2. MỞ booking.html#booking (kèm keyword)
  setTimeout(() => {
    window.location.href =
      `booking.html#booking`;
  }, 300); // delay nhẹ để user thấy kết quả
}
function toggleMobileMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}
document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) return;

  document.getElementById('mobileUsername').innerText = user.name || user.email;

  if (user.role !== 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.remove());
  }
});
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('mobileHamburger');
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('mobileOverlay');

  function openMenu() {
    drawer.classList.add('active');
    overlay.classList.add('active');
  }

  function closeMenu() {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
  }

  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    openMenu();
  });

  overlay.addEventListener('click', closeMenu);
});

/* ==================== HIỂN THỊ DANH SÁCH PHÒNG ==================== */
function displayRooms(list) {
  const roomList = document.getElementById('roomList');
  if (!roomList) return;

  if (!list || list.length === 0) {
    roomList.innerHTML =
      '<p style="grid-column:1/-1;text-align:center;">Không tìm thấy phòng</p>';
    return;
  }

  roomList.innerHTML = list.map(r => `
    <div class="room-card">
      <img src="${r.image}" alt="${r.type}">
      <h3>Phòng ${r.id} - ${r.type}</h3>
      <p>${r.description}</p>
      <div class="price">${r.price.toLocaleString()}đ / đêm</div>
      <button onclick="bookRoom(${r.id})">
        ${currentUser ? 'Đặt ngay' : 'Đăng nhập để đặt'}
      </button>
    </div>
  `).join('');
}

/* ==================== CHUYỂN SANG TRANG ĐẶT PHÒNG ==================== */
function bookRoom(roomId) {
  if (!currentUser || !token) {
    showToast('Vui lòng đăng nhập để đặt phòng',true);
    location.href = '/login.html';
    return;
  }

  // Chuyển hướng đến booking-form.html với roomId trong URL
  location.href = `/booking-form.html?room=${roomId}`;
}

/* ==================== TOAST ==================== */
function showToast(msg) {
  const toast = document.getElementById('successToast');
  if (!toast) return;

  toast.querySelector('span').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

/* ==================== SLIDER ==================== */
function startSlider() {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  if (!slides.length) return;

  let index = 0;

  function show(n) {
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    index = (n + slides.length) % slides.length;
    slides[index].classList.add('active');
    dots[index] && dots[index].classList.add('active');
  }

  setInterval(() => show(index + 1), 4500);
  window.currentSlide = n => show(n);
  show(0);
}

/* ==================== LOAD NEWS (PUBLIC) ==================== */
function loadNews() {
  let loaded = false;
  const newsList = document.getElementById('newsList');
  if (!newsList) return;
  // ===== PUBLIC NEWS (KHÔNG CẦN ĐĂNG NHẬP) =====
  fetch('/api/news')
    .then(r => r.json())
    .then(res => {
  if (res.success && res.data && res.data.length > 0) {
    loaded = true;
    newsList.innerHTML = res.data.map(n => `
          <div class="news-card">
            <img src="${n.image || 'images/news-default.jpg'}">
            <h3>${n.title}</h3>
            <p>${n.content}</p>
            <small>${n.date}</small>
          </div>
        `).join('');
        return;
      }
    })
    .catch(() => {});
  fetch('/api/news/public')
    .then(r => r.json())
    .then(res => {
  if (loaded) return;
      if (!res.success || !res.data || res.data.length === 0) {
        newsList.innerHTML =
          '<p style="text-align:center;color:#666;">Chưa có tin tức</p>';
        return;
      }

      newsList.innerHTML = res.data.map(n => `
<div class="news-item">
  <img src="${news.image || 'images/news-default.jpg'}" alt="${news.title}">
  <div class="news-content">
    <h3>${news.title}</h3>
    <p>${news.content}</p>
    <small>${news.date || ''}</small>
  </div>
</div>

      `).join('');
    })
    .catch(() => {
      newsList.innerHTML =
        '<p style="text-align:center;color:red;">Vui lòng đợi trong giây lát !</p>';
    });
}
function toggleUserMenu() {
  document.getElementById("userMenu").classList.toggle("show");
}

document.addEventListener("click", function (e) {
  const wrapper = document.querySelector(".user-dropdown-wrapper");
  if (wrapper && !wrapper.contains(e.target)) {
    document.getElementById("userMenu").classList.remove("show");
  }
});
/* Hàm hiển thị thông báo thay thế alert */
function showToast(message, isError = false) {
    // Tạo element toast mới
    const toast = document.createElement("div");
    toast.className = "toast";
    if (isError) toast.classList.add("error");
    toast.textContent = message;
    document.body.appendChild(toast);

    // Kích hoạt hiệu ứng hiện lên
    setTimeout(() => toast.classList.add("show"), 100);

    // Tự động biến mất sau 3 giây
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 500); // Xóa khỏi DOM
    }, 3000);
}

/* Kiểm tra Token thay vì alert */
if (!token) {
  showToast("Bạn cần đăng nhập để đặt phòng!", true);
}

/* ... (Phần logic rooms giữ nguyên) ... */

/* Cập nhật hàm Submit */
async function submitBooking() {
  const phone = document.getElementById('phone');
  const checkin = document.getElementById('checkin');
  const checkout = document.getElementById('checkout');
  const roomSelect = document.getElementById('roomSelect');

  if (!phone.value || !checkin.value || !checkout.value || !roomSelect.value) {
    showToast("Vui lòng nhập đủ thông tin bắt buộc!", true);
    return;
  }

  try {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        phone: phone.value,
        roomId: roomSelect.value,
        checkin: checkin.value,
        checkout: checkout.value
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast("Đặt phòng thành công! Đang chuyển hướng...");
      setTimeout(() => location.href = "/myrooms.html", 2500);
    } else {
      showToast(data.message || "Đặt phòng thất bại", true);
    }
  } catch (err) {
    showToast("Lỗi kết nối máy chủ!", true);
  }
}