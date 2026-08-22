import { createClient } from '@supabase/supabase-js';
import { supabase } from '../core/supabaseClient.js';

// Khai báo biến toàn cục chống lỗi hoisting (Cannot access before initialization)
var quillEditor = null;
window.quillEditor = null;
var newsQuillEditor = null;
window.newsQuillEditor = null;
var executiveBoard = [];
window.executiveBoard = executiveBoard;

window.loadAdminMembers = async function() {
    try {
        const { data, error } = await supabase.from('thanh_vien').select('*');
        if (error) throw error;
        console.log('Đã tải thành viên thành công:', data);
    } catch (err) {
        console.log('Lỗi loadAdminMembers:', err);
    }
};

window.loadAdminManagementTeam = async function() {
    try {
        const { data, error } = await supabase.from('ban_dieu_hanh').select('*');
        if (error) throw error;
        console.log('Tải Ban Điều Hành thành công:', data);
    } catch (err) {
        console.error('Lỗi khi tải BĐH:', err);
    }
};

// Hệ thống Toast Notification nội bộ sử dụng Tailwind CSS
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
    const cleanMsg = msgStr.replace(/^[✅⚠️❌🎉🏆🥇🥈🥉🏅🔰💎👉🗑️\s]*/, '');
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
window.showAdminToast = function(msg, isErr) {
    showToast(msg, isErr ? 'error' : 'success');
};

// Ghi đè alert mặc định trình duyệt bằng Tailwind Toast Notification
window.alert = function(msg) {
    if (!msg) return;
    const msgStr = String(msg);
    const isError = msgStr.includes('❌') || msgStr.includes('⚠️') || msgStr.includes('Lỗi') || msgStr.includes('lỗi') || msgStr.includes('Sai') || msgStr.includes('TỪ CHỐI');
    showToast(msgStr, isError ? 'error' : 'success');
};

// Custom Confirm Modal System
let confirmCallback = null;

window.showConfirmModal = function(message, callback) {
    const modal = document.getElementById('confirmModal');
    const msgEl = document.getElementById('confirmMessage');
    if (!modal) {
        if (window.confirm(message)) {
            if (typeof callback === 'function') callback();
        }
        return;
    }

    if (msgEl) msgEl.innerText = message;
    confirmCallback = callback;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.display = 'flex';
};

window.closeConfirmModal = function() {
    const modal = document.getElementById('confirmModal');
    if (!modal) return;

    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.style.display = 'none';
    confirmCallback = null;
};

window.closeCustomConfirmModal = window.closeConfirmModal;

document.addEventListener('DOMContentLoaded', () => {
    const btnCancel = document.getElementById('btnCancelConfirm');
    const btnAccept = document.getElementById('btnAcceptConfirm');

    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            window.closeConfirmModal();
        });
    }

    if (btnAccept) {
        btnAccept.addEventListener('click', () => {
            if (typeof confirmCallback === 'function') {
                confirmCallback();
            }
            window.closeConfirmModal();
        });
    }
});

// Khai báo state toàn cục ở trên cùng để chống sập giao diện ReferenceError
var executiveBoard = [];

window.editMedal = function(mssv) {
    console.log('Chưa code chức năng chỉnh sửa huy chương:', mssv);
    showToast('⚠️ Chức năng sửa huy chương đang được phát triển!', 'warning');
};

const saveActivityChange = function() {
    console.log("Tính năng lưu hoạt động đang được bảo trì...");
    showToast("Tính năng này đang được cập nhật!", "warning");
};
window.saveActivityChange = saveActivityChange;

let isDashboardInitialized = false;


function initAdminDashboard() {
    if (isDashboardInitialized) return;
    isDashboardInitialized = true;
    
    // Khởi tạo state và render Ban điều hành
    initExecutiveBoardState();
    renderExecutiveBoard();

    // Đồng bộ danh sách Ban điều hành và Tự động xét duyệt danh hiệu ngay khi tải trang
    saveBDHMssvsToLocalStorage();
    autoReviewMemberRanks();

    // Khởi tạo trình soạn thảo Giới thiệu
    initQuillEditor();

    // Nạp danh sách thành viên động kèm Rank
    loadAdminMembers();
    loadAdminNews();
    window.loadAdminManagementTeam();
    loadAdminActivities();
    updateAdminStats();
    if (typeof loadAdminBoard === 'function') {
        loadAdminBoard();
    }
    if (typeof window.loadDanhSachBanDieuHanh === 'function') {
        window.loadDanhSachBanDieuHanh();
    }
}

// Trong Chế độ Giao diện tĩnh: Tắt rào cản đăng nhập, cho phép truy cập trực tiếp Admin Dashboard
function checkAdminSessionState() {
    const loginSection = document.getElementById('admin-login-section');
    const dashboardSection = document.getElementById('admin-dashboard-section');

    if (loginSection) loginSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initAdminDashboard();
        });
    } else {
        initAdminDashboard();
    }
}

// A. KHI BẤM NơT ĐẤNG XUẤT ADMIN: Cắt liên lạc và đã thẳng ra trang chủ index.html
async function adminLogout(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  const isNested = window.location.pathname.includes('/pages/');
  const targetPage = isNested ? '../index.html' : 'index.html';

  try {
    if (typeof supabase !== 'undefined' && supabase && supabase.auth) {
      await supabase.auth.signOut();
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace(targetPage); // QUAN TRỌNG: Chỉ định thẳng ra index.html
  } catch (error) {
    console.error('Lỗi khi đãng xuất admin:', error);
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace(targetPage);
  }
}

window.adminLogout = adminLogout;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnDangXuatAdmin')?.addEventListener('click', adminLogout);
});

// B. LỚP PHÒNG THỦ: Nếu phát hiện mất phiên đăng nhập (session), cũng đuổi thẳng ra trang chủ
try {
  checkAdminSessionState();
  if (typeof supabase !== 'undefined' && supabase && supabase.auth) {
    supabase.auth.onAuthStateChange((event, session) => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      if (!session && !isLoggedIn) {
        const trangHienTai = window.location.pathname;
        if (!trangHienTai.endsWith('index.html') && !trangHienTai.endsWith('/') && trangHienTai !== '') {
          const isNested = trangHienTai.includes('/pages/');
          window.location.replace(isNested ? '../index.html' : 'index.html');
        }
      } else {
        localStorage.setItem('isLoggedIn', 'true');
        checkAdminSessionState();
      }
    });
  }
} catch (e) {
  console.warn("Lỗi kiểm tra session admin:", e);
}

// BƯơC 1: Khai báo biến tạm lưu MSSV nhân sự đang được click chọn
let mssvDangChon = null;
window.mssvDangChon = mssvDangChon;

// 1. HÀM TẢI VÀ HIỂN THỊ danh sách BAN ĐIỀU HÀNH (BƯỚC 3: TÁCH 2 NHÓM)
window.loadDanhSachBanDieuHanh = async function() {
  try {
    const { data, error } = await supabase.from('ban_dieu_hanh').select('*');
    if (error) throw error;

    // Trỏ tới các khu vực HTML
    const k1 = document.getElementById('khuVucChuNhiem');
    const k2 = document.getElementById('khuVucPhoChuNhiem');
    const k3 = document.getElementById('khuVucTruongBan');
    const kCuu = document.getElementById('khuVucCuuBDH');

    // Xóa trắng để chuẩn bị vẽ lại
    if (k1) k1.innerHTML = '';
    if (k2) k2.innerHTML = '';
    if (k3) k3.innerHTML = '';
    if (kCuu) kCuu.innerHTML = '';

    if (data && data.length > 0) {
      // Phân tích làm 2 nhóm theo yêu cầu Bước 3:
      // Nhóm 1: trang_thai !== 'Cựu thành viên' (Đương nhiệm) -> Cấu trúc tầng 1, 2, 3
      // Nhóm 2: trang_thai === 'Cựu thành viên' -> Khu vực Cựu thành viên
      const duongNhiemList = data.filter(item => item.trang_thai !== 'Cựu thành viên');
      const cuuList = data.filter(item => item.trang_thai === 'Cựu thành viên');

      // Helper vẽ thẻ nhân sự và gán sự kiện click (BƯỚC 1)
      const taoTheNhanSu = (item, defaultBorderColor = '#38bdf8') => {
        const ten = item.thanh_vien?.ho_ten || item.ho_ten || item.full_name || item.name || item.mssv;
        const phoneVal = item.thanh_vien?.sdt || item.so_dien_thoai || '';
        const div = document.createElement('div');
        div.className = 'the-nhan-su';
        div.style.cssText = `background: rgba(255,255,255,0.05); padding: 12px; margin-bottom: 8px; border-radius: 6px; border-left: 4px solid ${defaultBorderColor}; display: flex; justify-content: space-between; align-items: center; width: 100%; box-sizing: border-box; cursor: pointer; transition: all 0.2s ease;`;

        div.innerHTML = `
          <div>
            <div style="font-weight: bold; color: #f1f5f9; font-size: 1.05rem;">${ten}</div>
            <div style="color: ${defaultBorderColor}; font-size: 0.9rem;">${item.chuc_vu || ''}</div>
            ${phoneVal ? `<div style="color: #94a3b8; font-size: 0.8rem; margin-top: 4px;"><i class="fa-solid fa-phone mr-1"></i>SĐT: ${phoneVal}</div>` : ''}
          </div>
        `;

        // BƯỚC 1: Sự kiện onclick chọn nhân sự
        div.onclick = () => {
          mssvDangChon = item.mssv;
          window.mssvDangChon = mssvDangChon;

          // Đổi hiệu ứng UI để báo hiệu đã chọn (Tailwind ring-2 ring-red-500)
          document.querySelectorAll('.the-nhan-su').forEach(el => {
            el.classList.remove('ring-2', 'ring-red-500');
            el.style.outline = 'none';
            el.style.boxShadow = 'none';
          });
          div.classList.add('ring-2', 'ring-red-500');
          div.style.outline = '2px solid #ef4444';
          div.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.5)';

          // Cập nhật text hướng dẫn
          const txtHuongDan = document.querySelector('#txtHuongDanThaoTac') || document.querySelector('#selected-executive-name');
          if (txtHuongDan) {
            txtHuongDan.innerHTML = `👉 <strong>Đang chọn:</strong> <span style="color: #ef4444; font-weight: bold;">${ten}</span> (${item.mssv})`;
          }

          // Kích hoạt nút Về hưu
          const btnVeHuu = document.querySelector('#btnVeHuu') || document.querySelector('#btn-quick-retire');
          if (btnVeHuu) {
            btnVeHuu.disabled = false;
            btnVeHuu.classList.remove('opacity-50', 'cursor-not-allowed');
            btnVeHuu.style.opacity = '1';
            btnVeHuu.style.cursor = 'pointer';
          }
        };

        return div;
      };

      // In Nhóm 1: Đương nhiệm vào các tầng 1, 2, 3
      duongNhiemList.forEach(item => {
        const cv = (item.chuc_vu || '').toLowerCase();
        if (cv === 'chủ nhiệm' || (cv.includes('chủ nhiệm') && !cv.includes('phó'))) {
          if (k1) k1.appendChild(taoTheNhanSu(item, '#ffd700'));
        } else if (cv.includes('phó chủ nhiệm')) {
          if (k2) k2.appendChild(taoTheNhanSu(item, '#cbd5e1'));
        } else {
          if (k3) k3.appendChild(taoTheNhanSu(item, '#ef4444'));
        }
      });

      // In Nhóm 2: Cựu thành viên vào khu vực bên dưới
      cuuList.forEach(item => {
        if (kCuu) kCuu.appendChild(taoTheNhanSu(item, '#64748b'));
      });
    }

    // Nếu trống thà hiện chữ "Chưa cà dữ liệu"
    const textTrong = '<div style="color: gray; font-style: italic;">Chưa có dữ liệu</div>';
    if (k1 && k1.innerHTML.trim() === '') k1.innerHTML = textTrong;
    if (k2 && k2.innerHTML.trim() === '') k2.innerHTML = textTrong;
    if (k3 && k3.innerHTML.trim() === '') k3.innerHTML = textTrong;
    if (kCuu && kCuu.innerHTML.trim() === '') kCuu.innerHTML = textTrong;

  } catch (error) {
    console.error('Lỗi tải danh sách BĐH:', error);
  }
};

// BƯỚC 2: Xử lý sự kiện click của nút 'Về hưu'
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('khuVucChuNhiem')) {
    window.loadDanhSachBanDieuHanh();
  }

  const btnVeHuu = document.querySelector('#btnVeHuu') || document.querySelector('#btn-quick-retire');
  if (btnVeHuu) {
    btnVeHuu.addEventListener('click', () => {
      if (!mssvDangChon) {
        showToast('Chủ nhiệm vui lòng click chọn 1 nhân sự ở danh sách bên trái trước!', 'warning');
        return;
      }

      showConfirmModal('Bạn có chắc chắn muốn cho thành viên này về hưu không?', async () => {
        try {
          // Cập nhật trạng thái trên Supabase
          const { error } = await supabase
            .from('ban_dieu_hanh')
            .update({ trang_thai: 'Cựu thành viên' })
            .eq('mssv', mssvDangChon);

          if (error) throw error;

          // Đồng bổ cập nhật bảng thanh_vien nếu cà
          try {
            await supabase
              .from('thanh_vien')
              .update({ status: 'former', is_former: true })
              .eq('mssv', mssvDangChon);
          } catch (e) {}

          showToast('Đã chuyển nhân sự sang danh sách Cựu thành viên thành công!', 'success');

          // Reset lại UI hướng dẫn và và hiệu hóa nàt
          mssvDangChon = null;
          const txtHuongDan = document.querySelector('#txtHuongDanThaoTac') || document.querySelector('#selected-executive-name');
          if (txtHuongDan) {
            txtHuongDan.innerHTML = '👉 <em>Vui lòng click chọn 1 thẻ nhân sự bên trái...</em>';
          }
          btnVeHuu.disabled = true;
          btnVeHuu.classList.add('opacity-50', 'cursor-not-allowed');

          if (typeof window.loadDanhSachBanDieuHanh === 'function') window.loadDanhSachBanDieuHanh();
          if (typeof window.loadBdhTrangChu === 'function') window.loadBdhTrangChu();
          if (typeof window.loadPublicBoard === 'function') window.loadPublicBoard();
        } catch (err) {
          console.error('Lỗi khi về hưu:', err);
          showToast('Có lỗi xảy ra, vui lòng thử lại!', 'error');
        }
      }, 'Xác Nhận Cho Về Hưu');
    });
  }
});

// 2. CẬP NHẬT LẠI SỰ KIỆN NÚT "THÊM VÀO BAN ĐIỀU HÀNH" (LOGIC UPSERT TỰ ĐỘNG)
async function handleAddBDH(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const mssvEl = document.querySelector('#inputMssvBDH') || document.querySelector('#add-bdh-mssv') || document.querySelector('#inputMSSV');
  const chucVuEl = document.querySelector('#inputChucVuBDH') || document.querySelector('#selectChucVuBDH') || document.querySelector('#add-bdh-role') || document.querySelector('#inputChucVu');
  const sdtEl = document.querySelector('#inputSdtBDH') || document.querySelector('#add-bdh-phone') || document.querySelector('#inputSDT');
  const btnSubmit = document.querySelector('#btnThemBDH') || document.querySelector('#btn-add-management') || document.querySelector('#btnThemNhanSu');

  const mssvInput = mssvEl?.value.trim();
  const chucVuInput = chucVuEl?.value.trim();
  const sdtInput = sdtEl?.value.trim() || '';

  if (!mssvInput || !chucVuInput) {
    alert('Vui lòng nhập đủ MSSV và Chức vụ!');
    return;
  }

  const btnElement = btnSubmit || (e && e.target ? e.target : null);
  const originalText = btnElement ? btnElement.innerText : 'Thêm Vào Ban Điều Hành';
  if (btnElement) {
    btnElement.innerText = 'Đang xử lý...';
    btnElement.disabled = true;
  }

  try {
    // BƯơC 1: Dống "radar" quét xem MSSV này đã từng cà mặt trong BĐH chưa
    const { data: nguoicu, error: loiTimKiem } = await supabase
      .from('ban_dieu_hanh')
      .select('mssv')
      .eq('mssv', mssvInput)
      .maybeSingle();

    if (nguoicu) {
      // BƯỚC 2A: TÌM THẤY NGƯỜI CŨ -> Phục chức, cập nhật chức vụ mới và SĐT mới
      const { error: loiCapNhat } = await supabase
        .from('ban_dieu_hanh')
        .update({ 
          chuc_vu: chucVuInput, 
          so_dien_thoai: sdtInput, 
          trang_thai: 'Đương nhiệm' 
        })
        .eq('mssv', mssvInput);

      if (loiCapNhat) throw loiCapNhat;
      alert('Triệu hồi Cựu thành viên thành công! Đã cấp phát chức vụ mới.');

    } else {
      // BƯỚC 2B: LỆNH MỚI HOÀN TOÀN -> Thêm mới tinh vào kho
      const { error: loiThemMoi } = await supabase
        .from('ban_dieu_hanh')
        .insert([{ 
          mssv: mssvInput, 
          chuc_vu: chucVuInput, 
          so_dien_thoai: sdtInput, 
          trang_thai: 'Đương nhiệm' 
        }]);

      if (loiThemMoi) throw loiThemMoi;
      alert('Thêm nhân sự mới vào Ban điều hành thành công!');
    }

    // BƯơC 3: Vẽ lại bảng dữ liệu trên web cho mới và xóa trắng form
    if (mssvEl) mssvEl.value = '';
    if (chucVuEl) chucVuEl.value = '';
    if (sdtEl) sdtEl.value = '';

    if (typeof window.loadDanhSachBanDieuHanh === 'function') {
      window.loadDanhSachBanDieuHanh();
    }
    if (typeof window.loadBdhTrangChu === 'function') {
      window.loadBdhTrangChu();
    }
    if (typeof window.loadPublicBoard === 'function') {
      window.loadPublicBoard();
    }

  } catch (err) {
    console.error('Lỗi thao tác:', err);
    alert('Có lỗi xảy ra: ' + (err.message || err));
  } finally {
    if (btnElement) {
      btnElement.innerText = originalText;
      btnElement.disabled = false;
    }
  }
}

window.handleAddBDH = handleAddBDH;
window.submitAdminNewBDH = handleAddBDH;

document.addEventListener('DOMContentLoaded', () => {
  const btnBDH = document.querySelector('#btnThemBDH') || document.querySelector('#btn-add-management') || document.querySelector('#btnThemNhanSu');
  btnBDH?.addEventListener('click', handleAddBDH);
});

// ===== HUY HIỆU 6 BẬC: Hàm lấy đường dẫn ảnh chuẩn =====
function getBadgeSrc(totalPoints) {
  const isNested = window.location.pathname.includes('/pages/');
  const prefix = isNested ? '../' : './';
  if (totalPoints >= 100) return prefix + 'assets/badges/bac6.png';
  if (totalPoints >= 70)  return prefix + 'assets/badges/bac5.png';
  if (totalPoints >= 50)  return prefix + 'assets/badges/bac4.png';
  if (totalPoints >= 30)  return prefix + 'assets/badges/bac3.png';
  if (totalPoints >= 10)  return prefix + 'assets/badges/bac2.png';
  return prefix + 'assets/badges/bac1.png';
}

