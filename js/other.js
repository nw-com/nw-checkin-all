// 其他分頁渲染函數（僅外勤可見）
function renderOther(subPage) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="h-[50px] flex items-center justify-around border-b border-gray-200 bg-white">
            <button data-subtab="news" class="sub-tab-btn px-4 py-2 rounded-md text-sm font-medium text-gray-600 ${subPage === 'news' ? 'active' : ''}">訊息通知</button>
            <button data-subtab="training" class="sub-tab-btn px-4 py-2 rounded-md text-sm font-medium text-gray-600 ${subPage === 'training' ? 'active' : ''}">教育訓練</button>
        </div>
        <div id="sub-page-content" class="overflow-y-auto" style="height: calc(100% - 50px);"></div>`;

    const subPageContent = document.getElementById('sub-page-content');
    if (subPage === 'news') {
        renderOtherNews(subPageContent);
    } else if (subPage === 'training') {
        renderOtherTraining(subPageContent);
    }

    mainContent.querySelectorAll('.sub-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof showPage === 'function') {
                showPage('other', btn.dataset.subtab);
            } else {
                console.error('showPage function is not defined');
            }
        });
    });
}

// 其他分頁 - 訊息通知子分頁
function renderOtherNews(container) {
    container.innerHTML = `
        <div class="p-4 space-y-4">
            <div class="bg-white rounded-lg shadow-sm border p-4">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-800">訊息通知</h2>
                    <button id="other-mark-all-read" class="text-blue-600 hover:text-blue-800 text-sm">全部標記為已讀</button>
                </div>
                <div class="space-y-3" id="other-notifications-list"></div>
            </div>
        </div>`;
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
    }

    loadOtherNotifications();

    const markBtn = document.getElementById('other-mark-all-read');
    if (markBtn) markBtn.addEventListener('click', () => {
        const list = document.getElementById('other-notifications-list');
        if (!list) return;
        list.querySelectorAll('.notification-item').forEach(item => {
            item.classList.remove('bg-blue-50','border-blue-200');
        });
    });
}

// 載入其他分頁通知（僅顯示目前社區的 anomalies）
async function loadOtherNotifications() {
    const notificationsList = document.getElementById('other-notifications-list');
    if (!notificationsList) return;

    // 取得目前社區脈絡（優先 URL，其次 index 維護的 state）
    let currentCommId = null;
    let currentCommCode = null;
    try {
        const params = new URLSearchParams(window.location.search);
        const qp = params.get('communityId') || null;
        currentCommId = qp; // 若 URL 帶的是 id
        currentCommCode = qp; // 若 URL 帶的是 code
        currentCommId = (window?.state?.currentCommunity?.id) || currentCommId;
        currentCommCode = (window?.state?.currentCommunity?.code) || (window?.state?.currentCommunity?.communityCode) || currentCommCode;
    } catch (_) {}

    const fs = window.__fs;
    const db = window.__db;
    notificationsList.innerHTML = '';

    if (!fs || !db || !fs.collection || !fs.getDocs) {
        notificationsList.innerHTML = '<p class="text-sm text-gray-500">目前無法讀取通知資料</p>';
        return;
    }

    if (!currentCommId && !currentCommCode) {
        notificationsList.innerHTML = '<p class="text-gray-500 text-center py-8">請先切換到某個社區以查看該社區的異常通知</p>';
        return;
    }

    try {
        const { collection, query, where, orderBy, limit, getDocs } = fs;
        const anomaliesRef = collection(db, 'anomalies');

        let q = null;
        if (currentCommId) {
            try {
                q = query(anomaliesRef, where('communityId', '==', currentCommId), orderBy('time', 'desc'), limit(50));
            } catch (_) {
                q = query(anomaliesRef, where('communityId', '==', currentCommId));
            }
        } else {
            try {
                q = query(anomaliesRef, orderBy('time', 'desc'), limit(200));
            } catch (_) {
                q = anomaliesRef;
            }
        }

        const snap = await getDocs(q);
        const items = [];
        snap.forEach(doc => {
            const data = doc.data() || {};
            const commMatchById = currentCommId ? (data.communityId === currentCommId) : true;
            const commMatchByCode = currentCommCode ? (data.communityCode === currentCommCode || data.communityId === currentCommCode) : true;
            const matchesCommunity = commMatchById && commMatchByCode;
            if (!matchesCommunity) return;
            if (data.suppressed === true) return;

            const ts = data.time;
            const when = ts && ts.toDate ? ts.toDate() : (typeof ts === 'number' ? new Date(ts) : new Date());
            const title = '打卡異常';
            const detail = data.detail || data.type || '異常事件';
            const message = `${detail}`;
            items.push({ id: doc.id, title, message, time: when, read: false, type: 'anomaly' });
        });

        if (items.length === 0) {
            notificationsList.innerHTML = '<p class="text-gray-500 text-center py-8">目前該社區沒有異常通知</p>';
            return;
        }

        items.sort((a, b) => b.time - a.time);

        items.forEach(n => {
            const div = document.createElement('div');
            div.className = `notification-item border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 ${!n.read ? 'bg-blue-50 border-blue-200' : ''}`;
            const timeStr = `${n.time.getFullYear()}-${String(n.time.getMonth()+1).padStart(2,'0')}-${String(n.time.getDate()).padStart(2,'0')} ${String(n.time.getHours()).padStart(2,'0')}:${String(n.time.getMinutes()).padStart(2,'0')}`;
            div.innerHTML = `
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2">
                            <h3 class="font-semibold text-gray-800">${n.title}</h3>
                            ${!n.read ? '<div class="w-2 h-2 bg-blue-600 rounded-full"></div>' : ''}
                        </div>
                        <p class="text-sm text-gray-700 mt-1">${n.message}</p>
                        <p class="text-xs text-gray-500 mt-1">${timeStr}</p>
                    </div>
                    <span class="px-2 py-1 rounded-md text-xs font-medium" style="background-color: #fee2e2; color: #991b1b;">異常</span>
                </div>`;
            div.addEventListener('click', () => {
                div.classList.remove('bg-blue-50','border-blue-200');
            });
            notificationsList.appendChild(div);
        });
    } catch (e) {
        console.error('載入其他分頁通知失敗', e);
        notificationsList.innerHTML = `<p class="text-sm text-red-600">載入通知失敗：${e.message || e}</p>`;
    }
}

// 其他分頁 - 教育訓練子分頁
function renderOtherTraining(container) {
    container.innerHTML = `
        <div class="p-4 flex flex-col items-center justify-center h-full">
            <div class="text-center">
                <i data-lucide="graduation-cap" class="w-16 h-16 text-gray-400 mx-auto mb-4"></i>
                <h2 class="text-xl font-semibold text-gray-700 mb-2">功能開發中...</h2>
                <p class="text-gray-500">教育訓練功能正在開發中，敬請期待！</p>
            </div>
        </div>`;
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
    }
}