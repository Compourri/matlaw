<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
    exit;
}

$configPath = __DIR__ . '/mail-config.php';
if (!is_readable($configPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Mail is not configured on this server.']);
    exit;
}

$input = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid request.']);
    exit;
}

$recipient = filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL);
if (!$recipient) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Please provide a valid email address.']);
    exit;
}

$subject = trim((string)($input['subject'] ?? ''));
if ($subject === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing email subject.']);
    exit;
}

$rows = $input['rows'] ?? null;
if (!is_array($rows) || count($rows) === 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No calculator results were provided.']);
    exit;
}

$title = trim((string)($input['title'] ?? 'Cost Calculator'));
$note = trim((string)($input['note'] ?? ''));
$disclaimer = trim((string)($input['disclaimer'] ?? 'This is an estimate only. Actual costs may vary.'));

require_once __DIR__ . '/PHPMailer/src/Exception.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

$config = require $configPath;

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $config['host'];
    $mail->SMTPAuth = true;
    $mail->Username = $config['username'];
    $mail->Password = $config['password'];
    $mail->Port = (int)($config['port'] ?? 465);

    $encryption = strtolower((string)($config['encryption'] ?? 'ssl'));
    if ($encryption === 'tls') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    } elseif ($encryption === 'ssl') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    }

    $mail->CharSet = 'UTF-8';
    $mail->setFrom($config['from_email'], $config['from_name']);
    $mail->addAddress($recipient);
    $mail->addReplyTo($config['from_email'], $config['from_name']);
    $mail->Subject = $subject;
    $mail->isHTML(true);
    $mail->Body = buildHtmlBody($title, $rows, $note, $disclaimer);
    $mail->AltBody = buildTextBody($title, $rows, $note, $disclaimer);

    $mail->send();

    echo json_encode(['success' => true]);
} catch (Exception $exception) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Could not send the email. Please try again later.']);
}

function buildHtmlBody(string $title, array $rows, string $note, string $disclaimer): string
{
    $tableRows = '';
    foreach ($rows as $row) {
        if (!is_array($row)) {
            continue;
        }

        $label = htmlspecialchars(trim((string)($row['label'] ?? '')), ENT_QUOTES, 'UTF-8');
        $value = htmlspecialchars(trim((string)($row['value'] ?? '')), ENT_QUOTES, 'UTF-8');
        $isTotal = !empty($row['total']);

        if ($label === '' && $value === '') {
            $tableRows .= '<tr><td colspan="2" style="height:10px;border:none;"></td></tr>';
            continue;
        }

        $rowStyle = $isTotal
            ? 'border-top:2px solid #000;font-weight:bold;'
            : 'border-bottom:1px solid #ddd;';

        $tableRows .= '<tr>'
            . '<td style="padding:8px 6px;' . $rowStyle . '">' . $label . '</td>'
            . '<td style="padding:8px 6px;text-align:right;font-weight:' . ($isTotal ? 'bold' : '600') . ';' . $rowStyle . '">' . $value . '</td>'
            . '</tr>';
    }

    $noteHtml = $note !== ''
        ? '<p style="margin:16px 0 0;font-size:12px;color:#444;">' . htmlspecialchars($note, ENT_QUOTES, 'UTF-8') . '</p>'
        : '';

    $disclaimerHtml = '<p style="margin:12px 0 0;font-size:12px;color:#444;">'
        . htmlspecialchars($disclaimer, ENT_QUOTES, 'UTF-8')
        . '</p>';

    return '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#000;background:#fff;margin:0;padding:24px;">'
        . '<h1 style="font-size:20px;margin:0 0 16px;">' . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . '</h1>'
        . '<table style="width:100%;border-collapse:collapse;font-size:14px;">' . $tableRows . '</table>'
        . $noteHtml
        . $disclaimerHtml
        . '<p style="margin:20px 0 0;font-size:12px;color:#666;">Matthee Attorneys Inc | <a href="https://matlaw.africa">matlaw.africa</a></p>'
        . '</body></html>';
}

function buildTextBody(string $title, array $rows, string $note, string $disclaimer): string
{
    $lines = [$title, ''];

    foreach ($rows as $row) {
        if (!is_array($row)) {
            continue;
        }

        $label = trim((string)($row['label'] ?? ''));
        $value = trim((string)($row['value'] ?? ''));

        if ($label === '' && $value === '') {
            $lines[] = '';
            continue;
        }

        $lines[] = $label . ($label !== '' && $value !== '' ? ': ' : '') . $value;
    }

    if ($note !== '') {
        $lines[] = '';
        $lines[] = $note;
    }

    $lines[] = '';
    $lines[] = $disclaimer;
    $lines[] = '';
    $lines[] = 'Matthee Attorneys Inc | https://matlaw.africa';

    return implode("\n", $lines);
}