function getBadgeTitle(totalPoints) {
  if (totalPoints >= 100) return 'Nống cốt';
  if (totalPoints >= 70)  return 'Ưu tú';
  if (totalPoints >= 50)  return 'Cốt càn';
  if (totalPoints >= 30)  return 'Tích cực';
  if (totalPoints >= 10)  return 'Hội viên';
  return 'Tành viên mới';
}

function getBadgeSrcByTitle(rankName) {
  const isNested = window.location.pathname.includes('/pages/');
  const prefix = isNested ? '../' : './';
  let badgeFileName = 'bac1';
  const name = (rankName || '').trim().toLowerCase();
  if (name.includes('nàng cốt') || name.includes('nong cot') || name.includes('chiến thần') || name.includes('cao thủ')) {
    badgeFileName = 'bac6';
  } else if (name.includes('ưu tú') || name.includes('uu tu')) {
    badgeFileName = 'bac5';
  } else if (name.includes('cốt càn') || name.includes('cot can')) {
    badgeFileName = 'bac4';
  } else if (name.includes('tích cực') || name.includes('tich cuc')) {
    badgeFileName = 'bac3';
  } else if (name.includes('hội viên') || name.includes('hoi vien')) {
    badgeFileName = 'bac2';
  } else {
    badgeFileName = 'bac1';
  }
  return `${prefix}assets/badges/${badgeFileName}.png`;
}

// Global state variables
let currentAdminEditCard = null;
let html5QrcodeScanner = null;

function initExecutiveBoardState() {
  const saved = localStorage.getItem('executive_board_data');
  if (saved) {
    executiveBoard = JSON.parse(saved);
  } else {
    executiveBoard = [];
    localStorage.setItem('executive_board_data', JSON.stringify(executiveBoard));
  }
}

