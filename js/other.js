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
        <div class="p-4 flex flex-col items-center justify-center h-full">
            <div class="text-center">
                <i data-lucide="bell" class="w-16 h-16 text-gray-400 mx-auto mb-4"></i>
                <h2 class="text-xl font-semibold text-gray-700 mb-2">功能開發中...</h2>
                <p class="text-gray-500">訊息通知功能正在開發中，敬請期待！</p>
            </div>
        </div>`;
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
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