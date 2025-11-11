// 打卡功能相關函數

// 確保state對象存在
if (typeof state === 'undefined') {
    window.state = {};
}

// 建立 showToast 本地別名並全域掛載（避免模組作用域下未解析）
const showToast = (typeof window.showToast === 'function')
    ? window.showToast
    : function(message, isError = false) {
        try {
            const toast = document.getElementById('toast');
            if (!toast) {
                console.log('[Toast]', message);
                return;
            }
            toast.textContent = message;
            toast.className = `toast show ${isError ? 'bg-red-500' : 'bg-gray-800'}`;
            setTimeout(() => {
                toast.className = 'toast';
            }, 3000);
        } catch (e) {
            console.log('[Toast]', message);
        }
    };
// 確保全域亦可使用
window.showToast = showToast;

// 建立 showLoading 本地別名並全域掛載（避免模組作用域下未解析）
const showLoading = (typeof window.showLoading === 'function')
    ? window.showLoading
    : function(show) {
        try {
            const el = document.getElementById('loading-screen');
            if (el) {
                el.classList.toggle('hide', !show);
            } else {
                let overlay = document.getElementById('global-loading-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'global-loading-overlay';
                    overlay.className = 'fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center';
                    const box = document.createElement('div');
                    box.className = 'bg-white rounded-md shadow p-4 text-gray-700';
                    box.textContent = '處理中...';
                    overlay.appendChild(box);
                    overlay.style.display = 'none';
                    document.body.appendChild(overlay);
                }
                overlay.style.display = show ? 'flex' : 'none';
            }
        } catch (_) {}
    };
// 確保全域亦可使用
window.showLoading = showLoading;

// 設置打卡狀態屬性
if (typeof state.clockInStatus === 'undefined') {
    state.clockInStatus = 'none';
}

// 一次性錯誤提示旗標（避免重複提示）
if (typeof state.autoSettingsErrorPromptShown === 'undefined') {
    state.autoSettingsErrorPromptShown = false;
}

// 根據狀態更新顯示文本和樣式
function updateStatusTextAndStyle(statusText, statusDisplay) {
    let commLabel = '';
    try {
        const rec = (window.state && window.state.__latestRecord) ? window.state.__latestRecord : null;
        const byId = (window.state && window.state.communitiesById) ? window.state.communitiesById : {};
        if (rec) {
            // 先嘗試使用紀錄內嵌社區短名/名稱（若有）
            try {
                const embedded = rec.community || {};
                const embeddedLabel = (embedded.shortName || embedded.name || '').trim();
                if (embeddedLabel) commLabel = embeddedLabel;
            } catch (_) {}
            const rcid = (rec.communityId || '').trim();
            const rcode = (rec.communityCode || rec.community?.code || '').trim();
            if (rcid && byId[rcid]) {
                const cm = byId[rcid];
                // 僅使用短名/名稱，避免顯示社區編號或ID
                commLabel = (cm.shortName || cm.name || '').trim();
            } else if (rcode) {
                const cm = Object.values(byId).find(c => (String(c.code || '').trim()) === rcode);
                // 僅在能映射到社區時使用；避免顯示社區編號
                commLabel = cm ? ((cm.shortName || cm.name || '').trim()) : '';
            }
        }
    } catch (_) {}
    if (!commLabel) {
        const comm = (window.state && window.state.currentCommunity) ? window.state.currentCommunity : null;
        // 僅使用短名/名稱作為顯示，避免顯示社區編號或ID
        commLabel = comm && ((comm.shortName || comm.name) || '') || '';
    }
    switch(state.clockInStatus) {
        case '上班':
            statusText.textContent = commLabel ? `已 ${commLabel} 上班` : '上班';
            statusDisplay.className = 'mb-4 p-3 rounded-lg text-center bg-green-100 text-green-800';
            break;
        case '下班':
            statusText.textContent = commLabel ? `已 ${commLabel} 下班` : '下班';
            statusDisplay.className = 'mb-4 p-3 rounded-lg text-center bg-red-100 text-red-800';
            break;
        case '已下班-未打卡':
            statusText.textContent = commLabel ? `已 ${commLabel} 下班` : '下班';
            statusDisplay.className = 'mb-4 p-3 rounded-lg text-center bg-yellow-100 text-yellow-800';
            break;
        case '外出':
            statusText.textContent = commLabel ? `已 ${commLabel} 上班` : '上班';
            statusDisplay.className = 'mb-4 p-3 rounded-lg text-center bg-emerald-100 text-emerald-800';
            break;
        case '抵達':
            statusText.textContent = commLabel ? `已 ${commLabel} 上班` : '上班';
            statusDisplay.className = 'mb-4 p-3 rounded-lg text-center bg-blue-100 text-blue-800';
            break;
        case '離開':
            statusText.textContent = commLabel ? `已 ${commLabel} 上班` : '上班';
            statusDisplay.className = 'mb-4 p-3 rounded-lg text-center bg-blue-100 text-blue-800';
            break;
        case '返回':
            statusText.textContent = commLabel ? `已 ${commLabel} 上班` : '上班';
            statusDisplay.className = 'mb-4 p-3 rounded-lg text-center bg-green-100 text-green-800';
            break;
        case '臨時請假':
            statusText.textContent = commLabel ? `已 ${commLabel} 請假` : '請假';
            statusDisplay.className = 'mb-4 p-3 rounded-lg text-center bg-orange-100 text-orange-800';
            break;
        case '特殊勤務':
            statusText.textContent = commLabel ? `已 ${commLabel} 上班` : '上班';
            statusDisplay.className = 'mb-4 p-3 rounded-lg text-center bg-purple-100 text-purple-800';
            break;
        default:
            statusText.textContent = '下班';
            statusDisplay.className = 'mb-4 p-3 rounded-lg text-center bg-gray-100 text-gray-800';
    }
}

// 更新狀態顯示
async function updateStatusDisplay() {
    // 檢查狀態顯示區域是否存在，如果不存在則創建
    let statusDisplay = document.getElementById('status-display');
    if (!statusDisplay) {
        const clockInContainer = document.getElementById('clock-in-container');
        const clockInButtons = document.getElementById('clock-in-buttons');
        
        if (!clockInContainer || !clockInButtons) return;
        
        statusDisplay = document.createElement('div');
        statusDisplay.id = 'status-display';
        statusDisplay.className = 'mb-4 p-3 rounded-lg text-center';
        
        const statusText = document.createElement('span');
        statusText.id = 'status-text';
        statusText.textContent = '尚未打卡';
        statusDisplay.appendChild(statusText);
        
        clockInContainer.insertBefore(statusDisplay, clockInButtons);
    }
    
    // 確保社區快取已載入，避免標籤為空
    try { if (typeof ensureCommunitiesCache === 'function') { await ensureCommunitiesCache(); } } catch (_) {}
    // 嘗試計算可用社區並更新頁首社區顯示，讓 currentCommunity 盡快就緒
    try { if (typeof computeAvailableCommunities === 'function') { await computeAvailableCommunities(); } } catch (_) {}
    try { if (typeof updateHeaderCommunity === 'function') { updateHeaderCommunity(); } } catch (_) {}
    // 等待目前社區就緒（短名或名稱），最多約1秒
    try {
        let tries = 0;
        while (tries < 10) {
            const comm = (window.state && window.state.currentCommunity) ? window.state.currentCommunity : null;
            const ready = !!(comm && (comm.shortName || comm.name));
            if (ready) break;
            await new Promise(r => setTimeout(r, 100));
            tries++;
        }
    } catch (_) {}

    // 更新儀表板狀態
    updateDashboardStatus();
    
    // 更新打卡狀態顯示（嚴格依目前社區過濾）
    const statusText = document.getElementById('status-text');
    if (statusText) {
        if (window.__auth?.currentUser) {
            const userId = window.__auth.currentUser.uid;
            const fs = window.__fs || {};
            const db = window.__db;
            const { collection, query, where, orderBy, limit, getDocs, doc, getDoc } = fs;
            const comm = (window.state && window.state.currentCommunity) ? window.state.currentCommunity : null;
            (async () => {
                let shown = false;
                // 優先：使用社區限制查詢最新紀錄
                try {
                    if (db && collection && query && where && orderBy && limit && getDocs) {
                        let q;
                        if (comm && (comm.id || comm.code || comm.communityCode)) {
                            if (comm.id) {
                                q = query(
                                    collection(db, 'clockInRecords'),
                                    where('userId','==', userId),
                                    where('communityId','==', comm.id),
                                    orderBy('timestamp','desc'),
                                    limit(1)
                                );
                            } else {
                                const ccode = (comm.code || comm.communityCode);
                                q = query(
                                    collection(db, 'clockInRecords'),
                                    where('userId','==', userId),
                                    where('communityCode','==', ccode),
                                    orderBy('timestamp','desc'),
                                    limit(1)
                                );
                            }
                            const snap = await getDocs(q);
                            if (!snap.empty) {
                                const r = snap.docs[0].data();
                                state.clockInStatus = r.type || 'none';
                                state.outboundLocation = r.locationName || null;
                                state.dutyType = r.dutyType || null;
                                updateStatusTextAndStyle(statusText, statusDisplay);
                                shown = true;
                            }
                        }
                    }
                } catch (e) {
                    const expected = ['permission-denied','failed-precondition','invalid-argument'];
                    const logFn = expected.includes(e?.code) ? console.warn : console.error;
                    logFn('個人狀態（社區限制）查詢失敗:', e?.code, e?.message || e);
                }

                // 備援：抓取最近 N 筆再前端過濾（僅當前社區）
                if (!shown) {
                    try {
                        if (db && collection && query && orderBy && limit && getDocs) {
                            const snap = await getDocs(query(collection(db, 'clockInRecords'), orderBy('timestamp','desc'), limit(200)));
                            const cid = (comm && comm.id) ? String(comm.id).trim() : '';
                            const ccode = (comm && (comm.code || comm.communityCode)) ? String(comm.code || comm.communityCode).trim() : '';
                            const my = snap.docs.find(d => {
                                const r = d.data() || {};
                                if (r.userId !== userId) return false;
                                const rcid = (r.communityId || '').trim();
                                const rcode = (r.communityCode || r.dutyCommunityCode || '').trim();
                                if (cid && rcid && rcid === cid) return true;
                                if (ccode && rcode && rcode === ccode) return true;
                                // 未設定社區時，允許顯示（例如首頁或無社區上下文）
                                if (!comm) return true;
                                return false;
                            });
                            if (my) {
                                const r = my.data();
                                state.clockInStatus = r.type || 'none';
                                state.outboundLocation = r.locationName || null;
                                state.dutyType = r.dutyType || null;
                                try { window.state.__latestRecord = r; } catch (_) {}
                                updateStatusTextAndStyle(statusText, statusDisplay);
                                shown = true;
                            }
                        }
                    } catch (e) {
                        console.warn('個人狀態備援查詢失敗', e);
                    }
                }

                // 最終：讀取 users 狀態，僅在無社區上下文時使用；有社區但未找到匹配則顯示「尚未打卡」
                if (!shown) {
                    try {
                        if (db && doc && getDoc) {
                            const userRef = doc(db, 'users', userId);
                            const userDoc = await getDoc(userRef);
                            if (!comm && userDoc.exists() && userDoc.data().clockInStatus) {
                                const data = userDoc.data();
                                state.clockInStatus = data.clockInStatus;
                                state.outboundLocation = data.outboundLocation || null;
                                state.dutyType = data.dutyType || null;
                                state.leaveReason = data.leaveReason || null;
                                state.leaveStatus = data.leaveStatus || null;
                            } else {
                                // 有社區但找不到對應紀錄：視為社區內「尚未打卡」
                                state.clockInStatus = 'none';
                            }
                        }
                    } catch (error) {
                        console.error('獲取用戶狀態失敗:', error);
                    } finally {
                        updateStatusTextAndStyle(statusText, statusDisplay);
                    }
                }
            })();
        } else {
            updateStatusTextAndStyle(statusText, statusDisplay);
        }
    }
}

