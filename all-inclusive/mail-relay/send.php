<?php
declare(strict_types=1);

/**
 * Minimaler Mail-Relay für SCTTRD Rider-Benachrichtigungen.
 * Läuft auf ALL-INKL (SMTP erreichbar), wird vom Netcup-VPS per HTTPS aufgerufen.
 */

$configFile = __DIR__ . '/config.php';
if (!is_readable($configFile)) {
    respond(503, ['ok' => false, 'error' => 'config missing']);
}

/** @var array<string, mixed> $config */
$config = require $configFile;

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'POST expected']);
}

$token = bearerToken();
$secret = (string) ($config['relay_secret'] ?? '');
if ($secret === '' || $token === '' || !hash_equals($secret, $token)) {
    respond(401, ['ok' => false, 'error' => 'unauthorized']);
}

$payload = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($payload)) {
    respond(400, ['ok' => false, 'error' => 'invalid json']);
}

$to = trim((string) ($payload['to'] ?? ''));
$replyTo = trim((string) ($payload['replyTo'] ?? ''));
$subject = trim((string) ($payload['subject'] ?? ''));
$html = (string) ($payload['html'] ?? '');
$text = (string) ($payload['text'] ?? '');

$allowedTo = array_values(array_filter((array) ($config['allowed_to'] ?? []), 'is_string'));
if ($to === '' || !in_array($to, $allowedTo, true)) {
    respond(400, ['ok' => false, 'error' => 'invalid recipient']);
}
if ($subject === '' || ($html === '' && $text === '')) {
    respond(400, ['ok' => false, 'error' => 'missing content']);
}
if ($replyTo !== '' && !filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
    respond(400, ['ok' => false, 'error' => 'invalid replyTo']);
}

$fromAddress = (string) ($config['mail_from_address'] ?? $config['smtp_user'] ?? '');
$fromName = (string) ($config['mail_from_name'] ?? 'SCTTRD');
if ($fromAddress === '') {
    respond(503, ['ok' => false, 'error' => 'sender not configured']);
}

try {
    smtpSend([
        'host' => (string) ($config['smtp_host'] ?? ''),
        'port' => (int) ($config['smtp_port'] ?? 587),
        'user' => (string) ($config['smtp_user'] ?? ''),
        'password' => (string) ($config['smtp_password'] ?? ''),
        'from_address' => $fromAddress,
        'from_name' => $fromName,
        'to' => $to,
        'reply_to' => $replyTo,
        'subject' => $subject,
        'html' => $html,
        'text' => $text,
    ]);
    respond(200, ['ok' => true]);
} catch (Throwable $e) {
    error_log('[scttrd-mail-relay] ' . $e->getMessage());
    respond(502, ['ok' => false, 'error' => 'send failed']);
}

/** @param array<string, mixed> $body */
function respond(int $status, array $body): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function bearerToken(): string
{
    $auth = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
    if (preg_match('/^Bearer\s+(\S+)/i', $auth, $matches) === 1) {
        return $matches[1];
    }
    return '';
}

/**
 * @param array{
 *   host: string,
 *   port: int,
 *   user: string,
 *   password: string,
 *   from_address: string,
 *   from_name: string,
 *   to: string,
 *   reply_to: string,
 *   subject: string,
 *   html: string,
 *   text: string
 * } $mail
 */
function smtpSend(array $mail): void
{
    if ($mail['host'] === '' || $mail['user'] === '' || $mail['password'] === '') {
        throw new RuntimeException('smtp not configured');
    }

    $socket = @stream_socket_client(
        'tcp://' . $mail['host'] . ':' . $mail['port'],
        $errno,
        $errstr,
        15,
        STREAM_CLIENT_CONNECT
    );
    if ($socket === false) {
        throw new RuntimeException('connect failed: ' . $errstr);
    }

    stream_set_timeout($socket, 15);
    expect($socket, [220]);
    command($socket, 'EHLO scttrd-mail-relay', [250]);

    if ($mail['port'] === 587) {
        command($socket, 'STARTTLS', [220]);
        if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            throw new RuntimeException('starttls failed');
        }
        command($socket, 'EHLO scttrd-mail-relay', [250]);
    }

    command($socket, 'AUTH LOGIN', [334]);
    command($socket, base64_encode($mail['user']), [334]);
    command($socket, base64_encode($mail['password']), [235]);

    command($socket, 'MAIL FROM:<' . $mail['from_address'] . '>', [250]);
    command($socket, 'RCPT TO:<' . $mail['to'] . '>', [250, 251]);
    command($socket, 'DATA', [354]);

    $fromHeader = encodeAddress($mail['from_name'], $mail['from_address']);
    $boundary = 'scttrd_' . bin2hex(random_bytes(8));
    $headers = [
        'From: ' . $fromHeader,
        'To: <' . $mail['to'] . '>',
        'Subject: ' . encodeHeader($mail['subject']),
        'MIME-Version: 1.0',
        'Date: ' . date(DATE_RFC2822),
        'Message-ID: <' . bin2hex(random_bytes(16)) . '@scttrd-mail-relay>',
    ];
    if ($mail['reply_to'] !== '') {
        $headers[] = 'Reply-To: <' . $mail['reply_to'] . '>';
    }

    if ($mail['html'] !== '' && $mail['text'] !== '') {
        $headers[] = 'Content-Type: multipart/alternative; boundary="' . $boundary . '"';
        $body = "--{$boundary}\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: 8bit\r\n\r\n"
            . $mail['text'] . "\r\n\r\n"
            . "--{$boundary}\r\n"
            . "Content-Type: text/html; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: 8bit\r\n\r\n"
            . $mail['html'] . "\r\n\r\n"
            . "--{$boundary}--";
    } elseif ($mail['html'] !== '') {
        $headers[] = 'Content-Type: text/html; charset=UTF-8';
        $body = $mail['html'];
    } else {
        $headers[] = 'Content-Type: text/plain; charset=UTF-8';
        $body = $mail['text'];
    }

    fwrite($socket, implode("\r\n", $headers) . "\r\n\r\n" . dotStuff($body) . "\r\n.\r\n");
    expect($socket, [250]);
    command($socket, 'QUIT', [221]);
    fclose($socket);
}

/** @param resource $socket */
function command($socket, string $line, array $okCodes): void
{
    fwrite($socket, $line . "\r\n");
    expect($socket, $okCodes);
}

/** @param resource $socket */
function expect($socket, array $okCodes): void
{
    $response = '';
    while (($line = fgets($socket, 515)) !== false) {
        $response .= $line;
        if (isset($line[3]) && $line[3] === ' ') {
            break;
        }
    }
    $code = (int) substr($response, 0, 3);
    if (!in_array($code, $okCodes, true)) {
        throw new RuntimeException('smtp error ' . $code . ': ' . trim($response));
    }
}

function encodeAddress(string $name, string $address): string
{
    $safeName = trim(str_replace(['"', '\\'], '', $name));
    if ($safeName === '') {
        return '<' . $address . '>';
    }
    return encodeHeader($safeName) . ' <' . $address . '>';
}

function encodeHeader(string $value): string
{
    if (preg_match('/[^\x20-\x7E]/', $value) === 1) {
        return '=?UTF-8?B?' . base64_encode($value) . '?=';
    }
    return $value;
}

function dotStuff(string $body): string
{
    return preg_replace('/^\./m', '..', $body) ?? $body;
}
