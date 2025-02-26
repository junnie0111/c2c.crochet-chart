import React, { useState, useEffect, useRef } from 'react';

const C2CPatternCreator = () => {
  const [gridSize, setGridSize] = useState({ width: 20, height: 20 });
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [grid, setGrid] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showNumbers, setShowNumbers] = useState(true);
  const [selectedYarn, setSelectedYarn] = useState('medium');
  const [showDiagonalGuides, setShowDiagonalGuides] = useState(true);
  const fileInputRef = useRef(null);

  // Color palette
  const colors = [
    '#FF0000', '#FF9900', '#FFFF00', 
    '#00FF00', '#0000FF', '#9900FF',
    '#FF00FF', '#FFFFFF', '#000000',
    '#CCCCCC', '#663300', '#006600'
  ];

  // Yarn types for crochet
  const yarnTypes = [
    { id: 'thread', name: 'Thread/Lace (Size 10, 20, 30)' },
    { id: 'fine', name: 'Fine/Sport (Size 2)' },
    { id: 'light', name: 'Light/DK (Size 3)' },
    { id: 'medium', name: 'Medium/Worsted (Size 4)' },
    { id: 'bulky', name: 'Bulky (Size 5)' },
    { id: 'super-bulky', name: 'Super Bulky (Size 6)' }
  ];

  // Initialize grid
  useEffect(() => {
    createNewGrid(gridSize.width, gridSize.height);
  }, [gridSize]);

  const createNewGrid = (width, height) => {
    const newGrid = Array(height).fill().map(() => Array(width).fill('#FFFFFF'));
    setGrid(newGrid);
  };

  const handleCellClick = (rowIndex, colIndex) => {
    const newGrid = [...grid];
    newGrid[rowIndex][colIndex] = selectedColor;
    setGrid(newGrid);
  };

  const handleMouseDown = (rowIndex, colIndex) => {
    setIsDrawing(true);
    handleCellClick(rowIndex, colIndex);
  };

  const handleMouseEnter = (rowIndex, colIndex) => {
    if (isDrawing) {
      handleCellClick(rowIndex, colIndex);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleSizeChange = (e) => {
    const { name, value } = e.target;
    setGridSize(prev => ({
      ...prev,
      [name]: parseInt(value, 10) || 1
    }));
  };

  const handleClear = () => {
    createNewGrid(gridSize.width, gridSize.height);
  };

  // Function to trigger file input click
  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  // Function to handle image upload and processing
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize the image to fit the current grid
        processImageToGrid(img);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Process the uploaded image and map it to the grid
  const processImageToGrid = (img) => {
    // Create a temporary canvas to process the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas to current grid size
    canvas.width = gridSize.width;
    canvas.height = gridSize.height;
    
    // Draw and resize the image to fit the grid
    ctx.drawImage(img, 0, 0, gridSize.width, gridSize.height);
    
    // Get the pixel data
    const imageData = ctx.getImageData(0, 0, gridSize.width, gridSize.height);
    const pixels = imageData.data;
    
    // Create a new grid based on the image
    const newGrid = Array(gridSize.height).fill().map(() => Array(gridSize.width).fill('#FFFFFF'));
    
    // Process each pixel and set grid colors
    for (let y = 0; y < gridSize.height; y++) {
      for (let x = 0; x < gridSize.width; x++) {
        const index = (y * gridSize.width + x) * 4;
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        
        // Convert RGB to hex
        const hex = rgbToHex(r, g, b);
        newGrid[y][x] = hex;
      }
    }
    
    setGrid(newGrid);
  };

  // Helper function to convert RGB to hex
  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  // Calculate which diagonal a cell is on (for C2C guides)
  // This creates diagonals starting from bottom-right
  const getCellDiagonal = (row, col) => {
    return (gridSize.height - 1 - row) + (gridSize.width - 1 - col);
  };

  // Export as PNG image
  const exportAsPNG = () => {
    // Create a canvas for the grid
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set the cell size (in pixels)
    const cellSize = 20;
    
    // Set canvas dimensions
    const offsetSize = showNumbers ? 40 : 0;
    canvas.width = gridSize.width * cellSize + offsetSize;
    canvas.height = gridSize.height * cellSize + offsetSize;
    
    // Fill background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw numbers if enabled - reversed order for C2C
    if (showNumbers) {
      ctx.font = '12px Arial';
      ctx.fillStyle = '#666666';
      
      // Draw column numbers (right to left)
      for (let i = 0; i < gridSize.width; i++) {
        ctx.fillText(String(gridSize.width - i), offsetSize + i * cellSize + cellSize / 2 - 4, 25);
      }
      
      // Draw row numbers (bottom to top)
      for (let i = 0; i < gridSize.height; i++) {
        ctx.fillText(String(gridSize.height - i), 25, offsetSize + i * cellSize + cellSize / 2 + 4);
      }
    }
    
    // Draw C2C diagonal guides if enabled
    if (showDiagonalGuides) {
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
      ctx.lineWidth = 1;
      
      const maxDiagonal = gridSize.width + gridSize.height - 2;
      for (let d = 0; d <= maxDiagonal; d += 2) {
        ctx.beginPath();
        
        for (let row = 0; row < gridSize.height; row++) {
          for (let col = 0; col < gridSize.width; col++) {
            if (row + col === d) {
              ctx.rect(
                offsetSize + col * cellSize, 
                offsetSize + row * cellSize, 
                cellSize, 
                cellSize
              );
            }
          }
        }
        
        ctx.stroke();
      }
    }
    
    // Draw grid cells
    for (let y = 0; y < gridSize.height; y++) {
      for (let x = 0; x < gridSize.width; x++) {
        // Fill cell with color
        ctx.fillStyle = grid[y][x];
        ctx.fillRect(offsetSize + x * cellSize, offsetSize + y * cellSize, cellSize, cellSize);
        
        // Draw cell border
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;
        ctx.strokeRect(offsetSize + x * cellSize, offsetSize + y * cellSize, cellSize, cellSize);
      }
    }
    
    // Convert canvas to data URL and download
    const dataURL = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `c2c-chart-${selectedYarn}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Export pattern data as JSON
  const exportAsJSON = () => {
    // Create a pattern object with all relevant data
    const patternData = {
      grid,
      size: gridSize,
      yarnType: selectedYarn,
      type: "c2c_crochet",
      timestamp: new Date().toISOString()
    };
    
    // Convert to JSON string
    const jsonString = JSON.stringify(patternData, null, 2);
    
    // Create a blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `c2c-chart-${selectedYarn}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Function to calculate C2C diagonal for bottom-right to top-left direction
  const generateWrittenInstructions = () => {
    // Get all unique colors used in the grid and assign them labels
    const usedColors = new Set();
    for (let y = 0; y < gridSize.height; y++) {
      for (let x = 0; x < gridSize.width; x++) {
        if (grid[y][x] !== '#FFFFFF') {
          usedColors.add(grid[y][x]);
        }
      }
    }
    
    // Create a map of colors to yarn labels
    const colorToYarnMap = {
      '#FF0000': 'Red',
      '#FF9900': 'Orange',
      '#FFFF00': 'Yellow',
      '#00FF00': 'Green',
      '#0000FF': 'Blue',
      '#9900FF': 'Purple',
      '#FF00FF': 'Pink',
      '#FFFFFF': 'White',
      '#000000': 'Black',
      '#CCCCCC': 'Gray',
      '#663300': 'Brown',
      '#006600': 'Dark Green'
    };
    
    const colorMap = {};
    Array.from(usedColors).forEach((color, index) => {
      const colorName = colorToYarnMap[color] || `Color ${index + 1}`;
      colorMap[color] = `${colorName} (Color ${index + 1})`;
    });
    
    // Color white represents "no stitch" or background
    colorMap['#FFFFFF'] = 'Background';
    
    let instructions = `C2C CROCHET PATTERN - WRITTEN INSTRUCTIONS\n\n`;
    instructions += `Pattern Size: ${gridSize.width} × ${gridSize.height} blocks\n`;
    instructions += `Yarn Weight: ${yarnTypes.find(y => y.id === selectedYarn).name}\n\n`;
    
    // Add color key
    instructions += `COLOR KEY:\n`;
    for (const [color, label] of Object.entries(colorMap)) {
      if (color !== '#FFFFFF') {
        instructions += `${label}: [HEX: ${color}]\n`;
      }
    }
    instructions += `\n`;
    
    // Add basic C2C instructions
    instructions += `BASIC C2C STITCHES:\n`;
    instructions += `Starting chain: ch 6\n`;
    instructions += `First block: dc in 4th ch from hook and in next 2 ch\n`;
    instructions += `Chain between blocks: ch 6\n`;
    instructions += `Standard block: dc in 4th ch from hook and in next 2 ch, slip stitch to corner ch-3 space of previous row, ch 3\n`;
    instructions += `Decreasing: slip stitch across the top of the last block, do not make a new block\n\n`;
    
    instructions += `PATTERN INSTRUCTIONS:\n`;
    instructions += `Note: Start in the bottom-right corner and work diagonally toward the top-left.\n\n`;
    
    // Calculate the maximum diagonal size (determines when to switch from increasing to decreasing)
    const maxDiagonalSize = Math.min(gridSize.width, gridSize.height);
    
    // Track the longest diagonal to know when to start decreasing
    const totalDiagonals = gridSize.width + gridSize.height - 1;
    
    // Generate row-by-row instructions
    instructions += `INCREASING SECTION:\n`;
    
    // For each diagonal row (from bottom-right to top-left)
    for (let diagonal = 0; diagonal < totalDiagonals; diagonal++) {
      let rowBlocks = [];
      let isDecreasing = false;
      
      // Determine if we're in the decreasing section
      if (diagonal >= gridSize.width && diagonal >= gridSize.height) {
        isDecreasing = true;
      } else if (diagonal >= gridSize.width) {
        isDecreasing = true;
      } else if (diagonal >= gridSize.height) {
        isDecreasing = true;
      }
      
      // If starting decreasing section, add a header
      if (isDecreasing && rowBlocks.length === 0 && diagonal > 0) {
        instructions += `\nDECREASING SECTION:\n`;
      }
      
      // Collect blocks for this diagonal (working from bottom-right to top-left)
      for (let i = 0; i <= diagonal; i++) {
        // Reverse the coordinates to start from bottom-right
        const row = gridSize.height - 1 - i;
        const col = gridSize.width - 1 - (diagonal - i);
        
        // Check if this cell is within grid bounds
        if (row >= 0 && col >= 0 && row < gridSize.height && col < gridSize.width) {
          const color = grid[row][col];
          rowBlocks.push({
            row: row,
            col: col,
            color: color,
            colorName: colorMap[color]
          });
        }
      }
      
      // If no blocks in this diagonal, skip
      if (rowBlocks.length === 0) continue;
      
      // Generate the instruction for this diagonal row
      const rowNum = diagonal + 1;
      
      if (isDecreasing) {
        instructions += `Row ${rowNum} (${rowBlocks.length} blocks, decrease): `;
      } else {
        instructions += `Row ${rowNum} (${rowBlocks.length} blocks, increase): `;
      }
      
      // Add color instructions
      const colorInstructions = [];
      let currentColor = null;
      let count = 0;
      
      for (let i = 0; i < rowBlocks.length; i++) {
        const block = rowBlocks[i];
        
        if (block.color !== '#FFFFFF') {
          if (currentColor === null) {
            currentColor = block.color;
            count = 1;
          } else if (block.color === currentColor) {
            count++;
          } else {
            // Add previous color group
            if (count === 1) {
              colorInstructions.push(`1 ${colorMap[currentColor]}`);
            } else {
              colorInstructions.push(`${count} ${colorMap[currentColor]}`);
            }
            currentColor = block.color;
            count = 1;
          }
        } else {
          // White/background color
          if (currentColor !== null) {
            // Add previous color group
            if (count === 1) {
              colorInstructions.push(`1 ${colorMap[currentColor]}`);
            } else {
              colorInstructions.push(`${count} ${colorMap[currentColor]}`);
            }
            currentColor = null;
            count = 0;
          }
        }
      }
      
      // Add the last color group if there is one
      if (currentColor !== null) {
        if (count === 1) {
          colorInstructions.push(`1 ${colorMap[currentColor]}`);
        } else {
          colorInstructions.push(`${count} ${colorMap[currentColor]}`);
        }
      }
      
      if (colorInstructions.length > 0) {
        instructions += colorInstructions.join(', ');
      } else {
        instructions += 'All background';
      }
      
      instructions += '\n';
    }
    
    instructions += `\nFinish off and weave in ends.\n`;
    
    return instructions;
  };

  // Export written instructions
  const exportWrittenInstructions = () => {
    const instructions = generateWrittenInstructions();
    
    // Create a blob and download
    const blob = new Blob([instructions], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `c2c-instructions-${selectedYarn}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Export pattern as printable PDF (simulated through HTML)
  const exportAsPrintable = () => {
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>C2C Crochet Chart</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .grid-container { margin: 20px 0; }
            .row { display: flex; }
            .cell { 
              width: 20px; 
              height: 20px; 
              border: 1px solid #ccc;
            }
            .diagonal-0 { background-color: rgba(200, 200, 200, 0.1); }
            .diagonal-1 { background-color: rgba(200, 200, 200, 0.2); }
            .number { 
              width: 20px; 
              height: 20px; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              font-size: 10px;
              color: #666;
            }
            .info {
              margin-bottom: 20px;
              font-size: 14px;
            }
            .instructions {
              margin-top: 30px;
              font-size: 14px;
              line-height: 1.5;
            }
            table.color-key {
              border-collapse: collapse;
              margin-top: 20px;
            }
            table.color-key td {
              border: 1px solid #ddd;
              padding: 8px;
            }
            .color-sample {
              width: 20px;
              height: 20px;
              display: inline-block;
              border: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <h1>C2C (Corner to Corner) Crochet Chart</h1>
          <div class="info">
            <p><strong>Yarn Weight:</strong> ${yarnTypes.find(y => y.id === selectedYarn).name}</p>
            <p><strong>Grid Size:</strong> ${gridSize.width} × ${gridSize.height}</p>
            <p><strong>Date Created:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="grid-container">
    `);
    
    // Add column numbers
    if (showNumbers) {
      printWindow.document.write('<div class="row"><div class="number"></div>');
      for (let i = 0; i < gridSize.width; i++) {
        printWindow.document.write(`<div class="number">${i + 1}</div>`);
      }
      printWindow.document.write('</div>');
    }
    
    // Get all unique colors used in the grid
    const usedColors = new Set();
    for (let y = 0; y < gridSize.height; y++) {
      for (let x = 0; x < gridSize.width; x++) {
        if (grid[y][x] !== '#FFFFFF') {
          usedColors.add(grid[y][x]);
        }
      }
    }
    const colorArray = Array.from(usedColors);
    
    // Add rows with cells
    for (let y = 0; y < gridSize.height; y++) {
      printWindow.document.write('<div class="row">');
      
      // Add row number
      if (showNumbers) {
        printWindow.document.write(`<div class="number">${y + 1}</div>`);
      }
      
      // Add cells
      for (let x = 0; x < gridSize.width; x++) {
        const diagonal = getCellDiagonal(y, x) % 2;
        const diagonalClass = showDiagonalGuides ? ` diagonal-${diagonal}` : '';
        printWindow.document.write(`<div class="cell${diagonalClass}" style="background-color: ${grid[y][x]}"></div>`);
      }
      
      printWindow.document.write('</div>');
    }
    
    // Add color key if there are colors used
    if (colorArray.length > 0) {
      printWindow.document.write(`
        <h2>Color Key</h2>
        <table class="color-key">
          <tr>
            <th>Color</th>
            <th>Sample</th>
          </tr>
      `);
      
      colorArray.forEach((color, index) => {
        printWindow.document.write(`
          <tr>
            <td>Color ${index + 1}</td>
            <td><div class="color-sample" style="background-color: ${color}"></div></td>
          </tr>
        `);
      });
      
      printWindow.document.write('</table>');
    }
    
    // Add C2C crochet instructions
    printWindow.document.write(`
      <div class="instructions">
        <h2>How to Read This C2C Chart</h2>
        <p>Corner to corner crochet works diagonally, starting from one corner and working to the opposite corner. Each square represents one "block" or "tile" in your work.</p>
        <p><strong>Starting:</strong> Begin at the bottom-right corner and work diagonally towards the top-left.</p>
        <p><strong>Increasing:</strong> Add one block at the beginning of each row until you reach the maximum width of the pattern.</p>
        <p><strong>Decreasing:</strong> After reaching the maximum width, decrease one block at the beginning of each row until you reach the opposite corner.</p>
        <p><strong>Color Changes:</strong> Change yarn color at the end of a block before making the chain for the next block.</p>
        <p><strong>Reading the Chart:</strong> Each diagonal line represents one row of blocks. The shaded diagonal lines help you see which blocks are worked together in one row.</p>
      </div>
      <button onclick="window.print()">Print Pattern</button>
    `);
    
    printWindow.document.write(`
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col p-4 bg-gray-100 rounded-lg shadow-md" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <h1 className="text-2xl font-bold mb-4 text-center">C2C Crochet Chart Creator</h1>
      
      {/* Main controls */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-md shadow">
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium">Width:</label>
          <input 
            type="number" 
            name="width" 
            value={gridSize.width} 
            onChange={handleSizeChange} 
            min="1" 
            max="40"
            className="p-1 border rounded w-20"
          />
        </div>
        
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium">Height:</label>
          <input 
            type="number" 
            name="height" 
            value={gridSize.height} 
            onChange={handleSizeChange} 
            min="1" 
            max="40"
            className="p-1 border rounded w-20"
          />
        </div>
        
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium">Show Numbers:</label>
          <input 
            type="checkbox" 
            checked={showNumbers} 
            onChange={() => setShowNumbers(!showNumbers)} 
            className="mt-2"
          />
        </div>
        
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium">Show C2C Diagonals:</label>
          <input 
            type="checkbox" 
            checked={showDiagonalGuides} 
            onChange={() => setShowDiagonalGuides(!showDiagonalGuides)} 
            className="mt-2"
          />
        </div>
        
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium">Yarn Weight:</label>
          <select 
            value={selectedYarn} 
            onChange={(e) => setSelectedYarn(e.target.value)}
            className="p-1 border rounded"
          >
            {yarnTypes.map(yarn => (
              <option key={yarn.id} value={yarn.id}>{yarn.name}</option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={handleClear} 
          className="px-4 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm self-end"
        >
          Clear Grid
        </button>
      </div>
      
      {/* Import/Export controls */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-md shadow">
        <div className="flex flex-col items-start">
          <label className="mb-1 text-sm font-medium">Import Image:</label>
          <button 
            onClick={handleImportClick} 
            className="px-4 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
          >
            Upload PNG
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload}
            accept="image/png"
            className="hidden"
          />
        </div>
        
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium">Export As:</label>
          <div className="flex gap-2 flex-wrap">
            <button 
              onClick={exportAsPNG} 
              className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
            >
              PNG
            </button>
            <button 
              onClick={exportAsJSON} 
              className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
            >
              JSON
            </button>
            <button 
              onClick={exportAsPrintable} 
              className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
            >
              Printable
            </button>
            <button 
              onClick={exportWrittenInstructions} 
              className="px-4 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm"
            >
              Written Instructions
            </button>
          </div>
        </div>
      </div>
      
      {/* Color selection */}
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">Select Color:</h2>
        <div className="flex flex-wrap gap-2">
          {colors.map((color, index) => (
            <div 
              key={index} 
              className={`w-8 h-8 cursor-pointer border-2 ${selectedColor === color ? 'border-black' : 'border-gray-300'}`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
      </div>
      
      {/* Grid */}
      <div className="overflow-auto p-4 bg-white rounded-md shadow">
        <div className="inline-block">
          {/* Top column numbers - reversed order (right to left) */}
          {showNumbers && (
            <div className="flex">
              <div className="w-8 h-8 flex-none"></div>
              {Array(gridSize.width).fill().map((_, i) => (
                <div 
                  key={i} 
                  className="w-6 h-6 flex-none text-center text-xs font-medium text-gray-600"
                >
                  {gridSize.width - i}
                </div>
              ))}
            </div>
          )}
          
          {/* Grid with row numbers - reversed order (bottom to top) */}
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {/* Row numbers - count from bottom to top */}
              {showNumbers && (
                <div className="w-8 h-6 flex-none text-center text-xs font-medium text-gray-600 flex items-center justify-center">
                  {gridSize.height - rowIndex}
                </div>
              )}
              
              {/* Grid cells */}
              {row.map((cell, colIndex) => {
                const diagonal = getCellDiagonal(rowIndex, colIndex);
                const isDiagonalHighlighted = showDiagonalGuides && diagonal % 2 === 0;
                
                return (
                  <div 
                    key={colIndex} 
                    className={`w-6 h-6 flex-none border border-gray-300 cursor-pointer ${isDiagonalHighlighted ? 'bg-gray-100' : ''}`}
                    style={{ backgroundColor: cell }}
                    onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                    onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>How to use:</strong> Click and drag to color blocks on the grid. The diagonal guides show C2C working rows.</p>
        <p><strong>C2C Pattern:</strong> Start at the bottom-right corner (numbered 1,1) and work diagonally to the top-left corner.</p>
        <p><strong>Grid Numbering:</strong> Numbers run from right to left and bottom to top to match standard C2C working direction.</p>
        <p><strong>Export Options:</strong></p>
        <ul className="list-disc pl-6 mt-2">
          <li><strong>PNG:</strong> Image of your pattern chart with grid lines and colors</li>
          <li><strong>JSON:</strong> Save your pattern data for future editing</li>
          <li><strong>Printable:</strong> A printable page with pattern chart and color key</li>
          <li><strong>Written Instructions:</strong> Row-by-row text instructions for each diagonal row</li>
        </ul>
      </div>
    </div>
  );
};

export default C2CPatternCreator;