// 更新儀表板狀態
function updateDashboardStatus() {
    const dashboardStatusElement = document.getElementById('my-status');
    if (!dashboardStatusElement) return;

    (async () => {
        // 確保社區快取已載入，讓狀態文字能插入社區名稱
        try { if (typeof ensureCommunitiesCache === 'function') { await ensureCommunitiesCache(); } } catch (_) {}
        // 等待目前社區就緒（短名或名稱），最多約1秒
        try {
            let tries = 0;
            while (tries < 10) {
                const comm = (window.state && window.state.currentCommunity) ? window.state.currentCommunity : null;
                const ready = !!(comm && (comm.shortName || comm.name));
                if (ready) break;
                await new Promise(r => setTimeout(r, 100));
                tries++;
            }
        } catch (_) {}
        const { collection, query, where, orderBy, limit, getDocs, doc, getDoc } = window.__fs;
        const userId = window.__auth?.currentUser?.uid || state.currentUser?.uid;
        if (!userId) {
            const statusText = '尚未打卡';
            const statusColor = getStatusColor(statusText);
            dashboardStatusElement.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="font-semibold text-lg ${statusColor}">${statusText}</span>
                </div>`;
            return;
        }

        // 優先使用：限制於目前社區的最新紀錄（需要複合索引）
        try {
            const comm = (window.state && window.state.currentCommunity) ? window.state.currentCommunity : null;
            let q;
            if (comm && (comm.id || comm.code || comm.communityCode)) {
                if (comm.id) {
                    q = query(
                        collection(window.__db, 'clockInRecords'),
                        where('userId', '==', userId),
                        where('communityId', '==', comm.id),
                        orderBy('timestamp', 'desc'),
                        limit(1)
                    );
                } else {
                    const ccode = (comm.code || comm.communityCode);
                    q = query(
                        collection(window.__db, 'clockInRecords'),
                        where('userId', '==', userId),
                        where('communityCode', '==', ccode),
                        orderBy('timestamp', 'desc'),
                        limit(1)
                    );
                }
            } else {
                q = query(
                    collection(window.__db, 'clockInRecords'),
                    where('userId', '==', userId),
                    orderBy('timestamp', 'desc'),
                    limit(1)
                );
            }
            const snap = await getDocs(q);
            if (!snap.empty) {
                const r = snap.docs[0].data();
                let statusText = getStatusDisplayText(r.type || '未知', r.locationName || null, r.dutyType || null);
                // 以紀錄的社區資訊覆蓋（優先短名）
                try {
                    const byId = state.communitiesById || {};
                    const rcid = (r.communityId || '').trim();
                    const rcode = (r.communityCode || r.dutyCommunityCode || '').trim();
                    // 若無法映射，使用紀錄內嵌社區名稱
                    let embeddedName = '';
                    try { embeddedName = (r.community && (r.community.shortName || r.community.name)) ? (r.community.shortName || r.community.name) : ''; } catch (_) {}
                    let commLabel = embeddedName;
                    if (rcid && byId[rcid]) {
                        const cm = byId[rcid];
                        // 僅使用短名/名稱，避免顯示社區編號或ID
                        commLabel = (cm.shortName || cm.name || '').trim();
                    } else if (rcode) {
                        const cm = Object.values(byId).find(c => (String(c.code || '').trim()) === rcode);
                        // 僅在能映射到社區時使用；避免顯示社區編號
                        commLabel = cm ? ((cm.shortName || cm.name || '').trim()) : '';
                    }
                    if (commLabel) {
                        if (statusText.includes('上班')) statusText = `已 ${commLabel} 上班`;
                        else if (statusText.includes('下班')) statusText = `已 ${commLabel} 下班`;
                        else if (statusText.includes('請假')) statusText = `已 ${commLabel} 請假`;
                    }
                } catch(_) {}
                const statusColor = getStatusColor(statusText);
                const ts = r.timestamp && r.timestamp.toDate ? r.timestamp.toDate() : (r.timestamp ? new Date(r.timestamp) : null);
                dashboardStatusElement.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="font-semibold text-lg ${statusColor}">${statusText}</span>
                    </div>
                    <div class="text-sm text-gray-500 mt-1">
                        ${ts ? '打卡 ' + ts.toLocaleString('zh-TW', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false}) : ''}
                    </div>`;
                return;
            }
        } catch (e) {
            // 若因缺少索引或權限導致失敗，記錄但不中斷流程
            const expectedCodes = ['permission-denied','failed-precondition','invalid-argument'];
            const logFn = expectedCodes.includes(e?.code) ? console.warn : console.error;
            logFn('讀取最新打卡紀錄（複合索引）失敗:', e?.code, e?.message || e);
        }

        // 備援：只按 timestamp desc 抓取最近 N 筆，再用 userId + 社區篩選
        try {
            const fallbackQ = query(
                collection(window.__db, 'clockInRecords'),
                orderBy('timestamp', 'desc'),
                limit(200)
            );
            const fallbackSnap = await getDocs(fallbackQ);
            const comm = (window.state && window.state.currentCommunity) ? window.state.currentCommunity : null;
            const cname = (comm && comm.name) ? String(comm.name).trim() : '';
            const cid = (comm && comm.id) ? String(comm.id).trim() : '';
            const ccode = (comm && (comm.code || comm.communityCode)) ? String(comm.code || comm.communityCode).trim() : '';
            const myDoc = fallbackSnap.docs.find(d => {
                const r = d.data() || {};
                if (r.userId !== userId) return false;
                const rcid = (r.communityId || '').trim();
                const rcode = (r.communityCode || r.dutyCommunityCode || '').trim();
                const lname = (r.locationName || '').trim();
                if (cid && rcid && rcid === cid) return true;
                if (ccode && rcode && rcode === ccode) return true;
                if (cname && lname && lname.includes(cname)) return true;
                // 若未設定社區或舊紀錄無社區欄位，則允許顯示
                if (!comm) return true;
                return false;
            });
            if (myDoc) {
                const r = myDoc.data();
                try { window.state.__latestRecord = r; } catch (_) {}
                let statusText = getStatusDisplayText(r.type || '未知', r.locationName || null, r.dutyType || null);
                // 以紀錄的社區資訊覆蓋（優先短名）
                try {
                    const byId = state.communitiesById || {};
                    const rcid = (r.communityId || '').trim();
                    const rcode = (r.communityCode || r.dutyCommunityCode || '').trim();
                    // 若無法映射，使用紀錄內嵌社區名稱
                    let embeddedName = '';
                    try { embeddedName = (r.community && (r.community.shortName || r.community.name)) ? (r.community.shortName || r.community.name) : ''; } catch (_) {}
                    let commLabel = '';
                    if (rcid && byId[rcid]) {
                        const cm = byId[rcid];
                        // 僅使用短名/名稱，避免顯示社區編號或ID
                        commLabel = (cm.shortName || cm.name || '').trim();
                    } else if (rcode) {
                        const cm = Object.values(byId).find(c => (String(c.code || '').trim()) === rcode);
                        // 僅在能映射到社區時使用；避免顯示社區編號
                        commLabel = cm ? ((cm.shortName || cm.name || '').trim()) : '';
                    } else if (embeddedName) {
                        commLabel = embeddedName;
                    }
                    if (commLabel) {
                        if (statusText.includes('上班')) statusText = `已 ${commLabel} 上班`;
                        else if (statusText.includes('下班')) statusText = `已 ${commLabel} 下班`;
                        else if (statusText.includes('請假')) statusText = `已 ${commLabel} 請假`;
                    }
                } catch(_) {}
                const statusColor = getStatusColor(statusText);
                const ts = r.timestamp && r.timestamp.toDate ? r.timestamp.toDate() : (r.timestamp ? new Date(r.timestamp) : null);
                dashboardStatusElement.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="font-semibold text-lg ${statusColor}">${statusText}</span>
                    </div>
                    <div class="text-sm text-gray-500 mt-1">
                        ${ts ? '打卡 ' + ts.toLocaleString('zh-TW', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false}) : ''}
                    </div>`;
                return;
            }
        } catch (e) {
            const expectedCodes = ['permission-denied','invalid-argument'];
            const logFn = expectedCodes.includes(e?.code) ? console.warn : console.error;
            logFn('備援查詢最新打卡紀錄失敗:', e?.code, e?.message || e);
        }

        // 最終回退：讀取 users 文件中的狀態欄位
        try {
            const userRef = doc(window.__db, 'users', userId);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists() && userDoc.data().clockInStatus) {
                const u = userDoc.data();
                const statusText = getStatusDisplayText(u.clockInStatus, u.outboundLocation || null, u.dutyType || null);
                try {
                    const comm = (window.state && window.state.currentCommunity) ? window.state.currentCommunity : null;
                    // 僅使用短名/名稱作為顯示，避免顯示社區編號或ID
                    const label = comm && ((comm.shortName || comm.name) || '') || '';
                    if (label) {
                        if (statusText.includes('上班')) state.clockInStatus = '上班';
                        else if (statusText.includes('下班') || statusText.includes('已下班')) state.clockInStatus = '下班';
                        else if (statusText.includes('請假')) state.clockInStatus = '臨時請假';
                    }
                } catch (_) {}
                const statusColor = getStatusColor(statusText);
                const ts = u.lastUpdated && u.lastUpdated.toDate ? u.lastUpdated.toDate() : (u.lastUpdated ? new Date(u.lastUpdated) : null);
                dashboardStatusElement.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="font-semibold text-lg ${statusColor}">${(function(){
                            try {
                                const comm = (window.state && window.state.currentCommunity) ? window.state.currentCommunity : null;
                                // 僅使用短名/名稱作為顯示，避免顯示社區編號或ID
                                const label = comm && ((comm.shortName || comm.name) || '') || '';
                                if (label) {
                                    if (statusText.includes('上班')) return `已 ${label} 上班`;
                                    if (statusText.includes('下班') || statusText.includes('已下班')) return `已 ${label} 下班`;
                                    if (statusText.includes('請假')) return `已 ${label} 請假`;
                                }
                            } catch (_) {}
                            return statusText;
                        })()}</span>
                    </div>
                    <div class="text-sm text-gray-500 mt-1">
                        ${ts ? '狀態更新 ' + ts.toLocaleString('zh-TW', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false}) : ''}
                    </div>`;
            } else {
                const statusText = '尚未打卡';
                const statusColor = getStatusColor(statusText);
                dashboardStatusElement.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="font-semibold text-lg ${statusColor}">${statusText}</span>
                    </div>`;
            }
        } catch (e) {
            const statusText = '尚未打卡';
            const statusColor = getStatusColor(statusText);
            dashboardStatusElement.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="font-semibold text-lg ${statusColor}">${statusText}</span>
                </div>`;
        }
    })();
}

