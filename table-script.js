// 全局變數
let timers = {};
let nextId = 5; // 下一個ID
let isDarkMode = false;
let mapInfos = {}; // 地圖資訊
let nextMapId = 10; // 下一個地圖ID
let editingMapId = null; // 正在編輯的地圖ID
let currentSortMode = 'mapLevel'; // 當前排序模式: 'mapLevel', 'respawnTime', 'chapterKing'

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeDefaultMaps();
    initializeEventListeners();
    loadData();
    updateRowNumbers();
    updateMapSelects();
    // 確保初始排序模式正確應用
    sortTable(currentSortMode);
});

// 初始化預設地圖
function initializeDefaultMaps() {
    mapInfos = {
        1: {
            id: 1,
            name: '王陵 3 層',
            level: 68,
            boss: '雷克西波',
            chapterKing: 'T'
        },
        2: {
            id: 2,
            name: '魔族收監所第 5 區',
            level: 74,
            boss: '哈勃克',
            chapterKing: 'T'
        },
		3: {
            id: 3,
            name: '魔法師之塔 1 層',
            level: 77,
            boss: '火焰蜥蜴王',
            chapterKing: 'F'
        },
		4: {
            id: 4,
            name: '魔法師之塔 2 層',
            level: 78,
            boss: '瑪因洛德',
            chapterKing: 'F'
        },
		5: {
            id: 5,
            name: '魔法師之塔 3 層',
            level: 79,
            boss: '赫嘉塞露女妖',
            chapterKing: 'T'
        },
		6: {
            id: 6,
            name: '大教堂懺悔路',
            level: 80,
            boss: '喀拉庫曼',
            chapterKing: 'F'
        },
		7: {
            id: 7,
            name: '大教堂正殿',
            level: 81,
            boss: '火焰權杖',
            chapterKing: 'F'
        },
		8: {
            id: 8,
            name: '大教堂大迴廊',
            level: 82,
            boss: '利泰力斯',
            chapterKing: 'F'
        },
		9: {
            id: 9,
            name: '大教堂至聖所',
            level: 83,
            boss: '那柯提斯',
            chapterKing: 'T'
        }
    };
}

// 事件監聽器初始化
function initializeEventListeners() {
    // 控制按鈕事件
    document.getElementById('manageMaps').addEventListener('click', openMapModal);
    document.getElementById('sortToggle').addEventListener('click', toggleSort);
    document.getElementById('resetAll').addEventListener('click', resetAllTimers);
    document.getElementById('exportData').addEventListener('click', exportData);
    document.getElementById('importData').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    
    // 新增記錄選擇區域事件
    document.getElementById('addRecordWithSelection').addEventListener('click', addNewRecordWithSelection);
    document.getElementById('clearSelection').addEventListener('click', clearSelection);
    document.getElementById('quickMapSelect').addEventListener('change', updateSelectionInfo);
    document.getElementById('quickBranchInput').addEventListener('input', updateSelectionInfo);
    
    // 模態框事件
    document.getElementById('closeMapModal').addEventListener('click', closeMapModal);
    document.getElementById('saveMap').addEventListener('click', saveMap);
    document.getElementById('cancelMap').addEventListener('click', cancelMapEdit);
    
    // 文件輸入事件
    document.getElementById('fileInput').addEventListener('change', importData);
    
    // 自動保存事件
    document.addEventListener('input', autoSave);
    
    // 鍵盤快捷鍵
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // 點擊模態框外部關閉
    document.getElementById('mapModal').addEventListener('click', function(event) {
        if (event.target === this) {
            closeMapModal();
        }
    });
}

// 時間輸入格式化
function formatTimeInput(input) {
    // 允許數字和負號輸入，但負號只能在開頭
    let value = input.value;
    
    // 移除除了數字和負號以外的所有字符
    value = value.replace(/[^0-9-]/g, '');
    
    // 確保負號只能在開頭，且只有一個
    if (value.includes('-')) {
        const minusCount = (value.match(/-/g) || []).length;
        if (minusCount > 1 || value.indexOf('-') !== 0) {
            value = value.replace(/-/g, '');
        }
    }
    
    // 限制最大長度為4位（包括負號）
    if (value.length > 4) {
        value = value.slice(0, 4);
    }
    
    // 如果輸入負值，限制範圍為 -1 到 -4
    if (value.startsWith('-')) {
        const num = parseInt(value);
        if (num < -4) {
            value = '-4';
        } else if (num > -1) {
            value = '-1';
        }
    }
    
    input.value = value;
}

// 解析時間輸入
function parseTimeInput(timeStr) {
    if (!timeStr || timeStr.length === 0) {
        return { hours: 0, minutes: 0, isNegative: false };
    }
    
    // 檢查是否為負值
    const isNegative = timeStr.startsWith('-');
    const num = parseInt(timeStr);
    
    // 如果是負值，返回特殊標記
    if (isNegative) {
        return { 
            hours: 0, 
            minutes: Math.abs(num), 
            isNegative: true,
            negativeValue: num 
        };
    }
    
    if (timeStr.length === 1) {
        // 1位數：代表分鐘
        return { hours: 0, minutes: num, isNegative: false };
    } else if (timeStr.length === 2) {
        // 2位數：代表分鐘
        return { hours: 0, minutes: num, isNegative: false };
    } else if (timeStr.length === 3) {
        // 3位數：前1位小時，後2位分鐘
        const hours = Math.floor(num / 100);
        const minutes = num % 100;
        return { hours, minutes, isNegative: false };
    } else if (timeStr.length === 4) {
        // 4位數：前2位小時，後2位分鐘
        const hours = Math.floor(num / 100);
        const minutes = num % 100;
        return { hours, minutes, isNegative: false };
    }
    
    return { hours: 0, minutes: 0, isNegative: false };
}

// 解析復活時間顯示字串（用於匯入資料時）
function parseRespawnTimeDisplay(respawnTimeDisplay) {
    if (!respawnTimeDisplay || !respawnTimeDisplay.includes('復活:')) {
        return null;
    }
    
    // 提取時間部分，格式如 "復活: 14:30:25"
    const timeMatch = respawnTimeDisplay.match(/復活:\s*(\d{2}):(\d{2}):(\d{2})/);
    if (!timeMatch) {
        return null;
    }
    
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const seconds = parseInt(timeMatch[3]);
    
    // 創建今天的復活時間
    const today = new Date();
    const respawnTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, seconds);
    
    // 如果時間已過，則設定為明天
    if (respawnTime <= new Date()) {
        respawnTime.setDate(respawnTime.getDate() + 1);
    }
    
    return respawnTime;
}

