// File: tests/website-flow.js

// Nhập các thư viện cần thiết từ k6
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// --- PHẦN CẤU HÌNH ĐỘNG ---
// Lấy giá trị từ biến môi trường do GitHub Actions cung cấp.
// Đây là chìa khóa cho sự linh hoạt.
const BASE_URL = __ENV.TARGET_URL;
const VUS = __ENV.VUS;
const DURATION = __ENV.DURATION;

// --- ĐỊNH NGHĨA CÁC CHỈ SỐ ĐO LƯỜNG RIÊNG ---
// Giúp báo cáo trở nên chi tiết và dễ đọc hơn
const GuestFlowDuration = new Trend('trend_guest_flow_duration');
const UserFlowDuration = new Trend('trend_user_flow_duration');
const ErrorRate = new Rate('rate_errors');

// --- CẤU HÌNH CHÍNH CỦA BÀI TEST ---
export const options = {
  // Định nghĩa các kịch bản (scenarios) sẽ chạy song song
  scenarios: {
    // Kịch bản 1: Mô phỏng người dùng vãng lai, chiếm 70% lưu lượng
    guest_users: {
      executor: 'constant-vus', // Giữ số lượng người dùng ảo không đổi
      vus: Math.floor(VUS * 1) || 1, // 70% tổng số VUs, tối thiểu là 1
      duration: DURATION,
      exec: 'guestFlow', // Chỉ định hàm sẽ được thực thi bởi kịch bản này
    },
    // Kịch bản 2: Mô phỏng người dùng đã đăng nhập, chiếm 30% lưu lượng
    logged_in_users: {
      executor: 'constant-vus',
      vus: Math.floor(VUS * 1) || 1, // 30% tổng số VUs, tối thiểu là 1
      duration: DURATION,
      exec: 'userFlow',
    },
  },

  // Ngưỡng (Thresholds) để tự động xác định Test THÀNH CÔNG hay THẤT BẠI
  thresholds: {
    'http_req_failed': ['rate<0.02'],      // Tỷ lệ request lỗi chung phải dưới 2%
    'http_req_duration': ['p(95)<2000'],   // 95% các request phải hoàn thành dưới 2 giây
    'trend_guest_flow_duration': ['p(95)<1000'], // 95% request trong luồng khách phải dưới 1 giây
    'trend_user_flow_duration': ['p(95)<2500'],  // 95% request trong luồng người dùng phải dưới 2.5 giây
  },
};

// === HÀM MÔ PHỎNG LUỒNG CỦA KHÁCH (GUEST) ===
export function guestFlow() {
  // `group` giúp nhóm các request lại trong báo cáo cho dễ nhìn
  group('Guest User Flow - Luồng của Khách', function () {
    // 1. Truy cập Trang chủ
    const res1 = http.get(`${BASE_URL}/`);
    const success1 = check(res1, { 'Trang chủ tải thành công (status 200)': (r) => r.status === 200 });
    ErrorRate.add(!success1); // Nếu không thành công, ghi nhận 1 lỗi
    GuestFlowDuration.add(res1.timings.duration); // Ghi nhận thời gian phản hồi
    sleep(Math.random() * 2 + 1); // Nghỉ ngẫu nhiên 1-3 giây, mô phỏng người dùng đọc trang

    // 2. Xem trang Đăng ký
    const res2 = http.get(`${BASE_URL}/signup`);
    const success2 = check(res2, { 'Trang Đăng ký tải thành công (status 200)': (r) => r.status === 200 });
    ErrorRate.add(!success2);
    GuestFlowDuration.add(res2.timings.duration);
    sleep(Math.random() * 2 + 1);

    // 3. Xem trang Đăng nhập
    const res3 = http.get(`${BASE_URL}/login`);
    const success3 = check(res3, { 'Trang Đăng nhập tải thành công (status 200)': (r) => r.status === 200 });
    ErrorRate.add(!success3);
    GuestFlowDuration.add(res3.timings.duration);
  });
  sleep(Math.random() * 3 + 2); // Nghỉ 2-5 giây trước khi bắt đầu một vòng lặp mới
}

// === HÀM MÔ PHỎNG LUỒNG CỦA NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP ===
export function userFlow() {
  group('Logged-in User Flow - Luồng của Người dùng', function () {
    // Lưu ý: Chúng ta chấp nhận status 200 (thành công) hoặc 401/403 (từ chối truy cập)
    // vì cả hai đều cho thấy server đã phản hồi.
    const checkAuthPages = { 'Trang yêu cầu đăng nhập phản hồi': (r) => [200, 401, 403].includes(r.status) };

    // 1. Truy cập Bảng điều khiển
    const res1 = http.get(`${BASE_URL}/dashboard`);
    const success1 = check(res1, checkAuthPages);
    ErrorRate.add(!success1);
    UserFlowDuration.add(res1.timings.duration);
    sleep(Math.random() * 2 + 1);

    // 2. Truy cập trang Thiết bị
    const res2 = http.get(`${BASE_URL}/devices`);
    const success2 = check(res2, checkAuthPages);
    ErrorRate.add(!success2);
    UserFlowDuration.add(res2.timings.duration);
    sleep(Math.random() * 2 + 1);

    // 3. Truy cập trang Ký
    const res3 = http.get(`${BASE_URL}/sign`);
    const success3 = check(res3, checkAuthPages);
    ErrorRate.add(!success3);
    UserFlowDuration.add(res3.timings.duration);
    sleep(Math.random() * 2 + 1);

    // 4. Truy cập trang Nạp tiền
    const res4 = http.get(`${BASE_URL}/topup`);
    const success4 = check(res4, checkAuthPages);
    ErrorRate.add(!success4);
    UserFlowDuration.add(res4.timings.duration);
  });
  sleep(Math.random() * 3 + 2);
}
