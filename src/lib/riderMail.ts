import nodemailer from 'nodemailer';

export type RiderNotification = {
  name: string;
  venue: string;
  email: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function riderNotificationContent(data: RiderNotification) {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:10px 14px;border-bottom:1px solid #222;color:#888;font-size:12px;letter-spacing:.08em;text-transform:uppercase;width:140px;">${label}</td><td style="padding:10px 14px;border-bottom:1px solid #222;color:#fff;font-size:15px;">${escapeHtml(value)}</td></tr>`;

  const html = `<!doctype html><html><body style="margin:0;background:#0c0c0c;color:#fff;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:28px 20px;">
<p style="margin:0 0 8px;color:#f00000;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">SCTTRD</p>
<h1 style="margin:0 0 18px;font-size:22px;line-height:1.2;">Neue Rider-Anfrage</h1>
<table style="width:100%;border-collapse:collapse;background:#161616;border:2px solid #f00000;">
${row('Name', data.name)}
${row('Venue', data.venue)}
${row('Email', data.email)}
</table>
<p style="margin:18px 0 0;color:#aaa;font-size:13px;line-height:1.5;">Die Anfrage wurde zusätzlich im Payload CMS unter Rider-Anfragen gespeichert. Antworten gehen an ${escapeHtml(data.email)}.</p>
</div></body></html>`;

  const text = [
    'Eine neue Rider- und Hospitality-Anfrage ist eingegangen.',
    '',
    `Name: ${data.name}`,
    `Venue / Veranstaltung: ${data.venue}`,
    `E-Mail: ${data.email}`,
    '',
    'Die Anfrage wurde zusätzlich im Payload CMS unter Rider-Anfragen gespeichert.',
  ].join('\n');

  const subject = `Neue Rider-Anfrage: ${data.venue}`;
  const to = process.env.RIDER_MAIL_TO || 'info@scttrd.de';

  return { html, text, subject, to };
}

async function sendViaRelay(data: RiderNotification): Promise<boolean> {
  const relayUrl = process.env.MAIL_RELAY_URL;
  const relaySecret = process.env.MAIL_RELAY_SECRET;
  if (!relayUrl || !relaySecret) {
    console.error('[rider-request] MAIL_RELAY_URL oder MAIL_RELAY_SECRET fehlt');
    return false;
  }

  const content = riderNotificationContent(data);
  try {
    const response = await fetch(relayUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${relaySecret}`,
      },
      body: JSON.stringify({
        to: content.to,
        replyTo: data.email,
        subject: content.subject,
        html: content.html,
        text: content.text,
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      console.error('[rider-request] Mail-Relay antwortete mit', response.status);
      return false;
    }
    const body = (await response.json()) as { ok?: boolean };
    return body.ok === true;
  } catch (err) {
    console.error('[rider-request] Mail-Relay nicht erreichbar:', err);
    return false;
  }
}

async function sendViaSmtp(data: RiderNotification): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) {
    console.error('[rider-request] SMTP-Konfiguration fehlt');
    return false;
  }

  const content = riderNotificationContent(data);
  try {
    const port = Number(process.env.SMTP_PORT) || 587;
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
      dnsTimeout: 5000,
    });
    await transport.sendMail({
      from: `SCTTRD Website <${user}>`,
      to: content.to,
      replyTo: data.email,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });
    return true;
  } catch (err) {
    console.error('[rider-request] Mailversand fehlgeschlagen:', err);
    return false;
  }
}

export async function sendRiderNotification(data: RiderNotification): Promise<boolean> {
  if (process.env.MAIL_RELAY_URL) return sendViaRelay(data);
  return sendViaSmtp(data);
}
