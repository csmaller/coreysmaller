<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>New contact form message</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f4f4f5; color: #18181b; font-family: Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7;">
        <tr>
            <td style="padding: 24px 24px 8px;">
                <h1 style="margin: 0; font-size: 20px; font-weight: bold;">New message from the contact form</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 8px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td width="96" valign="top" style="padding: 8px 0; color: #52525b; font-size: 14px;">Name</td>
                        <td style="padding: 8px 0; word-break: break-word;">{{ $senderName }}</td>
                    </tr>
                    <tr>
                        <td width="96" valign="top" style="padding: 8px 0; color: #52525b; font-size: 14px;">Email</td>
                        <td style="padding: 8px 0; word-break: break-word;"><a href="mailto:{{ $senderEmail }}" style="color: #18181b;">{{ $senderEmail }}</a></td>
                    </tr>
                    <tr>
                        <td width="96" valign="top" style="padding: 8px 0; color: #52525b; font-size: 14px;">Submitted</td>
                        <td style="padding: 8px 0;">{{ $submittedAt->format('F j, Y \a\t g:i A T') }}</td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding: 8px 24px 24px;">
                <div style="padding-top: 16px; border-top: 1px solid #e4e4e7;">
                    <div style="padding-bottom: 8px; color: #52525b; font-size: 14px;">Message</div>
                    <div style="word-break: break-word;">{!! nl2br(e($messageBody)) !!}</div>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
