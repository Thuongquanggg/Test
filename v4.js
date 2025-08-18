// ✅✅ v4.js

import http from 'k6/http';
import { group, sleep } from 'k6';
const BASE_URL = __ENV.TARGET_URL || 'https://certapple.com';
const PROXY_FILE_URL = 'https://raw.githubusercontent.com/Thuongquanggg/Proxy/main/proxies.txt';
const PROXY_REFRESH_INTERVAL_MS = 3 * 60 * 1000;
const GIST_CHECK_INTERVAL_MS = 60 * 1000;
const GIST_ID = __ENV.K6_GIST_ID;
const GIST_PAT = __ENV.K6_GIST_PAT;
const GIST_FILENAME = 'proxies.json';
const USER_AGENTS = [
'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/115.0',
]; let vuProxies = [];
let vuLastUpdated = 0;
let lastGistCheckTime = 0;
export const options = {
insecureSkipTLSVerify: true, scenarios: {
daily_traffic_simulation: {
executor: 'ramping-vus', stages: [

{ duration: '2m', target: 500 },
{ duration: '5m', target: 1000 },
{ duration: '5m', target: 1500 },
{ duration: '600m', target: 2000 },

], gracefulStop: '2m',
exec: 'runTest', }, },
thresholds: { 'http_req_failed': ['rate<0.05'] }, };
const GistHelper = {
_getApiUrl: () => `https://api.github.com/gists/${GIST_ID}`,
_getHeaders: () => ({
'Authorization': `token ${GIST_PAT}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json',
}), read: function() {
const res = http.get(this._getApiUrl(), { headers: this._getHeaders() });
if (res.status !== 200) { console.error(`[VU=${__VU}] GistHelper: Lỗi đọc Gist. Status: ${res.status}`); return null; }
try { return JSON.parse(res.json().files[GIST_FILENAME].content); }
catch (e) { console.error(`[VU=${__VU}] GistHelper: Lỗi parse JSON. Lỗi: ${e}`); return null; } },
update: function(proxies) {
const payload = JSON.stringify({ files: { [GIST_FILENAME]: { content: JSON.stringify({ last_updated: Date.now(), proxies: proxies }) } } });
const res = http.patch(this._getApiUrl(), payload, { headers: this._getHeaders() });
if (res.status === 200) { console.log('GistHelper: Cập nhật Gist thành công.'); return true; }
else { console.error(`GistHelper: Lỗi cập nhật Gist. Status: ${res.status}, Body: ${res.body}`); return false; } } };
export function setup() {
console.log('--- Bắt đầu pha SETUP ---');
if (!GIST_ID || !GIST_PAT) throw new Error('K6_GIST_ID và K6_GIST_PAT phải được cung cấp!');
const res = http.get(PROXY_FILE_URL, { timeout: '30s' });
if (res.status !== 200 || !res.body) throw new Error('Không thể lấy danh sách proxy ban đầu.');
const initialProxies = res.body.trim().split('\n').filter(p => p.trim() !== '').slice(0, 200);
console.log(`Lấy được ${initialProxies.length} proxy ban đầu.`);
if (!GistHelper.update(initialProxies)) throw new Error('Cập nhật Gist ban đầu thất bại.');
console.log('--- SETUP hoàn tất, Gist đã được khởi tạo ---');
return { initialProxies: initialProxies, setupTime: Date.now() }; }
export function runTest(data) {
if (vuProxies.length === 0) {
vuProxies = data.initialProxies;
vuLastUpdated = data.setupTime;
lastGistCheckTime = data.setupTime - Math.random() * GIST_CHECK_INTERVAL_MS; }
synchronizeProxies();
if (!vuProxies || vuProxies.length === 0) {
console.error(`[VU=${__VU}] Bể proxy rỗng. Bỏ qua.`); sleep(5); return; }
const random = Math.random();
if (random < 0.5) firstTimeVisitor(); else returningVisitor(); }
function synchronizeProxies() {
const now = Date.now();
if (now - lastGistCheckTime < GIST_CHECK_INTERVAL_MS) { return; }
lastGistCheckTime = now;
let shouldReadGist = false; if (__VU === 1) {
console.log(`[VU Leader] Đang kiểm tra Gist...`);
if (now - vuLastUpdated > PROXY_REFRESH_INTERVAL_MS) {
console.log(`[VU Leader] Đã đến lúc làm mới proxy từ nguồn.`);
const res = http.get(PROXY_FILE_URL);
if (res.status === 200 && res.body) {
const newProxies = res.body.trim().split('\n').filter(p => p.trim() !== '');
if (newProxies.length > 0) GistHelper.update(newProxies.slice(0, 200)); } }
shouldReadGist = true; }
// ✅ time
else if ((__VU % 700) === 1) {
shouldReadGist = true;
console.log(`[VU Trinh sát ${__VU}] Đang kiểm tra Gist...`); }
if (shouldReadGist) {
const gistData = GistHelper.read();
if (gistData && gistData.last_updated > vuLastUpdated) {
console.log(`[VU=${__VU}] Phát hiện proxy mới. Đang cập nhật...`);
vuProxies = gistData.proxies;
vuLastUpdated = gistData.last_updated; } } }
function firstTimeVisitor() {
group('Hành vi: Khách lần đầu', () => { http.get(BASE_URL, getBaseParams()); });
sleep(Math.random() * 4 + 3); }
function returningVisitor() {
group('Hành vi: Khách quay lại', () => { http.get(BASE_URL, getBaseParams()); });
sleep(Math.random() * 4 + 3); }
function getBaseParams() { return {
headers: { 'User-Agent': USER_AGENTS[__VU % USER_AGENTS.length] },
proxy: vuProxies[__VU % vuProxies.length], }; }




