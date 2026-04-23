/* ========================================
   TEMPLATE CONFIGURATION
   
   Each template defines:
   - file: image filename
   - name: display name
   - imgW / imgH: actual image pixel dimensions
   - wallRealW: estimated real-world wall width in mm
   - anchorX / anchorY: pixel coordinates of the 
     center point where art should hang
   ======================================== */

const TEMPLATES = [
  {
    id: 'livingroom',
    file: 'templates/template-1-livingroom.jpg',
    name: 'Living Room',
    imgW: 4000,
    imgH: 6000,
    wallRealW: 3200,       // mm (estimated visible wall width)
    anchorX: 2000,         // center of wall (pixels)
    anchorY: 2400,         // typical hanging height (pixels)
  },
  {
    id: 'minimal',
    file: 'templates/template-2-minimal.jpg',
    name: 'Minimal',
    imgW: 3358,
    imgH: 2874,
    wallRealW: 2800,
    anchorX: 1679,
    anchorY: 1100,
  },
  {
    id: 'brick',
    file: 'templates/template-3-brick.jpg',
    name: 'Brick Wall',
    imgW: 4032,
    imgH: 3024,
    wallRealW: 3000,
    anchorX: 2016,
    anchorY: 1200,
  },
  {
    id: 'dark',
    file: 'templates/template-4-dark.jpg',
    name: 'Dark Room',
    imgW: 3024,
    imgH: 4032,
    wallRealW: 2600,
    anchorX: 1512,
    anchorY: 1600,
  },
  {
    id: 'warm',
    file: 'templates/template-5-warm.jpg',
    name: 'Warm Room',
    imgW: 3456,
    imgH: 5184,
    wallRealW: 3000,
    anchorX: 1728,
    anchorY: 2000,
  },
];

/* ========================================
   PAPER SIZES (mm)
   ======================================== */
const PAPER_SIZES = {
  A5: { w: 148, h: 210 },
  A4: { w: 210, h: 297 },
  A3: { w: 297, h: 420 },
  A2: { w: 420, h: 594 },
};

/* ========================================
   FRAME STYLES
   ======================================== */
const FRAME_STYLES = {
  none: { width: 0, color: 'transparent', shadow: false },
  black: { width: 12, color: '#111111', shadow: true },
  white: { width: 12, color: '#f0f0f0', shadow: true },
  wood: { width: 14, color: '#8B5E3C', shadow: true },
};

/* ========================================
   STATE
   ======================================== */
let state = {
  designImg: null,
  paperSize: 'A4',
  orientation: 'portrait',
  templateIndex: 0,
  frameStyle: 'none',
};

/* ========================================
   DOM ELEMENTS
   ======================================== */
const fileInput = document.getElementById('fileInput');
const uploadZone = document.getElementById('uploadZone');
const uploadContent = document.getElementById('uploadContent');
const uploadPreview = document.getElementById('uploadPreview');
const previewHint = document.getElementById('previewHint');
const canvas = document.getElementById('mockupCanvas');
const ctx = canvas.getContext('2d');
const sizeButtons = document.querySelectorAll('.size-btn');
const orientButtons = document.querySelectorAll('.orient-btn');
const frameButtons = document.querySelectorAll('.frame-btn');
const templateGrid = document.getElementById('templateGrid');
const downloadPng = document.getElementById('downloadPng');
const downloadJpg = document.getElementById('downloadJpg');

/* ========================================
   INIT: Build template thumbnails
   ======================================== */
function initTemplates() {
  TEMPLATES.forEach((tpl, i) => {
    const thumb = document.createElement('div');
    thumb.className = 'template-thumb' + (i === 0 ? ' active' : '');
    thumb.dataset.index = i;
    thumb.innerHTML = `
      <img src="${tpl.file}" alt="${tpl.name}" loading="lazy">
      <div class="template-label">${tpl.name}</div>
    `;
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.template-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      state.templateIndex = i;
      renderMockup();
    });
    templateGrid.appendChild(thumb);
  });
}

/* ========================================
   FILE UPLOAD (Click + Drag & Drop)
   ======================================== */
uploadZone.addEventListener('click', () => fileInput.click());

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  if (e.dataTransfer.files.length) {
    handleFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length) {
    handleFile(fileInput.files[0]);
  }
});

