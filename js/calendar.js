// 行事曆分頁渲染函數
function renderCalendar(subPage) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="h-[50px] flex items-center justify-around border-b border-gray-200 bg-white">
            <button data-subtab="overview" class="sub-tab-btn px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-gray-100 ${subPage === 'overview' ? 'bg-red-100 text-red-600 active' : 'text-gray-600'}">總覽</button>
            <button data-subtab="schedule" class="sub-tab-btn px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-gray-100 ${subPage === 'schedule' ? 'bg-red-100 text-red-600 active' : 'text-gray-600'}">行程表</button>
            <button data-subtab="notifications" class="sub-tab-btn px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-gray-100 ${subPage === 'notifications' ? 'bg-red-100 text-red-600 active' : 'text-gray-600'}">訊息通知</button>
        </div>
        <div id="sub-page-content" class="overflow-y-auto" style="height: calc(100% - 50px);"></div>`;
    
    const subPageContent = document.getElementById('sub-page-content');
    if (subPage === 'overview') {
        renderCalendarOverview(subPageContent);
    } else if (subPage === 'schedule') {
        renderCalendarSchedule(subPageContent);
    } else if (subPage === 'notifications') {
        renderCalendarNotifications(subPageContent);
    }
    
    // 添加子分頁切換事件監聽器
    setTimeout(() => {
        mainContent.querySelectorAll('.sub-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const subtab = btn.dataset.subtab;
                console.log('Switching to subtab:', subtab);
                
                // 更新按鈕狀態
                mainContent.querySelectorAll('.sub-tab-btn').forEach(b => {
                    b.classList.remove('active', 'bg-red-100', 'text-red-600');
                    b.classList.add('text-gray-600');
                });
                btn.classList.remove('text-gray-600');
                btn.classList.add('active', 'bg-red-100', 'text-red-600');
                
                // 渲染對應的子分頁內容
                const subPageContent = document.getElementById('sub-page-content');
                if (subtab === 'overview') {
                    renderCalendarOverview(subPageContent);
                } else if (subtab === 'schedule') {
                    renderCalendarSchedule(subPageContent);
                } else if (subtab === 'notifications') {
                    renderCalendarNotifications(subPageContent);
                }
            });
        });
    }, 100);
}

// 總覽子分頁 - 月曆表格
function renderCalendarOverview(container) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    // 使用可變日期狀態以支援連續月份切換
    let displayedDate = new Date(currentYear, currentMonth, 1);
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const markedTitle = `${mm}-${dd} 日期行程表`;
    
    container.innerHTML = `
        <div class="p-4 space-y-4">
            <div class="bg-white rounded-lg shadow-sm border p-4">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-800">行事曆總覽</h2>
                    <div class="flex items-center space-x-2">
                        <button id="prev-month" class="p-2 rounded-md bg-gray-100 hover:bg-gray-200">
                            <i data-lucide="chevron-left" class="w-4 h-4"></i>
                        </button>
                        <span id="current-month-year" class="text-lg font-semibold px-4">${currentYear}年${currentMonth + 1}月</span>
                        <button id="next-month" class="p-2 rounded-md bg-gray-100 hover:bg-gray-200">
                            <i data-lucide="chevron-right" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div id="role-filter-bar" class="flex flex-wrap items-center gap-2 mb-2"></div>
                <div id="calendar-grid" class="grid grid-cols-7 gap-1">
                    <!-- 月曆將在這裡動態生成 -->
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border p-4">
                <h3 class="text-lg font-bold text-gray-800 mb-3">${markedTitle}</h3>
                <div id="monthly-events" class="space-y-2">
                    <!-- 標註日期的行程與提醒將在這裡顯示 -->
                </div>
            </div>
            
            <!-- 班表列表（依職務） -->
            <div class="bg-white rounded-lg shadow-sm border p-4">
                <h3 class="text-lg font-bold text-gray-800 mb-3">班表列表（總幹事、秘書、保全、清潔、機電）</h3>
                <div id="role-roster-list" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- 依職務分組之人員列表將在此顯示 -->
                </div>
            </div>
        </div>`;
    
    // 載入假日設定後生成月曆，讓假日套用灰底
    fetchHolidaySettingsOnce()
        .catch(() => {})
        .finally(() => {
            generateCalendar(displayedDate.getFullYear(), displayedDate.getMonth());
            loadMarkedSchedule(displayedDate.getFullYear(), displayedDate.getMonth());
            // 新增：載入班表列表
            loadRoleRosterList();
        });
    
    // 月份切換事件
    document.getElementById('prev-month').addEventListener('click', () => {
        // 向前一個月（自目前顯示的月份）
        displayedDate.setMonth(displayedDate.getMonth() - 1);
        generateCalendar(displayedDate.getFullYear(), displayedDate.getMonth());
        loadMarkedSchedule(displayedDate.getFullYear(), displayedDate.getMonth());
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        // 向後一個月（自目前顯示的月份）
        displayedDate.setMonth(displayedDate.getMonth() + 1);
        generateCalendar(displayedDate.getFullYear(), displayedDate.getMonth());
        loadMarkedSchedule(displayedDate.getFullYear(), displayedDate.getMonth());
    });
}

// 生成月曆表格
function generateCalendar(year, month) {
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearSpan = document.getElementById('current-month-year');
    
    monthYearSpan.textContent = `${year}年${month + 1}月`;
    
    // 清空現有內容
    calendarGrid.innerHTML = '';
    
    // 星期標題
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    weekdays.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'p-2 text-center font-semibold text-gray-600 bg-gray-50';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    
    // 獲取月份第一天和最後一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // 生成日期格子
    for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dayCell = document.createElement('div');
        dayCell.className = 'p-2 min-h-[60px] border border-gray-200 cursor-pointer hover:bg-gray-50';
        
        const isCurrentMonth = currentDate.getMonth() === month;
        const isToday = currentDate.toDateString() === new Date().toDateString();
        
        if (!isCurrentMonth) {
            dayCell.classList.add('text-gray-400', 'bg-gray-50');
        }
        
        if (isToday) {
            dayCell.classList.add('bg-red-100', 'border-red-300');
        }
        
        // 依國定假日（及設定的週末假日）套用灰底，僅針對本月日期
        try {
            const settings = window.__holidaySettingsCache;
            if (isCurrentMonth && settings) {
                const iso = formatYMD(currentDate);
                const holidaysSet = new Set(settings.holidays || []);
                const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
                const isHoliday = holidaysSet.has(iso) || (settings.weekendIsHoliday && isWeekend);
                if (isHoliday && !isToday) {
                    dayCell.classList.add('bg-gray-200');
                }
            }
        } catch (e) {
            // ignore
        }

        dayCell.dataset.ymd = formatYMD(currentDate);
        dayCell.innerHTML = `
            <div class="text-sm ${isToday ? 'font-bold text-red-600' : ''}">${currentDate.getDate()}</div>
            <div class="text-xs text-gray-500 mt-1" id="events-${currentDate.getTime()}">
                <!-- 事件將在這裡顯示 -->
            </div>
        `;

        calendarGrid.appendChild(dayCell);
    }

    // 依使用者上班設定與打卡狀態標色（工作日淺藍、完成綠、異常淺紅）
    applyCalendarStatus(year, month).catch(() => {});
    // 在當月的週五標註值班徽章與人員
    applyFridayDutyBadges(year, month).catch(() => {});
}

async function applyCalendarStatus(year, month) {
    try {
        const user = window.__auth?.currentUser;
        const fs = window.__fs;
        const db = window.__db;
        if (!user || !fs || !db) return;
        const { doc, getDoc, collection, query, where, getDocs, Timestamp } = fs;

        const ymId = `${year}-${String(month + 1).padStart(2,'0')}`;
        const ref = doc(db, 'users', user.uid, 'workdays', ymId);
        const snap = await getDoc(ref);
        const workdays = new Set((snap.exists() ? (snap.data().days || []) : []).map(n => Number(n)));

        // 讀取值班名單作為工作日（本月有名單的週五）
        let dutySet = new Set();
        try {
            const generalRef = doc(db, 'settings', 'general');
            const setSnap = await getDoc(generalRef);
            const roster = setSnap.exists() ? (setSnap.data().fridayDutyRoster || {}) : {};
            Object.keys(roster).forEach(iso => {
                const dt = new Date(iso);
                const names = roster[iso] || [];
                if (dt.getFullYear() === year && dt.getMonth() === month && Array.isArray(names) && names.length > 0) {
                    dutySet.add(iso);
                }
            });
        } catch (e) {
            // 無法載入值班名單時略過
        }

        const startTS = Timestamp?.fromDate ? Timestamp.fromDate(new Date(year, month, 1)) : new Date(year, month, 1);
        const endTS = Timestamp?.fromDate ? Timestamp.fromDate(new Date(year, month + 1, 0, 23, 59, 59, 999)) : new Date(year, month + 1, 0, 23, 59, 59, 999);
        const q = query(
            collection(db, 'clockInRecords'),
            where('userId', '==', user.uid),
            where('timestamp', '>=', startTS),
            where('timestamp', '<=', endTS)
        );
        const rs = await getDocs(q);
        const map = new Map(); // iso -> { start:boolean, end:boolean }
        rs.forEach(d => {
            const r = d.data();
            const dt = r.timestamp?.toDate?.() || (r.timestamp ? new Date(r.timestamp) : null);
            if (!dt) return;
            const iso = formatYMD(dt);
            const obj = map.get(iso) || { start:false, end:false };
            if (r.type === '上班') obj.start = true;
            if (r.type === '下班' || r.type === '自動下班') obj.end = true;
            map.set(iso, obj);
        });

        // 套用標色
        const cells = document.querySelectorAll('#calendar-grid [data-ymd]');
        cells.forEach(cell => {
            const iso = cell.dataset.ymd;
            const dt = new Date(iso);
            const d = dt.getDate();
            // 當月日期才標色
            if (dt.getMonth() !== month) return;
            const isTodayCell = cell.classList.contains('bg-red-100');

            const status = map.get(iso);
            if (status && status.start && status.end) {
                cell.classList.remove('bg-gray-200','bg-blue-100','border-blue-300','bg-red-100','border-red-300');
                cell.classList.add('bg-green-100','border-green-300');
                return;
            }
            if (status && (status.start !== status.end)) {
                cell.classList.remove('bg-gray-200','bg-blue-100','border-blue-300','bg-green-100','border-green-300');
                cell.classList.add('bg-red-100','border-red-300');
                return;
            }
            if (workdays.has(d) || dutySet.has(iso)) {
                cell.classList.remove('bg-gray-200');
                cell.classList.add('bg-blue-100','border-blue-300');
                return;
            }
            // 非上班日一律灰色底（保留「今天」樣式）
            if (!isTodayCell) {
                cell.classList.remove('bg-blue-100','border-blue-300','bg-green-100','border-green-300','bg-red-100','border-red-300');
                cell.classList.add('bg-gray-200');
            }
        });
    } catch (e) {
        console.warn('套用行事曆狀態失敗', e);
    }
}

// 載入月份事件
function loadMonthlyEvents(year, month) {
    const monthlyEventsContainer = document.getElementById('monthly-events');
    
    // 模擬事件數據（實際應用中應從Firebase獲取）
    const events = [
        { date: new Date(year, month, 5), title: '月會', type: 'meeting' },
        { date: new Date(year, month, 15), title: '員工訓練', type: 'training' },
        { date: new Date(year, month, 25), title: '績效評估', type: 'evaluation' }
    ];
    
    monthlyEventsContainer.innerHTML = '';
    
    if (events.length === 0) {
        monthlyEventsContainer.innerHTML = '<p class="text-gray-500 text-center py-4">本月暫無重要事項</p>';
        return;
    }
    
    events.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-md';
        eventDiv.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-3 h-3 rounded-full ${getEventColor(event.type)}"></div>
                <span class="font-medium">${event.title}</span>
            </div>
            <span class="text-sm text-gray-500">${event.date.getDate()}日</span>
        `;
        monthlyEventsContainer.appendChild(eventDiv);
    });
}

