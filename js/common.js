const API_BASE_URL = 'http://localhost:8000/api';

const cityData = [
    '北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '重庆', '西安',
'苏州', '天津', '长沙', '郑州', '沈阳', '青岛', '宁波', '东莞', '佛山', '合肥',
'昆明', '大连', '厦门', '哈尔滨', '长春', '福州', '济南', '温州', '南宁', '石家庄',
'泉州', '贵阳', '南昌', '金华', '常州', '珠海', '惠州', '嘉兴', '南通', '中山',
'保定', '兰州', '台州', '徐州', '太原', '绍兴', '烟台', '海口', '乌鲁木齐', '呼和浩特',
'廊坊', '扬州', '洛阳', '汕头', '潍坊', '盐城', '扬州', '临沂', '泰州', '镇江',
'芜湖', '邯郸', '银川', '临沂', '襄阳', '漳州', '湖州', '赣州', '九江', '许昌',
'岳阳', '淮安', '连云港', '淄博', '柳州', '绵阳', '泸州', '德阳', '宜昌', '邯郸',
'沧州', '邢台', '株洲', '衡阳', '商丘', '济宁', '菏泽', '湛江', '肇庆', '开封',
'三门峡', '平顶山', '南阳', '信阳', '周口', '驻马店', '马鞍山', '芜湖', '安庆',
'滁州', '阜阳', '宿州', '六安', '亳州', '龙岩', '南平', '莆田', '宁德',
'景德镇', '萍乡', '新余', '鹰潭', '滨州', '东营', '威海', '日照', '泰安', '莱芜',
'德州', '聊城', '滨州', '大同', '阳泉', '长治', '晋城', '朔州', '晋中', '运城',
'忻州', '临汾', '吕梁', '通辽', '赤峰', '鄂尔多斯', '呼伦贝尔', '巴彦淖尔', '乌海',
'四平', '辽源', '通化', '白山', '松原', '白城', '齐齐哈尔', '鸡西', '鹤岗',
'双鸭山', '大庆', '伊春', '佳木斯', '七台河', '牡丹江', '黑河', '绥化', '无锡',
'徐州', '常州', '苏州', '南通', '连云港', '淮安', '盐城', '扬州', '镇江', '泰州',
'宿迁', '衢州', '舟山', '台州', '丽水', '马鞍山', '芜湖', '安庆', '黄山', '滁州',
'阜阳', '宿州', '六安', '亳州', '池州', '宣城', '莆田', '三明', '泉州', '漳州',
'龙岩', '宁德', '景德镇', '萍乡', '九江', '新余', '鹰潭', '赣州', '吉安', '宜春',
'抚州', '上饶', '淄博', '枣庄', '东营', '烟台', '潍坊', '济宁', '泰安', '威海',
'日照', '临沂', '德州', '聊城', '滨州', '菏泽', '焦作', '鹤壁', '新乡', '安阳',
'濮阳', '许昌', '漯河', '三门峡', '南阳', '商丘', '信阳', '周口', '驻马店', '武汉',
'黄石', '十堰', '宜昌', '襄阳', '鄂州', '荆门', '孝感', '荆州', '黄冈', '咸宁',
'随州', '株洲', '湘潭', '衡阳', '邵阳', '岳阳', '常德', '张家界', '益阳', '郴州',
'永州', '怀化', '娄底', '广州', '韶关', '珠海', '汕头', '佛山', '江门',
'湛江', '茂名', '肇庆', '惠州', '梅州', '汕尾', '河源', '阳江', '清远', '东莞',
'中山', '潮州', '揭阳', '云浮', '南宁', '柳州', '桂林', '梧州', '北海', '防城港',
'钦州', '贵港', '玉林', '百色', '贺州', '河池', '来宾', '崇左', '海口', '三亚',
'三沙', '儋州', '自贡', '攀枝花', '泸州', '德阳', '绵阳', '广元', '遂宁',
'内江', '乐山', '南充', '眉山', '宜宾', '广安', '达州', '雅安', '巴中', '资阳',
'贵阳', '六盘水', '遵义', '安顺', '毕节', '铜仁', '昆明', '曲靖', '玉溪', '保山',
'昭通', '丽江', '普洱', '临沧', '拉萨', '日喀则', '昌都', '林芝', '山南', '那曲',
'阿里', '铜川', '宝鸡', '咸阳', '渭南', '延安', '汉中', '榆林', '安康',
'商洛', '兰州', '嘉峪关', '金昌', '白银', '天水', '武威', '张掖', '平凉', '酒泉',
'庆阳', '定西', '陇南', '西宁', '海东', '银川', '石嘴山', '吴忠', '固原', '中卫',
'乌鲁木齐', '克拉玛依', '吐鲁番', '哈密', '昌吉', '博尔塔拉', '巴音郭楞', '阿克苏',
'克孜勒苏', '喀什', '和田', '伊犁', '塔城', '阿勒泰'
];

