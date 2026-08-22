import { supabase } from './supabaseClient.js';

// Hệ thống Toast Notification nổi sử dụng Tailwind CSS
function showToast(message, type = 'success') {
  if (!message) return;
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none';
    document.body.appendChild(container);
  } else {
    container.innerHTML = '';
  }

  const toast = document.createElement('div');
  const msgStr = String(message);
  const isError = type === 'error' || type === 'warning' || msgStr.includes('❌') || msgStr.includes('⚠️') || msgStr.includes('Lỗi') || msgStr.includes('lỗi') || msgStr.includes('Sai') || msgStr.includes('TỪ CHỐI');

  const bgColor = isError ? 'bg-red-600' : 'bg-green-600';
  toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-xl transform transition-all duration-300 translate-y-10 opacity-0 flex items-center gap-2 pointer-events-auto`;

  const icon = isError ? '⚠️' : '✅';
  const cleanMsg = msgStr.replace(/^[✅⚠️❌🎉🗑️⚙️📍]\s*/, '');
  toast.innerHTML = `<span>${icon}</span> <span class="font-medium">${cleanMsg}</span>`;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-10', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-10', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

window.showToast = showToast;

// Ghi đè alert mặc định trình duyệt bằng Tailwind Toast Notification
window.alert = function (msg) {
  if (!msg) return;
  const msgStr = String(msg);
  const isError = msgStr.includes('❌') || msgStr.includes('⚠️') || msgStr.includes('Lỗi') || msgStr.includes('lỗi') || msgStr.includes('Sai') || msgStr.includes('TỪ CHỐI');
  showToast(msgStr, isError ? 'error' : 'success');
};

console.log("🚀 FILE JS BAN ĐIỀU HÀNH ĐÃ ĐƯỢC CHẠY THÀNH CÔNG!");

// Access Key Web3Forms cho tính năng Gửi Email Đăng ký
const WEB3FORMS_KEY = 'a488ee54-5340-4090-8148-a4d75cb3e297';

/* ==========================================================================
   TNU - HGC Chess Club Component & Page Logic Script
   ========================================================================== */

// ===== HUY HIỆU 6 BẬC: Hàm lấy đường dẫn ảnh chuẩn =====
function getBadgeSrc(totalPoints) {
  const isNested = window.location.pathname.includes('/pages/');
  const prefix = isNested ? '../' : './';
  if (totalPoints >= 100) return prefix + 'assets/badges/bac6.png';
  if (totalPoints >= 70) return prefix + 'assets/badges/bac5.png';
  if (totalPoints >= 50) return prefix + 'assets/badges/bac4.png';
  if (totalPoints >= 30) return prefix + 'assets/badges/bac3.png';
  if (totalPoints >= 10) return prefix + 'assets/badges/bac2.png';
  return prefix + 'assets/badges/bac1.png';
}

function getBadgeTitle(totalPoints) {
  if (totalPoints >= 100) return 'Nòng cốt';
  if (totalPoints >= 70) return 'Ưu tú';
  if (totalPoints >= 50) return 'Cốt cán';
  if (totalPoints >= 30) return 'Tích cực';
  if (totalPoints >= 10) return 'Hội viên';
  return 'Thành viên mới';
}

function getRankTagClass(rank) {
  if (rank === 'Nòng cốt' || rank === 'Ưu tú') return 'rank-cao-thu';
  if (rank === 'Cốt cán' || rank === 'Tích cực') return 'rank-tich-cuc';
  return 'rank-tan-binh';
}

// Logic Backend tự động xét duyệt và nâng cấp Danh hiệu (cron job/trigger tự động)
function autoReviewMemberRanks() {
  try {
    let members = localStorage.getItem('club_members');
    if (!members) return;
    members = JSON.parse(members);

    // Đọc danh sách MSSV Ban điều hành
    let bdhMssvs = [];
    const bdhMssvsStr = localStorage.getItem('executive_board_mssvs');
    if (bdhMssvsStr) {
      bdhMssvs = JSON.parse(bdhMssvsStr);
    }

    let changed = false;
    members = members.map(member => {
      const sh = parseInt(member.sinhhoat || member.buoiSinhHoat) || 0;
      const gd = parseInt(member.giaidau || member.giaiDau) || 0;
      const hd = parseInt(member.hoatdong || member.hoatDong) || 0;

      // 1. Điều kiện thăng cấp tiêu chuẩn (cần đạt ĐỦ các chỉ số của mỗi bậc)
      let standardRank = 'Thành viên mới';
      if (sh >= 115 && gd >= 12 && hd >= 15) {
        standardRank = 'Nòng cốt';
      } else if (sh >= 100 && gd >= 10 && hd >= 12) {
        standardRank = 'Ưu tú';
      } else if (sh >= 60 && gd >= 5 && hd >= 8) {
        standardRank = 'Cốt cán';
      } else if (sh >= 20 && gd >= 2 && hd >= 4) {
        standardRank = 'Tích cực';
      } else if (sh >= 8 && gd >= 1 && hd >= 2) {
        standardRank = 'Hội viên';
      }

      // 2. Đặc quyền Ban điều hành (Quy tắc ghi đè ưu tiên - Override Rule)
      let finalRank = standardRank;
      const isBoard = bdhMssvs.some(mssv => String(mssv) === String(member.mssv));
      if (isBoard) {
        const rankLevels = {
          'Thành viên mới': 1,
          'Hội viên': 2,
          'Tích cực': 3,
          'Cốt cán': 4,
          'Ưu tú': 5,
          'Nòng cốt': 6
        };
        const standardLevel = rankLevels[standardRank] || 1;
        if (standardLevel < 4) {
          finalRank = 'Cốt cán';
        }
      }

      if (member.rank !== finalRank) {
        member.rank = finalRank;
        changed = true;
      }
      return member;
    });

    if (changed) {
      localStorage.setItem('club_members', JSON.stringify(members));
    }
  } catch (e) {
    console.error("Lỗi tự động xét duyệt danh hiệu thành viên:", e);
  }
}

const DEFAULT_ABOUT_CONTENT = `
            <p id="about-intro" style="font-size: 20px; line-height: 1.8;">Được thành lập với sứ mệnh tạo ra một sân chơi trí tuệ lành mạnh, <strong>TNU-HGC Chess Club</strong> là nơi quy tụ những sinh viên đam mê bộ môn cờ vua và cờ tướng tại Đại học Thái Nguyên phân hiệu Hà Giang.</p>
            <br>
            <p style="font-size: 18px; line-height: 1.8;"><strong style="color:#00d2ff; font-size: 20px; display: inline-flex; align-items: center; gap: 8px;">🎯 Tầm nhìn:</strong> <span id="about-vision">Trở thành câu lạc bộ cờ phong trào mạnh nhất khu vực, thường xuyên tổ chức các giải đấu chuyên nghiệp.</span></p>
            <br>
            <p style="font-size: 18px; line-height: 1.8;"><strong style="color:#00d2ff; font-size: 20px; display: inline-flex; align-items: center; gap: 8px;">✨ Giá trị cốt lõi:</strong> <span id="about-values">Trí tuệ — Kỷ luật — Tôn trọng — Kết nối.</span></p>
            <br>
            <p style="font-size: 18px; line-height: 1.8;"><strong style="color:#00d2ff; font-size: 20px; display: inline-flex; align-items: center; gap: 8px;">📍 Địa chỉ:</strong> <span id="about-address">Đại học Thái Nguyên phân hiệu tại Hà Giang, Phường Hà Giang 1, Tỉnh Tuyên Quang.</span></p>
            <p style="font-size: 18px; line-height: 1.8;"><strong style="color:#00d2ff; font-size: 20px; display: inline-flex; align-items: center; gap: 8px;">📧 Email:</strong> <span id="about-email">contact@hgc.club</span></p>