function renderExecutiveBoard() {
  const t1Container = document.getElementById('admin-tier-1');
  const t2Container = document.getElementById('admin-tier-2');
  const t3Container = document.getElementById('admin-tier-3');
  
  if (!t1Container || !t2Container || !t3Container) return;
  
  t1Container.innerHTML = '';
  t2Container.innerHTML = '';
  t3Container.innerHTML = '';
  
  if (executiveBoard.length === 0) {
    // Mảng rỗng: giữ thông báo tĩnh trong HTML (#admin-bdh-empty-notice), không inject thêm
    return;
  }

  // Có dữ liệu: ẩn div thàng báo tĩnh để không hiện cả 2 công làc
  const adminEmptyNotice = document.getElementById('admin-bdh-empty-notice');
  if (adminEmptyNotice) adminEmptyNotice.style.display = 'none';
  
  executiveBoard.forEach(member => {
    const card = document.createElement('div');
    card.className = 'glass-card';
    card.style.display = 'flex';
    card.style.alignItems = 'center';
    card.style.justifyContent = 'space-between';
    card.style.padding = '12px 20px';
    card.style.margin = '0';
    card.style.background = 'rgba(255,255,255,0.02)';
    card.setAttribute('data-rank', member.rank);
    card.setAttribute('data-phone', member.phone);
    card.setAttribute('data-mssv', member.mssv);
    
    const tier = member.tier || member.level || 3;
    
    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 15px;">
        <img src="${member.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + member.name}" style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.1);">
        <div>
          <h4 style="margin:0; color:#fff;">${member.name}</h4>
          <p style="margin:2px 0 0; font-size:12px; color:rgba(255,255,255,0.6);">
            <span class="card-role">${member.role}</span> 
            <span class="card-rank" style="color: #64ffda; font-weight: bold; margin-left: 5px;">(${member.rank})</span> 
            <span class="card-phone" style="display: block; color: rgba(255,255,255,0.4); font-size: 11px;">SĐT: ${member.phone}</span>
          </p>
        </div>
      </div>
      <button class="btn-edit-admin" onclick="openAdminEditMember(this, ${tier})">Điều chỉnh</button>
    `;
    
    if (parseInt(tier) === 1) {
      t1Container.appendChild(card);
    } else if (parseInt(tier) === 2) {
      t2Container.appendChild(card);
    } else {
      t3Container.appendChild(card);
    }
  });
}

// Lưu danh sách MSSV Ban điều hành vào localStorage để đồng bộ
function saveBDHMssvsToLocalStorage() {
  const bdhMssvs = Array.from(document.querySelectorAll('#admin-bdh-list [data-mssv]')).map(el => el.getAttribute('data-mssv')).filter(Boolean);
  localStorage.setItem('executive_board_mssvs', JSON.stringify(bdhMssvs));
}

// Logic Backend tự động xét duyệt và nàng cấp Danh hiệu (cron job/trigger tự động)
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
      const sh = parseInt(member.sinhhoat) || 0;
      const gd = parseInt(member.giaidau) || 0;
      const hd = parseInt(member.hoatdong) || 0;

      // 1. Điều kiện thăng cấp tiêu chuẩn (cần đạt ĐỦ các chỉ số của mỗi bậc)
      let standardRank = 'Tành viên mới';
      if (sh >= 115 && gd >= 12 && hd >= 15) {
        standardRank = 'Nống cốt';
      } else if (sh >= 100 && gd >= 10 && hd >= 12) {
        standardRank = 'Ưu tú';
      } else if (sh >= 60 && gd >= 5 && hd >= 8) {
        standardRank = 'Cốt càn';
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
          'Tành viên mới': 1,
          'Hội viên': 2,
          'Tích cực': 3,
          'Cốt càn': 4,
          'Ưu tú': 5,
          'Nống cốt': 6
        };
        const standardLevel = rankLevels[standardRank] || 1;
        if (standardLevel < 4) {
          // Bắt buộc nâng tối thiểu lên Bậc 4 (Cốt cán) bất chấp hoạt động
          finalRank = 'Cốt càn';
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

// Module Quản là Giới thiệu (CMS Module)
async function initQuillEditor() {
  if (!document.getElementById('about-quill-editor')) return;

  if (!quillEditor) {
    quillEditor = new Quill('#about-quill-editor', {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'color': [] }, { 'background': [] }],
          ['link', 'image'],
          ['clean']
        ]
      },
      placeholder: 'Nhập nội dung giới thiệu CLB tại đây...'
    });
    window.quillEditor = quillEditor;

    const previewContentEl = document.getElementById('about-live-preview-content');
    quillEditor.on('text-change', () => {
      if (previewContentEl) {
        previewContentEl.innerHTML = quillEditor.root.innerHTML;
      }
    });
  }

  // 1. Khởi tạo dữ liệu khi mở trang từ CSDL Supabase (bảng gioi_thieu)
  try {
    const sbClient = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
    let savedContent = '';

    if (sbClient) {
      // Truy vấn lấy nội dung từ bảng 'gioi_thieu' theo yêu cầu
      try {
        const { data: gData, error: gErr } = await sbClient
          .from('gioi_thieu')
          .select('noi_dung')
          .eq('id', 1)
          .maybeSingle();

        if (!gErr && gData && gData.noi_dung) {
          savedContent = gData.noi_dung;
        }
      } catch (err) {
        console.warn("Cảnh báo truy vấn CSDL gioi_thieu:", err);
      }

      // Fallback ốọc từ bảng 'about_info' nếu bảng 'gioi_thieu' chưa cà dữ liệu
      if (!savedContent) {
        try {
          const { data: aData } = await sbClient
            .from('about_info')
            .select('noi_dung')
            .eq('id', 1)
            .maybeSingle();

          if (aData && aData.noi_dung) {
            savedContent = aData.noi_dung;
          }
        } catch (err) {
          console.warn("Cảnh báo truy vấn CSDL about_info:", err);
        }
      }
    }

    if (!savedContent) {
      savedContent = localStorage.getItem('about_club_content') || `
        <p id="about-intro" style="font-size: 20px; line-height: 1.8;">Được thành lập với sứ mệnh tạo ra một sân chơi trí tuệ lành mạnh, <strong>TNU-HGC Chess Club</strong> là nơi quy tụ những sinh viên đam mê bộ môn cờ vua và cờ tướng tại Phân hiệu Đại học Thái Nguyên tại tỉnh Hà Giang.</p>
        <br>
        <p style="font-size: 18px; line-height: 1.8;"><strong style="color:#00d2ff;">🎯 Tầm nhìn:</strong> <span id="about-vision">Trở thành câu lạc bộ cờ phong trào mạnh nhất khu vực, thường xuyên tổ chức các giải đấu chuyên nghiệp.</span></p>
        <br>
        <p style="font-size: 18px; line-height: 1.8;"><strong style="color:#00d2ff;">💎 Giá trị cốt lõi:</strong> <span id="about-values">Trí tuệ • Kỷ luật • Tôn trọng • Kết nối.</span></p>
        <br>
        <p style="font-size: 18px; line-height: 1.8;"><strong style="color:#00d2ff;">📍 Địa chỉ:</strong> <span id="about-address">Phân hiệu Đại học Thái Nguyên tại tỉnh Hà Giang, Phường Quang Trung, TP. Hà Giang.</span></p>
        <p style="font-size: 18px; line-height: 1.8;"><strong style="color:#00d2ff;">✉️ Email:</strong> <span id="about-email">clbcotnuhgc@gmail.com</span></p>
      `;
    }

    quillEditor.clipboard.dangerouslyPasteHTML(savedContent);
    const previewContentEl = document.getElementById('about-live-preview-content');
    if (previewContentEl) previewContentEl.innerHTML = savedContent;

  } catch (e) {
    console.error("Lỗi nạp nội dung giới thiệu:", e);
  }
}

async function saveAboutClubContent(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  console.log('Đã bấm nàt Cập nhật trang Giới thiệu - Bắt ốầu xử lý...');

  // 1. Lấy mã HTML chuẩn xác từ Quill.js instance (quillEditor.root.innerHTML) hoặc DOM editor
  let contentHTML = '';
  if (quillEditor && quillEditor.root && typeof quillEditor.root.innerHTML === 'string') {
    contentHTML = quillEditor.root.innerHTML;
  } else if (window.quillEditor && window.quillEditor.root && typeof window.quillEditor.root.innerHTML === 'string') {
    contentHTML = window.quillEditor.root.innerHTML;
  } else {
    const editorEl = document.querySelector('#about-quill-editor .ql-editor');
    if (editorEl) contentHTML = editorEl.innerHTML;
  }

  // Debug log kiểm tra dữ liệu thực tế
  console.log('Nội dung HTML lấy được:', contentHTML);

  // Bảo vệ CSDL khỏi ảnh dạng Base64 dán trực tiếp
  if (contentHTML.includes('data:image/') || contentHTML.includes('base64,')) {
    console.warn('⚠️ Phít hiện ảnh dạng Base64 dẫn trực tiếp trong văn bản');
    alert('⚠️ Phát hiện ảnh dạng Base64 dán trực tiếp!\nVui lòng không dán trực tiếp ảnh vào văn bản để tránh làm quá tải CSDL Supabase.');
    return;
  }

  if (!contentHTML || contentHTML.trim() === '' || contentHTML.trim() === '<p><br></p>') {
    console.error('Lỗi: Nội dung HTML bị rỗng/không hợp lệ:', contentHTML);
    alert('⚠️ Vui lòng nhập nội dung giới thiệu trước khi bấm cập nhật!');
    return;
  }

  const btnUpdate = document.getElementById('btnUpdateGioiThieu');
  if (btnUpdate) {
    btnUpdate.disabled = true;
    btnUpdate.textContent = 'Đang lưu...';
  }

  try {
    const sbClient = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
    let success = false;

    if (sbClient) {
      // 2. Gửi chuỗi Update mã HTML thực tế làn Supabase bảng 'gioi_thieu' (.eq('id', 1))
      try {
        let updateRes = await sbClient
          .from('gioi_thieu')
          .update({ noi_dung: contentHTML })
          .eq('id', 1);

        if (!updateRes.error) {
          success = true;
        } else {
          console.warn("Lỗi update gioi_thieu, thử lệnh upsert:", updateRes.error.message);
          let upsertRes = await sbClient
            .from('gioi_thieu')
            .upsert([{ id: 1, noi_dung: contentHTML }]);

          if (!upsertRes.error) {
            success = true;
          } else {
            console.warn("Lỗi upsert gioi_thieu, thử lệnh insert:", updateRes.error.message);
            let insertRes = await sbClient
              .from('gioi_thieu')
              .insert([{ noi_dung: contentHTML }]);

            if (!insertRes.error) success = true;
          }
        }
      } catch (err) {
        console.warn("Lỗi thao tác CSDL gioi_thieu:", err);
      }

      // Fallback lưu vào bảng 'about_info' nếu bảng 'gioi_thieu' chưa cà hoặc lỗi
      if (!success) {
        try {
          let aRes = await sbClient
            .from('about_info')
            .upsert([{ id: 1, noi_dung: contentHTML }]);

          if (!aRes.error) {
            success = true;
          } else {
            let aUpdate = await sbClient
              .from('about_info')
              .update({ noi_dung: contentHTML })
              .eq('id', 1);
            if (!aUpdate.error) success = true;
          }
        } catch (err) {
          console.warn("Lỗi fallback about_info:", err);
        }
      }
    }

    // Đồng bổ offline vào localStorage
    localStorage.setItem('about_club_content', contentHTML);

    if (typeof window.loadAboutInfo === 'function') {
      await window.loadAboutInfo();
    }

    console.log('✅ Cập nhật trang Giới thiệu thành công!');
    showToast('Cập nhật trang Giới thiệu thành công!', 'success');
  } catch (e) {
    console.error("Lỗi lưu trang Giới thiệu vào Supabase:", e);
    showToast('❌ Lỗi lưu trang Giới thiệu: ' + (e.message || e), 'error');
  } finally {
    if (btnUpdate) {
      btnUpdate.disabled = false;
      btnUpdate.textContent = 'Cập nhật trang Giới thiệu';
    }
  }
}

// Admin Stats Updater using exact count queries
async function loadThongKeAdmin() {
    try {
        const sbClient = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
        if (!sbClient) return;

        // 1. Đếm Tổng Thành Viên (Bảng thanh_vien)
        const { count: countTV, error: errTV } = await sbClient
            .from('thanh_vien')
            .select('*', { count: 'exact', head: true });

        const countValTV = (!errTV && typeof countTV === 'number') ? countTV : 0;
        const elTongTV = document.getElementById('statTongThanhVien') || document.getElementById('stat-total-members');
        if (elTongTV) {
            elTongTV.innerText = countValTV;
        }

        const elOnline = document.getElementById('statThanhVienOnline') || document.getElementById('stat-online-members');
        if (elOnline) {
            elOnline.innerText = countValTV;
        }

        const elOffline = document.getElementById('statThanhVienOffline') || document.getElementById('stat-offline-members');
        if (elOffline) {
            elOffline.innerText = 0;
        }

        // 2. Đếm Số lượng Tin Tức (Bảng tin_tuc)
        const { count: countTin, error: errTin } = await sbClient
            .from('tin_tuc')
            .select('*', { count: 'exact', head: true });

        const elTin = document.getElementById('statTinTuc') || document.getElementById('stat-total-news');
        if (elTin) {
            elTin.innerText = (!errTin && typeof countTin === 'number') ? countTin : 0;
        }

        // 3. Đếm Số lượng Ban Điều Hành (Bảng ban_dieu_hanh)
        const { count: countBDH, error: errBDH } = await sbClient
            .from('ban_dieu_hanh')
            .select('*', { count: 'exact', head: true });

        const elBDH = document.getElementById('statBanDieuHanh') || document.getElementById('stat-total-bdh');
        if (elBDH) {
            elBDH.innerText = (!errBDH && typeof countBDH === 'number') ? countBDH : 0;
        }

    } catch (err) {
        console.error('Lỗi khi tải thống kê:', err);
    }
}

window.loadThongKeAdmin = loadThongKeAdmin;
window.updateAdminStats = loadThongKeAdmin;

// Page initialization
document.addEventListener('DOMContentLoaded', () => {
  loadThongKeAdmin();

  // Gắn sự kiện đăng nhập khi click nút
  const loginBtn = document.getElementById('btn-admin-login');
  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const username = (document.getElementById('admin-username')?.value || '').trim().toLowerCase();
      const password = document.getElementById('admin-password')?.value || '';

      if (!username || !password) {
        alert('Sai tài khoản hoặc mật khẩu');
        return;
      }

      /* TẠM THỜI COMMENT ĐOẠN GỬI SUPABASE XÁC THỰC DÙNG MOCK DATA:
      let { data, error } = await supabase.from('thanh_vien').select('*').eq('mssv', username).maybeSingle();
      */

      if (username === 'admin' && password === '123456') {
        // Tài khoản Admin: mssv = 'admin', password = '123456' -> role = 'admin' -> vào Admin Dashboard
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', 'Quản trị viên');
        localStorage.setItem('mssv', 'admin');
        localStorage.setItem('userMssv', 'admin');
        localStorage.setItem('userRole', 'admin');

        const loginSection = document.getElementById('admin-login-section');
        const dashboardSection = document.getElementById('admin-dashboard-section');
        if (loginSection) loginSection.style.display = 'none';
        if (dashboardSection) dashboardSection.style.display = 'block';

        initAdminDashboard();
      } else {
        alert('Sai tài khoản hoặc mật khẩu');
      }
    });
  }

  // Lắng nghe sự kiện gõ chữ vào ô tìm kiếm thành viên hoạt động
  const searchInput = document.getElementById('search-member-input');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      const keyword = e.target.value.toLowerCase().trim();
      const checkboxLabels = document.querySelectorAll('#member-checkbox-list label');

      checkboxLabels.forEach(label => {
        const memberName = label.textContent.toLowerCase();
        if (memberName.includes(keyword)) {
          label.style.display = 'flex';
        } else {
          label.style.display = 'none';
        }
      });
    });
  }

  // Gắn sự kiện thêm thành viên mới (Lưu vào Supabase thanh_vien)
  const formThemThanhVien = document.getElementById('formThemThanhVien');
  const btnSaveMember = document.getElementById('btn-save-member');

  const handleSaveMember = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    try {
      const mssv_val = (document.getElementById('mssv')?.value || '').trim();
      const ho_ten_val = (document.getElementById('ho_ten')?.value || '').trim();
      const gioi_tinh_val = document.getElementById('gioi_tinh')?.value || 'Nam';
      const khoa_lop_val = (document.getElementById('khoa_lop')?.value || '').trim();
      const ngay_sinh_val = document.getElementById('ngay_sinh')?.value || '';
      const danh_hieu_val = 'Tành viên mới';
      const ngay_tham_gia_val = document.getElementById('ngay_tham_gia')?.value || new Date().toISOString().split('T')[0];
      const trang_thai_val = document.getElementById('trang_thai')?.value || 'online';

      if (!mssv_val || !ho_ten_val) {
        alert('Vui lòng nhập tối thiểu MSSV và Họ tên!');
        return;
      }

      // Gọi API ốẩy vào bảng thanh_vien của Supabase
      const { data, error } = await supabase
        .from('thanh_vien')
        .insert([
          { 
            mssv: mssv_val, 
            ho_ten: ho_ten_val,
            gioi_tinh: gioi_tinh_val,
            khoa_lop: khoa_lop_val,
            ngay_sinh: ngay_sinh_val,
            danh_hieu: danh_hieu_val,
            ngay_tham_gia: ngay_tham_gia_val,
            trang_thai: trang_thai_val,
            mat_khau: '123456' // Mật khẩu mặc định theo chỉ thị
          }
        ]);

      if (error) {
        // Fallback ốẩy vào bảng 'members' nếu bảng 'thanh_vien' chưa sẵn sàng
        const { error: dbError } = await supabase
          .from('thanh_vien')
          .insert([{
            mssv: mssv_val,
            full_name: ho_ten_val,
            gender: gioi_tinh_val,
            class_name: khoa_lop_val,
            birthday: ngay_sinh_val,
            title: danh_hieu_val,
            join_date: ngay_tham_gia_val,
            status: trang_thai_val.replace('⬢ ', '').toLowerCase(),
            mat_khau: '123456'
          }]);
        if (dbError && error) throw error;
      } else {
        // Đồng bổ song song sang 'members'
        try {
          await supabase.from('thanh_vien').insert([{
            mssv: mssv_val,
            full_name: ho_ten_val,
            gender: gioi_tinh_val,
            class_name: khoa_lop_val,
            birthday: ngay_sinh_val,
            title: danh_hieu_val,
            join_date: ngay_tham_gia_val,
            status: trang_thai_val.replace('⬢ ', '').toLowerCase(),
            mat_khau: '123456'
          }]);
        } catch (e) {}
      }

      // Tành công
      alert('Thêm thành viên thành công! Tài khoản: ' + mssv_val + ' - Mật khẩu: 123456');
      
      const formEl = document.getElementById('formThemThanhVien');
      if (formEl) formEl.reset();

      if (typeof loadDanhSachThanhVien === 'function') {
        loadDanhSachThanhVien();
      } else if (typeof loadAdminMembers === 'function') {
        loadAdminMembers();
      }

    } catch (error) {
      console.error('Lỗi khi thêm thành viên:', error.message || error);
      alert('LỖI: Không thể thêm thành viên. Xem chi tiết tại Console (F12).');
    }
  };

  if (formThemThanhVien) {
    formThemThanhVien.addEventListener('submit', handleSaveMember);
  }
  if (btnSaveMember) {
    btnSaveMember.addEventListener('click', handleSaveMember);
  }

  // Gọi luôn hàm load dữ liệu BĐH phòng trường hợp đang ở tab BĐH
  if (typeof window.loadAdminManagementTeam === 'function') {
      window.loadAdminManagementTeam(); 
  }

  // Mở lại tab cuối cùng mà Admin đang xem trước khi F5
  const savedTab = localStorage.getItem('activeAdminTab');
  if (savedTab) {
      switchTab(savedTab);
  }
});

// (Hàm adminLogout đã được nâng cấp xử lý ở phần đầu file)

// Switch tabs inside dashboard
function switchTab(tabName) {
  localStorage.setItem('activeAdminTab', tabName);
  // Hide all content areas
  const tabs = ['members', 'news', 'bdh', 'stats', 'activities', 'qr-scanner', 'about'];
  tabs.forEach(tab => {
    const content = document.getElementById(`tab-${tab}-content`);
    const menuItem = document.getElementById(`menu-tab-${tab}`);
    if (content) content.classList.remove('active');
    if (menuItem) menuItem.classList.remove('active');
  });
  
  // Show selected content area
  const activeContent = document.getElementById(`tab-${tabName}-content`);
  const activeMenuItem = document.getElementById(`menu-tab-${tabName}`);
  if (activeContent) activeContent.classList.add('active');
  if (activeMenuItem) activeMenuItem.classList.add('active');

  // Khởi tạo trình soạn thảo khi chuyển tab Giới thiệu
  if (tabName === 'about') {
    initQuillEditor();
  }

  if (tabName === 'bdh') {
    window.loadAdminManagementTeam();
  }

  if (tabName === 'activities') {
    loadAdminActivities();
  }

  if (tabName === 'news') {
    loadAdminNews();
  }

  if (tabName === 'stats') {
    updateAdminStats();
  }

  // Xử lý bật/tắt camera quét mã QR & auto focus ô quét
  if (tabName === 'qr-scanner') {
    startQRScanner();
    setTimeout(() => {
      const qrInput = document.getElementById('qr-scanner-input');
      if (qrInput) qrInput.focus();
    }, 100);
  } else {
    if (html5QrcodeScanner) {
      try {
        html5QrcodeScanner.clear();
        html5QrcodeScanner = null;
      } catch (e) {
        console.error("Lỗi khi tắt quét mã QR:", e);
      }
    }
  }

}

// Modal control helpers
function openAdminModal(id) {
  const modal = typeof id === 'string' ? document.getElementById(id) : id;
  if (modal) {
    modal.removeAttribute('style');
    modal.classList.remove('hidden');
    modal.classList.add('active');
    const content = modal.querySelector('.modal-content');
    if (content) content.classList.add('modal-show');
  }
}

function closeAdminModal(id) {
  const modal = typeof id === 'string' ? document.getElementById(id) : id;
  if (modal) {
    modal.removeAttribute('style');
    modal.classList.add('hidden');
    modal.classList.remove('active');
    const content = modal.querySelector('.modal-content');
    if (content) content.classList.remove('modal-show');
  }
}

// Toast notification display (Hỗ trợ màu sắc Đỏ / Xanh)
function showAdminToast(message, isError = false) {
  const toast = document.getElementById('admin-toast');
  if (toast) {
    toast.textContent = message;
    if (isError) {
      toast.style.borderColor = '#ef4444';
      toast.style.background = '#450a0ae6';
      toast.style.color = '#fca5a5';
      toast.style.boxShadow = '0 10px 30px rgba(239, 68, 68, 0.5)';
    } else {
      toast.style.borderColor = '#00f2fe4d';
      toast.style.background = '#0b0c10e6';
      toast.style.color = '#fff';
      toast.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
    }
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  } else {
    alert(message);
  }
}



// Dropdown status style change & sync
async function updateAdminStatusStyle(selectElement) {
  const row = selectElement.closest('tr');
  if (row) {
    const mssv = row.getAttribute('data-mssv');
    if (mssv) {
      const val = selectElement.value;
      localStorage.setItem(`status_${mssv}`, val);
      try {
        await supabase.from('thanh_vien').update({ status: val }).eq('mssv', mssv);
        await supabase.from('thanh_vien').update({ trang_thai: val }).eq('mssv', mssv);
        console.log('[updateAdminStatusStyle] Đã cập nhật status Supabase cho MSSV:', mssv);
      } catch (e) {
        console.error('Lỗi cập nhật status Supabase:', e);
      }
    }
  }
  
  if (selectElement.value === 'online') {
    selectElement.className = 'status-select status-online';
  } else {
    selectElement.className = 'status-select status-offline';
  }
}

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
    const statusA = String(a.trang_thai || a.status || localStorage.getItem(`status_${a.mssv}`) || 'Offline').toLowerCase();
    const statusB = String(b.trang_thai || b.status || localStorage.getItem(`status_${b.mssv}`) || 'Offline').toLowerCase();
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

// Render danh sách thành viên động trên admin portal
function renderMembers(list = (window.mockMembers || [])) {
  const tbody = document.getElementById('admin-member-table-body');
  if (!tbody) return;

  const targetList = (list && list.length > 0) ? list : (window.mockMembers || []);
  
  const sortedMembers = sortMembersByOnlineAndDate(targetList);

  tbody.innerHTML = '';

  if (sortedMembers.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="7" class="empty-data-msg">Chưa cà dữ liệu</td>';
    tbody.appendChild(tr);
    updateAdminStats();
    return;
  }

  sortedMembers.forEach((member, index) => {
    const stt = index + 1;
    const role = member.title || member.role || 'Hội viên';
    const rawAvt = member.avatar || member.avatar_url || member.hinh_anh;
    const avatarUrl = (rawAvt && String(rawAvt).trim() !== '' && !rawAvt.includes('via.placeholder'))
      ? (rawAvt.includes('?') ? `${rawAvt}&t=${Date.now()}` : `${rawAvt}?t=${Date.now()}`)
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.mssv}`;
    const elo = member.elo || 1200;

    const badgeSrc = getBadgeSrcByTitle(role);
    const badgeTitleText = getBadgeTitle ? getBadgeTitle(0) : role;
    const danhHieuHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
        <img src="${badgeSrc}" class="badge-icon-small" style="width:36px;height:36px;object-fit:contain;vertical-align:middle;" alt="${role}" title="${role}">
        <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">${role}</span>
      </div>
    `;

    const savedStatus = localStorage.getItem(`status_${member.mssv}`) || member.status || 'active';
    let selectClass = 'status-select';
    if (savedStatus.toLowerCase() === 'online' || savedStatus.toLowerCase() === 'active') selectClass += ' status-online';
    else selectClass += ' status-offline';

    let displayJoinDate = '15/09/2024';
    if (member.join_date) {
      if (member.join_date.includes('/')) {
        displayJoinDate = member.join_date;
      } else {
        const parts = member.join_date.split('-');
        if (parts.length === 3) {
          displayJoinDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }
    }

    const tr = document.createElement('tr');
    tr.setAttribute('data-mssv', member.mssv);
    tr.innerHTML = `
      <td class="player-info-cell" style="vertical-align: middle;">
        <div class="player-info" style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: bold; color: #64ffda; min-width: 24px;">#${stt}</span>
          <img src="${avatarUrl}" alt="Avatar" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
          <div style="display: flex; flex-direction: column; text-align: left;">
            <span class="member-name" style="font-weight: 600; color: #fff;">${member.full_name || member.name || member.mssv}</span>
            <span style="font-size: 11px; color: rgba(255,255,255,0.6);">${member.mssv} ⬢ Elo: ${elo}</span>
          </div>
        </div>
      </td>
      <td style="text-align: center; vertical-align: middle;">${member.class_name || member.class || 'K20 - CNTT'}</td>
      <td style="text-align: center; vertical-align: middle;">${member.gender || 'Nam'}</td>
      <td style="text-align: center; vertical-align: middle;">${danhHieuHtml}</td>
      <td style="text-align: center; vertical-align: middle;">${displayJoinDate}</td>
      <td style="text-align: center; vertical-align: middle;">
        <select class="${selectClass}" onchange="updateAdminStatusStyle(this)">
          <option value="online" ${savedStatus.toLowerCase() === 'online' || savedStatus.toLowerCase() === 'active' ? 'selected' : ''}>⬢ Hoạt động</option>
          <option value="offline" ${savedStatus.toLowerCase() === 'offline' ? 'selected' : ''}>⬢ Không hoạt động</option>
        </select>
      </td>
      <td style="text-align: center; vertical-align: middle;">
        <button class="btn-delete-admin" onclick="deleteAdminMember(this)" style="background:rgba(239, 68, 68, 0.2); color:#ef4444; border:1px solid rgba(239, 68, 68, 0.4); padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:12px;">Xóa</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updateAdminStats();
}

window.renderMembers = renderMembers;
window.renderAdminMembers = renderMembers;

function layHuyChuong(danhHieu) {
  let fileBac = 'bac1.png';
  let titleText = danhHieu || 'Bậc 1: Thành viên mới';

  if (danhHieu) {
    const dh = danhHieu.toLowerCase().trim();
    if (dh.includes('6') || dh.includes('nòng cốt') || dh.includes('nong cot') || (dh.includes('chủ nhiệm') && !dh.includes('phó')) || dh.includes('admin')) {
      fileBac = 'bac6.png';
      titleText = danhHieu || 'Bậc 6: Thành viên nòng cốt';
    } else if (dh.includes('5') || dh.includes('ưu tú') || dh.includes('uu tu') || dh.includes('phó chủ nhiệm')) {
      fileBac = 'bac5.png';
      titleText = danhHieu || 'Bậc 5: Thành viên ưu tú';
    } else if (dh.includes('4') || dh.includes('cốt cán') || dh.includes('cot can') || ((dh.includes('trưởng ban') || dh.includes('thư ký') || dh.includes('thu ky') || dh.includes('thư kí') || dh.includes('thu ki')) && !dh.includes('phó'))) {
      fileBac = 'bac4.png';
      titleText = danhHieu || 'Bậc 4: Thành viên cốt cán';
    } else if (dh.includes('3') || dh.includes('tích cực') || dh.includes('tich cuc') || dh.includes('phó ban') || dh.includes('phó trưởng ban') || dh.includes('phó') || dh.includes('kỳ cựu') || dh.includes('xuất sắc')) {
      fileBac = 'bac3.png';
      titleText = danhHieu || 'Bậc 3: Thành viên tích cực';
    } else if (dh.includes('2') || dh.includes('hội viên') || dh.includes('hoi vien')) {
      fileBac = 'bac2.png';
      titleText = danhHieu || 'Bậc 2: Hội viên';
    } else {
      fileBac = 'bac1.png';
      titleText = danhHieu || 'Bậc 1: Thành viên mới';
    }
  }

  return `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
      <img src="../assets/badges/${fileBac}" alt="${titleText}" title="${titleText}" style="width: 38px; height: 38px; object-fit: contain; vertical-align: middle; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
      <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">${titleText}</span>
    </div>
  `;
}
window.layHuyChuong = layHuyChuong;

async function loadDanhSachThanhVien() {
  const tbody = document.getElementById('bangThanhVienAdmin') || document.getElementById('admin-member-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Đang tải dữ liệu...</td></tr>';

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
      tbody.innerHTML = '<tr><td colspan="6" class="empty-data-msg">Chưa có dữ liệu</td></tr>';
      return;
    }

    data = sortMembersByOnlineAndDate(data);

    data.forEach(user => {
      const status = user.trang_thai || user.status || 'Offline';
      const isOnline = (status === 'Online' || status === 'online' || status === 'Hoạt động');
      const color = isOnline ? '#00e676' : '#808080';

      const nameVal = user.ho_ten || user.full_name || 'Chưa cập nhật';
      const mssvVal = user.mssv || '';
      const classVal = user.khoa_lop || user.class_name || '-';
      const genderVal = user.gioi_tinh || user.gender || '-';
      const joinVal = user.ngay_tham_gia || user.join_date || '-';

      // 1. Tính bậc điểm năng lực
      let sh = user.diem_sinh_hoat || 0, gd = user.diem_giai_dau || 0, hd = user.diem_hoat_dong || 0;
      let bacDiem = 1;
      if (sh >= 115 && gd >= 12 && hd >= 15) bacDiem = 6;
      else if (sh >= 100 && gd >= 10 && hd >= 12) bacDiem = 5;
      else if (sh >= 60 && gd >= 5 && hd >= 8) bacDiem = 4;
      else if (sh >= 20 && gd >= 2 && hd >= 4) bacDiem = 3;
      else if (sh >= 8 && gd >= 1 && hd >= 2) bacDiem = 2;

      // 2. Cập nhật logic tính Bậc huy chương (6, 5, 4, 3) dựa trên ban_dieu_hanh[0].chuc_vu
      let bacChucVu = 1;
      let cv = user.chuc_vu || user.title || null;

      if (user.ban_dieu_hanh && user.ban_dieu_hanh.length > 0) {
        cv = user.ban_dieu_hanh[0].chuc_vu;
        let trangThaiBaoLuu = user.ban_dieu_hanh[0].trang_thai;
        let cvLower = cv ? String(cv).toLowerCase() : '';

        if (cvLower.includes('chủ nhiệm') && !cvLower.includes('phó')) bacChucVu = 6;
        else if (cvLower.includes('phó chủ nhiệm')) bacChucVu = 5;
        else if ((cvLower.includes('trưởng ban') || cvLower.includes('thư ký') || cvLower.includes('thu ky') || cvLower.includes('thư kí') || cvLower.includes('thu ki')) && !cvLower.includes('phó')) bacChucVu = 4;
        else if (cvLower.includes('phó ban') || cvLower.includes('phó trưởng ban') || cvLower.includes('phó')) bacChucVu = 3;

        // Nếu trạng thái là 'Cựu thành viên' thì thêm chữ 'Nguyên' vào trước chức vụ
        if (trangThaiBaoLuu === 'Cựu thành viên') {
          cv = 'Nguyên ' + cv;
        }
      }
      // 3. So sánh lấy bậc cao nhất
      let bacCuoiCung = Math.max(bacDiem, bacChucVu);

      const isNested = typeof window !== 'undefined' && window.location && window.location.pathname.includes('/pages/');
      const basePath = isNested ? '../assets/badges/' : './assets/badges/';

      const danhHieuMap = {
        6: { ten: 'Thành viên nòng cốt', img: `${basePath}bac6.png` },
        5: { ten: 'Thành viên ưu tú', img: `${basePath}bac5.png` },
        4: { ten: 'Thành viên cốt cán', img: `${basePath}bac4.png` },
        3: { ten: 'Thành viên tích cực', img: `${basePath}bac3.png` },
        2: { ten: 'Hội viên', img: `${basePath}bac2.png` },
        1: { ten: 'Thành viên mới', img: `${basePath}bac1.png` }
      };
      const danhHieuObj = danhHieuMap[bacCuoiCung] || danhHieuMap[1];

      const rawAvt = user.avatar || user.avatar_url || user.hinh_anh || (mssvVal ? (localStorage.getItem('avatar_' + mssvVal) || localStorage.getItem('avatar_' + String(mssvVal).toUpperCase()) || localStorage.getItem('avatar_' + String(mssvVal).toLowerCase())) : '') || (mssvVal === localStorage.getItem('currentUserMSSV') ? localStorage.getItem('userAvatar') : '') || '';
      const avtSrc = (rawAvt && String(rawAvt).trim() !== '' && !rawAvt.includes('via.placeholder'))
        ? (rawAvt.includes('?') ? `${rawAvt}&t=${Date.now()}` : `${rawAvt}?t=${Date.now()}`)
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(nameVal)}&background=random&color=fff`;

      const tr = document.createElement('tr');
      tr.setAttribute('data-mssv', user.mssv || mssvVal);
      tr.setAttribute('onclick', `xemHoSo('${user.mssv || mssvVal}')`);
      tr.className = 'cursor-pointer hover:bg-slate-700/50 transition-colors group';
      tr.style.cursor = 'pointer';
      tr.innerHTML = `
        <td class="player-info-cell align-middle" style="vertical-align: middle; padding: 12px 16px;">
          <div class="player-info flex items-center gap-3" style="display: flex; align-items: center; gap: 12px; margin: 0; padding: 0;">
            <img src="${avtSrc}" data-mssv="${user.mssv || mssvVal}" alt="Avatar" class="w-10 h-10 rounded-full object-cover shrink-0" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; margin: 0;">
            <strong class="member-name font-semibold text-white leading-normal" style="font-size: 1rem; margin: 0; padding: 0;">${nameVal}</strong>
          </div>
        </td>
        <td style="padding: 12px 16px;">${classVal}</td>
        <td style="padding: 12px 16px;">${genderVal}</td>
        <td style="padding: 12px 16px; text-align: center;">
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
            <img src="${danhHieuObj.img}" alt="${danhHieuObj.ten}" title="${danhHieuObj.ten}${cv ? ' - ' + cv : ''}" style="width: 38px; height: 38px; object-fit: contain; vertical-align: middle; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
            <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">${danhHieuObj.ten}</span>
          </div>
        </td>
        <td style="padding: 12px 16px;">${joinVal}</td>
        <td style="padding: 12px 16px;" onclick="event.stopPropagation()">
          <select onchange="capNhatTrangThai('${user.mssv || mssvVal}', this.value)" 
                  style="background: transparent; color: ${color}; border: 1px solid #444; border-radius: 5px; padding: 4px; font-weight: bold; cursor: pointer;">
            <option value="Online" style="color: black;" ${isOnline ? 'selected' : ''}>● Online</option>
            <option value="Offline" style="color: black;" ${!isOnline ? 'selected' : ''}>● Offline</option>
          </select>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error('Lỗi tải danh sách:', error);
    tbody.innerHTML = '<tr><td colspan="6" class="empty-data-msg">Lỗi tải dữ liệu.</td></tr>';
  }
}

window.loadAdminMembers = loadDanhSachThanhVien;

async function capNhatTrangThai(mssv, trangThaiMoi) {
  try {
    const { error } = await supabase
      .from('thanh_vien')
      .update({ trang_thai: trangThaiMoi })
      .eq('mssv', mssv);

    if (error) {
      await supabase
        .from('thanh_vien')
        .update({ status: trangThaiMoi })
        .eq('mssv', mssv);
    } else {
      try {
        await supabase.from('thanh_vien').update({ status: trangThaiMoi }).eq('mssv', mssv);
      } catch (e) {}
    }

    loadDanhSachThanhVien();
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái:', error.message || error);
    alert('Lỗi: Không thể cập nhật trạng thái!');
  }
}

window.layHuyChuong = layHuyChuong;
window.loadDanhSachThanhVien = loadDanhSachThanhVien;
window.loadAdminMembers = loadDanhSachThanhVien;
window.capNhatTrangThai = capNhatTrangThai;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadDanhSachThanhVien);
} else {
  loadDanhSachThanhVien();
}

