const TEMPLATES = [
  {
    id: 'livingroom',
    thumbFile: 'templates/template-1-livingroom-thumb.jpg',
    fullFile: 'templates/template-1-livingroom.jpg',
    name: 'Living Room',
    imgW: 4000,
    imgH: 6000,
    wallRealW: 3200,
    anchorX: 2000,
    anchorY: 2400,
  },
  {
    id: 'minimal',
    thumbFile: 'templates/template-2-minimal-thumb.jpg',
    fullFile: 'templates/template-2-minimal.jpg',
    name: 'Minimal',
    imgW: 3358,
    imgH: 2874,
    wallRealW: 2800,
    anchorX: 1679,
    anchorY: 1100,
  },
  {
    id: 'brick',
    thumbFile: 'templates/template-3-brick-thumb.jpg',
    fullFile: 'templates/template-3-brick.jpg',
    name: 'Brick Wall',
    imgW: 4032,
    imgH: 3024,
    wallRealW: 3000,
    anchorX: 2016,
    anchorY: 1200,
  },
  {
    id: 'dark',
    thumbFile: 'templates/template-4-dark-thumb.jpg',
    fullFile: 'templates/template-4-dark.jpg',
    name: 'Dark Room',
    imgW: 3024,
    imgH: 4032,
    wallRealW: 2600,
    anchorX: 1512,
    anchorY: 1600,
  },
  {
    id: 'warm',
    thumbFile: 'templates/template-5-warm-thumb.jpg',
    fullFile: 'templates/template-5-warm.jpg',
    name: 'Warm Room',
    imgW: 3456,
    imgH: 5184,
    wallRealW: 3000,
    anchorX: 1728,
    anchorY: 2000,
  },
];

const PAPER_SIZES = {
  A5: { w: 148, h: 210 },
  A4: { w: 210, h: 297 },
  A3: { w: 297, h: 420 },
  A2: { w: 420, h: 594 },
};

const FRAME_STYLES = {
  none:  { width: 0,  color: 'transparent', shadow: false },
  black: { width: 12, color: '#111111',     shadow: true  },
  white: { width: 12, color: '#f0f0f0',     shadow: true  },
  wood:  { width: 14, color: '#8B5E3C',     shadow: true  },
};

let state = {
  designImg: null,
  paperSize: 'A4',
  orientation: 'portrait',
  templateIndex: 0,
  frameStyle: 'none',
  templateImgCache: {},
};

const fileInput     = document.getElementById('fileInput');
const uploadZone    = document.getElementById('uploadZone');
const uploadContent = document.getElementById('uploadContent');
const uploadPreview = document.getElementById('uploadPreview');
const previewHint   = document.getElementById('previewHint');
const canvas        = document.getElementById('mockupCanvas');
const ctx           = canvas.getContext('2d');
const templateGrid  = document.getElementById('templateGrid');
const downloadPng   = document.getElementById('downloadPng');
const downloadJpg   = document.getElementById('downloadJpg');

/* ========================================
   INIT: Template thumbnails
   ======================================== */
function initTemplates() {
  TEMPLATES.forEach((tpl, i) => {
    const thumb = document.createElement('div');
    thumb.className = 'template-thumb' + (i === 0 ? ' active' : '');
    thumb.innerHTML = `
      <img src="${tpl.thumbFile}" alt="${tpl.name}" loading="lazy">
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
   FILE UPLOAD
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
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length) handleFile(fileInput.files[0]);
});

function handleFile(file) {
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
      uploadPreview.src = e.target.result;
      uploadPreview.classList.add('visible');
      uploadContent.classList.add('hidden');
      renderMockup();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* ========================================
   BUTTON HANDLERS
   ======================================== */
function setupButtons(selector, key, valueAttr) {
  const btns = document.querySelectorAll(`${selector} .option-btn`);
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state[key] = btn.dataset[valueAttr];
      renderMockup();
    });
  });
}

setupButtons('#sizeButtons', 'paperSize', 'size');
setupButtons('#orientationButtons', 'orientation', 'orient');
setupButtons('#frameButtons', 'frameStyle', 'frame');

/* ========================================
   LOAD FULL-RES TEMPLATE (cached)
   ======================================== */
function loadTemplateImage(tpl) {
  return new Promise((resolve) => {
    if (state.templateImgCache[tpl.id]) {
      resolve(state.templateImgCache[tpl.id]);
      return;
    }
    const img = new Image();
    img.onload = () => {
      state.templateImgCache[tpl.id] = img;
      resolve(img);
    };
    img.src = tpl.fullFile;
  });
}

/* ========================================
   RENDER MOCKUP
   
   Canvas is FULL RESOLUTION internally.
   CSS max-width scales it down visually.
   Download grabs the full-res canvas directly.
   ======================================== */
async function renderMockup() {
  if (!state.designImg) return;

  const tpl   = TEMPLATES[state.templateIndex];
  const paper = PAPER_SIZES[state.paperSize];
  const frame = FRAME_STYLES[state.frameStyle];

  const bgImg = await loadTemplateImage(tpl);

  // Canvas = full original resolution
  canvas.width  = tpl.imgW;
  canvas.height = tpl.imgH;

  // Draw room
  ctx.drawImage(bgImg, 0, 0, tpl.imgW, tpl.imgH);

  // Scale: pixels per mm
  const pxPerMm = tpl.imgW / tpl.wallRealW;

  // Paper in pixels
  let paperPxW, paperPxH;
  if (state.orientation === 'portrait') {
    paperPxW = paper.w * pxPerMm;
    paperPxH = paper.h * pxPerMm;
  } else {
    paperPxW = paper.h * pxPerMm;
    paperPxH = paper.w * pxPerMm;
  }

  // Frame
  const framePx = frame.width * pxPerMm;
  const totalW  = paperPxW + framePx * 2;
  const totalH  = paperPxH + framePx * 2;

  // Position centered on anchor
  const x = tpl.anchorX - totalW / 2;
  const y = tpl.anchorY - totalH / 2;

  // Shadow
  if (frame.shadow) {
    ctx.save();
    ctx.shadowColor   = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur    = 25 * pxPerMm;
    ctx.shadowOffsetX = 4 * pxPerMm;
    ctx.shadowOffsetY = 6 * pxPerMm;
    ctx.fillStyle = frame.color;
    ctx.fillRect(x, y, totalW, totalH);
    ctx.restore();
  }

  // Frame border
  if (framePx > 0) {
    ctx.fillStyle = frame.color;
    ctx.fillRect(x, y, totalW, totalH);
  }

  // Art area
  const artX = x + framePx;
  const artY = y + framePx;

  // White bg for transparent PNGs
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(artX, artY, paperPxW, paperPxH);

  // Draw design
  ctx.drawImage(state.designImg, artX, artY, paperPxW, paperPxH);

  // Inner border
  if (frame.shadow) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth   = 1.5 * pxPerMm;
    ctx.strokeRect(artX, artY, paperPxW, paperPxH);
    ctx.restore();
  }

  // Show
  canvas.classList.add('visible');
  previewHint.classList.add('hidden');
}

/* ========================================
   DOWNLOAD — Just grab the canvas directly
   It's already full resolution!
   ======================================== */
function downloadMockup(format) {
  if (!state.designImg) {
    alert('Please upload a design first!');
    return;
  }
  const tpl  = TEMPLATES[state.templateIndex];
  const link = document.createElement('a');

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