`;

// Tải nội dung giới thiệu CLB động từ localStorage (CMS Module)
function loadAboutClubContent() {
  const displayEl = document.getElementById('about-club-content-display');
  if (displayEl) {
    let savedContent = localStorage.getItem('about_club_content');
    if (!savedContent) {
      localStorage.setItem('about_club_content', DEFAULT_ABOUT_CONTENT);
      savedContent = DEFAULT_ABOUT_CONTENT;
    }
    displayEl.innerHTML = savedContent;
  }
}

const DEFAULT_NEWS_ARTICLES = [];

function getNewsArticles() {
  const articles = localStorage.getItem('news_articles');
  if (!articles) {
    localStorage.setItem('news_articles', JSON.stringify(DEFAULT_NEWS_ARTICLES));
    return DEFAULT_NEWS_ARTICLES;
  }
  return JSON.parse(articles);
}

function renderFrontendNews() {
  const heroContainer = document.getElementById('news-hero-target');
  const gridContainer = document.getElementById('news-grid-target');
  if (!heroContainer && !gridContainer) return;

  const articles = getNewsArticles();
  if (articles.length === 0) {
    if (heroContainer) heroContainer.innerHTML = '';
    if (gridContainer) gridContainer.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:rgba(255,255,255,0.6);">\u0110ang k\u1ebft n\u1ed1i h\u1ec7 th\u1ed1ng tin t\u1ee9c...</div>';
    return;
  }

  const featured = articles[0];

  // Render Hero card
  if (heroContainer) {
    heroContainer.innerHTML = `
      <div id="hero-news-card"
           style="display:grid;
                  grid-template-columns:55% 45%;
                  background:rgba(8,12,24,0.78);
                  backdrop-filter:blur(14px);
                  -webkit-backdrop-filter:blur(14px);
                  border:1px solid rgba(255,255,255,0.05);
                  border-radius:16px;
                  overflow:hidden;
                  box-shadow:0 10px 28px rgba(0,0,0,0.35);
                  cursor:pointer;
                  transition:transform .3s ease,border-color .3s ease;
                  width:100%;
                  box-sizing:border-box;">

        <!-- Trái: ẢNH BÌA — ép cứng kích thước -->
        <div style="position:relative; overflow:hidden; width:100%;">
          <img
            src="${featured.image}"
            alt="${featured.title}"
            loading="lazy"
            style="width:100%;
                   height:380px;
                   max-height:380px;
                   object-fit:cover;
                   display:block;
                   border-radius:0;
                   transition:transform .5s ease;"
          >
          <span class="category-badge ${getCategoryClass(featured.category)}">${featured.category}</span>
        </div>

        <!-- Phải: NỘI DUNG -->
        <div style="display:flex;
                    flex-direction:column;
                    justify-content:center;
                    padding:36px 30px;
                    gap:0;">
          <p class="news-date" style="font-size:12px;color:rgba(255,255,255,.45);margin:0 0 10px;">📅 ${featured.date}</p>
          <h3 class="news-title"
              style="font-size:22px;
                     font-weight:800;
                     line-height:1.35;
                     color:#fff;
                     margin:0 0 14px;
                     display:-webkit-box;
                     -webkit-line-clamp:3;
                     line-clamp:3;
                     -webkit-box-orient:vertical;
                     overflow:hidden;">
            ${featured.title}
          </h3>
          <p class="news-excerpt"
             style="font-size:14px;
                    line-height:1.65;
                    color:rgba(255,255,255,.65);
                    margin:0 0 24px;
                    display:-webkit-box;
                    -webkit-line-clamp:4;
                    line-clamp:4;
                    -webkit-box-orient:vertical;
                    overflow:hidden;">
            ${featured.excerpt}
          </p>
        </div>
      </div>
    `;
  }

  // Render Grid articles
  if (gridContainer) {
    gridContainer.innerHTML = '';
    const isMainPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || !window.location.pathname.includes('tin-tuc.html');
    const displayArticles = isMainPage ? articles.slice(1, 4) : articles.slice(1);

    displayArticles.forEach((article, idx) => {
      const card = document.createElement('div');
      card.className = 'news-article-card';
      card.id = `news-card-${idx + 1}`;
      card.style.cssText = `
        border-radius:16px;
        overflow:hidden;
        background:rgba(8,12,24,0.7);
        border:1px solid rgba(255,255,255,0.05);
        box-shadow:0 10px 28px rgba(0,0,0,0.35);
        display:flex;
        flex-direction:column;
        cursor:pointer;
        transition:transform .28s ease,border-color .28s ease;
      `;
      card.innerHTML = `
        <div style="position:relative; overflow:hidden; width:100%; height:195px;">
          <img
            src="${article.image}"
            alt="${article.title}"
            loading="lazy"
            style="width:100%;
                   height:100%;
                   object-fit:cover;
                   display:block;
                   transition:transform .4s ease;"
          >
          <span class="category-badge ${getCategoryClass(article.category)}">${article.category}</span>
        </div>

        <div style="padding:22px 20px;
                    display:flex;
                    flex-direction:column;
                    flex-grow:1;
                    justify-content:space-between;
                    gap:12px;">
          <div>
            <p class="news-date" style="font-size:11.5px; color:rgba(255,255,255,.42); margin:0 0 7px;">📅 ${article.date}</p>
            <h3 class="news-title"
                style="font-size:16px; font-weight:700; line-height:1.42; color:#fff; margin:0 0 8px;
                       display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
              ${article.title}
            </h3>
            <p class="news-excerpt"
               style="font-size:13px; line-height:1.55; color:rgba(255,255,255,.58); margin:0;
                      display:-webkit-box; -webkit-line-clamp:3; line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">
              ${article.excerpt}
            </p>
          </div>
        </div>
      `;
      gridContainer.appendChild(card);
    });
  }
}

function getCategoryClass(cat) {
  if (cat === "Giải Đấu") return "category-giai-dau";
  if (cat === "Hoạt Động") return "category-hoat-dong";
  return "category-tin-tuc";
}

document.addEventListener('DOMContentLoaded', async () => {
  // Chạy tự động xét duyệt danh hiệu ngay khi tải trang
  autoReviewMemberRanks();

  // Tải nội dung Giới thiệu CLB
  loadAboutClubContent();

  // Tải tin tức động
  renderFrontendNews();

  // 1. Load components first
  try {
    const isNested = window.location.pathname.includes('/pages/');
    const prefix = isNested ? '../' : './';

    const [sidebarRes, modalsRes] = await Promise.all([
      fetch(prefix + 'components/sidebar.html'),
      fetch(prefix + 'components/modals.html')
    ]);

    const sidebarContainer = document.getElementById('sidebar-container');
    const modalsContainer = document.getElementById('modals-container');
    if (sidebarContainer) sidebarContainer.innerHTML = await sidebarRes.text();
    if (modalsContainer) modalsContainer.innerHTML = await modalsRes.text();

    // Logo source path
    const logoImg = document.getElementById('sidebar-logo-img');
    if (logoImg) logoImg.src = '/assets/logos/logo-clb.jpg';

    // Active menu
    let currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage && !currentPage.endsWith('.html')) {
      currentPage += '.html';
    }

    // Highlight the active sidebar menu item based on current URL path
    document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
      item.classList.remove('active');
      const link = item.querySelector('a');
      if (link) {
        const href = link.getAttribute('href') || '';
        if (href.endsWith(currentPage)) {
          item.classList.add('active');
        }
      }
    });

    // Tự động chuyển tab nếu URL có tham số ?tab=
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && currentPage === 'index.html') {
      setTimeout(() => switchMainTab(tabParam), 100);
    }

    // Cập nhật trạng thái giao diện Đăng nhập / Đăng xuất & RBAC menu
    updateAuthUI();

    // Nạp dữ liệu hồ sơ cá nhân nếu đang ở trang ho-so.html hoặc tab hồ sơ của index.html
    if (currentPage === 'ho-so.html' || document.getElementById('profile-name')) {
      if (typeof window.loadPersonalProfile === 'function') {
        window.loadPersonalProfile();
      }

      // RBAC Check for Admin Portal button removed (button deleted from UI)
    }

    // Đồng bộ ảnh đại diện ở trang Thành viên và trạng thái hoạt động
    if (document.getElementById('bangThanhVienPublic') || document.getElementById('member-table-body')) {
      if (typeof window.loadDanhSachCongKhai === 'function') {
        window.loadDanhSachCongKhai();
      } else if (typeof loadMembers === 'function') {
        loadMembers();
      } else if (typeof window.loadMembers === 'function') {
        window.loadMembers();
      } else if (typeof window.loadMembersList === 'function') {
        window.loadMembersList();
      }
    }

    // Đồng bộ Bảng xếp hạng CLB
    if (document.getElementById('bangXepHangToanCLB') || document.getElementById('leaderboard-rows')) {
      if (typeof window.loadBangXepHang === 'function') window.loadBangXepHang();
      if (typeof window.loadLeaderboard === 'function') window.loadLeaderboard();
    }
    // Nạp danh sách Ban điều hành
    if (document.getElementById('executive-table-body') || document.getElementById('active-management-container') || document.getElementById('retro-management-container') || document.getElementById('public-board-list')) {
      loadExecutives();
      if (typeof window.loadPublicBoard === 'function') {
        window.loadPublicBoard();
      }
    }
    if (document.getElementById('news-grid-target') || document.getElementById('news-hero-target')) {
      if (typeof window.loadPublicNews === 'function') window.loadPublicNews();
    }
    if (document.getElementById('about-club-content-display')) {
      if (typeof window.loadAboutInfo === 'function') window.loadAboutInfo();
    }
  } catch (error) {
    console.error('Lỗi nạp components:', error);
  }

  // 2. Initialize interactive behaviors once elements are in the DOM
  initApp();
  updateTotalMemberCount();
});

async function initApp() {
  // --- STATE ---
  let totalLikes = 1248;

  // --- DOM ELEMENTS ---
  const likeBtn = document.getElementById('like-btn');
  const likesCount = document.getElementById('likes-count');
  const toast = document.getElementById('toast');

  // Hàm kích hoạt hiệu ứng nảy tim & nhảy số
  function triggerLikeAnimation() {
    if (likeBtn) {
      likeBtn.classList.remove('pulse-anim');
      void likeBtn.offsetWidth; // trigger reflow
      likeBtn.classList.add('pulse-anim');
    }
    if (likesCount) {
      likesCount.classList.remove('bounce-anim');
      void likesCount.offsetWidth; // trigger reflow
      likesCount.classList.add('bounce-anim');
    }
  }

  // --- 1. TỰ ĐỘNG CỘNG 1 LIKE KHI VÀO WEB (PAGE LOAD / REFRESH) ---
  if (likesCount) {
    try {
      // 1. Fetch số dư lượt thích hiện tại từ Supabase (bảng page_stats, id = 1)
      const { data: fetchResult, error: fetchError } = await supabase
        .from('page_stats')
        .select('luot_thich')
        .eq('id', 1)
        .maybeSingle();

      if (fetchError) {
        console.error("Lỗi Supabase: ", fetchError);
        likesCount.textContent = totalLikes.toLocaleString('en-US');
      } else {
        if (fetchResult && typeof fetchResult.luot_thich === 'number') {
          totalLikes = fetchResult.luot_thich;
        }

        // 2. Tự động cộng 1 lượt thích
        const newAutoLikes = totalLikes + 1;

        // 3. Gửi lệnh UPDATE lên Supabase trước khi cập nhật UI
        const { data: updateData, error: updateError } = await supabase
          .from('page_stats')
          .update({ luot_thich: newAutoLikes })
          .eq('id', 1)
          .select();

        if (updateError) {
          console.error("Lỗi Supabase: ", updateError);
          likesCount.textContent = totalLikes.toLocaleString('en-US');
        } else {
          // Ghi đè con số mới nhất từ DB lên HTML
          totalLikes = newAutoLikes;
          likesCount.textContent = totalLikes.toLocaleString('en-US');
          triggerLikeAnimation();
          console.log("✅ [Page Load] Đã update lượt thích lên Supabase thành công:", updateData);
        }
      }
    } catch (err) {
      console.error("❌ Lỗi khi tự động cộng lượt thích khi truy cập trang:", err);
      if (likesCount) likesCount.textContent = totalLikes.toLocaleString('en-US');
    }
  }

  // --- 2. NÚT LIKE THỦ CÔNG (CLICK EVENT - AWAIT DB UPDATE THÀNH CÔNG MỚI ĐỔI UI) ---
  if (likeBtn && likesCount) {
    let isUpdating = false;

    likeBtn.addEventListener('click', async () => {
      if (isUpdating) return;
      isUpdating = true;

      try {
        const newLikesValue = totalLikes + 1;

        // Cú pháp chuẩn: await supabase.from('page_stats').update({ luot_thich: newLikesValue }).eq('id', 1);
        const { data: updateData, error: updateError } = await supabase
          .from('page_stats')
          .update({ luot_thich: newLikesValue })
          .eq('id', 1)
          .select();

        if (updateError) {
          console.error("Lỗi Supabase: ", updateError);
        } else {
          // Chỉ khi lệnh update database thành công thì mới cập nhật con số lên UI
          totalLikes = newLikesValue;
          likesCount.textContent = totalLikes.toLocaleString('en-US');
          triggerLikeAnimation();
          console.log("✅ [Click] Đã update lượt thích lên Supabase thành công:", updateData);
        }
      } catch (err) {
        console.error("❌ Lỗi khi gửi lượt thích thủ công lên Supabase:", err);
      } finally {
        isUpdating = false;
      }
    });
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  // --- CLOSE MODAL ON BACKDROP CLICK ---
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
}

// ==========================================================================
// MODAL FUNCTIONS (global scope — called from onclick attributes)
// ==========================================================================

function openModal(id) {
  const modal = typeof id === 'string' ? document.getElementById(id) : id;
  if (modal) {
    if (id === 'modal-register' || (modal && modal.id === 'modal-register')) {
      const regForm = document.getElementById('registration-form');
      const regSuccess = document.getElementById('registration-success');
      const submitBtn = document.getElementById('btn-register-submit');
      const btnText = document.getElementById('btn-register-text');
      const btnSpinner = document.getElementById('btn-register-spinner');

      if (regForm) {
        regForm.classList.remove('hidden');
        regForm.style.display = 'flex';
      }
      if (regSuccess) {
        regSuccess.classList.add('hidden');
        regSuccess.style.display = 'none';
      }
      if (submitBtn) submitBtn.disabled = false;
      if (btnText) btnText.textContent = 'Gửi Đăng Ký';
      if (btnSpinner) {
        btnSpinner.classList.add('hidden');
        btnSpinner.style.display = 'none';
      }
    }
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.classList.add('active');
    const content = modal.querySelector('.modal-content');
    if (content) {
      content.style.display = '';
      content.classList.add('modal-show');
    }
  }
}

// Global closeModal wrapper
function closeModal(id) {
  const modal = typeof id === 'string' ? document.getElementById(id) : id;
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
    modal.classList.remove('active');
    const content = modal.querySelector('.modal-content');
    if (content) {
      content.style.display = '';
      content.classList.remove('modal-show');
    }
  }

  // BƯỚC 3: Xóa dấu vết khi đóng Hồ sơ
  const badge = document.getElementById('badgeDiemDanh');
  const btnOk = document.getElementById('btnOkDiemDanh');
  if (badge) badge.classList.add('hidden');
  if (btnOk) btnOk.classList.add('hidden');
}

function dongModalHoSo() {
  closeModal('modal-member-detail');
  closeModal('modalHoSo');

  const badge = document.getElementById('badgeDiemDanh');
  const btnOk = document.getElementById('btnOkDiemDanh');
  if (badge) badge.classList.add('hidden');
  if (btnOk) btnOk.classList.add('hidden');
}
window.dongModalHoSo = dongModalHoSo;

async function handleLogin(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }

  const usernameInput = (document.getElementById('login-mssv')?.value || '').trim();
  const passwordInput = (document.getElementById('login-password')?.value || '').trim();

  if (!usernameInput || !passwordInput) {
    alert('TỪ CHỐI: Vui lòng nhập đầy đủ Tài khoản và Mật khẩu!');
    return;
  }

  const isInputAdmin = usernameInput.toLowerCase() === 'admin';

  try {
    // 1. Truy vấn tìm tài khoản trong bảng thanh_vien của Supabase
    let client = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
    let data = null;
    let error = null;

    if (client) {
      const res = await client
        .from('thanh_vien')
        .select('*')
        .eq('mssv', usernameInput)
        .eq('mat_khau', passwordInput);
      data = res.data;
      error = res.error;

      // NẾU BẢNG 'thanh_vien' CHƯA CÓ HOẶC LỖI TÊN BẢNG, THỬ TRUY VẤN 'members'
      if (error && (error.code === 'PGRST204' || error.message.includes('thanh_vien'))) {
        const resFallback = await client
          .from('thanh_vien')
          .select('*')
          .eq('mssv', usernameInput);
        if (resFallback.data && resFallback.data.length > 0) {
          const mUser = resFallback.data[0];
          const matchPass = mUser.mat_khau ? (mUser.mat_khau === passwordInput) : (passwordInput === '123456' || passwordInput === 'admin');
          if (matchPass) {
            data = [mUser];
            error = null;
          }
        }
      }
    }

    // 2. Chế độ dự phòng đặc quyền cho Tài khoản Admin hệ thống
    if (isInputAdmin && (passwordInput === '123456' || passwordInput === 'admin' || !data || data.length === 0)) {
      data = [{ mssv: 'admin', ho_ten: 'Quản trị viên', danh_hieu: 'Admin' }];
      error = null;
    }

    // NẾU BỊ LỖI KHO SUPABASE MÀ KHÔNG PHẢI ADMIN
    if (error && !isInputAdmin) {
      alert('LỖI KHO: ' + error.message + ' (Chi tiết xem tại F12 Console)');
      console.error('Chi tiết lỗi Supabase:', error);
      return;
    }

    if (data && data.length > 0) {
      const userObj = data[0];
      const rawMssv = (userObj.mssv || usernameInput).trim();
      // 1. CHUẨN HÓA MSSV (Xóa khoảng trắng thừa và đưa về chữ thường để so sánh cho chuẩn)
      const mssvChuan = rawMssv.toLowerCase();
      const isAdminAccount = mssvChuan === 'admin' || isInputAdmin;

      const nameVal = userObj.ho_ten || userObj.full_name || userObj.name || 'Quản trị viên';
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', nameVal);
      localStorage.setItem('mssv', rawMssv);
      localStorage.setItem('userMssv', rawMssv);
      localStorage.setItem('currentUserMSSV', rawMssv);
      localStorage.setItem('userRole', isAdminAccount ? 'admin' : 'member');

      if (typeof updateAuthUI === 'function') updateAuthUI();

      if (isAdminAccount) {
        // LUỒNG ADMIN: Bẻ lái và KHÓA CHẶT các lệnh phía sau
        alert('Xin chào Quản trị viên! Đang mở cổng Admin Portal...');

        const isNested = window.location.pathname.includes('/pages/');
        const adminUrl = isNested ? './admin.html' : './pages/admin.html';

        window.location.href = adminUrl;
        try {
          window.location.replace(adminUrl);
        } catch (eReplace) { }

        return; // ĐÂY LÀ CHỐT CHẶN BẢO VỆ: Cấm trình duyệt chạy tiếp xuống dưới!

      } else {
        // LUỒNG THÀNH VIÊN: Đăng nhập thành công thì làm mới trang, KHÔNG bung hồ sơ
        alert('Đăng nhập thành công!');

        // Đóng form đăng nhập
        if (typeof closeModal === 'function') {
          closeModal('modal-login');
          closeModal('modalDangNhap');
        }
        const modalDangNhap = document.getElementById('modalDangNhap') || document.getElementById('modal-login');
        if (modalDangNhap) {
          modalDangNhap.classList.add('hidden');
          modalDangNhap.style.display = 'none';
        }

        // Tải lại trang để cập nhật giao diện (Avatar, nút đăng xuất...)
        window.location.reload();
      }
    } else {
      alert('Sai tài khoản hoặc mật khẩu!');
    }

  } catch (err) {
    alert('LỖI HỆ THỐNG: ' + err.message);
    console.error('Chi tiết lỗi hệ thống:', err);
  }
}
window.handleLogin = handleLogin;

function formatEmail(form) {
  if (!form) return true;

  // 1. Lấy giá trị từ các ô input khớp đúng với name và ID trong form
  let name = form.querySelector('[name="Ho_Ten"]')?.value || form.querySelector('[name="Ho Ten"]')?.value || form.querySelector('#reg-ho-ten')?.value || 'Thành viên mới';
  let phone = form.querySelector('[name="So_Dien_Thoai_Zalo"]')?.value || form.querySelector('[name="So Dien Thoai Zalo"]')?.value || form.querySelector('#reg-sdt')?.value || '';
  let mssv = form.querySelector('[name="MSSV"]')?.value || form.querySelector('#reg-mssv')?.value || '';
  let note = form.querySelector('[name="Trinh_Do_Va_Ghi_Chu"]')?.value || form.querySelector('[name="Trinh Do Va Ghi Chu"]')?.value || form.querySelector('#reg-kinh-nghiem')?.value || '';

  // 2. Cập nhật Tiêu đề email (Subject)
  let subjectInput = form.querySelector('#emailSubject') || form.querySelector('[name="subject"]');
  if (subjectInput) {
    subjectInput.value = `[Đăng ký thành viên mới] ${name} - ${phone}`;
  }

  // 3. Cập nhật nội dung Message tổng hợp ở cuối email
  let messageInput = form.querySelector('#emailMessage') || form.querySelector('[name="Message"]') || form.querySelector('[name="message"]');
  if (messageInput) {
    messageInput.value = `THÔNG TIN ĐĂNG KÝ THÀNH VIÊN MỚI CLB CỜ TNU - HGC:\n\n- Họ và tên: ${name}\n- MSSV: ${mssv || 'Chưa cung cấp'}\n- Số điện thoại: ${phone}\n- Ghi chú / Trình độ cờ: ${note || 'Chưa cung cấp'}`;
  }

  return true; // Trả về true để cho phép Web3Forms tiếp tục gửi đi
}
window.formatEmail = formatEmail;

async function handleRegister(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }

  const submitBtn = document.getElementById('btn-register-submit');
  const btnText = document.getElementById('btn-register-text');
  const btnSpinner = document.getElementById('btn-register-spinner');

  const ho_ten = (document.getElementById('reg-ho-ten')?.value || document.getElementById('reg-name')?.value || '').trim();
  const mssv = (document.getElementById('reg-mssv')?.value || '').trim();
  const sdt = (document.getElementById('reg-sdt')?.value || document.getElementById('reg-phone')?.value || '').trim();
  const kinh_nghiem = (document.getElementById('reg-kinh-nghiem')?.value || '').trim();

  if (!ho_ten || !sdt) {
    const msg = '⚠️ Vui lòng điền đầy đủ các trường bắt buộc (Họ và Tên, Số điện thoại)!';
    if (typeof showToast === 'function') showToast(msg);
    else alert(msg);
    return;
  }

  // Hiệu ứng loading (xoay vòng) vào nút 'Gửi Đăng Ký' & vô hiệu hóa nút bấm
  if (submitBtn) submitBtn.disabled = true;
  if (btnText) btnText.textContent = 'Đang xử lý...';
  if (btnSpinner) btnSpinner.style.display = 'inline-block';

  try {
    // 1. Lưu Database Supabase: Gọi API await supabase.from('registrations').insert([{ ho_ten, mssv, sdt, kinh_nghiem }])
    const { data: dbData, error: dbError } = await supabase
      .from('registrations')
      .insert([{ ho_ten, mssv, sdt, kinh_nghiem }]);

    if (dbError) {
      console.error('❌ Lỗi khi lưu dữ liệu đăng ký vào Supabase:', dbError.message);
      throw new Error(`Lỗi lưu Supabase: ${dbError.message}`);
    }
    console.log('✅ [Database] Đã lưu dữ liệu vào Supabase thành công:', dbData);

    // 2. Gửi Email qua Web3Forms: POST https://api.web3forms.com/submit
    const web3Payload = {
      access_key: WEB3FORMS_KEY,
      subject: `[Đăng ký thành viên mới] ${ho_ten} - ${sdt}`,
      from_name: 'TNU-HGC Chess Club Website',
      ho_ten: ho_ten,
      mssv: mssv || 'Chưa cung cấp',
      sdt: sdt,
      kinh_nghiem: kinh_nghiem || 'Chưa cung cấp',
      message: `THÔNG TIN ĐĂNG KÝ THÀNH VIÊN MỚI CLB CỜ TNU - HGC:\n\n- Họ và tên: ${ho_ten}\n- MSSV: ${mssv || 'Chưa cung cấp'}\n- Số điện thoại: ${sdt}\n- Ghi chú / Trình độ cờ: ${kinh_nghiem || 'Chưa cung cấp'}`
    };

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(web3Payload)
    });

    const emailResult = await response.json();
    if (!emailResult.success) {
      console.warn('⚠️ [Email Web3Forms Cảnh báo]:', emailResult.message || emailResult);
      throw new Error(emailResult.message || 'Lỗi khi gửi email đăng ký');
    }
    console.log('✅ [Email] Đã gửi email thông báo qua Web3Forms thành công:', emailResult);

    // 3. Ngay sau khi cả Supabase và Web3Forms xử lý thành công: Ẩn form nhập liệu và hiển thị UI Thành công
    const regForm = document.getElementById('registration-form');
    const regSuccess = document.getElementById('registration-success');

    if (regForm) regForm.style.display = 'none';
    if (regSuccess) regSuccess.style.display = 'block';

    // Reset form inputs cho lần đăng ký sau
    if (regForm && typeof regForm.reset === 'function') {
      regForm.reset();
    }
  } catch (error) {
    console.error('Lỗi khi gửi form đăng ký:', error);
    alert('⚠️ Đã có lỗi xảy ra: ' + (error.message || 'Không thể kết nối máy chủ'));
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (btnText) btnText.textContent = 'Gửi Đăng Ký';
    if (btnSpinner) btnSpinner.style.display = 'none';
  }
}

// 1. Hàm hỗ trợ: Lấy 2 chữ cái đầu của tên và tạo màu nền ngẫu nhiên
function taoAvatarChuCai(ten) {
  if (!ten) return { chuCai: '??', mauNen: '#334155' };
  const parts = ten.trim().split(' ');
  let chuCai = parts.length === 1
    ? parts[0].substring(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();

  // Tạo màu nền dựa trên tên để mỗi người 1 màu cố định
  let hash = 0;
  for (let i = 0; i < ten.length; i++) hash = ten.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return { chuCai, mauNen: `hsl(${h}, 60%, 65%)` };
}

// BƯỚC 1: TẠO "LÕI LOGIC" DÙNG CHUNG
window.tinhToanDanhHieu = function (sh, gd, hd, chucVu, trangThai) {
  sh = Number(sh) || 0;
  gd = Number(gd) || 0;
  hd = Number(hd) || 0;

  // 1. Chấm điểm theo năng lực thực tế (Bậc 1 đến 6)
  let bacDiem = 1;
  if (sh >= 115 && gd >= 12 && hd >= 15) bacDiem = 6;
  else if (sh >= 100 && gd >= 10 && hd >= 12) bacDiem = 5;
  else if (sh >= 60 && gd >= 5 && hd >= 8) bacDiem = 4;
  else if (sh >= 20 && gd >= 2 && hd >= 4) bacDiem = 3;
  else if (sh >= 8 && gd >= 1 && hd >= 2) bacDiem = 2;

  // 2. Chấm điểm theo đặc quyền chức vụ BĐH (Bảo lưu cho cả Đương nhiệm & Cựu thành viên)
  let bacChucVu = 1;
  if (chucVu) {
    const cv = String(chucVu).trim().toLowerCase();
    if (cv.includes('chủ nhiệm') && !cv.includes('phó')) bacChucVu = 6;
    else if (cv.includes('phó chủ nhiệm') || (cv.includes('chủ nhiệm') && cv.includes('phó'))) bacChucVu = 5;
    else if ((cv.includes('trưởng ban') || cv.includes('thư ký') || cv.includes('thu ky') || cv.includes('thư kí') || cv.includes('thu ki')) && !cv.includes('phó')) bacChucVu = 4;
    else if (cv.includes('phó ban') || cv.includes('phó trưởng ban') || cv.includes('phó')) bacChucVu = 3;
  }

  // 3. SO KÈ CẢNH GIỚI: Lấy mốc cao nhất
  let bacCuoiCung = Math.max(bacDiem, bacChucVu);

  // Xử lý pathPrefix tự động dựa vào đường dẫn URL trang hiện tại
  const isNested = typeof window !== 'undefined' && window.location && window.location.pathname.includes('/pages/');
  const pathPrefix = isNested ? '../' : './';

  // 4. Trả về đúng 1 trong 6 huy chương của hệ thống
  const danhHieuMap = {
    6: { ten: 'Thành viên nòng cốt', img: `${pathPrefix}assets/badges/bac6.png` },
    5: { ten: 'Thành viên ưu tú', img: `${pathPrefix}assets/badges/bac5.png` },
    4: { ten: 'Thành viên cốt cán', img: `${pathPrefix}assets/badges/bac4.png` },
    3: { ten: 'Thành viên tích cực', img: `${pathPrefix}assets/badges/bac3.png` },
    2: { ten: 'Hội viên', img: `${pathPrefix}assets/badges/bac2.png` },
    1: { ten: 'Thành viên mới', img: `${pathPrefix}assets/badges/bac1.png` }
  };

  return danhHieuMap[bacCuoiCung] || danhHieuMap[1];
};

function xetDuyetDanhHieu(sh, gd, hd, chucVu, trangThai) {
  return window.tinhToanDanhHieu(sh, gd, hd, chucVu, trangThai);
}

// BƯỚC 2: CẬP NHẬT BẢNG XẾP HẠNG
async function loadBangXepHang() {
  const tbody = document.getElementById('bangXepHangToanCLB') || document.getElementById('leaderboard-rows');
  if (!tbody) return;

  try {
    let data = null;

    // Truy vấn Supabase dùng select('*') để tránh lỗi PostgREST 400 nếu tên cột avatar khác biệt
    const resThanhVien = await supabase
      .from('thanh_vien')
      .select('*, ban_dieu_hanh(chuc_vu, trang_thai)')
      .neq('mssv', 'admin');

    if (resThanhVien.data && resThanhVien.data.length > 0) {
      data = resThanhVien.data;
    } else {
      const resMembers = await supabase
        .from('thanh_vien')
        .select('*')
        .neq('mssv', 'admin');

      if (resMembers.data && resMembers.data.length > 0) {
        data = resMembers.data.map(m => ({
          ...m,
          ho_ten: m.full_name || m.name || m.ho_ten || m.mssv,
          chuc_vu: m.title || m.role || m.chuc_vu
        }));
      }
    }

    // Fallback sang localStorage nếu DB chưa trả về dữ liệu
    if (!data || data.length === 0) {
      try {
        const cached = localStorage.getItem('club_members');
        if (cached) data = JSON.parse(cached);
      } catch (e) { }
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #94a3b8;">Chưa có dữ liệu xếp hạng</td></tr>';
      return;
    }

    const danhSach = data.map(user => {
      return {
        ...user,
        ho_ten: user.ho_ten || user.full_name || user.name || user.mssv || 'Thành viên',
        diem_sinh_hoat: Number(user.diem_sinh_hoat) || 0,
        diem_giai_dau: Number(user.diem_giai_dau) || 0,
        diem_hoat_dong: Number(user.diem_hoat_dong) || 0,
        tong_diem: (Number(user.diem_sinh_hoat) || 0) + (Number(user.diem_giai_dau) || 0) + (Number(user.diem_hoat_dong) || 0)
      };
    }).sort((a, b) => b.tong_diem - a.tong_diem);

    tbody.innerHTML = '';
    danhSach.forEach((user, index) => {
      // 1. XỬ LÝ HẠNG
      let hangUI = `<span style="font-weight: bold; font-size: 1.1rem; color: #94a3b8;">${index + 1}</span>`;
      let styleHang = '';
      let styleTen = 'color: #f1f5f9; font-weight: bold; font-size: 1.1rem;';

      if (index === 0) {
        hangUI = `<div style="position: relative; display: inline-flex; justify-content: center; align-items: center; width: 38px; height: 38px; border: 2px solid #ffd700; border-radius: 50%; margin: 0 auto; background: rgba(255,215,0,0.15); box-shadow: 0 0 12px rgba(255,215,0,0.4);"><div style="position: absolute; top: -18px; font-size: 1.4rem; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));">👑</div><span style="color: #ffd700; font-weight: 900; font-size: 1.1rem;">1</span></div>`;
        styleHang = 'background: rgba(255, 215, 0, 0.08); border-left: 4px solid #ffd700;';
        styleTen = 'color: #ffd700; font-weight: bold; font-size: 1.15rem;';
      } else if (index === 1) {
        hangUI = `<div style="position: relative; display: inline-flex; justify-content: center; align-items: center; width: 36px; height: 36px; border: 2px solid #e2e8f0; border-radius: 50%; margin: 0 auto; background: rgba(226,232,240,0.1);"><div style="position: absolute; top: -16px; font-size: 1.2rem; filter: grayscale(100%) drop-shadow(0 2px 2px rgba(0,0,0,0.5));">👑</div><span style="color: #e2e8f0; font-weight: bold; font-size: 1rem;">2</span></div>`;
        styleHang = 'background: rgba(192, 192, 192, 0.05); border-left: 4px solid #cbd5e1;';
      } else if (index === 2) {
        hangUI = `<div style="position: relative; display: inline-flex; justify-content: center; align-items: center; width: 36px; height: 36px; border: 2px solid #cd7f32; border-radius: 50%; margin: 0 auto; background: rgba(205,127,50,0.1);"><div style="position: absolute; top: -16px; font-size: 1.2rem; filter: sepia(1) hue-rotate(-40deg) saturate(4) drop-shadow(0 2px 2px rgba(0,0,0,0.5));">👑</div><span style="color: #cd7f32; font-weight: bold; font-size: 1rem;">3</span></div>`;
        styleHang = 'background: rgba(205, 127, 50, 0.05); border-left: 4px solid #cd7f32;';
      }

      // 2. TRÍCH XUẤT THÔNG TIN CHỨC VỤ (NẾU CÓ) VÀ TÍNH DANH HIỆU
      let chucVu = user.chuc_vu || null;
      let trangThai = user.trang_thai || null;
      if (user.ban_dieu_hanh && user.ban_dieu_hanh.length > 0) {
        chucVu = user.ban_dieu_hanh[0].chuc_vu || chucVu;
        trangThai = user.ban_dieu_hanh[0].trang_thai || trangThai;
      }

      const avt = taoAvatarChuCai(user.ho_ten);
      const rawLeaderAvt = user.avatar || user.avatar_url || user.hinh_anh;
      let leaderAvtHtml = '';
      if (rawLeaderAvt && String(rawLeaderAvt).trim() !== '' && !rawLeaderAvt.includes('via.placeholder')) {
        const bustedUrl = rawLeaderAvt.includes('?') ? `${rawLeaderAvt}&t=${Date.now()}` : `${rawLeaderAvt}?t=${Date.now()}`;
        leaderAvtHtml = `<img src="${bustedUrl}" alt="${user.ho_ten}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; flex-shrink: 0; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">`;
      } else {
        leaderAvtHtml = `<div style="width: 48px; height: 48px; border-radius: 50%; background-color: ${avt.mauNen}; color: #1e293b; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.1rem; flex-shrink: 0; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${avt.chuCai}</div>`;
      }

      // Gọi Lõi Logic dùng chung
      const danhHieu = window.tinhToanDanhHieu(user.diem_sinh_hoat, user.diem_giai_dau, user.diem_hoat_dong, chucVu, trangThai);

      // 3. RENDER HTML GIAO DIỆN
      tbody.innerHTML += `
        <tr onclick="xemHoSo('${user.mssv}')" class="cursor-pointer hover:bg-slate-700/50 transition-colors group" style="${styleHang} border-bottom: 1px solid #334155; transition: all 0.3s ease; cursor: pointer;" onmouseover="this.style.backgroundColor='rgba(255,255,255,0.05)'" onmouseout="this.style.backgroundColor=''">
          
          <td style="padding: 18px 15px; text-align: center; vertical-align: middle; width: 90px;">${hangUI}</td>
          
          <td style="padding: 18px 15px; vertical-align: middle; text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
              ${leaderAvtHtml}
              <div style="display: flex; align-items: center;">
                <span style="${styleTen}">${user.ho_ten}</span>
              </div>
            </div>
          </td>

          <td style="padding: 18px 15px; text-align: center; vertical-align: middle;">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
              <img src="${danhHieu.img}" alt="${danhHieu.ten}" title="${danhHieu.ten}${chucVu ? ' - Đặc quyền: ' + chucVu : ' - Theo điểm số'}" 
                   style="width: 45px; height: 45px; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4)); transition: transform 0.2s;"
                   onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
              <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">${danhHieu.ten}</span>
            </div>
          </td>

          <td style="padding: 18px 15px; text-align: center; vertical-align: middle; width: 140px;">
            <div style="color: #38bdf8; font-weight: bold; font-size: 1.3rem;">${user.tong_diem}</div>
            <div style="color: #94a3b8; font-size: 0.75rem; margin-top: 4px;">
              (SH:${user.diem_sinh_hoat || 0} | GĐ:${user.diem_giai_dau || 0} | HĐ:${user.diem_hoat_dong || 0})
            </div>
          </td>
          
        </tr>
      `;
    });
  } catch (err) {
    console.error('Lỗi tải bảng xếp hạng:', err);
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #ef4444;">Lỗi kết nối CSDL xếp hạng</td></tr>';
  }
}
document.addEventListener('DOMContentLoaded', loadBangXepHang);
window.taoAvatarChuCai = taoAvatarChuCai;
window.xetDuyetDanhHieu = xetDuyetDanhHieu;
window.loadBangXepHang = loadBangXepHang;



// ==========================================================================
// BAN ĐIỀU HÀNH EDITING FUNCTIONS (MOVED TO ADMIN)
// ==========================================================================

