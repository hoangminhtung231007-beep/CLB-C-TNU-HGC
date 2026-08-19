import { supabase } from '../core/supabaseClient.js';

export async function loadDanhSachThanhVien() {
    // Tự động tìm tbody của bảng đầu tiên trên trang nếu không đúng ID
    const tbody = document.querySelector('#bangDanhSachThanhVien tbody') || 
                  document.querySelector('#bangThanhVienPublic') || 
                  document.querySelector('#member-table-body') || 
                  document.querySelector('table tbody');
    
    if (!tbody) {
        console.error('Lỗi: Không tìm thấy thẻ <tbody> của bảng Danh sách thành viên!');
        return;
    }

    try {
        // 1. Kéo dữ liệu từ kho Thành viên + Chức vụ BĐH
        let data = null;
        let error = null;

        const resThanhVien = await supabase
            .from('thanh_vien')
            .select('*, ban_dieu_hanh(chuc_vu, trang_thai)')
            .neq('mssv', 'admin');

        data = resThanhVien.data;
        error = resThanhVien.error;

        if (error || !data || data.length === 0) {
          const resMembers = await supabase
              .from('thanh_vien')
              .select('*')
              .neq('mssv', 'admin');
          if (resMembers.data && resMembers.data.length > 0) {
              data = resMembers.data;
              error = null;
          }
        }

        if (error && (!data || data.length === 0)) throw error;

        tbody.innerHTML = '';

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: #aaa; padding: 20px;">Chưa có thành viên nào.</td></tr>';
            return;
        }

        const parseMemberDate = (dateStr) => {
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
        };

        data.sort((a, b) => {
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

        const countIds = ['total-member-count', 'total-members', 'total-members-count'];
        countIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = data.length;
        });

        data.forEach((user) => {
            // 2. TỰ TÍNH DANH HIỆU TRỰC TIẾP (Bypass hàm global)
            let sh = user.diem_sinh_hoat || 0, gd = user.diem_giai_dau || 0, hd = user.diem_hoat_dong || 0;
            let bacDiem = 1;
            if (sh >= 115 && gd >= 12 && hd >= 15) bacDiem = 6;
            else if (sh >= 100 && gd >= 10 && hd >= 12) bacDiem = 5;
            else if (sh >= 60 && gd >= 5 && hd >= 8) bacDiem = 4;
            else if (sh >= 20 && gd >= 2 && hd >= 4) bacDiem = 3;
            else if (sh >= 8 && gd >= 1 && hd >= 2) bacDiem = 2;

            let bacChucVu = 1;
            let cv = null;
            
            if (user.ban_dieu_hanh && user.ban_dieu_hanh.length > 0) {
                // 1. Đã gỡ bỏ chốt chặn 'Đương nhiệm' để Cựu thành viên được đi tiếp
                cv = user.ban_dieu_hanh[0].chuc_vu;
                let trangThaiBaoLuu = user.ban_dieu_hanh[0].trang_thai;
                let cvLower = cv ? cv.toLowerCase() : '';
                
                // 2. Vẫn giữ nguyên logic gán bậc như cũ
                if (cvLower.includes('chủ nhiệm') && !cvLower.includes('phó')) bacChucVu = 6;
                else if (cvLower.includes('phó chủ nhiệm')) bacChucVu = 5;
                else if ((cvLower.includes('trưởng ban') || cvLower.includes('thư ký') || cvLower.includes('thu ky') || cvLower.includes('thư kí') || cvLower.includes('thu ki')) && !cvLower.includes('phó')) bacChucVu = 4;
                else if (cvLower.includes('phó ban') || cvLower.includes('phó trưởng ban') || cvLower.includes('phó')) bacChucVu = 3;

                // 3. Bổ sung tính năng tôn vinh Cựu thành viên
                if (trangThaiBaoLuu === 'Cựu thành viên') {
                    cv = 'Nguyên ' + cv; // Hiển thị thêm chữ Nguyên
                }
            }

            // SO KÈ CẢNH GIỚI: Lấy Bậc cao nhất
            let bacCuoiCung = Math.max(bacDiem, bacChucVu);
            
            // Lấy ảnh huy chương tương ứng
            const isNested = typeof window !== 'undefined' && window.location.pathname.includes('/pages/');
            const basePath = isNested ? '../assets/badges/' : './assets/badges/';

            const danhHieuMap = {
                6: { ten: 'Thành viên nòng cốt', img: `${basePath}bac6.png` },
                5: { ten: 'Thành viên ưu tú', img: `${basePath}bac5.png` },
                4: { ten: 'Thành viên cốt cán', img: `${basePath}bac4.png` },
                3: { ten: 'Thành viên tích cực', img: `${basePath}bac3.png` },
                2: { ten: 'Hội viên', img: `${basePath}bac2.png` },
                1: { ten: 'Thành viên mới', img: `${basePath}bac1.png` }
            };
            const danhHieu = danhHieuMap[bacCuoiCung] || danhHieuMap[1];

            // 3. Xử lý Avatar (Ưu tiên ảnh thực tế từ CSDL)
            const nameStr = user.ho_ten || user.full_name || 'Chưa cập nhật';
            const memberMssv = user.mssv || '';
            const rawUserAvt = user.avatar || user.avatar_url || user.hinh_anh || (memberMssv ? (localStorage.getItem('avatar_' + memberMssv) || localStorage.getItem('avatar_' + String(memberMssv).toUpperCase()) || localStorage.getItem('avatar_' + String(memberMssv).toLowerCase())) : '') || (memberMssv === localStorage.getItem('currentUserMSSV') ? localStorage.getItem('userAvatar') : '') || '';
            let avtHtml = '';
            if (rawUserAvt && String(rawUserAvt).trim() !== '' && !rawUserAvt.includes('via.placeholder')) {
              const bustedUrl = rawUserAvt.includes('?') ? `${rawUserAvt}&t=${Date.now()}` : `${rawUserAvt}?t=${Date.now()}`;
              avtHtml = `<img src="${bustedUrl}" data-mssv="${memberMssv}" alt="${nameStr}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">`;
            } else {
              let avt = { chuCai: nameStr.charAt(0).toUpperCase(), mauNen: '#38bdf8' };
              if (typeof taoAvatarChuCai === 'function') avt = taoAvatarChuCai(nameStr);
              avtHtml = `<div data-mssv="${memberMssv}" style="width: 40px; height: 40px; border-radius: 50%; background-color: ${avt.mauNen}; color: #1e293b; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1rem; flex-shrink: 0;">${avt.chuCai}</div>`;
            }

            const classVal = user.khoa_lop || user.class_name || 'Chưa cập nhật';
            const genderVal = user.gioi_tinh || user.gender || 'Nam';

            let dateVal = user.created_at || user.ngay_tham_gia || user.join_date || '-';
            if (dateVal && dateVal.includes('T')) dateVal = dateVal.split('T')[0];

            const rawStatus = user.trang_thai || user.status || (memberMssv ? localStorage.getItem(`status_${memberMssv}`) : null) || 'Online';
            const isOnline = (String(rawStatus).toLowerCase() === 'online' || String(rawStatus).toLowerCase() === 'hoạt động' || String(rawStatus).toLowerCase() === 'active');
            const statusBadgeHtml = isOnline
                ? `<div class="flex items-center justify-center gap-2 text-green-500 text-sm font-semibold"><span class="w-2 h-2 rounded-full bg-green-500"></span><span>Online</span></div>`
                : `<div class="flex items-center justify-center gap-2 text-slate-400 text-sm font-medium"><span class="w-2 h-2 rounded-full bg-slate-500"></span><span>Offline</span></div>`;

            // 4. In ra HTML (Ép thẻ <img> dùng huy chương mới)
            const tr = document.createElement('tr');
            tr.setAttribute('data-mssv', memberMssv);
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
                        ${avtHtml}
                        <span style="color: #f1f5f9; font-weight: 500;">${nameStr}</span>
                    </div>
                </td>
                <td style="padding: 15px; vertical-align: middle; color: #94a3b8; text-align: center;">${classVal}</td>
                <td style="padding: 15px; vertical-align: middle; color: #94a3b8; text-align: center;">${genderVal}</td>
                
                <!-- CỘT DANH HIỆU: ĐÃ ĐƯỢC ÉP DÙNG LOGIC MỚI NHẤT -->
                <td style="padding: 15px; text-align: center; vertical-align: middle;">
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
                        <img src="${danhHieu.img}" alt="${danhHieu.ten}" title="${danhHieu.ten}${cv ? ' - ' + cv : ''}" style="width: 35px; height: 35px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); display: inline-block; vertical-align: middle;">
                        <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">${danhHieu.ten}</span>
                    </div>
                </td>
                
                <td style="padding: 15px; vertical-align: middle; color: #94a3b8; text-align: center;">${dateVal}</td>
                <td style="padding: 15px; vertical-align: middle; text-align: center;">${statusBadgeHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Lỗi tải bảng danh sách thành viên:', err);
    }
}

export async function loadDanhSachCongKhai() {
  return loadDanhSachThanhVien();
}

export async function loadMembers() {
  return loadDanhSachThanhVien();
}

window.loadDanhSachThanhVien = loadDanhSachThanhVien;
window.loadDanhSachCongKhai = loadDanhSachThanhVien;
window.loadMembers = loadDanhSachThanhVien;
window.loadMembersList = loadDanhSachThanhVien;

// Tự động chạy khi mở trang
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadDanhSachThanhVien);
} else {
  loadDanhSachThanhVien();
}

window.addEventListener('avatarChanged', () => {
  if (typeof loadDanhSachThanhVien === 'function') loadDanhSachThanhVien();
});