window.addEventListener('avatarChanged', (e) => {
  const mssv = e.detail?.mssv;
  const bustedUrl = e.detail?.avatarUrl;
  if (bustedUrl && mssv) {
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
  if (typeof loadDanhSachThanhVien === 'function') loadDanhSachThanhVien();
});

// ==========================================================================
// MEMBERS MANAGEMENT SECTION
// ==========================================================================
function openAdminAddMemberModal() {
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('add-joindate');
  if (dateInput) {
    dateInput.value = today;
  }
  
  // Clear other input values
  const mssvEl = document.getElementById('add-mssv');
  if (mssvEl) mssvEl.value = '';
  const nameEl = document.getElementById('add-fullname');
  if (nameEl) nameEl.value = '';
  const classEl = document.getElementById('add-class');
  if (classEl) classEl.value = '';
  const dobInput = document.getElementById('add-birthday');
  if (dobInput) dobInput.value = '';
  
  openAdminModal('modal-register');
}

async function deleteAdminMember(buttonOrMssv) {
  let mssv = '';
  let name = '';

  if (typeof buttonOrMssv === 'string') {
    mssv = buttonOrMssv;
  } else if (buttonOrMssv && buttonOrMssv.closest) {
    const row = buttonOrMssv.closest('tr');
    if (row) {
      mssv = row.getAttribute('data-mssv');
      const nameEl = row.querySelector('.member-name');
      name = nameEl ? nameEl.innerText : mssv;
    }
  }

  if (!mssv) return;

  if (confirm(`Bạn có chắc chắn muốn xóa thành viên "${name || mssv}" khỏi CLB không?`)) {
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

    if (window.showAdminToast) showAdminToast('🗑️ Đã xóa thành viên thành công!');
    else alert('🗑️ Đã xóa thành viên thành công!');

    if (typeof loadAdminMembers === 'function') loadAdminMembers();
    if (typeof loadMembers === 'function') loadMembers();
    if (typeof updateAdminStats === 'function') updateAdminStats();
  }
}

async function clearTestMembers() {
  if (!confirm('⚠️ Bạn có chắc chắn muốn XÓA HẾT tất cả dữ liệu thành viên test không?')) return;

  let deletedCount = 0;

  // 1. Xóa trong Supabase
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

  // 2. Xóa trong localStorage
  try {
    let members = JSON.parse(localStorage.getItem('club_members') || '[]');
    const originalLength = members.length;
    const cleanMembers = members.filter(m => {
      const mssvStr = String(m.mssv || '').toLowerCase();
      const nameStr = String(m.full_name || m.name || '').toLowerCase();
      return !mssvStr.includes('test') && !nameStr.includes('test') && !mssvStr.startsWith('demo');
    });

    deletedCount = originalLength - cleanMembers.length;
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

  const msg = deletedCount > 0 
    ? `✅ Đã xóa thành công ${deletedCount} dữ liệu thành viên test!`
    : `✅ Đã dọn dẹp sạch sẽ tất cả dữ liệu thành viên test!`;

  if (window.showAdminToast) showAdminToast(msg);
  else alert(msg);

  if (typeof loadAdminMembers === 'function') loadAdminMembers();
  if (typeof loadMembers === 'function') loadMembers();
  if (typeof updateAdminStats === 'function') updateAdminStats();
}

window.deleteAdminMember = deleteAdminMember;
window.clearTestMembers = clearTestMembers;

// ==========================================================================
// NEWS EDITING SECTION
// ==========================================================================
const DEFAULT_NEWS_ARTICLES = [];

function getNewsArticles() {
  const articles = localStorage.getItem('news_articles');
  if (!articles) {
    localStorage.setItem('news_articles', JSON.stringify(DEFAULT_NEWS_ARTICLES));
    return DEFAULT_NEWS_ARTICLES;
  }
  return JSON.parse(articles);
}

async function loadAdminNews() {
  const tbody = document.getElementById('admin-news-table-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: rgba(255,255,255,0.6);">Đang kết nối cơ sở dữ liệu...</td></tr>';

  try {
    const { data: rawNewsList, error } = await supabase
      .from('tin_tuc')
      .select('*');

    if (error) throw error;

    tbody.innerHTML = '';

    if (!rawNewsList || rawNewsList.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-data-msg">Chưa cà dữ liệu</td></tr>';
      return;
    }

    const newsList = [...rawNewsList].sort((a, b) => {
      const timeA = (a.created_at || a.ngay_dang) ? new Date(a.created_at || a.ngay_dang).getTime() : 0;
      const timeB = (b.created_at || b.ngay_dang) ? new Date(b.created_at || b.ngay_dang).getTime() : 0;
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });

    newsList.forEach(item => {
      const title = item.tieu_de || item.title || 'Bài viết chưa đặt tên';
      const content = item.noi_dung || item.content || item.excerpt || '';
      const author = item.tac_gia || item.author || 'Ban Điều Hành';
      const image = item.anh_bia || item.hinh_anh || item.image || item.image_url || 'https://images.unsplash.com/photo-1529699211952-734e80c4d42bơuto=format&fit=crop&w=120&q=80';

      let dateDisplay = 'Mới đãng';
      const createdDate = item.created_at || item.ngay_dang;
      if (createdDate) {
        const d = new Date(createdDate);
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          dateDisplay = `${day}/${month}/${year}`;
        }
      }

      const escapedTitle = title.replace(/'/g, "\\'").replace(/"/g, "&quot;");

      const tr = document.createElement('tr');
      tr.setAttribute('data-id', item.id);
      tr.innerHTML = `
        <td><img src="${image}" style="width: 80px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15);" alt="${title}"></td>
        <td style="font-weight: bold; color: #00d2ff; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${title}</td>
        <td style="font-size: 13px; color: rgba(255,255,255,0.8);">${author}<br><span style="font-size: 11px; color: rgba(255,255,255,0.5);">${dateDisplay}</span></td>
        <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; color: rgba(255,255,255,0.7);">${content.replace(/<[^>]*>?/gm, '')}</td>
        <td><button class="btn-delete-admin" data-id="${item.id}" data-title="${encodeURIComponent(title)}" onclick="handleDeleteNewsBtn(this)">Xóa</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error("Lỗi nạp tin tức từ Supabase:", e);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ef4444; padding: 20px;">Lỗi tải dữ liệu: ${e.message}</td></tr>`;
  }
}

// Drag-to-Pan & Mouse Wheel Zoom State Variables for Cover Photo Repositioning
let isDraggingCover = false;
let startY = 0;
let currentCoverPositionY = 50; // Mặc định ở giữa 50%
let currentScale = 1;
const MIN_SCALE = 1; // Không cho thu nhỏ hơn khung
const MAX_SCALE = 3; // Phống to tối ốa 3 lần
const ZOOM_SPEED = 0.1;

window.updateCoverZoom = function(scale) {
  currentScale = Math.max(MIN_SCALE, Math.min(scale, MAX_SCALE));
  const previewImg = document.getElementById('news-cover-live-preview');
  const zoomBadge = document.getElementById('cover-zoom-badge');

  if (previewImg) previewImg.style.transform = `scale(${currentScale})`;
  if (zoomBadge) zoomBadge.textContent = `🔍 ${Math.round(currentScale * 100)}%`;
};

window.updateNewsCoverSlider = function(val) {
  currentCoverPositionY = Number(val);
  if (currentCoverPositionY < 0) currentCoverPositionY = 0;
  if (currentCoverPositionY > 100) currentCoverPositionY = 100;

  const pos = `center ${currentCoverPositionY.toFixed(1)}%`;
  const previewImg = document.getElementById('news-cover-live-preview');
  const posInput = document.getElementById('admin-news-cover-position');
  const sliderLabel = document.getElementById('slider-val-label');
  const slider = document.getElementById('admin-news-cover-slider');

  if (previewImg) previewImg.style.objectPosition = pos;
  if (posInput) posInput.value = pos;
  if (sliderLabel) sliderLabel.textContent = `${Math.round(currentCoverPositionY)}%`;
  if (slider && Number(slider.value) !== Math.round(currentCoverPositionY)) {
    slider.value = Math.round(currentCoverPositionY);
  }
};

window.setNewsCoverAlign = function(pos) {
  let val = 50;
  if (pos.includes('0%')) val = 0;
  else if (pos.includes('100%')) val = 100;
  else if (pos.includes('50%')) val = 50;
  window.updateNewsCoverSlider(val);
};

// Gắn các Event Listener Kéo Thả & Lăn Chuột Zoom (Drag to Pan & Mouse Wheel Zoom like Google Maps/FB)
function initCoverDragToPan() {
  const container = document.getElementById('cover-drag-container');
  if (!container) return;

  const handleStart = (clientY) => {
    isDraggingCover = true;
    startY = clientY;
    container.style.cursor = 'grabbing';
  };

  const handleMove = (clientY) => {
    if (!isDraggingCover) return;
    const containerHeight = container.clientHeight || 160;
    const deltaY = clientY - startY;

    // Kéo xuống (deltaY > 0) thì ảnh trượt lên (-%), kéo lên thì ảnh trượt xuống (+%)
    const percentChange = (deltaY / containerHeight) * 100;
    currentCoverPositionY -= percentChange;

    if (currentCoverPositionY < 0) currentCoverPositionY = 0;
    if (currentCoverPositionY > 100) currentCoverPositionY = 100;

    window.updateNewsCoverSlider(currentCoverPositionY);
    startY = clientY;
  };

  const handleEnd = () => {
    if (isDraggingCover) {
      isDraggingCover = false;
      const c = document.getElementById('cover-drag-container');
      if (c) c.style.cursor = 'grab';
    }
  };

  // Mouse Wheel Zoom Listener
  const handleWheel = (e) => {
    e.preventDefault(); // Chặn hành vi cuộn trang web của trình duyệt khi đang rê chuột ở ảnh
    if (e.deltaY < 0) {
      currentScale += ZOOM_SPEED; // Lăn làn -> Phống to
    } else {
      currentScale -= ZOOM_SPEED; // Lăn xuống -> Thu nhỏ
    }
    window.updateCoverZoom(currentScale);
  };

  // Safe binding of wheel event with { passive: false } so preventDefault works
  container.removeEventListener('wheel', handleWheel);
  container.addEventListener('wheel', handleWheel, { passive: false });

  // Mouse Events for Drag to Pan
  container.addEventListener('mousedown', (e) => {
    e.preventDefault(); // Chặn hành vi kéo ảnh (ghost image) mặc định của trình duyệt
    handleStart(e.clientY);
  });

  window.addEventListener('mousemove', (e) => {
    if (isDraggingCover) handleMove(e.clientY);
  });

  window.addEventListener('mouseup', handleEnd);

  // Touch Events cho Mobile / Tablet
  container.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) handleStart(e.touches[0].clientY);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (isDraggingCover && e.touches && e.touches[0]) handleMove(e.touches[0].clientY);
  }, { passive: true });

  window.addEventListener('touchend', handleEnd);
}

// Bind file input change to show live preview box for manual alignment
document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'admin-add-news-avatar') {
    const file = e.target.files && e.target.files[0];
    const previewWrapper = document.getElementById('cover-preview-wrapper');
    const previewImg = document.getElementById('news-cover-live-preview');

    if (file && previewImg && previewWrapper) {
      const reader = new FileReader();
      reader.onload = ev => {
        previewImg.src = ev.target.result;
        previewWrapper.style.display = 'block';
        window.updateNewsCoverSlider(50);
        window.updateCoverZoom(1);
        setTimeout(initCoverDragToPan, 50);
      };
      reader.readAsDataURL(file);
    }
  }
});

document.addEventListener('DOMContentLoaded', initCoverDragToPan);

function initNewsQuillEditor() {
  const container = document.getElementById('news-quill-editor');
  if (container && !newsQuillEditor && typeof Quill !== 'undefined') {
    newsQuillEditor = new Quill('#news-quill-editor', {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          ['link', 'image'],
          ['clean']
        ]
      },
      placeholder: 'Nhập nội dung chi tiết bài viết tin tức tại đây...'
    });
  }
}

function openAdminAddNewsModal() {
  const titleEl = document.getElementById('admin-new-news-title');
  const authorEl = document.getElementById('admin-new-news-author');
  const dateEl = document.getElementById('inputNgayDangTin');
  const avatarEl = document.getElementById('admin-add-news-avatar');
  const galleryEl = document.getElementById('admin-add-news-gallery');
  const contentEl = document.getElementById('admin-new-news-content');
  const previewWrapper = document.getElementById('cover-preview-wrapper');

  if (titleEl) titleEl.value = '';
  if (authorEl) authorEl.value = 'Ban Điều Hành';
  if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
  if (avatarEl) avatarEl.value = '';
  if (galleryEl) galleryEl.value = '';
  if (contentEl) contentEl.value = '';
  if (previewWrapper) previewWrapper.style.display = 'none';

  initNewsQuillEditor();
  if (newsQuillEditor && newsQuillEditor.root) {
    newsQuillEditor.root.innerHTML = '';
  }

  window.setNewsCoverAlign('center 50%');

  const btnLuuTinTuc = document.getElementById('btnSubmitTinTuc');
  if (btnLuuTinTuc) {
    btnLuuTinTuc.onclick = async (e) => {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      await submitAdminNewNews(e);
    };
  }

  openAdminModal('modal-admin-add-news');
}

let isSubmittingNews = false;

