// 显示可选目标（这里使用原子作为示例目标）
function displayTargets(molData) {
    if (!molData || !molData.atoms.length) return;
    
    elements.targetList.innerHTML = '';
    selectedTargets.clear();
    
    // 将原子作为可选目标
    molData.atoms.forEach(atom => {
        const li = document.createElement('li');
        li.dataset.id = atom.seqNum || atom.id;
        const displayId = atom.seqNum ? atom.seqNum : atom.id; // 优先显示序列号
        const atomId = atom.id ? `${atom.id}` : '';
        
        // 根据分子类型显示不同信息
        if (molData.format === 'PDB') {
            li.innerHTML = `
                <strong>#${displayId} ${atom.symbol}${atomId ? ` (${atomId})` : ''}</strong>: 
                ${atom.residue || ''} ${atom.resSeq || ''} ${atom.chain ? `Chain ${atom.chain}` : ''}
                (${atom.x.toFixed(3)}, ${atom.y.toFixed(3)}, ${atom.z.toFixed(3)})
            `;
        } else {
            li.innerHTML = `
                <strong>#${displayId} ${atom.symbol}${atomId ? ` (${atomId})` : ''}</strong>: 
                (${atom.x.toFixed(3)}, ${atom.y.toFixed(3)}, ${atom.z.toFixed(3)})
            `;
        }
        
        li.addEventListener('click', function() {
            toggleTargetSelection(this, displayId);
        });
        
        elements.targetList.appendChild(li);
    });
    
    elements.targetsContainer.style.display = 'block';
    updateAddButtonState();
    updateCounts();
}

// 切换目标选择状态
function toggleTargetSelection(element, id) {
    id = parseInt(id);
    if (selectedTargets.has(id)) {
        selectedTargets.delete(id);
        element.classList.remove('selected');
    } else {
        selectedTargets.add(id);
        element.classList.add('selected');
    }
    
    updateAddButtonState();
}

// 添加选定的目标到结果列表
function addSelectedTargets() {
    if (!currentMolData || selectedTargets.size === 0) return;
    
    // 如果是第一个添加的目标，清空空状态显示
    if (addedTargets.size === 0) {
        elements.resultsList.innerHTML = '';
    }
    
    selectedTargets.forEach(id => {
        if (!addedTargets.has(id)) {
            addedTargets.add(id);
            
            // 查找对应的原子
            const atom = currentMolData.atoms.find(a => (a.seqNum === id) || (a.id === id));
            if (atom) {
                const displayId = atom.seqNum ? atom.seqNum : atom.id;
                const atomId = atom.id ? `${atom.id}` : '';
                
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                resultItem.dataset.id = displayId;
                
                // 显示原子详细信息
                let atomInfo = '';
                if (currentMolData.format === 'PDB') {
                    atomInfo = `
                        <p>Name: ${atom.name || atom.symbol}</p>
                        <p>Residue: ${atom.residue || 'N/A'} ${atom.resSeq || ''} ${atom.chain ? `Chain ${atom.chain}` : ''}</p>
                        <p>Coordinates: (${atom.x.toFixed(3)}, ${atom.y.toFixed(3)}, ${atom.z.toFixed(3)})</p>
                    `;
                } else {
                    atomInfo = `
                        <p>Element: ${atom.symbol}</p>
                        <p>Coordinates: (${atom.x.toFixed(3)}, ${atom.y.toFixed(3)}, ${atom.z.toFixed(3)})</p>
                    `;
                }
                
                resultItem.innerHTML = `
                    <strong>#${displayId} ${atom.symbol}${atomId ? ` (${atomId})` : ''}</strong>
                    ${atomInfo}
                    <button class="remove-btn" data-id="${displayId}">Remove</button>
                `;
                
                resultItem.querySelector('.remove-btn').addEventListener('click', function() {
                    const targetId = parseInt(this.dataset.id);
                    removeTarget(targetId);
                });
                
                elements.resultsList.appendChild(resultItem);
                
                // 高亮显示选中的原子
                highlightSelectedAtom(atom);
            }
        }
    });
    
    // 清除选择
    document.querySelectorAll('#target-list li.selected').forEach(li => {
        li.classList.remove('selected');
    });
    selectedTargets.clear();
    updateAddButtonState();
    updateCounts();
    
    // 激活导出按钮
    elements.exportBtn.disabled = false;
}

// 从结果列表中移除目标
function removeTarget(id) {
    addedTargets.delete(id);
    const item = document.querySelector(`.result-item[data-id="${id}"]`);
    if (item) {
        item.remove();
    }
    updateCounts();
    
    // 重新渲染分子，移除高亮
    if (glviewer && currentMolData) {
        // 重新设置当前样式
        const activeStyleBtn = document.querySelector('.viz-button.active');
        if (activeStyleBtn) {
            const styleId = activeStyleBtn.id;
            setMoleculeStyle(styleId);
        } else {
            // 默认棍状图
            glviewer.setStyle({}, {stick: {}});
        }
        
        // 重新添加所有选中原子的高亮
        addedTargets.forEach(targetId => {
            const atom = currentMolData.atoms.find(a => (a.seqNum === targetId) || (a.id === targetId));
            if (atom) {
                highlightSelectedAtom(atom);
            }
        });
        
        glviewer.render();
    }
}