// 初始化打卡按鈕狀態
function initClockInButtonStatus() {
    // 檢查用戶是否已登入
    if (!window.__auth?.currentUser) {
        console.log("用戶尚未登入，無法初始化打卡按鈕");
        setTimeout(initClockInButtonStatus, 1000); // 延遲重試
        return;
    }
    
    // 獲取當前用戶ID
    const userId = window.__auth.currentUser.uid;
    
    // 檢查按鈕容器是否存在
    const clockInButtons = document.getElementById('clock-in-buttons');
    if (!clockInButtons) {
        console.debug("打卡按鈕容器不存在，稍後重試");
        setTimeout(initClockInButtonStatus, 500);
        return;
    }
    
    // 禁用所有按鈕，等待狀態確認
    clockInButtons.querySelectorAll('button').forEach(button => {
        button.disabled = false; // 先設為可用
        button.classList.remove('disabled');
        if (button.dataset.type === '上班') {
            button.classList.remove('bg-gray-300', 'cursor-not-allowed');
            button.classList.add('bg-green-500', 'hover:bg-green-600');
        } else {
            button.classList.remove('bg-blue-500', 'hover:bg-blue-600', 'bg-green-500', 'hover:bg-green-600');
            button.classList.add('bg-gray-300', 'cursor-not-allowed');
            button.classList.add('disabled');
        }
    });
    
    // 從Firestore獲取用戶最後的打卡狀態
    const { doc, getDoc } = window.__fs;
    const userRef = doc(window.__db, 'users', userId);
    getDoc(userRef).then(userDoc => {
        if (userDoc.exists() && userDoc.data().clockInStatus) {
            // 設置全局狀態
            const data = userDoc.data();
            state.clockInStatus = data.clockInStatus;
            state.outboundLocation = data.outboundLocation || null;
            
            // 更新按鈕狀態
            updateButtonStatus();
        } else {
            // 新用戶，只啟用上班打卡
            state.clockInStatus = 'none';
            state.outboundLocation = null;
            enableOnlyButton('上班');
        }
        
        // 更新狀態顯示
        updateStatusDisplay();
        
        // 檢查是否有超時需要自動下班打卡的情況
        setTimeout(() => {
            checkAndHandleOvertimeClockOut();
        }, 1000); // 延遲1秒執行，確保狀態已更新
        
    }).catch(error => {
        console.error("獲取用戶狀態失敗:", error);
        // 離線容錯：給預設狀態，允許上班打卡
        state.clockInStatus = 'none';
        state.outboundLocation = null;
        enableOnlyButton('上班');
        updateStatusDisplay();
        showToast("目前離線，僅提供上班打卡；恢復連線後會自動同步", true);
    });
}

