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

$name = trim((string)($_POST['a1_names'] ?? ''));
if ($name === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Please provide at least the 1st applicant name.']);
    exit;
}

$email1 = trim((string)($_POST['a1_email'] ?? ''));
$email2 = trim((string)($_POST['a2_email'] ?? ''));
$replyTo = filter_var($email1, FILTER_VALIDATE_EMAIL) ? $email1 : (filter_var($email2, FILTER_VALIDATE_EMAIL) ? $email2 : null);

require_once __DIR__ . '/PHPMailer/src/Exception.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

$config = require $configPath;

$recipient = 'vicki@matlaw.africa';

$allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
];

$uploadFields = [
    'file_id_front'       => 'ID Card (Front)',
    'file_id_back'        => 'ID Card (Back)',
    'file_proof_address'  => 'Proof of Residential Address',
    'file_marriage'       => 'Marriage Certificate',
    'file_anc'            => 'Ante Nuptial Contract',
];

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
    if ($replyTo) {
        $mail->addReplyTo($replyTo, $name);
    }
    $mail->Subject = 'FICA Form Submission — ' . $name;
    $mail->isHTML(true);
    $mail->Body = buildHtmlBody($_POST);
    $mail->AltBody = buildTextBody($_POST);

    foreach ($uploadFields as $fieldName => $label) {
        if (isset($_FILES[$fieldName]) && $_FILES[$fieldName]['error'] === UPLOAD_ERR_OK) {
            $tmpPath = $_FILES[$fieldName]['tmp_name'];
            $origName = $_FILES[$fieldName]['name'];
            $mimeType = $_FILES[$fieldName]['type'] ?? '';

            if (!in_array($mimeType, $allowedMimes, true)) {
                continue;
            }

            $mail->addAttachment($tmpPath, $origName);
        }
    }

    $mail->send();

    echo json_encode(['success' => true]);
} catch (Exception $exception) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Could not send the email. Please try again later.']);
}

function buildHtmlBody(array $post): string
{
    $sections = [
        '1ST APPLICANT' => [
            'FICA' => [
                'Names'          => $post['a1_names'] ?? '',
                'Identity No'    => $post['a1_id'] ?? '',
                'How Married'    => $post['a1_married'] ?? '',
            ],
            'CONTACT' => [
                'Cell No'   => $post['a1_cell'] ?? '',
                'Home Tel'  => $post['a1_tel'] ?? '',
                'Email'     => $post['a1_email'] ?? '',
            ],
            'SARS' => [
                'Income Tax No' => $post['a1_tax'] ?? '',
            ],
            'RESIDENTIAL ADDRESS' => ['' => $post['a1_res_address'] ?? ''],
            'POSTAL ADDRESS'      => ['' => $post['a1_post_address'] ?? ''],
            'FUTURE RESIDENTIAL'  => ['Date of Occupancy' => $post['a1_occ_date'] ?? ''],
            'FUTURE POSTAL'       => ['' => $post['a1_future_post'] ?? ''],
            'BANK DETAILS FOR DEBIT ORDER' => [
                'Bank'                => $post['a1_bank'] ?? '',
                'Account Holder'      => $post['a1_accholder'] ?? '',
                'Account No'          => $post['a1_accno'] ?? '',
                'Branch Code'         => $post['a1_branch'] ?? '',
                'Branch Name'         => $post['a1_branchname'] ?? '',
                'Account Type'        => $post['a1_acctype'] ?? '',
                'Payment/Debit Date'  => $post['a1_debitdate'] ?? '',
            ],
        ],
        '2ND APPLICANT / SPOUSE' => [
            'FICA' => [
                'Names'          => $post['a2_names'] ?? '',
                'Identity No'    => $post['a2_id'] ?? '',
                'How Married'    => $post['a2_married'] ?? '',
            ],
            'CONTACT' => [
                'Cell No'   => $post['a2_cell'] ?? '',
                'Home Tel'  => $post['a2_tel'] ?? '',
                'Email'     => $post['a2_email'] ?? '',
            ],
            'SARS' => [
                'Income Tax No' => $post['a2_tax'] ?? '',
            ],
            'RESIDENTIAL ADDRESS' => ['' => $post['a2_res_address'] ?? ''],
            'POSTAL ADDRESS'      => ['' => $post['a2_post_address'] ?? ''],
            'FUTURE RESIDENTIAL'  => ['Date of Occupancy' => $post['a2_occ_date'] ?? ''],
            'FUTURE POSTAL'       => ['' => $post['a2_future_post'] ?? ''],
            'BANK DETAILS FOR DEBIT ORDER' => [
                'Bank'                => $post['a2_bank'] ?? '',
                'Account Holder'      => $post['a2_accholder'] ?? '',
                'Account No'          => $post['a2_accno'] ?? '',
                'Branch Code'         => $post['a2_branch'] ?? '',
                'Branch Name'         => $post['a2_branchname'] ?? '',
                'Account Type'        => $post['a2_acctype'] ?? '',
                'Payment/Debit Date'  => $post['a2_debitdate'] ?? '',
            ],
        ],
    ];

    $html = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#000;background:#fff;margin:0;padding:24px;">';
    $html .= '<h1 style="font-size:20px;margin:0 0 8px;">FICA AND CONTACT INFORMATION SHEET FOR BONDS</h1>';
    $html .= '<p style="font-size:13px;color:#444;margin:0 0 20px;">Matthee Attorneys Inc &mdash; Received via matlaw.africa</p>';

    foreach ($sections as $applicantTitle => $sectionsData) {
        $html .= '<h2 style="font-size:16px;margin:20px 0 8px;padding-bottom:4px;border-bottom:2px solid #000;">' . htmlspecialchars($applicantTitle, ENT_QUOTES, 'UTF-8') . '</h2>';

        foreach ($sectionsData as $sectionTitle => $fields) {
            $html .= '<h3 style="font-size:13px;margin:14px 0 6px;color:#555;">' . htmlspecialchars($sectionTitle, ENT_QUOTES, 'UTF-8') . '</h3>';
            $html .= '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:8px;">';

            foreach ($fields as $label => $value) {
                $val = htmlspecialchars(trim((string)$value), ENT_QUOTES, 'UTF-8');
                if ($label === '' && $val === '') {
                    $html .= '<tr><td colspan="2" style="padding:4px 6px;border:1px solid #ddd;">&nbsp;</td></tr>';
                } elseif ($label === '') {
                    $html .= '<tr><td colspan="2" style="padding:4px 6px;border:1px solid #ddd;">' . $val . '</td></tr>';
                } else {
                    $html .= '<tr>'
                        . '<td style="padding:4px 6px;border:1px solid #ddd;width:160px;font-weight:600;">' . htmlspecialchars($label, ENT_QUOTES, 'UTF-8') . '</td>'
                        . '<td style="padding:4px 6px;border:1px solid #ddd;">' . ($val !== '' ? $val : '&nbsp;') . '</td>'
                        . '</tr>';
                }
            }

            $html .= '</table>';
        }
    }

    $html .= '<p style="margin:20px 0 0;font-size:12px;color:#666;">Matthee Attorneys Inc | <a href="https://matlaw.africa">matlaw.africa</a></p>';
    $html .= '</body></html>';

    return $html;
}