// 計時器功能
function startTimer(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    const timeInput = row.querySelector('.time-input');
    const timeText = row.querySelector('.time-text');
    const respawnTimeDisplay = row.querySelector('.respawn-time-display');
    const startBtn = row.querySelector('.timer-btn.start');
    const resetBtn = row.querySelector('.timer-btn.reset');
    
    // 解析時間輸入
    const timeData = parseTimeInput(timeInput.value);
    const { hours, minutes, isNegative, negativeValue } = timeData;
    
    // 如果是負值，顯示為 N 階狀態
    if (isNegative) {
        // 停止現有計時器
        if (timers[id]) {
            clearInterval(timers[id]);
            delete timers[id];
        }
        
        // 顯示階級狀態
        const level = Math.abs(negativeValue);
        timeText.textContent = `${level} 階`;
        timeText.className = 'time-text timer-level';
        
        // 清空復活時間顯示
        respawnTimeDisplay.textContent = '';
        
        // 更新按鈕狀態
        startBtn.disabled = false;
        resetBtn.disabled = false;
        
        return;
    }
    
    if (hours === 0 && minutes === 0) {
        alert('請輸入復活時間（例如：1234 代表 12小時34分鐘）或負值（-1 到 -4 代表階級）');
        return;
    }
    
    // 停止現有計時器
    if (timers[id]) {
        clearInterval(timers[id]);
    }
    
    // 計算總分鐘數
    const totalMinutes = hours * 60 + minutes;
    
    // 計算重生時間
    const now = new Date();
    const respawnTime = new Date(now.getTime() + totalMinutes * 60 * 1000);
    
    // 顯示復活時間（只顯示時間，不顯示日期）
    const respawnTimeStr = respawnTime.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    respawnTimeDisplay.textContent = `復活: ${respawnTimeStr}`;
    
    // 更新按鈕狀態
    startBtn.disabled = true;
    resetBtn.disabled = false;
    
    // 開始倒數計時
    timers[id] = setInterval(() => {
        const now = new Date();
        const remaining = respawnTime - now;
        
        if (remaining <= 0) {
            // 計算超時時間
            const overdue = Math.abs(remaining);
            const overdueHours = Math.floor(overdue / (1000 * 60 * 60));
            const overdueMinutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));
            const overdueSeconds = Math.floor((overdue % (1000 * 60)) / 1000);
            
            // 顯示超時時間
            timeText.textContent = `超時 +${overdueHours.toString().padStart(2, '0')}:${overdueMinutes.toString().padStart(2, '0')}:${overdueSeconds.toString().padStart(2, '0')}`;
            timeText.className = 'time-text timer-overdue';
            
            // 保持復活時間顯示（現在在獨立欄位中）
            respawnTimeDisplay.textContent = `復活: ${respawnTimeStr}`;
        } else {
            // 更新顯示時間
            const remainingHours = Math.floor(remaining / (1000 * 60 * 60));
            const remainingMinutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const remainingSeconds = Math.floor((remaining % (1000 * 60)) / 1000);
            
            timeText.textContent = `${remainingHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
            timeText.className = 'time-text timer-running';
        }
    }, 1000);
    
    // 立即更新一次顯示
    const remaining = respawnTime - new Date();
    if (remaining > 0) {
        const remainingHours = Math.floor(remaining / (1000 * 60 * 60));
        const remainingMinutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const remainingSeconds = Math.floor((remaining % (1000 * 60)) / 1000);
        timeText.textContent = `${remainingHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        timeText.className = 'time-text timer-running';
    }
    
    // 顯示復活時間
    respawnTimeDisplay.textContent = `復活: ${respawnTimeStr}`;
}

// 暫停功能已移除

function setFullStatus(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    const timeText = row.querySelector('.time-text');
    const respawnTimeDisplay = row.querySelector('.respawn-time-display');
    const startBtn = row.querySelector('.timer-btn.start');
    const resetBtn = row.querySelector('.timer-btn.reset');
    
    // 停止計時器
    if (timers[id]) {
        clearInterval(timers[id]);
        delete timers[id];
    }
    
    // 設定為已滿狀態
    timeText.textContent = '已滿';
    timeText.className = 'time-text timer-full';
    respawnTimeDisplay.textContent = '';
    
    // 更新按鈕狀態
    startBtn.disabled = false;
    resetBtn.disabled = false;
    
    // 自動保存
    autoSave();
}

function resetTimer(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    const timeText = row.querySelector('.time-text');
    const respawnTimeDisplay = row.querySelector('.respawn-time-display');
    const startBtn = row.querySelector('.timer-btn.start');
    const resetBtn = row.querySelector('.timer-btn.reset');
    const timeInput = row.querySelector('.time-input');
    
    // 停止計時器
    if (timers[id]) {
        clearInterval(timers[id]);
        delete timers[id];
    }
    
    // 重置顯示
    timeText.textContent = '尚未設定';
    timeText.className = 'time-text';
    respawnTimeDisplay.textContent = '';
    
    // 清空時間輸入框
    timeInput.value = '';
    
    // 重置按鈕狀態
    startBtn.disabled = false;
    resetBtn.disabled = true;
}

// 恢復計時器狀態（用於匯入資料時）
function restoreTimer(id, timerState) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (!row) return;
    
    const timeText = row.querySelector('.time-text');
    const respawnTimeDisplay = row.querySelector('.respawn-time-display');
    const startBtn = row.querySelector('.timer-btn.start');
    const resetBtn = row.querySelector('.timer-btn.reset');
    
    let respawnTime = null;
    
    // 優先使用儲存的復活時間
    if (timerState.respawnTime) {
        respawnTime = new Date(timerState.respawnTime);
    } else if (timerState.respawnTimeDisplay) {
        respawnTime = parseRespawnTimeDisplay(timerState.respawnTimeDisplay);
    }
    
    if (!respawnTime) return;
    
    const now = new Date();
    const remaining = respawnTime - now;
    
    // 根據剩餘時間計算新的 timeInput
    if (remaining > 0) {
        const remainingHours = Math.floor(remaining / (1000 * 60 * 60));
        const remainingMinutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        
        // 將剩餘時間轉換為 timeInput 格式（4位數：前2位小時，後2位分鐘）
        const newTimeInput = String(remainingHours * 100 + remainingMinutes).padStart(4, '0');
        
        // 更新 timeInput 欄位
        const timeInput = row.querySelector('.time-input');
        timeInput.value = newTimeInput;
    } else {
        // 時間差為負數時，清空 timeInput 並設定為已滿狀態
        const timeInput = row.querySelector('.time-input');
        timeInput.value = '';
        
        // 設定為已滿狀態
        timeText.textContent = '已滿';
        timeText.className = 'time-text timer-full';
        
        // 更新按鈕狀態
        startBtn.disabled = false;
        resetBtn.disabled = false;
        
        return; // 直接返回，不啟動計時器
    }
    
    // 顯示復活時間（保持原始復活時間不變）
    if (timerState.respawnTimeDisplay) {
        // 如果有原始顯示時間，保持不變
        respawnTimeDisplay.textContent = timerState.respawnTimeDisplay;
    } else {
        // 如果沒有原始顯示時間，根據復活時間生成
        const respawnTimeStr = respawnTime.toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        respawnTimeDisplay.textContent = `復活: ${respawnTimeStr}`;
    }
    
    // 更新按鈕狀態
    startBtn.disabled = true;
    resetBtn.disabled = false;
    
    // 使用更新後的 timeInput 重新啟動計時器
    const timeInput = row.querySelector('.time-input');
    const timeData = parseTimeInput(timeInput.value);
    const { hours, minutes } = timeData;
    
    // 計算新的復活時間（基於更新後的 timeInput）
    const newRespawnTime = new Date(now.getTime() + (hours * 60 + minutes) * 60 * 1000);
    
    // 開始倒數計時
    timers[id] = setInterval(() => {
        const now = new Date();
        const remaining = newRespawnTime - now;
        
        if (remaining <= 0) {
            // 計算超時時間
            const overdue = Math.abs(remaining);
            const overdueHours = Math.floor(overdue / (1000 * 60 * 60));
            const overdueMinutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));
            const overdueSeconds = Math.floor((overdue % (1000 * 60)) / 1000);
            
            timeText.textContent = `超時 +${overdueHours.toString().padStart(2, '0')}:${overdueMinutes.toString().padStart(2, '0')}:${overdueSeconds.toString().padStart(2, '0')}`;
            timeText.className = 'time-text timer-overdue';
        } else {
            // 更新顯示時間
            const remainingHours = Math.floor(remaining / (1000 * 60 * 60));
            const remainingMinutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const remainingSeconds = Math.floor((remaining % (1000 * 60)) / 1000);
            
            timeText.textContent = `${remainingHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
            timeText.className = 'time-text timer-running';
        }
    }, 1000);
    
    // 立即更新一次顯示
    const remainingHours = Math.floor(remaining / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const remainingSeconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    timeText.textContent = `${remainingHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    timeText.className = 'time-text timer-running';
}

// 地圖管理功能
function openMapModal() {
    document.getElementById('mapModal').style.display = 'block';
    refreshMapList();
    clearMapForm();
}

function closeMapModal() {
    document.getElementById('mapModal').style.display = 'none';
    editingMapId = null;
    clearMapForm();
}

function clearMapForm() {
    document.getElementById('mapNameInput').value = '';
    document.getElementById('mapLevelInput').value = '';
    document.getElementById('bossNameInput').value = '';
    document.getElementById('chapterKingInput').value = 'T';
    document.getElementById('saveMap').textContent = '儲存地圖';
}

function saveMap() {
    const name = document.getElementById('mapNameInput').value.trim();
    const level = parseInt(document.getElementById('mapLevelInput').value);
    const boss = document.getElementById('bossNameInput').value.trim();
    const chapterKing = document.getElementById('chapterKingInput').value;
    
    if (!name || !level || !boss) {
        alert('請填寫所有必要欄位');
        return;
    }
    
    // 檢查地圖名稱是否已存在（編輯時排除自己）
    const existingMap = Object.values(mapInfos).find(map => 
        map.name === name && (!editingMapId || map.id !== editingMapId)
    );
    if (existingMap) {
        alert('地圖名稱已存在，請使用不同的名稱');
        return;
    }
    
    if (editingMapId) {
        // 編輯現有地圖
        mapInfos[editingMapId] = {
            id: editingMapId,
            name: name,
            level: level,
            boss: boss,
            chapterKing: chapterKing
        };
    } else {
        // 新增地圖
        mapInfos[nextMapId] = {
            id: nextMapId,
            name: name,
            level: level,
            boss: boss,
            chapterKing: chapterKing
        };
        nextMapId++;
    }
    
    refreshMapList();
    updateMapSelects();
    clearMapForm();
    autoSave();
}

function cancelMapEdit() {
    clearMapForm();
    editingMapId = null;
}

function editMap(mapId) {
    const map = mapInfos[mapId];
    if (map) {
        document.getElementById('mapNameInput').value = map.name;
        document.getElementById('mapLevelInput').value = map.level;
        document.getElementById('bossNameInput').value = map.boss;
        document.getElementById('chapterKingInput').value = map.chapterKing;
        document.getElementById('saveMap').textContent = '更新地圖';
        editingMapId = mapId;
    }
}

function deleteMap(mapId) {
    if (confirm('確定要刪除此地圖嗎？這會影響所有使用此地圖的計時器記錄。')) {
        delete mapInfos[mapId];
        refreshMapList();
        updateMapSelects();
        autoSave();
    }
}

function refreshMapList() {
    const container = document.getElementById('mapListContainer');
    container.innerHTML = '';
    
    // 按照地圖等級排序
    const sortedMaps = Object.values(mapInfos).sort((a, b) => {
        return a.level - b.level; // 升序排列（等級由低到高）
    });
    
    sortedMaps.forEach(map => {
        const mapItem = document.createElement('div');
        mapItem.className = 'map-item';
        mapItem.innerHTML = `
            <div class="map-item-info">
                <div class="map-item-name">${map.name}</div>
                <div class="map-item-details">等級 ${map.level} | BOSS: ${map.boss} | 章節王: ${map.chapterKing}</div>
            </div>
            <div class="map-item-actions">
                <button class="map-item-btn edit" onclick="editMap(${map.id})">編輯</button>
                <button class="map-item-btn delete" onclick="deleteMap(${map.id})">刪除</button>
            </div>
        `;
        container.appendChild(mapItem);
    });
}

function updateMapSelects() {
    const selects = document.querySelectorAll('.map-select');
    selects.forEach(select => {
        const currentValue = select.value;
        const isQuickSelect = select.id === 'quickMapSelect';
        
        select.innerHTML = '';
        
        // 如果是快速選擇下拉選單，添加預設選項
        if (isQuickSelect) {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '請選擇地圖';
            select.appendChild(defaultOption);
        }
        
        // 按照地圖等級排序
        const sortedMaps = Object.values(mapInfos).sort((a, b) => {
            return a.level - b.level; // 升序排列（等級由低到高）
        });
        
        sortedMaps.forEach(map => {
            const option = document.createElement('option');
            option.value = map.id;
            option.textContent = `${map.name} (Lv.${map.level}) - ${map.boss} [${map.chapterKing}]`;
            select.appendChild(option);
        });
        
        // 恢復之前選擇的值（快速選擇下拉選單除外）
        if (!isQuickSelect && currentValue && mapInfos[currentValue]) {
            select.value = currentValue;
        }
    });
}

function updateMapInfo(recordId, mapId) {
    // 這個函數會在選擇地圖時被調用
    autoSave();
}

// 獲取指定地圖的下一個可用分流
function getNextAvailableBranch(mapId) {
    const existingBranches = [];
    
    // 收集該地圖現有的所有分流
    document.querySelectorAll('.data-row').forEach(row => {
        const rowMapId = row.querySelector('.map-select').value;
        if (rowMapId == mapId) {
            const branchValue = parseInt(row.querySelector('.map-branch input').value);
            existingBranches.push(branchValue);
        }
    });
    
    // 找到下一個可用的分流（從1開始）
    let nextBranch = 1;
    while (existingBranches.includes(nextBranch)) {
        nextBranch++;
    }
    
    return nextBranch;
}

// 更新選擇資訊顯示
function updateSelectionInfo() {
    const mapSelect = document.getElementById('quickMapSelect');
    const branchInput = document.getElementById('quickBranchInput');
    const infoElement = document.getElementById('selectionInfo');
    const clearBtn = document.getElementById('clearSelection');
    const infoText = infoElement.querySelector('.info-text');
    
    const selectedMapId = mapSelect.value;
    const branchValue = branchInput.value;
    
    if (selectedMapId) {
        const map = mapInfos[selectedMapId];
        const autoBranch = getNextAvailableBranch(selectedMapId);
        
        let info = `地圖: ${map.name} (Lv.${map.level})`;
        
        if (branchValue) {
            info += ` | 分流: ${branchValue}`;
        } else {
            info += ` | 分流: ${autoBranch} (自動)`;
        }
        
        infoText.textContent = info;
        infoElement.style.display = 'block';
        clearBtn.style.display = 'inline-block';
    } else {
        infoElement.style.display = 'none';
        clearBtn.style.display = 'none';
    }
}

// 清空選擇
function clearSelection() {
    const mapSelect = document.getElementById('quickMapSelect');
    const branchInput = document.getElementById('quickBranchInput');
    const infoElement = document.getElementById('selectionInfo');
    const clearBtn = document.getElementById('clearSelection');
    
    mapSelect.value = '';
    branchInput.value = '';
    infoElement.style.display = 'none';
    clearBtn.style.display = 'none';
}

// 新增記錄（帶選擇）
function addNewRecordWithSelection() {
    const mapSelect = document.getElementById('quickMapSelect');
    const branchInput = document.getElementById('quickBranchInput');
    
    const selectedMapId = mapSelect.value;
    if (!selectedMapId) {
        alert('請先選擇地圖');
        return;
    }
    
    // 確定分流值
    let branchValue;
    if (branchInput.value) {
        branchValue = parseInt(branchInput.value);
    } else {
        branchValue = getNextAvailableBranch(selectedMapId);
    }
    
    // 新增記錄
    addNewRecordWithParams(selectedMapId, branchValue);
    
    // 保持地圖選擇，只清空分流輸入框
    branchInput.value = '';
    
    // 更新選擇資訊顯示（保持地圖選擇，更新分流為自動）
    updateSelectionInfo();
}

// 新增記錄（帶參數）
function addNewRecordWithParams(mapId, branchValue) {
    const tableBody = document.getElementById('tableBody');
    const newRow = document.createElement('tr');
    newRow.className = 'data-row';
    newRow.setAttribute('data-id', nextId);
    
    // 按照地圖等級排序生成選項
    const sortedMaps = Object.values(mapInfos).sort((a, b) => a.level - b.level);
    
    newRow.innerHTML = `
        <td class="row-number">${nextId}</td>
        <td class="map-info">
            <select class="map-select" onchange="updateMapInfo(${nextId}, this.value)">
                ${sortedMaps.map(map => 
                    `<option value="${map.id}" ${map.id == mapId ? 'selected' : ''}>${map.name} (Lv.${map.level}) - ${map.boss} [${map.chapterKing}]</option>`
                ).join('')}
            </select>
        </td>
        <td class="map-branch">
            <input type="number" value="${branchValue}" class="editable-input">
        </td>
        <td class="respawn-duration">
            <div class="duration-controls">
                <div class="time-input-section">
                    <input type="text" class="time-input" placeholder="" maxlength="4" pattern="-?[0-9]{1,3}" oninput="formatTimeInput(this)">
                    <span class="time-hint">時分</span>
                </div>
                <div class="timer-controls">
                    <button class="timer-btn start" onclick="startTimer(${nextId})">開始</button>
                    <button class="timer-btn full" onclick="setFullStatus(${nextId})">已滿</button>
                    <button class="timer-btn reset" onclick="resetTimer(${nextId})" disabled>重設</button>
                </div>
            </div>
        </td>
        <td class="respawn-status">
            <div class="status-display">
                <span class="time-text">尚未設定</span>
            </div>
        </td>
        <td class="respawn-time">
            <div class="time-display">
                <span class="respawn-time-display"></span>
            </div>
        </td>
        <td class="actions">
            <button class="action-btn copy" onclick="copyRecordInfo(${nextId})">複製</button>
            <button class="action-btn delete" onclick="deleteRecord(${nextId})">刪除</button>
        </td>
    `;
    
    tableBody.appendChild(newRow);
    nextId++;
    updateRowNumbers();
    
    // 如果是地圖等級排序，更新分隔線
    if (currentSortMode === 'mapLevel') {
        addMapSeparators();
    }
    
    autoSave();
}

// 數據管理功能（保留原有功能作為備用）
function addNewRecord() {
    // 獲取第一個可用的地圖ID
    const firstMapId = Object.keys(mapInfos)[0] || 1;
    
    // 獲取該地圖的下一個可用分流
    const nextBranch = getNextAvailableBranch(firstMapId);
    
    // 使用新的函數新增記錄
    addNewRecordWithParams(firstMapId, nextBranch);
}

function deleteRecord(id) {
    if (confirm('確定要刪除此記錄嗎？')) {
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) {
            // 停止計時器
            if (timers[id]) {
                clearInterval(timers[id]);
                delete timers[id];
            }
            
            row.remove();
            updateRowNumbers();
            
            // 如果是地圖等級排序，更新分隔線
            if (currentSortMode === 'mapLevel') {
                addMapSeparators();
            }
            
            autoSave();
        }
    }
}

// 格式化時間用於複製
function formatTimeForCopy(timeText, className) {
    if (className.includes('timer-overdue')) {
        // 超時狀態：解析超時時間
        const match = timeText.match(/超時 \+(\d+):(\d+):(\d+)/);
        if (match) {
            const hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            const seconds = parseInt(match[3]);
            
            if (hours > 0) {
                return `超時 ${hours} 小時 ${minutes} 分鐘`;
            } else if (minutes > 0) {
                return `超時 ${minutes} 分鐘`;
            } else {
                return `超時 ${seconds} 秒`;
            }
        }
        return timeText;
    } else if (className.includes('timer-running')) {
        // 運行中狀態：解析剩餘時間
        const match = timeText.match(/(\d+):(\d+):(\d+)/);
        if (match) {
            const hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            const seconds = parseInt(match[3]);
            
            if (hours > 0) {
                return `仍需 ${hours} 小時 ${minutes} 分鐘`;
            } else if (minutes > 0) {
                return `仍需 ${minutes} 分鐘`;
            } else {
                return `仍需 ${seconds} 秒`;
            }
        }
        return timeText;
    } else if (timeText === '已滿') {
        // 已滿狀態：直接返回
        return '已滿';
    } else if (className.includes('timer-level')) {
        // 階級狀態：直接返回
        return timeText;
    } else {
        return timeText;
    }
}

// 複製記錄資訊功能
function copyRecordInfo(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (!row) return;
    
    // 獲取地圖資訊
    const mapId = row.querySelector('.map-select').value;
    const map = mapInfos[mapId];
    
    // 獲取分流資訊
    const mapBranch = row.querySelector('.map-branch input').value;
    
    // 獲取重生狀態
    const timeText = row.querySelector('.time-text');
    const respawnTimeDisplay = row.querySelector('.respawn-time-display');
    
    if (!map) {
        alert('無法獲取地圖資訊');
        return;
    }
    
    // 構建複製內容（精簡版）
    let copyText = `Lv.${map.level} - 分流${mapBranch}`;
    
    // 添加重生狀態資訊
    if (timeText.textContent && timeText.textContent !== '尚未設定') {
        const timeStatus = formatTimeForCopy(timeText.textContent, timeText.className);
        copyText += ` - ${timeStatus}`;
    } else {
        copyText += ` - 尚未設定`;
    }
    
    // 複製到剪貼板
    navigator.clipboard.writeText(copyText).then(() => {
        // 顯示複製成功提示
        showCopyNotification();
    }).catch(err => {
        // 如果剪貼板API不可用，使用傳統方法
        fallbackCopyToClipboard(copyText);
    });
}

// 備用複製方法（當剪貼板API不可用時）
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopyNotification();
        } else {
            alert('複製失敗，請手動複製：\n' + text);
        }
    } catch (err) {
        alert('複製失敗，請手動複製：\n' + text);
    }
    
    document.body.removeChild(textArea);
}