let appDialogRoot = null;
let appDialogResolve = null;
let appDialogType = 'alert';

function ensureAppDialogRoot() {
    if (appDialogRoot) return appDialogRoot;

    appDialogRoot = document.createElement('div');
    appDialogRoot.id = 'appDialogRoot';
    appDialogRoot.className = 'app-dialog';
    appDialogRoot.innerHTML = `
        <div class="app-dialog__mask"></div>
        <div class="app-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="appDialogTitle">
            <h3 class="app-dialog__title" id="appDialogTitle">提示</h3>
            <div class="app-dialog__message" id="appDialogMessage"></div>
            <input class="app-dialog__input" id="appDialogInput" type="text">
            <div class="app-dialog__actions">
                <button class="app-dialog__btn app-dialog__btn--ghost" id="appDialogCancel">取消</button>
                <button class="app-dialog__btn" id="appDialogConfirm">确定</button>
            </div>
        </div>
    `;

    document.body.appendChild(appDialogRoot);

    const mask = appDialogRoot.querySelector('.app-dialog__mask');
    const cancelBtn = document.getElementById('appDialogCancel');
    const confirmBtn = document.getElementById('appDialogConfirm');
    const input = document.getElementById('appDialogInput');

    const closeDialog = (value) => {
        if (!appDialogRoot.classList.contains('is-visible')) return;
        appDialogRoot.classList.remove('is-visible');
        document.body.classList.remove('app-dialog-open');
        if (appDialogResolve) {
            appDialogResolve(value);
            appDialogResolve = null;
        }
    };

    if (mask) {
        mask.addEventListener('click', () => {
            if (appDialogType === 'alert') {
                closeDialog(true);
                return;
            }
            closeDialog(false);
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (appDialogType === 'prompt') {
                closeDialog(null);
                return;
            }
            closeDialog(false);
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (appDialogType === 'prompt') {
                closeDialog(input ? input.value : '');
                return;
            }
            closeDialog(true);
        });
    }

    document.addEventListener('keydown', (event) => {
        if (!appDialogRoot.classList.contains('is-visible')) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            if (appDialogType === 'alert') {
                closeDialog(true);
                return;
            }
            if (appDialogType === 'prompt') {
                closeDialog(null);
                return;
            }
            closeDialog(false);
        }
        if (event.key === 'Enter') {
            const activeElement = document.activeElement;
            if (appDialogType === 'prompt' && activeElement === input) {
                event.preventDefault();
                closeDialog(input ? input.value : '');
            } else if (appDialogType !== 'prompt') {
                event.preventDefault();
                closeDialog(true);
            }
        }
    });

    return appDialogRoot;
}