// 更新按鈕狀態
function updateButtonStatus() {
    // 先檢查按鈕容器是否存在
    const clockInButtons = document.getElementById('clock-in-buttons');
    if (!clockInButtons) {
        console.debug("打卡按鈕容器不存在，無法更新按鈕狀態");
        return;
    }
    
    // 先禁用所有按鈕
    clockInButtons.querySelectorAll('button').forEach(button => {
        button.disabled = true; // 設為不可用
        button.classList.remove('bg-blue-500', 'hover:bg-blue-600', 'bg-green-500', 'hover:bg-green-600', 
                               'bg-red-500', 'hover:bg-red-600', 'bg-orange-500', 'hover:bg-orange-600',
                               'bg-purple-500', 'hover:bg-purple-600', 'bg-teal-700', 'hover:bg-teal-800',
                               'bg-red-700', 'hover:bg-red-800');
        button.classList.add('bg-gray-300', 'cursor-not-allowed', 'disabled');
    });
    
    // 臨時請假和特殊勤務按鈕始終保持可按，請假申請靠右在 HTML 已處理
    enableSpecialButton('臨時請假', 'bg-orange-500');
    enableSpecialButton('特殊勤務', 'bg-purple-500');

    // 返回按鈕預設顯示且不可用（灰）；僅在「離開」之後變為深綠可動作
    const returnBtn = document.getElementById('return-btn');
    if (returnBtn) {
        returnBtn.disabled = true;
        returnBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600', 'bg-green-700', 'hover:bg-green-800', 'bg-blue-500', 'hover:bg-blue-600');
        returnBtn.classList.add('bg-gray-300', 'cursor-not-allowed', 'disabled');
        returnBtn.dataset.type = '返回';
        returnBtn.innerHTML = '返回<br>打卡';
    }

    // 複合循環按鈕（外出/抵達/離開/返回）動態設定器
    const setOutboundCycleButton = (nextType, label, bgClass) => {
        const cycleBtn = document.getElementById('outbound-cycle-btn');
        if (!cycleBtn) return;
        cycleBtn.dataset.type = nextType;
        // 將「打卡」移至下一行
        cycleBtn.innerHTML = String(label).replace('打卡', '<br>打卡');
        cycleBtn.disabled = false;
        cycleBtn.classList.remove('bg-gray-300', 'cursor-not-allowed', 'disabled',
                                  'bg-blue-500', 'hover:bg-blue-600', 'bg-teal-700', 'hover:bg-teal-800',
                                  'bg-red-700', 'hover:bg-red-800');
        if (bgClass) {
            cycleBtn.classList.add(bgClass);
        }
    };

    // 上班/下班兩個獨立按鈕動態設定器
    const setWorkToggleButton = (nextType, label, bgClass) => {
        const startBtn = document.getElementById('work-start-btn');
        const endBtn = document.getElementById('work-end-btn');
        if (!startBtn || !endBtn) return;
        // 重置樣式
        [startBtn, endBtn].forEach(btn => {
            btn.classList.remove('bg-gray-300','cursor-not-allowed','disabled','bg-green-500','hover:bg-green-600','bg-red-500','hover:bg-red-600');
        });

        // 設定文字與型別
        startBtn.dataset.type = '上班';
        startBtn.innerHTML = '上班<br>打卡';
        endBtn.dataset.type = '下班';
        endBtn.innerHTML = '下班<br>打卡';

        // 依當前狀態切換按鈕顏色與禁用
        const workingStates = ['上班','外出','抵達','離開','返回'];
        if (workingStates.includes(state.clockInStatus)) {
            // 已上班或工作流程中：上班灰色禁用，下班紅色可按
            startBtn.disabled = true;
            startBtn.classList.add('bg-gray-300','cursor-not-allowed','disabled');
            endBtn.disabled = false;
            endBtn.classList.add('bg-red-500','hover:bg-red-600');
        } else if (state.clockInStatus === '下班' || state.clockInStatus === '已下班-未打卡') {
            // 已下班：下班灰色禁用，上班綠色可按
            endBtn.disabled = true;
            endBtn.classList.add('bg-gray-300','cursor-not-allowed','disabled');
            startBtn.disabled = false;
            startBtn.classList.add('bg-green-500','hover:bg-green-600');
        } else {
            // 初始/未知：預設僅開啟上班（綠），下班灰色
            startBtn.disabled = false;
            startBtn.classList.add('bg-green-500','hover:bg-green-600');
            endBtn.disabled = true;
            endBtn.classList.add('bg-gray-300','cursor-not-allowed','disabled');
        }
    };
    
    // 根據當前狀態啟用相應按鈕
    switch(state.clockInStatus) {
        case 'none':
            // 尚未打卡，只啟用上班（切換按鈕設為上班）
            setWorkToggleButton('上班', '上班打卡', 'bg-green-500');
            // 讓外出打卡在初始狀態也可動作（藍色）
            setOutboundCycleButton('外出', '外出打卡', 'bg-blue-500');
            break;
        case '上班':
            // 已上班：下班可動作（紅），外出可動作（藍），返回不可動作（灰）
            setWorkToggleButton('下班', '下班打卡', 'bg-red-500');
            setOutboundCycleButton('外出', '外出打卡', 'bg-blue-500');
            // 返回維持不可用
            break;
        case '下班':
            // 已下班：上班可動作（綠），外出可動作（藍），返回不可動作（灰）
            setWorkToggleButton('上班', '上班打卡', 'bg-green-500');
            setOutboundCycleButton('外出', '外出打卡', 'bg-blue-500');
            break;
        case '已下班-未打卡':
            // 已下班但未打卡，預設提供下班（亦可在頁面重新載入後選擇上班）
            setWorkToggleButton('下班', '下班打卡', 'bg-red-500');
            break;
        case '外出':
            // 外出中：抵達可動作（藍系）；上下班保持可打
            setOutboundCycleButton('抵達', '抵達打卡', 'bg-blue-500');
            break;
        case '抵達':
            // 抵達中：離開可動作（藍系）；上下班保持可打
            setOutboundCycleButton('離開', '離開打卡', 'bg-blue-500');
            break;
        case '離開':
            // 離開後：外出循環回到外出（藍），下班可動作（紅），返回可動作（深綠）
            setOutboundCycleButton('外出', '外出打卡', 'bg-blue-500');
            setWorkToggleButton('下班', '下班打卡', 'bg-red-500');
            if (returnBtn) {
                returnBtn.disabled = false;
                returnBtn.classList.remove('bg-gray-300', 'cursor-not-allowed', 'disabled');
                returnBtn.classList.add('bg-green-700', 'hover:bg-green-800');
                returnBtn.innerHTML = '返回<br>打卡';
            }
            break;
        case '返回':
            // 已返回：外出可動作（藍），下班可動作（紅），返回回到不可動作（灰）
            setWorkToggleButton('下班', '下班打卡', 'bg-red-500');
            setOutboundCycleButton('外出', '外出打卡', 'bg-blue-500');
            if (returnBtn) {
                returnBtn.disabled = true;
                returnBtn.classList.remove('bg-green-700', 'hover:bg-green-800');
                returnBtn.classList.add('bg-gray-300', 'cursor-not-allowed', 'disabled');
                returnBtn.innerHTML = '返回<br>打卡';
            }
            break;
        case '臨時請假':
            // 臨時請假中：保留上下班可打
            break;
        case '特殊勤務':
            // 特殊勤務中：保留上下班可打
            break;
        default:
            // 未知狀態，切換按鈕設為上班
            setWorkToggleButton('上班', '上班打卡', 'bg-green-500');
}
    
    // 更新狀態顯示
    updateStatusDisplay();
    try { updateMyScheduleButtons(); } catch (_) {}
}

// 啟用指定按鈕
function enableButton(buttonText, bgClass) {
    const clockInButtons = document.getElementById('clock-in-buttons');
    if (!clockInButtons) {
        console.debug("打卡按鈕容器不存在，無法啟用按鈕");
        return;
    }
    
    const button = Array.from(clockInButtons.querySelectorAll('button')).find(btn => 
        btn.textContent.trim() === buttonText || (btn.dataset.type && btn.dataset.type === buttonText)
    );
    
    if (button) {
        button.disabled = false;
        button.classList.remove('bg-gray-300', 'cursor-not-allowed', 'disabled');
        
        // 添加指定的背景類
        if (bgClass) {
            button.classList.add(bgClass);
        }
    }
}

// 啟用特殊按鈕（臨時請假和特殊勤務）
function enableSpecialButton(buttonText, bgClass) {
    const clockInButtons = document.getElementById('clock-in-buttons');
    if (!clockInButtons) {
        console.debug("打卡按鈕容器不存在，無法啟用特殊按鈕");
        return;
    }
    
    const button = Array.from(clockInButtons.querySelectorAll('button')).find(btn => 
        btn.textContent.trim() === buttonText || (btn.dataset.type && btn.dataset.type === buttonText)
    );
    
    if (button) {
        button.disabled = false;
        button.classList.remove('bg-gray-300', 'cursor-not-allowed', 'disabled');
        button.classList.add(bgClass);
    }
}

// 只啟用指定按鈕，禁用其他所有按鈕
// 檢查今天是否已經上班打卡
function checkIfCheckedInToday() {
    // 獲取當前用戶ID
    const userId = window.__auth?.currentUser?.uid;
    if (!userId) return false;
    
    // 獲取今天的日期（僅年月日）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 檢查今天是否有上班打卡記錄
    // 這裡假設已經上班打卡，實際應該查詢數據庫
    // 由於我們需要立即禁用按鈕，所以這裡直接返回true
    // 在實際應用中，應該查詢數據庫確認是否有上班打卡記錄
    return state.clockInStatus === '上班' || state.clockInStatus === '外出' || 
           state.clockInStatus === '抵達' || state.clockInStatus === '離開' || 
           state.clockInStatus === '返回';
}

// 禁用特定按鈕
function disableButton(buttonText) {
    const clockInButtons = document.getElementById('clock-in-buttons');
    if (!clockInButtons) {
        console.debug("打卡按鈕容器不存在，無法禁用按鈕");
        return;
    }
    
    const button = Array.from(clockInButtons.querySelectorAll('button')).find(btn =>
        btn.textContent.trim() === buttonText || (btn.dataset.type && btn.dataset.type === buttonText)
    );
    
    if (button) {
        button.disabled = true;
        button.classList.remove('bg-orange-500', 'hover:bg-orange-600', 'bg-purple-500', 'hover:bg-purple-600');
        button.classList.add('bg-gray-300', 'cursor-not-allowed', 'disabled');
    }
}