function layHuyChuong(danhHieu) {
  let fileBac = 'bac1.png';
  let titleText = danhHieu || 'Bậc 1: Thành viên mới';
  if (danhHieu) {
    let r = danhHieu.toLowerCase().trim();
    if (r.includes('6') || r.includes('nòng cốt') || r.includes('nong cot') || (r.includes('chủ nhiệm') && !r.includes('phó')) || r.includes('admin')) {
      fileBac = 'bac6.png';
      titleText = danhHieu || 'Bậc 6: Thành viên nòng cốt';
    } else if (r.includes('5') || r.includes('ưu tú') || r.includes('uu tu') || r.includes('phó chủ nhiệm')) {
      fileBac = 'bac5.png';
      titleText = danhHieu || 'Bậc 5: Thành viên ưu tú';
    } else if (r.includes('4') || r.includes('cốt cán') || r.includes('cot can') || ((r.includes('trưởng ban') || r.includes('thư ký') || r.includes('thu ky') || r.includes('thư kí') || r.includes('thu ki')) && !r.includes('phó'))) {
      fileBac = 'bac4.png';
      titleText = danhHieu || 'Bậc 4: Thành viên cốt cán';
    } else if (r.includes('3') || r.includes('tích cực') || r.includes('tich cuc') || r.includes('phó ban') || r.includes('phó trưởng ban') || r.includes('phó') || r.includes('kỳ cựu') || r.includes('xuất sắc')) {
      fileBac = 'bac3.png';
      titleText = danhHieu || 'Bậc 3: Thành viên tích cực';
    } else if (r.includes('2') || r.includes('hội viên') || r.includes('hoi vien')) {
      fileBac = 'bac2.png';
      titleText = danhHieu || 'Bậc 2: Hội viên';
    } else {
      fileBac = 'bac1.png';
      titleText = danhHieu || 'Bậc 1: Thành viên mới';
    }
  }

  const isNested = typeof window !== 'undefined' && window.location.pathname.includes('/pages/');
  const pathPrefix = isNested ? '../' : './';
  return `<img src="${pathPrefix}assets/badges/${fileBac}" alt="${titleText}" title="${titleText}" style="width: 38px; height: 38px; object-fit: contain; vertical-align: middle; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">`;
}
window.layHuyChuong = layHuyChuong;

function parseMemberDate(dateStr) {
  if (!dateStr) return 0;
  if (typeof dateStr !== 'string') dateStr = String(dateStr);
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`).getTime() || 0;
    }
  }
  const t = new Date(dateStr).getTime();
  return isNaN(t) ? 0 : t;
}

function sortMembersByOnlineAndDate(list) {
  if (!list || !Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const statusA = String(a.trang_thai || a.status || (a.mssv ? localStorage.getItem(`status_${a.mssv}`) : null) || 'Offline').toLowerCase();
    const statusB = String(b.trang_thai || b.status || (b.mssv ? localStorage.getItem(`status_${b.mssv}`) : null) || 'Offline').toLowerCase();
    const isOnlineA = (statusA === 'online' || statusA === 'hoạt động' || statusA === 'active');
    const isOnlineB = (statusB === 'online' || statusB === 'hoạt động' || statusB === 'active');

    if (isOnlineA !== isOnlineB) {
      return isOnlineA ? -1 : 1;
    }

    const timeA = parseMemberDate(a.ngay_tham_gia || a.join_date || a.created_at);
    const timeB = parseMemberDate(b.ngay_tham_gia || b.join_date || b.created_at);
    return timeB - timeA;
  });
}

async function loadDanhSachCongKhai() {
  const tbody = document.getElementById('bangThanhVienPublic') || document.getElementById('member-table-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: rgba(255,255,255,0.6);">Đang tải danh sách thành viên...</td></tr>';

  try {
    let data = null;
    let error = null;

    const resThanhVien = await supabase
      .from('thanh_vien')
      .select('*, ban_dieu_hanh(chuc_vu, trang_thai)')
      .neq('mssv', 'admin')
      .order('ngay_tham_gia', { ascending: false });

    data = resThanhVien.data;
    error = resThanhVien.error;

    if (error || !data || data.length === 0) {
      const resMembers = await supabase
        .from('thanh_vien')
        .select('*')
        .neq('mssv', 'admin')
        .order('join_date', { ascending: false });
      if (resMembers.data && resMembers.data.length > 0) {
        data = resMembers.data;
        error = null;
      }
    }

    if (error && (!data || data.length === 0)) throw error;
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-data-msg" style="text-align:center; padding: 20px; color: #aaa;">Chưa có thành viên nào.</td></tr>';
      return;
    }

    data = sortMembersByOnlineAndDate(data);

    const countIds = ['total-member-count', 'total-members', 'total-members-count'];
    countIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = data.length;
    });

    data.forEach(user => {
      const savedStatus = (user.mssv ? localStorage.getItem(`status_${user.mssv}`) : null);
      const status = savedStatus || user.trang_thai || user.status || 'Offline';
      const isOnline = (status === 'Online' || status === 'online' || status === 'Hoạt động' || status === 'active');
      const statusColor = isOnline ? '#00e676' : '#808080';
      const statusText = isOnline ? 'Online' : 'Offline';

      const nameVal = user.ho_ten || user.full_name || 'Chưa cập nhật';
      const classVal = user.khoa_lop || user.class_name || '-';
      const genderVal = user.gioi_tinh || user.gender || '-';
      let joinVal = user.ngay_tham_gia || user.join_date || '-';
      if (joinVal && joinVal.includes('T')) joinVal = joinVal.split('T')[0];

      // Lấy thông tin chức vụ và trạng thái từ BĐH nếu có
      let chucVu = user.chuc_vu || user.title || user.danh_hieu || null;
      let trangThaiBDH = null;
      if (user.ban_dieu_hanh && user.ban_dieu_hanh.length > 0) {
        chucVu = user.ban_dieu_hanh[0].chuc_vu || chucVu;
        trangThaiBDH = user.ban_dieu_hanh[0].trang_thai;
      }

      // Xét duyệt danh hiệu đồng nhất với Bảng xếp hạng và các phần khác
      const danhHieuObj = (typeof window.tinhToanDanhHieu === 'function')
        ? window.tinhToanDanhHieu(user.diem_sinh_hoat || 0, user.diem_giai_dau || 0, user.diem_hoat_dong || 0, chucVu, trangThaiBDH)
        : null;

      const titleText = danhHieuObj ? danhHieuObj.ten : (chucVu || user.danh_hieu || 'Thành viên mới');
      const badgeImgSrc = danhHieuObj ? danhHieuObj.img : null;

      const iconHuyChuong = badgeImgSrc
        ? `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;"><img src="${badgeImgSrc}" alt="${titleText}" title="${titleText}${chucVu ? ' - ' + chucVu : ''}" style="width: 38px; height: 38px; object-fit: contain; vertical-align: middle; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"><span style="font-size: 11px; color: #94a3b8; font-weight: 500;">${titleText}</span></div>`
        : (typeof layHuyChuong === 'function' ? layHuyChuong(titleText) : '🏅');

      // Avatar (Ưu tiên ảnh thực tế từ CSDL)
      const rawUserAvt = user.avatar || user.avatar_url || user.hinh_anh || (user.mssv ? (localStorage.getItem('avatar_' + user.mssv) || localStorage.getItem('avatar_' + String(user.mssv).toUpperCase()) || localStorage.getItem('avatar_' + String(user.mssv).toLowerCase())) : '') || (user.mssv === localStorage.getItem('currentUserMSSV') ? localStorage.getItem('userAvatar') : '') || '';
      let avtHtml = '';
      if (rawUserAvt && String(rawUserAvt).trim() !== '' && !rawUserAvt.includes('via.placeholder')) {
        const bustedUrl = rawUserAvt.includes('?') ? `${rawUserAvt}&t=${Date.now()}` : `${rawUserAvt}?t=${Date.now()}`;
        avtHtml = `<img src="${bustedUrl}" data-mssv="${user.mssv || ''}" alt="${nameVal}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">`;
      } else if (typeof taoAvatarChuCai === 'function') {
        const avt = taoAvatarChuCai(nameVal);
        avtHtml = `<div style="width: 38px; height: 38px; border-radius: 50%; background-color: ${avt.mauNen}; color: #1e293b; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1rem; flex-shrink: 0;">${avt.chuCai}</div>`;
      } else {
        avtHtml = `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(nameVal)}&background=random&color=fff" data-mssv="${user.mssv || ''}" alt="Avatar" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">`;
      }

      const tr = document.createElement('tr');
      tr.setAttribute('data-mssv', user.mssv || '');
      tr.setAttribute('data-class', classVal);
      tr.setAttribute('data-role', titleText);
      tr.setAttribute('onclick', `xemHoSo('${user.mssv || ''}')`);
      tr.className = 'cursor-pointer hover:bg-slate-700/50 transition-colors group';
      tr.style.cursor = 'pointer';

      tr.innerHTML = `
        <td style="display: flex; align-items: center; gap: 12px; padding: 12px 16px;">
          ${avtHtml}
          <strong class="member-name" style="font-size: 0.95rem; margin: 0; color: #fff;">${nameVal}</strong>
        </td>
        <td style="text-align: center; vertical-align: middle; padding: 12px 16px;">${classVal}</td>
        <td style="text-align: center; vertical-align: middle; padding: 12px 16px;">${genderVal}</td>
        <td style="text-align: center; vertical-align: middle; padding: 12px 16px; font-size: 1.3rem;" title="${titleText}">${iconHuyChuong}</td>
        <td style="text-align: center; vertical-align: middle; padding: 12px 16px;">${joinVal}</td>
        <td style="text-align: center; vertical-align: middle; padding: 12px 16px; color: ${statusColor}; font-weight: bold;">
          <span style="display: inline-block; width: 8px; height: 8px; background-color: ${statusColor}; border-radius: 50%; margin-right: 5px;"></span>
          ${statusText}
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error('Lỗi tải danh sách công khai:', error);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color:#ef4444;">Lỗi tải dữ liệu từ máy chủ.</td></tr>';
  }
}

window.layHuyChuong = layHuyChuong;
window.loadDanhSachCongKhai = loadDanhSachCongKhai;
window.loadMembers = loadDanhSachCongKhai;
window.loadMembersList = loadDanhSachCongKhai;

// 1. Bộ lọc tìm kiếm theo tên kết hợp lọc lớp và chức vụ
function filterMembers() {
  const searchInput = document.getElementById('search-member');
  if (!searchInput) return;
  const keyword = searchInput.value.toLowerCase().trim();
  const classFilter = document.getElementById('filter-class') ? document.getElementById('filter-class').value : '';
  const roleFilter = document.getElementById('filter-role') ? document.getElementById('filter-role').value : '';

  const rows = document.querySelectorAll('#bangThanhVienPublic tr, #member-table-body tr');

  rows.forEach(row => {
    const nameEl = row.querySelector('.member-name');
    if (!nameEl) return;
    const name = nameEl.innerText.toLowerCase();
    const classVal = row.getAttribute('data-class') || '';
    const roleVal = row.getAttribute('data-role') || '';

    const matchesKeyword = name.includes(keyword);
    const matchesClass = classFilter ? classVal.includes(classFilter) : true;
    const matchesRole = roleFilter ? roleVal === roleFilter : true;

    if (matchesKeyword && matchesClass && matchesRole) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// MEMBER MANAGEMENT MODIFIED FOR STATIC DISPLAY

// 5. Cập nhật tổng số thành viên thực tế từ bảng
function updateTotalMemberCount() {
  const tbody = document.getElementById('bangThanhVienPublic') || document.getElementById('member-table-body');
  const totalCount = document.getElementById('total-member-count');
  if (tbody && totalCount) {
    totalCount.innerText = tbody.querySelectorAll('tr[data-mssv]').length;
  } else if (tbody) {
    const totalBadge = document.querySelector('.glass-card strong');
    if (totalBadge) totalBadge.innerText = tbody.querySelectorAll('tr[data-mssv]').length;
  }
}

// ==========================================================================
// ĐỒNG BỘ AVATAR TOÀN HỆ THỐNG (Database, LocalStorage, DOM, Re-renders, Events)
// ==========================================================================
export async function syncAvatarUpdateAcrossSystem(cleanMssv, publicUrl) {
  if (!cleanMssv || !publicUrl) return;
  const mssvUpper = String(cleanMssv).trim().toUpperCase();
  const mssvLower = String(cleanMssv).trim().toLowerCase();
  const bustedUrl = publicUrl.includes('?') ? `${publicUrl}&t=${Date.now()}` : `${publicUrl}?t=${Date.now()}`;

  // 1. Cập nhật localStorage
  localStorage.setItem('userAvatar', bustedUrl);
  localStorage.setItem('currentUserAvatar', bustedUrl);
  localStorage.setItem('avatar_' + mssvUpper, bustedUrl);
  localStorage.setItem('avatar_' + mssvLower, bustedUrl);
  localStorage.setItem('avatar_' + cleanMssv, bustedUrl);

  try {
    const cached = localStorage.getItem('club_members');
    if (cached) {
      const parsed = JSON.parse(cached);
      const idx = parsed.findIndex(m => String(m.mssv).toUpperCase() === mssvUpper);
      if (idx !== -1) {
        parsed[idx].avatar = publicUrl;
        parsed[idx].avatar_url = publicUrl;
        parsed[idx].hinh_anh = publicUrl;
        localStorage.setItem('club_members', JSON.stringify(parsed));
      }
    }
  } catch (err) {
    console.error("Lỗi đồng bộ avatar mới sang localStorage:", err);
  }

  // 2. Cập nhật Supabase an toàn (thanh_vien, members, ban_dieu_hanh)
  try {
    const res = await supabase.from('thanh_vien').update({ avatar: publicUrl, avatar_url: publicUrl, hinh_anh: publicUrl }).ilike('mssv', mssvUpper);
    if (res.error) {
      await supabase.from('thanh_vien').update({ avatar: publicUrl }).ilike('mssv', mssvUpper);
      await supabase.from('thanh_vien').update({ avatar_url: publicUrl }).ilike('mssv', mssvUpper);
      await supabase.from('thanh_vien').update({ hinh_anh: publicUrl }).ilike('mssv', mssvUpper);
    }
  } catch (e) { }

  try {
    await supabase.from('ban_dieu_hanh').update({ avatar: publicUrl }).ilike('mssv', mssvUpper);
    await supabase.from('ban_dieu_hanh').update({ avatar_url: publicUrl }).ilike('mssv', mssvUpper);
    await supabase.from('ban_dieu_hanh').update({ hinh_anh: publicUrl }).ilike('mssv', mssvUpper);
  } catch (e) { }

  // 3. Cập nhật trực tiếp tất cả các thẻ <img> trên DOM ngay tức thì
  const targetIds = ['profile-avatar', 'hs_avatar', 'detail-member-avatar', 'user-avatar-img', 'user-avatar'];
  targetIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.src = bustedUrl;
      el.style.borderRadius = '50%';
      el.style.objectFit = 'cover';
    }
  });

  document.querySelectorAll(`
    #profile-avatar, #hs_avatar, .user-profile-avatar, 
    img[data-mssv="${mssvUpper}"], img[data-mssv="${mssvLower}"], img[data-mssv="${cleanMssv}"],
    tr[data-mssv="${mssvUpper}"] img, tr[data-mssv="${mssvLower}"] img, tr[data-mssv="${cleanMssv}"] img,
    tr[onclick*="${mssvUpper}"] img, tr[onclick*="${mssvLower}"] img, tr[onclick*="${cleanMssv}"] img
  `).forEach(img => {
    img.src = bustedUrl;
    img.style.borderRadius = '50%';
    img.style.objectFit = 'cover';
  });

  // 4. Kích hoạt vẽ lại tất cả các module trên trang chủ và các trang con
  if (typeof window.loadBangXepHang === 'function') await window.loadBangXepHang();
  if (typeof window.loadLeaderboard === 'function') await window.loadLeaderboard();
  if (typeof window.loadDanhSachCongKhai === 'function') await window.loadDanhSachCongKhai();
  if (typeof window.loadMembers === 'function') await window.loadMembers();
  if (typeof window.loadMembersList === 'function') await window.loadMembersList();
  if (typeof window.loadDanhSachThanhVien === 'function') await window.loadDanhSachThanhVien();
  if (typeof window.loadBdhTrangChu === 'function') await window.loadBdhTrangChu();
  if (typeof window.loadPublicBoard === 'function') await window.loadPublicBoard();
  if (typeof window.loadExecutives === 'function') await window.loadExecutives();
  if (typeof window.loadExecutiveBoard === 'function') await window.loadExecutiveBoard();
  if (typeof window.loadHoSoCaNhan === 'function') await window.loadHoSoCaNhan();
  if (typeof window.loadPersonalProfile === 'function') await window.loadPersonalProfile();

  // 5. Phát sự kiện toàn cục cho các component khác
  window.dispatchEvent(new CustomEvent('avatarChanged', { detail: { mssv: mssvUpper, avatarUrl: bustedUrl } }));
}
window.syncAvatarUpdateAcrossSystem = syncAvatarUpdateAcrossSystem;

// Lắng nghe sự kiện đổi avatar toàn cục
window.addEventListener('avatarChanged', async (e) => {
  const mssv = e.detail?.mssv;
  const bustedUrl = e.detail?.avatarUrl;
  if (bustedUrl) {
    ['profile-avatar', 'hs_avatar', 'detail-member-avatar', 'user-avatar-img', 'user-avatar'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.src = bustedUrl; el.style.borderRadius = '50%'; el.style.objectFit = 'cover'; }
    });
    if (mssv) {
      document.querySelectorAll(`
        img[data-mssv="${mssv}"], 
        tr[data-mssv="${mssv}"] img, 
        tr[onclick*="${mssv}"] img
      `).forEach(img => {
        img.src = bustedUrl;
        img.style.borderRadius = '50%';
        img.style.objectFit = 'cover';
      });
    }
  }
});

/* Profile Management Functions */

function openEditProfileModal() {
  const fileInput = document.getElementById('edit-profile-avatar');
  if (fileInput) fileInput.value = ''; // Reset file input
  openModal('modal-edit-profile');
}

async function saveProfileInfo() {
  const avatarInput = document.getElementById('edit-profile-avatar');

  if (!avatarInput || !avatarInput.files || !avatarInput.files[0]) {
    alert('⚠️ Vui lòng chọn một file ảnh!');
    return;
  }

  const file = avatarInput.files[0];
  const currentMSSV = localStorage.getItem('currentUserMSSV') || localStorage.getItem('userMssv') || localStorage.getItem('mssv') || '';
  if (!currentMSSV) {
    alert('⚠️ Vui lòng đăng nhập để thực hiện đổi ảnh đại diện!');
    return;
  }

  const cleanMssv = String(currentMSSV).trim().toUpperCase();
  const btnSubmit = document.querySelector('#modal-edit-profile .btn-submit');
  const originalText = btnSubmit ? btnSubmit.innerText : 'Lưu Thay Đổi';
  if (btnSubmit) {
    btnSubmit.innerText = 'Đang tải ảnh...';
    btnSubmit.disabled = true;
  }

  try {
    // Bước 1: Upload file lên Supabase Storage bucket 'avatars'
    const fileName = `${cleanMssv}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { contentType: file.type || 'image/png', upsert: true });

    if (uploadError) {
      console.error('Lỗi upload Storage:', uploadError);
      throw uploadError;
    }

    // Bước 2: Lấy Public URL của ảnh vừa upload
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) throw new Error('Không thể lấy đường dẫn ảnh công khai từ Storage.');

    // Bước 3: Đồng bộ avatar toàn hệ thống (DB, LocalStorage, DOM, Realtime events, Re-renders)
    await syncAvatarUpdateAcrossSystem(cleanMssv, publicUrl);

    closeModal('modal-edit-profile');
    if (avatarInput) avatarInput.value = '';

    const toast = document.getElementById('toast') || document.getElementById('admin-toast');
    if (toast) {
      toast.textContent = '🎉 Đã cập nhật ảnh đại diện lên hệ thống thành công!';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3500);
    } else {
      alert('🎉 Đã cập nhật ảnh đại diện lên hệ thống thành công!');
    }

  } catch (err) {
    console.error('Lỗi lưu ảnh đại diện:', err);
    alert('❌ Không thể lưu ảnh đại diện: ' + (err.message || err));
  } finally {
    if (btnSubmit) {
      btnSubmit.innerText = originalText;
      btnSubmit.disabled = false;
    }
  }
}

/* Feedback Management Functions */
function openFeedbackModal() {
  const textarea = document.getElementById('feedback-text');
  if (textarea) textarea.value = '';

  const currentMSSV = localStorage.getItem('currentUserMSSV') || localStorage.getItem('userMssv') || localStorage.getItem('mssv') || '';
  const currentName = localStorage.getItem('username') || document.getElementById('profile-name')?.innerText || document.getElementById('hs_hoten')?.innerText || 'Thành viên';

  const elGopyHoten = document.getElementById('gopy_hoten');
  const elGopyMssv = document.getElementById('gopy_mssv');
  if (elGopyHoten && !elGopyHoten.value) elGopyHoten.value = currentName;
  if (elGopyMssv && !elGopyMssv.value) elGopyMssv.value = currentMSSV;

  openModal('modal-feedback');
}

async function handleFeedbackSubmit(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const textarea = document.getElementById('feedback-text');
  const feedbackVal = textarea ? textarea.value.trim() : '';

  if (!feedbackVal) {
    alert('⚠️ Vui lòng nhập nội dung góp ý!');
    return;
  }

  const btnSubmit = document.getElementById('btn-submit-feedback');
  const originalText = btnSubmit ? btnSubmit.innerText : 'Gửi Ý Kiến';
  if (btnSubmit) {
    btnSubmit.innerText = 'Đang gửi...';
    btnSubmit.disabled = true;
  }

  try {
    const hoten = document.getElementById('gopy_hoten')?.value || localStorage.getItem('username') || 'Thành viên';
    const mssv = document.getElementById('gopy_mssv')?.value || localStorage.getItem('currentUserMSSV') || localStorage.getItem('userMssv') || localStorage.getItem('mssv') || 'Chưa rõ';

    const payload = {
      access_key: "dfae664a-852d-4c2c-8342-2d2fcb27d3dc",
      subject: `[Ý kiến đóng góp] ${hoten} (${mssv})`,
      from_name: `Góp ý CLB Cờ`,
      "Họ và tên": hoten,
      "MSSV": mssv,
      "NoiDung": feedbackVal,
      message: feedbackVal
    };

    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      if (textarea) textarea.value = '';
      closeModal('modal-feedback');

      const toast = document.getElementById('toast') || document.getElementById('admin-toast');
      if (toast) {
        toast.textContent = '🎉 Đã gửi ý kiến thành công!';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
      } else {
        alert('🎉 Đã gửi ý kiến thành công!');
      }
    } else {
      throw new Error(data.message || 'Lỗi khi gửi góp ý');
    }
  } catch (err) {
    console.error('Lỗi khi gửi góp ý Web3Forms:', err);
    alert('⚠️ Đã có lỗi xảy ra: ' + (err.message || 'Không thể kết nối máy chủ'));
  } finally {
    if (btnSubmit) {
      btnSubmit.innerText = originalText;
      btnSubmit.disabled = false;
    }
  }
}

window.openFeedbackModal = openFeedbackModal;
window.submitFeedback = handleFeedbackSubmit;
window.handleFeedbackSubmit = handleFeedbackSubmit;

/* Membership Ranks Config & Update Function */
const RANKS = {
  1: { class: 'rank-1', text: 'Thành viên mới', icon: 'fa-seedling' },
  2: { class: 'rank-2', text: 'Thành viên chính thức', icon: 'fa-award' },
  3: { class: 'rank-3', text: 'Thành viên tích cực', icon: 'fa-shield-halved' },
  4: { class: 'rank-4', text: 'Thành viên nòng cốt', icon: 'fa-gem' },
  5: { class: 'rank-5', text: 'Thành viên ưu tú', icon: 'fa-trophy' }
};

function updateMembershipRank(level) {
  const rankContainer = document.getElementById('membership-rank');
  const rankText = document.getElementById('membership-rank-text');
  if (!rankContainer || !rankText) return;

  // Xóa các class rank cũ và đặt lại base class
  rankContainer.className = 'rank-badge';

  // Lấy cấu hình rank theo level (mặc định là level 3)
  const rankInfo = RANKS[level] || RANKS[3];

  // Gán class và text tương ứng
  rankContainer.classList.add(rankInfo.class);
  rankText.textContent = rankInfo.text;

  // Cập nhật icon FontAwesome
  const iconEl = rankContainer.querySelector('i');
  if (iconEl) {
    iconEl.className = `fa-solid ${rankInfo.icon}`;
  }
}

