// 功能分頁渲染函數
function renderFeatures(subPage) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="h-[50px] flex items-center justify-around border-b border-gray-200 bg-white">
            <button data-subtab="training" class="sub-tab-btn px-4 py-2 rounded-md text-sm font-medium text-gray-600 ${subPage === 'training' ? 'active' : ''}">教育訓練</button>
            <button data-subtab="downloads" class="sub-tab-btn px-4 py-2 rounded-md text-sm font-medium text-gray-600 ${subPage === 'downloads' ? 'active' : ''}">文件下載</button>
        </div>
        <div id="sub-page-content" class="overflow-y-auto" style="height: calc(100% - 50px);"></div>`;
    
    const subPageContent = document.getElementById('sub-page-content');
    if (subPage === 'training') {
        renderFeaturesTraining(subPageContent);
    } else if (subPage === 'downloads') {
        renderFeaturesDownloads(subPageContent);
    } else {
        renderFeaturesTraining(subPageContent);
    }
    
    mainContent.querySelectorAll('.sub-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof showPage === 'function') {
                showPage('features', btn.dataset.subtab);
            } else {
                console.error('showPage function is not defined');
            }
        });
    });
}

// 功能分頁 - 最新消息子分頁
function renderFeaturesNews(container) {
    container.innerHTML = `
        <div class="p-4 flex flex-col items-center justify-center h-full">
            <div class="text-center">
                <i data-lucide="construction" class="w-16 h-16 text-gray-400 mx-auto mb-4"></i>
                <h2 class="text-xl font-semibold text-gray-700 mb-2">功能開發中...</h2>
                <p class="text-gray-500">此功能正在開發中，敬請期待！</p>
            </div>
        </div>`;
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
    }
}

// 功能分頁 - 聯絡簿子分頁
function renderFeaturesContacts(container) {
    container.innerHTML = `
        <div class="p-4 flex flex-col items-center justify-center h-full">
            <div class="text-center">
                <i data-lucide="construction" class="w-16 h-16 text-gray-400 mx-auto mb-4"></i>
                <h2 class="text-xl font-semibold text-gray-700 mb-2">功能開發中...</h2>
                <p class="text-gray-500">此功能正在開發中，敬請期待！</p>
            </div>
        </div>`;
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
    }
}

// 功能分頁 - 教育訓練子分頁
function renderFeaturesTraining(container) {
    container.innerHTML = `
        <div class="p-4 flex flex-col items-center justify-center h-full">
            <div class="text-center">
                <i data-lucide="construction" class="w-16 h-16 text-gray-400 mx-auto mb-4"></i>
                <h2 class="text-xl font-semibold text-gray-700 mb-2">功能開發中</h2>
            </div>
        </div>`;
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
    }
}

// 功能分頁 - 文件下載子分頁
function renderFeaturesDownloads(container) {
    container.innerHTML = `
        <div class="p-4 flex flex-col items-center justify-center h-full">
            <div class="text-center">
                <i data-lucide="construction" class="w-16 h-16 text-gray-400 mx-auto mb-4"></i>
                <h2 class="text-xl font-semibold text-gray-700 mb-2">功能開發中</h2>
            </div>
        </div>`;
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
    }
}