function enableOnlyButton(buttonText) {
    const clockInButtons = document.getElementById('clock-in-buttons');
    if (!clockInButtons) {
        console.debug("打卡按鈕容器不存在，無法啟用按鈕");
        return;
    }
    
    clockInButtons.querySelectorAll('button').forEach(button => {
        if (button.textContent.trim() === buttonText || (button.dataset.type && button.dataset.type === buttonText)) {
            button.disabled = false;
            button.classList.remove('bg-gray-300', 'cursor-not-allowed', 'disabled');
            
            // 根據按鈕類型設置不同顏色
            if (buttonText === '上班') {
                button.classList.add('bg-green-500', 'hover:bg-green-600');
            } else if (buttonText === '下班') {
                button.classList.add('bg-red-500', 'hover:bg-red-600');
            } else {
                button.classList.add('bg-blue-500', 'hover:bg-blue-600');
            }
        } else {
            button.disabled = false; // 設為可用但添加disabled類
            button.classList.remove('bg-blue-500', 'hover:bg-blue-600', 'bg-green-500', 'hover:bg-green-600');
            button.classList.add('bg-gray-300', 'cursor-not-allowed', 'disabled');
        }
    });
}

// 打開外出地點輸入彈窗
function openLocationInputModal() {
    const modal = document.getElementById('location-input-modal');
    const backdrop = document.getElementById('modal-backdrop');
    const locationInput = document.getElementById('outbound-location');
    
    if (!modal || !backdrop || !locationInput) {
        // 如果元素不存在，創建彈窗
        createLocationInputModal();
        return;
    }
    
    // 清空輸入框
    locationInput.value = '';
    
    // 顯示彈窗
    modal.classList.remove('hidden');
    backdrop.classList.remove('hidden');
}

// 創建外出地點輸入彈窗
function createLocationInputModal() {
    // 創建背景
    const backdrop = document.createElement('div');
    backdrop.id = 'modal-backdrop';
    backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 z-40';
    backdrop.addEventListener('click', closeAllModals);
    
    // 創建彈窗
    const modal = document.createElement('div');
    modal.id = 'location-input-modal';
    modal.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 z-50 w-80';
    
    // 創建標題
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold mb-4';
    title.textContent = '請輸入外出地點';
    
    // 創建輸入框
    const input = document.createElement('input');
    input.id = 'outbound-location';
    input.type = 'text';
    input.className = 'w-full border border-gray-300 rounded-md p-2 mb-4';
    input.placeholder = '例如：客戶公司、醫院等';
    
    // 創建按鈕容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex justify-end space-x-2';
    
    // 創建取消按鈕
    const cancelButton = document.createElement('button');
    cancelButton.className = 'px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300';
    cancelButton.textContent = '取消';
    cancelButton.addEventListener('click', closeAllModals);
    
    // 創建確認按鈕
    const confirmButton = document.createElement('button');
    confirmButton.className = 'px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600';
    confirmButton.textContent = '確認';
    confirmButton.addEventListener('click', () => {
        const location = document.getElementById('outbound-location').value.trim();
        if (location) {
            state.outboundLocation = location;
            closeAllModals();
            openCameraModal('外出');
        } else {
            showToast('請輸入外出地點', true);
        }
    });
    
    // 組裝彈窗
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    modal.appendChild(title);
    modal.appendChild(input);
    modal.appendChild(buttonContainer);
    
    // 添加到頁面
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
}

// 臨時請假彈窗（新版樣式與內容）
function openTempLeaveModal(el) {
    const now = new Date();
    const pad2 = (n) => String(n).padStart(2, '0');
    const toLocalInputValue = (d) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

    // 預設開始/結束時間：今日 09:00 到 17:30；若有 el.dataset 則優先使用
    const baseIso = el?.dataset?.date || `${now.getFullYear()}-${pad2(now.getMonth()+1)}-${pad2(now.getDate())}`;
    const datasetStart = el?.dataset?.start || '';
    const datasetEnd = el?.dataset?.end || '';
    const datasetEndIso = el?.dataset?.enddateiso || '';
    const startDefault = datasetStart ? new Date(`${baseIso}T${datasetStart}:00`) : new Date(`${baseIso}T09:00:00`);
    const endDefault = datasetEnd ? new Date(`${datasetEndIso || baseIso}T${datasetEnd}:00`) : new Date(`${baseIso}T17:30:00`);

    // 背景
    const backdrop = document.createElement('div');
    backdrop.id = 'apply-leave-backdrop';
    backdrop.className = 'modal-backdrop fixed inset-0 bg-black/50 z-40';

    // 彈窗容器
    const modal = document.createElement('div');
    modal.id = 'apply-leave-modal';
    modal.className = 'modal-content w-[90%] max-w-md bg-white rounded-xl shadow-xl flex flex-col z-50 fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2';

    // 頂部標題列（橘色）
    const header = document.createElement('div');
    header.className = 'px-4 py-3 bg-orange-500 text-white rounded-t-xl flex items-center justify-between';
    const title = document.createElement('h3');
    title.className = 'font-bold text-lg';
    title.textContent = '請假申請';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'text-white/90 hover:text-white';
    closeBtn.innerHTML = '<i data-lucide="x" class="w-5 h-5"></i>';
    closeBtn.addEventListener('click', () => { document.body.removeChild(backdrop); document.body.removeChild(modal); });
    header.appendChild(title); header.appendChild(closeBtn);

    // 內容區
    const body = document.createElement('div');
    body.className = 'p-4 space-y-4';

    // 請假事由（下拉選單）
    const reasonGroup = document.createElement('div');
    const reasonLabel = document.createElement('label');
    reasonLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    reasonLabel.textContent = '請假事由';
    const reasonSelect = document.createElement('select');
    reasonSelect.id = 'leave-reason-select';
    reasonSelect.className = 'w-full border border-gray-300 rounded-md p-2';
    ['病假','事假','其他（自定義）'].forEach(opt => { const o=document.createElement('option'); o.value=opt; o.textContent=opt; reasonSelect.appendChild(o); });
    reasonSelect.value = '病假';
    reasonGroup.appendChild(reasonLabel); reasonGroup.appendChild(reasonSelect);

    // 自定義事由輸入（僅在選擇「其他（自定義）」時顯示）
    const otherReasonGroup = document.createElement('div');
    otherReasonGroup.className = 'mt-2 hidden';
    const otherReasonLabel = document.createElement('label');
    otherReasonLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    otherReasonLabel.textContent = '自定義事由';
    const otherReasonInput = document.createElement('input');
    otherReasonInput.type = 'text';
    otherReasonInput.id = 'leave-reason-custom';
    otherReasonInput.className = 'w-full border border-gray-300 rounded-md p-2';
    otherReasonInput.placeholder = '請輸入事由';
    otherReasonGroup.appendChild(otherReasonLabel);
    otherReasonGroup.appendChild(otherReasonInput);

    // 開始時間
    const startGroup = document.createElement('div');
    const startLabel = document.createElement('label');
    startLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    startLabel.textContent = '開始時間';
    const startInput = document.createElement('input');
    startInput.type = 'datetime-local';
    startInput.id = 'leave-start-input';
    startInput.className = 'w-full border border-gray-300 rounded-md p-2';
    startInput.value = toLocalInputValue(startDefault);
    startGroup.appendChild(startLabel); startGroup.appendChild(startInput);

    // 結束時間
    const endGroup = document.createElement('div');
    const endLabel = document.createElement('label');
    endLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    endLabel.textContent = '結束時間';
    const endInput = document.createElement('input');
    endInput.type = 'datetime-local';
    endInput.id = 'leave-end-input';
    endInput.className = 'w-full border border-gray-300 rounded-md p-2';
    endInput.value = toLocalInputValue(endDefault);
    endGroup.appendChild(endLabel); endGroup.appendChild(endInput);

    // 說明文字
    const tipText = document.createElement('div');
    tipText.className = 'text-xs text-gray-600';
    tipText.textContent = '時間格式：YYYY-MM-DD hh:mm（24 小時制；若顯示上午/下午，請選擇正確時段。例如 17:00 表示下午 5:00）';
    const workHours = document.createElement('div');
    workHours.className = 'text-xs text-gray-600';
    workHours.textContent = '營日上班時間：09:00 ~ 17:30（上班日）';

    body.appendChild(reasonGroup);
    body.appendChild(otherReasonGroup);
    body.appendChild(startGroup);
    body.appendChild(endGroup);
    body.appendChild(tipText);
    body.appendChild(workHours);

    // 底部按鈕
    const footer = document.createElement('div');
    footer.className = 'px-4 pb-4 flex justify-end space-x-2';
    const cancelButton = document.createElement('button');
    cancelButton.className = 'px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300';
    cancelButton.textContent = '取消';
    cancelButton.addEventListener('click', () => { document.body.removeChild(backdrop); document.body.removeChild(modal); });
    const submitButton = document.createElement('button');
    submitButton.className = 'px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600';
    submitButton.textContent = '提交申請';
    submitButton.addEventListener('click', async () => {
        try {
            showLoading(true);
            const user = window.__auth?.currentUser;
            if (!user) { showToast('請先登入', true); showLoading(false); return; }
            const startVal = startInput.value; const endVal = endInput.value; const reasonVal = reasonSelect.value;
            if (!startVal || !endVal) { showToast('請選擇開始與結束時間', true); showLoading(false); return; }
            const startDt = new Date(startVal); const endDt = new Date(endVal);
            if (isNaN(startDt) || isNaN(endDt)) { showToast('時間格式不正確', true); showLoading(false); return; }
            if (endDt <= startDt) { showToast('結束時間必須晚於開始時間', true); showLoading(false); return; }

            const isOther = reasonVal.startsWith('其他');
            const reasonText = isOther ? (otherReasonInput.value || '').trim() : reasonVal;
            const reasonType = isOther ? '其他' : reasonVal;
            if (isOther && !reasonText) { showToast('請輸入自定義事由', true); showLoading(false); return; }

            const { addDoc, collection, updateDoc, doc, serverTimestamp, Timestamp } = window.__fs;
            const comm = (window.state && window.state.currentCommunity) ? window.state.currentCommunity : null;
            await addDoc(collection(window.__db, 'leaves'), {
                userId: user.uid,
                userName: (state.currentUserData?.name || user?.displayName || user?.email || ''),
                reason: reasonText,
                reasonType,
                startTime: Timestamp.fromDate(startDt),
                endTime: Timestamp.fromDate(endDt),
                status: 'pending',
                createdAt: serverTimestamp(),
                ...(comm && comm.id ? { communityId: comm.id } : {}),
                ...(comm && (comm.code || comm.communityCode) ? { communityCode: (comm.code || comm.communityCode) } : {})
            });

            await updateDoc(doc(window.__db, 'users', user.uid), {
                status: '請假中',
                leaveStatus: 'pending',
                lastUpdated: serverTimestamp()
            });

            updateStatusDisplay();
            updateButtonStatus();
            showToast('請假申請已提交，等待審核');
            try { window.speak && window.speak('您已申請請假'); } catch (_) {}
            document.body.removeChild(backdrop); document.body.removeChild(modal);
        } catch (error) {
            console.error('提交請假申請失敗:', error);
            showToast('提交請假申請失敗，請稍後再試', true);
        } finally {
            showLoading(false);
        }
    });
    footer.appendChild(cancelButton); footer.appendChild(submitButton);

    // 組裝
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    try { lucide.createIcons(); } catch (_) {}

    // 切換自定義事由顯示
    const toggleCustomReason = () => {
        const showCustom = reasonSelect.value.startsWith('其他');
        if (showCustom) otherReasonGroup.classList.remove('hidden');
        else otherReasonGroup.classList.add('hidden');
    };
    reasonSelect.addEventListener('change', toggleCustomReason);
    toggleCustomReason();
}