// Global scope functions for tab switching (SPA model)
window.switchMainTab = function (tabId, event) {
  const targetSection = document.getElementById(tabId + '-section');

  if (targetSection) {
    if (event) event.preventDefault();
    // Ẩn tất cả các khối và gỡ animation cũ
    const sections = document.querySelectorAll('.main-section');
    sections.forEach(sec => {
      sec.classList.remove('active-tab');
      sec.style.display = 'none';
    });

    // Hiện khối được chọn
    targetSection.style.display = 'block';

    // Tạo độ trễ siêu nhỏ để kích hoạt hiệu ứng trượt mượt mà
    setTimeout(() => {
      targetSection.classList.add('active-tab');
    }, 10);

    // Cập nhật đèn sáng (active) cho nút menu tương ứng
    document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
      item.classList.remove('active');
    });
    const activeMenuItem = document.querySelector(`.sidebar-menu .menu-item[onclick^="switchMainTab('${tabId}')"]`) ||
      document.querySelector(`.sidebar-menu .menu-item[onclick^="switchMainTab('${tabId}',"]`);
    if (activeMenuItem) activeMenuItem.classList.add('active');

    // Kích hoạt tải dữ liệu nếu chuyển vào tab đặc biệt
    if (tabId === 'leaderboard') {
      if (typeof window.loadBangXepHang === 'function') window.loadBangXepHang();
      if (typeof window.loadLeaderboard === 'function') window.loadLeaderboard();
    }
    if (tabId === 'thanh-vien') {
      if (typeof window.loadDanhSachCongKhai === 'function') window.loadDanhSachCongKhai();
      else if (typeof window.loadMembers === 'function') window.loadMembers();
      else if (typeof window.loadMembersList === 'function') window.loadMembersList();
    }
    if (tabId === 'ban-dieu-hanh' && typeof loadExecutives === 'function') {
      loadExecutives();
      if (typeof window.loadPublicBoard === 'function') {
        window.loadPublicBoard();
      }
    }
    if (tabId === 'gioi-thieu' && typeof window.loadAboutInfo === 'function') {
      window.loadAboutInfo();
    }
    if (tabId === 'tin-tuc' && typeof window.loadPublicNews === 'function') {
      window.loadPublicNews();
    }
    if (tabId === 'ho-so' && typeof window.loadPersonalProfile === 'function') {
      window.loadPersonalProfile();
    }
  } else {
    // Dự phòng cho trường hợp đang ở trang phụ ngoài index.html
    localStorage.setItem('pendingTab', tabId);
    window.location.href = '/index.html';
  }
};

