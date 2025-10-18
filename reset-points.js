// 重置所有用戶點數為0的函數（v10 模組 API）
async function resetAllUserPoints() {
    if (!confirm('確定要將所有用戶的獎懲點數重置為0嗎？此操作無法撤銷。')) {
        return;
    }
    
    try {
        showLoading(true);
        
        const db = window.__db;
        const { collection, getDocs, writeBatch, doc } = window.__fs;
        // 獲取所有用戶
        const usersSnapshot = await getDocs(collection(db, "users"));
        const batch = writeBatch(db);
        
        // 批量更新所有用戶的點數為0
        usersSnapshot.forEach(userDoc => {
            const userRef = doc(db, "users", userDoc.id);
            batch.update(userRef, { points: 0 });
        });
        
        // 提交批量更新
        await batch.commit();
        
        showToast("已成功將所有用戶的獎懲點數重置為0");
    } catch (error) {
        console.error("重置點數失敗:", error);
        showToast("重置點數失敗，請稍後再試", true);
    } finally {
        showLoading(false);
    }
}

// 設定每月自動重置點數的函數
function setupMonthlyPointsReset() {
    console.log("設定每月自動重置點數");
    
    // 檢查是否已經設定了自動重置
    const lastSetupTime = localStorage.getItem('monthlyResetSetupTime');
    const currentTime = new Date().getTime();
    
    // 如果已經設定過且距離上次設定不到24小時，則不重複設定
    if (lastSetupTime && (currentTime - parseInt(lastSetupTime)) < 24 * 60 * 60 * 1000) {
        console.log("已經設定過自動重置，不重複設定");
        return;
    }
    
    // 計算下個月1日00:01的時間
    function getNextMonthResetTime() {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 1, 0);
        return nextMonth.getTime() - now.getTime();
    }
    
    // 設定定時器
    function scheduleNextReset() {
        const timeUntilNextReset = getNextMonthResetTime();
        console.log(`下次重置將在 ${new Date(Date.now() + timeUntilNextReset).toLocaleString()} 執行`);
        
        setTimeout(async () => {
            try {
                console.log("執行每月自動重置點數");
                
                const db = window.__db;
                const { collection, getDocs, writeBatch, doc, serverTimestamp, addDoc } = window.__fs;
                // 獲取所有用戶
                const usersSnapshot = await getDocs(collection(db, "users"));
                const batch = writeBatch(db);
                
                // 批量更新所有用戶的點數為0
                usersSnapshot.forEach(userDoc => {
                    const userRef = doc(db, "users", userDoc.id);
                    batch.update(userRef, { points: 0 });
                });
                
                // 提交批量更新
                await batch.commit();
                
                console.log("每月自動重置點數完成");
                
                // 記錄重置時間
                const resetLog = {
                    timestamp: serverTimestamp(),
                    action: "monthly_auto_reset",
                    description: "系統自動執行每月點數重置"
                };
                
                await addDoc(collection(db, "systemLogs"), resetLog);
                
                // 設定下一次重置
                scheduleNextReset();
                
            } catch (error) {
                console.error("自動重置點數失敗:", error);
                // 如果失敗，1小時後重試
                setTimeout(scheduleNextReset, 60 * 60 * 1000);
            }
        }, timeUntilNextReset);
    }
    
    // 啟動定時器
    scheduleNextReset();
    
    // 記錄設定時間
    localStorage.setItem('monthlyResetSetupTime', currentTime.toString());
}

// 當管理員登入時初始化每月重置功能
function initPointsResetFeatures() {
    // 檢查用戶是否為管理員
    const auth = window.__auth;
    const { onAuthStateChanged } = window.__authHelpers;
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const db = window.__db;
            const { getDoc, doc } = window.__fs;
            getDoc(doc(db, "users", user.uid)).then(docSnap => {
                if (docSnap.exists() && docSnap.data().role === 'admin') {
                    // 設定每月自動重置
                    setupMonthlyPointsReset();
                }
            });
        }
    });
}

// 頁面載入時初始化
// 等待 index.html 模組初始化完成（__auth/__db/__fs 就緒）
function initWhenFirebaseReady() {
    if (window.__auth && window.__db && window.__fs && window.__authHelpers) {
        initPointsResetFeatures();
    } else {
        // 若尚未就緒，稍後重試
        setTimeout(initWhenFirebaseReady, 200);
    }
}

// 優先透過事件觸發；若事件不可用則退回輪詢
window.addEventListener('firebase-ready', initWhenFirebaseReady);
document.addEventListener('DOMContentLoaded', initWhenFirebaseReady);