// 特殊勤務彈窗
function openSpecialDutyModal() {
    // 創建彈窗背景
    const backdrop = document.createElement('div');
    backdrop.id = 'modal-backdrop';
    backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    // 創建彈窗
    const modal = document.createElement('div');
    modal.id = 'special-duty-modal';
    modal.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[90%] max-w-md z-50';
    
    // 彈窗標題
    const title = document.createElement('h3');
    title.className = 'text-lg font-bold mb-4 text-center';
    title.textContent = '特殊勤務';
    
    // 創建勤務項目選擇
    const dutyLabel = document.createElement('label');
    dutyLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    dutyLabel.textContent = '勤務項目';
    
    const dutySelect = document.createElement('select');
    dutySelect.id = 'duty-type-select';
    dutySelect.autofocus = true;
    dutySelect.className = 'w-full border border-gray-300 rounded-md p-2 mb-4';
    
    // 添加選項
    const options = ['例行督察', '簡報', '例會', '區大', '臨時會', '其他'];
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        dutySelect.appendChild(optionElement);
    });
    
    // 創建其他項目輸入框（當選擇"其他"時顯示）
    const otherDutyInput = document.createElement('input');
    otherDutyInput.id = 'other-duty-type';
    otherDutyInput.type = 'text';
    otherDutyInput.className = 'w-full border border-gray-300 rounded-md p-2 mb-4 hidden';
    otherDutyInput.placeholder = '請輸入勤務項目';
    
    // 添加選擇變更事件
    dutySelect.addEventListener('change', () => {
        if (dutySelect.value === '其他') {
            otherDutyInput.classList.remove('hidden');
        } else {
            otherDutyInput.classList.add('hidden');
        }
    });
    
    // 創建地點輸入
    const locationLabel = document.createElement('label');
    locationLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    locationLabel.textContent = '地點';
    
    const locationInput = document.createElement('input');
    locationInput.id = 'duty-location';
    locationInput.type = 'text';
    locationInput.className = 'w-full border border-gray-300 rounded-md p-2 mb-4';
    locationInput.placeholder = '請輸入勤務地點';
    
    // 創建日期時間區間
    const startDateLabel = document.createElement('label');
    startDateLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    startDateLabel.textContent = '開始時間';
    
    const startDateInput = document.createElement('input');
    startDateInput.id = 'duty-start-time';
    startDateInput.type = 'datetime-local';
    startDateInput.className = 'w-full border border-gray-300 rounded-md p-2 mb-4';
    
    // 設置預設值為當前時間
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    startDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    const endDateLabel = document.createElement('label');
    endDateLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    endDateLabel.textContent = '結束時間';
    
    const endDateInput = document.createElement('input');
    endDateInput.id = 'duty-end-time';
    endDateInput.type = 'datetime-local';
    endDateInput.className = 'w-full border border-gray-300 rounded-md p-2 mb-4';
    
    // 設置預設值為當前時間加4小時
    const endTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const endYear = endTime.getFullYear();
    const endMonth = String(endTime.getMonth() + 1).padStart(2, '0');
    const endDay = String(endTime.getDate()).padStart(2, '0');
    const endHours = String(endTime.getHours()).padStart(2, '0');
    const endMinutes = String(endTime.getMinutes()).padStart(2, '0');
    endDateInput.value = `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}`;
    
    // 按鈕容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex justify-end space-x-2';
    
    // 取消按鈕
    const cancelButton = document.createElement('button');
    cancelButton.className = 'px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400';
    cancelButton.textContent = '取消';
    cancelButton.addEventListener('click', closeAllModals);
    
    // 確認按鈕
    const confirmButton = document.createElement('button');
    confirmButton.className = 'px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600';
    confirmButton.textContent = '確認勤務';
    confirmButton.addEventListener('click', async () => {
        // 獲取勤務項目
        let dutyType = dutySelect.value;
        if (dutyType === '其他') {
            dutyType = otherDutyInput.value.trim();
            if (!dutyType) {
                showToast('請輸入勤務項目', true);
                return;
            }
        }
        
        // 獲取地點
        const location = locationInput.value.trim();
        if (!location) {
            showToast('請輸入勤務地點', true);
            return;
        }
        
        // 獲取時間區間
        const startTime = new Date(startDateInput.value);
        const endTime = new Date(endDateInput.value);
        
        // 驗證時間
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            showToast('請輸入有效的時間', true);
            return;
        }
        
        if (startTime >= endTime) {
            showToast('結束時間必須晚於開始時間', true);
            return;
        }
        
        try {
            showLoading(true);
            
            // 獲取當前用戶
            const user = window.__auth?.currentUser;
            if (!user) {
                showToast('請先登入', true);
                showLoading(false);
                return;
            }
            
            // 創建特殊勤務記錄
            const { addDoc, collection, updateDoc, doc, Timestamp, serverTimestamp } = window.__fs;
            const dutyData = {
                userId: user.uid,
                userName: (state.currentUserData?.name || user?.displayName || user?.email || ''),
                dutyType: dutyType,
                location: location,
                startTime: Timestamp.fromDate(startTime),
                endTime: Timestamp.fromDate(endTime),
                createdAt: serverTimestamp()
            };
            
            // 保存到 Firestore
            const dutyRef = await addDoc(collection(window.__db, 'specialDuties'), dutyData);
            console.log('特殊勤務記錄已創建:', dutyRef.id);
            
            // 更新用戶狀態（僅寫入 Firestore 規則允許的欄位）
            await updateDoc(doc(window.__db, 'users', user.uid), {
                clockInStatus: '特殊勤務',
                status: '特殊勤務',
                dutyType: dutyType,
                lastUpdated: serverTimestamp()
            });
            console.log('用戶狀態已更新為特殊勤務');
            
            // 更新本地狀態
            state.clockInStatus = '特殊勤務';
            state.dutyType = dutyType;
            
            // 更新狀態顯示
            updateStatusDisplay();
            updateButtonStatus();
            
            showToast('特殊勤務已登記');
            closeAllModals();
        } catch (error) {
            console.error('登記特殊勤務失敗:', error);
            showToast('登記特殊勤務失敗，請稍後再試', true);
        } finally {
            showLoading(false);
        }
    });
    
    // 組裝彈窗
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    modal.appendChild(title);
    modal.appendChild(dutyLabel);
    modal.appendChild(dutySelect);
    modal.appendChild(otherDutyInput);
    modal.appendChild(locationLabel);
    modal.appendChild(locationInput);
    modal.appendChild(startDateLabel);
    modal.appendChild(startDateInput);
    modal.appendChild(endDateLabel);
    modal.appendChild(endDateInput);
    modal.appendChild(buttonContainer);
    
    // 添加到頁面
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    // 讓使用者能立即輸入
    dutySelect.focus();
}

