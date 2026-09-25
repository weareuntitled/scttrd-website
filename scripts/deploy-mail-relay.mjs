#!/usr/bin/env node
/**
 * Lädt all-inclusive/mail-relay/ per FTP auf ALL-INKL hoch.
 *
 * Credentials aus ~/Desktop/0.env:
 *   ftp_user_allinkl=w021c25a-…   (KAS → FTP → Benutzername)
 *   ftp_pwd_allinkl=…
 *   EMAIL_PWD=…                   (SMTP-Passwort für config.php)
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const relayDir = path.join(root, 'all-inclusive/mail-relay');
const envPath = path.join(process.env.HOME || '', 'Desktop/0.env');

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (!m) continue;
    out[m[1]] = m[2].trim();
  }
  return out;
}

function buildConfigPhp(env, relaySecret) {
  const smtpPass = (env.EMAIL_PWD || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `<?php
return [
    'relay_secret' => '${relaySecret}',
    'smtp_host' => 'w021c25a.kasserver.com',
    'smtp_port' => 587,
    'smtp_user' => 'info@scttrd.de',
    'smtp_password' => '${smtpPass}',
    'mail_from_address' => 'info@scttrd.de',
    'mail_from_name' => 'SCTTRD Website',
    'allowed_to' => ['info@scttrd.de'],
];
`;
}

function curl(args) {
  const result = spawnSync('curl', args, { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `curl exit ${result.status}`);
  }
  return result.stdout;
}

function curlUpload({ host, user, pass, local, remote }) {
  curl([
    '-sS',
    '--ftp-pasv',
    '--ftp-create-dirs',
    '-T',
    local,
    '-u',
    `${user}:${pass}`,
    `ftp://${host}${remote}`,
  ]);
}

function curlList({ host, user, pass }) {
  return curl(['-sS', '--ftp-pasv', '-u', `${user}:${pass}`, `ftp://${host}/`, '--list-only']);
}

function usernameCandidates(raw) {
  const value = String(raw || '').trim();
  if (!value) return [];
  if (value.startsWith('w0')) return [value];
  return [value, `w021c25a-${value}`, `w021c25a${value}`];
}

async function main() {
  const env = { ...readEnvFile(envPath), ...process.env };
  const userInput = env.ftp_user_allinkl || env.FTP_USER_ALLINKL;
  const pass = env.ftp_pwd_allinkl || env.FTP_PWD_ALLINKL;
  const relaySecret =
    env.MAIL_RELAY_SECRET ||
    crypto.randomBytes(24).toString('hex') + crypto.randomBytes(24).toString('hex');
  const remoteDir = (env.FTP_REMOTE_DIR || '/mail-relay').replace(/\/$/, '');
  const ftpHost = env.FTP_HOST || 'w021c25a.kasserver.com';

  if (!userInput || !pass) {
    console.error('Fehlt: ftp_user_allinkl und ftp_pwd_allinkl in ~/Desktop/0.env');
    console.error('Den FTP-Benutzernamen findest du im KAS unter FTP (nicht der KAS-Login selbst).');
    process.exit(1);
  }
  if (!env.EMAIL_PWD) {
    console.error('Fehlt: EMAIL_PWD in ~/Desktop/0.env');
    process.exit(1);
  }

  const tmpConfig = path.join(relayDir, '.deploy-config.php');
  fs.writeFileSync(tmpConfig, buildConfigPhp(env, relaySecret), 'utf8');

  let user = '';
  for (const candidate of usernameCandidates(userInput)) {
    try {
      console.log(`Teste Login ${candidate}@${ftpHost} …`);
      const listing = curlList({ host: ftpHost, user: candidate, pass });
      user = candidate;
      console.log('Login OK. Root:', listing.trim().split('\n').slice(0, 8).join(', '));
      break;
    } catch (err) {
      console.log(`  → ${err.message}`);
    }
  }
  if (!user) throw new Error('Kein FTP-Login mit den angegebenen Zugangsdaten möglich.');

  try {
    console.log(`Lade nach ${remoteDir}/ hoch …`);
    curlUpload({ host: ftpHost, user, pass, local: path.join(relayDir, 'send.php'), remote: `${remoteDir}/send.php` });
    curlUpload({ host: ftpHost, user, pass, local: tmpConfig, remote: `${remoteDir}/config.php` });
    console.log('Upload OK.');
  } finally {
    fs.rmSync(tmpConfig, { force: true });
  }

  const relayUrl = `http://scttrd.de.${ftpHost}${remoteDir}/send.php`;
  console.log('\n--- Server .env ergänzen ---');
  console.log(`MAIL_RELAY_URL=${relayUrl}`);
  console.log(`MAIL_RELAY_SECRET=${relaySecret}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
