const functions = require('firebase-functions');
const admin = require('firebase-admin');

// 初始化 Admin SDK
try {
  admin.initializeApp();
} catch (_) {}
const db = admin.firestore();

function toE164TW(raw) {
  const s = (raw || '').replace(/[^0-9+]/g, '');
  if (!s) return '';
  if (s.startsWith('+')) return s;
  if (s.startsWith('09') && s.length === 10) return '+886' + s.slice(1);
  return s;
}

exports.resolveEmailByPhone = functions.https.onCall(async (data, context) => {
  const phoneRaw = (data && data.phone || '').trim();
  if (!phoneRaw) {
    throw new functions.https.HttpsError('invalid-argument', '缺少 phone');
  }
  const phone = toE164TW(phoneRaw);
  try {
    const qs = await db.collection('users').where('phone', '==', phone).limit(1).get();
    if (qs.empty) {
      throw new functions.https.HttpsError('not-found', '查無此手機對應的帳號');
    }
    const doc = qs.docs[0];
    const data = doc.data() || {};
    const email = (data.email || '').trim();
    if (!email) {
      throw new functions.https.HttpsError('failed-precondition', '此手機帳號尚未設定電子郵件');
    }
    return { email, uid: doc.id };
  } catch (e) {
    if (e instanceof functions.https.HttpsError) throw e;
    throw new functions.https.HttpsError('internal', e?.message || '查詢失敗');
  }
});

exports.backfillEmailsAndAuth = functions.https.onCall(async (data, context) => {
  // 僅允許管理員執行
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '需登入後才能執行');
  }
  try {
    const caller = await db.collection('users').doc(context.auth.uid).get();
    const role = (caller.exists && caller.data().role) || '';
    if (role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', '僅管理員可執行此操作');
    }
  } catch (e) {
    if (e instanceof functions.https.HttpsError) throw e;
    throw new functions.https.HttpsError('permission-denied', '權限檢查失敗或非管理員');
  }
  const domain = (data && data.domain || '').trim();
  const password = (data && data.password || '').trim();
  const limit = Number(data && data.limit) || 0;
  const dryRun = !!(data && data.dryRun);
  const communityCode = (data && data.communityCode || '').trim();

  if (!domain) {
    throw new functions.https.HttpsError('invalid-argument', '缺少 domain');
  }

  function genPassword() {
    if (password && password.length >= 6) return password;
    return 'Temp' + Math.random().toString(36).slice(2, 10) + '!1';
  }

  function makeEmailFromPhone(phoneE164, domain) {
    const local = ('p' + (phoneE164 || '').replace(/[^0-9]/g, '')).slice(0, 64) || 'user';
    return `${local}@${domain}`;
  }

  try {
    const usersSnap = await db.collection('users').get();
    const candidates = [];
    usersSnap.forEach(doc => {
      const d = doc.data() || {};
      const phoneRaw = (d.phone || '').trim();
      const emailRaw = (d.email || '').trim();
      if (!phoneRaw) return;
      if (emailRaw) return; // 僅處理尚未設定 Email 的帳號
      if (communityCode && (d.serviceCommunityCode || '') !== communityCode) return;
      candidates.push({ uid: doc.id, phone: toE164TW(phoneRaw), name: d.name || '', communityCode: d.serviceCommunityCode || '' });
    });
    const max = limit > 0 ? Math.min(limit, candidates.length) : candidates.length;
    const result = { processed: 0, created: 0, updated: 0, conflicts: 0, invalid: 0, errors: 0, notFound: 0, items: [] };

    for (let i = 0; i < max; i++) {
      const u = candidates[i];
      const phone = u.phone;
      if (!phone || phone.length < 10) { result.invalid++; result.processed++; continue; }
      const email = makeEmailFromPhone(phone, domain);
      const pass = genPassword();
      if (dryRun) {
        result.items.push({ uid: u.uid, phone, email, action: 'plan' });
        result.processed++;
        continue;
      }
      try {
        let existed = false;
        try { await admin.auth().getUser(u.uid); existed = true; } catch (_) {}
        if (existed) {
          await admin.auth().updateUser(u.uid, { email, password: pass, phoneNumber: phone });
          result.updated++;
        } else {
          await admin.auth().createUser({ uid: u.uid, email, password: pass, phoneNumber: phone });
          result.created++;
        }
        // 寫回 Firestore 的 email 欄位
        await db.collection('users').doc(u.uid).update({ email });
        result.items.push({ uid: u.uid, phone, email, action: existed ? 'update' : 'create' });
      } catch (err) {
        const code = err?.errorInfo?.code || err?.code || '';
        if (code === 'auth/email-already-exists') { result.conflicts++; } 
        else if (code === 'auth/phone-number-already-exists') { result.conflicts++; }
        else if (code === 'auth/user-not-found') { result.notFound++; }
        else { result.errors++; }
        result.items.push({ uid: u.uid, phone, email, error: code || String(err) });
      } finally {
        result.processed++;
      }
    }

    return result;
  } catch (e) {
    throw new functions.https.HttpsError('internal', e?.message || '執行失敗');
  }
});