window.loadLeaderboard = async function () {
  const rowsContainer = document.getElementById('leaderboard-rows');
  if (!rowsContainer) return;

  rowsContainer.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Đang kết nối cơ sở dữ liệu...</td></tr>';

  try {
    let memberList = null;
    try {
      const { data: members, error } = await supabase
        .from('thanh_vien')
        .select('*')
        .neq('mssv', 'admin');

      if (!error && members && members.length > 0) {
        memberList = members;
      }
    } catch (err) {
      console.warn("Lỗi Supabase query members cho Leaderboard:", err);
    }

    if (!memberList || memberList.length === 0) {
      try {
        const cached = localStorage.getItem('club_members');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) memberList = parsed;
        }
      } catch (e) { }
    }

    if (!memberList || memberList.length === 0) {
      memberList = window.mockMembers || [];
    }

    if (!memberList || memberList.length === 0) {
      rowsContainer.innerHTML = '<tr><td colspan="8" class="empty-data-msg">Chưa có dữ liệu</td></tr>';
      return;
    }

    // 2. Tính toán điểm số và chuẩn hóa dữ liệu
    const processedMembers = memberList.map(m => {
      const sh = parseInt(m.diem_sinh_hoat ?? m.sinhhoat ?? m.buoiSinhHoat ?? m.sh) || 0;
      const gd = parseInt(m.diem_giai_dau ?? m.giaidau ?? m.giaiDau ?? m.gd) || 0;
      const hd = parseInt(m.diem_hoat_dong ?? m.hoatdong ?? m.hoatDong ?? m.hd) || 0;
      const elo = parseInt(m.elo) || 0;
      const totalPoints = elo > 0 ? elo : (sh + gd + hd);

      const rawAvt = m.avatar_url || m.avatar || m.hinh_anh || (m.mssv ? (localStorage.getItem('avatar_' + m.mssv) || localStorage.getItem('avatar_' + String(m.mssv).toUpperCase()) || localStorage.getItem('avatar_' + String(m.mssv).toLowerCase())) : '') || (m.mssv === localStorage.getItem('currentUserMSSV') ? localStorage.getItem('userAvatar') : '') || '';
      const avatarUrl = (rawAvt && String(rawAvt).trim() !== '' && !rawAvt.includes('via.placeholder'))
        ? (rawAvt.includes('?') ? `${rawAvt}&t=${Date.now()}` : `${rawAvt}?t=${Date.now()}`)
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.mssv}`;
      const name = m.full_name || m.name || m.mssv || 'Thành viên';
      const gender = m.gender || m.gioiTinh || 'Nam';
      const classInfo = m.class_name || m.class || m.khoaLop || m.classInfo || 'K20 - CNTT';

      return {
        ...m,
        sh,
        gd,
        hd,
        totalPoints,
        avatarUrl,
        name,
        gender,
        classInfo
      };
    });

    // SẮP XẾP: Theo Tổng điểm (Elo) giảm dần. NẾU bằng nhau, ưu tiên điểm Giải đấu giảm dần.
    processedMembers.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return b.gd - a.gd;
    });

    // 3. Render DOM ra bảng
    rowsContainer.innerHTML = '';

    processedMembers.forEach((member, index) => {
      const rank = index + 1;
      let rankDisplay = `<span class="rank-number" style="padding-left: 15px;">${rank}</span>`;
      let rowClass = '';
      let avatarBorder = 'border: 1.5px solid rgba(255, 255, 255, 0.25);';

      // 4. Vinh danh Top 3 với hiệu ứng Gold/Silver/Bronze
      if (rank === 1) {
        rankDisplay = `<div class="rank-crown crown-1"><i class="fa-solid fa-crown"></i><span class="crown-num">1</span></div>`;
        rowClass = 'rank-top-1';
        avatarBorder = 'border: 2px solid #facc15; box-shadow: 0 0 10px rgba(250, 204, 21, 0.5);';
      } else if (rank === 2) {
        rankDisplay = `<div class="rank-crown crown-2"><i class="fa-solid fa-crown"></i><span class="crown-num">2</span></div>`;
        rowClass = 'rank-top-2';
        avatarBorder = 'border: 2px solid #cbd5e1; box-shadow: 0 0 10px rgba(203, 213, 225, 0.5);';
      } else if (rank === 3) {
        rankDisplay = `<div class="rank-crown crown-3"><i class="fa-solid fa-crown"></i><span class="crown-num">3</span></div>`;
        rowClass = 'rank-top-3';
        avatarBorder = 'border: 2px solid #fb923c; box-shadow: 0 0 10px rgba(251, 146, 60, 0.5);';
      }

      const rowHtml = `
        <tr data-mssv="${member.mssv}" class="${rowClass} cursor-pointer hover:bg-slate-700/50 transition-colors group" onclick="xemHoSo('${member.mssv}')" style="cursor: pointer;">
          <td style="text-align: center; vertical-align: middle;">${rankDisplay}</td>
          <td class="member-info-cell" style="vertical-align: middle; padding: 10px 0; text-align: center;">
            <img src="${member.avatarUrl}" data-mssv="${member.mssv}" alt="${member.name}" class="member-avatar-img" loading="lazy" style="${avatarBorder} filter: opacity(0.85); transition: filter 0.3s ease;">
            <span class="member-name" style="font-weight: 600; font-size: 13px; color: #fff; text-align: center; display: block; margin: 0;">${member.name}</span>
          </td>
          <td style="text-align: center; vertical-align: middle;">${member.gender}</td>
          <td style="text-align: center; vertical-align: middle;">${member.classInfo}</td>
          <td style="text-align: center; vertical-align: middle;">${member.sh}</td>
          <td style="text-align: center; vertical-align: middle;">${member.gd}</td>
          <td style="text-align: center; vertical-align: middle;">${member.hd}</td>
          <td style="text-align: center; vertical-align: middle;"><span class="total-score-badge">${member.totalPoints}</span></td>
        </tr>
      `;
      rowsContainer.innerHTML += rowHtml;
    });

  } catch (err) {
    console.error("Lỗi khi tải Bảng xếp hạng từ Supabase:", err);
    rowsContainer.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #ef4444;">Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại sau!</td></tr>';
  }
};

// Xử lý Ẩn/Hiện UI khi Đăng nhập/Đăng xuất
export function updateAuthUI() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userRole = (localStorage.getItem('userRole') || localStorage.getItem('role') || '').toLowerCase();
  const userMssv = (localStorage.getItem('userMssv') || localStorage.getItem('mssv') || '').toLowerCase();
  const userName = localStorage.getItem('username') || userMssv;

  const allowAdminRoles = ['admin', 'chủ nhiệm', 'phó chủ nhiệm', 'ban điều hành'];
  const isAdmin = userMssv === 'admin' || userRole === 'admin' || allowAdminRoles.some(r => userRole.includes(r));

  // 1. 2 nút 'ĐĂNG NHẬP' và 'ĐĂNG KÝ NGAY' ở Trang chủ / Header
  const authActionButtons = document.getElementById('auth-action-buttons');
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  const btnJoinClub = document.getElementById('btnJoinClub');
  const mobileAuthBtnGroup = document.getElementById('mobile-auth-btn-group');
  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
  const menuProfileMobile = document.getElementById('menu-profile-mobile');

  // 2. Các menu điều hướng ở Sidebar / Navbar
  const menuProfile = document.getElementById('menu-profile');
  const menuAdmin = document.getElementById('menu-admin');
  const btnAdminPortal = document.getElementById('btn-admin-portal');
  const menuLogout = document.getElementById('menu-logout');
  const btnLogout = document.getElementById('btn-logout');

  if (isLoggedIn) {
    // NẾU ĐÃ ĐĂNG NHẬP:
    // Ẩn hoàn toàn 2 nút 'ĐĂNG NHẬP' và 'ĐĂNG KÝ NGAY' ở ngoài Trang chủ
    if (authActionButtons) authActionButtons.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (btnJoinClub) btnJoinClub.classList.add('hidden');
    if (mobileAuthBtnGroup) mobileAuthBtnGroup.classList.add('hidden');
    if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'block';

    // Hiển thị menu 'Hồ sơ cá nhân'
    if (menuProfile) menuProfile.style.display = 'flex';
    if (menuProfileMobile) menuProfileMobile.style.display = 'flex';

    // Nút 'Quản trị Admin' ngoài UI luôn ẩn theo yêu cầu phân luồng
    if (menuAdmin) menuAdmin.style.display = 'none';
    if (btnAdminPortal) btnAdminPortal.style.display = 'none';

    // Hiển thị nút 'Đăng xuất' ở Sidebar & Hồ sơ
    if (menuLogout) menuLogout.style.display = 'flex';
    if (btnLogout) btnLogout.style.display = 'inline-flex';
  } else {
    // NẾU CHƯA ĐĂNG NHẬP / ẤN ĐĂNG XUẤT:
    // Hiển thị lại 2 nút 'ĐĂNG NHẬP' và 'ĐĂNG KÝ NGAY'
    if (authActionButtons) authActionButtons.style.display = 'flex';
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (registerBtn) registerBtn.style.display = 'inline-flex';
    if (btnJoinClub) btnJoinClub.classList.remove('hidden');
    if (mobileAuthBtnGroup) mobileAuthBtnGroup.classList.remove('hidden');
    if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'none';

    // Ẩn menu 'Hồ sơ cá nhân', 'Quản trị Admin' và nút 'Đăng xuất'
    if (menuProfile) menuProfile.style.display = 'none';
    if (menuProfileMobile) menuProfileMobile.style.display = 'none';
    if (menuAdmin) menuAdmin.style.display = 'none';
    if (btnAdminPortal) btnAdminPortal.style.display = 'none';
    if (menuLogout) menuLogout.style.display = 'none';
    if (btnLogout) btnLogout.style.display = 'none';
  }
}

// Hàm kiểm tra ẩn/hiện nút đăng ký dựa vào trạng thái đăng nhập Supabase Session
export async function toggleJoinButtonByAuth() {
  const btnJoin = document.getElementById('btnJoinClub');
  if (!btnJoin) return;

  try {
    const sbClient = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
    if (!sbClient || !sbClient.auth) {
      const isLogged = localStorage.getItem('isLoggedIn') === 'true';
      if (isLogged) {
        btnJoin.classList.add('hidden');
      } else {
        btnJoin.classList.remove('hidden');
      }
      return;
    }

    // Kiểm tra ngay khi vừa load trang
    const { data: { session }, error } = await sbClient.auth.getSession();

    if (session || localStorage.getItem('isLoggedIn') === 'true') {
      // Đã đăng nhập -> Ẩn nút (dùng class hidden của Tailwind)
      btnJoin.classList.add('hidden');
    } else {
      // Chưa đăng nhập -> Hiện nút
      btnJoin.classList.remove('hidden');
    }

    // Lắng nghe sự kiện đăng nhập/đăng xuất (Auth State Change) để tự động cập nhật mà không cần F5
    sbClient.auth.onAuthStateChange((event, currentSession) => {
      if (currentSession || localStorage.getItem('isLoggedIn') === 'true') {
        btnJoin.classList.add('hidden');
      } else {
        btnJoin.classList.remove('hidden');
      }
    });
  } catch (err) {
    console.error('Lỗi khi kiểm tra trạng thái đăng nhập:', err);
  }
}

// Nâng cấp hàm xử lý Đăng xuất chống kẹt loading & phòng thủ 2 lớp
export async function handleLogout(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const isNested = window.location.pathname.includes('/pages/');
  const targetPage = isNested ? '../index.html' : 'index.html';

  try {
    // 1. Gọi lệnh cắt đứt liên lạc với kho Supabase
    if (typeof supabase !== 'undefined' && supabase && supabase.auth) {
      await supabase.auth.signOut();
    }

    // 2. Xóa sạch mọi tàn dư trong bộ nhớ trình duyệt
    localStorage.clear();
    sessionStorage.clear();

    // 3. Đá thẳng về trang chủ dứt khoát
    window.location.replace(targetPage);

  } catch (error) {
    console.error('Lỗi khi đăng xuất Supabase:', error);

    // 4. LỚP PHÒNG THỦ: Dù Supabase có bị lỗi mạng không phản hồi, trình duyệt vẫn ép văng ra ngoài!
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace(targetPage);
  }
}

window.updateAuthUI = updateAuthUI;
window.checkLoginStatus = updateAuthUI;
window.handleLogout = handleLogout;
window.logout = handleLogout;
window.toggleJoinButtonByAuth = toggleJoinButtonByAuth;

document.addEventListener('DOMContentLoaded', () => {
  // Cập nhật Auth UI khi tải trang
  updateAuthUI();
  toggleJoinButtonByAuth();

  // Gắn sự kiện click phòng thủ 2 lớp cho các nút Đăng xuất
  ['btn-logout', 'btnDangXuat', 'menu-logout'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', handleLogout);
  });

  // Kiểm tra phiên đăng nhập với logic kiểm tra đường dẫn hiện tại phòng thủ chống lặp vô tận (Infinite Loop)
  if (typeof supabase !== 'undefined' && supabase && supabase.auth) {
    supabase.auth.onAuthStateChange((event, session) => {
      const trangHienTai = window.location.pathname;
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

      if (!session && !isLoggedIn) {
        // NẾU CHƯA ĐĂNG NHẬP (cả session lẫn localStorage đều trống): 
        if (!trangHienTai.endsWith('index.html') && !trangHienTai.endsWith('/') && trangHienTai !== '') {
          if (trangHienTai.includes('admin.html') || trangHienTai.includes('ho-so.html')) {
            const isNested = trangHienTai.includes('/pages/');
            window.location.replace(isNested ? '../index.html' : 'index.html');
          }
        }
      }
    });
  }

  // Kiểm tra xem có lệnh mở tab nào đang chờ xử lý từ trang khác chuyển về không
  const pendingTab = localStorage.getItem('pendingTab');

  if (pendingTab && document.getElementById(pendingTab + '-section')) {
    switchMainTab(pendingTab);
    localStorage.removeItem('pendingTab'); // Xóa lệnh chờ sau khi đã thực thi xong
  }

  // Tự động đồng bộ huy chương khi khởi tạo
  if (typeof window.syncAllMedals === 'function') {
    window.syncAllMedals();
  }
});

function openQRZoomModal() {
  const mainQr = document.getElementById('profile-qrcode');
  const zoomQr = document.getElementById('qr-zoom-img');
  if (mainQr && zoomQr) {
    zoomQr.src = mainQr.src;
    openModal('modal-qr-zoom');
  }
}

// Helper render huy hiệu có ảnh đi kèm text
window.getBadgeHTML = function (rankName) {
  const isNested = window.location.pathname.includes('/pages/');
  const prefix = isNested ? '../' : './';
  let badgeFileName = 'bac1';
  const name = (rankName || '').trim().toLowerCase();

  if (name.includes('nòng cốt') || name.includes('nong cot') || name.includes('chiến thần bàn cờ') || name.includes('chien than ban co') || name.includes('cao thủ') || name.includes('cao thu')) {
    badgeFileName = 'bac6';
  } else if (name.includes('ưu tú') || name.includes('uu tu')) {
    badgeFileName = 'bac5';
  } else if (name.includes('cốt cán') || name.includes('cot can')) {
    badgeFileName = 'bac4';
  } else if (name.includes('tích cực') || name.includes('tich cuc')) {
    badgeFileName = 'bac3';
  } else if (name.includes('hội viên') || name.includes('hoi vien')) {
    badgeFileName = 'bac2';
  } else {
    badgeFileName = 'bac1';
  }

  return `<img src="${prefix}assets/badges/${badgeFileName}.png" class="badge-icon-small" alt="${rankName}"> ${rankName}`;
};

// ==========================================================================
// HỆ THỐNG TỰ ĐỘNG XÉT HUY CHƯƠNG (MAX RANK POLICY)
// ==========================================================================

// 1. Calculate rank level from stats (140-week criteria, AND logic)
function calculateStatRank(buoi_sinh_hoat, giai_dau, hoat_dong) {
  const sh = parseInt(buoi_sinh_hoat) || 0;
  const gd = parseInt(giai_dau) || 0;
  const hd = parseInt(hoat_dong) || 0;

  if (sh >= 115 && gd >= 12 && hd >= 15) return 6; // 🏆 Bậc 6: Nòng cốt
  if (sh >= 100 && gd >= 10 && hd >= 12) return 5; // 🏅 Bậc 5: Ưu tú
  if (sh >= 60 && gd >= 5 && hd >= 8) return 4; // 🥇 Bậc 4: Cốt cán
  if (sh >= 20 && gd >= 2 && hd >= 4) return 3; // 🥈 Bậc 3: Thành viên tích cực
  if (sh >= 8 && gd >= 1 && hd >= 2) return 2; // 🥉 Bậc 2: Hội viên
  return 1; // 🔰 Bậc 1: Thành viên mới (Mặc định 1)
}
window.calculateStatRank = calculateStatRank;

// 2. Calculate rank level from Executive Board Role
function calculateRoleRank(chuc_vu) {
  if (!chuc_vu) return 1;
  const role = String(chuc_vu).trim().toLowerCase();

  if (role.includes('chủ nhiệm') && !role.includes('phó')) return 6;
  if (role.includes('phó chủ nhiệm') || (role.includes('chủ nhiệm') && role.includes('phó'))) return 5;
  if ((role.includes('trưởng ban') || role.includes('thư ký') || role.includes('thu ky') || role.includes('thư kí') || role.includes('thu ki')) && !role.includes('phó')) return 4;
  if (role.includes('phó trưởng ban') || role.includes('phó ban') || role.includes('phó')) return 3;

  return 1;
}
window.calculateRoleRank = calculateRoleRank;

const RANK_BADGE_MAP = {
  1: { badge: 'bac1.png', text: 'Bậc 1: Thành viên mới', icon: '🔰' },
  2: { badge: 'bac2.png', text: 'Bậc 2: Hội viên', icon: '🥉' },
  3: { badge: 'bac3.png', text: 'Bậc 3: Thành viên tích cực', icon: '🥈' },
  4: { badge: 'bac4.png', text: 'Bậc 4: Thành viên cốt cán', icon: '🥇' },
  5: { badge: 'bac5.png', text: 'Bậc 5: Thành viên ưu tú', icon: '🏅' },
  6: { badge: 'bac6.png', text: 'Bậc 6: Thành viên nòng cốt', icon: '🏆' }
};

function getBadgeInfo(val) {
  let level = 1;
  if (typeof val === 'number') {
    level = Math.max(1, Math.min(6, val));
  } else if (typeof val === 'string') {
    const str = val.trim().toLowerCase();
    if (str.includes('6') || str.includes('nòng cốt') || str.includes('nong cot') || (str.includes('chủ nhiệm') && !str.includes('phó'))) {
      level = 6;
    } else if (str.includes('5') || str.includes('ưu tú') || str.includes('uu tu') || str.includes('phó chủ nhiệm')) {
      level = 5;
    } else if (str.includes('4') || str.includes('cốt cán') || str.includes('cot can') || ((str.includes('trưởng ban') || str.includes('thư ký') || str.includes('thu ky') || str.includes('thư kí') || str.includes('thu ki')) && !str.includes('phó'))) {
      level = 4;
    } else if (str.includes('3') || str.includes('tích cực') || str.includes('tich cuc') || str.includes('phó ban') || str.includes('phó trưởng ban') || str.includes('phó')) {
      level = 3;
    } else if (str.includes('2') || str.includes('hội viên') || str.includes('hoi vien')) {
      level = 2;
    } else {
      level = 1;
    }
  }
  const isNested = window.location.pathname.includes('/pages/');
  const prefix = isNested ? '../assets/badges/' : './assets/badges/';
  const info = RANK_BADGE_MAP[level] || RANK_BADGE_MAP[1];
  return {
    level,
    badgeSrc: prefix + info.badge,
    text: info.text,
    icon: info.icon
  };
}
window.getBadgeInfo = getBadgeInfo;

function loadMembers() {
  if (typeof window.forceRenderMembers === 'function') {
    window.forceRenderMembers();
  }
}
const loadMembersList = loadMembers;
window.loadMembers = loadMembers;
window.loadMembersList = loadMembers;

// Helper lấy Icon duy nhất cho Huy chương / Danh hiệu
window.getMedalIcon = function (val) {
  if (!val) return '';
  const str = String(val).trim();
  if (str.includes('🏆') || str.includes('nòng cốt') || str.includes('nong cot')) return '🏆';
  if (str.includes('🏅') || str.includes('ưu tú') || str.includes('uu tu')) return '🏅';
  if (str.includes('🥇') || str.includes('cốt cán') || str.includes('cot can')) return '🥇';
  if (str.includes('🥈') || str.includes('tích cực') || str.includes('tich cuc')) return '🥈';
  if (str.includes('🥉') || str.includes('Hội viên') || str.includes('hoi vien')) return '🥉';
  if (str.includes('🔰') || str.includes('mới') || str.includes('moi')) return '🔰';

  const iconMatch = str.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u);
  return iconMatch ? iconMatch[0] : '';
};


// Render Ban điều hành dưới dạng danh sách động lấy từ Supabase
// Render Ban điều hành dưới dạng danh sách động lấy từ Supabase
window.loadExecutives = async function () {
  try {
    const isNested = window.location.pathname.includes('/pages/');
    const fallbackAvatar = isNested ? '../assets/default-avatar.png' : './assets/default-avatar.png';

    // GET danh sách Ban điều hành JOIN với bảng thanh_vien
    const { data: rawData, error } = await supabase
      .from('ban_dieu_hanh')
      .select('*, thanh_vien(ho_ten, avatar, sdt, khoa_lop)');

    let boardList = [];
    if (!error && rawData && rawData.length > 0) {
      boardList = rawData.map(item => {
        const tv = item.thanh_vien || {};
        const hoTenVal = tv.ho_ten || item.ho_ten || item.full_name || item.name || item.mssv;
        const avatarVal = tv.avatar || item.avatar || tv.avatar_url || item.avatar_url || item.hinh_anh || '';
        const sdtVal = tv.sdt || tv.so_dien_thoai || item.so_dien_thoai || item.sdt || '';
        const classVal = tv.khoa_lop || item.khoa_lop || 'Chưa cập nhật';
        return {
          ...item,
          ho_ten: hoTenVal,
          full_name: hoTenVal,
          name: hoTenVal,
          title: item.chuc_vu || item.title || 'Ban điều hành',
          avatar: avatarVal,
          sdt: sdtVal,
          khoa_lop: classVal,
          is_former: item.trang_thai === 'Cựu thành viên'
        };
      });
    } else {
      const { data: tvMembers } = await supabase
        .from('thanh_vien')
        .select('*')
        .neq('mssv', 'admin')
        .limit(30);

      if (tvMembers) {
        boardList = tvMembers.map(tv => ({
          ...tv,
          ho_ten: tv.ho_ten || tv.mssv,
          full_name: tv.ho_ten || tv.mssv,
          title: tv.danh_hieu || 'Thành viên BĐH',
          avatar: tv.avatar || tv.avatar_url || tv.hinh_anh || '',
          sdt: tv.sdt || tv.so_dien_thoai || '',
          khoa_lop: tv.khoa_lop || 'Chưa cập nhật',
          is_former: false
        }));
      }
    }

    // Khu vực 1: Đang đương nhiệm
    const activeTeam = boardList.filter(m => !m.is_former && m.trang_thai !== 'Cựu thành viên');

    // Khu vực 2: Cựu thành viên (retro)
    const retroTeam = boardList.filter(m => m.is_former || m.trang_thai === 'Cựu thành viên');

    // Render khu vực Đương nhiệm
    const activeContainer = document.getElementById('active-management-container') || document.getElementById('public-board-list');
    if (activeContainer) {
      if (activeTeam.length === 0) {
        activeContainer.innerHTML = '<p class="empty-data-msg">Chưa có dữ liệu</p>';
      } else {
        activeContainer.innerHTML = buildExecutiveTowerHtml(activeTeam);
      }
    }

    // Render khu vực Cựu thành viên
    const retroContainer = document.getElementById('retro-management-container');
    if (retroContainer) {
      if (retroTeam.length === 0) {
        retroContainer.innerHTML = '<p class="empty-data-msg">Chưa có dữ liệu</p>';
      } else {
        retroContainer.innerHTML = retroTeam.map(m => {
          const rawExecAvt = m.avatar;
          const execAvtSrc = (rawExecAvt && String(rawExecAvt).trim() !== '' && !rawExecAvt.includes('via.placeholder'))
            ? (rawExecAvt.includes('?') ? `${rawExecAvt}&t=${Date.now()}` : `${rawExecAvt}?t=${Date.now()}`)
            : fallbackAvatar;
          return `
                <div onclick="openProfileModal('${m.mssv || ''}')" class="bg-[#0f172a] rounded-2xl border border-[#0ea5e9] shadow-[0_0_15px_rgba(14,165,233,0.15)] p-6 flex flex-col items-center w-72 mx-auto my-4 transition-transform hover:scale-105 duration-300 cursor-pointer">
                    
                    <!-- Ảnh đại diện bo tròn viền sáng -->
                    <img src="${execAvtSrc}" alt="${m.ho_ten}" 
                         class="w-40 h-40 rounded-full border-4 border-[#0ea5e9] shadow-[0_0_20px_rgba(14,165,233,0.6)] object-cover mb-5">
                         
                    <!-- Tên và Chức vụ -->
                    <h3 class="text-white font-bold text-2xl text-center mb-2">
                        <span>${m.ho_ten}</span>
                    </h3>
                    <p class="text-[#0ea5e9] font-bold text-sm text-center uppercase tracking-widest mb-1">Cựu ${m.title}</p>
                    
                </div>
            `;
        }).join('');
      }
    }

  } catch (error) {
    console.error('Lỗi khi tải danh sách Ban điều hành:', error.message);
  }
};

// =========================================================================
// HELPER TẠO THẺ NHÂN SỰ BAN ĐIỀU HÀNH DÀNH CHO MÁY TÍNH (DESKTOP)
// =========================================================================
function createExecutiveTowerCardDesktop(m, roleType) {
  const rawTv = m.thanh_vien;
  const tv = (Array.isArray(rawTv) && rawTv.length > 0) ? rawTv[0] : (Array.isArray(rawTv) ? {} : (rawTv || {}));
  const nameStr = m.ho_ten || m.full_name || m.name || tv.ho_ten || m.mssv || 'Ban Điều Hành';
  const titleStr = m.chuc_vu || m.title || '';
  const phoneStr = m.so_dien_thoai || m.sdt || m.phone || m.phone_number || tv.sdt || tv.so_dien_thoai || '';
  const cleanPhone = phoneStr ? String(phoneStr).replace(/\s+/g, '') : '';
  const hasPhone = cleanPhone.length > 0;
  const phoneHref = hasPhone ? `tel:${cleanPhone}` : 'javascript:void(0)';

  const rawBoardAvt = m.avatar || m.avatar_url || m.hinh_anh || tv.avatar || tv.avatar_url || tv.hinh_anh || (m.mssv ? localStorage.getItem('avatar_' + m.mssv) : '') || '';
  const hasRealAvatar = Boolean(rawBoardAvt && String(rawBoardAvt).trim() !== '' && !rawBoardAvt.includes('via.placeholder'));

  const avatarUrl = hasRealAvatar
    ? (rawBoardAvt.includes('?') ? `${rawBoardAvt}&t=${Date.now()}` : `${rawBoardAvt}?t=${Date.now()}`)
    : '';

  const firstLetter = (nameStr && nameStr !== 'Ban Điều Hành') ? nameStr.trim().charAt(0).toUpperCase() : 'B';

  let cardWidthClass = 'w-56 p-6 min-h-[340px]';
  let avatarSizeClass = 'w-32 h-32 text-4xl';
  let glowColorClass = 'bg-amber-500/20 group-hover:bg-amber-400/40';
  let nameSizeClass = 'text-xl font-bold';
  let titleGradientClass = 'text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500';
  let btnPaddingClass = 'px-4 py-2 text-xs';
  let iconSizeClass = 'w-3.5 h-3.5';

  if (roleType === 'CN') {
    cardWidthClass = 'w-56 p-5 min-h-[340px]';
    avatarSizeClass = 'w-32 h-32 text-4xl';
    glowColorClass = 'bg-amber-500/25 group-hover:bg-amber-400/45';
    nameSizeClass = 'text-xl font-bold';
    titleGradientClass = 'text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500';
    btnPaddingClass = 'px-4 py-2 text-xs';
    iconSizeClass = 'w-3.5 h-3.5';
  } else if (roleType === 'PCN') {
    cardWidthClass = 'w-44 p-4 min-h-[280px]';
    avatarSizeClass = 'w-20 h-20 text-2xl';
    glowColorClass = 'bg-cyan-500/20 group-hover:bg-cyan-400/40';
    nameSizeClass = 'text-lg font-semibold';
    titleGradientClass = 'text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500';
    btnPaddingClass = 'px-3.5 py-1.5 text-[11px]';
    iconSizeClass = 'w-3 h-3';
  } else {
    cardWidthClass = 'w-36 p-3.5 min-h-[240px]';
    avatarSizeClass = 'w-14 h-14 text-xl';
    glowColorClass = 'bg-blue-500/20 group-hover:bg-blue-400/40';
    nameSizeClass = 'text-base font-medium';
    titleGradientClass = 'text-[11px] font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400';
    btnPaddingClass = 'px-2.5 py-1 text-[10px]';
    iconSizeClass = 'w-3 h-3';
  }

  const innerAvatar = hasRealAvatar
    ? `<img src="${avatarUrl}" alt="${nameStr}" loading="lazy" class="w-full h-full object-cover rounded-full">`
    : `<div class="w-full h-full rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-extrabold shadow-inner">${firstLetter}</div>`;

  return `
        <div onclick="if(typeof openProfileModal === 'function') openProfileModal('${m.mssv || ''}')" 
             class="relative flex flex-col items-center bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-xl hover:-translate-y-2 hover:shadow-blue-500/20 transition-all duration-300 group overflow-hidden cursor-pointer ${cardWidthClass}">
            
            <!-- Hiệu ứng ánh sáng lướt qua khi hover -->
            <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <!-- Khu vực Avatar (Vòng glow + Border) -->
            <div class="relative mb-3 flex-shrink-0">
                <!-- Vòng glow bên ngoài -->
                <div class="absolute inset-0 ${glowColorClass} rounded-full blur-md transition-colors duration-300"></div>
                <!-- Avatar chính -->
                <div class="relative z-10 flex justify-center items-center rounded-full bg-slate-700 border-4 border-slate-600 group-hover:border-blue-400 transition-all duration-300 text-slate-200 font-bold overflow-hidden ${avatarSizeClass}">
                    ${innerAvatar}
                </div>
            </div>

            <!-- Họ và tên -->
            <h3 class="${nameSizeClass} text-slate-100 group-hover:text-white transition-colors text-center uppercase tracking-wide mb-1 line-clamp-2">
                ${nameStr}
            </h3>

            <!-- Chức vụ (Dùng Gradient lấp lánh) -->
            <p class="mt-0.5 mb-4 ${titleGradientClass} uppercase tracking-widest text-center">
                ${titleStr}
            </p>

            <!-- Nút Gọi Điện (Pill button) -->
            <div class="mt-auto z-10">
                <a href="${phoneHref}" onclick="event.stopPropagation()" 
                   class="flex items-center gap-1.5 ${btnPaddingClass} bg-slate-700/50 hover:bg-blue-600 border border-slate-600 hover:border-blue-500 text-slate-300 hover:text-white rounded-full font-medium transition-all duration-300">
                    <svg class="${iconSizeClass} flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                    <span>${hasPhone ? phoneStr : 'Gọi điện'}</span>
                </a>
            </div>
        </div>
    `;
}

// =========================================================================
// HELPER TẠO THẺ NHÂN SỰ BAN ĐIỀU HÀNH DÀNH CHO ĐIỆN THOẠI (MOBILE)
// =========================================================================
function createExecutiveTowerCardMobile(m) {
  const rawTv = m.thanh_vien;
  const tv = (Array.isArray(rawTv) && rawTv.length > 0) ? rawTv[0] : (Array.isArray(rawTv) ? {} : (rawTv || {}));
  const nameStr = m.ho_ten || m.full_name || m.name || tv.ho_ten || m.mssv || 'Ban Điều Hành';
  const titleStr = m.chuc_vu || m.title || 'Thành viên BĐH';
  const phoneStr = m.so_dien_thoai || m.sdt || m.phone || m.phone_number || tv.sdt || tv.so_dien_thoai || '';
  const cleanPhone = phoneStr ? String(phoneStr).replace(/\s+/g, '') : '';
  const hasPhone = cleanPhone.length > 0;
  const phoneHref = hasPhone ? `tel:${cleanPhone}` : 'javascript:void(0)';

  const rawBoardAvt = m.avatar || m.avatar_url || m.hinh_anh || tv.avatar || tv.avatar_url || tv.hinh_anh || (m.mssv ? localStorage.getItem('avatar_' + m.mssv) : '') || '';
  const hasRealAvatar = Boolean(rawBoardAvt && String(rawBoardAvt).trim() !== '' && !rawBoardAvt.includes('via.placeholder'));

  const avatarUrl = hasRealAvatar
    ? (rawBoardAvt.includes('?') ? `${rawBoardAvt}&t=${Date.now()}` : `${rawBoardAvt}?t=${Date.now()}`)
    : (m.gioi_tinh === 'Nữ' || tv.gioi_tinh === 'Nữ' ? '/assets/default-avatar-female.png' : '/assets/default-avatar.png');

  const firstLetter = (nameStr && nameStr !== 'Ban Điều Hành') ? nameStr.trim().charAt(0).toUpperCase() : 'B';

  const avatarElement = hasRealAvatar
    ? `<img src="${avatarUrl}" alt="${nameStr}" class="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-lg border-2 border-blue-400/50 group-hover:border-blue-400 transition-colors" loading="lazy">`
    : `<div class="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg border-2 border-blue-400/50 group-hover:border-blue-400 transition-colors">${firstLetter}</div>`;

  return `
    <div onclick="if(typeof openProfileModal === 'function') openProfileModal('${m.mssv || ''}')" class="flex flex-col items-center text-center group cursor-pointer w-full">
        <!-- Ảnh đại diện tròn -->
        <div class="relative mb-3">
            ${avatarElement}
        </div>

        <!-- Tên và Chức vụ -->
        <h3 class="text-base sm:text-lg font-bold text-white mb-1">${nameStr}</h3>
        <p class="text-xs sm:text-sm text-blue-300 font-medium mb-3">${titleStr}</p>

        <!-- Nút Gọi điện gọn gàng hơn dạng viên thuốc (Pill) -->
        <a href="${phoneHref}" onclick="event.stopPropagation()" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/25 border border-white/10 text-white rounded-full text-xs font-medium transition-all backdrop-blur-sm">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>
            Gọi điện
        </a>
    </div>
  `;
}

function buildExecutiveTowerHtml(activeBoardMembers) {
  if (!activeBoardMembers || activeBoardMembers.length === 0) {
    return '<div style="color: gray; font-style: italic; padding: 10px; text-align: center; width: 100%;">Chưa có thông tin cập nhật.</div>';
  }

  // 1. Phân loại 3 nhóm cho Desktop
  const nhomCN = activeBoardMembers.filter(m => {
    const title = (m.chuc_vu || m.title || '').toLowerCase();
    return title.includes('chủ nhiệm') && !title.includes('phó');
  });

  const nhomPCN = activeBoardMembers.filter(m => {
    const title = (m.chuc_vu || m.title || '').toLowerCase();
    return title.includes('phó chủ nhiệm');
  });

  const nhomBan = activeBoardMembers.filter(m => {
    return !nhomCN.includes(m) && !nhomPCN.includes(m);
  });

  // 2. Tầng 1 Desktop: Đặt nhomCN ở giữa, nhomPCN ở 2 bên cạnh Chủ nhiệm
  const tang1CardsDesktop = [];
  if (nhomPCN.length > 0) {
    const half = Math.ceil(nhomPCN.length / 2);
    const leftPCN = nhomPCN.slice(0, half);
    const rightPCN = nhomPCN.slice(half);

    leftPCN.forEach(m => tang1CardsDesktop.push(createExecutiveTowerCardDesktop(m, 'PCN')));
    nhomCN.forEach(m => tang1CardsDesktop.push(createExecutiveTowerCardDesktop(m, 'CN')));
    rightPCN.forEach(m => tang1CardsDesktop.push(createExecutiveTowerCardDesktop(m, 'PCN')));
  } else {
    nhomCN.forEach(m => tang1CardsDesktop.push(createExecutiveTowerCardDesktop(m, 'CN')));
  }

  // 3. Tầng 2 Desktop: Trưởng ban & Phó ban
  const tang2CardsDesktop = nhomBan.map(m => createExecutiveTowerCardDesktop(m, 'BAN'));

  // 4. Danh sách thẻ dành cho Mobile
  const mobileCards = activeBoardMembers.map(m => createExecutiveTowerCardMobile(m));

  return `
    <!-- GIAO DIỆN MÁY TÍNH (DESKTOP): THÁP QUYỀN LỰC NGUYÊN BẢN -->
    <div class="executive-desktop-view flex-col items-center gap-8 w-full py-4">
        <!-- Tầng 1 (Cấp cao nhất) -->
        ${tang1CardsDesktop.length > 0 ? `
            <div class="flex flex-wrap justify-center items-center gap-8 w-full">
                ${tang1CardsDesktop.join('')}
            </div>
        ` : ''}

        <!-- Tầng 2 (Các ban chuyên môn) -->
        ${tang2CardsDesktop.length > 0 ? `
            <div class="flex flex-wrap justify-center gap-6 w-full">
                ${tang2CardsDesktop.join('')}
            </div>
        ` : ''}
    </div>

    <!-- GIAO DIỆN ĐIỆN THOẠI (MOBILE): AVATAR TRÒN GỌN GÀNG 2 CỘT -->
    <div class="executive-mobile-view grid-cols-2 gap-6 gap-y-10 w-full py-4 justify-items-center">
        ${mobileCards.join('')}
    </div>
  `;
}

// HÀM KÉO DỮ LIỆU BĐH RA TRANG CHỦ
async function loadBdhTrangChu() {
  const khuVucBdh = document.getElementById('khuVucBdhTrangChu') || document.getElementById('public-board-list');
  const khuVucCuu = document.getElementById('khuVucCuuBdhTrangChu') || document.getElementById('retro-management-container');

  // Nếu trang hiện tại không có khu vực này thì bỏ qua
  if (!khuVucBdh && !khuVucCuu) return;

  try {
    // Lấy dữ liệu BĐH kèm tên thật và thông tin chi tiết từ kho thành viên
    let data = null;
    let error = null;

    const res = await supabase
      .from('ban_dieu_hanh')
      .select('*, thanh_vien(*)')
      .order('id', { ascending: true });

    data = res.data;
    error = res.error;

    if (error || !data || data.length === 0) {
      const fallbackRes = await supabase
        .from('ban_dieu_hanh')
        .select('*')
        .order('id', { ascending: true });
      if (fallbackRes.data && fallbackRes.data.length > 0) {
        data = fallbackRes.data;
        error = null;
      }
    }

    if (error && (!data || data.length === 0)) throw error;

    // Nếu bất kỳ bản ghi nào chưa có thanh_vien.ho_ten, thực hiện nạp bổ sung từ thanh_vien theo danh sách mssv
    const mssvList = (data || []).map(i => i.mssv).filter(Boolean);
    let tvMap = {};
    if (mssvList.length > 0) {
      const { data: tvData } = await supabase
        .from('thanh_vien')
        .select('*')
        .in('mssv', mssvList);

      if (tvData && tvData.length > 0) {
        tvData.forEach(tv => {
          if (tv.mssv) {
            tvMap[String(tv.mssv).trim().toUpperCase()] = tv;
            tvMap[String(tv.mssv).trim().toLowerCase()] = tv;
            tvMap[String(tv.mssv).trim()] = tv;
          }
        });
      }
    }

    data = (data || []).map(item => {
      const rawTv = item.thanh_vien;
      const tvFromRel = (Array.isArray(rawTv) && rawTv.length > 0) ? rawTv[0] : (Array.isArray(rawTv) ? null : rawTv);
      const cleanKey = String(item.mssv || '').trim().toUpperCase();
      const tvFromMap = tvMap[cleanKey] || tvMap[String(item.mssv || '').trim()] || {};
      const tv = { ...tvFromMap, ...(tvFromRel || {}) };

      const realName = tv.ho_ten || item.ho_ten || item.full_name || item.name || item.mssv;
      const realAvt = tv.avatar || tv.avatar_url || tv.hinh_anh || tv.anh_dai_dien || tv.photo || tv.image || tv.img || item.avatar || item.avatar_url || item.hinh_anh || (item.mssv ? localStorage.getItem('avatar_' + item.mssv) : '') || '';
      const realPhone = tv.sdt || tv.so_dien_thoai || item.so_dien_thoai || item.sdt || '';
      const realClass = tv.khoa_lop || item.khoa_lop || 'Chưa cập nhật';

      return {
        ...item,
        thanh_vien: tv,
        ho_ten: realName,
        full_name: realName,
        name: realName,
        avatar: realAvt,
        avatar_url: realAvt,
        hinh_anh: realAvt,
        sdt: realPhone,
        so_dien_thoai: realPhone,
        khoa_lop: realClass
      };
    });

    // Xóa hiệu ứng loading hoặc làm sạch vùng chứa
    if (khuVucBdh) khuVucBdh.innerHTML = '';
    if (khuVucCuu) khuVucCuu.innerHTML = '';

    const activeBoardMembers = (data || []).filter(item => item.trang_thai !== 'Cựu thành viên');
    const formerBoardMembers = (data || []).filter(item => item.trang_thai === 'Cựu thành viên');

    // Render Đương nhiệm dạng Tháp Quyền Lực
    if (khuVucBdh) {
      khuVucBdh.innerHTML = buildExecutiveTowerHtml(activeBoardMembers);
    }

    // Render Cựu thành viên BĐH dạng Bảng
    if (khuVucCuu) {
      if (khuVucCuu.tagName === 'TBODY') {
        khuVucCuu.innerHTML = '';
        if (formerBoardMembers.length === 0) {
          khuVucCuu.innerHTML = '<tr><td colspan="6" style="text-align:center; color: #aaa; padding: 20px;">Chưa có thông tin cựu ban điều hành.</td></tr>';
        } else {
          const isNested = typeof window !== 'undefined' && window.location.pathname.includes('/pages/');
          const basePath = isNested ? '../assets/badges/' : './assets/badges/';

          formerBoardMembers.forEach(item => {
            const tv = item.thanh_vien || {};
            const ten = tv.ho_ten || item.ho_ten || item.full_name || item.name || item.mssv;
            const classVal = tv.khoa_lop || item.khoa_lop || 'Chưa cập nhật';
            const genderVal = tv.gioi_tinh || item.gioi_tinh || 'Nam';

            const rawCuuAvt = tv.avatar || tv.avatar_url || tv.hinh_anh || item.avatar || item.avatar_url || item.hinh_anh;
            let cuuAvtHtml = '';
            if (rawCuuAvt && String(rawCuuAvt).trim() !== '' && !rawCuuAvt.includes('via.placeholder')) {
              const bustedUrl = rawCuuAvt.includes('?') ? `${rawCuuAvt}&t=${Date.now()}` : `${rawCuuAvt}?t=${Date.now()}`;
              cuuAvtHtml = `<img src="${bustedUrl}" alt="${ten}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">`;
            } else {
              let avt = { chuCai: ten.charAt(0).toUpperCase(), mauNen: '#38bdf8' };
              if (typeof taoAvatarChuCai === 'function') avt = taoAvatarChuCai(ten);
              cuuAvtHtml = `<div style="width: 40px; height: 40px; border-radius: 50%; background-color: ${avt.mauNen}; color: #1e293b; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1rem; flex-shrink: 0;">${avt.chuCai}</div>`;
            }

            let sh = tv.diem_sinh_hoat || 0, gd = tv.diem_giai_dau || 0, hd = tv.diem_hoat_dong || 0;
            let bacDiem = 1;
            if (sh >= 115 && gd >= 12 && hd >= 15) bacDiem = 6;
            else if (sh >= 100 && gd >= 10 && hd >= 12) bacDiem = 5;
            else if (sh >= 60 && gd >= 5 && hd >= 8) bacDiem = 4;
            else if (sh >= 20 && gd >= 2 && hd >= 4) bacDiem = 3;
            else if (sh >= 8 && gd >= 1 && hd >= 2) bacDiem = 2;

            let bacChucVu = 1;
            if (item.chuc_vu) {
              let cvLower = String(item.chuc_vu).toLowerCase();
              if (cvLower.includes('chủ nhiệm') && !cvLower.includes('phó')) bacChucVu = 6;
              else if (cvLower.includes('phó chủ nhiệm')) bacChucVu = 5;
              else if ((cvLower.includes('trưởng ban') || cvLower.includes('thư ký') || cvLower.includes('thu ky') || cvLower.includes('thư kí') || cvLower.includes('thu ki')) && !cvLower.includes('phó')) bacChucVu = 4;
              else if (cvLower.includes('phó ban') || cvLower.includes('phó trưởng ban') || cvLower.includes('phó')) bacChucVu = 3;
            }

            let bacCuoiCung = Math.max(bacDiem, bacChucVu);
            const danhHieuMap = {
              6: { ten: 'Thành viên nòng cốt', img: `${basePath}bac6.png` },
              5: { ten: 'Thành viên ưu tú', img: `${basePath}bac5.png` },
              4: { ten: 'Thành viên cốt cán', img: `${basePath}bac4.png` },
              3: { ten: 'Thành viên tích cực', img: `${basePath}bac3.png` },
              2: { ten: 'Hội viên', img: `${basePath}bac2.png` },
              1: { ten: 'Thành viên mới', img: `${basePath}bac1.png` }
            };
            const danhHieu = danhHieuMap[bacCuoiCung] || danhHieuMap[1];

            const memberMssv = item.mssv || tv.mssv || '';
            const rawStatus = tv.trang_thai || tv.status || (memberMssv ? localStorage.getItem(`status_${memberMssv}`) : null) || 'Online';
            const isOnline = (String(rawStatus).toLowerCase() === 'online' || String(rawStatus).toLowerCase() === 'hoạt động' || String(rawStatus).toLowerCase() === 'active');
            const statusBadgeHtml = isOnline
              ? `<div class="flex items-center justify-center gap-2 text-green-500 text-sm font-semibold"><span class="w-2 h-2 rounded-full bg-green-500"></span><span>Online</span></div>`
              : `<div class="flex items-center justify-center gap-2 text-slate-400 text-sm font-medium"><span class="w-2 h-2 rounded-full bg-slate-500"></span><span>Offline</span></div>`;

            const tr = document.createElement('tr');
            tr.setAttribute('onclick', `xemHoSo('${memberMssv}')`);
            tr.className = 'cursor-pointer hover:bg-slate-700/50 transition-colors group';
            tr.style.cursor = 'pointer';
            tr.style.borderBottom = '1px solid #334155';
            tr.style.transition = 'all 0.3s ease';
            tr.onmouseover = () => tr.style.backgroundColor = 'rgba(255,255,255,0.05)';
            tr.onmouseout = () => tr.style.backgroundColor = '';

            tr.innerHTML = `
                            <td style="padding: 15px; vertical-align: middle;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    ${cuuAvtHtml}
                                    <span style="color: #f1f5f9; font-weight: 500;">${ten}</span>
                                </div>
                            </td>
                            <td style="padding: 15px; vertical-align: middle; color: #94a3b8; text-align: center;">${classVal}</td>
                            <td style="padding: 15px; vertical-align: middle; color: #94a3b8; text-align: center;">${genderVal}</td>
                            <td style="padding: 15px; text-align: center; vertical-align: middle;">
                                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
                                    <img src="${danhHieu.img}" alt="${danhHieu.ten}" title="${danhHieu.ten}${item.chuc_vu ? ' - ' + item.chuc_vu : ''}" style="width: 35px; height: 35px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); display: inline-block; vertical-align: middle;">
                                    <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">${danhHieu.ten}</span>
                                </div>
                            </td>
                            <td style="padding: 15px; vertical-align: middle; color: #00d2ff; font-weight: 600; text-align: center;">${item.chuc_vu || 'Cựu BĐH'}</td>
                            <td style="padding: 15px; vertical-align: middle; text-align: center;">${statusBadgeHtml}</td>
                        `;
            khuVucCuu.appendChild(tr);
          });
        }
      }
    }

  } catch (error) {
    console.error('Lỗi tải danh sách BĐH trang chủ:', error);
  }
}

window.loadBdhTrangChu = loadBdhTrangChu;

document.addEventListener('DOMContentLoaded', () => {
  loadBdhTrangChu();
});

// Hiển thị thông tin chi tiết hồ sơ thành viên khi click vào tên / card (Truy vấn Supabase trực tiếp)
window.fetchMemberFullProfile = async function (mssv) {
  if (!mssv) return null;
  const cleanMssv = String(mssv).trim();
  let client = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);

  let profileData = null;

  if (client) {
    try {
      // 1. Kéo dữ liệu từ thanh_vien kèm ban_dieu_hanh
      const resTV = await client
        .from('thanh_vien')
        .select('*, ban_dieu_hanh(chuc_vu, trang_thai, so_dien_thoai)')
        .eq('mssv', cleanMssv)
        .maybeSingle();

      if (resTV.data) {
        profileData = { ...resTV.data };
      }
    } catch (e) {
      console.warn('Lỗi query thanh_vien:', e);
    }

    try {
      // 2. Kéo dữ liệu từ members nếu có
      const resMem = await client
        .from('thanh_vien')
        .select('*')
        .eq('mssv', cleanMssv)
        .maybeSingle();

      if (resMem.data) {
        profileData = {
          ...resMem.data,
          ...(profileData || {}),
          ho_ten: profileData?.ho_ten || resMem.data.full_name || resMem.data.name || cleanMssv,
          khoa_lop: profileData?.khoa_lop || resMem.data.class_name || resMem.data.class || resMem.data.classInfo || 'K20 - CNTT',
          gioi_tinh: profileData?.gioi_tinh || resMem.data.gender || resMem.data.gioiTinh || 'Nam',
          avatar_url: profileData?.avatar || profileData?.avatar_url || profileData?.hinh_anh || resMem.data?.avatar || resMem.data?.avatar_url || resMem.data?.hinh_anh,
          avatar: profileData?.avatar || profileData?.avatar_url || profileData?.hinh_anh || resMem.data?.avatar || resMem.data?.avatar_url || resMem.data?.hinh_anh,
          hinh_anh: profileData?.avatar || profileData?.avatar_url || profileData?.hinh_anh || resMem.data?.avatar || resMem.data?.avatar_url || resMem.data?.hinh_anh,
          diem_sinh_hoat: profileData?.diem_sinh_hoat ?? resMem.data.diem_sinh_hoat ?? resMem.data.sinhhoat ?? resMem.data.buoiSinhHoat ?? 0,
          diem_giai_dau: profileData?.diem_giai_dau ?? resMem.data.diem_giai_dau ?? resMem.data.giaidau ?? resMem.data.giaiDau ?? 0,
          diem_hoat_dong: profileData?.diem_hoat_dong ?? resMem.data.diem_hoat_dong ?? resMem.data.hoatdong ?? resMem.data.hoatDong ?? 0,
          ngay_tham_gia: profileData?.ngay_tham_gia || resMem.data.join_date || resMem.data.joinDate
        };
      }
    } catch (e) {
      console.warn('Lỗi query members:', e);
    }

    try {
      // 3. Kéo dữ liệu từ ban_dieu_hanh nếu chưa có
      if (!profileData?.ban_dieu_hanh || profileData.ban_dieu_hanh.length === 0) {
        const resBDH = await client
          .from('ban_dieu_hanh')
          .select('chuc_vu, trang_thai, so_dien_thoai')
          .eq('mssv', cleanMssv)
          .maybeSingle();
        if (resBDH.data) {
          profileData = profileData || { mssv: cleanMssv };
          profileData.ban_dieu_hanh = [resBDH.data];
          if (!profileData.chuc_vu) profileData.chuc_vu = resBDH.data.chuc_vu;
          if (!profileData.trang_thai) profileData.trang_thai = resBDH.data.trang_thai;
        }
      }
    } catch (e) {
      console.warn('Lỗi query ban_dieu_hanh:', e);
    }
  }

  // 4. Fallback sang localStorage nếu không tìm thấy trên Supabase
  if (!profileData) {
    try {
      const localMembers = JSON.parse(localStorage.getItem('club_members')) || [];
      const foundMem = localMembers.find(m => String(m.mssv).toLowerCase() === cleanMssv.toLowerCase());
      if (foundMem) {
        profileData = {
          mssv: foundMem.mssv,
          ho_ten: foundMem.full_name || foundMem.name || foundMem.mssv,
          khoa_lop: foundMem.class_name || foundMem.class || 'K20 - CNTT',
          gioi_tinh: foundMem.gender || foundMem.gioiTinh || 'Nam',
          avatar_url: foundMem.avatar || foundMem.avatar_url,
          diem_sinh_hoat: foundMem.sinhhoat || foundMem.diem_sinh_hoat || 0,
          diem_giai_dau: foundMem.giaidau || foundMem.diem_giai_dau || 0,
          diem_hoat_dong: foundMem.hoatdong || foundMem.diem_hoat_dong || 0,
          ngay_tham_gia: foundMem.join_date || foundMem.joinDate
        };
      }
    } catch (e) { }
  }

  if (!profileData) {
    try {
      const localExecs = JSON.parse(localStorage.getItem('executive_board_data')) || [];
      const foundExec = localExecs.find(e => String(e.mssv).toLowerCase() === cleanMssv.toLowerCase());
      if (foundExec) {
        profileData = {
          mssv: foundExec.mssv,
          ho_ten: foundExec.name || foundExec.full_name || foundExec.mssv,
          khoa_lop: 'Ban điều hành',
          gioi_tinh: 'Nam',
          avatar_url: foundExec.avatar || foundExec.avatar_url,
          chuc_vu: foundExec.title || foundExec.chuc_vu || 'Ban điều hành',
          ban_dieu_hanh: [{ chuc_vu: foundExec.title || foundExec.chuc_vu || 'Ban điều hành', trang_thai: 'Đương nhiệm' }],
          diem_sinh_hoat: 15,
          diem_giai_dau: 5,
          diem_hoat_dong: 8,
          ngay_tham_gia: '15/09/2024'
        };
      }
    } catch (e) { }
  }

  return profileData;
};

window.calculateLeaderboardRank = async function (targetMssv) {
  if (!targetMssv) return '#--';
  const cleanTarget = String(targetMssv).toUpperCase().trim();

  try {
    let memberList = [];
    const client = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
    if (client) {
      const { data, error } = await client
        .from('thanh_vien')
        .select('*')
        .neq('mssv', 'admin');
      if (!error && data && data.length > 0) {
        memberList = data;
      }
    }

    if (!memberList || memberList.length === 0) {
      try {
        const cached = localStorage.getItem('club_members');
        if (cached) memberList = JSON.parse(cached) || [];
      } catch (e) { }
    }

    if (!memberList || memberList.length === 0) {
      memberList = window.mockMembers || [];
    }

    if (!memberList || memberList.length === 0) return '#--';

    const processed = memberList.map(m => {
      const sh = parseInt(m.diem_sinh_hoat ?? m.sinhhoat ?? m.buoiSinhHoat ?? m.sh) || 0;
      const gd = parseInt(m.diem_giai_dau ?? m.giaidau ?? m.giaiDau ?? m.gd) || 0;
      const hd = parseInt(m.diem_hoat_dong ?? m.hoatdong ?? m.hoatDong ?? m.hd) || 0;
      const elo = parseInt(m.elo) || 0;
      const totalPoints = elo > 0 ? elo : (sh + gd + hd);
      const mssvStr = String(m.mssv || m.id || '').toUpperCase().trim();
      return {
        mssv: mssvStr,
        totalPoints,
        gd
      };
    });

    processed.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return b.gd - a.gd;
    });

    const rIdx = processed.findIndex(item => item.mssv === cleanTarget);
    if (rIdx !== -1) {
      return `#${String(rIdx + 1).padStart(2, '0')}`;
    }
  } catch (err) {
    console.warn('Lỗi tính thứ hạng xếp hạng:', err);
  }
  return '#--';
};

