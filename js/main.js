// 全局变量和DOM元素缓存
// Global variables and DOM elements cache
let currentMolData = null;
let selectedTargets = new Set();
let addedTargets = new Set();
let fileFormat = '';
let showingLabels = false;
let selectionMode = 'List'; // 默认使用列表模式 (default to List selection mode)

// DOM元素缓存
// DOM elements cache
const elements = {
    dropArea: document.getElementById('drop-area'),
    fileInput: document.getElementById('file-input'),
    uploadBtn: document.getElementById('upload-btn'),
    statusMessage: document.getElementById('status-message'),
    moleculeDisplay: document.getElementById('molecule-display'),
    targetsContainer: document.getElementById('targets-container'),
    targetList: document.getElementById('target-list'),
    targetCount: document.getElementById('target-count'),
    addSelectedBtn: document.getElementById('add-selected-btn'),
    selectAllBtn: document.getElementById('select-all-btn'),
    resultsList: document.getElementById('results-list'),
    resultCount: document.getElementById('result-count'),
    exportBtn: document.getElementById('export-btn'),
    vizControls: document.getElementById('viz-controls'),
    selectionModeToggle: document.getElementById('selection-mode-toggle'),
    listModeButton: document.getElementById('list-mode'),
    clickModeButton: document.getElementById('click-mode')
};

// 初始化函数
// Initialization function
function init() {
    // 绑定上传区域事件
    // Bind upload area events
    elements.uploadBtn.addEventListener('click', function() {
        elements.fileInput.click();
    });
    
    // 处理文件选择
    // Handle file selection
    elements.fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    });
    
    // 处理拖放上传
    // Handle drag and drop upload
    elements.dropArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        elements.dropArea.classList.add('active');
    });
    
    elements.dropArea.addEventListener('dragleave', function() {
        elements.dropArea.classList.remove('active');
    });
    
    elements.dropArea.addEventListener('drop', function(e) {
        e.preventDefault();
        elements.dropArea.classList.remove('active');
        
        const file = e.dataTransfer.files[0];
        if (file && (file.name.toLowerCase().endsWith('.mol') || 
                     file.name.toLowerCase().endsWith('.mol2') || 
                     file.name.toLowerCase().endsWith('.pdb') ||
                     file.name.toLowerCase().endsWith('.txt'))) {
            handleFile(file);
        } else {
            showStatus('Please upload a .mol, .mol2, .pdb or .txt file', 'error');
        }
    });
    
    // 选择按钮事件
    // Selection button events
    elements.selectAllBtn.addEventListener('click', function() {
        if (!currentMolData) return;
        
        const allSelected = currentMolData.atoms.length === selectedTargets.size;
        
        if (allSelected) {
            // 取消全选
            // Deselect all
            selectedTargets.clear();
            document.querySelectorAll('#target-list li').forEach(li => {
                li.classList.remove('selected');
            });
            elements.selectAllBtn.innerHTML = '<span class="btn-icon">✓</span>Select All';
            
            // 如果在点选模式下，也清除点选
            // If in click mode, also clear click selection
            if (selectionMode === 'click') {
                clearClickSelection();
            }
        } else {
            // 全选
            // Select all
            currentMolData.atoms.forEach(atom => {
                const id = atom.seqNum || atom.id;
                selectedTargets.add(id);
                
                // 如果在点选模式下，同步到点选
                // If in click mode, sync to click selection
                if (selectionMode === 'click') {
                    syncListSelectionToClick(id, true);
                }
            });
            document.querySelectorAll('#target-list li').forEach(li => {
                li.classList.add('selected');
            });
            elements.selectAllBtn.innerHTML = '<span class="btn-icon">✗</span>Deselect All';
        }
        
        updateAddButtonState();
    });
    
    // 添加选中目标按钮事件
    // Add selected targets button event
    elements.addSelectedBtn.addEventListener('click', function() {
        addSelectedTargets();
    });
    
    // 导出按钮事件
    // Export button event
    elements.exportBtn.addEventListener('click', function() {
        exportTargets();
    });
    
    // 绑定可视化控制按钮
    // Bind visualization control buttons
    bindViewerControls();
    
    // 绑定选择模式切换按钮
    // Bind selection mode toggle buttons
    if (elements.listModeButton && elements.clickModeButton) {
        elements.listModeButton.addEventListener('click', function() {
            switchSelectionMode('list');
        });
        
        elements.clickModeButton.addEventListener('click', function() {
            switchSelectionMode('click');
        });
    }
}