// 行程表子分頁
function renderCalendarSchedule(container) {
    container.innerHTML = `
        <div class="p-4 space-y-4">
            <div class="bg-white rounded-lg shadow-sm border p-4">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-800">個人行程表</h2>
                    <button id="add-schedule" class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center space-x-2">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>新增行程</span>
                    </button>
                </div>
                
                <div class="space-y-3" id="schedule-list">
                    <!-- 行程列表將在這裡顯示 -->
                </div>
            </div>
        </div>`;
    
    loadPersonalSchedule();
    
    document.getElementById('add-schedule').addEventListener('click', showAddScheduleModal);
}

// 載入個人行程
function loadPersonalSchedule() {
    const scheduleList = document.getElementById('schedule-list');
    
    // 模擬個人行程數據
    const schedules = [
        { 
            id: 1, 
            title: '客戶會議', 
            date: new Date(), 
            time: '10:00', 
            location: '會議室A',
            description: '與ABC公司討論合作案'
        },
        { 
            id: 2, 
            title: '專案檢討', 
            date: new Date(Date.now() + 86400000), 
            time: '14:00', 
            location: '辦公室',
            description: '檢討本月專案進度'
        }
    ];
    
    scheduleList.innerHTML = '';
    
    if (schedules.length === 0) {
        scheduleList.innerHTML = '<p class="text-gray-500 text-center py-8">暫無行程安排</p>';
        return;
    }
    
    schedules.forEach(schedule => {
        const scheduleDiv = document.createElement('div');
        scheduleDiv.className = 'border border-gray-200 rounded-lg p-4 hover:bg-gray-50';
        scheduleDiv.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <h3 class="font-semibold text-gray-800">${schedule.title}</h3>
                    <div class="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span><i data-lucide="calendar" class="w-4 h-4 inline mr-1"></i>${schedule.date.toLocaleDateString('zh-TW')}</span>
                        <span><i data-lucide="clock" class="w-4 h-4 inline mr-1"></i>${schedule.time}</span>
                        <span><i data-lucide="map-pin" class="w-4 h-4 inline mr-1"></i>${schedule.location}</span>
                    </div>
                    <p class="text-gray-600 mt-2">${schedule.description}</p>
                </div>
                <div class="flex space-x-2">
                    <button class="text-blue-600 hover:text-blue-800" onclick="editSchedule(${schedule.id})">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-800" onclick="deleteSchedule(${schedule.id})">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
        scheduleList.appendChild(scheduleDiv);
    });
}