function showAppDialog(type, message, options = {}) {
    const dialog = ensureAppDialogRoot();
    const title = document.getElementById('appDialogTitle');
    const content = document.getElementById('appDialogMessage');
    const input = document.getElementById('appDialogInput');
    const cancelBtn = document.getElementById('appDialogCancel');
    const confirmBtn = document.getElementById('appDialogConfirm');

    appDialogType = type;
    title.textContent = options.title || (type === 'confirm' ? '请确认' : type === 'prompt' ? '请输入' : '提示');
    content.textContent = String(message ?? '');

    confirmBtn.textContent = options.confirmText || '确定';
    cancelBtn.textContent = options.cancelText || '取消';

    if (type === 'alert') {
        cancelBtn.style.display = 'none';
        input.style.display = 'none';
        input.value = '';
    } else if (type === 'confirm') {
        cancelBtn.style.display = 'inline-flex';
        input.style.display = 'none';
        input.value = '';
    } else {
        cancelBtn.style.display = 'inline-flex';
        input.style.display = 'block';
        input.value = options.defaultValue ?? '';
    }

    dialog.classList.add('is-visible');
    document.body.classList.add('app-dialog-open');

    return new Promise((resolve) => {
        appDialogResolve = resolve;
        setTimeout(() => {
            if (type === 'prompt') {
                input.focus();
                input.select();
                return;
            }
            confirmBtn.focus();
        }, 0);
    });
}

async function showAlertDialog(message, options = {}) {
    await showAppDialog('alert', message, options);
}

async function showConfirmDialog(message, options = {}) {
    return showAppDialog('confirm', message, options);
}

async function showPromptDialog(message, defaultValue = '', options = {}) {
    return showAppDialog('prompt', message, {
        ...options,
        defaultValue
    });
}

window.showAlertDialog = showAlertDialog;
window.showConfirmDialog = showConfirmDialog;
window.showPromptDialog = showPromptDialog;

window.onload = function() {
    initAllCityAutocompletes();
    initAllSelectDropdowns();
};

function choose(el) {
    el.parentElement.querySelectorAll('.option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
}

function toggleMultiSelect(el) {
    el.classList.toggle('active');
}

function initCityAutocomplete(containerId, inputId, listId) {
    const container = document.getElementById(containerId);
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);
    
    if (!container || !input || !list) return;
    
    function handleInput() {
        const inputValue = input.value.trim();
        list.innerHTML = '';
        
        if (!inputValue) {
            list.style.display = 'none';
            return;
        }
        
        const matchCities = cityData.filter(city => 
            city.toLowerCase().includes(inputValue.toLowerCase())
        );
        
        if (matchCities.length === 0) {
            list.innerHTML = '<li class="autocomplete-empty">暂无匹配结果</li>';
            list.style.display = 'block';
            return;
        }
        
        matchCities.forEach(city => {
            const li = document.createElement('li');
            li.className = 'autocomplete-item';
            li.textContent = city;
            li.addEventListener('click', () => {
                input.value = city;
                list.style.display = 'none';
            });
            list.appendChild(li);
        });
        
        list.style.display = 'block';
    }
    
    input.addEventListener('input', handleInput);
    
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            list.style.display = 'none';
        }
    });
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && list.style.display === 'block') {
            const firstItem = list.querySelector('.autocomplete-item');
            if (firstItem) {
                input.value = firstItem.textContent;
                list.style.display = 'none';
            }
        }
    });
    
    input.addEventListener('blur', () => {
        setTimeout(() => {
            const value = input.value.trim();
            if (!cityData.includes(value)) {
                input.value = '';
            }
            list.style.display = 'none';
        }, 200);
    });
}

function initAllCityAutocompletes() {
    initCityAutocomplete('startAutocomplete', 'startPoint', 'startPointList');
    initCityAutocomplete('endAutocomplete', 'endPoint', 'endPointList');
}