async function submitAdminNewNews(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  if (isSubmittingNews) return;
  isSubmittingNews = true;
  console.log('Đã bấm nút Lưu Tin Tức - Bắt đầu xử lý...');

  // 1. Lấy dữ liệu từ càc input
  const titleEl = document.getElementById('admin-new-news-title');
  const authorEl = document.getElementById('admin-new-news-author');
  const dateEl = document.getElementById('inputNgayDangTin');
  const fileInputCover = document.getElementById('admin-add-news-avatar');
  const fileInputGallery = document.getElementById('admin-add-news-gallery');
  const coverPosInput = document.getElementById('admin-news-cover-position');

  if (!titleEl) {
    console.error('Không tóm thấy thẻ input tiêu đề bài viết');
    alert('Không tóm thấy thẻ input tiêu đề bài viết!');
    return;
  }

  const tieuDe = titleEl.value.trim();
  const tacGia = (authorEl ? authorEl.value.trim() : '') || 'Ban Điều Hành';
  const ngayDang = dateEl ? dateEl.value : '';
  const coverPos = coverPosInput ? coverPosInput.value : 'center 50%';

  let noiDung = '';
  if (newsQuillEditor && newsQuillEditor.root) {
    noiDung = newsQuillEditor.root.innerHTML.trim();
    if (noiDung === '<p><br></p>') noiDung = '';
  }
  if (!noiDung) {
    const textEl = document.getElementById('admin-new-news-content');
    noiDung = textEl ? textEl.value.trim() : '';
  }

  if (!tieuDe || !noiDung) {
    alert('⚠️ Vui lòng nhập đầy đủ Tiêu đề và Nội dung bài viết!');
    return;
  }

  const btnSubmit = document.getElementById('btnSubmitTinTuc');
  const originalText = btnSubmit ? btnSubmit.textContent : 'Lưu Tin Tức';
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Đang lưu...';
  }

  try {
    let imageUrlFile = '';
    const sbClient = window.supabase || supabase;

    // 2. Upload Ảnh Nền / Ảnh Bìa
    if (fileInputCover && fileInputCover.files && fileInputCover.files.length > 0) {
      const file = fileInputCover.files[0];
      const fileExt = file.name.split('.').pop() || 'png';
      const filePath = `news_cover_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      try {
        if (sbClient && sbClient.storage) {
          const { data: uploadData, error: uploadError } = await sbClient.storage
            .from('avatars')
            .upload(filePath, file, { contentType: file.type || 'image/png', upsert: true });

          if (!uploadError && uploadData) {
            const { data: publicUrlData } = sbClient.storage.from('avatars').getPublicUrl(filePath);
            imageUrlFile = publicUrlData?.publicUrl || '';
          } else if (uploadError) {
            console.warn("Cảnh báo Storage Upload Cover:", uploadError.message);
          }
        }
      } catch (err) {
        console.warn("Lỗi khi upload ảnh báa làn Supabase Storage:", err);
      }

      if (!imageUrlFile) {
        imageUrlFile = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = ev => resolve(ev.target.result);
          reader.readAsDataURL(file);
        });
      }
    }

    if (!imageUrlFile) {
      imageUrlFile = 'https://images.unsplash.com/photo-1529699211952-734e80c4d42bơuto=format&fit=crop&w=600&q=80';
    }

    // 3. Upload Bộ Sưu Tập Nhiều Ảnh (Gallery)
    const galleryUrls = [];
    if (fileInputGallery && fileInputGallery.files && fileInputGallery.files.length > 0) {
      btnSubmit.textContent = `Đang tải ${fileInputGallery.files.length} ảnh...`;
      for (let i = 0; i < fileInputGallery.files.length; i++) {
        const gFile = fileInputGallery.files[i];
        const gExt = gFile.name.split('.').pop() || 'png';
        const gPath = `news_gallery_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}.${gExt}`;
        let gUrl = '';

        try {
          if (sbClient && sbClient.storage) {
            const { data: uData, error: uErr } = await sbClient.storage
              .from('avatars')
              .upload(gPath, gFile, { contentType: gFile.type || 'image/png', upsert: true });

            if (!uErr && uData) {
              const { data: pData } = sbClient.storage.from('avatars').getPublicUrl(gPath);
              gUrl = pData?.publicUrl || '';
            }
          }
        } catch (err) {
          console.warn("Lỗi upload gallery image:", err);
        }

        if (!gUrl) {
          gUrl = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = ev => resolve(ev.target.result);
            reader.readAsDataURL(gFile);
          });
        }

        if (gUrl) galleryUrls.push(gUrl);
      }
    }

    // Nhúng bộ sưu tập ảnh vào nội dung để hiển thị đẹp mắt ở tất cả thiết bị
    let finalNoiDung = noiDung;
    if (galleryUrls.length > 0) {
      const galleryHtml = `<div class="news-gallery-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-top: 24px;">` +
        galleryUrls.map((u, idx) => `<img src="${u}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 4px 12px rgba(0,0,0,0.3);" alt="Ảnh bộ sưu tập ${idx + 1}">`).join('') +
        `</div>`;
      finalNoiDung += `\n\n` + galleryHtml;
    }

    const createdAtIso = ngayDang ? new Date(ngayDang).toISOString() : new Date().toISOString();

    // 4. Insert vào CSDL Supabase 'tin_tuc' kèm vị trí ảnh báa tự căn thủ công
    let insertResult = await sbClient
      .from('tin_tuc')
      .insert([
        {
          tieu_de: tieuDe,
          tac_gia: tacGia,
          noi_dung: finalNoiDung,
          anh_bia: imageUrlFile,
          vitri_anh_bia: coverPos,
          bo_suu_tap: galleryUrls,
          created_at: createdAtIso
        }
      ])
      .select();

    if (insertResult.error) {
      console.warn("Insert với vitri_anh_bia/bo_suu_tap gặp lỗi schema, fallback cấu trúc mặc đ9nh:", insertResult.error.message);
      insertResult = await sbClient
        .from('tin_tuc')
        .insert([
          {
            tieu_de: tieuDe,
            tac_gia: tacGia,
            noi_dung: finalNoiDung,
            anh_bia: imageUrlFile,
            created_at: createdAtIso
          }
        ])
        .select();
    }

    if (insertResult.error) throw insertResult.error;

    console.log('✅ Thêm tin tức thành công!', insertResult.data);
    showToast('Thêm tin tức thành công!', 'success');

    // Đóng form và tải lại danh sách tin tức MỘT LẦN DUY NHẤT
    const modal = document.getElementById('modal-admin-add-news');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.add('hidden');
    }
    if (typeof closeAdminModal === 'function') {
      closeAdminModal('modal-admin-add-news');
    }

    if (typeof loadAdminNews === 'function') await loadAdminNews();
    if (typeof window.loadPublicNews === 'function') await window.loadPublicNews();
    if (typeof updateAdminStats === 'function') await updateAdminStats();

  } catch (error) {
    console.error('Lỗi khi lưu tin tức:', error);
    alert('Có lỗi xảy ra! Xem Console (F12) để biết chi tiết.\nChi tiết lỗi: ' + (error.message || error));
  } finally {
    isSubmittingNews = false;
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.textContent = originalText;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
    const btnLuuTinTuc = document.getElementById('btnSubmitTinTuc');
    if (btnLuuTinTuc) {
        // Dống onclick thay cho addEventListener để chống double-click/multi-binding
        btnLuuTinTuc.onclick = async (e) => {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            await submitAdminNewNews(e);
        };
    } else {
        console.error('Không tìm thấy nút Lưu Tin Tức có id="btnSubmitTinTuc"');
    }

    const btnUpdateGioiThieu = document.getElementById('btnUpdateGioiThieu');
    if (btnUpdateGioiThieu) {
        btnUpdateGioiThieu.onclick = async (e) => {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            console.log('Bắt ốầu cập nhật Giới thiệu...');
            await saveAboutClubContent(e);
        };
    } else {
        console.error('Không tóm thấy nàt Cập nhật trang Giới thiệu cà id="btnUpdateGioiThieu"');
    }
});

window.handleDeleteNewsBtn = function(btn) {
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  const title = decodeURIComponent(btn.getAttribute('data-title') || '');
  deleteAdminNews(id, title);
};

async function deleteAdminNews(id, title) {
  if (!id) return;
  const articleTitle = title || 'bài viết này';

  showConfirmModal(`Bạn có chắc chắn muốn xóa bài viết "${articleTitle}" không?`, async () => {
    try {
      const sbClient = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
      if (!sbClient) {
        showToast("❌ Không thể kết nối cơ sở dữ liệu Supabase!", "error");
        return;
      }

      const numId = !isNaN(Number(id)) ? Number(id) : null;
      let deleteError = null;

      if (numId !== null) {
        const res = await sbClient.from('tin_tuc').delete().eq('id', numId);
        deleteError = res.error;
      }

      if (deleteError || numId === null) {
        const resString = await sbClient.from('tin_tuc').delete().eq('id', String(id));
        if (!resString.error) {
          deleteError = null;
        } else if (!deleteError) {
          deleteError = resString.error;
        }
      }

      if (deleteError) throw deleteError;

      console.log('🗑️ Đã xóa bài viết thành công! ID:', id);
      showToast('Đã xóa thành công', 'success');

      if (typeof loadAdminNews === 'function') {
        await loadAdminNews();
      }
      if (typeof window.loadPublicNews === 'function') {
        await window.loadPublicNews();
      }
      if (typeof updateAdminStats === 'function') {
        await updateAdminStats();
      }
    } catch (e) {
      console.error("Lỗi xóa bài viết:", e);
      showToast('❌ Lỗi xóa bài viết: ' + (e.message || e), 'error');
    }
  }, 'Xác Nhận Xóa Bài Viết');
}

// ==========================================================================
// EXECUTIVE BOARD SECTION
// ==========================================================================
async function submitAdminNewBDH(event) {
  if (event) event.preventDefault();

  const mssvEl = document.getElementById('add-bdh-mssv');
  const roleEl = document.getElementById('add-bdh-role');
  const phoneEl = document.getElementById('add-bdh-phone');

  if (!mssvEl || !roleEl) return;

  const mssv = mssvEl.value.trim().toUpperCase();
  const role = roleEl.value.trim();
  const phone = phoneEl ? phoneEl.value.trim() : '';

  if (!mssv) {
    alert('Vui lòng nhập MSSV để bổ nhiệm!');
    return;
  }

  if (!role) {
    alert('Vui lòng nhập Chức vụ để bổ nhiệm!');
    return;
  }

  try {
    // Xây dựng object update: luôn ghi title + status, thêm phone nếu có
    const updatePayload = {
      title: role,
      status: 'online',
      is_former: false
    };
    if (phone) updatePayload.phone = phone;

    let { error } = await supabase
        .from('thanh_vien')
        .update({ chuc_vu: role, trang_thai: 'online' })
        .eq('mssv', mssv);

    if (error) {
      try {
        await supabase.from('thanh_vien').update(updatePayload).eq('mssv', mssv);
      } catch (e) {}
    }

    // Tự động tính toán & cấp huy chương mới theo Max Rank Policy
    if (typeof updateMemberMedal === 'function') {
      await updateMemberMedal(mssv, role);
    }

    alert(`Đã bổ nhiệm thành công MSSV ${mssv} vào vị trí ${role}!`);
    
    // Làm sạch form
    mssvEl.value = '';
    roleEl.value = '';
    if (phoneEl) phoneEl.value = '';
    
    // Gọi lại hàm tải danh sách BĐH để giao diện cập nhật từ Database thật
    if (typeof loadAdminBoard === 'function') {
        loadAdminBoard();
    }
    if (typeof window.loadAdminManagementTeam === 'function') {
        window.loadAdminManagementTeam();
    }
    if (typeof updateAdminStats === 'function') {
        updateAdminStats();
    }

  } catch (err) {
    console.error('Lỗi khi bổ nhiệm:', err);
    alert('Lỗi: Không thể bổ nhiệm. Vui lòng kiểm tra lại!');
  }
}

async function loadExecutiveBoard() {
  try {
    let { data: members, error } = await supabase
      .from('thanh_vien')
      .select('*');

    if (error || !members || members.length === 0) {
      const mRes = await supabase.from('thanh_vien').select('*');
      if (mRes.data) members = mRes.data;
    }

    if (error) throw error;

    const t1Container = document.getElementById('admin-tier-1');
    const t2Container = document.getElementById('admin-tier-2');
    const t3Container = document.getElementById('admin-tier-3');

    if (!t1Container || !t2Container || !t3Container) return;

    // Ẩn dống chữ Placeholder
    const adminEmptyNotice = document.getElementById('admin-bdh-empty-notice');
    if (adminEmptyNotice) {
      adminEmptyNotice.style.display = 'none';
    }

    // Lọc ra những thành viên cà chức vụ lành ốạo và đang hoạt động (online)
    const keywords = ['Chủ nhiệm', 'Phó', 'Trưởng ban', 'Phó ban', 'Thư ký', 'Ủy viên', 'Ban điều hành'];
    const activeExecutives = members.filter(m => {
      if (m.status !== 'online') return false;
      if (!m.title) return false;
      const titleLower = m.title.toLowerCase();
      if (titleLower === 'thành viên' || titleLower === 'thành viên mới') return false;
      return keywords.some(k => m.title.includes(k));
    });

    // Phân loại thành viên vào 3 mảng
    // Tầng 1: Các thành viên có chức vụ chứa từ 'Chủ nhiệm' (nhưng không chứa chữ 'Phó')
    const tier1Members = activeExecutives.filter(m => m.title.includes('Chủ nhiệm') && !m.title.includes('Phó'));
    
    // Tầng 2: Các thành viên có chức vụ chứa từ 'Phó Chủ nhiệm'
    const tier2Members = activeExecutives.filter(m => m.title.includes('Phó Chủ nhiệm') || (m.title.includes('Chủ nhiệm') && m.title.includes('Phó')));
    
    // Tầng 3: Các thành viên có chức vụ chứa từ 'Trưởng ban', 'Phó ban', 'Thư ký', 'Ủy viên'...
    const tier3Members = activeExecutives.filter(m => !tier1Members.includes(m) && !tier2Members.includes(m));

    // Hàm phụ render cho từng tầng
    const renderTier = (container, list, tierNum) => {
      container.innerHTML = '';
      if (list.length === 0) {
        container.innerHTML = '<p class="empty-data-msg">Chưa cà dữ liệu</p>';
        return;
      }
      
      list.forEach(member => {
        const card = document.createElement('div');
        card.className = 'glass-card';
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.justifyContent = 'space-between';
        card.style.padding = '12px 20px';
        card.style.margin = '0';
        card.style.background = 'rgba(255,255,255,0.02)';
        card.setAttribute('data-rank', member.title || 'Tành viên');
        card.setAttribute('data-mssv', member.mssv);
        
        card.innerHTML = `
          <div style="display: flex; align-items: center; gap: 15px;">
            ${(() => {
              const rawAvt = member.avatar || member.avatar_url || member.hinh_anh;
              const avtSrc = (rawAvt && String(rawAvt).trim() !== '' && !rawAvt.includes('via.placeholder'))
                ? (rawAvt.includes('?') ? `${rawAvt}&t=${Date.now()}` : `${rawAvt}?t=${Date.now()}`)
                : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.full_name || member.name || member.mssv)}`;
              return `<img src="${avtSrc}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; background: rgba(255,255,255,0.1);">`;
            })()}
            <div>
              <h4 style="margin:0; color:#fff; font-size:16px; font-weight:bold;">${member.full_name || member.ho_ten || member.name}</h4>
              <p style="margin:4px 0 0; font-size:13px; color:#00d2ff; font-weight:bold;">
                <span class="card-role">${member.title || 'Ban điều hành'}</span> 
              </p>
            </div>
          </div>
          <button class="btn-edit-admin" onclick="openAdminEditMember(this, ${tierNum})">Điều chỉnh</button>
        `;
        container.appendChild(card);
      });
    };

    renderTier(t1Container, tier1Members, 1);
    renderTier(t2Container, tier2Members, 2);
    renderTier(t3Container, tier3Members, 3);

  } catch (error) {
    console.error('Lỗi khi tải cấu trúc bộ máy hiện tại:', error.message);
  }
}

// Giữ bá danh tương thàch
// Alias removed to fix TDZ - using window.loadAdminManagementTeam instead

async function retireExecutive(mssv) {
  if (confirm('Bạn có chắc chắn muốn chuyển thành viên này sang danh sách Cựu Ban điều hành?')) {
    try {
      const { error } = await supabase
        .from('thanh_vien')
        .update({ is_former: true })
        .eq('mssv', mssv);

      if (error) throw error;
      alert('Đã chuyển thành viên sang danh sách Cựu Ban điều hành!');
      
      if (typeof loadAdminBoard === 'function') {
        loadAdminBoard();
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi khi chuyển trạng thái: ' + e.message);
    }
  }
}

function getMedalIcon(val) {
  if (!val) return '';
  const str = String(val).trim();
  if (str.includes('🏆') || str.includes('nòng cốt') || str.includes('nong cot')) return '🏆';
  if (str.includes('🏅') || str.includes('ưu tú') || str.includes('uu tu')) return '🏅';
  if (str.includes('🥇') || str.includes('cốt cán') || str.includes('cot can')) return '🥇';
  if (str.includes('🥈') || str.includes('tích cực') || str.includes('tich cuc')) return '🥈';
  if (str.includes('🥉') || str.includes('hội viên') || str.includes('hoi vien')) return '🥉';
  if (str.includes('🔰') || str.includes('mới') || str.includes('moi')) return '🔰';
  
  const iconMatch = str.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u);
  return iconMatch ? iconMatch[0] : '';
}
window.getMedalIcon = getMedalIcon;

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
  if (sh >= 60 && gd >= 5 && hd >= 8)   return 4; // 🥇 Bậc 4: Cốt cán
  if (sh >= 20 && gd >= 2 && hd >= 4)   return 3; // 🥈 Bậc 3: Thành viên tích cực
  if (sh >= 8 && gd >= 1 && hd >= 2)    return 2; // 🥉 Bậc 2: Hội viên
  return 1; // 🔰 Bậc 1: Thành viên mới (Default 0)
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

const RANK_ICONS = {
  1: '🔰',
  2: '🥉',
  3: '🥈',
  4: '🥇',
  5: '🏅',
  6: '🏆'
};

// 3. Max Rank Policy update function
async function updateMemberMedal(mssv, chucVuHienTai, statsData) {
  if (!mssv) return '🔰';

  try {
    let sh = 0, gd = 0, hd = 0, currentRole = chucVuHienTai || '';

    if (!statsData || typeof chucVuHienTai === 'undefined') {
      const { data: member } = await supabase
        .from('thanh_vien')
        .select('*')
        .eq('mssv', mssv)
        .maybeSingle();

      if (member) {
        if (typeof chucVuHienTai === 'undefined') {
          currentRole = member.title || member.role || '';
        }
        if (!statsData) {
          sh = parseInt(member.diem_sinh_hoat ?? member.sinhhoat ?? member.buoi_sinh_hoat) || 0;
          gd = parseInt(member.diem_giai_dau ?? member.giaidau ?? member.giai_dau) || 0;
          hd = parseInt(member.diem_hoat_dong ?? member.hoatdong ?? member.hoat_dong) || 0;
        }
      }
    }

    if (statsData) {
      sh = parseInt(statsData.sh ?? statsData.buoi_sinh_hoat ?? statsData.sinhhoat ?? statsData.diem_sinh_hoat) || 0;
      gd = parseInt(statsData.gd ?? statsData.giai_dau ?? statsData.giaidau ?? statsData.diem_giai_dau) || 0;
      hd = parseInt(statsData.hd ?? statsData.hoat_dong ?? statsData.hoatdong ?? statsData.diem_hoat_dong) || 0;
    }

    const rankTuStats = calculateStatRank(sh, gd, hd);
    const rankTuRole = calculateRoleRank(currentRole);

    const finalRank = Math.max(rankTuStats, rankTuRole);
    const badgeInfo = getBadgeInfo(finalRank);
    const finalIcon = badgeInfo.icon;
    const finalBadgeText = badgeInfo.text;

    const oldIcon = localStorage.getItem('medal_' + mssv) || '';
    localStorage.setItem('medal_' + mssv, finalBadgeText);

    // CRITICAL: Update ONLY huy_chuong column in Supabase (NO TOUCHING OF CONTRIBUTION POINTS SCORE COLUMNS)
    const { error: err1 } = await supabase
      .from('thanh_vien')
      .update({ huy_chuong: finalBadgeText })
      .eq('mssv', mssv);

    if (err1) {
      const { error: err2 } = await supabase.from('thanh_vien').update({ medals: finalBadgeText }).eq('mssv', mssv);
      if (err2) {
        await supabase.from('thanh_vien').update({ achievements: finalBadgeText }).eq('mssv', mssv);
      }
    }

    if (oldIcon && oldIcon !== finalIcon && oldIcon !== finalBadgeText) {
      const msg = `🎉 Thành viên ${mssv} đã thăng cấp danh hiệu: ${finalBadgeText}!`;
      const toast = document.getElementById('admin-toast') || document.getElementById('toast');
      if (toast) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
      }
    }

    // Dynamic UI Update: ONLY change badge image src and description text, keeping all other profile elements intact
    const rankImg = document.getElementById('membership-rank');
    if (rankImg) rankImg.src = badgeInfo.badgeSrc;
    const rankTextEl = document.getElementById('membership-rank-text');
    if (rankTextEl) rankTextEl.textContent = badgeInfo.text;

    const iconSpan = document.getElementById(`medal-icon-${mssv}`);
    if (iconSpan) {
      iconSpan.textContent = finalIcon;
    }

    return finalIcon;
  } catch (err) {
    console.error(`Lỗi tự động cập nhật huy chương cho ${mssv}:`, err);
    return '🔰';
  }
}
window.updateMemberMedal = updateMemberMedal;

// 4. Sync toàn bộ user khi khởi tạo ứng dụng (Max Rank Policy)
async function syncAllMedals() {
  try {
    const client = window.supabase || supabase;
    if (!client) return;

    const { data: members, error } = await client
      .from('thanh_vien')
      .select('*');

    if (error || !members) return;

    for (const m of members) {
      if (!m.mssv) continue;
      const role = m.title || m.role || m.chuc_vu || '';
      const sh = parseInt(m.diem_sinh_hoat ?? m.sinhhoat ?? m.buoi_sinh_hoat) || 0;
      const gd = parseInt(m.diem_giai_dau ?? m.giaidau ?? m.giai_dau) || 0;
      const hd = parseInt(m.diem_hoat_dong ?? m.hoatdong ?? m.hoat_dong) || 0;

      const rankTuStats = calculateStatRank(sh, gd, hd);
      const rankTuRole = calculateRoleRank(role);

      const finalRank = Math.max(rankTuStats, rankTuRole);
      const badgeInfo = getBadgeInfo(finalRank);
      const finalIcon = badgeInfo.icon;
      const finalBadgeText = badgeInfo.text;

      const currentDbMedal = m.huy_chuong || m.medals || m.achievements || '';

      localStorage.setItem('medal_' + m.mssv, finalBadgeText);

      if (currentDbMedal !== finalBadgeText && currentDbMedal !== finalIcon) {
        await client
          .from('thanh_vien')
          .update({ huy_chuong: finalBadgeText })
          .eq('mssv', m.mssv);
      }
    }
  } catch (err) {
    console.warn("Lỗi syncAllMedals:", err);
  }
}
window.syncAllMedals = syncAllMedals;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    syncAllMedals();
  });
} else {
  syncAllMedals();
}

