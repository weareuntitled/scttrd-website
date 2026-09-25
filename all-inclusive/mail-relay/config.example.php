<?php
/**
 * Kopie als config.php anlegen (liegt nur auf ALL-INKL, nicht ins Git).
 *
 * Upload per FTP (Benutzer f018d3d2 @ w021c25a.kasserver.com) nach /mail-relay/
 * Aufruf:  POST http://scttrd.de.w021c25a.kasserver.com/mail-relay/send.php
 */
return [
    // Zufallsstring — identisch mit MAIL_RELAY_SECRET auf dem Netcup-VPS.
    'relay_secret' => 'change-me-long-random-secret',

    // ALL-INKL SMTP (vom Shared-Hosting aus erreichbar).
    'smtp_host' => 'w021c25a.kasserver.com',
    'smtp_port' => 587,
    'smtp_user' => 'info@scttrd.de',
    'smtp_password' => 'change-me-mail-password',

    'mail_from_address' => 'info@scttrd.de',
    'mail_from_name' => 'SCTTRD Website',

    // Nur diese Empfänger sind erlaubt (Rider-Benachrichtigungen).
    'allowed_to' => ['info@scttrd.de'],
];
