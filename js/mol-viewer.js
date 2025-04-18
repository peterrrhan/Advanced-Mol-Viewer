// 3Dmol查看器变量
// 3Dmol viewer variable
let glviewer = null;

// 点选相关变量
// Click selection related variables
let clickSelectionEnabled = false;
let selectedAtomsByClick = new Set();

// 创建3Dmol查看器
// Create 3Dmol viewer
function createViewer() {
    if (!glviewer) {
        // 创建一个新的div用于3Dmol查看器
        // Create a new div for 3Dmol viewer
        const viewerDiv = document.createElement('div');
        viewerDiv.id = 'gldiv';
        viewerDiv.className = 'mol-container';
        elements.moleculeDisplay.innerHTML = '';
        elements.moleculeDisplay.appendChild(viewerDiv);
        
        // 初始化3Dmol查看器
        // Initialize 3Dmol viewer
        glviewer = $3Dmol.createViewer($("#gldiv"), {
            backgroundColor: "white",
            defaultcolors: $3Dmol.rasmolElementColors
        });
    }
    return glviewer;
}

// 使用3Dmol.js显示分子结构
// Display molecular structure using 3Dmol.js
function displayMolecule3D(content, format) {
    // 创建3Dmol查看器
    // Create 3Dmol viewer
    const viewer = createViewer();
    
    // 清除之前的模型
    // Clear previous model
    viewer.clear();
    
    // 根据文件格式加载分子模型
    // Load molecular model based on file format
    let model;
    if (format === 'MOL2') {
        model = viewer.addModel(content, "mol2");
    } else if (format === 'PDB') {
        model = viewer.addModel(content, "pdb");
    } else {
        model = viewer.addModel(content, "mol");
    }
    
    // 设置样式 - 默认使用棍状模型
    // Set style - default stick model
    viewer.setStyle({}, {stick: {}});
    
    // 映射原子属性（用于部分电荷等）
    // Map atom properties (for partial charges etc.)
    viewer.mapAtomProperties($3Dmol.applyPartialCharges);
    
    // 如果启用了点选功能，初始化所有原子的点选属性
    // If click selection is enabled, initialize click properties for all atoms
    if (clickSelectionEnabled) {
        initializeAtomClickSelection(model, viewer);
    }
    
    // 缩放到合适的视图
    // Zoom to fit
    viewer.zoomTo();
    
    // 渲染视图
    // Render view
    viewer.render();
    
    // 显示可视化控制面板
    // Show visualization control panel
    elements.vizControls.style.display = 'flex';
}

// 显示分子信息
// Display molecule information
function displayMoleculeInfo(molData) {
    if (!molData || !molData.atoms.length) {
        return;
    }
    
    // 添加分子信息面板
    // Add molecule information panel
    const infoDiv = document.createElement('div');
    infoDiv.className = 'molecule-info';
    infoDiv.innerHTML = `
        <p><strong>Molecule Name:</strong> ${molData.name}</p>
        <p><strong>Comment:</strong> ${molData.comment || 'None'}</p>
        <p><strong>File Format:</strong> ${molData.format}</p>
        <p><strong>Number of Atoms:</strong> ${molData.atoms.length}</p>
        <p><strong>Number of Bonds:</strong> ${molData.bonds ? molData.bonds.length : 'N/A'}</p>
    `;
    
    // 将信息面板添加到分子显示区域前面
    // Add information panel before molecule display area
    const gldiv = document.getElementById('gldiv');
    gldiv.parentNode.insertBefore(infoDiv, gldiv);
}

// 添加或移除原子标签
// Add or remove atom labels
function toggleAtomLabels() {
    if (!glviewer || !currentMolData) return;
    
    if (showingLabels) {
        // 移除标签
        // Remove labels
        glviewer.removeAllLabels();
        showingLabels = false;
    } else {
        // 添加标签
        // Add labels
        currentMolData.atoms.forEach(atom => {
            const labelText = `${atom.symbol}${atom.id}`;
            glviewer.addLabel(labelText, {
                position: {x: atom.x, y: atom.y, z: atom.z},
                backgroundColor: "#FFFFFF",
                backgroundOpacity: 0.8,
                fontColor: "#000000",
                fontSize: 12
            });
        });
        showingLabels = true;
    }
    
    glviewer.render();
}

