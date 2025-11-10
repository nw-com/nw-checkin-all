// 儀錶板功能函數

/**
 * 計算工作時間
 * @param {string} status - 打卡狀態
 * @param {object} clockInTime - 上班打卡時間
 * @returns {string} 格式化的工作時間
 */
function calculateWorkingTime(status, clockInTime) {
    if (!clockInTime || status === '下班' || status === '未打卡' || status === '已下班-未打卡') {
        return '';
    }
    
    const startTime = clockInTime.toDate ? clockInTime.toDate() : new Date(clockInTime);
    const now = new Date();
    const diffMs = now - startTime;
    
    // 如果時間差為負或無效，返回空字符串
    if (isNaN(diffMs) || diffMs < 0) {
        return '';
    }
    
    // 計算小時、分鐘和秒
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}小時${minutes}分鐘`;
}

/**
 * 獲取狀態顯示文本
 * @param {string} status - 打卡狀態
 * @param {string} location - 位置信息
 * @returns {string} 格式化的狀態文本
 */
function getStatusDisplayText(status, location, dutyType) {
    // 取社區顯示名稱：優先短名，其次正式名稱，最後代碼/ID
    const comm = (typeof window !== 'undefined' && window.state) ? window.state.currentCommunity : null;
    // 僅使用短名/名稱作為顯示，避免顯示社區編號
    const commLabel = comm && ((comm.shortName || comm.name) || '') || '';
    switch(status) {
        case '上班': return commLabel ? `已 ${commLabel} 上班` : '上班';
        case '下班': return commLabel ? `已 ${commLabel} 下班` : '下班';
        case '自動下班': return commLabel ? `已 ${commLabel} 下班` : '下班';
        case '已下班-未打卡': return '已下班-未打卡';
        case '外出': {
            if (dutyType && location) return `外出-${dutyType}-${location}`;
            if (dutyType) return `外出-${dutyType}`;
            if (location) return `外出-${location}`;
            return '外出中';
        }
        case '抵達': {
            if (dutyType && location) return `抵達-${dutyType}-${location}`;
            if (dutyType) return `抵達-${dutyType}`;
            if (location) return `抵達-${location}`;
            return '抵達';
        }
        case '離開': {
            if (dutyType && location) return `離開-${dutyType}-${location}`;
            if (dutyType) return `離開-${dutyType}`;
            if (location) return `離開-${location}`;
            return '離開';
        }
        case '返回': return '返回-辦公室';
        case '臨時請假': return commLabel ? `已 ${commLabel} 請假` : '請假申請';
        case '特殊勤務': {
            if (dutyType) return `出勤-${dutyType}`;
            if (location) return `出勤-${location}`;
            return '出勤中';
        }
        default: return '尚未打卡';
    }
}

/**
 * 獲取狀態顏色
 * @param {string} status - 打卡狀態
 * @returns {string} 對應的CSS顏色類
 */
function getStatusColor(status) {
    if (status.includes('上班')) return 'text-green-600';
    if (status.includes('已下班-未打卡')) return 'text-yellow-600';
    if (status.includes('下班')) return 'text-red-600';
    if (status.includes('外出') || status.includes('抵達') || status.includes('離開')) return 'text-blue-600';
    if (status.includes('返回')) return 'text-green-600';
    if (status.includes('請假')) return 'text-orange-600';
    if (status.includes('出勤')) return 'text-purple-600';
    return 'text-gray-500';
}

// 導出函數供其他文件使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateWorkingTime,
        getStatusDisplayText,
        getStatusColor
    };
}