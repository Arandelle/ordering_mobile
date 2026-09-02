/** Accepted email domains for customer accounts. */
export const CUSTOMER_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "live.com",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "gmx.com",
  "jptechnologyph.com",
  "harrisoninasalbbq.com.ph",
  "harrisoninasalbbq.ph",
  "jpscgroup.com",
  "jpfoodlab.com",
  "digitaloneph.com",
];

/** @deprecated Use CUSTOMER_EMAIL_DOMAINS / isAllowedCustomerDomain instead. */
export const GMAIL_DOMAIN = "gmail.com";

/** Check whether the email belongs to one of the accepted customer domains. */
export function isAllowedCustomerDomain(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  return CUSTOMER_EMAIL_DOMAINS.includes(domain);
}