// 设置分子显示样式
// Set molecule display style
function setMoleculeStyle(styleId) {
    if (!glviewer) return;
    
    // 移除所有按钮的active状态
    // Remove active state from all buttons
    document.querySelectorAll('.viz-button').forEach(btn => {
        if (btn.id !== 'recenter' && btn.id !== 'labels-toggle') {
            btn.classList.remove('active');
        }
    });
    
    // 清除所有现有的高亮球体和标签
    // Clear all existing highlight spheres and labels
    glviewer.removeAllSurfaces();
    glviewer.removeAllShapes();
    
    // 根据样式ID设置对应的样式
    // Set style according to style ID
    switch(styleId) {
        case 'style-stick':
            glviewer.setStyle({}, {stick: {}});
            document.getElementById('style-stick').classList.add('active');
            break;
        case 'style-line':
            glviewer.setStyle({}, {line: {width: 3.0, colorscheme: 'rasmol'}});
            document.getElementById('style-line').classList.add('active');
            break;
        case 'style-sphere':
            glviewer.setStyle({}, {sphere: {}});
            document.getElementById('style-sphere').classList.add('active');
            break;
        case 'style-cartoon':
            // 卡通模式通常用于蛋白质
            // Cartoon mode usually used for proteins
            if (currentMolData && currentMolData.format === 'PDB') {
                glviewer.setStyle({}, {cartoon: {color: 'spectrum'}});
                document.getElementById('style-cartoon').classList.add('active');
            } else {
                // 如果不是PDB格式，提示用户
                // If not PDB format, notify user
                showStatus('Cartoon style is only available for PDB files', 'error');
                
                // 默认回到棍状图
                // Default back to stick style
                glviewer.setStyle({}, {stick: {}});
                document.getElementById('style-stick').classList.add('active');
            }
            break;
    }
    
    // 重新添加所有选中原子的高亮
    // Re-add highlights for all selected atoms
    addedTargets.forEach(id => {
        const atom = currentMolData.atoms.find(a => (a.seqNum === id) || (a.id === id));
        if (atom) {
            highlightSelectedAtom(atom);
        }
    });
    
    // 同样为通过点选选中的原子添加高亮
    // Also highlight atoms selected by clicking
    if (clickSelectionEnabled) {
        selectedAtomsByClick.forEach(atomId => {
            const atom = currentMolData.atoms.find(a => (a.seqNum === atomId) || (a.id === atomId));
            if (atom) {
                highlightClickedAtom(atom, glviewer);
            }
        });
    }
    
    glviewer.render();
}

// 高亮显示选中的原子
// Highlight selected atom
function highlightSelectedAtom(atom) {
    if (!glviewer) return;
    
    // 给选中的原子添加球状高亮
    // Add spherical highlight to selected atom
    glviewer.addSphere({
        center: {x: atom.x, y: atom.y, z: atom.z},
        radius: 0.5, // 减小了半径
        color: '#ff5500', // 修改为更明显的橙色
        opacity: 0.8
    });
    
    glviewer.render();
}

// ======= 点选功能新增代码 =======
// ======= Click Selection New Code =======

// 切换点选功能
// Toggle click selection functionality
function toggleClickSelection(enabled) {
    clickSelectionEnabled = enabled;
    
    if (enabled && glviewer && currentMolData) {
        // 初始化所有原子的点选属性
        // Initialize click properties for all atoms
        initializeAtomClickSelection(glviewer.getModel(), glviewer);
    } else {
        // 清除点选状态
        // Clear click selection state
        clearClickSelection();
    }
}

// 初始化原子点选功能
// Initialize atom click selection
function initializeAtomClickSelection(model, viewer) {
    if (!model) return;
    
    const atoms = model.selectedAtoms({});
    
    // 设置所有原子的点击属性
    // Set click properties for all atoms
    for (let i in atoms) {
        const atom = atoms[i];
        
        // 设置原子可点击
        // Make atom clickable
        atom.clickable = true;
        atom.callback = function(clickedAtom, viewerObj) {
            handleAtomClick(clickedAtom, viewerObj);
        };
        
        // 初始化选择状态
        // Initialize selection state
        atom.isSelected = false;
        atom.hasLabel = false;
    }
    
    // 重新渲染
    // Re-render
    viewer.render();
}

