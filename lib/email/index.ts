import "server-only";
import { getNotificationAddress } from "@/lib/cms";
import { site } from "@/lib/site";

export type Email = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

export interface Mailer {
  readonly kind: "smtp" | "console";
  send(email: Email): Promise<void>;
}

/** SMTP via nodemailer. Works with Gmail (app password), Zoho, SES SMTP, Postmark, Resend SMTP, etc. */
async function smtpMailer(): Promise<Mailer> {
  const nodemailer = (await import("nodemailer")).default;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    connectionTimeout: 10_000,
    socketTimeout: 15_000,
  });
  const from = process.env.SMTP_FROM ?? `${site.name} Website <${process.env.SMTP_USER ?? site.email}>`;
  return {
    kind: "smtp",
    async send(e) {
      await transport.sendMail({ from, to: e.to, replyTo: e.replyTo, subject: e.subject, text: e.text, html: e.html });
    },
  };
}

/** Development fallback: prints the email to the server log instead of sending it. */
const consoleMailer: Mailer = {
  kind: "console",
  async send(e) {
    console.info(`\n[email:console] To: ${e.to}\nSubject: ${e.subject}\nReply-To: ${e.replyTo ?? "-"}\n\n${e.text}\n`);
  },
};

/**
 * SMTP_HOST set → SMTP. Otherwise the console mailer in development, and
 * null in production (the API route treats that as "not configured").
 */
export async function getMailer(): Promise<Mailer | null> {
  if (process.env.SMTP_HOST) return smtpMailer();
  if (process.env.NODE_ENV !== "production") return consoleMailer;
  return null;
}

/**
 * Where lead notifications go: the published contact-form recipient, else
 * CONTACT_EMAIL, else the published company email. Published content only,
 * never an admin's unpublished preview.
 */
export const notificationAddress = (): Promise<string> => getNotificationAddress();
