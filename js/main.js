// 全局变量和DOM元素缓存
let currentMolData = null;
let selectedTargets = new Set();
let addedTargets = new Set();
let fileFormat = '';
let showingLabels = false;

// DOM元素缓存
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
    vizControls: document.getElementById('viz-controls')
};

// 初始化函数
function init() {
    // 绑定上传区域事件
    elements.uploadBtn.addEventListener('click', function() {
        elements.fileInput.click();
    });
    
    // 处理文件选择
    elements.fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    });
    
    // 处理拖放上传
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
    elements.selectAllBtn.addEventListener('click', function() {
        if (!currentMolData) return;
        
        const allSelected = currentMolData.atoms.length === selectedTargets.size;
        
        if (allSelected) {
            // 取消全选
            selectedTargets.clear();
            document.querySelectorAll('#target-list li').forEach(li => {
                li.classList.remove('selected');
            });
            elements.selectAllBtn.innerHTML = '<span class="btn-icon">✓</span>Select All';
        } else {
            // 全选
            currentMolData.atoms.forEach(atom => {
                const id = atom.seqNum || atom.id;
                selectedTargets.add(id);
            });
            document.querySelectorAll('#target-list li').forEach(li => {
                li.classList.add('selected');
            });
            elements.selectAllBtn.innerHTML = '<span class="btn-icon">✗</span>Deselect All';
        }
        
        updateAddButtonState();
    });
    
    // 添加选中目标按钮事件
    elements.addSelectedBtn.addEventListener('click', function() {
        addSelectedTargets();
    });
    
    // 导出按钮事件
    elements.exportBtn.addEventListener('click', function() {
        exportTargets();
    });
    
    // 绑定可视化控制按钮
    bindViewerControls();
}

// 绑定可视化控制按钮事件
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
}

// 更新添加按钮状态
function updateAddButtonState() {
    elements.addSelectedBtn.disabled = selectedTargets.size === 0;
}

// 更新计数徽章
function updateCounts() {
    elements.targetCount.textContent = `${currentMolData?.atoms.length || 0} items`;
    elements.resultCount.textContent = `${addedTargets.size} items`;
    
    // 如果没有添加任何目标，禁用导出按钮
    elements.exportBtn.disabled = addedTargets.size === 0;
    
    // 更新结果列表的空状态
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
function showStatus(message, type = 'info') {
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status ${type}`;
}

// 初始化应用
document.addEventListener('DOMContentLoaded', init);