// 处理原子点击
// Handle atom click
function handleAtomClick(atom, viewer) {
    if (!clickSelectionEnabled) return;
    
    const atomId = atom.serial || atom.id;
    
    // 如果原子没有标签，创建一个
    // If atom has no label, create one
    if (!atom.hasLabel) {
        atom.clickLabel = viewer.addLabel(atom.elem + atomId, {
            position: {x: atom.x, y: atom.y, z: atom.z},
            backgroundColor: "#3b82f6", // 修改为更明显的蓝色
            fontColor: "white", // 修改为白色文字增强对比度
            fontSize: 14, // 增大字体
            borderWidth: 1.5, // 添加边框
            padding: 3, // 增加内边距
            borderColor: "white" // 白色边框
        });
        
        atom.hasLabel = true;
        atom.isSelected = true;
        
        // 添加到选中集合
        // Add to selected set
        selectedAtomsByClick.add(atomId);
        
        // 添加明显的高亮效果
        // Add prominent highlight effect
        highlightClickedAtom(atom, viewer);
        
        // 同步到列表选择
        // Sync to list selection
        syncClickSelectionToList(atomId, true);
    } else {
        // 原子已有标签，切换选择状态
        // Atom already has label, toggle selection state
        if (atom.isSelected) {
            // 取消选择
            // Deselect
            viewer.removeLabel(atom.clickLabel);
            atom.hasLabel = false;
            atom.isSelected = false;
            
            // 从选中集合移除
            // Remove from selected set
            selectedAtomsByClick.delete(atomId);
            
            // 同步到列表选择
            // Sync to list selection
            syncClickSelectionToList(atomId, false);
            
            // 重新渲染以移除高亮
            // Re-render to remove highlight
            setMoleculeStyle('style-stick'); // 重新应用当前样式以移除高亮
        } else {
            // 重新选择(应该不会执行此代码，因为我们在取消选择时移除了标签)
            // Reselect (this code should not execute as we removed the label when deselecting)
            const newStyle = atom.clickLabel.getStyle();
            newStyle.backgroundColor = "#3b82f6"; // 更明显的蓝色
            viewer.setLabelStyle(atom.clickLabel, newStyle);
            
            atom.isSelected = true;
            
            // 添加到选中集合
            // Add to selected set
            selectedAtomsByClick.add(atomId);
            
            // 添加明显的高亮效果
            // Add prominent highlight effect
            highlightClickedAtom(atom, viewer);
            
            // 同步到列表选择
            // Sync to list selection
            syncClickSelectionToList(atomId, true);
        }
    }
    
    // 渲染更改
    // Render changes
    viewer.render();
    
    // 更新添加按钮状态
    // Update add button state
    updateAddButtonState();
}

// 为点选的原子添加明显的高亮效果 - 已修改缩小球体
// Add prominent highlight effect for clicked atoms - modified to reduce sphere size
function highlightClickedAtom(atom, viewer) {
    // 添加适当大小的高亮球体
    // Add appropriately sized highlight sphere
    viewer.addSphere({
        center: {x: atom.x, y: atom.y, z: atom.z},
        radius: 0.5, // 减小半径
        color: '#ff3300', // 明亮的橙红色
        opacity: 0.7 // 稍微透明
    });
    
    // 可选：添加外层闪光效果(更小的外层球体)
    // Optional: Add outer glow effect (smaller outer sphere)
    viewer.addSphere({
        center: {x: atom.x, y: atom.y, z: atom.z},
        radius: 0.7, // 减小外层球体半径
        color: '#ff9900', // 橙黄色
        opacity: 0.3 // 更透明
    });
}

// 清除点选标记
// Clear click selection
function clearClickSelection() {
    if (!glviewer) return;
    
    // 移除所有标签
    // Remove all labels
    glviewer.removeAllLabels();
    
    // 清除所有高亮球体
    // Clear all highlight spheres
    glviewer.removeAllSurfaces();
    glviewer.removeAllShapes();
    
    // 清空选中集合
    // Clear selected set
    selectedAtomsByClick.clear();
    
    // 重置标签和选择状态
    // Reset label and selection states
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
    
    // 重新应用当前样式
    // Reapply current style
    glviewer.setStyle({}, {stick: {}});
    document.getElementById('style-stick').classList.add('active');
    
    // 渲染更改
    // Render changes
    glviewer.render();
}

// 同步点选到列表选择
// Sync click selection to list selection
function syncClickSelectionToList(atomId, isSelected) {
    // 将点选同步到列表选择
    // Sync click selection to list selection
    if (isSelected) {
        selectedTargets.add(atomId);
    } else {
        selectedTargets.delete(atomId);
    }
    
    // 更新列表UI
    // Update list UI
    const listItem = document.querySelector(`#target-list li[data-id="${atomId}"]`);
    if (listItem) {
        if (isSelected) {
            listItem.classList.add('selected');
        } else {
            listItem.classList.remove('selected');
        }
    }
    
    // 更新添加按钮状态
    // Update add button state
    updateAddButtonState();
}

// 从列表选择同步到点选
// Sync from list selection to click selection
function syncListSelectionToClick(atomId, isSelected) {
    if (!glviewer || !currentMolData || !clickSelectionEnabled) return;
    
    const model = glviewer.getModel();
    if (!model) return;
    
    const atoms = model.selectedAtoms({});
    
    // 查找对应的原子
    // Find corresponding atom
    for (let i in atoms) {
        const atom = atoms[i];
        const id = atom.serial || atom.id;
        
        if (id == atomId) {
            // 如果状态一致则无需操作
            // If state is already consistent, no action needed
            if ((atom.isSelected && isSelected) || (!atom.isSelected && !isSelected)) {
                return;
            }
            
            // 模拟点击事件
            // Simulate click event
            handleAtomClick(atom, glviewer);
            break;
        }
    }
}

// 获取通过点选选中的原子
// Get atoms selected by clicking
function getClickSelectedAtoms() {
    return Array.from(selectedAtomsByClick);
}