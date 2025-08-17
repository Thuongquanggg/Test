// 🅾️ Tên file: k6-gist-script.js
// Phiên bản tối ưu, sử dụng GitHub Gist để quản lý state proxy.
// Hoạt động hoàn toàn trên GitHub Actions mà không cần server ngoài.

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { html } from 'k6/html';

// --- CẤU HÌNH ---
const BASE_URL = __ENV.TARGET_URL || 'https://certapple.com';
const PROXY_FILE_URL = 'https://raw.githubusercontent.com/Thuongquanggg/Proxy/main/proxies.txt';
const PROXY_REFRESH_INTERVAL = 3 * 60 * 1000; // 3 phút

// --- CẤU HÌNH GIST (Lấy từ GitHub Secrets) ---
const GIST_ID = __ENV.K6_GIST_ID;
const GIST_PAT = __ENV.K6_GIST_PAT;
const GIST_API_URL = `https://api.github.com/gists/${GIST_ID}`;
const GIST_FILENAME = 'proxies.json';

// --- BIẾN TOÀN CỤC (Mỗi VU có bản sao riêng) ---
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/115.0',
];

// --- TRẠNG THÁI CỤC BỘ CỦA VU (VU LOCAL STATE) ---
let vuLocalProxies = [];
let vuLocalLastUpdated = 0;

// --- CẤU HÌNH KỊCH BẢN TEST ---
export const options = {
    insecureSkipTLSVerify: true,
    scenarios: {
        daily_traffic_simulation: {
            executor: 'ramping-vus',
            stages: [
                { duration: '2m', target: 100 }, // Giảm target để test trên GitHub Actions Free Tier
                { duration: '5m', target: 200 },

              { duration: '5m', target: 1000 },

                { duration: '600m', target: 2000 },
            ],
            gracefulStop: '2m',
            exec: 'runTest',
        },
    },
    thresholds: {
        'http_req_failed': ['rate<0.05'],
        'checks': ['rate>0.95'],
    },
};

// --- SETUP FUNCTION (Chạy 1 lần duy nhất) ---
export function setup() {
    console.log('--- Bắt đầu pha SETUP ---');
    if (!GIST_ID || !GIST_PAT) {
        throw new Error('K6_GIST_ID và K6_GIST_PAT phải được cung cấp qua biến môi trường!');
    }

    const initialProxies = fetchProxiesFromGithub();
    if (initialProxies.length === 0) {
        throw new Error('Không thể lấy danh sách proxy ban đầu. Dừng kịch bản.');
    }

    console.log(`Lấy được ${initialProxies.length} proxy ban đầu. Đang cập nhật Gist...`);
    const success = updateGist(initialProxies);
    if (!success) {
        throw new Error('Cập nhật Gist ban đầu thất bại. Dừng kịch bản.');
    }
    console.log('--- SETUP hoàn tất, Gist đã được khởi tạo ---');
}

// --- ĐIỂM VÀO CHÍNH (MAIN VU FUNCTION) ---
export function runTest() {
    // Logic tối ưu: Cập nhật proxy từ Gist nếu cần
    updateLocalProxiesIfNeeded();

    // Logic của VU lãnh đạo: chỉ VU 1 mới được quyền làm mới proxy trên Gist
    if (__VU === 1) {
        leaderProxyRefresh();
    }

    if (!vuLocalProxies || vuLocalProxies.length === 0) {
        console.error(`[VU=${__VU}] Bể proxy cục bộ rỗng. Bỏ qua vòng lặp.`);
        sleep(5);
        return;
    }

    // Logic chọn hành vi người dùng (không đổi)
    const random = Math.random();
    if (random < 0.5) {
        firstTimeVisitor(vuLocalProxies);
    } else {
        returningVisitor(vuLocalProxies);
    }
}

// --- CÁC HÀM HỖ TRỢ MỚI CHO GIST ---

function fetchProxiesFromGithub() {
    const res = http.get(PROXY_FILE_URL, { timeout: '30s' });
    if (res.status === 200 && res.body) {
        return res.body.trim().split('\n').filter(p => p.trim() !== '').slice(0, 200);
    }
    return [];
}

function updateGist(proxies) {
    const payload = JSON.stringify({
        files: {
            [GIST_FILENAME]: {
                content: JSON.stringify({
                    last_updated: Date.now(),
                    proxies: proxies,
                }),
            },
        },
    });

    const params = {
        headers: {
            'Authorization': `token ${GIST_PAT}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        },
    };

    const res = http.patch(GIST_API_URL, payload, params);
    if (res.status === 200) {
        console.log('Cập nhật Gist thành công.');
        return true;
    } else {
        console.error(`Lỗi khi cập nhật Gist. Status: ${res.status}, Body: ${res.body}`);
        return false;
    }
}

function updateLocalProxiesIfNeeded() {
    // Lấy thông tin Gist để có URL raw mới nhất (nó có thể thay đổi)
    const gistInfo = http.get(GIST_API_URL);
    if (gistInfo.status !== 200 || !gistInfo.json() || !gistInfo.json().files[GIST_FILENAME]) {
        console.warn(`[VU=${__VU}] Không thể lấy thông tin Gist.`);
        return;
    }

    const rawUrl = gistInfo.json().files[GIST_FILENAME].raw_url;
    const res = http.get(rawUrl, { responseType: 'text' });
    if (res.status !== 200) {
        console.warn(`[VU=${__VU}] Không thể đọc file raw từ Gist.`);
        return;
    }

    try {
        const data = JSON.parse(res.body);
        if (data.last_updated > vuLocalLastUpdated) {
            console.log(`[VU=${__VU}] Phát hiện proxy mới trên Gist. Đang cập nhật...`);
            vuLocalProxies = data.proxies;
            vuLocalLastUpdated = data.last_updated;
            console.log(`[VU=${__VU}] Cập nhật thành công ${vuLocalProxies.length} proxy.`);
        }
    } catch (e) {
        console.error(`[VU=${__VU}] Lỗi parse JSON từ Gist: ${e}`);
    }
}

let lastLeaderCheck = 0;
function leaderProxyRefresh() {
    const now = Date.now();
    if (now - lastLeaderCheck < 60000) { // Leader chỉ kiểm tra mỗi phút 1 lần
        return;
    }
    lastLeaderCheck = now;

    if (now - vuLocalLastUpdated > PROXY_REFRESH_INTERVAL) {
        console.log(`[VU lãnh đạo] Đã đến lúc làm mới proxy trên Gist.`);
        const newProxies = fetchProxiesFromGithub();
        if (newProxies.length > 0) {
            updateGist(newProxies);
        } else {
            console.warn(`[VU lãnh đạo] Lấy proxy mới thất bại, sẽ thử lại sau.`);
        }
    }
}

// --- CÁC HÀM MÔ PHỎNG HÀNH VI (Giữ nguyên) ---
function firstTimeVisitor(proxies) {
    const params = getBaseParams(proxies);
    group('Hành vi: Khách lần đầu', function () {
        http.get(BASE_URL, Object.assign({}, params, { tags: { type: 'html' } }));
    });
    sleep(Math.random() * 4 + 3);
}

function returningVisitor(proxies) {
    const params = getBaseParams(proxies);
    group('Hành vi: Khách quay lại', function () {
        http.get(BASE_URL, Object.assign({}, params, { tags: { type: 'html' } }));
    });
    sleep(Math.random() * 4 + 3);
}

function getBaseParams(proxyPool) {
    return {
        headers: { 'User-Agent': USER_AGENTS[__VU % USER_AGENTS.length] },
        proxy: proxyPool[__VU % proxyPool.length],
    };
}