// 訊息通知子分頁
function renderCalendarNotifications(container) {
    container.innerHTML = `
        <div class="p-4 space-y-4">
            <div class="bg-white rounded-lg shadow-sm border p-4">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-800">訊息通知</h2>
                    <button id="mark-all-read" class="text-blue-600 hover:text-blue-800 text-sm">
                        全部標記為已讀
                    </button>
                </div>
                
                <div class="space-y-3" id="notifications-list">
                    <!-- 通知列表將在這裡顯示 -->
                </div>
            </div>
        </div>`;
    
    loadNotifications();
    
    document.getElementById('mark-all-read').addEventListener('click', markAllNotificationsRead);
}

// 載入通知
function loadNotifications() {
    const notificationsList = document.getElementById('notifications-list');
    
    // 模擬通知數據
    const notifications = [
        {
            id: 1,
            title: '會議提醒',
            message: '您有一個會議將在30分鐘後開始',
            time: new Date(Date.now() - 1800000),
            read: false,
            type: 'meeting'
        },
        {
            id: 2,
            title: '打卡提醒',
            message: '請記得完成今日的打卡',
            time: new Date(Date.now() - 3600000),
            read: true,
            type: 'clock-in'
        },
        {
            id: 3,
            title: '系統通知',
            message: '系統將於今晚進行維護',
            time: new Date(Date.now() - 7200000),
            read: false,
            type: 'system'
        }
    ];
    
    notificationsList.innerHTML = '';
    
    if (notifications.length === 0) {
        notificationsList.innerHTML = '<p class="text-gray-500 text-center py-8">暫無通知</p>';
        return;
    }
    
    notifications.forEach(notification => {
        const notificationDiv = document.createElement('div');
        notificationDiv.className = `border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 ${!notification.read ? 'bg-blue-50 border-blue-200' : ''}`;
        notificationDiv.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center space-x-2">
                        <h3 class="font-semibold text-gray-800">${notification.title}</h3>
                        ${!notification.read ? '<div class="w-2 h-2 bg-blue-600 rounded-full"></div>' : ''}
                    </div>
                    <p class="text-gray-600 mt-1">${notification.message}</p>
                    <span class="text-xs text-gray-500 mt-2">${formatTimeAgo(notification.time)}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 rounded-full ${getNotificationColor(notification.type)}"></div>
                    <button class="text-gray-400 hover:text-gray-600" onclick="deleteNotification(${notification.id})">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
        
        notificationDiv.addEventListener('click', () => markNotificationRead(notification.id));
        notificationsList.appendChild(notificationDiv);
    });
}