window.syncProfileData = async function (data) {
  if (!data) return;
  const mssv = data.mssv || '';
  const hoTen = data.ho_ten || data.full_name || data.name || mssv || 'Chưa cập nhật';
  const khoaLop = data.khoa_lop || data.class_name || data.class || data.classInfo || 'K20 - CNTT';
  const gioiTinh = data.gioi_tinh || data.gender || data.gioiTinh || 'Nam';
  const ngaySinh = data.ngay_sinh || data.birthday || '---';
  let ngayThamGia = data.ngay_tham_gia || data.join_date || data.joinDate || '15/09/2024';
  if (ngayThamGia && !ngayThamGia.includes('/') && ngayThamGia.includes('-')) {
    const parts = ngayThamGia.split('T')[0].split('-');
    if (parts.length === 3) ngayThamGia = `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  const sh = parseInt(data.diem_sinh_hoat ?? data.sinhhoat ?? data.buoiSinhHoat) || 0;
  const gd = parseInt(data.diem_giai_dau ?? data.giaidau ?? data.giaiDau) || 0;
  const hd = parseInt(data.diem_hoat_dong ?? data.hoatdong ?? data.hoatDong) || 0;

  // Chức vụ BĐH nếu có
  let chucVu = data.chuc_vu || data.title || data.role || '';
  let trangThaiBDH = data.trang_thai || '';
  if (data.ban_dieu_hanh && data.ban_dieu_hanh.length > 0) {
    chucVu = data.ban_dieu_hanh[0].chuc_vu || chucVu;
    trangThaiBDH = data.ban_dieu_hanh[0].trang_thai || trangThaiBDH;
  }

  // Tính Bậc & Huy chương
  const isNested = typeof window !== 'undefined' && window.location && window.location.pathname.includes('/pages/');
  const basePath = isNested ? '../assets/badges/' : './assets/badges/';

  let badgeObj = null;
  if (typeof window.tinhToanDanhHieu === 'function') {
    badgeObj = window.tinhToanDanhHieu(sh, gd, hd, chucVu, trangThaiBDH);
  } else {
    let bacDiem = 1;
    if (sh >= 115 && gd >= 12 && hd >= 15) bacDiem = 6;
    else if (sh >= 100 && gd >= 10 && hd >= 12) bacDiem = 5;
    else if (sh >= 60 && gd >= 5 && hd >= 8) bacDiem = 4;
    else if (sh >= 20 && gd >= 2 && hd >= 4) bacDiem = 3;
    else if (sh >= 8 && gd >= 1 && hd >= 2) bacDiem = 2;

    let bacChucVu = 1;
    if (chucVu) {
      let cvLower = String(chucVu).toLowerCase();
      if (cvLower.includes('chủ nhiệm') && !cvLower.includes('phó')) bacChucVu = 6;
      else if (cvLower.includes('phó chủ nhiệm')) bacChucVu = 5;
      else if ((cvLower.includes('trưởng ban') || cvLower.includes('thư ký') || cvLower.includes('thu ky') || cvLower.includes('thư kí') || cvLower.includes('thu ki')) && !cvLower.includes('phó')) bacChucVu = 4;
      else if (cvLower.includes('phó ban') || cvLower.includes('phó trưởng ban') || cvLower.includes('phó')) bacChucVu = 3;
    }

    let bacCuoiCung = Math.max(bacDiem, bacChucVu);
    const danhHieuMap = {
      6: { ten: 'Thành viên nòng cốt', img: `${basePath}bac6.png` },
      5: { ten: 'Thành viên ưu tú', img: `${basePath}bac5.png` },
      4: { ten: 'Thành viên cốt cán', img: `${basePath}bac4.png` },
      3: { ten: 'Thành viên tích cực', img: `${basePath}bac3.png` },
      2: { ten: 'Hội viên', img: `${basePath}bac2.png` },
      1: { ten: 'Thành viên mới', img: `${basePath}bac1.png` }
    };
    badgeObj = danhHieuMap[bacCuoiCung] || danhHieuMap[1];
  }

  let chucVuHienThi = 'Thành viên';
  if (chucVu && chucVu.toLowerCase() !== 'thành viên' && chucVu.toLowerCase() !== 'thành viên mới') {
    chucVuHienThi = (trangThaiBDH === 'Cựu thành viên' || trangThaiBDH === 'retro') ? ('Nguyên ' + chucVu) : chucVu;
  } else if (badgeObj && badgeObj.ten) {
    chucVuHienThi = badgeObj.ten;
  }

  let avatarUrl = data.avatar_url || data.hinh_anh || data.avatar || (data.mssv ? localStorage.getItem('avatar_' + data.mssv) : '') || '';
  if (!avatarUrl || String(avatarUrl).trim() === '' || avatarUrl.includes('via.placeholder')) {
    avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(hoTen)}&background=0ea5e9&color=fff&bold=true&size=256`;
  } else if (avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'))) {
    avatarUrl = avatarUrl.includes('?') ? `${avatarUrl}&t=${Date.now()}` : `${avatarUrl}?t=${Date.now()}`;
  }

  // Tính rank chuẩn xác
  const rankStr = (typeof window.calculateLeaderboardRank === 'function')
    ? await window.calculateLeaderboardRank(mssv)
    : '#--';

  // 1. Cập nhật Modal #modal-member-detail
  const elAvatar = document.getElementById('detail-member-avatar');
  const elName = document.getElementById('detail-member-name');
  const elMssv = document.getElementById('detail-member-mssv');
  const elClass = document.getElementById('detail-member-class');
  const elGender = document.getElementById('detail-member-gender');
  const elJoinDate = document.getElementById('detail-member-joindate');
  const elRank = document.getElementById('detail-member-rank');
  const elSh = document.getElementById('detail-member-sinhhoat');
  const elGd = document.getElementById('detail-member-giaidau');
  const elHd = document.getElementById('detail-member-hoatdong');

  if (elAvatar) elAvatar.src = avatarUrl;
  if (elName) elName.textContent = hoTen;
  if (elMssv) elMssv.textContent = `MSSV: ${mssv}`;
  if (elClass) elClass.textContent = khoaLop;
  if (elGender) elGender.textContent = gioiTinh;
  if (elJoinDate) elJoinDate.textContent = ngayThamGia;
  if (elRank) elRank.textContent = rankStr;
  if (elSh) elSh.textContent = String(sh).padStart(2, '0');
  if (elGd) elGd.textContent = String(gd).padStart(2, '0');
  if (elHd) elHd.textContent = String(hd).padStart(2, '0');

  const modalBadgeImg = document.querySelector('#detail-member-badge-img') || document.querySelector('#detail-member-badge img');
  if (modalBadgeImg) {
    modalBadgeImg.src = badgeObj.img;
    modalBadgeImg.title = badgeObj.ten;
    modalBadgeImg.alt = badgeObj.ten;
  }
  const modalBadgeText = document.querySelector('#detail-member-badge-text') || document.querySelector('#detail-member-badge span') || document.querySelector('#detail-member-badge div');
  if (modalBadgeText) {
    modalBadgeText.textContent = badgeObj.ten;
  }

  // 2. Cập nhật Modal #modalHoSo & Trang hồ sơ cá nhân
  const elHsHoten = document.getElementById('hs_hoten') || document.getElementById('profile-name');
  const elHsMssv = document.getElementById('hs_mssv') || document.getElementById('profile-mssv');
  const elHsKhoa = document.getElementById('hs_khoa') || document.getElementById('hs_khoalop') || document.getElementById('profile-class');
  const elHsNgaySinh = document.getElementById('hs_ngaysinh') || document.getElementById('profile-birthday');
  const elHsGiaNhap = document.getElementById('hs_gianhap') || document.getElementById('profile-join-date');
  const elHsChucVu = document.getElementById('hs_chucvu');
  const elHsAvatar = document.getElementById('hs_avatar') || document.getElementById('profile-avatar');

  if (elHsHoten) elHsHoten.innerText = hoTen;
  if (elHsMssv) elHsMssv.innerText = mssv;
  if (elHsKhoa) elHsKhoa.innerText = khoaLop;
  if (elHsNgaySinh) elHsNgaySinh.innerText = ngaySinh;
  if (elHsGiaNhap) elHsGiaNhap.innerText = ngayThamGia;

  const elGopyHoten = document.getElementById('gopy_hoten');
  const elGopyMssv = document.getElementById('gopy_mssv');
  if (elGopyHoten) elGopyHoten.value = hoTen;
  if (elGopyMssv) elGopyMssv.value = mssv;
  if (elHsChucVu) elHsChucVu.innerText = chucVuHienThi;
  if (elHsAvatar) {
    elHsAvatar.src = avatarUrl;
    elHsAvatar.style.borderRadius = '50%';
    elHsAvatar.style.objectFit = 'cover';
  }

  const elDiemSh = document.getElementById('diemSinhHoat') || document.getElementById('stat-sinh-hoat');
  const elDiemGd = document.getElementById('diemGiaiDau') || document.getElementById('stat-giai-dau');
  const elDiemHd = document.getElementById('diemHoatDong') || document.getElementById('stat-hoat-dong');
  if (elDiemSh) elDiemSh.innerText = String(sh);
  if (elDiemGd) elDiemGd.innerText = String(gd);
  if (elDiemHd) elDiemHd.innerText = String(hd);

  const elLeaderboardRank = document.getElementById('profile-leaderboard-rank');
  if (elLeaderboardRank) elLeaderboardRank.innerText = rankStr;

  const elMembershipRankImg = document.getElementById('membership-rank');
  if (elMembershipRankImg && badgeObj && badgeObj.img) {
    elMembershipRankImg.src = badgeObj.img;
    elMembershipRankImg.title = badgeObj.ten;
  }
};

window.xemHoSo = async function (mssv) {
  if (!mssv) return;

  try {
    const profile = await window.fetchMemberFullProfile(mssv);
    if (profile) {
      await window.syncProfileData(profile);
    }

    const modal = document.getElementById('modalHoSo') || document.getElementById('modal-member-detail');
    if (modal) {
      if (typeof openModal === 'function') {
        openModal(modal.id);
      } else {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.style.display = 'flex';
      }
    }
  } catch (err) {
    console.error('Lỗi khi mở hồ sơ:', err);
  }
};

window.openProfileModal = window.xemHoSo;
window.showMemberDetail = window.xemHoSo;

async function deleteMember(mssv) {
  if (!mssv) return;

  if (confirm(`Bạn có chắc chắn muốn xóa thành viên "${mssv}" khỏi hệ thống không?`)) {
    try {
      const client = window.supabase || supabase;
      if (client) {
        await client.from('thanh_vien').delete().eq('mssv', mssv);
      }
    } catch (e) {
      console.warn("Lỗi xóa Supabase:", e);
    }

    try {
      let members = JSON.parse(localStorage.getItem('club_members') || '[]');
      members = members.filter(m => String(m.mssv).toUpperCase() !== String(mssv).toUpperCase());
      localStorage.setItem('club_members', JSON.stringify(members));
      localStorage.removeItem(`status_${mssv}`);
      localStorage.removeItem(`medal_${mssv}`);
    } catch (e) {
      console.error("Lỗi xóa localStorage:", e);
    }

    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = `🗑️ Đã xóa thành viên ${mssv} thành công!`;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    } else {
      alert(`🗑️ Đã xóa thành viên ${mssv} thành công!`);
    }

    if (typeof loadMembers === 'function') loadMembers();
  }
}