let selectedExecutiveMssv = null;

function selectExecutiveCard(cardEl, mssv, encodedName) {
  const fullName = decodeURIComponent(encodedName);
  selectedExecutiveMssv = mssv;

  document.querySelectorAll('.executive-card-public').forEach(c => {
    c.style.borderColor = '';
    c.style.boxShadow = '';
    c.classList.remove('active-card-glow');
  });

  if (cardEl) {
    cardEl.style.borderColor = '#64ffda';
    cardEl.style.boxShadow = '0 0 15px rgba(100,255,218,0.4)';
    cardEl.classList.add('active-card-glow');
  }

  const infoEl = document.getElementById('selected-executive-name');
  if (infoEl) {
    infoEl.innerHTML = `Đang chọn: <strong style="color: #64ffda;">${fullName}</strong> (<span style="color: #0ea5e9;">${mssv.toUpperCase()}</span>)`;
  }

  const btnRetire = document.getElementById('btn-quick-retire');
  if (btnRetire) {
    btnRetire.disabled = false;
    btnRetire.classList.remove('opacity-50', 'cursor-not-allowed');
    btnRetire.classList.add('cursor-pointer');
  }
}
window.selectExecutiveCard = selectExecutiveCard;

function triggerSelectedRetire() {
  if (!selectedExecutiveMssv) {
    alert('Vui lòng click chọn 1 nhân sự từ danh sách bán trái!');
    return;
  }
  retireExecutive(selectedExecutiveMssv);
}
window.triggerSelectedRetire = triggerSelectedRetire;

let currentEditMedalMssv = null;

function closeMedalModal() {
  const modal = document.getElementById('modal-edit-medal');
  if (modal) {
    modal.style.display = 'none';
  }
}
window.closeMedalModal = closeMedalModal;

// Manual edit medal modal functions removed - Medals are now 100% automated via updateMemberMedal (Max Rank Policy).





// ==========================================================================
// ACTIVITIES MANAGEMENT SECTION
// ==========================================================================

let currentAttendanceActivity = null;

// Helper to get & initialize club members array from localStorage
function getClubMembers() {
  let members = localStorage.getItem('club_members');
  if (!members) {
    const defaultMembers = [];
    localStorage.setItem('club_members', JSON.stringify(defaultMembers));
    return defaultMembers;
  }
  return JSON.parse(members);
}

// Fetch activities from Supabase and render to #activity-list-body
async function loadAdminActivities() {
  const tbody = document.getElementById('activity-list-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: rgba(255,255,255,0.6);">Đang kết nối cơ sở dữ liệu...</td></tr>';

  try {
    const { data: activities, error } = await supabase
      .from('lich_su_hoat_dong')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    tbody.innerHTML = '';

    if (!activities || activities.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-data-msg">Chưa cà dữ liệu</td></tr>';
      return;
    }

    activities.forEach(act => {
      const nameVal = act.ten_hoat_dong || act.name || 'Hoạt động chưa đặt tên';
      const typeVal = act.phan_loai || act.type || 'Hoạt động';
      
      let dateVal = act.thoi_gian || act.date || '';
      if (dateVal && dateVal.includes('-')) {
        const parts = dateVal.split('T')[0].split('-');
        if (parts.length === 3) dateVal = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }

      let badgeHTML = '';
      const typeLower = typeVal.toLowerCase();
      if (typeLower.includes('sinh hoạt') || typeLower.includes('sinhhoat')) {
        badgeHTML = '<span class="badge-type type-sinhhoat">Buổi sinh hoạt</span>';
      } else if (typeLower.includes('giải đấu') || typeLower.includes('giaidau')) {
        badgeHTML = '<span class="badge-type type-giaidau">Giải đấu</span>';
      } else {
        badgeHTML = '<span class="badge-type type-hoatdong">Hoạt động CLB</span>';
      }

      const escapedName = nameVal.replace(/'/g, "\\'").replace(/"/g, "&quot;");
      const escapedType = typeVal.replace(/'/g, "\\'").replace(/"/g, "&quot;");

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 500;">${nameVal}</td>
        <td>${badgeHTML}</td>
        <td>${dateVal}</td>
        <td style="display: flex; gap: 8px; align-items: center;">
          <button class="btn-submit" style="width: auto; padding: 6px 14px; font-size: 13px; margin: 0; background: #0055ff; color: #fff; font-weight: bold; cursor: pointer;" onclick="openActivityAttendanceModal('${act.id}', '${escapedName}', '${escapedType}')">Điểm danh</button>
          <button class="btn-delete-admin" style="margin: 0;" onclick="triggerDeleteActivity('${act.id}', '${escapedName}')">Xóa</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error("Lỗi nạp danh sách hoạt động từ Supabase:", e);
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #ef4444; padding: 20px;">Lỗi tải dữ liệu</td></tr>`;
  }
}

// Fetch & Populate member checkboxes before opening modal
async function openAddActivityModal() {
  const searchInput = document.getElementById('search-member-input');
  if (searchInput) {
    searchInput.value = '';
    if (!searchInput.dataset.filterListenerAttached) {
      searchInput.dataset.filterListenerAttached = 'true';
      searchInput.addEventListener('input', function(e) {
        const term = e.target.value.toLowerCase().trim();
        const items = document.querySelectorAll('#member-checkbox-list .member-checkbox-item');
        items.forEach(item => {
          const name = (item.getAttribute('data-name') || '').toLowerCase();
          const mssv = (item.getAttribute('data-mssv') || '').toLowerCase();
          if (name.includes(term) || mssv.includes(term)) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        });
      });
    }
  }

  const listContainer = document.getElementById('member-checkbox-list');
  if (listContainer) {
    listContainer.innerHTML = '<p style="color: rgba(255,255,255,0.6); font-size: 13px; margin: 0; padding: 10px;">Đang tải danh sách thành viên...</p>';
    
    let membersData = null;
    try {
      const { data: members, error } = await supabase
        .from('thanh_vien')
        .select('*')
        .neq('mssv', 'admin')
        .order('full_name', { ascending: true });

      if (!error && members && members.length > 0) {
        membersData = members;
      }
    } catch (e) {}

    if (!membersData || membersData.length === 0) {
      try {
        const cached = localStorage.getItem('club_members');
        if (cached) membersData = JSON.parse(cached);
      } catch (e) {}
    }

    if (!membersData || membersData.length === 0) {
      membersData = window.mockMembers || [];
    }

    listContainer.innerHTML = '';

    if (!membersData || membersData.length === 0) {
      listContainer.innerHTML = '<p class="empty-data-msg">Chưa cà dữ liệu</p>';
    } else {
      membersData.forEach(member => {
          const name = member.full_name || member.name || member.mssv || 'Tành viên';
          const rawAvt = member.avatar || member.avatar_url || member.hinh_anh;
          const avatarUrl = (rawAvt && String(rawAvt).trim() !== '' && !rawAvt.includes('via.placeholder'))
            ? (rawAvt.includes('?') ? `${rawAvt}&t=${Date.now()}` : `${rawAvt}?t=${Date.now()}`)
            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.mssv}`;
          const classInfo = member.class_name || member.class || '';

          const label = document.createElement('label');
          label.className = 'member-checkbox-item';
          label.setAttribute('data-name', name);
          label.setAttribute('data-mssv', member.mssv);
          label.style.display = 'flex';
          label.style.alignItems = 'center';
          label.style.gap = '10px';
          label.style.cursor = 'pointer';
          label.style.fontSize = '14px';
          label.style.color = 'rgba(255,255,255,0.9)';
          label.style.padding = '6px 8px';
          label.style.borderRadius = '6px';
          label.style.background = 'rgba(255,255,255,0.03)';
          label.style.marginBottom = '4px';

          label.innerHTML = `
            <input type="checkbox" value="${member.mssv}" style="width: 16px; height: 16px; cursor: pointer; accent-color: #0055ff;">
            <img src="${avatarUrl}" alt="${name}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.2);">
            <div style="display: flex; flex-direction: column; overflow: hidden;">
              <span style="font-size: 13px; font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name}</span>
              <span style="font-size: 11px; color: rgba(255,255,255,0.55);">${member.mssv}${classInfo ? ' ⬢ ' + classInfo : ''}</span>
            </div>
          `;
          listContainer.appendChild(label);
      });
    }
  }

  openAdminModal('modal-add-activity');
}

async function loadThanhVienChoForm() {
  const container = document.getElementById('khungChonThanhVien') || document.getElementById('member-checkbox-list');
  if (!container) return;
  container.innerHTML = 'Đang tải danh sách...';

  try {
    let data = null;
    let error = null;

    const resThanhVien = await supabase.from('thanh_vien').select('mssv, ho_ten').order('ho_ten');
    data = resThanhVien.data;
    error = resThanhVien.error;

    if (error || !data || data.length === 0) {
      const resMembers = await supabase.from('thanh_vien').select('mssv, full_name, name').order('full_name');
      if (resMembers.data) {
        data = resMembers.data.map(m => ({ mssv: m.mssv, ho_ten: m.full_name || m.name || m.mssv }));
        error = null;
      }
    }

    if (error && (!data || data.length === 0)) throw error;
    
    container.innerHTML = '';
    // Lọc bỏ những tài khoản có mssv là 'admin' hoặc tên là 'Quản trị hệ thống'
    const danhSachHopLe = (data || []).filter(user => user.mssv !== 'admin' && user.ho_ten !== 'Quản trị hệ thống');
    
    if (danhSachHopLe.length === 0) {
      container.innerHTML = '<span style="color:#888;">Chưa cà dữ liệu thành viên.</span>';
      return;
    }

    danhSachHopLe.forEach(user => {
      container.innerHTML += `
        <label style="display: block; margin-bottom: 8px; cursor: pointer;">
          <input type="checkbox" class="chk-tv-tham-gia" value="${user.mssv}"> 
          ${user.ho_ten} <small style="color:#888;">(${user.mssv})</small>
        </label>
      `;
    });
  } catch (err) {
    console.error('Lỗi loadThanhVienChoForm:', err);
    container.innerHTML = 'Lỗi tải dữ liệu thành viên.';
  }
}
document.addEventListener('DOMContentLoaded', loadThanhVienChoForm);
window.loadThanhVienChoForm = loadThanhVienChoForm;

window.xemNguoiThamGia = async function(mssvString) {
  if (!mssvString || mssvString === 'null' || mssvString === 'undefined' || (typeof mssvString === 'string' && mssvString.trim() === '')) {
    alert('Không cà dữ liệu người tham gia.');
    return;
  }
  
  const mangMSSV = Array.isArray(mssvString) 
    ? mssvString 
    : mssvString.split(',').map(s => s.trim()).filter(Boolean);

  if (mangMSSV.length === 0) {
    alert('Không cà dữ liệu người tham gia.');
    return;
  }

  try {
    let { data, error } = await supabase
      .from('thanh_vien')
      .select('ho_ten, mssv')
      .in('mssv', mangMSSV);

    if (error || !data || data.length === 0) {
      const resMembers = await supabase
        .from('thanh_vien')
        .select('full_name, name, mssv')
        .in('mssv', mangMSSV);
      if (resMembers.data) {
        data = resMembers.data.map(m => ({ ho_ten: m.full_name || m.name || m.mssv, mssv: m.mssv }));
        error = null;
      }
    }

    if (error) throw error;

    // A. Xây dựng cấu trúc Bảng HTML
    let tableHTML = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; color: #e2e8f0; font-size: 0.95rem;">
        <thead>
          <tr style="background-color: #1e293b; border-bottom: 2px solid #334155;">
            <th style="padding: 12px; text-align: center; width: 50px;">STT</th>
            <th style="padding: 12px; text-align: left;">Họ và Tên</th>
            <th style="padding: 12px; text-align: center;">MSSV</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    if (data && data.length > 0) {
      data.forEach((user, index) => {
        tableHTML += `
          <tr style="border-bottom: 1px solid #334155; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#1e293b'" onmouseout="this.style.backgroundColor='transparent'">
            <td style="padding: 12px; text-align: center;">${index + 1}</td>
            <td style="padding: 12px; font-weight: 500; color: #fff;">${user.ho_ten}</td>
            <td style="padding: 12px; text-align: center; color: #94a3b8;">${user.mssv}</td>
          </tr>
        `;
      });
    } else {
      tableHTML += `<tr><td colspan="3" style="padding: 12px; text-align: center; color: #aaa;">Không tìm thấy thông tin chi tiết.</td></tr>`;
    }
    tableHTML += `</tbody></table>`;

    // B. Tạo Modal nội trên môn ành
    const modalId = 'modalDanhSachThamGia';
    let modal = document.getElementById(modalId);
    if (modal) modal.remove(); // Dọn dẹp modal cũ nếu cà

    modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(5px); opacity: 0; transition: opacity 0.3s ease;";
    
    modal.innerHTML = `
      <div style="background: #0f172a; padding: 25px 30px; border-radius: 12px; width: 90%; max-width: 550px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); border: 1px solid #334155; transform: translateY(-20px); transition: transform 0.3s ease;">
        <h3 style="margin: 0 0 10px 0; color: #38bdf8; text-align: center; font-size: 1.3rem; text-transform: uppercase; letter-spacing: 1px;">danh sách tham gia</h3>
        
        <div style="max-height: 350px; overflow-y: auto; padding-right: 5px;" class="custom-scrollbar">
          ${tableHTML}
        </div>
        
        <div style="text-align: right; margin-top: 25px;">
          <button onclick="document.getElementById('${modalId}').remove()" style="background: #334155; color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 0.9rem; transition: background 0.2s;" onmouseover="this.style.background='#475569'" onmouseout="this.style.background='#334155'">
            Đóng bảng
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);

    // Hiệu ứng Fade-in mượt mà
    setTimeout(() => {
      modal.style.opacity = '1';
      modal.firstElementChild.style.transform = 'translateY(0)';
    }, 10);

  } catch (err) {
    console.error(err);
    alert('Lỗi tải danh sách người tham gia!');
  }
};

window.triggerDeleteActivity = function(idHoatDong, name) {
  const actName = name || 'hoạt động này';
  showConfirmModal(`Bạn có chắc chắn muốn xóa hoạt động "${actName}" không? Điểm của các thành viên tham gia cũng sẽ bị TRỪ ĐI tương ứng!`, async () => {
    try {
      const sbClient = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
      if (!sbClient) {
        showToast('❌ Không thể kết nối cơ sở dữ liệu Supabase!', 'error');
        return;
      }

      // 1. Lấy thông tin hoạt động trước khi xóa
      let hoatDong = null;
      try {
        const { data: hdData } = await sbClient
          .from('lich_su_hoat_dong')
          .select('phan_loai, nguoi_tham_gia')
          .eq('id', idHoatDong)
          .maybeSingle();
        if (hdData) hoatDong = hdData;
      } catch (e) {}

      // 2. Xóa khỏi Supabase
      const { error: errDel } = await sbClient
        .from('lich_su_hoat_dong')
        .delete()
        .eq('id', idHoatDong);

      if (errDel) throw errDel;

      // 3. Hoàn tác trừ điểm thành viên tham gia
      if (hoatDong && hoatDong.nguoi_tham_gia) {
        let mangMSSV = Array.isArray(hoatDong.nguoi_tham_gia) 
                       ? hoatDong.nguoi_tham_gia 
                       : hoatDong.nguoi_tham_gia.split(',');

        for (const mssvRaw of mangMSSV) {
          const mssv = typeof mssvRaw === 'string' ? mssvRaw.trim() : mssvRaw;
          if (!mssv || mssv === 'null' || mssv === 'undefined') continue;
          
          let { data: user } = await sbClient
            .from('thanh_vien')
            .select('diem_giai_dau, diem_hoat_dong')
            .eq('mssv', mssv)
            .maybeSingle();
            
          if (user) {
            let dataUpdate = {};
            if (hoatDong.phan_loai === 'Giải đấu') {
              dataUpdate = { diem_giai_dau: Math.max(0, (user.diem_giai_dau || 0) - 1) };
            } else if (hoatDong.phan_loai === 'Hoạt động') {
              dataUpdate = { diem_hoat_dong: Math.max(0, (user.diem_hoat_dong || 0) - 1) };
            }
            
            if (Object.keys(dataUpdate).length > 0) {
               await sbClient.from('thanh_vien').update(dataUpdate).eq('mssv', mssv);
            }
          }
        }
      }

      showToast('Xóa hoạt động thành công!', 'success');
      if (typeof loadDanhSachHoatDong === 'function') await loadDanhSachHoatDong();
      if (typeof loadAdminActivities === 'function') await loadAdminActivities();
      if (typeof loadAdminMembers === 'function') await loadAdminMembers();
      if (typeof loadBangXepHang === 'function') await loadBangXepHang();
    } catch (err) {
      console.error('Lỗi khi xóa hoạt động:', err);
      showToast('Lỗi khi xóa hoạt động!', 'error');
    }
  }, 'Xác Nhận Xóa Hoạt Động');
};

window.xoaHoatDong = window.triggerDeleteActivity;
window.deleteAdminActivity = window.triggerDeleteActivity;

async function loadDanhSachHoatDong() {
  const tbody = document.getElementById('bangHoatDongAdmin') || document.getElementById('activity-list-body');
  if (!tbody) return;

  try {
    const resLS = await supabase
      .from('lich_su_hoat_dong')
      .select('*')
      .order('id', { ascending: false });

    if (resLS.error) throw resLS.error;
    const data = resLS.data;
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chưa có hoạt động nào</td></tr>';
      return;
    }

    data.forEach(hd => {
      const idVal = hd.id;
      const tenVal = hd.ten_hoat_dong || hd.name || 'Hoạt động';
      const phanLoaiVal = hd.phan_loai || hd.type || 'Hoạt động';
      const thoiGianVal = hd.thoi_gian || hd.date || '-';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${tenVal}</strong></td>
        <td>${phanLoaiVal}</td>
        <td>${thoiGianVal}</td>
        <td>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button onclick="xemNguoiThamGia('${Array.isArray(hd.nguoi_tham_gia) ? hd.nguoi_tham_gia.join(',') : (hd.nguoi_tham_gia || '')}')" 
                    style="background-color: #3b82f6; color: white; border: none; padding: 6px 18px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: background 0.2s;" onmouseover="this.style.backgroundColor='#2563eb'" onmouseout="this.style.backgroundColor='#3b82f6'">
              Xem
            </button>
            <button onclick="triggerDeleteActivity('${hd.id}', '${tenVal.replace(/'/g, "\\'")}')" 
                    style="background-color: #ef4444; color: white; border: none; padding: 6px 18px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: background 0.2s;" onmouseover="this.style.backgroundColor='#dc2626'" onmouseout="this.style.backgroundColor='#ef4444'">
              Xóa
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Lỗi tải danh sách hoạt động:', error);
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: red;">Lỗi tải dữ liệu</td></tr>';
  }
}

// Gọi hàm khi tải trang
document.addEventListener('DOMContentLoaded', loadDanhSachHoatDong);
window.loadDanhSachHoatDong = loadDanhSachHoatDong;
window.loadAdminActivities = loadDanhSachHoatDong;

let isSubmittingActivity = false;

// Submit Form thêm Hoạt động mới -> Lưu CSDL Supabase
async function submitAdminNewActivity(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }

  if (isSubmittingActivity) return;
  isSubmittingActivity = true;

  const phanLoaiEl = document.getElementById('phanLoaiHoatDong') || document.getElementById('activity-type');
  const tenEl = document.getElementById('tenHoatDong') || document.getElementById('activity-name');
  const thoiGianEl = document.getElementById('thoiGianToChuc') || document.getElementById('activity-date');
  const diaDiemEl = document.getElementById('diaDiemToChuc') || document.getElementById('activity-location');

  const phanLoai = phanLoaiEl ? phanLoaiEl.value : 'Hoạt động';
  const ten = tenEl ? tenEl.value.trim() : '';
  const thoiGian = thoiGianEl ? thoiGianEl.value : '';
  const diaDiem = diaDiemEl ? diaDiemEl.value.trim() : '';

  // Lấy danh sách MSSV đã chọn
  const checkedBoxes = document.querySelectorAll('#khungChonThanhVien input[type="checkbox"]:checked, #member-checkbox-list input[type="checkbox"]:checked, .chk-tv-tham-gia:checked');
  const dsNguoiThamGia = Array.from(new Set(Array.from(checkedBoxes).map(cb => cb.value).filter(Boolean)));

  if (!ten || !thoiGian || dsNguoiThamGia.length === 0) {
    alert('⚠️ Vui lòng nhập Tên hoạt động, chọn Thời gian và tích chọn ít nhất 1 thành viên!');
    isSubmittingActivity = false;
    return;
  }

  const btnLuu = document.getElementById('btnLuuHoatDong');
  const originalText = btnLuu ? btnLuu.textContent : 'Lưu Hoạt Động';
  if (btnLuu) {
    btnLuu.disabled = true;
    btnLuu.textContent = 'Đang lưu...';
  }

  try {
    // 1. Lưu DUY NHẤT 1 bản ghi vào lich_su_hoat_dong có đầy đủ thông tin
    const { data: dataLS, error: errLS } = await supabase.from('lich_su_hoat_dong').insert([{
      ten_hoat_dong: ten, 
      phan_loai: phanLoai, 
      thoi_gian: thoiGian, 
      dia_diem: diaDiem, 
      nguoi_tham_gia: dsNguoiThamGia
    }]).select();

    if (errLS) {
      console.error('Lỗi khi lưu hoạt động:', errLS);
      alert('LỖI: ' + (errLS.message || errLS));
      return;
    }

    // 2. Cộng điểm cho từng người tham gia (chỉ cập nhật 1 lần)
    for (const mssv of dsNguoiThamGia) {
      const { data: user } = await supabase.from('thanh_vien').select('diem_giai_dau, diem_hoat_dong').eq('mssv', mssv).maybeSingle();
      
      if (user) {
        let dataUpdate = {};
        if (phanLoai === 'Giải đấu') {
          dataUpdate = { diem_giai_dau: (user.diem_giai_dau || 0) + 1 };
        } else if (phanLoai === 'Hoạt động') {
          dataUpdate = { diem_hoat_dong: (user.diem_hoat_dong || 0) + 1 };
        }
        
        if (Object.keys(dataUpdate).length > 0) {
          await supabase.from('thanh_vien').update(dataUpdate).eq('mssv', mssv);
        }
      }
    }

    alert('✅ Lưu hoạt động và Cộng điểm thành công!');
    if (typeof loadDanhSachHoatDong === 'function') await loadDanhSachHoatDong();
    if (typeof loadAdminActivities === 'function') await loadAdminActivities();

    // Reset form
    if (tenEl) tenEl.value = '';
    checkedBoxes.forEach(cb => cb.checked = false);

    // Đóng modal
    const modal = document.getElementById('modal-add-activity');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.add('hidden');
    }

    if (typeof loadAdminMembers === 'function') loadAdminMembers();

  } catch (error) {
    console.error('Lỗi khi thêm hoạt động:', error);
    alert('LỖI: ' + (error.message || error));
  } finally {
    isSubmittingActivity = false;
    if (btnLuu) {
      btnLuu.disabled = false;
      btnLuu.textContent = originalText;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const formAddAct = document.getElementById('form-add-activity');
  if (formAddAct) {
    formAddAct.onsubmit = async (e) => {
      e.preventDefault();
      await submitAdminNewActivity(e);
    };
  }
  const btnLuu = document.getElementById('btnLuuHoatDong');
  if (btnLuu) {
    btnLuu.onclick = async (e) => {
      e.preventDefault();
      await submitAdminNewActivity(e);
    };
  }
});
// Xóa hoạt động khỏi Supabase
async function deleteAdminActivity(id, name) {
  const actName = name || 'hoạt động này';
  showConfirmModal(`Bạn có chắc chắn muốn xóa hoạt động "${actName}" không?`, async () => {
    try {
      const sbClient = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
      if (!sbClient) {
        showToast('❌ Không thể kết nối cơ sở dữ liệu Supabase!', 'error');
        return;
      }

      // Lệnh xóa trên Supabase (Thử bảng lich_su_hoat_dong trước, fallback activities/hoat_dong)
      let { error } = await sbClient
        .from('lich_su_hoat_dong')
        .delete()
        .eq('id', id);

      if (error) {
        const fallRes = await sbClient.from('lich_su_hoat_dong').delete().eq('id', id);
        if (!fallRes.error) {
          error = null;
        } else {
          const fallRes2 = await sbClient.from('hoat_dong').delete().eq('id', id);
          if (!fallRes2.error) error = null;
        }
      }

      if (error) throw error;

      // Thống báo thành công bằng Toast
      showToast('Xóa hoạt động thành công!', 'success');

      // Gọi lại hàm load danh sách hoạt động để làm mới bảng
      if (typeof loadAdminActivities === 'function') {
        await loadAdminActivities();
      }
      if (typeof window.loadPublicBoard === 'function') {
        await window.loadPublicBoard();
      }
    } catch (err) {
      console.error('Lỗi khi xóa hoạt động:', err);
      showToast('Có lỗi xảy ra khi xóa!', 'error');
    }
  }, 'Xác Nhận Xóa Hoạt Đ?"ng');
}

let isCameraOpen = false;
let html5QrCode = null;

function getHtml5QrCodeCore() {
    if (!html5QrCode) {
        try {
            html5QrCode = new Html5Qrcode("reader");
        } catch (e) {
            console.warn("Không thể khởi tạo Html5Qrcode core:", e);
        }
    }
    return html5QrCode;
}

// 2. HÀM TẮT CAMERA AN TOÀN
function tatCamera() {
    const readerContainer = document.getElementById('readerContainer');
    const txtToggleCamera = document.getElementById('txtToggleCamera');
    const btnToggleCamera = document.getElementById('btnToggleCamera');

    if (isCameraOpen && html5QrCode) {
        html5QrCode.stop().then(() => {
            isCameraOpen = false;
            if (readerContainer) readerContainer.classList.add('hidden');
            if (txtToggleCamera) txtToggleCamera.innerText = 'BẬT CAMERA QUÉT MÃ';
            if (btnToggleCamera) {
                btnToggleCamera.classList.replace('from-rose-600', 'from-blue-600');
                btnToggleCamera.classList.replace('to-red-600', 'to-indigo-600');
                btnToggleCamera.classList.replace('shadow-rose-500/30', 'shadow-blue-500/30');
            }
        }).catch(err => {
            console.error("Lỗi tắt camera:", err);
            isCameraOpen = false;
            if (readerContainer) readerContainer.classList.add('hidden');
            if (txtToggleCamera) txtToggleCamera.innerText = 'BẬT CAMERA QUÉT MÃ';
        });
    } else {
        isCameraOpen = false;
        if (readerContainer) readerContainer.classList.add('hidden');
        if (txtToggleCamera) txtToggleCamera.innerText = 'BẬT CAMERA QUÉT MÃ';
    }
}
window.tatCamera = tatCamera;

// 3. LOGIC NÚT BẬT/TẮT TRỰC TIẾP
function initAttendanceTab() {
    const btnToggleCamera = document.getElementById('btnToggleCamera');
    const txtToggleCamera = document.getElementById('txtToggleCamera');
    const readerContainer = document.getElementById('readerContainer');
    const ketQuaDiv = document.getElementById('ketQuaDiemDanh');
    const inputMSSV = document.getElementById('inputMSSV') || document.getElementById('inputQuetQR');

    if (btnToggleCamera && !btnToggleCamera.dataset.listenerAttached) {
        btnToggleCamera.dataset.listenerAttached = 'true';
        btnToggleCamera.addEventListener('click', () => {
            if (!isCameraOpen) {
                const qrCore = getHtml5QrCodeCore();
                if (!qrCore) {
                    alert("❌ Thư viện quét mã QR chưa sẵn sàng!");
                    return;
                }

                // Cấu hình UI nút bấm
                if (readerContainer) readerContainer.classList.remove('hidden');
                if (ketQuaDiv) ketQuaDiv.classList.add('hidden'); // Giấu bảng kết quả cũ
                if (txtToggleCamera) txtToggleCamera.innerText = 'TẮT CAMERA';
                btnToggleCamera.classList.replace('from-blue-600', 'from-rose-600');
                btnToggleCamera.classList.replace('to-indigo-600', 'to-red-600');
                btnToggleCamera.classList.replace('shadow-blue-500/30', 'shadow-rose-500/30');

                // CẤU HÌNH TỐI ƯU QUÉT NHANH
                const config = { 
                    fps: 30, // Tốc độ khung hình cao để bắt nét siêu tốc
                    qrbox: { width: 250, height: 250 }, 
                    aspectRatio: 1.0 
                };

                // Kích hoạt thẳng Camera sau (environment)
                qrCore.start(
                    { facingMode: "environment" }, 
                    config, 
                    onScanSuccess
                ).then(() => {
                    isCameraOpen = true;
                }).catch((err) => {
                    console.error("Lỗi mở camera:", err);
                    alert("❌ Không thể bật Camera! Vui lòng cấp quyền truy cập Camera cho trình duyệt.");
                    tatCamera(); // Trả lại giao diện nếu lỗi
                });

            } else {
                tatCamera();
            }
        });
    }

    if (inputMSSV && !inputMSSV.dataset.listenerAttached) {
        inputMSSV.dataset.listenerAttached = 'true';
        inputMSSV.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const val = e.target.value ? e.target.value.trim() : '';
                if (val) xuLyDiemDanh(val);
            }
        });
    }
}