function initSelectDropdown(containerId, inputId, listId) {
    const container = document.getElementById(containerId);
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);

    if (!container || !input || !list) return;

    input.addEventListener('click', () => {
        const isVisible = list.style.display === 'block';
        document.querySelectorAll('.autocomplete-list').forEach(l => {
            if (l !== list) l.style.display = 'none';
        });
        list.style.display = isVisible ? 'none' : 'block';
    });

    list.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
            input.value = item.textContent;
            list.style.display = 'none';
            
            if (inputId === 'travelMode' && item.textContent === '个人') {
                const peopleInput = document.getElementById('peopleNum');
                if (peopleInput) {
                    peopleInput.value = 1;
                }
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            list.style.display = 'none';
        }
    });
}

function initAllSelectDropdowns() {
    initSelectDropdown('modeAutocomplete', 'travelMode', 'travelModeList');
}

async function editUser() {
    await showAlertDialog('查看用户信息');
}
async function editProfile() {
    await showAlertDialog('编辑个人资料');
}
async function logout() {
    const confirmed = await showConfirmDialog('确定退出？');
    if (confirmed) {
        await showAlertDialog('已退出');
        window.location.href = '/';
    }
}

function openFormPopup() {
    const formPopup = document.getElementById('formPopup');
    const popupMask = document.getElementById('popupMask');
    if (formPopup && popupMask) {
        formPopup.style.display = 'block';
        popupMask.style.display = 'block';
        
        // 触发重绘以应用动画
        requestAnimationFrame(() => {
            formPopup.classList.add('show');
            popupMask.classList.add('show');
        });
    }
}
function closeFormPopup() {
    const formPopup = document.getElementById('formPopup');
    const popupMask = document.getElementById('popupMask');
    if (formPopup && popupMask) {
        formPopup.classList.remove('show');
        popupMask.classList.remove('show');
        
        // 等待动画结束后隐藏
        setTimeout(() => {
            formPopup.style.display = 'none';
            popupMask.style.display = 'none';
        }, 300); // 与 CSS transition 时间一致
    }
}

let bulkManageMode = false;
let selectedRecordIds = new Set();

function getTravelRecords() {
    const recordsStr = localStorage.getItem('travelRecords');
    return recordsStr ? JSON.parse(recordsStr) : [];
}

function syncSelectedRecordIds(records) {
    const idSet = new Set(records.map(record => record.id));
    selectedRecordIds.forEach(id => {
        if (!idSet.has(id)) {
            selectedRecordIds.delete(id);
        }
    });
}

function updateBulkToolbar(records) {
    const toggleBulkBtn = document.getElementById('toggleBulkBtn');
    const bulkActions = document.getElementById('bulkActions');
    const bulkSelectedCount = document.getElementById('bulkSelectedCount');
    const bulkSelectAllBtn = document.getElementById('bulkSelectAllBtn');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');

    if (!toggleBulkBtn || !bulkActions || !bulkSelectedCount || !bulkSelectAllBtn || !bulkDeleteBtn) {
        return;
    }

    const hasRecords = records.length > 0;
    toggleBulkBtn.disabled = !hasRecords;

    if (!hasRecords) {
        bulkManageMode = false;
        selectedRecordIds.clear();
    }

    syncSelectedRecordIds(records);
    const selectedCount = records.filter(record => selectedRecordIds.has(record.id)).length;
    const allSelected = hasRecords && selectedCount === records.length;

    toggleBulkBtn.textContent = bulkManageMode ? '取消批量' : '批量管理';
    toggleBulkBtn.classList.toggle('is-active', bulkManageMode);
    bulkActions.style.display = bulkManageMode && hasRecords ? 'flex' : 'none';
    bulkSelectedCount.textContent = `已选 ${selectedCount} 项`;
    bulkSelectAllBtn.textContent = allSelected ? '取消全选' : '全选';
    bulkDeleteBtn.disabled = selectedCount === 0;
}

function toggleBulkMode() {
    const records = getTravelRecords();
    if (!records.length) return;
    bulkManageMode = !bulkManageMode;
    selectedRecordIds.clear();
    renderTravelRecords();
}