async function clearTestMembers() {
  try {
    const client = window.supabase || supabase;
    if (client) {
      await client
        .from('thanh_vien')
        .delete()
        .or('mssv.ilike.%test%,full_name.ilike.%test%,name.ilike.%test%');
    }
  } catch (err) {
    console.warn("Lỗi Supabase clear test members:", err);
  }

  try {
    let members = JSON.parse(localStorage.getItem('club_members') || '[]');
    const cleanMembers = members.filter(m => {
      const mssvStr = String(m.mssv || '').toLowerCase();
      const nameStr = String(m.full_name || m.name || '').toLowerCase();
      return !mssvStr.includes('test') && !nameStr.includes('test') && !mssvStr.startsWith('demo');
    });
    localStorage.setItem('club_members', JSON.stringify(cleanMembers));

    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.toLowerCase().includes('test') || key.startsWith('status_TEST') || key.startsWith('medal_TEST'))) {
        if (key !== 'userMssv' && key !== 'mssv') {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.error("Lỗi dọn dẹp localStorage test members:", e);
  }

  if (typeof loadMembers === 'function') loadMembers();
}

window.clearTestMembers = clearTestMembers;

// ===== Các hàm thay đổi giao diện theo phiên đăng nhập =====
async function updateUIForLoggedInUser(user) {
  if (!user) return;

  // Các ID khối giao diện thực tế
  const loginForm = document.getElementById('auth-action-buttons');
  const profileCard = document.getElementById('ho-so-section');
  const adminBtn = document.getElementById('btn-admin-portal'); // Đảm bảo nút này đã có trong HTML
  const profileMenu = document.getElementById('menu-profile');

  if (loginForm) loginForm.style.display = 'none';
  if (profileMenu) profileMenu.style.display = 'flex';

  // RÀNG BUỘC ĐIỀU KIỆN HIỂN THỊ HỒ SƠ CÁ NHÂN (FIX BỌC HIỂN THỊ TRÙNG THÁI TRANG CHỦ):
  // Không bao giờ tự động cho profileCard display: block nếu đang ở Trang chủ mà tab active không phải ho-so
  const currentPath = window.location.pathname;
  const isHoSoPage = currentPath.includes('ho-so.html');
  const pendingTab = localStorage.getItem('pendingTab');
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');

  if (profileCard) {
    if (isHoSoPage || pendingTab === 'ho-so' || tabParam === 'ho-so') {
      profileCard.style.display = 'block';
    } else {
      profileCard.style.display = 'none';
    }
  }

  localStorage.setItem('isLoggedIn', 'true');

  const mssvHienTai = user.email.split('@')[0].toLowerCase();
  localStorage.setItem('mssv', mssvHienTai);
  localStorage.setItem('userMssv', mssvHienTai);

  if (mssvHienTai === 'admin') {
    localStorage.setItem('userRole', 'admin');
  } else {
    localStorage.setItem('userRole', 'member');
  }

  // FETCH TÊN THÀNH VIÊN
  try {
    const userMssv = user.email.split('@')[0].toUpperCase(); // Ép kiểu chữ hoa
    const { data: member, error: userError } = await supabase
      .from('thanh_vien')
      .select('*')
      .eq('mssv', userMssv)
      .maybeSingle(); // Dùng maybeSingle để chặn lỗi 406

    if (userError) {
      console.warn('Lỗi lấy thông tin cá nhân:', userError);
    }

    const nameEl = document.getElementById('profile-name');
    const titleEl = document.getElementById('profile-title');
    const mssvEl = document.getElementById('profile-mssv');

    if (member) {
      localStorage.setItem('username', member.full_name);
      if (nameEl) nameEl.innerText = member.full_name;
      if (titleEl) titleEl.innerText = member.title;
    } else if (mssvHienTai === 'admin') {
      // Backup cho tài khoản admin hệ thống
      localStorage.setItem('username', 'Quản trị viên');
      if (nameEl) nameEl.innerText = 'Quản trị viên';
      if (titleEl) titleEl.innerText = 'Quản trị viên';
    } else {
      localStorage.setItem('username', mssvHienTai.toUpperCase());
      if (nameEl) nameEl.innerText = mssvHienTai.toUpperCase();
      if (titleEl) titleEl.innerText = 'Hội viên';
    }
    if (mssvEl) mssvEl.innerText = mssvHienTai.toUpperCase();

    // Tự động tải QR trong hồ sơ
    const qrImg = document.getElementById('profile-qrcode');
    if (qrImg) {
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(mssvHienTai)}`;
    }
  } catch (e) {
    console.error("Lỗi đồng bộ thông tin UI người dùng:", e);
  }

  // Rẽ nhánh dành riêng cho Admin: chuyển hướng thẳng sang trang quản trị
  if (mssvHienTai === 'admin') {
    const path = window.location.pathname;
    if (!path.includes('admin.html')) {
      window.location.href = '/pages/admin.html';
      return;
    }
  }

  // RÀNG BUỘC CHẶT CHẼ ĐIỀU HƯỚNG (ISSUE 1 FIX):
  // CHỈ tự động chuyển hướng user NẾU user đang đứng ở trang Đăng nhập (login.html)
  if (currentPath.includes('login.html')) {
    window.location.href = '/index.html';
    return;
  }
  // NẾU user đã đăng nhập và đang đứng ở các trang nội bộ khác (Trang chủ, Thành viên, Ban điều hành...),
  // BẮT BUỘC PHẢI GIỮ NGUYÊN vị trí/URL và tab hiện tại, tuyệt đối không tự động nhảy về Hồ sơ cá nhân.

  // Đóng modal đăng nhập nếu đang mở
  if (typeof closeModal === 'function') {
    closeModal('modal-login');
  }
}

function updateUIForLoggedOutUser() {
  const loginForm = document.getElementById('auth-action-buttons');
  const profileCard = document.getElementById('ho-so-section');
  const adminBtn = document.getElementById('btn-admin-portal');
  const profileMenu = document.getElementById('menu-profile');

  if (loginForm) loginForm.style.display = 'flex';
  if (profileCard) profileCard.style.display = 'none';
  if (adminBtn) adminBtn.style.display = 'none';
  if (profileMenu) profileMenu.style.display = 'none';

  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('username');
  localStorage.removeItem('mssv');
  localStorage.removeItem('userRole');

  // Trong chế độ Giao diện tĩnh: Giữ nguyên vị trí người dùng, không tự động chuyển hướng
  const path = window.location.pathname;
}

// Expose core app functions to global window scope for inline HTML handlers
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.logout = handleLogout;
window.openModal = openModal;
window.closeModal = closeModal;
window.openEditProfileModal = openEditProfileModal;
window.saveProfileInfo = saveProfileInfo;
window.openFeedbackModal = openFeedbackModal;
window.submitFeedback = submitFeedback;
window.openQRZoomModal = openQRZoomModal;
window.filterMembers = filterMembers;
window.deleteMember = deleteMember;

window.handleAvatarClick = function () {
  const input = document.getElementById('input-avatar-upload-direct');
  if (input) {
    input.click();
  } else {
    console.error('Không tìm thấy thẻ input file id="input-avatar-upload-direct"');
  }
};

// Định dạng ngày tham gia từ dạng YYYY-MM-DD sang dd/mm/yyyy
function formatDate(dateStr) {
  if (!dateStr) return 'Chưa cập nhật';
  if (dateStr.includes('/')) return dateStr;
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } catch (e) {
    console.error("Lỗi định dạng ngày:", e);
  }
  return dateStr;
}

// 1. Hàm tải dữ liệu hồ sơ cá nhân truy cập toàn cục
async function loadHoSoCaNhan() {
  const currentMSSV = localStorage.getItem('currentUserMSSV') || localStorage.getItem('userMssv') || localStorage.getItem('mssv');

  if (!currentMSSV) {
    const isNested = typeof window !== 'undefined' && window.location.pathname.includes('/pages/');
    if (window.location.pathname.includes('ho-so.html')) {
      window.location.href = isNested ? '../index.html' : './index.html';
    }
    return;
  }

  try {
    let data = null;
    let error = null;

    const resThanhVien = await supabase
      .from('thanh_vien')
      .select('*, ban_dieu_hanh(chuc_vu, trang_thai)')
      .eq('mssv', currentMSSV)
      .maybeSingle();

    data = resThanhVien.data;
    error = resThanhVien.error;

    if (error || !data) {
      const resMembers = await supabase
        .from('thanh_vien')
        .select('*')
        .eq('mssv', currentMSSV)
        .maybeSingle();

      if (resMembers.data) {
        data = resMembers.data;
        error = null;
      }
    }

    if (error && !data) throw error;
    if (!data) return;

    // Trích xuất chức vụ và tính danh hiệu theo Lõi Logic dùng chung
    let chucVuCaNhan = null;
    let trangThaiCaNhan = null;

    if (data.ban_dieu_hanh && data.ban_dieu_hanh.length > 0) {
      chucVuCaNhan = data.ban_dieu_hanh[0].chuc_vu;
      trangThaiCaNhan = data.ban_dieu_hanh[0].trang_thai;
    }

    const danhHieuCaNhan = (typeof window !== 'undefined' && typeof window.tinhToanDanhHieu === 'function')
      ? window.tinhToanDanhHieu(
        data.diem_sinh_hoat,
        data.diem_giai_dau,
        data.diem_hoat_dong,
        chucVuCaNhan,
        trangThaiCaNhan
      )
      : { ten: data.danh_hieu || data.title || 'Thành viên', img: './assets/badges/bac1.png' };

    const hoTen = data.ho_ten || data.full_name || 'Chưa cập nhật';
    const mssvVal = data.mssv || currentMSSV;
    const khoaLop = data.khoa_lop || data.class_name || '---';
    const ngaySinh = data.ngay_sinh || data.birthday || '---';
    const ngayThamGia = data.ngay_tham_gia || data.join_date || '---';

    // 3. Đổ dữ liệu ra các thẻ HTML đã gắn ID
    if (document.getElementById('hs_hoten')) document.getElementById('hs_hoten').innerText = hoTen;
    if (document.getElementById('profile-name')) document.getElementById('profile-name').innerText = hoTen;

    if (document.getElementById('hs_mssv')) document.getElementById('hs_mssv').innerText = mssvVal;
    if (document.getElementById('profile-mssv')) document.getElementById('profile-mssv').innerText = mssvVal;

    if (document.getElementById('hs_khoa')) document.getElementById('hs_khoa').innerText = khoaLop;
    if (document.getElementById('profile-class')) document.getElementById('profile-class').innerText = khoaLop;

    if (document.getElementById('hs_ngaysinh')) document.getElementById('hs_ngaysinh').innerText = ngaySinh;
    if (document.getElementById('profile-birthday')) document.getElementById('profile-birthday').innerText = ngaySinh;

    if (document.getElementById('hs_gianhap')) document.getElementById('hs_gianhap').innerText = ngayThamGia;
    if (document.getElementById('profile-join-date')) document.getElementById('profile-join-date').innerText = ngayThamGia;

    // Xử lý Avatar bo tròn với Cache Busting
    let avatarUrl = data.avatar || data.avatar_url || data.hinh_anh || localStorage.getItem('userAvatar') || localStorage.getItem('currentUserAvatar') || `https://ui-avatars.com/api/?name=${encodeURIComponent(hoTen)}&background=random&color=fff&size=200`;
    if (avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'))) {
      avatarUrl = avatarUrl.includes('?') ? `${avatarUrl}&t=${Date.now()}` : `${avatarUrl}?t=${Date.now()}`;
    }

    if (document.getElementById('hs_avatar')) {
      document.getElementById('hs_avatar').src = avatarUrl;
      document.getElementById('hs_avatar').style.borderRadius = '50%';
      document.getElementById('hs_avatar').style.objectFit = 'cover';
    }
    if (document.getElementById('profile-avatar')) {
      document.getElementById('profile-avatar').src = avatarUrl;
      document.getElementById('profile-avatar').style.borderRadius = '50%';
      document.getElementById('profile-avatar').style.objectFit = 'cover';
    }

    // Xử lý Huy chương và Danh hiệu Hồ Sơ
    const imgHuyHieuList = [
      document.getElementById('membership-rank'),
      document.getElementById('imgDanhHieuHoSo'),
      document.getElementById('hs_huychuong_img'),
      document.getElementById('user-badge-img'),
      document.querySelector('.khu-vuc-huy-hieu img')
    ];

    imgHuyHieuList.forEach(imgEl => {
      if (imgEl) {
        imgEl.src = danhHieuCaNhan.img;
        imgEl.title = danhHieuCaNhan.ten;
        imgEl.alt = danhHieuCaNhan.ten;
      }
    });

    const textHuyHieuList = [
      document.getElementById('hs_danhhieu'),
      document.getElementById('membership-rank-text'),
      document.getElementById('textDanhHieuHoSo'),
      document.querySelector('.ten-danh-hieu')
    ];

    textHuyHieuList.forEach(txtEl => {
      if (txtEl) {
        if (txtEl.id === 'hs_danhhieu') {
          txtEl.innerHTML = `<img src="${danhHieuCaNhan.img}" alt="${danhHieuCaNhan.ten}" title="${danhHieuCaNhan.ten}" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 6px;"> ${danhHieuCaNhan.ten}`;
        } else {
          txtEl.innerText = danhHieuCaNhan.ten;
        }
      }
    });

    // Xử lý Mã QR Điểm danh (Tạo tự động từ MSSV)
    if (document.getElementById('hs_qrcode')) {
      // Sử dụng API tạo QR miễn phí của qrserver (kích thước 250x250)
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${data.mssv || mssvVal}`;
      document.getElementById('hs_qrcode').src = qrApiUrl;

      // Chỉnh lại CSS một chút cho mã QR hiển thị vuông vắn, không bị méo
      document.getElementById('hs_qrcode').style.objectFit = 'contain';
      document.getElementById('hs_qrcode').style.backgroundColor = '#fff';
      document.getElementById('hs_qrcode').style.padding = '10px';
      document.getElementById('hs_qrcode').style.borderRadius = '10px';
    }
    if (document.getElementById('profile-qrcode')) {
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${data.mssv || mssvVal}`;
      document.getElementById('profile-qrcode').src = qrApiUrl;
      document.getElementById('profile-qrcode').style.objectFit = 'contain';
      document.getElementById('profile-qrcode').style.backgroundColor = '#fff';
      document.getElementById('profile-qrcode').style.padding = '10px';
      document.getElementById('profile-qrcode').style.borderRadius = '10px';
    }

    // Hiển thị 3 loại điểm ra màn hình
    if (document.getElementById('diemSinhHoat')) document.getElementById('diemSinhHoat').innerText = data.diem_sinh_hoat || 0;
    if (document.getElementById('diemGiaiDau')) document.getElementById('diemGiaiDau').innerText = data.diem_giai_dau || 0;
    if (document.getElementById('diemHoatDong')) document.getElementById('diemHoatDong').innerText = data.diem_hoat_dong || 0;

    const shEl = document.getElementById('stat-sinh-hoat');
    const gdEl = document.getElementById('stat-giai-dau');
    const hdEl = document.getElementById('stat-hoat-dong');

    const shVal = parseInt(data.diem_sinh_hoat ?? data.sinhhoat ?? data.buoiSinhHoat) || 0;
    const gdVal = parseInt(data.diem_giai_dau ?? data.giaidau ?? data.giaiDau) || 0;
    const hdVal = parseInt(data.diem_hoat_dong ?? data.hoatdong ?? data.hoatDong) || 0;

    if (shEl && !document.getElementById('diemSinhHoat')) shEl.innerText = String(shVal);
    if (gdEl && !document.getElementById('diemGiaiDau')) gdEl.innerText = String(gdVal);
    if (hdEl && !document.getElementById('diemHoatDong')) hdEl.innerText = String(hdVal);

    // Tính toán và hiển thị thứ hạng BXH (Leaderboard rank)
    try {
      const currentTargetMssv = data.mssv || mssvVal || currentMSSV;
      const rankDisplay = (typeof window.calculateLeaderboardRank === 'function')
        ? await window.calculateLeaderboardRank(currentTargetMssv)
        : '#--';

      const rankEl = document.getElementById('profile-leaderboard-rank');
      if (rankEl) rankEl.innerText = rankDisplay;

      const detailRankEl = document.getElementById('detail-member-rank');
      if (detailRankEl) detailRankEl.innerText = rankDisplay;
    } catch (rankErr) {
      console.warn('Lỗi tính thứ hạng:', rankErr);
    }

    // Xử lý Bảng thông báo chúc mừng thăng cấp Danh hiệu
    const mssvKey = data.mssv || currentMSSV;
    if (mssvKey && danhHieuCaNhan && danhHieuCaNhan.ten) {
      const oldRank = localStorage.getItem('thongBaoRank_' + mssvKey);
      const newRank = danhHieuCaNhan.ten;

      if (oldRank && oldRank !== newRank && newRank !== 'Chưa có' && newRank !== 'Thành viên mới') {
        showPopupThangCap(newRank, danhHieuCaNhan.img);
        localStorage.setItem('thongBaoRank_' + mssvKey, newRank);
      } else if (!oldRank) {
        localStorage.setItem('thongBaoRank_' + mssvKey, newRank);
      }
    }

  } catch (error) {
    console.error('Lỗi tải hồ sơ cá nhân:', error.message || error);
  }
}

// Hàm tạo hiệu ứng Pháo hoa / Confetti chúc mừng rực rỡ
function spawnConfetti() {
  const colors = ['#facc15', '#f59e0b', '#0ea5e9', '#38bdf8', '#10b981', '#ec4899', '#a855f7', '#ffffff'];
  const particleCount = 45;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti-piece';

    const size = Math.random() * 9 + 5;
    const isCircle = Math.random() > 0.5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const duration = Math.random() * 2 + 2;
    const delay = Math.random() * 0.8;

    particle.style.cssText = `
      position: fixed;
      top: -20px;
      left: ${left}vw;
      width: ${size}px;
      height: ${isCircle ? size : size * 1.5}px;
      background-color: ${color};
      border-radius: ${isCircle ? '50%' : '2px'};
      z-index: 10001;
      pointer-events: none;
      box-shadow: 0 0 10px ${color};
      animation: confettiFall ${duration}s linear ${delay}s forwards;
    `;

    document.body.appendChild(particle);

    setTimeout(() => {
      if (particle && particle.parentNode) {
        particle.remove();
      }
    }, (duration + delay + 0.5) * 1000);
  }
}

// Âm thanh chúc mừng Web Audio API
function playFanfare() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const chord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Triumphant fanfare)

    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.75);
    });
  } catch (e) {
    // Ignore audio restrictions
  }
}

// Hiển thị Bảng Chúc Mừng Thăng Cấp Danh Hiệu
export function showPopupThangCap(tenMoi, imgMoi) {
  let popup = document.getElementById('popupThangCap');
  const isNested = typeof window !== 'undefined' && window.location.pathname.includes('/pages/');
  const prefix = isNested ? '../' : './';

  if (!popup) {
    const div = document.createElement('div');
    div.id = 'popupThangCap';
    div.className = 'modal-overlay';
    div.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); z-index: 10000; align-items: center; justify-content: center; backdrop-filter: blur(8px);';
    div.onclick = dongPopupThangCap;
    div.innerHTML = `
      <div class="modal-content rank-up-modal" onclick="event.stopPropagation()" style="max-width: 480px; width: 92vw; text-align: center; position: relative; padding: 35px 25px; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%); border: 2px solid #facc15; box-shadow: 0 0 60px rgba(250, 204, 21, 0.45); border-radius: 20px; overflow: hidden; animation: popInRank 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;">
        <div style="position: absolute; top: -60px; left: 50%; transform: translateX(-50%); width: 280px; height: 280px; background: radial-gradient(circle, rgba(250,204,21,0.3) 0%, transparent 70%); pointer-events: none; border-radius: 50%;"></div>
        <h2 style="color: #facc15; font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin: 5px 0 10px; text-shadow: 0 0 18px rgba(250, 204, 21, 0.7);">
          🎉 CHÚC MỪNG THĂNG CẤP! 🎉
        </h2>
        <p style="color: #e2e8f0; font-size: 14px; margin-bottom: 20px; line-height: 1.5;">
          Xin chúc mừng bạn đã xuất sắc đạt được danh hiệu vinh danh mới trong CLB Cờ TNU - HGC!
        </p>
        <div style="position: relative; display: flex; justify-content: center; align-items: center; margin: 10px 0 20px; min-height: 230px;">
          <div style="position: absolute; width: 220px; height: 220px; background: radial-gradient(circle, rgba(250, 204, 21, 0.4) 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>
          <img id="imgDanhHieuMoi" src="${imgMoi || prefix + 'assets/badges/bac1.png'}" alt="Danh hiệu mới" style="width: 230px; height: 230px; max-width: 80vw; max-height: 230px; object-fit: contain; filter: drop-shadow(0 0 35px rgba(250, 204, 21, 0.9)); display: block; position: relative; z-index: 1; transform: scale(1.05);">
        </div>
        <div style="background: rgba(250, 204, 21, 0.12); border: 1px solid rgba(250, 204, 21, 0.35); border-radius: 12px; padding: 14px 20px; margin-bottom: 25px;">
          <span style="display: block; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Danh hiệu mới nhận</span>
          <h3 id="tenDanhHieuMoi" style="color: #facc15; font-size: 22px; font-weight: 800; margin: 4px 0 0; text-shadow: 0 0 12px rgba(250,204,21,0.6);">
            ${tenMoi || 'Thành viên mới'}
          </h3>
        </div>
        <button id="btnDongPopupThangCap" onclick="dongPopupThangCap()" style="width: 100%; padding: 15px 20px; background: linear-gradient(90deg, #facc15, #f59e0b); color: #0f172a; font-weight: 900; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 4px 25px rgba(250, 204, 21, 0.5); transition: all 0.3s ease;">
          Nhận Danh Hiệu & Tiếp Tục
        </button>
      </div>
    `;
    document.body.appendChild(div);
    popup = div;
  }

  const currentTitle = tenMoi || (document.getElementById('hs_danhhieu') ? document.getElementById('hs_danhhieu').innerText : (document.querySelector('.ten-danh-hieu') ? document.querySelector('.ten-danh-hieu').innerText : 'Thành viên cốt cán'));
  const currentBadge = imgMoi || (document.getElementById('membership-rank') ? document.getElementById('membership-rank').src : (document.getElementById('hs_huychuong_img') ? document.getElementById('hs_huychuong_img').src : prefix + 'assets/badges/bac4.png'));

  const tenEl = document.getElementById('tenDanhHieuMoi');
  const imgEl = document.getElementById('imgDanhHieuMoi');
  if (tenEl && currentTitle) tenEl.innerText = currentTitle.replace(/^[^\w\s\u00C0-\u1EF9]+/, '').trim();
  if (imgEl && currentBadge) imgEl.src = currentBadge;

  popup.classList.remove('hidden');
  popup.style.display = 'flex';
  popup.classList.add('active');

  const content = popup.querySelector('.modal-content');
  if (content) {
    content.style.display = 'block';
    content.classList.add('modal-show');
  }

  // Phát hiệu ứng âm thanh và pháo hoa rực rỡ
  playFanfare();
  spawnConfetti();
}

