/*
  批次將 Firestore users 集合中的手機號碼連結到 Firebase Auth 帳號的 phoneNumber
  用法：
    node scripts/bulk-link-phones.js --dry-run           僅列出將要更新的帳號（不實際更新）
    node scripts/bulk-link-phones.js                     實際執行更新
    node scripts/bulk-link-phones.js --limit=100         限制最多更新 100 筆
    node scripts/bulk-link-phones.js --community=A101    僅處理指定社區代碼（users.serviceCommunityCode）

  初始化 Admin SDK：
    - 建議設定環境變數 GOOGLE_APPLICATION_CREDENTIALS 指向 service account JSON
    - 或將 service account JSON 放在專案根目錄，檔名 service-account.json
*/

const admin = require('firebase-admin');

function initAdmin() {
  try {
    // 先嘗試使用預設憑證（GOOGLE_APPLICATION_CREDENTIALS）
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
    return;
  } catch (e) {
    // Fallback: 尋找本地 service-account.json
    try {
      const sa = require('../service-account.json');
      admin.initializeApp({ credential: admin.credential.cert(sa) });
      return;
    } catch (e2) {
      console.error('初始化 Admin SDK 失敗：請設定 GOOGLE_APPLICATION_CREDENTIALS 或提供 service-account.json');
      process.exit(1);
    }
  }
}

initAdmin();

const db = admin.firestore();
const auth = admin.auth();

function toE164TW(raw) {
  const s = (raw || '').replace(/[^0-9+]/g, '');
  if (!s) return '';
  if (s.startsWith('+')) return s;
  // 09xxxxxxxx -> +8869xxxxxxxx
  if (s.startsWith('09') && s.length === 10) return '+886' + s.slice(1);
  return s;
}

function parseArgs() {
  const argv = process.argv.slice(2);
  const args = { dryRun: false, limit: null, community: null };
  for (const a of argv) {
    if (a === '--dry-run') args.dryRun = true;
    else if (a.startsWith('--limit=')) args.limit = parseInt(a.split('=')[1], 10) || null;
    else if (a.startsWith('--community=')) args.community = a.split('=')[1] || null;
  }
  return args;
}

async function fetchUsers({ community }) {
  const col = db.collection('users');
  const snap = await col.get();
  const list = [];
  snap.forEach(doc => {
    const data = doc.data() || {};
    if (!data.phone) return;
    if (community && (data.serviceCommunityCode || '') !== community) return;
    list.push({ uid: doc.id, phone: data.phone, name: data.name || '', communityCode: data.serviceCommunityCode || '' });
  });
  return list;
}

async function linkPhones(users, { dryRun, limit }) {
  const tasks = [];
  const max = typeof limit === 'number' && limit > 0 ? Math.min(limit, users.length) : users.length;
  let processed = 0;
  let ok = 0, skipped = 0, conflicts = 0, notFound = 0, invalid = 0, errors = 0;

  for (let i = 0; i < max; i++) {
    const u = users[i];
    const e164 = toE164TW(u.phone);
    if (!e164 || e164.length < 10) {
      console.warn(`[invalid] ${u.uid} ${u.name} phone=${u.phone}`);
      invalid++; processed++; continue;
    }
    if (dryRun) {
      console.log(`[dry-run] would update uid=${u.uid} phone=${e164} (${u.name})`);
      processed++; ok++; continue;
    }
    tasks.push(
      auth.updateUser(u.uid, { phoneNumber: e164 })
        .then(() => { console.log(`[linked] uid=${u.uid} phone=${e164} (${u.name})`); ok++; })
        .catch(err => {
          const code = err?.errorInfo?.code || err?.code || '';
          if (code === 'auth/phone-number-already-exists') {
            console.warn(`[conflict] ${u.uid} ${u.name} phone=${e164} 已被其他帳號使用`);
            conflicts++;
          } else if (code === 'auth/user-not-found') {
            console.warn(`[not-found] users 文檔存在但 Auth 不存在 uid=${u.uid}`);
            notFound++;
          } else {
            console.error(`[error] uid=${u.uid} phone=${e164}`, err);
            errors++;
          }
        })
        .finally(() => { processed++; })
    );
  }

  // 控制並行：每 20 筆一批
  const batchSize = 20;
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    await Promise.all(batch);
  }

  return { processed, ok, skipped, conflicts, notFound, invalid, errors };
}

(async function main(){
  try {
    const args = parseArgs();
    console.log('開始批次連結手機號碼到 Auth', args);
    const users = await fetchUsers({ community: args.community });
    console.log(`擬處理 ${users.length} 筆使用者（含 phone）`);
    const result = await linkPhones(users, args);
    console.log('完成', result);
    process.exit(0);
  } catch (e) {
    console.error('執行失敗', e);
    process.exit(1);
  }
})();