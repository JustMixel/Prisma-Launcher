const fs = require("fs");
const { PNG } = require("pngjs");
const dir = "F:\\Games\\Zelda Remake\\Triforce\\Temp\\yeap-work\\register-solve2";
const canvas = PNG.sync.read(fs.readFileSync(`${dir}\\canvas.png`));
const W = canvas.width, H = canvas.height;
function br(x,y){const i=(y*W+x)*4;return 0.299*canvas.data[i]+0.587*canvas.data[i+1]+0.114*canvas.data[i+2];}
function maxDarkY(x, y0, y1, th){let m=-1;for(let y=y0;y<=y1;y++){if(br(x,y)<th)m=y;}return m;}
for (const th of [50,60,70,80]) {
  console.log(`--- threshold ${th} ---`);
  for (let x=205; x<=275; x+=2) {
    const m = maxDarkY(x, 50, 130, th);
    if (m>=0) process.stdout.write(`${x}:${m} `);
  }
  console.log("");
}
console.log("--- star ---");
for (let x=80; x<=140; x+=2) {
  const m = maxDarkY(x, 50, 130, 60);
  if (m>=0) process.stdout.write(`${x}:${m} `);
}
console.log("");
// print exact colors along vertical lines at puzzle hole x=245
for (const x of [220,225,230,235,240,245,250,255,260,265]) {
  const vals=[];
  for (let y=55;y<=115;y+=5){const i=(y*W+x)*4; vals.push(`y${y}=${canvas.data[i]},${canvas.data[i+1]},${canvas.data[i+2]}`);}
  console.log(`x=${x} `+vals.join(" | "));
}