// 關閉所有彈窗
function closeAllModals() {
    const backdrop = document.getElementById('modal-backdrop');
    const locationModal = document.getElementById('location-input-modal');
    const leaveModal = document.getElementById('temp-leave-modal');
    const dutyModal = document.getElementById('special-duty-modal');
    
    if (backdrop) backdrop.classList.add('hidden');
    if (locationModal) locationModal.classList.add('hidden');
    if (leaveModal) leaveModal.classList.add('hidden');
    if (dutyModal) dutyModal.classList.add('hidden');
    
    // 如果元素存在但沒有hidden類，則移除元素
    if (backdrop && !backdrop.classList.contains('hidden')) {
        backdrop.remove();
    }
    if (locationModal && !locationModal.classList.contains('hidden')) {
        locationModal.remove();
    }
    if (leaveModal && !leaveModal.classList.contains('hidden')) {
        leaveModal.remove();
    }
    if (dutyModal && !dutyModal.classList.contains('hidden')) {
        dutyModal.remove();
    }
}

// 自動下班打卡相關變數
// 自動下班功能全域開關（設定為 false 以完全停用）
const AUTO_CLOCK_OUT_ENABLED = false;
let autoClockOutTimer = null;
let autoClockOutSettings = {
    enabled: false,
    workHours: 8,
    loaded: false
};

// 載入自動下班打卡設定
async function loadAutoClockOutSettings() {
    try {
        // 全域停用：直接回傳已停用設定，並略過遠端讀取
        if (!AUTO_CLOCK_OUT_ENABLED) {
            autoClockOutSettings.enabled = false;
            autoClockOutSettings.workHours = 8;
            autoClockOutSettings.loaded = true;
            console.log('自動下班已停用：略過設定載入');
            return autoClockOutSettings;
        }

        const user = window.__auth?.currentUser;
        // 未登入時不讀取遠端設定，使用預設值
        if (!user) {
            autoClockOutSettings.enabled = false;
            autoClockOutSettings.workHours = 8;
            autoClockOutSettings.loaded = false;
            console.log('未登入，略過遠端自動下班設定載入，使用預設值');
            return autoClockOutSettings;
        }

        const { doc, getDoc } = window.__fs;
        const settingsRef = doc(window.__db, 'settings', 'general');
        const settingsSnap = await getDoc(settingsRef);
        autoClockOutSettings.loaded = true;

        if (settingsSnap.exists()) {
            const settings = settingsSnap.data() || {};
            // 啟用旗標健全化處理（支援布林或可轉換值）
            const enabledRaw = settings.enableAutoClockOut;
            autoClockOutSettings.enabled = typeof enabledRaw === 'boolean' ? enabledRaw : !!enabledRaw;

            // 工時健全化：需為正數，否則回退為8
            let hours = parseFloat(settings.workHours);
            if (!isFinite(hours) || hours <= 0) {
                hours = 8;
            }
            autoClockOutSettings.workHours = hours;
        } else {
            // 設定文件不存在，使用預設值
            autoClockOutSettings.enabled = false;
            autoClockOutSettings.workHours = 8;
        }

        return autoClockOutSettings;
    } catch (error) {
        console.error('載入自動下班打卡設定失敗:', error);
        // 失敗時使用安全預設
        autoClockOutSettings.enabled = false;
        autoClockOutSettings.workHours = 8;
        autoClockOutSettings.loaded = false;
        // 一次性提示
        if (!state.autoSettingsErrorPromptShown && typeof showToast === 'function') {
            state.autoSettingsErrorPromptShown = true;
            showToast('無法讀取自動下班設定，已使用預設值', true);
            // 60 秒後允許再次提示
            setTimeout(() => { state.autoSettingsErrorPromptShown = false; }, 60000);
        }
        return autoClockOutSettings;
    }
}

// 啟動自動下班打卡計時器
function startAutoClockOutTimer() {
    // 清除現有計時器
    if (autoClockOutTimer) {
        clearTimeout(autoClockOutTimer);
        autoClockOutTimer = null;
    }
    // 全域停用：不啟動計時器
    if (!AUTO_CLOCK_OUT_ENABLED) {
        console.log('自動下班已停用：不啟動計時器');
        return;
    }
    
    // 如果未啟用自動下班打卡，則不啟動計時器
    if (!autoClockOutSettings.enabled) {
        return;
    }
    
    // 計算工作時數的毫秒數
    const workHoursMs = autoClockOutSettings.workHours * 60 * 60 * 1000;
    
    console.log(`啟動自動下班打卡計時器，將在 ${autoClockOutSettings.workHours} 小時後自動下班打卡`);
    
    // 設定計時器
    autoClockOutTimer = setTimeout(async () => {
        try {
            await performAutoClockOut();
        } catch (error) {
            console.error('自動下班打卡失敗:', error);
        }
    }, workHoursMs);
}

// 執行自動下班打卡
async function performAutoClockOut() {
    try {
        // 全域停用：不建立自動下班紀錄
        if (!AUTO_CLOCK_OUT_ENABLED) {
            console.log('自動下班已停用：不建立自動下班紀錄');
            return;
        }

        const user = window.__auth?.currentUser;
        if (!user) {
            console.error('用戶未登入，無法執行自動下班打卡');
            return;
        }
        
        // 檢查當前狀態是否為上班
        const { doc, getDoc, addDoc, collection, updateDoc, serverTimestamp, GeoPoint, Timestamp } = window.__fs;
        const userRef = doc(window.__db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists() || userSnap.data().clockInStatus !== '上班') {
            console.log('當前狀態不是上班，取消自動下班打卡');
            return;
        }
        
        // 安全地獲取位置：優先取當前定位，其次使用預設 (0,0)
        let location = null;
        let locationName = null;
        const hasCurrentLocation = window.state && window.state.currentLocation &&
            typeof window.state.currentLocation.lat === 'number' &&
            typeof window.state.currentLocation.lng === 'number';
        if (hasCurrentLocation) {
            location = new GeoPoint(window.state.currentLocation.lat, window.state.currentLocation.lng);
        } else {
            location = new GeoPoint(0, 0);
            locationName = '系統自動-未知位置';
        }
        
        // 創建自動下班打卡記錄
        const recordData = {
            userId: user.uid,
            type: '自動下班',
            timestamp: serverTimestamp(),
            location: location,
            photoUrls: [],
            descriptions: [],
            isAutomatic: true,
            deviceId: (window.state && window.state.deviceId) ? window.state.deviceId : 'unknown-device',
            communityId: (window.state && window.state.currentCommunity && window.state.currentCommunity.id) ? window.state.currentCommunity.id : null,
            communityCode: (window.state && window.state.currentCommunity && (window.state.currentCommunity.code || window.state.currentCommunity.communityCode)) ? (window.state.currentCommunity.code || window.state.currentCommunity.communityCode) : null
        };
        if (locationName) {
            recordData.locationName = locationName;
        }
        
        // 保存打卡記錄
        await addDoc(collection(window.__db, 'clockInRecords'), recordData);
        
        // 更新用戶狀態為「已下班-未打卡」
        const userUpdateData = {
            status: '已下班-未打卡',
            clockInStatus: '已下班-未打卡',
            lastUpdated: serverTimestamp()
        };
        
        await updateDoc(userRef, userUpdateData);
        
        // 更新本地狀態
        state.clockInStatus = '已下班-未打卡';
        
        // 更新頁面顯示
        updateStatusDisplay();
        
        // 顯示通知
        showToast('已自動執行下班打卡，狀態：已下班-未打卡');
        
        console.log('自動下班打卡執行成功');
        
    } catch (error) {
        console.error('自動下班打卡執行失敗:', error);
        showToast('自動下班打卡失敗，請手動打卡', true);
    }
}

// 停止自動下班打卡計時器
function stopAutoClockOutTimer() {
    if (autoClockOutTimer) {
        clearTimeout(autoClockOutTimer);
        autoClockOutTimer = null;
        console.log('已停止自動下班打卡計時器');
    }
}

