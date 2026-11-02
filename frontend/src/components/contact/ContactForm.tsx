import { useRef, useState, type ChangeEvent, type FocusEvent, type FormEvent } from 'react';
import { submitContactForm } from '../api/contact';

type FieldName = 'name' | 'email' | 'message';
type ContactValues = Record<FieldName, string>;
type FieldErrors = Partial<Record<FieldName, string>>;
type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const EMPTY_VALUES: ContactValues = { name: '', email: '', message: '' };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

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
  const formRef = useRef<HTMLFormElement>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    if (!isFieldName(name)) return;

    setValues((current) => ({ ...current, [name]: value }));
    setStatus((current) => (current === 'submitting' ? current : 'idle'));
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

    const nextErrors: FieldErrors = {};
    (Object.keys(values) as FieldName[]).forEach((name) => {
      nextErrors[name] = validateField(name, values[name]);
    });
    setErrors(nextErrors);

    const firstInvalid = (Object.keys(values) as FieldName[]).find((name) => nextErrors[name]);
    if (firstInvalid) {
      setStatus('idle');
      const field = formRef.current?.elements.namedItem(firstInvalid);
      if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
        field.focus();
      }
      return;
    }

    setStatus('submitting');
    try {
      await submitContactForm(values);
      setValues(EMPTY_VALUES);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  const submitting = status === 'submitting';

  return (
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

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary btn-block"
      >
        {submitting ? 'Sending…' : 'Send message'}
      </button>
      </div>

      <div role="status">
        {status === 'success' && (
          <p className="form-banner is-success">
            Thanks! Your message has been sent.
          </p>
        )}
        {status === 'error' && (
          <p className="form-banner is-error">
            Sorry, your message could not be sent. Please try again.
          </p>
        )}
      </div>
    </form>
  );
}
