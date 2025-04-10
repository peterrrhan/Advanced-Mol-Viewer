// 处理文件上传
function handleFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const content = e.target.result;
        try {
            // 检测文件格式
            if (content.includes('@<TRIPOS>MOLECULE')) {
                fileFormat = 'MOL2';
                currentMolData = parseMol2File(content);
            } else if (content.includes('ATOM') && (content.includes('HETATM') || content.includes('CONECT'))) {
                fileFormat = 'PDB';
                currentMolData = parsePDBFile(content);
            } else {
                fileFormat = 'MOL';
                currentMolData = parseMolFile(content);
            }
            
            displayMolecule3D(content, fileFormat);
            displayMoleculeInfo(currentMolData);
            displayTargets(currentMolData);
            
            // 显示可视化控制面板
            elements.vizControls.style.display = 'flex';
            
            showStatus(`Successfully loaded ${fileFormat} file: ${file.name}`, 'success');
            
            // 重置已添加目标
            addedTargets.clear();
            updateCounts();
        } catch (error) {
            showStatus(`Error parsing file: ${error.message}`, 'error');
            console.error(error);
        }
    };
    
    reader.onerror = function() {
        showStatus('Error reading file', 'error');
    };
    
    reader.readAsText(file);
}

// 解析MOL文件内容
function parseMolFile(content) {
    // 简化的MOL文件解析
    const lines = content.split('\n');
    const atoms = [];
    const bonds = [];
    
    // 从第4行开始，获取原子数和键数
    let countLine = lines[3] || '';
    const atomCount = parseInt(countLine.substr(0, 3).trim()) || 0;
    const bondCount = parseInt(countLine.substr(3, 3).trim()) || 0;
    
    if (atomCount === 0) {
        throw new Error('Invalid MOL file format or no atoms found');
    }
    
    // 解析原子信息
    for (let i = 0; i < atomCount; i++) {
        const line = lines[4 + i] || '';
        if (line.length >= 33) {
            atoms.push({
                id: i + 1,
                x: parseFloat(line.substr(0, 10).trim()),
                y: parseFloat(line.substr(10, 10).trim()),
                z: parseFloat(line.substr(20, 10).trim()),
                symbol: line.substr(31, 3).trim()
            });
        }
    }
    
    // 解析键信息
    for (let i = 0; i < bondCount; i++) {
        const line = lines[4 + atomCount + i] || '';
        if (line.length >= 9) {
            bonds.push({
                id: i + 1,
                atom1: parseInt(line.substr(0, 3).trim()),
                atom2: parseInt(line.substr(3, 3).trim()),
                type: parseInt(line.substr(6, 3).trim())
            });
        }
    }
    
    return {
        name: lines[0] || 'Unknown Molecule',
        comment: lines[1] || '',
        atoms: atoms,
        bonds: bonds,
        format: 'MOL'
    };
}

// 解析MOL2文件内容
function parseMol2File(content) {
    const lines = content.split('\n');
    let moleculeName = 'Unknown Molecule';
    let comment = '';
    const atoms = [];
    const bonds = [];
    
    // MOL2 解析状态
    let currentSection = '';
    let atomCount = 0;
    let bondCount = 0;
    
    // 遍历文件的每一行
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 跳过空行和注释行
        if (line === '' || line.startsWith('#')) {
            continue;
        }
        
        // 检查部分标记
        if (line.startsWith('@<TRIPOS>')) {
            currentSection = line;
            continue;
        }
        
        // 处理各个部分
        if (currentSection === '@<TRIPOS>MOLECULE') {
            if (moleculeName === 'Unknown Molecule') {
                moleculeName = line;
            } else if (atomCount === 0 && bondCount === 0) {
                // 获取原子和键数量
                const counts = line.trim().split(/\s+/);
                if (counts.length >= 2) {
                    atomCount = parseInt(counts[0]);
                    bondCount = parseInt(counts[1]);
                }
            } else if (line.trim() && comment === '') {
                // 存储注释行信息
                comment = line;
            }
        } else if (currentSection === '@<TRIPOS>ATOM') {
            // 解析原子信息
            const atomParts = line.split(/\s+/);
            if (atomParts.length >= 6) {
                const id = parseInt(atomParts[0]);
                const symbol = atomParts[5].split('.')[0]; // 取原子类型的第一部分
                atoms.push({
                    id: id,
                    x: parseFloat(atomParts[2]),
                    y: parseFloat(atomParts[3]),
                    z: parseFloat(atomParts[4]),
                    symbol: symbol
                });
            }
        } else if (currentSection === '@<TRIPOS>BOND') {
            // 解析键信息
            const bondParts = line.split(/\s+/);
            if (bondParts.length >= 4) {
                bonds.push({
                    id: parseInt(bondParts[0]),
                    atom1: parseInt(bondParts[1]),
                    atom2: parseInt(bondParts[2]),
                    type: bondParts[3]
                });
            }
        }
    }
    
    if (atoms.length === 0) {
        throw new Error('No atoms found in MOL2 file');
    }
    
    return {
        name: moleculeName,
        comment: comment,
        atoms: atoms,
        bonds: bonds,
        format: 'MOL2'
    };
}

// 解析PDB文件内容
function parsePDBFile(content) {
    const lines = content.split('\n');
    let moleculeName = 'Unknown Protein';
    let comment = '';
    const atoms = [];
    
    // 遍历文件的每一行
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 提取标题信息
        if (line.startsWith('HEADER')) {
            moleculeName = line.substring(10).trim();
        } else if (line.startsWith('TITLE')) {
            comment += line.substring(10).trim() + ' ';
        } else if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
            // 解析原子信息 - PDB格式的ATOM记录
            try {
                const atomId = parseInt(line.substring(6, 11).trim());
                const atomName = line.substring(12, 16).trim();
                // 提取元素符号 - 通常是原子名称的第一个字母或者前两个字符
                let symbol = atomName;
                if (atomName.length > 0) {
                    // 移除数字
                    symbol = atomName.replace(/[0-9]/g, '');
                    // 如果是以CA, CB等方式命名，取第一个字母
                    if (symbol.length > 1) {
                        symbol = symbol[0];
                    }
                }
                
                const resName = line.substring(17, 20).trim();
                const chainId = line.substring(21, 22).trim();
                const resSeq = parseInt(line.substring(22, 26).trim());
                const x = parseFloat(line.substring(30, 38).trim());
                const y = parseFloat(line.substring(38, 46).trim());
                const z = parseFloat(line.substring(46, 54).trim());
                
                atoms.push({
                    id: atomId,
                    seqNum: atomId, // 使用原子ID作为序列号
                    name: atomName,
                    symbol: symbol,
                    residue: resName,
                    chain: chainId,
                    resSeq: resSeq,
                    x: x,
                    y: y,
                    z: z
                });
            } catch (e) {
                console.error(`Error parsing atom at line ${i + 1}: ${e.message}`);
            }
        }
    }
    
    if (atoms.length === 0) {
        throw new Error('No atoms found in PDB file');
    }
    
    return {
        name: moleculeName,
        comment: comment,
        atoms: atoms,
        format: 'PDB'
    };
}