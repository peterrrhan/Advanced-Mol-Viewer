# Advanced 3D Molecular Viewer - Documentation

## Overview

The Advanced 3D Molecular Viewer is a web-based application that provides interactive visualization of molecular structures. This tool enables users to view, analyze, and interact with molecular data in three dimensions, making it valuable for research, education, and analysis in chemistry, biochemistry, and related fields.

## Key Features

### 1. 3D Molecular Visualization

- Support for multiple molecular file formats including MOL, MOL2, and PDB
- Interactive 3D rendering of complex molecular structures
- Real-time visualization powered by 3Dmol.js molecular viewer

### 2. Visualization Control Panel

- Multiple visualization styles:
  - **Stick**: Default mode showing bonds as cylindrical sticks
  - **Line**: Simple wire-frame representation
  - **Sphere**: Space-filling model with atoms shown as spheres
  - **Cartoon**: Ribbon representation for protein structures (PDB only)
- **Recenter** function to reset view orientation
- **Toggle Labels** to show/hide atom identifiers

### 3. Enhanced Interaction Features

- Highlight selected atoms in the 3D view
- Automatic removal of highlights when atoms are deselected
- Specialized display for protein data including residue and chain information
- Target selection system with individual or batch selection options

## How to Use

### 1. Upload Molecular Data

- Drag and drop a molecular file onto the upload area
- Alternatively, click the "Select File" button to browse for files
- Supported formats: MOL, MOL2, PDB, and properly formatted TXT files

### 2. View 3D Molecular Structure

- Once uploaded, the 3D structure will automatically render in the viewer
- Basic molecule information is displayed above the 3D view

### 3. Customize Visualization

- Use the control panel buttons to change display styles
- Toggle atom labels on/off as needed
- Recenter the molecule if it moves out of view
- Interact directly with the 3D model:
  - Rotate: Click and drag
  - Zoom: Scroll wheel
  - Pan: Right-click and drag (or Ctrl+drag)

### 4. Select Target Atoms

- Browse the list of atoms in the "Available Targets" section
- Click individual atoms to select/deselect them
- Use "Select All" button for batch selection
- Click "Add Selected Targets" to move selected atoms to the results list

### 5. View Selected Targets

- Selected atoms appear in the right panel with detailed information
- Selected atoms are highlighted in the 3D view
- Remove atoms from selection using the "Remove" button

### 6. Export Results

- Click "Export as TXT File" to save selected atom information
- The export includes detailed atom data formatted in a text file
- Timestamp and file information are included in the export

## Technical Implementation

- **3Dmol.js Integration**: Core 3D visualization powered by the 3Dmol.js library
- **Multi-format Support**: Custom parsers for MOL, MOL2, and PDB file formats
- **Interactive Selection**: Implementation of atom selection and highlighting
- **Responsive Design**: Maintains original website layout and aesthetics while adding powerful visualization features

## System Requirements

- Modern web browser with WebGL support
- JavaScript enabled
- Recommended browsers: Chrome, Firefox, Edge, Safari (latest versions)
- No installation required - runs entirely in the browser

## Tips for Optimal Usage

- For large molecules, the Stick or Line view may provide better performance
- Cartoon view is specifically designed for protein structures in PDB format
- When working with large files, wait for the complete rendering before interaction
- For detailed atom information, toggle labels on and navigate to the specific region of interest

------

© 2025 Advanced Molecular Viewer | Version 3.0