// 切换选择模式
// Switch selection mode
function switchSelectionMode(mode) {
    selectionMode = mode;
    
    // 更新UI状态
    // Update UI state
    if (mode === 'list') {
        elements.listModeButton.classList.add('active');
        elements.clickModeButton.classList.remove('active');
        
        // 禁用点选模式
        // Disable click selection mode
        toggleClickSelection(false);
        
        // 显示列表选择区域
        // Show list selection area
        elements.targetsContainer.style.display = 'block';
        
        // 更新状态提示
        // Update status message
        showStatus('List selection mode activated. Select atoms from the list below.', 'info');
    } else {
        elements.clickModeButton.classList.add('active');
        elements.listModeButton.classList.remove('active');
        
        // 启用点选模式
        // Enable click selection mode
        toggleClickSelection(true);
        
        // 隐藏列表选择区域（可选，取决于UI设计）
        // Hide list selection area (optional, depends on UI design)
        // elements.targetsContainer.style.display = 'none';
        
        // 更新状态提示
        // Update status message
        showStatus('Click selection mode activated. Click directly on atoms in the 3D view.', 'info');
    }
}

// 绑定可视化控制按钮事件
// Bind visualization control button events
function bindViewerControls() {
    document.getElementById('style-stick').addEventListener('click', function() {
        setMoleculeStyle('style-stick');
    });
    
    document.getElementById('style-line').addEventListener('click', function() {
        setMoleculeStyle('style-line');
    });
    
    document.getElementById('style-sphere').addEventListener('click', function() {
        setMoleculeStyle('style-sphere');
    });
    
    document.getElementById('style-cartoon').addEventListener('click', function() {
        setMoleculeStyle('style-cartoon');
    });
    
    document.getElementById('recenter').addEventListener('click', function() {
        if (glviewer) {
            glviewer.zoomTo();
            glviewer.render();
        }
    });
    
    document.getElementById('labels-toggle').addEventListener('click', function() {
        toggleAtomLabels();
        this.classList.toggle('active');
    });
    
    // 如果有新的原子选择方式切换按钮也进行绑定
    // Also bind new atom selection mode toggle button if exists
    const clearSelectionBtn = document.getElementById('clear-selection');
    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', function() {
            clearAllSelections();
        });
    }
}

// 清除所有选择函数 - 彻底清除所有高亮效果
// Clear all selections function - thoroughly clear all highlight effects
function clearAllSelections() {
    // 清除所有选择
    // Clear all selections
    selectedTargets.clear();
    
    // 更新列表UI
    // Update list UI
    document.querySelectorAll('#target-list li').forEach(li => {
        li.classList.remove('selected');
    });
    
    // 如果在点选模式，彻底清除点选的所有视觉效果
    // If in click mode, thoroughly clear all visual effects of click selection
    if (glviewer) {
        // 清除点选相关的所有视觉效果（标签和高亮球体）
        // Clear all visual effects related to click selection (labels and highlight spheres)
        glviewer.removeAllLabels();
        glviewer.removeAllSurfaces();
        glviewer.removeAllShapes();
        
        // 清空点选集合
        // Clear click selection set
        if (typeof selectedAtomsByClick !== 'undefined') {
            selectedAtomsByClick.clear();
        }
        
        // 重置所有原子的选择状态
        // Reset selection state for all atoms
        if (currentMolData) {
            const model = glviewer.getModel();
            if (model) {
                const atoms = model.selectedAtoms({});
                for (let i in atoms) {
                    const atom = atoms[i];
                    atom.hasLabel = false;
                    atom.isSelected = false;
                }
            }
        }
        
        // 重新应用当前样式以刷新视图
        // Reapply current style to refresh the view
        const currentStyle = document.querySelector('.viz-button.active');
        if (currentStyle) {
            setMoleculeStyle(currentStyle.id);
        } else {
            glviewer.setStyle({}, {stick: {}});
            document.getElementById('style-stick').classList.add('active');
        }
        
        // 重新渲染
        // Re-render
        glviewer.render();
    }
    
    // 更新按钮状态
    // Update button state
    updateAddButtonState();
    elements.selectAllBtn.innerHTML = '<span class="btn-icon">✓</span>Select All';
    
    // 显示通知
    // Show notification
    showStatus('All selections cleared', 'info');
}

// 更新添加按钮状态
// Update add button state
function updateAddButtonState() {
    elements.addSelectedBtn.disabled = selectedTargets.size === 0;
}