function buildTextBody(array $post): string
{
    $lines = ['FICA AND CONTACT INFORMATION SHEET FOR BONDS', 'Matthee Attorneys Inc — Received via matlaw.africa', ''];

    $sections = [
        '1ST APPLICANT' => [
            'FICA' => [
                'Names'          => $post['a1_names'] ?? '',
                'Identity No'    => $post['a1_id'] ?? '',
                'How Married'    => $post['a1_married'] ?? '',
            ],
            'CONTACT' => [
                'Cell No'   => $post['a1_cell'] ?? '',
                'Home Tel'  => $post['a1_tel'] ?? '',
                'Email'     => $post['a1_email'] ?? '',
            ],
            'SARS' => [
                'Income Tax No' => $post['a1_tax'] ?? '',
            ],
            'RESIDENTIAL ADDRESS' => ['' => $post['a1_res_address'] ?? ''],
            'POSTAL ADDRESS'      => ['' => $post['a1_post_address'] ?? ''],
            'FUTURE RESIDENTIAL'  => ['Date of Occupancy' => $post['a1_occ_date'] ?? ''],
            'FUTURE POSTAL'       => ['' => $post['a1_future_post'] ?? ''],
            'BANK DETAILS FOR DEBIT ORDER' => [
                'Bank'                => $post['a1_bank'] ?? '',
                'Account Holder'      => $post['a1_accholder'] ?? '',
                'Account No'          => $post['a1_accno'] ?? '',
                'Branch Code'         => $post['a1_branch'] ?? '',
                'Branch Name'         => $post['a1_branchname'] ?? '',
                'Account Type'        => $post['a1_acctype'] ?? '',
                'Payment/Debit Date'  => $post['a1_debitdate'] ?? '',
            ],
        ],
        '2ND APPLICANT / SPOUSE' => [
            'FICA' => [
                'Names'          => $post['a2_names'] ?? '',
                'Identity No'    => $post['a2_id'] ?? '',
                'How Married'    => $post['a2_married'] ?? '',
            ],
            'CONTACT' => [
                'Cell No'   => $post['a2_cell'] ?? '',
                'Home Tel'  => $post['a2_tel'] ?? '',
                'Email'     => $post['a2_email'] ?? '',
            ],
            'SARS' => [
                'Income Tax No' => $post['a2_tax'] ?? '',
            ],
            'RESIDENTIAL ADDRESS' => ['' => $post['a2_res_address'] ?? ''],
            'POSTAL ADDRESS'      => ['' => $post['a2_post_address'] ?? ''],
            'FUTURE RESIDENTIAL'  => ['Date of Occupancy' => $post['a2_occ_date'] ?? ''],
            'FUTURE POSTAL'       => ['' => $post['a2_future_post'] ?? ''],
            'BANK DETAILS FOR DEBIT ORDER' => [
                'Bank'                => $post['a2_bank'] ?? '',
                'Account Holder'      => $post['a2_accholder'] ?? '',
                'Account No'          => $post['a2_accno'] ?? '',
                'Branch Code'         => $post['a2_branch'] ?? '',
                'Branch Name'         => $post['a2_branchname'] ?? '',
                'Account Type'        => $post['a2_acctype'] ?? '',
                'Payment/Debit Date'  => $post['a2_debitdate'] ?? '',
            ],
        ],
    ];

    foreach ($sections as $applicantTitle => $sectionsData) {
        $lines[] = '=== ' . $applicantTitle . ' ===';
        foreach ($sectionsData as $sectionTitle => $fields) {
            $lines[] = '';
            $lines[] = $sectionTitle . ':';
            foreach ($fields as $label => $value) {
                $val = trim((string)$value);
                if ($label === '') {
                    $lines[] = $val !== '' ? $val : '(empty)';
                } else {
                    $lines[] = '  ' . $label . ': ' . ($val !== '' ? $val : '(empty)');
                }
            }
        }
        $lines[] = '';
    }

    $lines[] = 'Matthee Attorneys Inc | https://matlaw.africa';

    return implode("\n", $lines);
}