function toggleRecordSelect(id, checked) {
    if (checked) {
        selectedRecordIds.add(id);
    } else {
        selectedRecordIds.delete(id);
    }
    updateBulkToolbar(getTravelRecords());
}

function toggleSelectAllRecords() {
    const records = getTravelRecords();
    if (!records.length || !bulkManageMode) return;
    const allSelected = records.every(record => selectedRecordIds.has(record.id));
    if (allSelected) {
        selectedRecordIds.clear();
    } else {
        selectedRecordIds = new Set(records.map(record => record.id));
    }
    renderTravelRecords();
}

async function deletePlanFromServer(planId) {
    const response = await fetch(`${API_BASE_URL}/plan/${planId}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        throw new Error(`删除失败: ${response.status}`);
    }
}

async function deleteSelectedRecords() {
    const records = getTravelRecords();
    const recordsToDelete = records.filter(record => selectedRecordIds.has(record.id));
    if (!recordsToDelete.length) {
        await showAlertDialog('请先选择要删除的卡片');
        return;
    }

    const confirmed = await showConfirmDialog(`确定删除已选中的 ${recordsToDelete.length} 条计划吗？`);
    if (!confirmed) return;

    const serverPlanIds = recordsToDelete
        .map(record => record.dbPlanId)
        .filter(planId => Number.isFinite(planId));

    const deleteResults = await Promise.allSettled(
        serverPlanIds.map(planId => deletePlanFromServer(planId))
    );
    const failedDeletes = deleteResults.filter(result => result.status === 'rejected').length;

    let updatedRecords = records.filter(record => !selectedRecordIds.has(record.id));
    const hadFocusedDeleted = recordsToDelete.some(record => record.focused);
    if (hadFocusedDeleted && updatedRecords.length > 0 && !updatedRecords.some(record => record.focused)) {
        updatedRecords = updatedRecords.map((record, index) => ({
            ...record,
            focused: index === updatedRecords.length - 1
        }));
    }

    const activeTripId = localStorage.getItem('activeTripId');
    const activeIdDeleted = activeTripId && recordsToDelete.some(record => String(record.id) === activeTripId);
    if (activeIdDeleted) {
        const nextFocused = updatedRecords.find(record => record.focused);
        if (nextFocused) {
            localStorage.setItem('activeTripId', String(nextFocused.id));
        } else {
            localStorage.removeItem('activeTripId');
        }
    }

    localStorage.setItem('travelRecords', JSON.stringify(updatedRecords));
    bulkManageMode = false;
    selectedRecordIds.clear();
    renderTravelRecords();

    if (failedDeletes > 0) {
        await showAlertDialog(`已删除卡片，但有 ${failedDeletes} 条后端记录同步删除失败`);
        return;
    }
    await showAlertDialog('所选卡片已删除');
}

function renderTravelRecords() {
    const travelInfo = document.getElementById('travelInfo');
    if (!travelInfo) return;

    const records = getTravelRecords();
    updateBulkToolbar(records);

    if (records.length === 0) {
        travelInfo.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 2rem;">暂无出行计划，点击右下角添加</p>';
        return;
    }

    let html = '';
    for (let i = records.length - 1; i >= 0; i--) {
        const record = records[i];
        const isFocused = record.focused || false;
        const planGenerated = record.planGenerated === true;
        const tripCompleted = record.tripCompleted === true;
        const edited = record.edited === true;
        const selected = selectedRecordIds.has(record.id);
        html += `
            <div class="card ${isFocused ? 'card--focused' : ''}" data-id="${record.id}">
                <div class="card__hero">
                    <div class="card__hero-header">
                        <div class="card__hero-meta">
                            ${bulkManageMode ? `
                                <label class="card__bulk-check">
                                    <input type="checkbox" ${selected ? 'checked' : ''} onchange="toggleRecordSelect(${record.id}, this.checked)">
                                    <span>选择</span>
                                </label>
                            ` : ''}
                            <span>出行计划记录</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span>${record.mode}</span>
                            <label class="card__focus-label" title="标记为当前关注行程">
                                <input type="checkbox" class="card__focus-checkbox" 
                                    ${isFocused ? 'checked' : ''} 
                                    onchange="toggleFocus(${record.id})">
                                <div class="card__focus-visual"></div>
                            </label>
                        </div>
                    </div>
                    <div class="card__job-title">${record.start} - ${record.end}</div>
                    <div class="card__status-list">
                        <div class="card__status-item">
                            <span class="card__status-label">行程规划</span>
                            <span class="card__status-value ${planGenerated ? 'is-done' : 'is-loading'}">
                                ${planGenerated ? '已完成' : '生成中'}
                                ${planGenerated ? '' : '<span class="card__status-spinner"></span>'}
                            </span>
                        </div>
                        <div class="card__status-item">
                            <span class="card__status-label">行程完成</span>
                            <span class="card__status-value ${tripCompleted ? 'is-done' : ''}">${tripCompleted ? '已完成' : '未完成'}</span>
                        </div>
                        <div class="card__status-item">
                            <span class="card__status-label">内容编辑</span>
                            <span class="card__status-value ${edited ? 'is-done' : ''}">${edited ? '已被编辑' : '未编辑'}</span>
                        </div>
                    </div>
                </div>
                <div class="card__footer">
                    <div class="card__job-summary">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"></path></svg>
                        <span>${record.days}天</span>
                    </div>
                    <div class="card__job-summary">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"></path></svg>
                        <span>${record.people}人</span>
                    </div>
                    <div class="card__job-summary">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"></path></svg>
                        <span>${record.bud}</span>
                    </div>
                    <div class="card__job-summary">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                        <span>${record.prefer}</span>
                    </div>
                </div>
                <button class="card__btn" onclick="openTripDetail(${record.id})">查看详情</button>
            </div>
        `;
    }
    travelInfo.innerHTML = html;
    
    const locateBtn = document.getElementById('locateFocusBtn');
    if (locateBtn) {
        const hasFocused = records.some(r => r.focused);
        locateBtn.style.display = hasFocused ? 'flex' : 'none';
    }
}

async function openTripDetail(id) {
    const recordsStr = localStorage.getItem('travelRecords');
    if (!recordsStr) {
        await showAlertDialog('暂无行程数据');
        return;
    }
    
    const records = JSON.parse(recordsStr);
    const record = records.find(r => r.id === id);
    
    if (!record) {
        await showAlertDialog('找不到该行程记录');
        return;
    }
    
    if (!record.planGenerated) {
        await showAlertDialog('行程规划尚未生成完成，请稍后再试');
        return;
    }
    
    localStorage.setItem('activeTripId', String(id));
    window.location.href = '/trip';
}

function scrollToFocused() {
    const focusedCard = document.querySelector('.card--focused');
    if (focusedCard) {
        const offset = 80;
        const top = focusedCard.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}

function toggleFocus(id) {
    const recordsStr = localStorage.getItem('travelRecords');
    if (!recordsStr) return;
    
    let records = JSON.parse(recordsStr);
    
    const targetRecord = records.find(r => r.id === id);
    if (!targetRecord) return;
    
    const newStatus = !targetRecord.focused;
    
    records = records.map(record => {
        if (record.id === id) {
            return { ...record, focused: newStatus };
        } else if (newStatus) {
            return { ...record, focused: false };
        }
        return record;
    });
    
    localStorage.setItem('travelRecords', JSON.stringify(records));
    renderTravelRecords();
}

document.addEventListener('DOMContentLoaded', () => {
    renderTravelRecords();
});

// 当前输入模式
let currentInputMode = 'form';

function switchInputMode(mode) {
    currentInputMode = mode;
    const tabForm = document.getElementById('tabForm');
    const tabNatural = document.getElementById('tabNatural');
    const formInputArea = document.getElementById('formInputArea');
    const naturalInputArea = document.getElementById('naturalInputArea');

    if (mode === 'form') {
        tabForm.classList.add('active');
        tabForm.style.color = 'var(--primary)';
        tabForm.style.fontWeight = 'bold';

        tabNatural.classList.remove('active');
        tabNatural.style.color = 'var(--text-secondary)';
        tabNatural.style.fontWeight = 'normal';

        naturalInputArea.style.display = 'none';
        formInputArea.style.display = 'block';
    } else {
        tabNatural.classList.add('active');
        tabNatural.style.color = 'var(--primary)';
        tabNatural.style.fontWeight = 'bold';

        tabForm.classList.remove('active');
        tabForm.style.color = 'var(--text-secondary)';
        tabForm.style.fontWeight = 'normal';

        formInputArea.style.display = 'none';
        naturalInputArea.style.display = 'block';
    }
}

async function callDeepSeekAPI(startCity, targetCity, days, people, budgetValue, mode, preferences, naturalQuery = null) {
    try {
        const bodyData = naturalQuery 
            ? { natural_query: naturalQuery }
            : {
                start_city: startCity,
                target_city: targetCity,
                days: parseInt(days),
                people: parseInt(people) || 1,
                budget: budget ? parseFloat(budget) : null,
                mode: mode,
                preferences: preferences
            };

        const response = await fetch(`${API_BASE_URL}/plan/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData)
        });
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('调用API失败:', error);
        throw error;
    }
}