// LOGIC HIỂN THỊ HỒ SƠ SAU KHI QUÉT THÀNH CÔNG (TÁI SỬ DỤNG MODAL HỒ SƠ)
async function xuLyDiemDanh(mssv) {
    if (!mssv) return;
    const cleanMssv = String(mssv).trim();
    if (!cleanMssv) return;
    
    // Xóa trắng ô nhập
    const inputKhuVuc = document.getElementById('inputMSSV') || document.getElementById('inputQuetQR');
    if (inputKhuVuc) inputKhuVuc.value = '';

    try {
        // 1. Ghi nhận dữ liệu điểm danh vào Supabase
        const client = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
        if (client) {
            try {
                await client
                    .from('lich_su_hoat_dong')
                    .insert([{ mssv: cleanMssv, loai_hoat_dong: 'Sinh hoạt', ghi_chu: 'Điểm danh tự động' }]);
            } catch (errDiemDanh) {
                console.warn('Lỗi ghi nhận lịch sử:', errDiemDanh);
            }

            // Đồng thời cộng điểm sinh hoạt
            try {
                const { data: tvData } = await client.from('thanh_vien').select('diem_sinh_hoat').eq('mssv', cleanMssv).maybeSingle();
                if (tvData) {
                    await client.from('thanh_vien').update({ diem_sinh_hoat: (tvData.diem_sinh_hoat || 0) + 1 }).eq('mssv', cleanMssv);
                }
                const { data: memData } = await client.from('thanh_vien').select('diem_sinh_hoat, sinhhoat').eq('mssv', cleanMssv).maybeSingle();
                if (memData) {
                    const newCnt = (parseInt(memData.diem_sinh_hoat || memData.sinhhoat || 0) || 0) + 1;
                    await client.from('thanh_vien').update({ diem_sinh_hoat: newCnt, sinhhoat: newCnt }).eq('mssv', cleanMssv);
                }
            } catch (eCnt) {}
        }

        // 2. Tắt camera đi cho nhẹ máy (Gọi hàm tatCamera() đã viết ở phần trước)
        if (typeof tatCamera === 'function') tatCamera();

        // 3. Triệu hồi nguyên vẹn bảng Hồ sơ cá nhân có sẵn
        if (typeof window.xemHoSo === 'function') {
            await window.xemHoSo(cleanMssv);
        }

        // 4. Kích hoạt hiện chữ "ĐÃ ĐIỂM DANH" và nút "OK"
        const badge = document.getElementById('badgeDiemDanh');
        const btnOk = document.getElementById('btnOkDiemDanh');
        if (badge) badge.classList.remove('hidden');
        if (btnOk) btnOk.classList.remove('hidden');

        if (typeof loadAdminMembers === 'function') loadAdminMembers();
        if (typeof loadBangXepHang === 'function') loadBangXepHang();

    } catch (err) {
        console.error('Lỗi điểm danh:', err);
    }
}
window.xuLyDiemDanh = xuLyDiemDanh;

// BƯỚC 3: Xóa dấu vết khi đóng Hồ sơ
function dongModalHoSo() {
    if (typeof closeModal === 'function') {
        closeModal('modal-member-detail');
        closeModal('modalHoSo');
    } else {
        const m1 = document.getElementById('modal-member-detail');
        const m2 = document.getElementById('modalHoSo');
        if (m1) { m1.style.display = 'none'; m1.classList.add('hidden'); }
        if (m2) { m2.style.display = 'none'; m2.classList.add('hidden'); }
    }

    const badge = document.getElementById('badgeDiemDanh');
    const btnOk = document.getElementById('btnOkDiemDanh');
    if (badge) badge.classList.add('hidden');
    if (btnOk) btnOk.classList.add('hidden');
}
window.dongModalHoSo = dongModalHoSo;

function onScanSuccess(decodedText) {
    if (isCameraOpen) {
        tatCamera(); // Chụp được mã là tắt Cam ngay cho đỡ nặng máy
        xuLyDiemDanh(decodedText); // Gọi hàm ốiểm danh
    }
}
function onScanFailure(error) { /* Im lặng bỏ qua khi chưa bắt nét được mã */ }

window.processAttendanceScan = async function(scannedText) {
  const inputEl = document.getElementById('inputMSSV') || document.getElementById('inputQuetQR');
  const code = (scannedText || (inputEl ? inputEl.value : '')).trim();

  if (!code) {
    if (typeof showAdminToast === 'function') {
      showAdminToast('⚠️ Vui lòng quét mã hoặc nhập MSSV!', true);
    } else {
      alert('⚠️ Vui lòng quét mã hoặc nhập MSSV!');
    }
    if (inputEl) inputEl.focus();
    return;
  }

  await xuLyDiemDanh(code);
  if (inputEl) {
    inputEl.value = '';
    inputEl.focus();
  }
};

// ==========================================================================
// ACTIVITY ATTENDANCE & POINTS SYNC MODAL LOGIC
// ==========================================================================

function openActivityAttendanceModal(id, title, type) {
  currentAttendanceActivity = { id, title, type };

  const titleEl = document.getElementById('activity-attendance-title');
  const badgeEl = document.getElementById('activity-attendance-badge');
  const inputEl = document.getElementById('activity-attendance-mssv');

  if (titleEl) titleEl.textContent = title;
  
  if (badgeEl) {
    const typeLower = (type || '').toLowerCase();
    if (typeLower.includes('sinh hoạt') || typeLower.includes('sinhhoat')) {
      badgeEl.innerHTML = '<span class="badge-type type-sinhhoat">Buổi sinh hoạt</span>';
    } else if (typeLower.includes('giải đấu') || typeLower.includes('giaidau')) {
      badgeEl.innerHTML = '<span class="badge-type type-giaidau">Giải đấu</span>';
    } else {
      badgeEl.innerHTML = '<span class="badge-type type-hoatdong">Hoạt động CLB</span>';
    }
  }

  if (inputEl) {
    inputEl.value = '';
    if (!inputEl.dataset.attendanceListenerAttached) {
      inputEl.dataset.attendanceListenerAttached = 'true';
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitActivityAttendance();
        }
      });
    }
  }

  openAdminModal('modal-activity-attendance');

  setTimeout(() => {
    if (inputEl) inputEl.focus();
  }, 100);
}