function handleFile(file) {
  // Validate file type
  const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    alert('Please upload a PNG, JPG, or SVG file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      state.designImg = img;

      // Show preview thumbnail
      uploadPreview.src = e.target.result;
      uploadPreview.classList.add('visible');
      uploadContent.classList.add('hidden');

      renderMockup();
    };

    // Handle SVG specially — convert to data URL with proper dimensions
    if (file.type === 'image/svg+xml') {
      // For SVG, we create a blob URL
      img.src = e.target.result;
    } else {
      img.src = e.target.result;
    }
  };
  reader.readAsDataURL(file);
}

/* ========================================
   BUTTON HANDLERS
   ======================================== */
// Paper size
sizeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    sizeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.paperSize = btn.dataset.size;
    renderMockup();
  });
});

// Orientation
orientButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    orientButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.orientation = btn.dataset.orient;
    renderMockup();
  });
});

// Frame style
frameButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    frameButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.frameStyle = btn.dataset.frame;
    renderMockup();
  });
});

/* ========================================
   CORE: Render Mockup
   ======================================== */
function renderMockup() {
  if (!state.designImg) return;

  const tpl = TEMPLATES[state.templateIndex];
  const paper = PAPER_SIZES[state.paperSize];
  const frame = FRAME_STYLES[state.frameStyle];

  // Load template image
  const bgImg = new Image();
  bgImg.onload = () => {
    // Set canvas to template image size
    canvas.width = tpl.imgW;
    canvas.height = tpl.imgH;

    // Draw background
    ctx.drawImage(bgImg, 0, 0, tpl.imgW, tpl.imgH);

    // Calculate pixels per mm based on wall width
    const pxPerMm = tpl.imgW / tpl.wallRealW;

    // Get paper dimensions in pixels (respecting orientation)
    let paperPxW, paperPxH;
    if (state.orientation === 'portrait') {
      paperPxW = paper.w * pxPerMm;
      paperPxH = paper.h * pxPerMm;
    } else {
      paperPxW = paper.h * pxPerMm;
      paperPxH = paper.w * pxPerMm;
    }

    // Frame border width scaled proportionally
    const framePx = frame.width * pxPerMm;

    // Total frame + art dimensions
    const totalW = paperPxW + framePx * 2;
    const totalH = paperPxH + framePx * 2;

    // Position: centered on anchor point
    const x = tpl.anchorX - totalW / 2;
    const y = tpl.anchorY - totalH / 2;

    // Draw shadow
    if (frame.shadow) {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 30 * pxPerMm;
      ctx.shadowOffsetX = 5 * pxPerMm;
      ctx.shadowOffsetY = 8 * pxPerMm;
      ctx.fillStyle = frame.color;
      ctx.fillRect(x, y, totalW, totalH);
      ctx.restore();
    }

    // Draw frame border
    if (framePx > 0) {
      ctx.fillStyle = frame.color;
      ctx.fillRect(x, y, totalW, totalH);
    }

    // Draw the art (inside the frame)
    const artX = x + framePx;
    const artY = y + framePx;
    ctx.drawImage(state.designImg, artX, artY, paperPxW, paperPxH);

    // Optional: add a subtle inner shadow to the art for realism
    if (frame.shadow) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 2 * pxPerMm;
      ctx.strokeRect(artX, artY, paperPxW, paperPxH);
      ctx.restore();
    }

    // Show canvas
    canvas.classList.add('visible');
    previewHint.classList.add('hidden');
  };
  bgImg.src = tpl.file;
}

/* ========================================
   DOWNLOAD HANDLERS
   ======================================== */
function downloadMockup(format) {
  if (!state.designImg) {
    alert('Please upload a design first!');
    return;
  }

  const link = document.createElement('a');
  const tpl = TEMPLATES[state.templateIndex];

  if (format === 'png') {
    link.download = `mockup-${tpl.id}-${state.paperSize}.png`;
    link.href = canvas.toDataURL('image/png');
  } else {
    link.download = `mockup-${tpl.id}-${state.paperSize}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.92);
  }

  link.click();
}

downloadPng.addEventListener('click', () => downloadMockup('png'));
downloadJpg.addEventListener('click', () => downloadMockup('jpg'));

/* ========================================
   INIT
   ======================================== */
initTemplates();
