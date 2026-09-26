import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const b64 = fs.readFileSync(
  path.join(root, 'public/styleguide/assets/signatures/scttrd-logo-kreis-64.png'),
  'base64',
);

const wrap = (title, body) => `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:24px;font-family:Arial,Helvetica,sans-serif;">
${body}
</body>
</html>
`;

const logoCell = `<a href="https://scttrd.de" style="text-decoration:none;"><img src="data:image/png;base64,${b64}" width="52" height="52" alt="SCTTRD" style="display:block;border:0;"></a>`;

function scttrdSignature({ name, role, pressLinks = false }) {
  const nameBlock = name
    ? `<div style="font-size:15px;font-weight:700;line-height:1.25;color:#0c0c0c;">${name}</div>
      <div style="font-size:13px;line-height:1.4;color:#0c0c0c;margin-top:2px;">${role} &#183; SCTTRD</div>`
    : '';
  const press = pressLinks
    ? ` <span style="color:#6b6a66;"> &#183; </span> <a href="https://scttrd.de/styleguide/#presse" style="color:#0c0c0c;text-decoration:underline;">Press Pack</a> <span style="color:#6b6a66;"> &#183; </span> <a href="https://scttrd.de/styleguide/assets/rider/scttrd-foh-rider.html" style="color:#0c0c0c;text-decoration:underline;">Rider</a>`
    : '';

  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#0c0c0c;border-collapse:collapse;">
  <tr>
    <td style="padding:0 16px 0 0;vertical-align:top;">${logoCell}</td>
    <td style="vertical-align:top;border-left:3px solid #ff0000;padding:0 0 0 16px;">
      ${nameBlock}
      <div style="font-size:16px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;line-height:1.2;color:#0c0c0c;margin-top:${name ? '10' : '0'}px;">SCTTRD</div>
      <div style="font-size:13px;line-height:1.4;color:#6b6a66;margin-top:2px;">Live Techno &amp; Vocals &#183; Augsburg</div>
      <div style="font-size:13px;line-height:1.4;margin-top:10px;"><a href="mailto:info@scttrd.de" style="color:#0c0c0c;text-decoration:underline;">info@scttrd.de</a></div>
      <div style="font-size:13px;line-height:1.4;margin-top:2px;"><a href="https://scttrd.de" style="color:#ff0000;text-decoration:underline;font-weight:700;">scttrd.de</a>${press}<span style="color:#6b6a66;"> &#183; </span><a href="https://www.instagram.com/scttrd_ofc/" style="color:#0c0c0c;text-decoration:underline;">@scttrd_ofc</a></div>
    </td>
  </tr>
</table>`;
}

const danielS = `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#0c0c0c;border-collapse:collapse;">
  <tr>
    <td style="padding:0 16px 0 0;vertical-align:top;"><a href="https://linktr.ee/daniels.ofc" style="text-decoration:none;"><div style="width:52px;height:52px;border-radius:50%;background:#0c0c0c;color:#fff;font-size:17px;font-weight:700;letter-spacing:0.04em;text-align:center;line-height:52px;">DS</div></a></td>
    <td style="vertical-align:top;border-left:3px solid #ff0000;padding:0 0 0 16px;">
      <div style="font-size:15px;font-weight:700;line-height:1.25;">Daniel S.</div>
      <div style="font-size:13px;line-height:1.45;color:#6b6a66;margin-top:2px;">DJ / Producer &#183; Hardgroove &#183; Techno &#183; Raw &amp; Hypnotic</div>
      <div style="font-size:13px;line-height:1.55;margin-top:10px;"><a href="mailto:info@daniel-s.com" style="color:#0c0c0c;text-decoration:underline;">info@daniel-s.com</a> <span style="color:#6b6a66;">|</span> <a href="mailto:djdanep@gmail.com" style="color:#0c0c0c;text-decoration:underline;">djdanep@gmail.com</a></div>
      <div style="font-size:13px;line-height:1.55;margin-top:2px;"><a href="tel:+491735231109" style="color:#0c0c0c;text-decoration:underline;">+49 173 5231109</a></div>
      <div style="font-size:13px;line-height:1.55;margin-top:2px;"><a href="https://linktr.ee/daniels.ofc" style="color:#ff0000;text-decoration:underline;font-weight:700;">linktr.ee/daniels.ofc</a></div>
      <div style="font-size:13px;line-height:1.55;margin-top:2px;"><a href="https://www.instagram.com/daniel_s.ofc/" style="color:#0c0c0c;text-decoration:underline;">@daniel_s.ofc</a></div>
    </td>
  </tr>
</table>`;

const files = {
  'scttrd-booking.html': wrap('SCTTRD Booking', scttrdSignature({ pressLinks: true })),
  'scttrd-daniel-peters.html': wrap('Daniel Peters SCTTRD', scttrdSignature({ name: 'Daniel Peters', role: 'Live-Set &amp; Technik' })),
  'scttrd-nate.html': wrap('Nate SCTTRD', scttrdSignature({ name: 'Nate', role: 'Booking &amp; Live Operations', pressLinks: true })),
  'scttrd-barbara.html': wrap('Barbara SCTTRD', scttrdSignature({ name: 'Barbara', role: 'Backoffice', pressLinks: true })),
  'scttrd-babsi.html': wrap('Babsi SCTTRD', scttrdSignature({ name: 'Babsi', role: 'Vocals' })),
  'daniel-s-dj.html': wrap('Daniel S. DJ', danielS),
};

const outDirs = [
  path.join(root, 'public/styleguide/assets/signatures'),
  path.join(root, 'wiki/content/signatures'),
];

for (const dir of outDirs) {
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, html] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), html);
  }
}

const importDir = path.join(root, 'wiki/content/import/email-signaturen');
fs.rmSync(importDir, { recursive: true, force: true });
fs.mkdirSync(importDir, { recursive: true });
fs.copyFileSync(
  path.join(root, 'wiki/content/pages/14-E-Mail-Signaturen.md'),
  path.join(importDir, 'E-Mail-Signaturen.md'),
);
for (const [name, html] of Object.entries(files)) {
  fs.writeFileSync(path.join(importDir, name), html);
}

const zipPath = path.join(root, 'wiki/content/import/email-signaturen.zip');
spawnSync('zip', ['-r', zipPath, '.'], { cwd: importDir, stdio: 'inherit' });

console.log('OK:', Object.keys(files).length, 'HTML-Dateien');
console.log('ZIP:', zipPath);
