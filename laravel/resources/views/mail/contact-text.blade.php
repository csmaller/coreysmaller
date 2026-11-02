New message from the contact form

Name: {!! $senderName !!}
Email: {!! $senderEmail !!}
Submitted: {{ $submittedAt->format('F j, Y \a\t g:i A T') }}

Message:
{!! $messageBody !!}