// 顯示複製成功通知
function showCopyNotification() {
    // 創建通知元素
    const notification = document.createElement('div');
    notification.textContent = '已複製到剪貼板！';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #27ae60, #2ecc71);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        animation: slideInRight 0.3s ease;
    `;
    
    // 添加動畫樣式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // 3秒後自動移除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                    document.head.removeChild(style);
                }
            }, 300);
        }
    }, 3000);
}


function resetAllTimers() {
    if (confirm('確定要重置所有計時器嗎？')) {
        Object.keys(timers).forEach(id => {
            resetTimer(parseInt(id));
        });
    }
}

// 排序切換功能
function toggleSort() {
    const sortBtn = document.getElementById('sortToggle');
    
    // 切換排序模式
    switch (currentSortMode) {
        case 'mapLevel':
            currentSortMode = 'respawnTime';
            sortBtn.textContent = '切換排序 (目前為重生時間)';
            sortTable('respawnTime');
            break;
        case 'respawnTime':
            currentSortMode = 'chapterKing';
            sortBtn.textContent = '切換排序 (目前為章節王重生時間)';
            sortTable('chapterKing');
            break;
        case 'chapterKing':
            currentSortMode = 'mapLevel';
            sortBtn.textContent = '切換排序 (目前為地圖等級)';
            sortTable('mapLevel');
            break;
    }
    
    autoSave(); // 保存排序狀態
}

// 更新排序按鈕文字
function updateSortButtonText() {
    const sortBtn = document.getElementById('sortToggle');
    if (sortBtn) {
        switch (currentSortMode) {
            case 'mapLevel':
                sortBtn.textContent = '切換排序 (目前為地圖等級)';
                break;
            case 'respawnTime':
                sortBtn.textContent = '切換排序 (目前為重生時間)';
                break;
            case 'chapterKing':
                sortBtn.textContent = '切換排序 (目前為章節王重生時間)';
                break;
            default:
                sortBtn.textContent = '切換排序 (目前為地圖等級)';
                break;
        }
    }
}

// 排序表格
function sortTable(mode) {
    const tableBody = document.getElementById('tableBody');
    const rows = Array.from(tableBody.querySelectorAll('.data-row'));
    
    if (mode === 'chapterKing') {
        // 章節王排序：只顯示章節王，按重生時間排序
        rows.forEach(row => {
            const mapId = row.querySelector('.map-select').value;
            const map = mapInfos[mapId];
            
            if (map && map.chapterKing === 'T') {
                // 章節王：顯示並繼續倒數
                row.style.display = '';
            } else {
                // 非章節王：隱藏但繼續倒數
                row.style.display = 'none';
            }
        });
        
        // 對可見的章節王行進行排序
        const visibleRows = rows.filter(row => row.style.display !== 'none');
        visibleRows.sort((a, b) => {
            const aTimeText = a.querySelector('.time-text');
            const bTimeText = b.querySelector('.time-text');
            
            const aWeight = getRespawnTimeWeight(aTimeText);
            const bWeight = getRespawnTimeWeight(bTimeText);
            
            return aWeight - bWeight;
        });
        
        // 重新排列可見行
        visibleRows.forEach(row => tableBody.appendChild(row));
        
    } else {
        // 其他排序模式：顯示所有行
        rows.forEach(row => {
            row.style.display = '';
        });
        
        rows.sort((a, b) => {
            if (mode === 'mapLevel') {
                // 按地圖等級和地圖分流排序（數字小的在上方）
                const aMapId = a.querySelector('.map-select').value;
                const bMapId = b.querySelector('.map-select').value;
                const aMapBranch = parseInt(a.querySelector('.map-branch input').value);
                const bMapBranch = parseInt(b.querySelector('.map-branch input').value);
                
                const aMap = mapInfos[aMapId];
                const bMap = mapInfos[bMapId];
                
                if (!aMap || !bMap) return 0;
                
                // 先按地圖等級排序
                if (aMap.level !== bMap.level) {
                    return aMap.level - bMap.level;
                }
                
                // 地圖等級相同時按地圖分流排序
                return aMapBranch - bMapBranch;
                
            } else if (mode === 'respawnTime') {
                // 按重生時間排序（超時越久越上方）
                const aTimeText = a.querySelector('.time-text');
                const bTimeText = b.querySelector('.time-text');
                
                const aWeight = getRespawnTimeWeight(aTimeText);
                const bWeight = getRespawnTimeWeight(bTimeText);
                
                return aWeight - bWeight;
            }
        });
        
        // 重新排列行
        rows.forEach(row => tableBody.appendChild(row));
        
        // 如果是地圖等級排序，添加地圖分隔線
        if (mode === 'mapLevel') {
            addMapSeparators();
        } else {
            removeMapSeparators();
        }
    }
    
    updateRowNumbers();
}

// 添加地圖分隔線
function addMapSeparators() {
    const tableBody = document.getElementById('tableBody');
    const rows = Array.from(tableBody.querySelectorAll('.data-row'));
    
    // 移除現有的分隔線
    removeMapSeparators();
    
    let currentMapId = null;
    
    rows.forEach((row, index) => {
        const mapId = row.querySelector('.map-select').value;
        
        // 如果是新的地圖，在該行前添加分隔線
        if (currentMapId !== null && currentMapId !== mapId) {
            const separator = document.createElement('tr');
            separator.className = 'map-separator';
            separator.innerHTML = '<td colspan="7" class="separator-cell"></td>';
            tableBody.insertBefore(separator, row);
        }
        
        currentMapId = mapId;
    });
}

// 移除地圖分隔線
function removeMapSeparators() {
    const separators = document.querySelectorAll('.map-separator');
    separators.forEach(separator => separator.remove());
}

// 獲取重生時間排序權重
function getRespawnTimeWeight(timeText) {
    const className = timeText.className;
    const text = timeText.textContent;
    
    if (className.includes('timer-overdue')) {
        // 超時狀態：解析超時時間，越久權重越小（越靠前）
        const match = text.match(/超時 \+(\d+):(\d+):(\d+)/);
        if (match) {
            const hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            const seconds = parseInt(match[3]);
            const totalSeconds = hours * 3600 + minutes * 60 + seconds;
            return -totalSeconds; // 負數，超時越久權重越小
        }
        return -999999; // 超時但無法解析時間
    } else if (className.includes('timer-running')) {
        // 運行中狀態：解析剩餘時間，剩餘時間越少權重越小（越靠前）
        const match = text.match(/(\d+):(\d+):(\d+)/);
        if (match) {
            const hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            const seconds = parseInt(match[3]);
            const totalSeconds = hours * 3600 + minutes * 60 + seconds;
            return totalSeconds; // 正數，剩餘時間越少權重越小
        }
        return 999999; // 運行中但無法解析時間
    } else if (text === '已滿') {
        // 已滿狀態：權重較小（較靠前）
        return 5000000;
    } else if (className.includes('timer-level')) {
        // 階級狀態：解析階級數字，階級越高權重越小（越靠前）
        const match = text.match(/(\d+) 階/);
        if (match) {
            const level = parseInt(match[1]);
            return 4000000 - level * 100000; // 階級越高權重越小
        }
        return 4000000; // 階級但無法解析
    } else if (text === '尚未設定') {
        // 未設定狀態：權重最大（最靠後）
        return 9999999;
    } else {
        // 其他狀態：權重中等
        return 9999998;
    }
}


// 工具函數
function updateRowNumbers() {
    const rows = document.querySelectorAll('.data-row');
    rows.forEach((row, index) => {
        const rowNumberCell = row.querySelector('.row-number');
        rowNumberCell.textContent = index + 1;
    });
}

function playNotificationSound() {
    // 創建音頻上下文並播放提示音
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.log('無法播放音效:', error);
    }
}

function handleKeyboardShortcuts(event) {
    // Ctrl+N: 新增記錄
    if (event.ctrlKey && event.key === 'n') {
        event.preventDefault();
        addNewRecord();
    }
    
    // Ctrl+S: 匯出資料
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        exportData();
    }
    
    // Ctrl+D: 切換暗黑模式
    if (event.ctrlKey && event.key === 'd') {
        event.preventDefault();
        toggleDarkMode();
    }
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
}

// 數據持久化
function autoSave() {
    const data = {
        records: [],
        mapInfos: mapInfos,
        nextId: nextId,
        nextMapId: nextMapId,
        darkMode: isDarkMode,
        sortMode: currentSortMode
    };
    
    document.querySelectorAll('.data-row').forEach(row => {
        const id = row.getAttribute('data-id');
        const timeText = row.querySelector('.time-text');
        const respawnTimeDisplay = row.querySelector('.respawn-time-display');
        const timeInput = row.querySelector('.time-input');
        
        const record = {
            id: id,
            mapId: row.querySelector('.map-select').value,
            mapBranch: row.querySelector('.map-branch input').value,
            // 新增：記錄計時器狀態和時間資訊
            timerState: {
                isRunning: timers[id] ? true : false,
                timeInput: timeInput.value,
                timeText: timeText.textContent,
                respawnTimeDisplay: respawnTimeDisplay.textContent,
                respawnTime: null // 將在下面計算
            }
        };
        
        // 計算並記錄復活時間
        if (timers[id]) {
            // 計時器正在運行，從時間輸入計算復活時間
            const timeInputValue = timeInput.value;
            if (timeInputValue) {
                const timeData = parseTimeInput(timeInputValue);
                const { hours, minutes, isNegative } = timeData;
                if (!isNegative && (hours > 0 || minutes > 0)) {
                    // 計算復活時間（當前時間 + 重生耗時）
                    const now = new Date();
                    const respawnTime = new Date(now.getTime() + (hours * 60 + minutes) * 60 * 1000);
                    record.timerState.respawnTime = respawnTime.toISOString();
                }
            }
        } else if (respawnTimeDisplay.textContent && respawnTimeDisplay.textContent.includes('復活:')) {
            // 計時器已停止，但仍有復活時間顯示，嘗試從顯示時間計算復活時間
            const parsedTime = parseRespawnTimeDisplay(respawnTimeDisplay.textContent);
            if (parsedTime) {
                record.timerState.respawnTime = parsedTime.toISOString();
            }
        }
        
        data.records.push(record);
    });
    
    localStorage.setItem('timerData', JSON.stringify(data));
}

function loadData() {
    const savedData = localStorage.getItem('timerData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            nextId = data.nextId || nextId;
            nextMapId = data.nextMapId || nextMapId;
            
            // 確保 nextMapId 不會與現有地圖衝突
            const maxExistingId = Math.max(...Object.keys(mapInfos).map(id => parseInt(id)));
            if (nextMapId <= maxExistingId) {
                nextMapId = maxExistingId + 1;
            }
            isDarkMode = data.darkMode || false;
            currentSortMode = data.sortMode || 'mapLevel';
            
            // 載入地圖資訊（合併預設地圖和保存的地圖）
            if (data.mapInfos) {
                // 合併預設地圖和保存的地圖，保存的地圖優先
                mapInfos = { ...mapInfos, ...data.mapInfos };
            }
            
            if (isDarkMode) {
                document.body.classList.add('dark-mode');
            }
            
            // 更新排序按鈕文字
            updateSortButtonText();
            
            // 如果有保存的記錄，重建表格
            if (data.records && data.records.length > 0) {
                const tableBody = document.getElementById('tableBody');
                tableBody.innerHTML = '';
                
                data.records.forEach(record => {
                    const row = document.createElement('tr');
                    row.className = 'data-row';
                    row.setAttribute('data-id', record.id);
                    
                    // 按照地圖等級排序生成選項
                    const sortedMaps = Object.values(mapInfos).sort((a, b) => a.level - b.level);
                    const mapOptions = sortedMaps.map(map => 
                        `<option value="${map.id}" ${record.mapId == map.id ? 'selected' : ''}>${map.name} (Lv.${map.level}) - ${map.boss} [${map.chapterKing}]</option>`
                    ).join('');
                    
                    row.innerHTML = `
                        <td class="row-number">${record.id}</td>
                        <td class="map-info">
                            <select class="map-select" onchange="updateMapInfo(${record.id}, this.value)">
                                ${mapOptions}
                            </select>
                        </td>
                        <td class="map-branch">
                            <input type="number" value="${record.mapBranch}" class="editable-input">
                        </td>
                        <td class="respawn-duration">
                            <div class="duration-controls">
                                <div class="time-input-section">
                                    <input type="text" class="time-input" placeholder="" maxlength="4" pattern="-?[0-9]{1,3}" oninput="formatTimeInput(this)" value="${record.timerState ? record.timerState.timeInput || '' : ''}">
                                    <span class="time-hint">時分</span>
                                </div>
                                <div class="timer-controls">
                                    <button class="timer-btn start" onclick="startTimer(${record.id})" ${record.timerState && record.timerState.isRunning ? 'disabled' : ''}>開始</button>
                                    <button class="timer-btn full" onclick="setFullStatus(${record.id})">已滿</button>
                                    <button class="timer-btn reset" onclick="resetTimer(${record.id})" ${record.timerState && record.timerState.isRunning ? '' : 'disabled'}>重設</button>
                                </div>
                            </div>
                        </td>
                        <td class="respawn-status">
                            <div class="status-display">
                                <span class="time-text">${record.timerState ? record.timerState.timeText || '尚未設定' : '尚未設定'}</span>
                            </div>
                        </td>
                        <td class="respawn-time">
                            <div class="time-display">
                                <span class="respawn-time-display">${record.timerState ? record.timerState.respawnTimeDisplay || '' : ''}</span>
                            </div>
                        </td>
                        <td class="actions">
                            <button class="action-btn copy" onclick="copyRecordInfo(${record.id})">複製</button>
                            <button class="action-btn delete" onclick="deleteRecord(${record.id})">刪除</button>
                        </td>
                    `;
                    
                    tableBody.appendChild(row);
                    
                    // 恢復計時器狀態
                    if (record.timerState && record.timerState.isRunning && (record.timerState.respawnTime || record.timerState.respawnTimeDisplay)) {
                        // 延遲執行，確保DOM元素已經渲染
                        setTimeout(() => {
                            restoreTimer(record.id, record.timerState);
                        }, 100);
                    }
                });
                
                updateRowNumbers();
                
                // 應用保存的排序
                sortTable(currentSortMode);
            }
        } catch (error) {
            console.error('載入數據失敗:', error);
        }
    }
}

function exportData() {
    const data = {
        records: [],
        mapInfos: mapInfos,
        exportTime: new Date().toISOString(),
        version: '3.0'
    };
    
    document.querySelectorAll('.data-row').forEach(row => {
        const id = row.getAttribute('data-id');
        const timeText = row.querySelector('.time-text');
        const respawnTimeDisplay = row.querySelector('.respawn-time-display');
        const timeInput = row.querySelector('.time-input');
        
        const record = {
            id: id,
            mapId: row.querySelector('.map-select').value,
            mapBranch: row.querySelector('.map-branch input').value,
            // 新增：記錄計時器狀態和時間資訊
            timerState: {
                isRunning: timers[id] ? true : false,
                timeInput: timeInput.value,
                timeText: timeText.textContent,
                respawnTimeDisplay: respawnTimeDisplay.textContent,
                respawnTime: null // 將在下面計算
            }
        };
        
        // 計算並記錄復活時間
        if (timers[id]) {
            // 計時器正在運行，從時間輸入計算復活時間
            const timeInputValue = timeInput.value;
            if (timeInputValue) {
                const timeData = parseTimeInput(timeInputValue);
                const { hours, minutes, isNegative } = timeData;
                if (!isNegative && (hours > 0 || minutes > 0)) {
                    // 計算復活時間（當前時間 + 重生耗時）
                    const now = new Date();
                    const respawnTime = new Date(now.getTime() + (hours * 60 + minutes) * 60 * 1000);
                    record.timerState.respawnTime = respawnTime.toISOString();
                }
            }
        } else if (respawnTimeDisplay.textContent && respawnTimeDisplay.textContent.includes('復活:')) {
            // 計時器已停止，但仍有復活時間顯示，嘗試從顯示時間計算復活時間
            const parsedTime = parseRespawnTimeDisplay(respawnTimeDisplay.textContent);
            if (parsedTime) {
                record.timerState.respawnTime = parsedTime.toISOString();
            }
        }
        
        data.records.push(record);
    });
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timer-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('匯入資料將覆蓋現有資料，確定要繼續嗎？')) {
                // 清空現有表格
                const tableBody = document.getElementById('tableBody');
                tableBody.innerHTML = '';
                
                // 停止所有計時器
                Object.keys(timers).forEach(id => {
                    clearInterval(timers[id]);
                });
                timers = {};
                
                // 載入地圖資訊（合併預設地圖和匯入的地圖）
                if (data.mapInfos) {
                    // 合併預設地圖和匯入的地圖，匯入的地圖優先
                    mapInfos = { ...mapInfos, ...data.mapInfos };
                }
                
                // 確保 nextMapId 不會與現有地圖衝突
                const maxExistingId = Math.max(...Object.keys(mapInfos).map(id => parseInt(id)));
                if (nextMapId <= maxExistingId) {
                    nextMapId = maxExistingId + 1;
                }
                
                // 重建表格
                if (data.records && data.records.length > 0) {
                    let maxId = 0;
                    data.records.forEach(record => {
                        const row = document.createElement('tr');
                        row.className = 'data-row';
                        row.setAttribute('data-id', record.id);
                        
                        // 按照地圖等級排序生成選項
                        const sortedMaps = Object.values(mapInfos).sort((a, b) => a.level - b.level);
                        const mapOptions = sortedMaps.map(map => 
                            `<option value="${map.id}" ${record.mapId == map.id ? 'selected' : ''}>${map.name} (Lv.${map.level}) - ${map.boss} [${map.chapterKing}]</option>`
                        ).join('');
                        
                        row.innerHTML = `
                            <td class="row-number">${record.id}</td>
                            <td class="map-info">
                                <select class="map-select" onchange="updateMapInfo(${record.id}, this.value)">
                                    ${mapOptions}
                                </select>
                            </td>
                            <td class="map-branch">
                                <input type="number" value="${record.mapBranch}" class="editable-input">
                            </td>
                            <td class="respawn-duration">
                                <div class="duration-controls">
                                    <div class="time-input-section">
                                        <input type="text" class="time-input" placeholder="" maxlength="4" pattern="-?[0-9]{1,3}" oninput="formatTimeInput(this)" value="${record.timerState ? record.timerState.timeInput || '' : ''}">
                                        <span class="time-hint">時分</span>
                                    </div>
                                    <div class="timer-controls">
                                        <button class="timer-btn start" onclick="startTimer(${record.id})" ${record.timerState && record.timerState.isRunning ? 'disabled' : ''}>開始</button>
                                        <button class="timer-btn full" onclick="setFullStatus(${record.id})">已滿</button>
                                        <button class="timer-btn reset" onclick="resetTimer(${record.id})" ${record.timerState && record.timerState.isRunning ? '' : 'disabled'}>重設</button>
                                    </div>
                                </div>
                            </td>
                            <td class="respawn-status">
                                <div class="status-display">
                                    <span class="time-text">${record.timerState ? record.timerState.timeText || '尚未設定' : '尚未設定'}</span>
                                </div>
                            </td>
                            <td class="respawn-time">
                                <div class="time-display">
                                    <span class="respawn-time-display">${record.timerState ? record.timerState.respawnTimeDisplay || '' : ''}</span>
                                </div>
                            </td>
                            <td class="actions">
                                <button class="action-btn copy" onclick="copyRecordInfo(${record.id})">複製</button>
                                <button class="action-btn delete" onclick="deleteRecord(${record.id})">刪除</button>
                            </td>
                        `;
                        
                        tableBody.appendChild(row);
                        maxId = Math.max(maxId, parseInt(record.id));
                        
                        // 恢復計時器狀態
                        if (record.timerState && record.timerState.isRunning && (record.timerState.respawnTime || record.timerState.respawnTimeDisplay)) {
                            // 延遲執行，確保DOM元素已經渲染
                            setTimeout(() => {
                                restoreTimer(record.id, record.timerState);
                            }, 100);
                        }
                    });
                    
                    nextId = maxId + 1;
                    updateRowNumbers();
                    updateMapSelects();
                    
                    // 應用當前排序
                    sortTable(currentSortMode);
                    
                    autoSave();
                    
                    alert('資料匯入成功！');
                }
            }
        } catch (error) {
            alert('匯入資料失敗：' + error.message);
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // 清空文件輸入
}