// 輔助函數
function getEventColor(type) {
    const colors = {
        'meeting': 'bg-blue-500',
        'training': 'bg-green-500',
        'evaluation': 'bg-yellow-500',
        'duty': 'bg-yellow-500',
        'default': 'bg-gray-500'
    };
    return colors[type] || colors.default;
}

function getNotificationColor(type) {
    const colors = {
        'meeting': 'bg-blue-500',
        'clock-in': 'bg-green-500',
        'system': 'bg-yellow-500',
        'default': 'bg-gray-500'
    };
    return colors[type] || colors.default;
}

function formatTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) {
        return `${minutes}分鐘前`;
    } else if (hours < 24) {
        return `${hours}小時前`;
    } else {
        return `${days}天前`;
    }
}

// 事件處理函數
function showAddScheduleModal() {
    // 實作新增行程的彈窗
    alert('新增行程功能將在後續版本中實作');
}

function editSchedule(id) {
    // 實作編輯行程功能
    alert(`編輯行程 ${id} 功能將在後續版本中實作`);
}

function deleteSchedule(id) {
    // 實作刪除行程功能
    if (confirm('確定要刪除此行程嗎？')) {
        alert(`刪除行程 ${id} 功能將在後續版本中實作`);
    }
}

function markNotificationRead(id) {
    // 實作標記通知為已讀功能
    console.log(`標記通知 ${id} 為已讀`);
}

