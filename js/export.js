// 导出为TXT文件
function exportTargets() {
    if (addedTargets.size === 0) return;
    
    let content = `Molecule Name: ${currentMolData.name}\n`;
    content += `File Format: ${currentMolData.format}\n`;
    content += `Export Time: ${new Date().toLocaleString()}\n\n`;
    content += `Selected Targets (${addedTargets.size}):\n`;
    content += `----------------------------\n\n`;
    
    let index = 1;
    addedTargets.forEach(id => {
        const atom = currentMolData.atoms.find(a => (a.seqNum === id) || (a.id === id));
        if (atom) {
            const displayId = atom.seqNum ? atom.seqNum : atom.id;
            const atomId = atom.id ? `${atom.id}` : '';
            
            content += `[${index}] #${displayId} ${atom.symbol}${atomId ? ` (${atomId})` : ''}\n`;
            
            // 根据分子类型导出不同信息
            if (currentMolData.format === 'PDB') {
                content += `  Name: ${atom.name || atom.symbol}\n`;
                content += `  Residue: ${atom.residue || 'N/A'} ${atom.resSeq || ''} ${atom.chain ? `Chain ${atom.chain}` : ''}\n`;
            }
            
            content += `  Coordinates: (${atom.x.toFixed(6)}, ${atom.y.toFixed(6)}, ${atom.z.toFixed(6)})\n\n`;
            index++;
        }
    });
    
    // 创建并下载文件
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `molecule_targets_export_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    
    // 清理
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
    
    // 更新状态
    showStatus('Successfully exported as TXT file', 'success');
}