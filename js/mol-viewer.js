// 3Dmol查看器变量
let glviewer = null;

// 创建3Dmol查看器
function createViewer() {
    if (!glviewer) {
        // 创建一个新的div用于3Dmol查看器
        const viewerDiv = document.createElement('div');
        viewerDiv.id = 'gldiv';
        viewerDiv.className = 'mol-container';
        elements.moleculeDisplay.innerHTML = '';
        elements.moleculeDisplay.appendChild(viewerDiv);
        
        // 初始化3Dmol查看器
        glviewer = $3Dmol.createViewer($("#gldiv"), {
            backgroundColor: "white",
            defaultcolors: $3Dmol.rasmolElementColors
        });
    }
    return glviewer;
}

// 使用3Dmol.js显示分子结构
function displayMolecule3D(content, format) {
    // 创建3Dmol查看器
    const viewer = createViewer();
    
    // 清除之前的模型
    viewer.clear();
    
    // 根据文件格式加载分子模型
    let model;
    if (format === 'MOL2') {
        model = viewer.addModel(content, "mol2");
    } else if (format === 'PDB') {
        model = viewer.addModel(content, "pdb");
    } else {
        model = viewer.addModel(content, "mol");
    }
    
    // 设置样式 - 默认使用棍状模型
    viewer.setStyle({}, {stick: {}});
    
    // 映射原子属性（用于部分电荷等）
    viewer.mapAtomProperties($3Dmol.applyPartialCharges);
    
    // 缩放到合适的视图
    viewer.zoomTo();
    
    // 渲染视图
    viewer.render();
    
    // 显示可视化控制面板
    elements.vizControls.style.display = 'flex';
}

// 显示分子信息
function displayMoleculeInfo(molData) {
    if (!molData || !molData.atoms.length) {
        return;
    }
    
    // 添加分子信息面板
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
    const gldiv = document.getElementById('gldiv');
    gldiv.parentNode.insertBefore(infoDiv, gldiv);
}

// 添加或移除原子标签
function toggleAtomLabels() {
    if (!glviewer || !currentMolData) return;
    
    if (showingLabels) {
        // 移除标签
        glviewer.removeAllLabels();
        showingLabels = false;
    } else {
        // 添加标签
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
function setMoleculeStyle(styleId) {
    if (!glviewer) return;
    
    // 移除所有按钮的active状态
    document.querySelectorAll('.viz-button').forEach(btn => {
        if (btn.id !== 'recenter' && btn.id !== 'labels-toggle') {
            btn.classList.remove('active');
        }
    });
    
    // 根据样式ID设置对应的样式
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
            if (currentMolData && currentMolData.format === 'PDB') {
                glviewer.setStyle({}, {cartoon: {color: 'spectrum'}});
                document.getElementById('style-cartoon').classList.add('active');
            } else {
                // 如果不是PDB格式，提示用户
                showStatus('Cartoon style is only available for PDB files', 'error');
                
                // 默认回到棍状图
                glviewer.setStyle({}, {stick: {}});
                document.getElementById('style-stick').classList.add('active');
            }
            break;
    }
    
    // 重新添加所有选中原子的高亮
    addedTargets.forEach(id => {
        const atom = currentMolData.atoms.find(a => (a.seqNum === id) || (a.id === id));
        if (atom) {
            highlightSelectedAtom(atom);
        }
    });
    
    glviewer.render();
}

// 高亮显示选中的原子
function highlightSelectedAtom(atom) {
    if (!glviewer) return;
    
    // 创建一个特殊样式为选中的原子
    const atomSpec = {
        serial: atom.id
    };
    
    // 给选中的原子添加球状高亮
    glviewer.addSphere({
        center: {x: atom.x, y: atom.y, z: atom.z},
        radius: 0.5,
        color: 'yellow',
        opacity: 0.8
    });
    
    glviewer.render();
}