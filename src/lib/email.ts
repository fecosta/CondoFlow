import nodemailer from "nodemailer";

function createTransporter() {
  if (process.env.RESEND_API_KEY) {
    // Use Resend SMTP in production
    return nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: {
        user: "resend",
        pass: process.env.RESEND_API_KEY,
      },
    });
  }

  // Nodemailer for dev
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST ?? "smtp.ethereal.email",
    port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
}

const FROM = process.env.EMAIL_FROM ?? "GCR <noreply@gcr.app>";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<void> {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: FROM,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
    text: text ?? html.replace(/<[^>]*>/g, ""),
  });
}

// Fire-and-forget wrapper — does not block the response
export function sendEmailAsync(options: SendEmailOptions): void {
  sendEmail(options).catch((err) => {
    console.error("[email] Failed to send:", err);
  });
}
