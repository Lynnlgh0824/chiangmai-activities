// =====================================================
// 管理后台 JavaScript
// 从 admin.html 内联脚本提取
// =====================================================

const API_BASE = '/api';
let items = [];

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
});

// 加载数据
async function loadItems() {
    try {
        const response = await fetch(`${API_BASE}/items`);
        const result = await response.json();
        items = result.data || [];
        renderTable();
    } catch (error) {
        console.error('加载失败:', error);
        document.getElementById('tableBody').innerHTML = '<tr><td colspan="12" style="text-align: center; color: #999;">加载失败</td></tr>';
    }
}

// 渲染表格
function renderTable() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    let filteredItems = items;

    if (categoryFilter) {
        filteredItems = filteredItems.filter(item => item.category === categoryFilter);
    }

    if (statusFilter) {
        filteredItems = filteredItems.filter(item => item.status === statusFilter);
    }

    if (filteredItems.length === 0) {
        document.getElementById('tableBody').innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 40px; color: #999;">暂无数据</td></tr>';
        return;
    }

    document.getElementById('tableBody').innerHTML = filteredItems.map((item, index) => {
        let activityNumber = item.activityNumber || item['活动编号'] || '-';
        // 去掉#号，只显示数字
        activityNumber = activityNumber.replace('#', '');

        // 显示日期或星期
        let dateDisplay = '-';
        if (item.weekdays && Array.isArray(item.weekdays) && item.weekdays.length > 0) {
            const displayWeekdays = item.weekdays.slice(0, 4);
            dateDisplay = displayWeekdays.join(', ');
            if (item.weekdays.length > 4) {
                dateDisplay += ' 等' + item.weekdays.length + '天';
            }
        } else if (item.date) {
            dateDisplay = item.date;
        }

        // 显示来源链接
        let sourceLink = '-';
        if (item.source && item.source.url) {
            sourceLink = `<a href="${item.source.url}" target="_blank" style="color: #667eea; text-decoration: none;" title="${item.source.url}">🔗</a>`;
        }

        // 显示最后更新时间
        let updatedAtDisplay = '-';
        if (item.updatedAt) {
            try {
                const date = new Date(item.updatedAt);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                updatedAtDisplay = `${year}-${month}-${day}<br><small style="color: #999;">${hours}:${minutes}</small>`;
            } catch (e) {
                updatedAtDisplay = '-';
            }
        }

        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${activityNumber}</strong></td>
                <td><strong>${escapeHtml(item.title)}</strong></td>
                <td>${item.category}</td>
                <td style="font-size: 12px; line-height: 1.4;">${dateDisplay}</td>
                <td>${item.time || '-'}</td>
                <td>${escapeHtml(item.location || '-').substring(0, 15)}</td>
                <td>${item.price || '-'}</td>
                <td style="text-align: center;">${sourceLink}</td>
                <td><span class="status-badge status-${item.status}">${getStatusText(item.status)}</span></td>
                <td style="font-size: 12px; line-height: 1.4;">${updatedAtDisplay}</td>
                <td>
                    <button class="btn btn-primary" onclick="editItem('${item.id}')" style="padding: 6px 12px; font-size: 12px;">编辑</button>
                    <button class="btn btn-danger" onclick="deleteItem('${item.id}')" style="padding: 6px 12px; font-size: 12px;">删除</button>
                </td>
            </tr>
        `;
    }).join('');
}

// 切换 Tab
function switchTab(tabType) {
    document.querySelectorAll('.tab-button').forEach((btn, index) => {
        btn.classList.remove('active');
        if ((tabType === 'fixed' && index === 0) || (tabType === 'temporary' && index === 1)) {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabType + 'Tab').classList.add('active');
}

// ========== 图片相关函数 ==========

function displayImagePreview(imageUrl, index) {
    const previewsContainer = document.getElementById('imagePreviews');

    const previewDiv = document.createElement('div');
    previewDiv.className = 'image-preview';
    previewDiv.dataset.index = index;
    previewDiv.dataset.url = imageUrl;

    previewDiv.innerHTML = `
        <img src="${imageUrl}" alt="预览图片" loading="lazy">
        <div class="image-overlay">
            <button class="delete-image-btn" onclick="deleteImage(${index})" title="删除图片">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
            </button>
        </div>
        <div class="image-order">${index + 1}</div>
    `;

    previewsContainer.appendChild(previewDiv);
}

async function deleteImage(index) {
    const previewDiv = document.querySelector(`.image-preview[data-index="${index}"]`);
    if (!previewDiv) return;

    const imageUrl = previewDiv.dataset.url;

    if (imageUrl.startsWith('/uploads/')) {
        const filename = imageUrl.split('/').pop();
        try {
            await fetch(`/api/upload/${filename}`, { method: 'DELETE' });
        } catch (error) {
            console.error('删除服务器文件失败:', error);
        }
    }

    uploadedImages = uploadedImages.filter((url, i) => i !== index);
    previewDiv.remove();
    updateImageIndexes();
    updateImagesTextarea();
}

function updateImageIndexes() {
    const previews = document.querySelectorAll('.image-preview');
    previews.forEach((preview, newIndex) => {
        preview.dataset.index = newIndex;
        const orderBadge = preview.querySelector('.image-order');
        if (orderBadge) {
            orderBadge.textContent = newIndex + 1;
        }
        const deleteBtn = preview.querySelector('.delete-image-btn');
        if (deleteBtn) {
            deleteBtn.onclick = () => deleteImage(newIndex);
        }
    });
}

function updateImagesTextarea() {
    const textarea = document.getElementById('imageUrls');
    const imagesTextarea = document.getElementById('images');

    if (!textarea) return;

    const manualUrls = textarea.value.split('\n').filter(url => url.trim());
    const allUrls = [...uploadedImages, ...manualUrls];

    if (imagesTextarea) {
        imagesTextarea.value = allUrls.join('\n');
    }
}

// ========== 表单操作函数 ==========

function safeSetValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.value = value;
        return true;
    } else {
        console.warn(`元素不存在: ${elementId}`);
        return false;
    }
}

function safeSetText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
        return true;
    } else {
        console.warn(`元素不存在: ${elementId}`);
        return false;
    }
}

function safeChecked(elementId, checked) {
    const element = document.getElementById(elementId);
    if (element) {
        element.checked = checked;
        return true;
    } else {
        console.warn(`元素不存在: ${elementId}`);
        return false;
    }
}

function openFormModal(item = null) {
    try {
        const form = document.getElementById('dataForm');
        if (!form) {
            alert('错误：找不到表单');
            return;
        }

        form.reset();
        safeSetValue('itemId', '');
        safeSetValue('activityNumber', '');
        safeSetText('modalTitle', '新增活动');

        uploadedImages = [];
        const imagePreviews = document.getElementById('imagePreviews');
        if (imagePreviews) imagePreviews.innerHTML = '';

        safeSetValue('imageUrls', '');
        safeSetValue('images', '');

        switchTabWithoutEvent('temporary');

        // 新增活动时默认状态为"草稿"
        safeSetValue('status', '草稿');

        if (item) {
            const activityNumber = (item.activityNumber || item['活动编号'] || '').replace('#', '');
            safeSetText('modalTitle', '编辑活动');
            safeSetValue('activityNumber', activityNumber || '-');
            safeSetValue('itemId', item.id || item._id);
            safeSetValue('title', item.title || '');
            safeSetValue('category', item.category || '其他');
            safeSetValue('status', item.status || '草稿');
            safeSetValue('description', item.description || '');

            if (item.weekdays && item.weekdays.length > 0) {
                switchTabWithoutEvent('fixed');

                const weekdayMap = {
                    '周一': 1, '周二': 2, '周三': 3, '周四': 4,
                    '周五': 5, '周六': 6, '周日': 0,
                    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '0': 0
                };

                const weekdayNumbers = item.weekdays.map(w => w in weekdayMap ? weekdayMap[w] : parseInt(w));

                document.querySelectorAll('.weekday-checkbox').forEach(checkbox => {
                    const checkboxValue = parseInt(checkbox.value);
                    checkbox.checked = weekdayNumbers.includes(checkboxValue);
                });
                safeSetValue('fixedTime', item.time || '');
                safeSetValue('duration', item.duration || '');
            } else {
                switchTabWithoutEvent('temporary');
                safeSetValue('date', item.date || '');
                safeSetValue('time', item.time || '');
                safeSetValue('tempDuration', item.duration || '');
            }

            safeSetValue('location', item.location || '');
            safeSetValue('address', item.address || '');
            safeSetValue('price', item.price || '');
            safeSetValue('priceMin', item.priceMin || '');
            safeSetValue('priceMax', item.priceMax || '');
            safeSetValue('maxParticipants', item.maxParticipants || '');
            safeChecked('flexibleTime', item.flexibleTime === '是' || item.flexibleTime === true);

            const requireBooking = item.requireBooking;
            safeChecked('requireBooking',
                requireBooking === true ||
                requireBooking === '是' ||
                requireBooking === undefined
            );

            const images = item.images || [];
            const imagesValue = images.join('\n');
            safeSetValue('images', imagesValue);
            safeSetValue('imageUrls', imagesValue);

            uploadedImages = [];
            if (imagePreviews) imagePreviews.innerHTML = '';

            images.forEach((imageUrl, index) => {
                uploadedImages.push(imageUrl);
                displayImagePreview(imageUrl, index);
            });

            safeSetValue('sourceUrl', item.source?.url || '');
        }

        document.getElementById('formModal').classList.add('active');
    } catch (error) {
        console.error('打开表单失败:', error);
        alert('打开表单失败: ' + error.message);
    }
}

function switchTabWithoutEvent(tabType) {
    document.querySelectorAll('.tab-button').forEach((btn, index) => {
        btn.classList.remove('active');
        if ((tabType === 'fixed' && index === 0) || (tabType === 'temporary' && index === 1)) {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabType + 'Tab').classList.add('active');
}

function closeFormModal() {
    document.getElementById('formModal').classList.remove('active');
}

function editItem(id) {
    const item = items.find(i =>
        String(i.id) === String(id) ||
        String(i._id) === String(id)
    );

    if (item) {
        openFormModal(item);
    } else {
        alert('未找到该项目，ID: ' + id);
    }
}

async function deleteItem(id) {
    if (!confirm('确定要删除这个活动吗？')) return;

    try {
        const response = await fetch(`${API_BASE}/items/${id}`, { method: 'DELETE' });
        const result = await response.json();

        if (result.success) {
            alert('删除成功');
            await loadItems();
        } else {
            alert('删除失败：' + result.message);
        }
    } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败');
    }
}

// 表单提交
document.getElementById('dataForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isSavingDraft) {
        safeSetValue('status', '草稿');
    }

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    isSavingDraft = false;

    const isFixedTab = document.getElementById('fixedTab').classList.contains('active');

    if (isFixedTab) {
        const selectedWeekdays = Array.from(document.querySelectorAll('.weekday-checkbox:checked'))
            .map(cb => parseInt(cb.value));

        if (selectedWeekdays.length === 0) {
            alert('请至少选择一个星期');
            return;
        }

        data.weekdays = selectedWeekdays;
        data.time = document.getElementById('fixedTime').value;
        data.duration = document.getElementById('duration').value;
        data.frequency = 'weekly';
        delete data.date;
    } else {
        data.date = document.getElementById('date').value;
        data.time = document.getElementById('time').value;
        data.duration = document.getElementById('tempDuration').value;
        data.frequency = 'once';
        delete data.weekdays;
    }

    data.flexibleTime = document.getElementById('flexibleTime').checked ? '是' : '否';
    data.requireBooking = document.getElementById('requireBooking').checked ? '是' : '否';
    data.images = document.getElementById('images').value.split('\n').filter(url => url.trim());

    if (data.sourceUrl) {
        data.source = {
            name: '手动添加',
            url: data.sourceUrl,
            type: 'manual',
            lastUpdated: new Date()
        };
    }

    delete data.sourceUrl;
    delete data.fixedTime;
    delete data.tempDuration;

    data.updatedAt = new Date().toISOString();

    try {
        const id = document.getElementById('itemId').value;
        const url = id ? `${API_BASE}/items/${id}` : `${API_BASE}/items`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            const statusText = data.status === '草稿' ? '草稿' : '活动';
            const message = id ? `✅ ${statusText}更新成功` : `✅ ${statusText}创建成功`;

            alert(message);
            closeFormModal();
            await loadItems();
        } else {
            alert('操作失败：' + result.message);
        }
    } catch (error) {
        console.error('保存失败:', error);
        alert('保存失败');
    }
});

// 筛选事件
document.getElementById('categoryFilter').addEventListener('change', renderTable);
document.getElementById('statusFilter').addEventListener('change', renderTable);

// 点击弹窗外部关闭
document.getElementById('formModal').addEventListener('click', (e) => {
    if (e.target.id === 'formModal') {
        closeFormModal();
    }
});

// 工具函数
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 获取状态文本（状态值已统一为中文）
function getStatusText(status) {
    // 兼容旧的英文状态值
    const legacyMap = {
        'draft': '草稿',
        'pending': '待开始',
        'ongoing': '进行中',
        'suspended': '已暂停',
        'expired': '已过期',
        'active': '进行中'
    };
    return legacyMap[status] || status;
}

// 保存为草稿标记
let isSavingDraft = false;

function submitFormAsDraft() {
    isSavingDraft = true;
    safeSetValue('status', '草稿');
    document.getElementById('dataForm').dispatchEvent(new Event('submit'));
}

// ========== 图片拖拽上传功能 ==========
let uploadedImages = [];

function initImageUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
}

async function handleFiles(files) {
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const uploadStatus = document.getElementById('uploadStatus');

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) {
            alert(`${file.name} 不是图片文件`);
            continue;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert(`${file.name} 超过5MB限制`);
            continue;
        }

        uploadProgress.style.display = 'block';
        uploadStatus.textContent = `正在上传 ${file.name}...`;
        progressFill.style.width = '0%';

        try {
            const imageUrl = await uploadImage(file, (percent) => {
                progressFill.style.width = percent + '%';
            });

            if (imageUrl) {
                uploadedImages.push(imageUrl);
                displayImagePreview(imageUrl, uploadedImages.length - 1);
                updateImagesTextarea();
            }
        } catch (error) {
            console.error('上传失败:', error);
            alert(`${file.name} 上传失败: ${error.message}`);
        }
    }

    setTimeout(() => {
        uploadProgress.style.display = 'none';
        progressFill.style.width = '0%';
    }, 500);

    document.getElementById('fileInput').value = '';
}

async function uploadImage(file, progressCallback) {
    const formData = new FormData();
    formData.append('image', file);

    try {
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progress <= 90) {
                progressCallback(progress);
            }
        }, 100);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        clearInterval(progressInterval);
        progressCallback(100);

        const result = await response.json();

        if (result.success) {
            return result.data.url;
        } else {
            throw new Error(result.message || '上传失败');
        }
    } catch (error) {
        console.error('上传错误:', error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initImageUpload();

    const textarea = document.getElementById('imageUrls');
    if (textarea) {
        textarea.addEventListener('input', updateImagesTextarea);
    }
});

// ========== Excel导入导出功能 ==========

async function importFromExcel(e) {
    if (!confirm('确定要从Excel导入数据吗？\n\n这将覆盖后台数据，建议先导出备份。')) {
        return;
    }

    const btn = e ? e.target : document.querySelector('[onclick*="importFromExcel"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⏳ 导入中...';

    try {
        const response = await fetch('/api/import-excel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (result.success) {
            alert(`✅ 导入成功！\n\n${result.message}\n\n请刷新页面查看最新数据。`);
            loadItems();
        } else {
            alert(`❌ 导入失败\n\n${result.message || '未知错误'}`);
        }
    } catch (error) {
        console.error('导入错误:', error);
        alert('❌ 导入失败\n\n' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function exportToExcel(e) {
    const btn = e ? e.target : document.querySelector('[onclick*="exportToExcel"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⏳ 导出中...';

    try {
        const response = await fetch('/api/export-excel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `清迈活动数据-导出-${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            alert('✅ 导出成功！\n\n文件已自动下载。');
        } else {
            const result = await response.json();
            alert(`❌ 导出失败\n\n${result.message || '未知错误'}`);
        }
    } catch (error) {
        console.error('导出错误:', error);
        alert('❌ 导出失败\n\n' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ==================== 攻略管理相关函数 ====================

async function openGuideModal() {
    const modal = document.getElementById('guideModal');
    modal.style.display = 'flex';

    const editor = document.getElementById('guideEditor');
    editor.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE}/guide`);
        const result = await response.json();

        if (result.success && result.data) {
            setTimeout(() => {
                let content = result.data.content || '';
                content = cleanInlineStyles(content);
                editor.innerHTML = content;

                setTimeout(() => {
                    ensureTableStyles(editor);
                    cleanElementStyles(editor);
                }, 50);
            }, 50);
        } else {
            editor.innerHTML = '<p style="color:#999;text-align:center;padding:40px;">暂无攻略内容，请粘贴或输入内容</p>';
        }
    } catch (error) {
        console.error('加载攻略失败:', error);
        alert('❌ 加载攻略内容失败\n\n' + error.message);
    }
}

function cleanInlineStyles(html) {
    html = html.replace(/style="([^"]*)"/gi, (match, styleContent) => {
        let cleaned = styleContent
            .replace(/font-size:\s*[^;]+;?/gi, '')
            .replace(/font-family:\s*[^;]+;?/gi, '')
            .replace(/color:\s*[^;]+;?/gi, '')
            .replace(/line-height:\s*[^;]+;?/gi, '')
            .replace(/background-color:\s*[^;]+;?/gi, '')
            .replace(/;\s*;/g, ';')
            .replace(/^;\s*/g, '')
            .replace(/;\s*$/g, '');

        return cleaned.trim() ? `style="${cleaned}"` : '';
    });

    html = html.replace(/\s+style=""/gi, '');
    return html;
}

function cleanElementStyles(editor) {
    const allElements = editor.querySelectorAll('*');
    allElements.forEach(el => {
        el.style.removeProperty('font-size');
        el.style.removeProperty('font-family');
        el.style.removeProperty('color');
        el.style.removeProperty('line-height');
        el.style.removeProperty('background-color');
    });
}

function ensureTableStyles(editor) {
    const tables = editor.querySelectorAll('table');
    tables.forEach(table => {
        if (!table.style.border) {
            table.style.border = '2px solid #ddd';
        }

        const cells = table.querySelectorAll('th, td');
        cells.forEach(cell => {
            if (!cell.style.border) cell.style.border = '1px solid #ddd';
            if (!cell.style.padding) cell.style.padding = '8px 12px';
            if (!cell.style.verticalAlign) cell.style.verticalAlign = 'top';
        });

        const headers = table.querySelectorAll('th');
        headers.forEach(th => {
            if (!th.style.backgroundColor) {
                th.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                th.style.color = 'white';
            }
        });
    });
}

function closeGuideModal() {
    document.getElementById('guideModal').style.display = 'none';
}

async function saveGuideContent() {
    const editor = document.getElementById('guideEditor');
    let content = editor.innerHTML;

    if (!content.trim() || content === '<br>') {
        alert('⚠️ 内容不能为空');
        return;
    }

    content = cleanInlineStyles(content);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    ensureTableStyles(tempDiv);
    content = tempDiv.innerHTML;

    try {
        const response = await fetch(`${API_BASE}/guide`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ content })
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ 保存成功！\n\n攻略信息已更新，前端页面将自动刷新显示。');
            closeGuideModal();
        } else {
            alert('❌ 保存失败\n\n' + result.message);
        }
    } catch (error) {
        console.error('保存攻略失败:', error);
        alert('❌ 保存失败\n\n' + error.message);
    }
}

function formatDoc(cmd, value = null) {
    document.execCommand(cmd, false, value);
    document.getElementById('guideEditor').focus();
}

function cleanEditorContent() {
    const editor = document.getElementById('guideEditor');
    let content = editor.innerHTML;

    content = cleanInlineStyles(content);
    editor.innerHTML = content;
    cleanElementStyles(editor);
    ensureTableStyles(editor);

    alert('✅ 格式已清理！\n\n已移除多余的内联样式，表格边框已优化。\n请检查内容是否正常，然后点击保存。');
}
