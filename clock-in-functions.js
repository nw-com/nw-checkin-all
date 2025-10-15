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
    switch(state.clockInStatus) {
        case '上班':
            statusText.textContent = '上班中-辦公室';
            statusDisplay.className = 'mb-4 p-3 rounded-lg text-center bg-green-100 text-green-800';
            break;
        case '下班':
            statusText.textContent = '已下班';
            statusDisplay.className = 'mb-4 p-3 rounded-lg text-center bg-red-100 text-red-800';
            break;
        case '已下班-未打卡':
            statusText.textContent = '已下班-未打卡';
            statusDisplay.className = 'mb-4 p-3 rounded-lg text-center bg-yellow-100 text-yellow-800';
            break;
        case '外出':
            let outboundText = '外出中';
            if (state.outboundLocation) {
                outboundText = `外出-${state.outboundLocation}`;
            }
            statusText.textContent = outboundText;
            statusDisplay.className = 'mb-4 p-3 rounded-lg text-center bg-emerald-100 text-emerald-800';
            break;
        case '抵達':
            let arriveText = '抵達';
            if (state.outboundLocation) {
                arriveText = `抵達-${state.outboundLocation}`;
            }
            statusText.textContent = arriveText;
            statusDisplay.className = 'mb-4 p-3 rounded-lg text-center bg-blue-100 text-blue-800';
            break;
        case '離開':
            let leaveText = '離開';
            if (state.outboundLocation) {
                leaveText = `離開-${state.outboundLocation}`;
            }
            statusText.textContent = leaveText;
            statusDisplay.className = 'mb-4 p-3 rounded-lg text-center bg-blue-100 text-blue-800';
            break;
        case '返回':
            statusText.textContent = '返回-辦公室';
            statusDisplay.className = 'mb-4 p-3 rounded-lg text-center bg-green-100 text-green-800';
            break;
        case '臨時請假':
            let leaveReasonText = (state.leaveStatus === 'approved') ? '已請假' : '請假申請';
            if (state.leaveReason) {
                leaveReasonText = `${leaveReasonText}-${state.leaveReason}`;
            }
            statusText.textContent = leaveReasonText;
            statusDisplay.className = 'mb-4 p-3 rounded-lg text-center bg-orange-100 text-orange-800';
            break;
        case '特殊勤務':
            let dutyText = '出勤中';
            if (state.dutyType) {
                dutyText = `出勤-${state.dutyType}`;
            }
            statusText.textContent = dutyText;
            statusDisplay.className = 'mb-4 p-3 rounded-lg text-center bg-purple-100 text-purple-800';
            break;
        default:
            statusText.textContent = '尚未打卡';
            statusDisplay.className = 'mb-4 p-3 rounded-lg text-center bg-gray-100 text-gray-800';
    }
}

// 更新狀態顯示
function updateStatusDisplay() {
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
    
    // 更新儀表板狀態
    updateDashboardStatus();
    
    // 更新打卡狀態顯示
    const statusText = document.getElementById('status-text');
    if (statusText) {
        // 強制檢查當前用戶的打卡狀態
        if (window.__auth?.currentUser) {
            const userId = window.__auth.currentUser.uid;
            const { doc, getDoc } = window.__fs;
            const userRef = doc(window.__db, 'users', userId);
            getDoc(userRef).then(userDoc => {
                if (userDoc.exists() && userDoc.data().clockInStatus) {
                    const data = userDoc.data();
                    state.clockInStatus = data.clockInStatus;
                    state.outboundLocation = data.outboundLocation || null;
                    state.dutyType = data.dutyType || null;
                    state.leaveReason = data.leaveReason || null;
                    state.leaveStatus = data.leaveStatus || null;
                }
                
                // 根據狀態更新顯示
                updateStatusTextAndStyle(statusText, statusDisplay);
            }).catch(error => {
                console.error("獲取用戶狀態失敗:", error);
                updateStatusTextAndStyle(statusText, statusDisplay);
            });
        } else {
            updateStatusTextAndStyle(statusText, statusDisplay);
        }
    }
}