function deleteNotification(id) {
    // 實作刪除通知功能
    if (confirm('確定要刪除此通知嗎？')) {
        console.log(`刪除通知 ${id}`);
    }
}

function markAllNotificationsRead() {
    // 實作全部標記為已讀功能
    if (confirm('確定要將所有通知標記為已讀嗎？')) {
        console.log('全部通知標記為已讀');
        loadNotifications(); // 重新載入通知列表
    }
}

// 假日設定載入與工具
function formatYMD(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// 週五值班徽章套用
async function applyFridayDutyBadges(year, month) {
    try {
        const fs = window.__fs;
        const db = window.__db;
        if (!fs || !db) return;
        const { doc, getDoc } = fs;
        const settingsRef = doc(db, 'settings', 'general');
        const snap = await getDoc(settingsRef);
        const roster = snap.exists() ? (snap.data().fridayDutyRoster || {}) : {};

        // 逐一把本月有名單的週五加上徽章
        Object.keys(roster).forEach(iso => {
            const dt = new Date(iso);
            if (dt.getFullYear() !== year || dt.getMonth() !== month) return;
            const names = roster[iso] || [];
            if (!Array.isArray(names) || names.length === 0) return;
            const cell = document.querySelector(`#calendar-grid [data-ymd="${iso}"]`);
            if (!cell) return;
            // 值班日視同上班日：未完成打卡與非異常，套用淺藍底
            if (!cell.classList.contains('bg-green-100') && !cell.classList.contains('bg-red-100')) {
                cell.classList.remove('bg-gray-200');
                cell.classList.add('bg-blue-100','border-blue-300');
            }
            const badgeWrap = document.createElement('div');
            badgeWrap.className = 'mt-1';
            const badge = document.createElement('span');
            badge.className = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-yellow-100 text-yellow-800 border border-yellow-300';
            badge.textContent = '值班';
            badge.title = names.join('、');
            badgeWrap.appendChild(badge);
            cell.appendChild(badgeWrap);
        });
    } catch (e) {
        console.warn('套用週五值班徽章失敗', e);
    }
}

// 載入「標註日期行程表」：目前包含週五值班提醒，可擴充其他提醒
async function loadMarkedSchedule(year, month) {
    try {
        const listEl = document.getElementById('monthly-events');
        if (!listEl) return;
        const fs = window.__fs;
        const db = window.__db;
        if (!fs || !db) {
            listEl.innerHTML = '<p class="text-gray-500 text-center py-4">本月暫無標註行程</p>';
            return;
        }
        const { doc, getDoc } = fs;
        const settingsRef = doc(db, 'settings', 'general');
        const snap = await getDoc(settingsRef);
        const roster = snap.exists() ? (snap.data().fridayDutyRoster || {}) : {};

        const events = [];
        Object.keys(roster).forEach(iso => {
            const dt = new Date(iso);
            if (dt.getFullYear() !== year || dt.getMonth() !== month) return;
            const names = roster[iso] || [];
            if (!Array.isArray(names) || names.length === 0) return;
            events.push({ date: dt, title: '週五值班', type: 'duty', names });
        });

        events.sort((a, b) => a.date - b.date);
        listEl.innerHTML = '';

        if (events.length === 0) {
            listEl.innerHTML = '<p class="text-gray-500 text-center py-4">本月暫無標註行程</p>';
            return;
        }

        events.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-md';
            eventDiv.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="w-3 h-3 rounded-full ${getEventColor(event.type)}"></div>
                    <span class="font-medium">${event.title}</span>
                    <span class="text-sm text-gray-600">${event.names.join('、')}</span>
                </div>
                <span class="text-sm text-gray-500">${event.date.getDate()}日</span>
            `;
            listEl.appendChild(eventDiv);
        });
    } catch (e) {
        console.warn('載入標註日期行程表失敗', e);
        const listEl = document.getElementById('monthly-events');
        if (listEl) listEl.innerHTML = '<p class="text-gray-500 text-center py-4">本月暫無標註行程</p>';
    }
}

function fetchHolidaySettingsOnce() {
    return new Promise(async (resolve, reject) => {
        try {
            if (window.__holidaySettingsCache) {
                resolve(window.__holidaySettingsCache);
                return;
            }
            const fs = window.__fs;
            const db = window.__db;
            if (!fs || !db || !fs.doc || !fs.getDoc) {
                // 無法讀取 Firestore，使用空設定
                window.__holidaySettingsCache = { weekendIsHoliday: false, holidays: [] };
                resolve(window.__holidaySettingsCache);
                return;
            }
            const { doc, getDoc } = fs;
            const ref = doc(db, 'settings', 'holidays');
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const data = snap.data();
                window.__holidaySettingsCache = { weekendIsHoliday: !!data.weekendIsHoliday, holidays: data.holidays || [] };
            } else {
                window.__holidaySettingsCache = { weekendIsHoliday: false, holidays: [] };
            }
            resolve(window.__holidaySettingsCache);
        } catch (e) {
            window.__holidaySettingsCache = { weekendIsHoliday: false, holidays: [] };
            reject(e);
        }
    });
}

// 新增：載入並渲染依職務分組的班表列表（支援職務計數與篩選）
async function loadRoleRosterList(selectedRole = null) {
    try {
        const container = document.getElementById('role-roster-list');
        const filterBar = document.getElementById('role-filter-bar');
        if (!container) return;
        const fs = window.__fs;
        const db = window.__db;
        const roles = ['總幹事','秘書','保全','清潔','機電'];

        // 取得目前社區脈絡（優先使用 URL 的 communityId；若頁面有設定 currentCommunity 則優先）
        let currentCommId = null;
        let currentCommCode = null;
        try {
            const params = new URLSearchParams(window.location.search);
            const qp = params.get('communityId') || null;
            // URL 可能帶的是 id 或 code，兩者都嘗試
            currentCommId = qp;
            currentCommCode = qp;
            // 若 index 有維護 currentCommunity，則優先使用
            currentCommId = (window?.state?.currentCommunity?.id) || currentCommId;
            currentCommCode = (window?.state?.currentCommunity?.code) || (window?.state?.currentCommunity?.communityCode) || currentCommCode;
        } catch (_) {}

        // 先使用快取避免每次重新抓取（快取的是「所有社區」的原始名單）
        let roster = window.__roleRosterCache;
        if (!roster) {
            if (!fs || !db || !fs.collection || !fs.getDocs) {
                container.innerHTML = '<div class="text-sm text-gray-500">目前無法讀取成員資料</div>';
                return;
            }
            roster = Object.fromEntries(roles.map(r => [r, []]));
            const { collection, getDocs } = fs;
            const usersRef = collection(db, 'users');
            const snap = await getDocs(usersRef);
            snap.forEach(doc => {
                const data = doc.data() || {};
                const title = (data.jobTitle || data.applicationTitle || '').trim();
                if (!title) return;
                if (roles.includes(title)) {
                    // 收集可用的社區資訊欄位（id 與 code 皆可能存在）
                    roster[title].push({
                        name: data.name || data.displayName || '（未填姓名）',
                        email: data.email || '',
                        phone: data.phone || '',
                        serviceCommunities: Array.isArray(data.serviceCommunities) ? data.serviceCommunities : [],
                        serviceCommunityCode: data.serviceCommunityCode || '',
                        serviceCommunityCodes: Array.isArray(data.serviceCommunityCodes) ? data.serviceCommunityCodes : []
                    });
                }
            });
            window.__roleRosterCache = roster;
        }

        // 依目前社區過濾名單
        const filterByCommunity = (members) => {
            if (!currentCommId && !currentCommCode) return members || [];
            return (members || []).filter(m => {
                const ids = Array.isArray(m.serviceCommunities) ? m.serviceCommunities : [];
                const codesArr = Array.isArray(m.serviceCommunityCodes) ? m.serviceCommunityCodes : [];
                const codeSingle = m.serviceCommunityCode || '';
                const byId = currentCommId ? ids.includes(currentCommId) : false;
                const byCode = currentCommCode ? (codesArr.includes(currentCommCode) || codeSingle === currentCommCode) : false;
                return byId || byCode;
            });
        };

        // 產生「目前社區」的名單與計數
        const filteredRoster = Object.fromEntries(roles.map(r => [r, filterByCommunity(roster[r])]));
        const counts = Object.fromEntries(roles.map(r => [r, (filteredRoster[r] || []).length]));

        // 渲染月曆上方的職務篩選按鈕列（數量為 0 的按鈕呈現灰色並不可點擊）
        if (filterBar) {
            filterBar.innerHTML = roles.map(role => {
                const count = counts[role];
                const disabled = count === 0;
                const active = selectedRole === role;
                const base = 'px-3 py-1 rounded-md text-sm border';
                const state = disabled ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' :
                                active ? 'bg-red-100 text-red-600 border-red-300' :
                                         'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';
                return `<button data-role="${role}" class="${base} ${state}" ${disabled ? 'disabled' : ''}>${role}（${count}）</button>`;
            }).join('');

            // 綁定點擊事件（0 人時不綁定）
            filterBar.querySelectorAll('button[data-role]').forEach(btn => {
                const role = btn.dataset.role;
                const count = counts[role];
                if (count === 0) return;
                btn.addEventListener('click', () => {
                    const current = window.__currentRoleFilter || null;
                    const next = (current === role) ? null : role; // 再點同一職務則回到「全部」
                    window.__currentRoleFilter = next;
                    loadRoleRosterList(next);
                });
            });
        }

        // 渲染班表列表（預設全部，若選擇某職務則只顯示該組；僅顯示目前社區的成員）
        container.innerHTML = '';
        const rolesToRender = selectedRole ? [selectedRole] : roles;
        rolesToRender.forEach(role => {
            const group = document.createElement('div');
            group.className = 'border rounded-md p-3';
            const titleEl = document.createElement('h4');
            titleEl.className = 'font-semibold text-gray-700 mb-2';
            titleEl.textContent = role;
            group.appendChild(titleEl);
            const members = filteredRoster[role];
            if (!members || members.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'text-sm text-gray-500';
                empty.textContent = '目前沒有成員';
                group.appendChild(empty);
            } else {
                const ul = document.createElement('ul');
                ul.className = 'space-y-1';
                members.forEach(m => {
                    const li = document.createElement('li');
                    li.className = 'text-sm text-gray-700';
                    const communities = m.serviceCommunities && m.serviceCommunities.length > 0 ? `（${m.serviceCommunities.join('、')}）` : '';
                    li.textContent = `${m.name}${communities}`;
                    ul.appendChild(li);
                });
                group.appendChild(ul);
            }
            container.appendChild(group);
        });
    } catch (e) {
        console.error('載入班表列表失敗', e);
        const container = document.getElementById('role-roster-list');
        if (container) container.innerHTML = `<div class="text-sm text-red-600">載入失敗：${e.message || e}</div>`;
    }
}