async function submitActivityAttendance() {
  const inputEl = document.getElementById('activity-attendance-mssv');
  if (!inputEl) return;

  const code = inputEl.value.trim().toUpperCase();
  if (!code) {
    showAdminToast('⚠️ Vui lòng quét mã QR hoặc nhập MSSV!', true);
    inputEl.focus();
    return;
  }

  if (!currentAttendanceActivity) {
    showAdminToast('⚠️ Không tìm thấy thông tin hoạt động hiện tại!', true);
    return;
  }

  const { title, type } = currentAttendanceActivity;
  const typeLower = (type || '').toLowerCase();

  // NẾU Phân loại = 'Sinh hoạt' -> KHÔNG cộng diem_sinh_hoat tại đây
  if (typeLower.includes('sinh hoạt') || typeLower.includes('sinhhoat')) {
    showAdminToast('⚠️ Điểm danh sinh hoạt vui lòng thực hiện tại Tab "Quét Mã QR"!', true);
    inputEl.value = '';
    inputEl.focus();
    return;
  }

  try {
    // Tìm thông tin thành viên trong Supabase
    const { data: member, error: searchErr } = await supabase
      .from('thanh_vien')
      .select('*')
      .eq('mssv', code)
      .maybeSingle();

    if (searchErr) console.warn('Lỗi tìm kiếm MSSV:', searchErr);

    if (!member) {
      showAdminToast(`❌ Không tìm thấy thành viên có MSSV: ${code}`, true);
      inputEl.value = '';
      inputEl.focus();
      return;
    }

    const memberName = member.full_name || member.name || member.mssv;

    // NẾU Phân loại = 'Giải đấu' -> UPDATE members SET diem_giai_dau = diem_giai_dau + 1
    if (typeLower.includes('giải đấu') || typeLower.includes('giaidau')) {
      const currentScore = parseInt(member.diem_giai_dau ?? 0) || 0;
      const newScore = currentScore + 1;

      const { error: updateErr } = await supabase
        .from('thanh_vien')
        .update({ diem_giai_dau: newScore })
        .eq('mssv', member.mssv);

      if (updateErr) throw updateErr;

      // Cập nhật bổ nhớ đ!m localStorage nếu cà
      try {
        let localMembers = JSON.parse(localStorage.getItem('club_members')) || [];
        const idx = localMembers.findIndex(m => String(m.mssv).toUpperCase() === member.mssv);
        if (idx !== -1) {
          localMembers[idx].giaidau = newScore;
          localStorage.setItem('club_members', JSON.stringify(localMembers));
        }
      } catch (e) {
        console.error("Lỗi đồng bổ localStorage:", e);
      }

      showAdminToast(`🎉 Cộng 1 điểm Giải đấu cho ${memberName} (${member.mssv}) thành công!`);
    } 
    // NẾU Phân loại = 'Hoạt động' -> UPDATE members SET diem_hoat_dong = diem_hoat_dong + 1
    else if (typeLower.includes('hoạt động') || typeLower.includes('hoatdong')) {
      const currentScore = parseInt(member.diem_hoat_dong ?? 0) || 0;
      const newScore = currentScore + 1;

      const { error: updateErr } = await supabase
        .from('thanh_vien')
        .update({ diem_hoat_dong: newScore })
        .eq('mssv', member.mssv);

      if (updateErr) throw updateErr;

      // Cập nhật bổ nhớ đ!m localStorage nếu cà
      try {
        let localMembers = JSON.parse(localStorage.getItem('club_members')) || [];
        const idx = localMembers.findIndex(m => String(m.mssv).toUpperCase() === member.mssv);
        if (idx !== -1) {
          localMembers[idx].hoatdong = newScore;
          localStorage.setItem('club_members', JSON.stringify(localMembers));
        }
      } catch (e) {
        console.error("Lỗi đồng bổ localStorage:", e);
      }

      showAdminToast(`🎉 Cộng 1 điểm Hoạt động cho ${memberName} (${member.mssv}) thành công!`);
    }

    // Tiếng bíp phản hồi nếu trình duyệt hỗ trợ
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}

    // Cập nhật lại danh sách thành viên nếu đang mở
    if (typeof loadAdminMembers === 'function') loadAdminMembers();

  } catch (e) {
    console.error("Lỗi cộng điểm hoạt động:", e);
    showAdminToast(`❌ Lỗi cộng điểm: ${e.message}`, true);
  } finally {
    // Clear input và focus lại để sẵn sàng quét/nhập MSSV tiếp theo
    inputEl.value = '';
    inputEl.focus();
  }
}

// Window Bindings for Activities Management
window.openAddActivityModal = openAddActivityModal;
window.submitAdminNewActivity = submitAdminNewActivity;
window.deleteAdminActivity = deleteAdminActivity;
window.openActivityAttendanceModal = openActivityAttendanceModal;
window.submitActivityAttendance = submitActivityAttendance;
window.loadAdminActivities = loadAdminActivities;

function startQRScanner() {
  initAttendanceTab();
  setTimeout(() => {
    const inputMSSV = document.getElementById('inputMSSV') || document.getElementById('inputQuetQR');
    if (inputMSSV) inputMSSV.focus();
  }, 100);
}




const openAdminEditActivity = () => {
    console.log('Chức năng sửa hoạt động đang được xây dựng...');
};

// Expose admin dashboard functions to window for inline HTML handlers
window.adminLogout = adminLogout;
window.switchTab = switchTab;
window.submitAdminNewBDH = submitAdminNewBDH;
window.openAdminAddMemberModal = openAdminAddMemberModal;
window.openAddActivityModal = openAddActivityModal;
window.openAdminAddNewsModal = openAdminAddNewsModal;
window.retireExecutive = retireExecutive;
window.editMedal = editMedal;
window.deleteAdminNews = deleteAdminNews;
window.closeAdminModal = closeAdminModal;
window.openAdminModal = openAdminModal;
window.submitAdminNewNews = submitAdminNewNews;
window.saveAboutClubContent = saveAboutClubContent;
window.saveActivityChange = saveActivityChange;
window.deleteAdminActivity = deleteAdminActivity;
window.openAdminEditActivity = openAdminEditActivity;
window.submitAdminNewActivity = submitAdminNewActivity;
window.loadAdminNews = loadAdminNews;
window.loadAdminManagementTeam = loadExecutiveBoard;
window.loadExecutiveBoard = loadExecutiveBoard;


// Gắn sự kiện click cho các nút Submit sử dụng Event Delegation
document.body.addEventListener('click', (e) => {
    const btnBDH = e.target.closest('#btn-add-management');
    if (btnBDH) {
        e.preventDefault();
        submitAdminNewBDH(e);
    }
});

async function loadAdminBoard() {
    try {
        let boardMembers = [];
        const resBdh = await supabase
            .from('ban_dieu_hanh')
            .select('*');

        if (resBdh.data && resBdh.data.length > 0) {
            boardMembers = resBdh.data.map(item => {
                const tv = item.thanh_vien || {};
                const nameVal = tv.ho_ten || item.ho_ten || item.full_name || item.name || item.mssv;
                const phoneVal = tv.sdt || tv.so_dien_thoai || item.so_dien_thoai || item.sdt || '';
                const avtVal = tv.avatar || tv.avatar_url || tv.hinh_anh || item.avatar || item.avatar_url || item.hinh_anh || '';
                const classVal = tv.khoa_lop || item.khoa_lop || item.class_name || item.class || 'Chưa cập nhật';
                return {
                    ...item,
                    mssv: item.mssv,
                    full_name: nameVal,
                    ho_ten: nameVal,
                    name: nameVal,
                    title: item.chuc_vu || item.title || '',
                    chuc_vu: item.chuc_vu || item.title || '',
                    phone: phoneVal,
                    sdt: phoneVal,
                    so_dien_thoai: phoneVal,
                    avatar: avtVal,
                    avatar_url: avtVal,
                    hinh_anh: avtVal,
                    khoa_lop: classVal,
                    class_name: classVal,
                    status: item.trang_thai === 'Cựu thành viên' ? 'retro' : 'online',
                    is_former: item.trang_thai === 'Cựu thành viên'
                };
            });
        } else {
            const { data: members } = await supabase.from('thanh_vien').select('*');
            if (members) {
                boardMembers = members.filter(m => m.title && m.title.trim() !== '' && m.title.toLowerCase() !== 'thành viên' && m.title.toLowerCase() !== 'thành viên mới');
            }
        }

        const getPhone = (m) => m.phone || m.sdt || m.so_dien_thoai || '';

        // 1. Logic Ẩn/Hiện Loading Text Thừa (#admin-bdh-empty-notice)
        const adminEmptyNotice = document.getElementById('admin-bdh-empty-notice');
        if (adminEmptyNotice) {
            adminEmptyNotice.style.display = boardMembers.length === 0 ? 'block' : 'none';
        }

        // Phân tích danh sách Ban ốương nhiệm và Ban cựu thành viên
        const activeBoard = boardMembers.filter(m => m.status !== 'retro' && m.is_former !== true);
        const retroBoard = boardMembers.filter(m => m.status === 'retro' || m.is_former === true);

        const tang1 = activeBoard.filter(m => m.title.toLowerCase().includes('chủ nhiệm') && !m.title.toLowerCase().includes('phó'));
        const tang2 = activeBoard.filter(m => m.title.toLowerCase().includes('phó chủ nhiệm'));
        const tang3 = activeBoard.filter(m => !tang1.includes(m) && !tang2.includes(m));

        const renderList = async (arr, id, tierNum) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (arr.length === 0) {
                el.innerHTML = '<p class="empty-data-msg">Chưa cà dữ liệu</p>';
                return;
            }
            const htmlArr = await Promise.all(arr.map(async m => {
                const medalIcon = await updateMemberMedal(m.mssv, m.title, m);
                const isSelected = selectedExecutiveMssv === m.mssv;
                const activeStyle = isSelected ? 'border-color: #64ffda; box-shadow: 0 0 15px rgba(100,255,218,0.4);' : '';
                
                const rawBoardAvt = tv.avatar || tv.avatar_url || tv.hinh_anh || m.avatar || m.avatar_url || m.hinh_anh;
                const hasRealAvt = Boolean(rawBoardAvt && String(rawBoardAvt).trim() !== '' && !rawBoardAvt.includes('via.placeholder'));
                const avtSrc = hasRealAvt
                    ? (rawBoardAvt.includes('?') ? `${rawBoardAvt}&t=${Date.now()}` : `${rawBoardAvt}?t=${Date.now()}`)
                    : '';
                const firstLetter = (m.full_name || m.ho_ten || 'B').charAt(0).toUpperCase();

                const avtHtml = hasRealAvt
                    ? `<img src="${avtSrc}" alt="${m.full_name}" class="executive-avatar-public w-24 h-24 rounded-full border-4 border-[#0ea5e9] object-cover mb-4">`
                    : `<div class="w-24 h-24 rounded-full border-4 border-[#0ea5e9] bg-gradient-to-br from-blue-500 to-cyan-600 text-white font-extrabold text-3xl flex items-center justify-center mb-4">${firstLetter}</div>`;

                const phoneVal = getPhone(m);
                const cleanPhone = phoneVal ? String(phoneVal).replace(/\s+/g, '') : '';
                const phoneHtml = cleanPhone 
                    ? `<a href="tel:${cleanPhone}" onclick="event.stopPropagation()" class="text-cyan-400 hover:underline"><i class="fa-solid fa-phone mr-1"></i>${phoneVal}</a>`
                    : `<span class="text-gray-400"><i class="fa-solid fa-phone mr-1"></i>Chưa cà SĐT</span>`;

                return `
                    <div class="executive-card-public flex flex-col items-center p-4 bg-[#0b1120] rounded-lg shadow-lg border border-gray-700 hover:border-gray-500 w-64 cursor-pointer transition-all duration-200" 
                         data-mssv="${m.mssv}" 
                         data-rank="${m.title || 'Tành viên'}" 
                         data-phone="${phoneVal}"
                         style="${activeStyle}"
                         onclick="selectExecutiveCard(this, '${m.mssv}', '${encodeURIComponent(m.full_name)}')">
                        ${avtHtml}
                        <h3 class="executive-name-public text-white font-bold text-lg text-center">
                            <span>${m.full_name}</span>
                        </h3>
                        <p class="executive-title-public text-[#0ea5e9] font-semibold text-sm text-center uppercase tracking-wider my-1">${m.title}</p>
                        <p class="text-xs text-center mt-1">${phoneHtml}</p>
                    </div>
                `;
            }));
            el.innerHTML = htmlArr.join('');
        };

        await renderList(tang1, 'admin-tang-1', 1);
        await renderList(tang2, 'admin-tang-2', 2);
        await renderList(tang3, 'admin-tang-3', 3);

        // Render Cựu thành viên dưới dạng Bảng đồng bổ
        const retroEl = document.getElementById('admin-retro-tang');
        if (retroEl) {
            if (retroBoard.length === 0) {
                retroEl.style.display = 'flex';
                retroEl.innerHTML = '<p class="empty-data-msg">Chưa cà dữ liệu</p>';
            } else {
                retroEl.style.display = 'block';
                retroEl.innerHTML = `
                    <div class="glass-card" style="padding: 0; overflow-x: auto; width: 100%;">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Tành viên</th>
                                    <th>Khóa/Lớp</th>
                                    <th>Giới tính</th>
                                    <th>DANH HIỆU</th>
                                    <th>Chức vụ</th>
                                    <th>Ngày tham gia</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody id="admin-retro-table-body">
                                ${retroBoard.map(m => {
                                    const tv = m.thanh_vien || {};
                                    const nameVal = m.full_name || m.ho_ten || m.name || tv.ho_ten || m.mssv;
                                    const classVal = m.khoa_lop || m.class_name || m.class || tv.khoa_lop || 'Chưa cập nhật';
                                    const rawRetroAvt = m.avatar || m.avatar_url || m.hinh_anh || tv.avatar || tv.avatar_url || tv.hinh_anh;
                                    const avatarUrl = (rawRetroAvt && String(rawRetroAvt).trim() !== '' && !rawRetroAvt.includes('via.placeholder'))
                                        ? (rawRetroAvt.includes('?') ? `${rawRetroAvt}&t=${Date.now()}` : `${rawRetroAvt}?t=${Date.now()}`)
                                        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.mssv}`;
                                    const badgeSrc = getBadgeSrcByTitle(m.title);
                                    const danhHieuHtml = badgeSrc ? `<img src="${badgeSrc}" class="badge-icon-small" alt="${m.title}" title="${m.title}">` : 'N/A';
                                    
                                    let displayJoinDate = '15/09/2024';
                                    if (m.join_date) {
                                        if (m.join_date.includes('/')) {
                                            displayJoinDate = m.join_date;
                                        } else {
                                            const parts = m.join_date.split('-');
                                            if (parts.length === 3) {
                                                displayJoinDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
                                            }
                                        }
                                    }

                                    const savedStatus = localStorage.getItem('status_' + m.mssv) || m.status || 'online';
                                    let statusText = 'Online';
                                    let statusClass = 'status-online';
                                    if (savedStatus.toLowerCase() === 'offline' || savedStatus.toLowerCase() === 'retro') {
                                        statusText = 'Offline';
                                        statusClass = 'status-offline';
                                    }

                                    return `
                                        <tr>
                                            <td class="player-info-cell" style="vertical-align: middle;">
                                                <div class="player-info">
                                                    <img src="${avatarUrl}" alt="${nameVal}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">
                                                    <span style="font-weight: 600; color: #fff;">${nameVal}</span>
                                                </div>
                                            </td>
                                            <td style="vertical-align: middle;">${classVal}</td>
                                            <td style="vertical-align: middle;">${m.gender || tv.gioi_tinh || 'Nam'}</td>
                                            <td style="vertical-align: middle;">${danhHieuHtml}</td>
                                            <td style="color: #64ffda; font-weight: 500; vertical-align: middle;">${m.title}</td>
                                            <td style="vertical-align: middle;">${displayJoinDate}</td>
                                            <td style="vertical-align: middle;">
                                                <span class="status-badge ${statusClass}">${statusText}</span>
                                            </td>
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
        console.error('Lỗi tải BĐH Admin:', err);
    }
}

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
                      text.includes('Đống') || 
                      text.includes('ốống') || 
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
      if (typeof closeAdminModal === 'function') {
        closeAdminModal(parentModal);
      } else {
        parentModal.classList.add('hidden');
        parentModal.style.display = 'none';
        parentModal.classList.remove('active');
        const content = parentModal.querySelector('.modal-content');
        if (content) content.classList.remove('modal-show');
      }
    }
  }
});

// ==========================================================================
// ==========================================================================
// TRẠM QUÉT MÃ QR ĐIỂM DANH SINH HOẠT
// ==========================================================================
const initInputDiemDanh = () => {
  initAttendanceTab();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInputDiemDanh);
} else {
  initInputDiemDanh();
}

// Safe UI Cleanup for Admin (No MutationObserver, no while loops)
function cleanUpAdminUI() {
  document.querySelectorAll('button, .btn, .btn-submit, .btn-close, .login-btn').forEach(btn => {
    if (btn.children.length === 0) {
      let txt = btn.textContent.trim();
      txt = txt.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}⚠️❌✅🎉🏆🥇🥈🥉🏅🔰💎👉s]*/u, '');
      if (txt) btn.innerText = txt;
    }
  });

  document.querySelectorAll('.empty-tier-msg, .empty-data-msg').forEach(el => {
    el.innerText = 'Chưa cà dữ liệu';
    el.classList.add('empty-data-msg');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', cleanUpAdminUI);
} else {
  cleanUpAdminUI();
}

// ==========================================================================
// TÍNH NĂNG PREVIEW (XEM TRƯỚC THÔNG TIN) KHI NHẬP MSSV BỔ NHIỆM BĐH
// ==========================================================================
function initBDHMssvPreview() {
  const mssvInput = document.querySelector('#inputMssvBDH') || document.querySelector('#add-bdh-mssv');
  if (!mssvInput) return;

  let previewBox = document.querySelector('#previewMssvBDH');
  if (!previewBox) {
    previewBox = document.createElement('div');
    previewBox.id = 'previewMssvBDH';
    previewBox.className = 'transition-all duration-300';
    previewBox.style.cssText = 'padding: 10px; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); margin-top: -5px; display: none;';
    mssvInput.parentNode.insertBefore(previewBox, mssvInput.nextSibling);
  }

  let debounceTimer = null;

  async function handleMssvPreview() {
    const val = mssvInput.value.trim();
    if (!val) {
      previewBox.style.display = 'none';
      previewBox.classList.add('hidden');
      previewBox.innerHTML = '';
      return;
    }

    previewBox.style.display = 'block';
    previewBox.classList.remove('hidden');
    previewBox.style.borderColor = 'rgba(255,255,255,0.2)';
    previewBox.style.background = 'rgba(255,255,255,0.04)';
    previewBox.innerHTML = `<span style="color: #94a3b8; font-size: 12px;"><i class="fa-solid fa-spinner fa-spin" style="margin-right: 5px;"></i> Đang tóm thành viên...</span>`;

    try {
      const { data: tv } = await supabase
        .from('thanh_vien')
        .select('*')
        .ilike('mssv', val)
        .maybeSingle();

      let member = tv;
      if (!member) {
        const { data: mem } = await supabase
          .from('thanh_vien')
          .select('*')
          .ilike('mssv', val)
          .maybeSingle();
        member = mem;
      }

      if (member) {
        const hoTen = member.ho_ten || member.full_name || member.name || val;
        const rawAvt = member.avatar || member.avatar_url || member.hinh_anh;
        const avtSrc = (rawAvt && String(rawAvt).trim() !== '' && !rawAvt.includes('via.placeholder'))
          ? (rawAvt.includes('?') ? `${rawAvt}&t=${Date.now()}` : `${rawAvt}?t=${Date.now()}`)
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(hoTen)}&background=random&color=fff`;

        previewBox.style.display = 'block';
        previewBox.classList.remove('hidden');
        previewBox.style.borderColor = '#00d2ff';
        previewBox.style.background = 'rgba(0, 210, 255, 0.08)';
        previewBox.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${avtSrc}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid #00d2ff; flex-shrink: 0;">
            <div style="display: flex; flex-direction: column;">
              <span style="color: #ffffff; font-weight: bold; font-size: 14px;">${hoTen}</span>
              <span style="color: #64ffda; font-size: 12px;">MSSV: ${member.mssv} ${member.khoa_lop || member.class_name ? '⬢ ' + (member.khoa_lop || member.class_name) : ''}</span>
            </div>
          </div>
        `;
      } else {
        previewBox.style.display = 'block';
        previewBox.classList.remove('hidden');
        previewBox.style.borderColor = '#ef4444';
        previewBox.style.background = 'rgba(239, 68, 68, 0.08)';
        previewBox.innerHTML = `<span style="color: #ef4444; font-size: 13px; font-weight: bold;"><i class="fa-solid fa-circle-xmark" style="margin-right: 5px;"></i> Không tóm thấy hồ sơ thành viên này. Vui lòng tạo hồ sơ trước.</span>`;
      }
    } catch (err) {
      console.error('Lỗi xem trước MSSV:', err);
    }
  }

  mssvInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(handleMssvPreview, 300);
  });
  mssvInput.addEventListener('blur', handleMssvPreview);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBDHMssvPreview);
} else {
  initBDHMssvPreview();
}