// 更新儀表板狀態
function updateDashboardStatus() {
    const dashboardStatusElement = document.getElementById('my-status');
    if (dashboardStatusElement) {
        (async () => {
            try {
                const { collection, query, where, orderBy, limit, getDocs } = window.__fs;
                const userId = window.__auth?.currentUser?.uid || state.currentUser?.uid;
                if (!userId) {
                    dashboardStatusElement.textContent = '尚未打卡';
                    return;
                }
                const q = query(
                    collection(window.__db, 'clockInRecords'),
                    where('userId', '==', userId),
                    orderBy('timestamp', 'desc'),
                    limit(1)
                );
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const r = snap.docs[0].data();
                    const statusText = getStatusDisplayText(r.type || '未知', r.locationName || null, r.dutyType || null);
                    const statusColor = getStatusColor(statusText);
                    const ts = r.timestamp && r.timestamp.toDate ? r.timestamp.toDate() : (r.timestamp ? new Date(r.timestamp) : null);
                    dashboardStatusElement.innerHTML = `
                        <div class="flex items-center justify-between">
                            <span class="font-semibold text-lg ${statusColor}">${statusText}</span>
                        </div>
                        <div class="text-sm text-gray-500 mt-1">
                            ${ts ? '打卡 ' + ts.toLocaleString('zh-TW', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'}) : ''}
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
                console.error('讀取最新打卡紀錄失敗:', e);
            }
        })();
    }
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

    // 返回按鈕預設顯示且不可用（灰色）
    const returnBtn = document.getElementById('return-btn');
    if (returnBtn) {
        returnBtn.disabled = true;
        returnBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600', 'bg-green-700', 'hover:bg-green-800');
        returnBtn.classList.add('bg-gray-300', 'cursor-not-allowed', 'disabled');
        returnBtn.dataset.type = '返回';
        returnBtn.textContent = '返回打卡';
    }

    // 複合循環按鈕（外出/抵達/離開/返回）動態設定器
    const setOutboundCycleButton = (nextType, label, bgClass) => {
        const cycleBtn = document.getElementById('outbound-cycle-btn');
        if (!cycleBtn) return;
        cycleBtn.dataset.type = nextType;
        cycleBtn.textContent = label;
        cycleBtn.disabled = false;
        cycleBtn.classList.remove('bg-gray-300', 'cursor-not-allowed', 'disabled',
                                  'bg-blue-500', 'hover:bg-blue-600', 'bg-teal-700', 'hover:bg-teal-800',
                                  'bg-red-700', 'hover:bg-red-800');
        if (bgClass) {
            cycleBtn.classList.add(bgClass);
        }
    };

    // 上班/下班單一切換按鈕動態設定器
    const setWorkToggleButton = (nextType, label, bgClass) => {
        const toggleBtn = document.getElementById('work-toggle-btn');
        if (!toggleBtn) return;
        toggleBtn.dataset.type = nextType;
        toggleBtn.textContent = label;
        toggleBtn.disabled = false;
        toggleBtn.classList.remove('bg-gray-300', 'cursor-not-allowed', 'disabled',
                                   'bg-green-500', 'hover:bg-green-600',
                                   'bg-red-500', 'hover:bg-red-600');
        if (bgClass) {
            toggleBtn.classList.add(bgClass);
            // 加上對應 hover 類
            if (bgClass === 'bg-green-500') {
                toggleBtn.classList.add('hover:bg-green-600');
            } else if (bgClass === 'bg-red-500') {
                toggleBtn.classList.add('hover:bg-red-600');
            }
        }
    };
    
    // 根據當前狀態啟用相應按鈕
    switch(state.clockInStatus) {
        case 'none':
            // 尚未打卡，只啟用上班（切換按鈕設為上班）
            setWorkToggleButton('上班', '上班打卡', 'bg-green-500');
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
            // 外出中：抵達可動作（藍系），下班不可動作（灰），返回不可動作（灰）
            setOutboundCycleButton('抵達', '抵達打卡', 'bg-blue-500');
            // 禁用下班按鈕：設為灰色不可動作
            const toggleBtn1 = document.getElementById('work-toggle-btn');
            if (toggleBtn1) {
                toggleBtn1.dataset.type = '下班';
                toggleBtn1.textContent = '下班打卡';
                toggleBtn1.disabled = true;
                toggleBtn1.classList.remove('bg-red-500', 'hover:bg-red-600', 'bg-green-500', 'hover:bg-green-600');
                toggleBtn1.classList.add('bg-gray-300', 'cursor-not-allowed', 'disabled');
            }
            break;
        case '抵達':
            // 抵達中：離開可動作（藍系），下班不可動作（灰），返回不可動作（灰）
            setOutboundCycleButton('離開', '離開打卡', 'bg-blue-500');
            const toggleBtn2 = document.getElementById('work-toggle-btn');
            if (toggleBtn2) {
                toggleBtn2.dataset.type = '下班';
                toggleBtn2.textContent = '下班打卡';
                toggleBtn2.disabled = true;
                toggleBtn2.classList.remove('bg-red-500', 'hover:bg-red-600', 'bg-green-500', 'hover:bg-green-600');
                toggleBtn2.classList.add('bg-gray-300', 'cursor-not-allowed', 'disabled');
            }
            break;
        case '離開':
            // 離開後：外出循環回到外出（藍），下班可動作（紅），返回可動作（深綠）
            setOutboundCycleButton('外出', '外出打卡', 'bg-blue-500');
            setWorkToggleButton('下班', '下班打卡', 'bg-red-500');
            if (returnBtn) {
                returnBtn.disabled = false;
                returnBtn.classList.remove('bg-gray-300', 'cursor-not-allowed', 'disabled');
                returnBtn.classList.add('bg-green-700');
            }
            break;
        case '返回':
            // 已返回：外出可動作（藍），下班可動作（紅），返回回到不可動作（灰）
            setWorkToggleButton('下班', '下班打卡', 'bg-red-500');
            setOutboundCycleButton('外出', '外出打卡', 'bg-blue-500');
            if (returnBtn) {
                returnBtn.disabled = true;
                returnBtn.classList.remove('bg-green-700');
                returnBtn.classList.add('bg-gray-300', 'cursor-not-allowed', 'disabled');
            }
            break;
        case '臨時請假':
            // 臨時請假中，不啟用其他按鈕
            break;
        case '特殊勤務':
            // 特殊勤務中，不啟用其他按鈕
            break;
        default:
            // 未知狀態，切換按鈕設為上班
            setWorkToggleButton('上班', '上班打卡', 'bg-green-500');
}
    
    // 更新狀態顯示
    updateStatusDisplay();
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

// 臨時請假彈窗
function openTempLeaveModal() {
    // 創建彈窗背景
    const backdrop = document.createElement('div');
    backdrop.id = 'modal-backdrop';
    backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    // 創建彈窗
    const modal = document.createElement('div');
    modal.id = 'temp-leave-modal';
    modal.className = 'bg-white rounded-lg p-6 w-[90%] max-w-md';
    
    // 彈窗標題
    const title = document.createElement('h3');
    title.className = 'text-lg font-bold mb-4 text-center';
            title.textContent = '請假申請';
    
    // 創建請假事由選擇
    const reasonLabel = document.createElement('label');
    reasonLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    reasonLabel.textContent = '請假事由';
    
    const reasonSelect = document.createElement('select');
    reasonSelect.id = 'leave-reason-select';
    reasonSelect.className = 'w-full border border-gray-300 rounded-md p-2 mb-4';
    
    // 添加選項
    const options = ['病假', '事假', '其他'];
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        reasonSelect.appendChild(optionElement);
    });
    
    // 創建其他原因輸入框（當選擇"其他"時顯示）
    const otherReasonInput = document.createElement('input');
    otherReasonInput.id = 'other-leave-reason';
    otherReasonInput.type = 'text';
    otherReasonInput.className = 'w-full border border-gray-300 rounded-md p-2 mb-4 hidden';
    otherReasonInput.placeholder = '請輸入請假原因';
    
    // 添加選擇變更事件
    reasonSelect.addEventListener('change', () => {
        if (reasonSelect.value === '其他') {
            otherReasonInput.classList.remove('hidden');
        } else {
            otherReasonInput.classList.add('hidden');
        }
    });
    
    // 請假類型（整日/按小時）
    const typeLabel = document.createElement('label');
    typeLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    typeLabel.textContent = '請假類型';

    const typeContainer = document.createElement('div');
    typeContainer.className = 'flex items-center space-x-6 mb-2';

    const hourlyLabel = document.createElement('label');
    hourlyLabel.className = 'flex items-center space-x-2';
    const hourlyInput = document.createElement('input');
    hourlyInput.type = 'radio';
    hourlyInput.name = 'leave-type';
    hourlyInput.value = 'hourly';
    hourlyInput.checked = true;
    const hourlyText = document.createElement('span');
    hourlyText.textContent = '按小時';
    hourlyLabel.appendChild(hourlyInput);
    hourlyLabel.appendChild(hourlyText);

    const fullDayLabel = document.createElement('label');
    fullDayLabel.className = 'flex items-center space-x-2';
    const fullDayInput = document.createElement('input');
    fullDayInput.type = 'radio';
    fullDayInput.name = 'leave-type';
    fullDayInput.value = 'full_day';
    const fullDayText = document.createElement('span');
    fullDayText.textContent = '整日';
    fullDayLabel.appendChild(fullDayInput);
    fullDayLabel.appendChild(fullDayText);

    typeContainer.appendChild(hourlyLabel);
    typeContainer.appendChild(fullDayLabel);

    // 創建日期時間區間（按小時）
    const startDateLabel = document.createElement('label');
    startDateLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    startDateLabel.textContent = '開始時間';

    const startDateInput = document.createElement('input');
    startDateInput.id = 'leave-start-time';
    startDateInput.type = 'datetime-local';
    startDateInput.className = 'w-full border border-gray-300 rounded-md p-2 mb-4';
    startDateInput.step = '3600'; // 設置步進為3600秒，即1小時
    
    // 設置預設值為當前時間（分鐘設為0）
    const now = new Date();
    now.setMinutes(0); // 將分鐘設為0
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    startDateInput.value = `${year}-${month}-${day}T${hours}:00`;
    
    const endDateLabel = document.createElement('label');
    endDateLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    endDateLabel.textContent = '結束時間';
    
    const endDateInput = document.createElement('input');
    endDateInput.id = 'leave-end-time';
    endDateInput.type = 'datetime-local';
    endDateInput.className = 'w-full border border-gray-300 rounded-md p-2 mb-4';
    endDateInput.step = '3600'; // 設置步進為3600秒，即1小時
    
    // 設置預設值為當前時間加8小時，分鐘設為0
    const endTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    endTime.setMinutes(0); // 將分鐘設為0
    const endYear = endTime.getFullYear();
    const endMonth = String(endTime.getMonth() + 1).padStart(2, '0');
    const endDay = String(endTime.getDate()).padStart(2, '0');
    const endHours = String(endTime.getHours()).padStart(2, '0');
    endDateInput.value = `${endYear}-${endMonth}-${endDay}T${endHours}:00`;
    
    // 整日日期區間（整日）
    const startDayLabel = document.createElement('label');
    startDayLabel.className = 'block text-sm font-medium text-gray-700 mb-1 hidden';
    startDayLabel.textContent = '開始日期';

    const startDayInput = document.createElement('input');
    startDayInput.id = 'leave-start-day';
    startDayInput.type = 'date';
    startDayInput.className = 'w-full border border-gray-300 rounded-md p-2 mb-4 hidden';

    const endDayLabel = document.createElement('label');
    endDayLabel.className = 'block text-sm font-medium text-gray-700 mb-1 hidden';
    endDayLabel.textContent = '結束日期';

    const endDayInput = document.createElement('input');
    endDayInput.id = 'leave-end-day';
    endDayInput.type = 'date';
    endDayInput.className = 'w-full border border-gray-300 rounded-md p-2 mb-4 hidden';

    const nowDayYear = now.getFullYear();
    const nowDayMonth = String(now.getMonth() + 1).padStart(2, '0');
    const nowDayDate = String(now.getDate()).padStart(2, '0');
    const todayStr = `${nowDayYear}-${nowDayMonth}-${nowDayDate}`;
    startDayInput.value = todayStr;
    endDayInput.value = todayStr;

    // 切換顯示邏輯
    function updateLeaveTypeVisibility() {
      const isFullDay = fullDayInput.checked;
      startDateLabel.classList.toggle('hidden', isFullDay);
      startDateInput.classList.toggle('hidden', isFullDay);
      endDateLabel.classList.toggle('hidden', isFullDay);
      endDateInput.classList.toggle('hidden', isFullDay);

      startDayLabel.classList.toggle('hidden', !isFullDay);
      startDayInput.classList.toggle('hidden', !isFullDay);
      endDayLabel.classList.toggle('hidden', !isFullDay);
      endDayInput.classList.toggle('hidden', !isFullDay);
    }
    hourlyInput.addEventListener('change', updateLeaveTypeVisibility);
    fullDayInput.addEventListener('change', updateLeaveTypeVisibility);
    updateLeaveTypeVisibility();

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
    confirmButton.className = 'px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600';
    confirmButton.textContent = '確認請假';
    confirmButton.addEventListener('click', async () => {
        // 獲取請假事由
        let reason = reasonSelect.value;
        if (reason === '其他') {
            reason = otherReasonInput.value.trim();
            if (!reason) {
                showToast('請輸入請假原因', true);
                return;
            }
        }
        
        // 請假類型
        const selectedType = document.querySelector('input[name="leave-type"]:checked')?.value || 'hourly';

        // 獲取時間區間
        let startTime;
        let endTime;
        if (selectedType === 'full_day') {
            const startDayVal = startDayInput.value;
            const endDayVal = endDayInput.value;
            if (!startDayVal || !endDayVal) {
                showToast('請選擇開始與結束日期', true);
                return;
            }
            startTime = new Date(`${startDayVal}T00:00:00`);
            endTime = new Date(`${endDayVal}T23:59:59`);
        } else {
            startTime = new Date(startDateInput.value);
            endTime = new Date(endDateInput.value);
        }
        
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
            
            // 創建請假記錄
            const { addDoc, collection, updateDoc, doc, Timestamp, serverTimestamp } = window.__fs;
            const leaveData = {
                userId: user.uid,
                userName: state.currentUser.displayName || user.email,
                reason: reason,
                startTime: Timestamp.fromDate(startTime),
                endTime: Timestamp.fromDate(endTime),
                leaveType: selectedType,
                status: 'pending', // 待審核
                createdAt: serverTimestamp()
            };
            
            // 保存到 Firestore
            const leaveRef = await addDoc(collection(window.__db, 'leaves'), leaveData);
            console.log('請假記錄已創建:', leaveRef.id);
            
            // 更新用戶狀態
            await updateDoc(doc(window.__db, 'users', user.uid), {
                clockInStatus: '臨時請假',
                leaveReason: reason,
                leaveStartTime: Timestamp.fromDate(startTime),
                leaveEndTime: Timestamp.fromDate(endTime)
            });
            console.log('用戶狀態已更新為請假申請');
            
            // 更新本地狀態
            state.clockInStatus = '臨時請假';
            
            // 更新狀態顯示
            updateStatusDisplay();
            updateButtonStatus();
            
            showToast('請假申請已提交');
            closeAllModals();
        } catch (error) {
            console.error('提交請假申請失敗:', error);
            showToast('提交請假申請失敗，請稍後再試', true);
        } finally {
            showLoading(false);
        }
    });
    
    // 組裝彈窗
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    modal.appendChild(title);
    modal.appendChild(reasonLabel);
    modal.appendChild(reasonSelect);
    modal.appendChild(otherReasonInput);
    modal.appendChild(typeLabel);
    modal.appendChild(typeContainer);
    modal.appendChild(startDateLabel);
    modal.appendChild(startDateInput);
    modal.appendChild(endDateLabel);
    modal.appendChild(endDateInput);
    modal.appendChild(startDayLabel);
    modal.appendChild(startDayInput);
    modal.appendChild(endDayLabel);
    modal.appendChild(endDayInput);
    modal.appendChild(buttonContainer);
    
    // 添加到頁面
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
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
    modal.className = 'bg-white rounded-lg p-6 w-[90%] max-w-md';
    
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
                userName: state.currentUser.displayName || user.email,
                dutyType: dutyType,
                location: location,
                startTime: Timestamp.fromDate(startTime),
                endTime: Timestamp.fromDate(endTime),
                createdAt: serverTimestamp()
            };
            
            // 保存到 Firestore
            const dutyRef = await addDoc(collection(window.__db, 'specialDuties'), dutyData);
            console.log('特殊勤務記錄已創建:', dutyRef.id);
            
            // 更新用戶狀態
            await updateDoc(doc(window.__db, 'users', user.uid), {
                clockInStatus: '特殊勤務',
                dutyType: dutyType,
                dutyLocation: location,
                dutyStartTime: Timestamp.fromDate(startTime),
                dutyEndTime: Timestamp.fromDate(endTime)
            });
            console.log('用戶狀態已更新為特殊勤務');
            
            // 更新本地狀態
            state.clockInStatus = '特殊勤務';
            
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
let autoClockOutTimer = null;
let autoClockOutSettings = {
    enabled: false,
    workHours: 8,
    loaded: false
};

// 載入自動下班打卡設定
async function loadAutoClockOutSettings() {
    try {
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
            deviceId: (window.state && window.state.deviceId) ? window.state.deviceId : 'unknown-device'
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
                            deviceId: (window.state && window.state.deviceId) ? window.state.deviceId : 'unknown-device'
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
    // 保留設定載入，可供自動下班邏輯使用（例如上班打卡後啟動計時器）。
    setTimeout(loadAutoClockOutSettings, 1000);
});