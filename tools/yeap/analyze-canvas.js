const fs = require("fs");
const { PNG } = require("pngjs");

const dir = "F:\\Games\\Zelda Remake\\Triforce\\Temp\\yeap-work\\register-solve2";
const canvas = PNG.sync.read(fs.readFileSync(`${dir}\\canvas.png`));
const piece = PNG.sync.read(fs.readFileSync(`${dir}\\piece.png`));

function brightness(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }
const W = canvas.width, H = canvas.height;
console.log("canvas", W, H, "piece", piece.width, piece.height);

// piece alpha bbox and mask
const pw = piece.width, ph = piece.height;
const mask = [];
let pminX = pw, pminY = ph, pmaxX = 0, pmaxY = 0;
for (let y = 0; y < ph; y++) {
  for (let x = 0; x < pw; x++) {
    const i = (y * pw + x) * 4;
    if (piece.data[i + 3] > 128) {
      mask.push([x, y]);
      if (x < pminX) pminX = x;
      if (x > pmaxX) pmaxX = x;
      if (y < pminY) pminY = y;
      if (y > pmaxY) pmaxY = y;
    }
  }
}
console.log("piece mask", mask.length, "bbox", pminX, pminY, pmaxX, pmaxY);

// dark components
const dark = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 4;
  if (brightness(canvas.data[i], canvas.data[i+1], canvas.data[i+2]) < 110) dark[y * W + x] = 1;
}
const seen = new Uint8Array(W * H);
const comps = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const idx = y * W + x;
  if (!dark[idx] || seen[idx]) continue;
  const stack = [[x, y]]; seen[idx] = 1;
  let minX = x, maxX = x, minY = y, maxY = y, count = 0;
  const pixels = [];
  while (stack.length) {
    const [cx, cy] = stack.pop(); count++; pixels.push([cx, cy]);
    if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
    if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const ni = ny * W + nx;
      if (dark[ni] && !seen[ni]) { seen[ni] = 1; stack.push([nx, ny]); }
    }
  }
  if (count > 150) comps.push({ minX, maxX, minY, maxY, w: maxX-minX+1, h: maxY-minY+1, count });
}
comps.sort((a,b) => b.count - a.count);
console.log("components:", JSON.stringify(comps, null, 2));

// score the piece mask against each component bbox (all positions, using component dark pixels)
function scoreAt(ox, oy) {
  let hit = 0, miss = 0;
  for (const [px, py] of mask) {
    const x = ox + px, y = oy + py;
    if (x >= 0 && y >= 0 && x < W && y < H && dark[y * W + x]) hit++; else miss++;
  }
  const maskSet = new Set(mask.map(([x,y]) => `${x},${y}`));
  let extra = 0;
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
    if (maskSet.has(`${x},${y}`)) continue;
    const cx = ox + x, cy = oy + y;
    if (cx >= 0 && cy >= 0 && cx < W && cy < H && dark[cy * W + cx]) extra++;
  }
  return { ox, oy, hit, miss, extra, score: hit - 2*extra - 2*miss, iou: hit/(hit+extra+miss) };
}

const results = [];
for (let oy = 0; oy <= H - ph; oy++) {
  for (let ox = 0; ox <= W - pw; ox++) {
    // quick prune: require at least half the mask hits
    let hit = 0;
    for (const [px, py] of mask) {
      if (dark[(oy+py)*W + (ox+px)]) hit++;
      if (hit < mask.length * 0.35) break;
    }
    if (hit < mask.length * 0.35) continue;
    results.push(scoreAt(ox, oy));
  }
}
results.sort((a,b) => b.score - a.score);
console.log("TOP 15:", JSON.stringify(results.slice(0,15), null, 2));
