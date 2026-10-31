export function siteOrigin(): string {
  const configured = import.meta.env?.VITE_SITE_URL;
  return configured || 'https://coreysmaller.com';
}