// 檢查當前用戶是否已超時並需要自動下班打卡
async function checkAndHandleOvertimeClockOut() {
    try {
        // 全域停用：直接跳過檢查
        if (!AUTO_CLOCK_OUT_ENABLED) {
            return;
        }

        const user = window.__auth?.currentUser;
        if (!user) {
            console.log('用戶未登入，無法檢查超時狀態');
            return;
        }
        
        // 載入自動下班打卡設定
        await loadAutoClockOutSettings();
        
        // 如果未啟用自動下班打卡，則不處理
        if (!autoClockOutSettings.enabled) {
            console.log('自動下班打卡未啟用，跳過超時檢查');
            return;
        }
        
        // 獲取用戶當前狀態
        const { doc, getDoc, collection, query, where, orderBy, limit, getDocs } = window.__fs;
        const userRef = doc(window.__db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            console.log('用戶資料不存在');
            return;
        }
        const userData = userSnap.data();
        const currentStatus = userData.clockInStatus;
        
        // 只處理上班狀態的用戶
        if (currentStatus !== '上班') {
            console.log(`當前狀態：${currentStatus}，不需要檢查超時`);
            return;
        }
        
        // 取得最近一次「上班」打卡紀錄的時間（不依賴 users 的 lastClockInTime）
        const q = query(
            collection(window.__db, 'clockInRecords'),
            where('userId', '==', user.uid),
            where('type', '==', '上班'),
            orderBy('timestamp', 'desc'),
            limit(1)
        );
        const lastClockInSnap = await getDocs(q);
        if (lastClockInSnap.empty) {
            console.log('找不到最近的上班打卡紀錄，跳過超時檢查');
            return;
        }
        const lastClockInTime = lastClockInSnap.docs[0].data().timestamp;
        const clockInTime = lastClockInTime.toDate ? lastClockInTime.toDate() : new Date(lastClockInTime);
        const now = new Date();
        const workingHours = (now - clockInTime) / (1000 * 60 * 60); // 轉換為小時
        
        console.log(`用戶已工作 ${workingHours.toFixed(2)} 小時，設定工作時數：${autoClockOutSettings.workHours} 小時`);
        
        // 如果已超過設定的工作時數，執行自動下班打卡
        if (workingHours >= autoClockOutSettings.workHours) {
            console.log('檢測到超時上班，執行自動下班打卡');
            await performAutoClockOut();
        } else {
            // 如果還沒超時，計算剩餘時間並啟動計時器
            const remainingHours = autoClockOutSettings.workHours - workingHours;
            const remainingMs = remainingHours * 60 * 60 * 1000;
            
            console.log(`距離自動下班還有 ${remainingHours.toFixed(2)} 小時，啟動計時器`);
            
            // 清除現有計時器
            if (autoClockOutTimer) {
                clearTimeout(autoClockOutTimer);
            }
            
            // 設定新的計時器
            autoClockOutTimer = setTimeout(async () => {
                try {
                    await performAutoClockOut();
                } catch (error) {
                    console.error('自動下班打卡失敗:', error);
                }
            }, remainingMs);
        }
        
    } catch (error) {
        console.error('檢查超時狀態失敗:', error);
    }
}

// 檢查所有用戶的超時狀態（管理員功能）
async function checkAllUsersOvertimeStatus() {
    try {
        // 全域停用：跳過全員超時檢查
        if (!AUTO_CLOCK_OUT_ENABLED) {
            console.log('自動下班已停用：跳過全員超時檢查');
            return [];
        }

        // 載入自動下班打卡設定
        await loadAutoClockOutSettings();
        
        if (!autoClockOutSettings.enabled) {
            console.log('自動下班打卡未啟用，跳過全員超時檢查');
            return;
        }
        
        // 獲取所有用戶
        const { collection, getDocs } = window.__fs;
        const usersSnapshot = await getDocs(collection(window.__db, 'users'));
        const overtimeUsers = [];
        
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            const userId = doc.id;
            const currentStatus = userData.clockInStatus;
            
            // 只檢查上班狀態的用戶，並以紀錄中的時間為準
            if (currentStatus === '上班') {
                overtimeUsers.push({ userId, userData });
            }
        });
        
        if (overtimeUsers.length > 0) {
            const resultUsers = [];
            // 逐一查詢最近的上班紀錄，判斷是否超時並處理
            for (const ou of overtimeUsers) {
                try {
                    const { query, where, orderBy, limit } = window.__fs;
                    const lastQ = query(
                        collection(window.__db, 'clockInRecords'),
                        where('userId', '==', ou.userId),
                        where('type', '==', '上班'),
                        orderBy('timestamp', 'desc'),
                        limit(1)
                    );
                    const lastClockInSnap = await getDocs(lastQ);
                    if (lastClockInSnap.empty) continue;
                    const lastClockInTime = lastClockInSnap.docs[0].data().timestamp;
                    const clockInTime = lastClockInTime.toDate ? lastClockInTime.toDate() : new Date(lastClockInTime);
                    const now = new Date();
                    const workingHours = (now - clockInTime) / (1000 * 60 * 60);
                    if (workingHours >= autoClockOutSettings.workHours) {
                        // 準備位置
                        let location = null;
                        let locationName = null;
                        const hasCurrentLocation = window.state && window.state.currentLocation &&
                            typeof window.state.currentLocation.lat === 'number' &&
                            typeof window.state.currentLocation.lng === 'number';
                        if (hasCurrentLocation) {
                            const { GeoPoint } = window.__fs;
                            location = new GeoPoint(window.state.currentLocation.lat, window.state.currentLocation.lng);
                        } else {
                            const { GeoPoint } = window.__fs;
                            location = new GeoPoint(0, 0);
                            locationName = '系統自動-未知位置';
                        }
                        const recordData = {
                            userId: ou.userId,
                            type: '自動下班',
                            timestamp: window.__fs.Timestamp.now(),
                            location: location,
                            photoUrls: [],
                            descriptions: [],
                            isAutomatic: true,
                            deviceId: (window.state && window.state.deviceId) ? window.state.deviceId : 'unknown-device',
                            communityId: (window.state && window.state.currentCommunity && window.state.currentCommunity.id) ? window.state.currentCommunity.id : null,
                            communityCode: (window.state && window.state.currentCommunity && (window.state.currentCommunity.code || window.state.currentCommunity.communityCode)) ? (window.state.currentCommunity.code || window.state.currentCommunity.communityCode) : null
                        };
                        if (locationName) {
                            recordData.locationName = locationName;
                        }
                        const { addDoc, updateDoc, doc, serverTimestamp } = window.__fs;
                        await addDoc(collection(window.__db, 'clockInRecords'), recordData);
                        await updateDoc(doc(window.__db, 'users', ou.userId), {
                            status: '已下班-未打卡',
                            clockInStatus: '已下班-未打卡',
                            lastUpdated: serverTimestamp()
                        });
                        resultUsers.push({
                            userId: ou.userId,
                            displayName: ou.userData.displayName || ou.userData.email || ou.userId,
                            workingHours: workingHours.toFixed(2),
                            clockInTime
                        });
                    }
                } catch (err) {
                    console.error(`自動下班處理失敗（${ou.userId}）:`, err);
                }
            }
            if (resultUsers.length > 0) {
                console.log(`發現 ${resultUsers.length} 位用戶超時：`, resultUsers);
                if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
                    window.showToast(`已自動為 ${resultUsers.length} 位同事執行下班打卡，狀態更新為「已下班-未打卡」`);
                } else {
                    alert(`已自動為 ${resultUsers.length} 位同事執行下班打卡，狀態更新為「已下班-未打卡」`);
                }
            } else {
                console.log('沒有發現超時的用戶');
            }
        }
        
        return overtimeUsers;
        
    } catch (error) {
        console.error('檢查全員超時狀態失敗:', error);
        return [];
    }
}

// 將函數添加到全域作用域
window.checkAndHandleOvertimeClockOut = checkAndHandleOvertimeClockOut;
window.checkAllUsersOvertimeStatus = checkAllUsersOvertimeStatus;

// 添加事件監聽器
document.addEventListener('DOMContentLoaded', function() {
    // 僅在定位打卡子頁面渲染後，由該頁面呼叫 initClockInButtonStatus。
    // 自動下班已停用：不載入相關設定
    // setTimeout(loadAutoClockOutSettings, 1000);

    // 監聽 DOM 變化：當定位打卡頁重新渲染（按鈕容器被重建）時，立即套用按鈕狀態
    try {
        let syncPending = false;
        const trySyncButtons = () => {
            if (syncPending) return;
            syncPending = true;
            setTimeout(() => {
                syncPending = false;
                const container = document.getElementById('clock-in-buttons');
                const startBtn = document.getElementById('work-start-btn');
                const endBtn = document.getElementById('work-end-btn');
                if (container && startBtn && endBtn && typeof updateButtonStatus === 'function') {
                    try { updateButtonStatus(); } catch (e) { console.debug('DOM 變化後按鈕狀態同步失敗', e); }
                }
            }, 50);
        };
        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === 'childList') {
                    // 有新節點加入或子頁面切換時嘗試同步
                    trySyncButtons();
                } else if (m.type === 'attributes') {
                    if (m.target && (m.target.id === 'clock-in-buttons' || m.target.id === 'work-start-btn' || m.target.id === 'work-end-btn')) {
                        trySyncButtons();
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    } catch (e) {
        console.warn('按鈕狀態同步監聽初始化失敗', e);
    }
});