async function submitTravelForm() {
    let start, end, days, people, bud, budgetValue, mode, prefer, preferences, naturalQuery;

    if (currentInputMode === 'form') {
        start = document.getElementById('startPoint')?.value.trim() || '';
        end = document.getElementById('endPoint')?.value.trim() || '';
        days = document.getElementById('travelDays')?.value.trim() || '';
        people = document.getElementById('peopleNum')?.value.trim() || '1';
        bud = document.getElementById('budget')?.value.trim() ? document.getElementById('budget').value + '元' : '未填写';
        budgetValue = document.getElementById('budget')?.value.trim() || null;
        mode = document.getElementById('travelMode')?.value.trim() || '未选择';
        const preferElements = document.querySelectorAll('#travelPrefer .option.active');
        prefer = preferElements.length > 0 ? Array.from(preferElements).map(el => el.textContent).join('、') : '未选择';
        preferences = preferElements.length > 0 ? Array.from(preferElements).map(el => el.textContent) : null;
        
        if (!start || !end || !days) {
            await showAlertDialog('请填写必填项（起始点、目的地、出行天数）');
            return;
        }
    } else {
        naturalQuery = document.getElementById('naturalInputText')?.value.trim() || '';
        if (!naturalQuery) {
            await showAlertDialog('请描述您的出行计划');
            return;
        }
        // 对于自然语言，在前端我们先给些占位符，后端会解析出真实的。
        start = 'AI智能解析';
        end = 'AI智能解析';
        days = 'AI';
        people = 'AI';
        bud = 'AI智能解析';
        prefer = 'AI智能解析';
        mode = 'AI智能解析';
    }

    const travelInfo = document.getElementById('travelInfo');

    if (currentInputMode === 'form') {
        if (!start || !cityData.includes(start)) {
            await showAlertDialog('请从列表中选择有效的出发城市！');
            return;
        }
        if (!end || !cityData.includes(end)) {
            await showAlertDialog('请从列表中选择有效的目的城市！');
            return;
        }
        if (!days) {
            await showAlertDialog('请填写出行天数！');
            return;
        }
    }

    const newRecord = {
        id: Date.now(),
        start,
        end,
        days,
        people,
        bud,
        mode,
        prefer,
        createdAt: new Date().toISOString(),
        focused: true,
        planGenerated: false,
        tripCompleted: false,
        edited: false,
        itinerary: null
    };

    const recordsStr = localStorage.getItem('travelRecords');
    let records = recordsStr ? JSON.parse(recordsStr) : [];
    
    if (newRecord.focused) {
        records = records.map(r => ({ ...r, focused: false }));
    }
    
    records.push(newRecord);
    localStorage.setItem('travelRecords', JSON.stringify(records));

    renderTravelRecords();
    closeFormPopup();

    if(document.getElementById('startPoint')) document.getElementById('startPoint').value = '';
    if(document.getElementById('endPoint')) document.getElementById('endPoint').value = '';
    if(document.getElementById('travelDays')) document.getElementById('travelDays').value = '';
    if(document.getElementById('peopleNum')) document.getElementById('peopleNum').value = '';
    if(document.getElementById('budget')) document.getElementById('budget').value = '';
    document.querySelectorAll('.option.active').forEach(el => el.classList.remove('active'));

    try {
        const result = await callDeepSeekAPI(start, end, days, people, budgetValue, mode, preferences, naturalQuery);
        
        const updatedRecordsStr = localStorage.getItem('travelRecords');
        let updatedRecords = updatedRecordsStr ? JSON.parse(updatedRecordsStr) : [];
        
        const recordIndex = updatedRecords.findIndex(r => r.id === newRecord.id);
        if (recordIndex !== -1) {
            // 用后端返回的数据覆盖占位符
            if (currentInputMode === 'natural') {
                updatedRecords[recordIndex].start = result.start_city || start;
                updatedRecords[recordIndex].end = result.target_city || end;
                updatedRecords[recordIndex].days = result.days || days;
                updatedRecords[recordIndex].people = result.people || people;
                updatedRecords[recordIndex].bud = result.budget ? result.budget + '元' : bud;
                updatedRecords[recordIndex].mode = result.mode || mode;
                updatedRecords[recordIndex].prefer = result.preferences ? result.preferences.join('、') : prefer;
            }

            updatedRecords[recordIndex].planGenerated = true;
            updatedRecords[recordIndex].itinerary = result.itinerary;
            updatedRecords[recordIndex].dbPlanId = result.plan_id;
            localStorage.setItem('travelRecords', JSON.stringify(updatedRecords));
            renderTravelRecords();
            await showAlertDialog('行程规划已生成完成！');
        }
    } catch (error) {
        const updatedRecordsStr = localStorage.getItem('travelRecords');
        let updatedRecords = updatedRecordsStr ? JSON.parse(updatedRecordsStr) : [];
        
        const recordIndex = updatedRecords.findIndex(r => r.id === newRecord.id);
        if (recordIndex !== -1) {
            updatedRecords[recordIndex].planGenerated = false;
            localStorage.setItem('travelRecords', JSON.stringify(updatedRecords));
            renderTravelRecords();
        }
        await showAlertDialog('行程生成失败，请检查后端服务是否启动：' + error.message);
    }
}

async function showHelp() {
    await showAlertDialog('点击右下角+号，填写信息后提交即可生成出行计划');
}

window.toggleBulkMode = toggleBulkMode;
window.toggleRecordSelect = toggleRecordSelect;
window.toggleSelectAllRecords = toggleSelectAllRecords;
window.deleteSelectedRecords = deleteSelectedRecords;

window.getFocusedTrip = function() {
    const recordsStr = localStorage.getItem('travelRecords');
    if (!recordsStr) return null;
    
    const records = JSON.parse(recordsStr);
    return records.find(r => r.focused) || null;
};

window.getTripById = function(id) {
    const recordsStr = localStorage.getItem('travelRecords');
    if (!recordsStr) return null;
    
    const records = JSON.parse(recordsStr);
    return records.find(r => r.id === id) || null;
};
