import { mkdir, writeFile } from 'node:fs/promises';

const root = new URL('../client-assets/', import.meta.url);
const svg = (body, viewBox = '0 0 24 24') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`;
const paths = {
  logo:'<path d="M4 19V9l8-5 8 5v10M2.5 20.5h19"/><path d="m8 12 5-5 3 3-5 5zM6.5 16.5l4-4M14.5 11.5l3 3"/>',
  coin:'<ellipse cx="12" cy="7" rx="6.5" ry="2.5"/><path d="M5.5 7v4c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5V7M5.5 11v4c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-4"/>',
  fame:'<path d="M9 19c-4-2-5-6-4-10M7 16l-3-1M6 12 3-1M15 19c4-2 5-6 4-10M17 16l3-1M18 12l-3-1"/><path d="m12 5 1.1 2.2 2.4.4-1.8 1.8.5 2.5-2.2-1.2-2.2 1.2.5-2.5-1.8-1.8 2.4-.4z"/>',
  xp:'<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  'box-basic':'<path d="M4 8h16v12H4zM3 5h18v4H3zM12 5v15M8 5c-2-2-1-3 0-3 2 0 4 3 4 3M16 5c2-2 1-3 0-3-2 0-4 3-4 3"/>',
  'box-fine':'<path d="M4 8h16v12H4zM3 5h18v4H3zM12 5v15"/><path d="m12 2 1 2 2 .3-1.5 1.5.4 2.2L12 7l-1.9 1 .4-2.2L9 4.3 11 4z"/>',
  order:'<path d="M7 4h10v17H4V4h3M9 2h6v4H9zM8 11h5M8 15h4"/><path d="m14 17 5-5 2 2-5 5-3 1z"/>',
  gavel:'<path d="m14 5 5 5M12 7l5 5M13 6l-7 7 4 4 7-7M8 15l-5 5M2 21h9"/>',
  featured:'<path d="m12 2 2 4 4-2-.2 4.5L22 10l-3 3 3 3-4.2 1.5L18 22l-4-2-2 4-2-4-4 2 .2-4.5L2 16l3-3-3-3 4.2-1.5L6 4l4 2z"/><path d="m12 8 1.5 3 3.5.5-2.5 2.4.6 3.4-3.1-1.6-3.1 1.6.6-3.4L7 11.5l3.5-.5z"/>',
  peek:'<path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5z"/><circle cx="12" cy="12" r="2.5"/>',
  shield:'<path d="M12 2 20 5v6c0 5-3.4 8.5-8 11-4.6-2.5-8-6-8-11V5z"/>',
  refund:'<path d="M4 8V3m0 0h5M4 3l4 4M5 13a7 7 0 1 0 2-5"/><path d="M12 9v6m-2-1h3a1.5 1.5 0 0 0 0-3h-2a1.5 1.5 0 0 1 0-3h3"/>',
  tax:'<path d="M5 3h14v18H5zM8 7h8M8 11h2M14 11h2M8 15h2M14 15h2"/>',
  block:'<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  appraise:'<path d="M4 5h10v14H4zM7 9h4M7 13h3"/><circle cx="16" cy="15" r="4"/><path d="m19 18 3 3"/>',
  'coin-ability':'<circle cx="12" cy="12" r="8"/><path d="M12 7v10m-3-2h5a2 2 0 0 0 0-4h-4a2 2 0 0 1 0-4h5"/><path d="m19 4 .5 1.5L21 6l-1.5.5L19 8l-.5-1.5L17 6l1.5-.5z"/>',
  cooldown:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2M8 2h8"/>',
  skull:'<path d="M5 11a7 7 0 1 1 14 0c0 3-2 4-3 5v4h-3v-3h-2v3H8v-4c-1-1-3-2-3-5z"/><circle cx="9" cy="11" r="1"/><circle cx="15" cy="11" r="1"/>',
  timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v5l3 2M9 2h6M12 5V2"/>',
  bid:'<path d="M4 4h16v16H4zM8 16h8M12 7v7m-2-1h3a1.5 1.5 0 0 0 0-3h-2a1.5 1.5 0 0 1 0-3h3"/>',
  list:'<path d="M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1"/>'
};
for(let i=1;i<=5;i++) paths[`heat-${i}`]=Array.from({length:5},(_,j)=>`<path d="M${3+j*4.2} ${18-j*2}v-${2+j*2}"${j<i?' stroke-opacity="1"':' stroke-opacity=".25"'}/>`).join('');

const glyphs={
  gavel:'<path d="m8 7 4-4 5 5-4 4zM11 10l-7 7M3 20h9"/>', gem:'<path d="m4 8 4-5h8l4 5-8 13zM4 8h16M8 3l4 5 4-5M12 8v13"/>',
  coin:'<circle cx="12" cy="12" r="8"/><path d="M12 7v10m-3-2h5a2 2 0 0 0 0-4h-4a2 2 0 0 1 0-4h5"/>', star:'<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  mask:'<path d="M4 7c5-3 11-3 16 0l-1 8c-2 4-5 5-7 2-2 3-5 2-7-2zM7 11l3 1M17 11l-3 1"/>', key:'<circle cx="8" cy="9" r="4"/><path d="m11 12 8 8m-3-3 2-2m-5-1 2-2"/>',
  flame:'<path d="M13 2c1 5-3 6-1 10 1-3 4-3 4-7 4 4 5 9 2 13-3 4-9 4-12 0-4-6 2-10 7-16z"/>', book:'<path d="M3 5c4-1 7 0 9 2v14c-2-2-5-3-9-2zM21 5c-4-1-7 0-9 2v14c2-2 5-3 9-2z"/>',
  crown:'<path d="m3 7 5 4 4-7 4 7 5-4-2 11H5zM5 21h14"/>', anchor:'<path d="M12 5v16M8 8h8M4 14c0 5 3 7 8 7s8-2 8-7M4 14l-2 3M20 14l2 3"/><circle cx="12" cy="4" r="2"/>',
  moon:'<path d="M18 16a8 8 0 0 1-10-10 8 8 0 1 0 10 10z"/>', comet:'<path d="M3 18 12 9M2 13l8-5M7 21l5-8"/><circle cx="15" cy="8" r="5"/>'
};
const frame=(color,extra='')=>svg(`<rect x="2" y="2" width="92" height="116" rx="5" stroke="${color}" stroke-width="2"/><path d="M7 18V9h9M80 9h9v9M89 102v9h-9M16 111H7v-9" stroke="${color}"/>${extra}`,'0 0 96 120');

await Promise.all(['icons','sigils','frames'].map(d=>mkdir(new URL(`${d}/`,root),{recursive:true})));
await Promise.all(Object.entries(paths).map(([n,b])=>writeFile(new URL(`icons/${n}.svg`,root),svg(b))));
await writeFile(new URL('sigils/sigil-base.svg',root),svg('<path d="M12 2 21 5v6c0 5.5-3.8 9-9 11-5.2-2-9-5.5-9-11V5z"/><path d="M7 7h10M12 3v18" opacity=".35"/>'));
await Promise.all(Object.entries(glyphs).map(([n,b])=>writeFile(new URL(`sigils/glyph-${n}.svg`,root),svg(b))));
await writeFile(new URL('frames/t1.svg',root),frame('#8A8A93'));
await writeFile(new URL('frames/t2.svg',root),frame('#5C9E6E'));
await writeFile(new URL('frames/t3.svg',root),frame('#5E8FD4'));
await writeFile(new URL('frames/t4.svg',root),frame('#C476E8','<rect x="4.5" y="4.5" width="87" height="111" rx="4" stroke="#D4A24E" stroke-width="1.5" stroke-dasharray="3 4"/>'));
await writeFile(new URL('frames/ribbon-fake-owner.svg',root),svg('<path d="M2 2h20L2 22z" fill="#C94F4F" stroke="#C94F4F"/><path d="m6 7 5 5M11 7l-5 5" stroke="#EDE6F5"/>'));
await writeFile(new URL('frames/seal-appraised.svg',root),svg('<path d="m12 2 2 2 3-.5.8 2.8 2.7 1.2-1 2.8 1.5 2.5-2 2.2.5 3-3 .5-1.5 2.5-2.5-1.5-2.5 1.5-1.5-2.5-3-.5.5-3-2-2.2 1.5-2.5-1-2.8 2.7-1.2.8-2.8 3 .5z" fill="#D4A24E" stroke="#F2C879"/><path d="m8.5 12 2.2 2.2 4.8-5" stroke="#14101A"/>'));
console.log(`Generated ${Object.keys(paths).length+Object.keys(glyphs).length+4+2+1} SVG assets.`);