// 更新计数徽章
// Update count badges
function updateCounts() {
    elements.targetCount.textContent = `${currentMolData?.atoms.length || 0} items`;
    elements.resultCount.textContent = `${addedTargets.size} items`;
    
    // 如果没有添加任何目标，禁用导出按钮
    // If no targets added, disable export button
    elements.exportBtn.disabled = addedTargets.size === 0;
    
    // 更新结果列表的空状态
    // Update empty state of results list
    if (addedTargets.size === 0) {
        elements.resultsList.innerHTML = `
            <div class="empty-state">
                <div class="upload-icon">📋</div>
                <p>No targets added yet</p>
            </div>
        `;
    }
}

// 显示状态消息
// Show status message
function showStatus(message, type = 'info') {
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status ${type}`;
}

// 添加选中的目标
// Add selected targets
function addSelectedTargets() {
    // 获取当前选中的目标
    // Get currently selected targets
    let itemsToAdd = [];
    
    if (selectionMode === 'list' || elements.targetsContainer.style.display !== 'none') {
        // 从列表中获取选中项
        // Get selected items from list
        selectedTargets.forEach(id => {
            if (!addedTargets.has(id)) {
                itemsToAdd.push({
                    id: id,
                    atom: currentMolData.atoms.find(a => (a.seqNum === id) || (a.id === id))
                });
            }
        });
    } else if (selectionMode === 'click') {
        // 从点选中获取选中项
        // Get selected items from click selection
        getClickSelectedAtoms().forEach(id => {
            if (!addedTargets.has(id)) {
                itemsToAdd.push({
                    id: id,
                    atom: currentMolData.atoms.find(a => (a.seqNum === id) || (a.id === id))
                });
            }
        });
    }
    
    // 如果没有选中项，直接返回
    // If no items selected, return
    if (itemsToAdd.length === 0) {
        showStatus('No new targets selected', 'error');
        return;
    }
    
    // 添加到结果列表
    // Add to results list
    addToResultsList(itemsToAdd);
    
    // 更新添加的目标集合
    // Update added targets set
    itemsToAdd.forEach(item => {
        addedTargets.add(item.id);
    });
    
    // 清除当前选择
    // Clear current selection
    clearAllSelections();
    
    // 更新状态
    // Update status
    updateCounts();
    
    showStatus(`Added ${itemsToAdd.length} targets to the list`, 'success');
}

// 添加到结果列表
// Add to results list
function addToResultsList(items) {
    // 如果结果列表为空，先清除空状态
    // If results list is empty, clear empty state first
    if (addedTargets.size === 0) {
        elements.resultsList.innerHTML = '';
    }
    
    // 创建结果项目并添加到列表
    // Create result items and add to list
    items.forEach(item => {
        const atom = item.atom;
        if (!atom) return;
        
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.dataset.id = item.id;
        
        resultItem.innerHTML = `
            <div class="result-details">
                <span class="result-id">${atom.symbol || atom.elem}${atom.id}</span>
                <span class="result-type">${atom.element || atom.symbol || atom.elem}</span>
                <span class="result-coords">
                    (${atom.x.toFixed(3)}, ${atom.y.toFixed(3)}, ${atom.z.toFixed(3)})
                </span>
            </div>
            <button class="result-remove" data-id="${item.id}">✕</button>
        `;
        
        elements.resultsList.appendChild(resultItem);
        
        // 绑定移除按钮事件
        // Bind remove button event
        resultItem.querySelector('.result-remove').addEventListener('click', function() {
            const id = this.dataset.id;
            removeTarget(id);
        });
    });
}

// 移除目标
// Remove target
function removeTarget(id) {
    // 从结果列表移除元素
    // Remove element from results list
    const resultItem = document.querySelector(`.result-item[data-id="${id}"]`);
    if (resultItem) {
        resultItem.remove();
    }
    
    // 从集合中移除
    // Remove from set
    addedTargets.delete(id);
    
    // 更新计数
    // Update counts
    updateCounts();
    
    // 如果没有更多目标，禁用导出按钮
    // If no more targets, disable export button
    if (addedTargets.size === 0) {
        elements.exportBtn.disabled = true;
    }
}

// 处理目标项的点击事件（列表选择模式）
// Handle target item click event (list selection mode)
function handleTargetItemClick(event) {
    const item = event.currentTarget;
    const id = item.dataset.id;
    
    // 切换选择状态
    // Toggle selection state
    if (item.classList.contains('selected')) {
        item.classList.remove('selected');
        selectedTargets.delete(id);
        
        // 如果在点选模式下，同步到点选
        // If in click mode, sync to click selection
        if (selectionMode === 'click') {
            syncListSelectionToClick(id, false);
        }
    } else {
        item.classList.add('selected');
        selectedTargets.add(id);
        
        // 如果在点选模式下，同步到点选
        // If in click mode, sync to click selection
        if (selectionMode === 'click') {
            syncListSelectionToClick(id, true);
        }
    }
    
    // 更新添加按钮状态
    // Update add button state
    updateAddButtonState();
    
    // 更新全选按钮文本
    // Update select all button text
    if (selectedTargets.size === currentMolData?.atoms.length) {
        elements.selectAllBtn.innerHTML = '<span class="btn-icon">✗</span>Deselect All';
    } else {
        elements.selectAllBtn.innerHTML = '<span class="btn-icon">✓</span>Select All';
    }
}

// 生成目标列表项的HTML
// Generate HTML for target list items
function generateTargetListItems() {
    if (!currentMolData || !currentMolData.atoms.length) {
        return '';
    }
    
    let html = '';
    
    currentMolData.atoms.forEach(atom => {
        const id = atom.seqNum || atom.id;
        html += `
            <li data-id="${id}" class="target-item">
                <span class="atom-symbol">${atom.symbol || atom.elem}</span>
                <span class="atom-id">${id}</span>
                <span class="atom-coords">(${atom.x.toFixed(3)}, ${atom.y.toFixed(3)}, ${atom.z.toFixed(3)})</span>
            </li>
        `;
    });
    
    return html;
}

// 初始化目标列表
// Initialize target list
function initializeTargetList() {
    if (!currentMolData || !elements.targetList) return;
    
    // 生成列表项
    // Generate list items
    elements.targetList.innerHTML = generateTargetListItems();
    
    // 绑定点击事件
    // Bind click events
    document.querySelectorAll('#target-list li').forEach(item => {
        item.addEventListener('click', handleTargetItemClick);
    });
    
    // 显示目标容器
    // Show targets container
    elements.targetsContainer.style.display = 'block';
    
    // 更新计数
    // Update counts
    updateCounts();
    
    // 初始化选择模式
    // Initialize selection mode
    initializeSelectionMode();
}

// 初始化选择模式
// Initialize selection mode
function initializeSelectionMode() {
    // 先检查DOM元素是否存在
    // First check if DOM elements exist
    if (!document.getElementById('list-mode') || !document.getElementById('click-mode')) {
        // 如果没有选择模式按钮，创建它们
        // If selection mode buttons don't exist, create them
        createSelectionModeUI();
    }
    
    // 默认使用列表选择模式
    // Default to List selection mode
    switchSelectionMode('List');
}

// 创建选择模式UI
// Create selection mode UI
function createSelectionModeUI() {
    // 创建选择模式切换容器
    // Create selection mode toggle container
    const selectionModeContainer = document.createElement('div');
    selectionModeContainer.className = 'selection-mode-container';
    selectionModeContainer.innerHTML = `
        <div class="section-header">
            <h2>Selection Mode</h2>
        </div>
        <div class="selection-mode-toggle" id="selection-mode-toggle">
            <button class="selection-mode-btn active" id="list-mode">
                <span class="btn-icon">📋</span>List Selection
            </button>
            <button class="selection-mode-btn" id="click-mode">
                <span class="btn-icon">🖱️</span>Click Selection
            </button>
        </div>
        <div class="selection-mode-info">
            <p id="selection-mode-description">
                Select atoms from the list below. Click on an atom to select/deselect it.
            </p>
        </div>
        <button class="btn" id="clear-selection">
            <span class="btn-icon">🗑️</span>Clear Selection
        </button>
    `;
    
    // 将选择模式容器插入到合适的位置
    // Insert selection mode container at appropriate position
    elements.targetsContainer.parentNode.insertBefore(selectionModeContainer, elements.targetsContainer);
    
    // 更新DOM缓存
    // Update DOM cache
    elements.selectionModeToggle = document.getElementById('selection-mode-toggle');
    elements.listModeButton = document.getElementById('list-mode');
    elements.clickModeButton = document.getElementById('click-mode');
    
    // 绑定事件
    // Bind events
    bindViewerControls();
}

// 初始化应用
// Initialize application
document.addEventListener('DOMContentLoaded', init);