export function dongPopupThangCap() {
  const popup = document.getElementById('popupThangCap');
  if (popup) {
    popup.classList.add('hidden');
    popup.style.display = 'none';
    popup.classList.remove('active');
    const content = popup.querySelector('.modal-content');
    if (content) content.classList.remove('modal-show');
  }
}

window.showPopupThangCap = showPopupThangCap;
window.dongPopupThangCap = dongPopupThangCap;
window.loadHoSoCaNhan = loadHoSoCaNhan;
window.loadPersonalProfile = loadHoSoCaNhan;

// 1. Kết nối nút bấm với hộp chọn file
document.body.addEventListener('click', (e) => {
  const btnChangeAvatar = e.target.closest('#btn-change-avatar');
  if (btnChangeAvatar) {
    const hiddenInput = document.getElementById('hidden-avatar-input');
    if (hiddenInput) {
      hiddenInput.click();
    } else {
      console.error("LỖI: Không tìm thấy thẻ #hidden-avatar-input trên giao diện!");
    }
  }
});

// 2. Xử lý sự kiện khi người dùng chọn file (Cropper.js)
let cropper = null;

document.body.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'hidden-avatar-input') {
    const file = e.target.files[0];
    if (!file) return;

    // Đọc file và hiển thị lên popup cắt ảnh
    const reader = new FileReader();
    reader.onload = (event) => {
      const cropImageTarget = document.getElementById('crop-image-target');
      if (cropImageTarget) {
        cropImageTarget.src = event.target.result;
      }

      // Hiện popup
      const modal = document.getElementById('crop-modal');
      if (modal) {
        modal.classList.remove('hidden');
      }

      // Khởi tạo Cropper (Tỷ lệ 1:1 hình vuông để bo tròn)
      if (cropper) cropper.destroy();
      cropper = new Cropper(cropImageTarget, {
        aspectRatio: 1,
        viewMode: 1,
        autoCropArea: 1,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  }
});

// Xử lý nút Hủy cắt ảnh
document.body.addEventListener('click', (e) => {
  if (e.target.id === 'btn-cancel-crop') {
    const modal = document.getElementById('crop-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
  }
});

// Xử lý nút Lưu sau khi cắt
document.body.addEventListener('click', async (e) => {
  if (e.target.id === 'btn-save-crop') {
    if (!cropper) return;

    const btnSave = e.target;
    const originalText = btnSave.innerText;
    btnSave.innerText = 'Đang tải...';
    btnSave.disabled = true;

    // Lấy ảnh đã cắt dưới dạng Blob
    cropper.getCroppedCanvas({
      width: 400,
      height: 400
    }).toBlob(async (blob) => {
      try {
        const currentMSSV = localStorage.getItem('currentUserMSSV') || localStorage.getItem('userMssv') || localStorage.getItem('mssv');
        if (!currentMSSV) throw new Error('Vui lòng đăng nhập để thực hiện đổi ảnh đại diện!');
        const mssv = String(currentMSSV).trim().toUpperCase();

        // Tạo tên file
        const fileName = `${mssv}_${Date.now()}.png`;
        const filePath = `public/${fileName}`;

        // Upload lên Supabase
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, blob, { contentType: 'image/png', upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

        // 1. CẬP NHẬT URL VÀO DATABASE (Check .error trực tiếp thay vì try/catch)
        // Đồng bộ avatar toàn hệ thống (Database, LocalStorage, DOM, Re-renders, Events)
        await syncAvatarUpdateAcrossSystem(mssv, publicUrl);

        // Đóng popup crop
        const modal = document.getElementById('crop-modal');
        if (modal) {
          modal.classList.add('hidden');
        }
        cropper.destroy();
        cropper = null;

        const toast = document.getElementById('toast') || document.getElementById('admin-toast');
        if (toast) {
          toast.textContent = '✅ Đổi ảnh thành công!';
          toast.classList.add('show');
          setTimeout(() => toast.classList.remove('show'), 3500);
        } else {
          alert('✅ Đổi ảnh thành công!');
        }

      } catch (err) {
        console.error(err);
        alert('Lỗi: ' + err.message);
      } finally {
        btnSave.innerText = originalText;
        btnSave.disabled = false;
      }
    }, 'image/png');
  }
});

async function loadPublicBoard() {
  try {
    const container = document.getElementById('public-board-list');
    if (!container) return;

    const { data: rawData, error } = await supabase
      .from('ban_dieu_hanh')
      .select('mssv, chuc_vu, so_dien_thoai, trang_thai, thanh_vien(ho_ten, avatar, avatar_url, hinh_anh, khoa_lop, gioi_tinh, sdt, so_dien_thoai)');

    let boardMembers = [];
    if (!error && rawData && rawData.length > 0) {
      boardMembers = rawData.map(item => {
        const tv = item.thanh_vien || {};
        const realName = tv.ho_ten || item.ho_ten || item.full_name || item.name || item.mssv;
        const realAvt = tv.avatar || tv.avatar_url || tv.hinh_anh || item.avatar || item.avatar_url || item.hinh_anh || (item.mssv ? localStorage.getItem('avatar_' + item.mssv) : '') || '';
        const realPhone = tv.sdt || tv.so_dien_thoai || item.so_dien_thoai || item.sdt || '';
        return {
          ...item,
          ho_ten: realName,
          full_name: realName,
          title: item.chuc_vu || item.title || '',
          avatar: realAvt,
          avatar_url: realAvt,
          hinh_anh: realAvt,
          sdt: realPhone,
          so_dien_thoai: realPhone,
          is_former: item.trang_thai === 'Cựu thành viên'
        };
      });
    }

    if (boardMembers.length === 0) {
      container.innerHTML = '<p class="empty-data-msg">Chưa có dữ liệu</p>';
      return;
    }

    const activeBoard = boardMembers.filter(m => !m.is_former && m.trang_thai !== 'Cựu thành viên');
    const retroBoard = boardMembers.filter(m => m.is_former || m.trang_thai === 'Cựu thành viên');

    if (container) {
      container.innerHTML = buildExecutiveTowerHtml(activeBoard);
    }

    // Render Cựu thành viên Ban điều hành
    const retroContainer = document.getElementById('retro-management-container');
    if (retroContainer) {
      if (retroBoard.length === 0) {
        retroContainer.innerHTML = '<p class="empty-data-msg">Chưa có dữ liệu</p>';
      } else {
        retroContainer.innerHTML = `
                    <div class="glass-card no-hover member-table-container" style="padding: 0; overflow-x: auto; width: 100%; margin-top: 20px;">
                        <table class="rank-table member-table">
                            <thead>
                                <tr>
                                    <th style="text-align: left; padding: 12px 20px;">Thành viên</th>
                                    <th style="text-align: center; padding: 12px;">Khóa/Lớp</th>
                                    <th style="text-align: center; padding: 12px;">Giới tính</th>
                                    <th style="text-align: center; padding: 12px;">Danh hiệu</th>
                                    <th style="text-align: center; padding: 12px;">Chức vụ</th>
                                    <th style="text-align: center; padding: 12px;">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${retroBoard.map(m => {
          const nameStr = m.full_name || m.name || m.mssv || 'Chưa cập nhật';
          let avt = { chuCai: nameStr.charAt(0).toUpperCase(), mauNen: '#38bdf8' };
          if (typeof taoAvatarChuCai === 'function') avt = taoAvatarChuCai(nameStr);

          const classVal = m.class_name || m.class || 'Chưa cập nhật';
          const genderVal = m.gender || m.gioiTinh || 'Nam';
          const chucVuVal = m.title || m.chuc_vu || 'Cựu BĐH';

          const isNested = typeof window !== 'undefined' && window.location.pathname.includes('/pages/');
          const basePath = isNested ? '../assets/badges/' : './assets/badges/';
          const badgeSrc = window.getExecutiveBadgeSrc ? window.getExecutiveBadgeSrc(m.title) : `${basePath}bac1.png`;

          const memberMssv = m.mssv || '';
          const rawStatus = m.status || m.trang_thai || (memberMssv ? localStorage.getItem(`status_${memberMssv}`) : null) || 'Online';
          const isOnline = (String(rawStatus).toLowerCase() === 'online' || String(rawStatus).toLowerCase() === 'hoạt động' || String(rawStatus).toLowerCase() === 'active');
          const statusBadgeHtml = isOnline
            ? `<div class="flex items-center justify-center gap-2 text-green-500 text-sm font-semibold"><span class="w-2 h-2 rounded-full bg-green-500"></span><span>Online</span></div>`
            : `<div class="flex items-center justify-center gap-2 text-slate-400 text-sm font-medium"><span class="w-2 h-2 rounded-full bg-slate-500"></span><span>Offline</span></div>`;

          return `
                                        <tr style="border-bottom: 1px solid #334155; transition: all 0.3s ease; cursor: pointer;" onclick="xemHoSo('${m.mssv}')" class="cursor-pointer hover:bg-slate-700/50 transition-colors group" onmouseover="this.style.backgroundColor='rgba(255,255,255,0.05)'" onmouseout="this.style.backgroundColor=''">
                                            <td style="padding: 15px; vertical-align: middle;">
                                                <div style="display: flex; align-items: center; gap: 12px;">
                                                    <div style="width: 40px; height: 40px; border-radius: 50%; background-color: ${avt.mauNen}; color: #1e293b; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1rem;">
                                                        ${avt.chuCai}
                                                    </div>
                                                    <span style="color: #f1f5f9; font-weight: 500;">${nameStr}</span>
                                                </div>
                                            </td>
                                            <td style="padding: 15px; vertical-align: middle; color: #94a3b8; text-align: center;">${classVal}</td>
                                            <td style="padding: 15px; vertical-align: middle; color: #94a3b8; text-align: center;">${genderVal}</td>
                                            <td style="padding: 15px; text-align: center; vertical-align: middle;">
                                                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
                                                    <img src="${badgeSrc}" alt="${chucVuVal}" title="${chucVuVal}" style="width: 35px; height: 35px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); display: inline-block; vertical-align: middle;">
                                                    <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">${chucVuVal}</span>
                                                </div>
                                            </td>
                                            <td style="padding: 15px; vertical-align: middle; color: #00d2ff; font-weight: 600; text-align: center;">${chucVuVal}</td>
                                            <td style="padding: 15px; vertical-align: middle; text-align: center;">${statusBadgeHtml}</td>
                                        </tr>
                                    `;
        }).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
      }
    }

  } catch (err) {
    console.error('Lỗi tải dữ liệu Ban điều hành:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadPublicBoard);
window.loadPublicBoard = loadPublicBoard;

// ==========================================================================
// PUBLIC NEWS MODULE (Supabase Integration)
// ==========================================================================
window.loadPublicNews = async function () {
  const heroTarget = document.getElementById('news-hero-target');
  const gridTarget = document.getElementById('news-grid-target');

  if (!heroTarget && !gridTarget) return;

  if (gridTarget) {
    gridTarget.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(255,255,255,0.6); font-size: 15px;"><i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i>Đang tải dữ liệu tin tức mới nhất...</div>';
  }

  try {
    const { data: rawNewsList, error } = await supabase
      .from('tin_tuc')
      .select('*');

    if (error) throw error;

    if (heroTarget) heroTarget.innerHTML = '';
    if (gridTarget) gridTarget.innerHTML = '';

    if (!rawNewsList || rawNewsList.length === 0) {
      if (gridTarget) {
        gridTarget.innerHTML = '<div class="empty-data-msg">Chưa có dữ liệu</div>';
      }
      return;
    }

    // Sắp xếp bài mới nhất lên đầu (đăng sau/mới hơn ở trên, bài đăng trước bị đẩy xuống dưới)
    const newsList = [...rawNewsList].sort((a, b) => {
      const timeA = (a.created_at || a.ngay_dang) ? new Date(a.created_at || a.ngay_dang).getTime() : 0;
      const timeB = (b.created_at || b.ngay_dang) ? new Date(b.created_at || b.ngay_dang).getTime() : 0;
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });

    // Cache list for detail modal view
    window._publicNewsCache = newsList;

    // Feature first item as Hero if heroTarget exists
    let startIndex = 0;
    if (heroTarget && newsList.length > 0) {
      const hero = newsList[0];
      startIndex = 1;

      const title = hero.tieu_de || hero.title || 'Bài viết mới nhất';
      const content = hero.noi_dung || hero.content || hero.excerpt || '';
      const author = hero.tac_gia || hero.author || 'Ban Điều Hành';
      const image = hero.anh_bia || hero.hinh_anh || hero.image || hero.image_url || 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80';

      let dateStr = 'Mới đăng';
      const createdDate = hero.created_at || hero.ngay_dang;
      if (createdDate) {
        const d = new Date(createdDate);
        if (!isNaN(d.getTime())) {
          dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        }
      }

      heroTarget.innerHTML = `
        <div class="glass-card" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; padding: 24px; margin-bottom: 30px; border: 1px solid rgba(0, 210, 255, 0.3); border-radius: 16px;">
          <div style="width: 100%; height: 260px; overflow: hidden; border-radius: 12px; background: rgba(0,0,0,0.2);">
            <img src="${image}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; object-position: center center; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          </div>
          <div style="display: flex; flex-direction: column; justify-content: center; text-align: left;">
            <span style="display: inline-block; background: rgba(0, 210, 255, 0.15); color: #00d2ff; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 20px; width: fit-content; margin-bottom: 12px; border: 1px solid rgba(0, 210, 255, 0.3);">🔥 TIN NỔI BẬT</span>
            <h2 style="font-size: 22px; font-weight: 800; color: #fff; margin: 0 0 12px 0; line-height: 1.4; font-family: 'Outfit', sans-serif;">${title}</h2>
            <div style="font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 14px; display: flex; gap: 15px;">
              <span>✍️ ${author}</span>
              <span>📅 ${dateStr}</span>
            </div>
            <p style="font-size: 14px; color: rgba(255,255,255,0.8); line-height: 1.6; margin-bottom: 20px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${content.replace(/<[^>]*>?/gm, '')}</p>
            <button class="btn-submit" style="width: auto; padding: 10px 24px; font-weight: bold; background: #0055ff; color: #fff; cursor: pointer; border-radius: 8px;" onclick="openNewsDetailModal('${hero.id}')">Đọc tiếp →</button>
          </div>
        </div>
      `;
    }

    // Render Grid items
    if (gridTarget) {
      const gridItems = newsList.slice(startIndex);
      if (gridItems.length === 0 && startIndex === 0) {
        gridTarget.innerHTML = '<div class="empty-data-msg">Chưa có dữ liệu</div>';
        return;
      }

      gridItems.forEach(item => {
        const title = item.tieu_de || item.title || 'Bài viết chưa đặt tên';
        const content = item.noi_dung || item.content || item.excerpt || '';
        const author = item.tac_gia || item.author || 'Ban Điều Hành';
        const image = item.anh_bia || item.hinh_anh || item.image || item.image_url || 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=600&q=80';

        let dateStr = 'Mới đăng';
        const createdDate = item.created_at || item.ngay_dang;
        if (createdDate) {
          const d = new Date(createdDate);
          if (!isNaN(d.getTime())) {
            dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
          }
        }

        const card = document.createElement('div');
        card.className = 'glass-card';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.padding = '20px';
        card.style.borderRadius = '14px';
        card.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        card.style.background = 'rgba(15, 23, 42, 0.6)';

        card.innerHTML = `
          <div style="width: 100%; height: 180px; overflow: hidden; border-radius: 10px; margin-bottom: 16px; background: rgba(0,0,0,0.2);">
            <img src="${image}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; object-position: center center; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          </div>
          <h3 style="font-size: 17px; font-weight: 700; color: #fff; margin: 0 0 10px 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-family: 'Outfit', sans-serif;">${title}</h3>
          <div style="font-size: 12px; color: rgba(255,255,255,0.55); margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <span>✍️ ${author}</span>
            <span>📅 ${dateStr}</span>
          </div>
          <p style="font-size: 13px; color: rgba(255,255,255,0.75); line-height: 1.6; margin-bottom: 18px; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${content.replace(/<[^>]*>?/gm, '')}</p>
          <button class="btn-submit" style="width: 100%; padding: 10px; font-size: 13px; font-weight: bold; background: rgba(0, 210, 255, 0.15); color: #00d2ff; border: 1px solid rgba(0, 210, 255, 0.3); border-radius: 8px; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.background='#0055ff'; this.style.color='#fff';" onmouseout="this.style.background='rgba(0, 210, 255, 0.15)'; this.style.color='#00d2ff';" onclick="openNewsDetailModal('${item.id}')">Đọc tiếp →</button>
        `;
        gridTarget.appendChild(card);
      });
    }
  } catch (e) {
    console.error("Lỗi tải danh sách tin tức từ Supabase:", e);
    if (gridTarget) {
      gridTarget.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 30px;">Lỗi kết nối CSDL tin tức: ${e.message}</div>`;
    }
  }
};

window.openNewsDetailModal = function (id) {
  if (!window._publicNewsCache) return;
  const article = window._publicNewsCache.find(a => String(a.id) === String(id));
  if (!article) return;

  const titleEl = document.getElementById('news-detail-title');
  const authorEl = document.getElementById('news-detail-author');
  const dateEl = document.getElementById('news-detail-date');
  const imageEl = document.getElementById('news-detail-image');
  const bodyEl = document.getElementById('news-detail-body');

  const title = article.tieu_de || article.title || 'Chi tiết tin tức';
  const author = article.tac_gia || article.author || 'Ban Điều Hành';
  const content = article.noi_dung || article.content || '';
  const image = article.anh_bia || article.hinh_anh || article.image || article.image_url || 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80';

  let dateStr = 'Mới đăng';
  const createdDate = article.created_at || article.ngay_dang;
  if (createdDate) {
    const d = new Date(createdDate);
    if (!isNaN(d.getTime())) {
      dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }
  }

  if (titleEl) titleEl.textContent = title;
  if (authorEl) authorEl.textContent = author;
  if (dateEl) dateEl.textContent = dateStr;
  if (imageEl) {
    imageEl.src = image;
    imageEl.style.objectFit = 'cover';
    imageEl.style.objectPosition = 'center center';
  }
  if (bodyEl) bodyEl.innerHTML = content;

  if (typeof openModal === 'function') {
    openModal('modal-news-detail');
  } else {
    const modal = document.getElementById('modal-news-detail');
    if (modal) modal.style.display = 'flex';
  }
};

// ==========================================================================
// PUBLIC ABOUT INFO MODULE (Supabase gioi_thieu Integration)
// ==========================================================================
async function loadGioiThieuRaTrangChu() {
  const container = document.getElementById('noiDungGioiThieuFrontEnd') || document.getElementById('khuVucGioiThieu') || document.getElementById('about-club-content-display');
  if (!container) return; // Bỏ qua nếu không ở đúng trang

  try {
    const sbClient = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
    if (!sbClient) return;

    const { data, error } = await sbClient
      .from('gioi_thieu')
      .select('noi_dung')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Lỗi khi fetch giới thiệu:', error);
      const fallbackRes = await sbClient.from('about_info').select('noi_dung').eq('id', 1).maybeSingle();
      if (fallbackRes.data && fallbackRes.data.noi_dung) {
        container.innerHTML = fallbackRes.data.noi_dung;
      }
      return;
    }

    if (data && data.noi_dung) {
      container.innerHTML = data.noi_dung; // Bơm HTML từ database vào
    }
  } catch (err) {
    console.error('Lỗi hệ thống khi tải giới thiệu:', err);
  }
}

// Bắt buộc phải gọi hàm này khi tải trang
document.addEventListener('DOMContentLoaded', () => {
  loadGioiThieuRaTrangChu();
});

window.loadGioiThieuRaTrangChu = loadGioiThieuRaTrangChu;
window.loadGioiThieu = loadGioiThieuRaTrangChu;
window.loadAboutInfo = loadGioiThieuRaTrangChu;
// ==========================================================================
// SAFE GLOBAL CLOSE MODAL ON CANCEL / CLOSE CLICK
// ==========================================================================
document.addEventListener('click', (e) => {
  const clickedBtn = e.target.closest('button');
  if (!clickedBtn) return;

  const text = clickedBtn.textContent.trim();
  const btnId = (clickedBtn.id || '').toLowerCase();
  const btnClass = (clickedBtn.className || '').toLowerCase();

  const isCancelBtn = text.includes('Hủy') ||
    text.includes('hủy') ||
    text.includes('Đóng') ||
    text.includes('đóng') ||
    btnClass.includes('btn-close') ||
    btnId.includes('cancel') ||
    btnId.includes('close');

  if (isCancelBtn) {
    const parentModal = clickedBtn.closest('.modal-overlay') ||
      clickedBtn.closest('.fixed.inset-0') ||
      clickedBtn.closest('[id^="modal-"]') ||
      clickedBtn.closest('[id^="modal_"]');

    if (parentModal) {
      e.preventDefault();
      if (typeof closeModal === 'function') {
        closeModal(parentModal);
      } else {
        parentModal.classList.add('hidden');
        parentModal.style.display = 'none';
        const content = parentModal.querySelector('.modal-content');
        if (content) content.classList.remove('modal-show');
      }
    }
  }
});

// Safe UI Cleanup (No MutationObserver, no while loops)
function cleanUpUI() {
  document.querySelectorAll('button, .btn, .btn-submit, .btn-close, .login-btn').forEach(btn => {
    if (btn.children.length === 0) {
      let txt = btn.textContent.trim();
      txt = txt.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}➕🚪💾💬🖼️🛑⚙️📋🔐📝🔍📞🎉✕]\s*/u, '');
      if (txt) btn.innerText = txt;
    }
  });

  document.querySelectorAll('.empty-tier-msg, .empty-data-msg').forEach(el => {
    el.innerText = 'Chưa có dữ liệu';
    el.classList.add('empty-data-msg');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', cleanUpUI);
} else {
  cleanUpUI();
}

// ==========================================================================
// ĐẢM BẢO MỞ KHÓA GIAO DIỆN KHI TRANG TẢI XONG (Bất chấp các lỗi logic phía trên)
// ==========================================================================
window.addEventListener('load', function () {
  // 1. Tìm và tiêu diệt tất cả các loại màn hình Loading đang chặn click
  const danhSachLoading = document.querySelectorAll('#loading, .loading, #preloader, .preloader, #loadingOverlay, .loading-overlay');
  danhSachLoading.forEach(loader => {
    loader.style.display = 'none';
    loader.style.opacity = '0';
    loader.style.pointerEvents = 'none';
    loader.style.zIndex = '-1';
  });

  // 2. Gỡ bỏ phong ấn chặn click trên thẻ body (nếu có)
  document.body.style.pointerEvents = 'auto';
  document.documentElement.style.pointerEvents = 'auto';
});

// THÊM MỘT LỚP PHÒNG THỦ: Mở khóa ngay lập tức sau 3 giây phòng trường hợp sự kiện 'load' bị kẹt
setTimeout(() => {
  document.body.style.pointerEvents = 'auto';
  document.documentElement.style.pointerEvents = 'auto';
  const emergencyLoaders = document.querySelectorAll('#loading, .loading, #preloader, .preloader, #loadingOverlay, .loading-overlay');
  emergencyLoaders.forEach(el => {
    el.style.display = 'none';
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
  });
}, 3000);

// Đánh thức hàm tải danh sách chạy ngay khi mở trang
document.addEventListener('DOMContentLoaded', () => {
  if (typeof loadDanhSachThanhVien === 'function') {
    loadDanhSachThanhVien();
  }
});




