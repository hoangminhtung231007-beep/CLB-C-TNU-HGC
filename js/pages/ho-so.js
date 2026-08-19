import { supabase } from '../core/supabaseClient.js';

export async function loadHoSoCaNhan() {
  // 1. Lấy MSSV từ trí nhớ tạm của trình duyệt
  const currentMSSV = localStorage.getItem('currentUserMSSV') || localStorage.getItem('userMssv') || localStorage.getItem('mssv');
  
  // Nếu chưa có MSSV (chưa đăng nhập), chỉ chuyển hướng NẾU đang ở trang Hồ sơ (ho-so.html)
  if (!currentMSSV) {
    const trangHienTai = window.location.pathname;
    if (trangHienTai.includes('ho-so.html')) {
      const isNested = trangHienTai.includes('/pages/');
      window.location.replace(isNested ? '../index.html' : 'index.html'); 
    }
    return;
  }

  try {
    // 2. Lấy đúng 1 dòng dữ liệu của thành viên này từ Supabase
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
    
    // Xử lý Avatar bo tròn
    const rawAvt = data.avatar || data.avatar_url || data.hinh_anh || (mssvVal ? localStorage.getItem('avatar_' + mssvVal) : '') || localStorage.getItem('userAvatar') || localStorage.getItem('currentUserAvatar');
    let avatarUrl = '';
    if (rawAvt && String(rawAvt).trim() !== '' && !rawAvt.includes('via.placeholder')) {
      avatarUrl = rawAvt.includes('?') ? `${rawAvt}&t=${Date.now()}` : `${rawAvt}?t=${Date.now()}`;
    } else {
      avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(hoTen)}&background=0ea5e9&color=fff&bold=true&size=200`;
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
    // Ignore audio autoplay restrictions
  }
}

// Hiển thị Bảng Chúc Mừng Thăng Cấp Danh Hiệu
export function showPopupThangCap(tenMoi, imgMoi) {
  let popup = document.getElementById('popupThangCap');
  
  if (!popup) {
    const isNested = window.location.pathname.includes('/pages/');
    const prefix = isNested ? '../' : './';
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

  const currentTitle = tenMoi || (document.getElementById('hs_danhhieu') ? document.getElementById('hs_danhhieu').innerText : 'Thành viên cốt cán');
  const currentBadge = imgMoi || (document.getElementById('membership-rank') ? document.getElementById('membership-rank').src : '../assets/badges/bac4.png');

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

// Chạy hàm ngay khi mở trang Hồ sơ
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadHoSoCaNhan);
} else {
  loadHoSoCaNhan();
}

window.addEventListener('avatarChanged', () => {
  if (typeof loadHoSoCaNhan === 'function') loadHoSoCaNhan();
});
