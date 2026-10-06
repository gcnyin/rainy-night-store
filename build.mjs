/* 把 three.js(UMD) + 分模块源码 拼成单文件 HTML */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = here;                 // 输出与源码同目录，不再写到上一级
const out = path.join(root, 'index.html');

const three = fs.readFileSync(path.join(here, 'vendor', 'three.min.js'), 'utf8');
const files = fs.readdirSync(path.join(here, 'src')).filter((f) => f.endsWith('.js')).sort();
const app = files.map((f) => '\n/* ===== ' + f + ' ===== */\n' + fs.readFileSync(path.join(here, 'src', f), 'utf8')).join('\n');

let html = fs.readFileSync(path.join(here, 'template.html'), 'utf8');
html = html.split('/*__THREE__*/').join(three).split('/*__APP__*/').join(app);

fs.writeFileSync(out, html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log('built -> ' + path.relative(root, out) + '  (' + kb + ' KB, ' + files.length + ' modules, ' + app.split('\n').length + ' lines app)');
