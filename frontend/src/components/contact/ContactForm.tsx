import { useCallback, useRef, useState, type ChangeEvent, type FocusEvent, type FormEvent } from 'react';
import { submitContactForm } from '../api/contact';
import { Toast } from '../Toast';
import { ApiError } from '../../services/apiError';

type FieldName = 'name' | 'email' | 'message';
type ContactValues = Record<FieldName, string>;
type FieldErrors = Partial<Record<FieldName, string>>;
type FormStatus = 'idle' | 'submitting';
type ToastState = { kind: 'success' | 'error'; message: string };

const EMPTY_VALUES: ContactValues = { name: '', email: '', message: '' };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const SEND_FAILED_MESSAGE = 'Sorry, your message could not be sent. Please try again.';
const NETWORK_FAILED_MESSAGE = 'We could not reach the server. Please check your connection and try again.';

const FIELD_CLASSES = 'field';
const INVALID_CLASSES = 'is-invalid';

function isFieldName(name: string): name is FieldName {
  return name === 'name' || name === 'email' || name === 'message';
}

function validateField(name: FieldName, value: string): string {
  const trimmed = value.trim();
  if (name === 'name') return trimmed ? '' : 'Please enter your name.';
  if (name === 'message') return trimmed ? '' : 'Please enter a message.';
  if (!trimmed) return 'Please enter your email address.';
  return EMAIL_PATTERN.test(trimmed) ? '' : 'Please enter a valid email address, like name@example.com.';
}

function getFailureMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.errors.length > 0) return error.errors.join(' ');
    if (error.status === 429) return error.message;
    return SEND_FAILED_MESSAGE;
  }
  // fetch rejects with a TypeError when the request never reaches the server.
  return error instanceof TypeError ? NETWORK_FAILED_MESSAGE : SEND_FAILED_MESSAGE;
}

interface FieldProps {
  as?: 'input' | 'textarea';
  label: string;
  name: FieldName;
  error?: string;
  type?: string;
  autoComplete?: string;
  rows?: number;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

function Field({
  as = 'input',
  label,
  name,
  error,
  type,
  autoComplete,
  rows,
  value,
  onChange,
  onBlur,
}: FieldProps) {
  const errorId = `${name}-error`;
  const className = error ? `${FIELD_CLASSES} ${INVALID_CLASSES}` : FIELD_CLASSES;
  const shared = {
    id: name,
    name,
    value,
    'aria-required': true,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? errorId : undefined,
    className,
  };

  return (
    <div>
      <label htmlFor={name} className="mono-label">
        {label}
      </label>
      {as === 'textarea' ? (
        <textarea
          {...shared}
          rows={rows}
          onChange={(event) => onChange(event)}
          onBlur={(event) => onBlur(event)}
        />
      ) : (
        <input
          {...shared}
          type={type}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event)}
          onBlur={(event) => onBlur(event)}
        />
      )}
      {error && (
        <p id={errorId} className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ContactForm() {
  const [values, setValues] = useState<ContactValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [toast, setToast] = useState<ToastState | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    if (!isFieldName(name)) return;

    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: validateField(name, value) }));
    }
  }

  function handleBlur(event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    if (!isFieldName(name)) return;
    setErrors((current) => ({ ...current, [name]: validateField(name, value) }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;
    setToast(null);

    const nextErrors: FieldErrors = {};
    (Object.keys(values) as FieldName[]).forEach((name) => {
      nextErrors[name] = validateField(name, values[name]);
    });
    setErrors(nextErrors);

    const firstInvalid = (Object.keys(values) as FieldName[]).find((name) => nextErrors[name]);
    if (firstInvalid) {
      const field = formRef.current?.elements.namedItem(firstInvalid);
      if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
        field.focus();
      }
      return;
    }

    const trap = formRef.current?.elements.namedItem('website');
    const website = trap instanceof HTMLInputElement ? trap.value : '';

    setStatus('submitting');
    try {
      await submitContactForm(website ? { ...values, website } : values);
      setValues(EMPTY_VALUES);
      setToast({ kind: 'success', message: 'Thanks! Your message has been sent.' });
    } catch (error) {
      setToast({ kind: 'error', message: getFailureMessage(error) });
    } finally {
      setStatus('idle');
    }
  }

  const submitting = status === 'submitting';

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        className="login-panel"
      >
        <div>
          <h1 className="display section-title">Say hi.</h1>
          <p>Music, writing, or a booking.</p>
        </div>
        <div className="contact-fields">

        <Field
          label="Name"
          name="name"
          type="text"
          autoComplete="name"
          value={values.name}
          error={errors.name}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        <Field
          as="textarea"
          label="Message"
          name="message"
          rows={5}
          value={values.message}
          error={errors.message}
          onChange={handleChange}
          onBlur={handleBlur}
        />

        <div className="contact-trap" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary btn-block"
        >
          {submitting ? 'Sending…' : 'Send message'}
        </button>
        </div>
      </form>

      {toast && <Toast kind={toast.kind} message={toast.message} onDismiss={dismissToast} />}
    </>
  );
}
