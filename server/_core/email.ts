import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY is not configured.");
    return null;
  }
  resendClient = new Resend(apiKey);
  return resendClient;
}

export async function sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
  const client = getResendClient();
  // Resend'de gastronotlar.com domaini doğrulandığı için gönderen adresini doğrudan gastronotlar.com yapıyoruz
  const fromEmail = process.env.RESEND_FROM_EMAIL || "iletisim@gastronotlar.com";

  if (!client) {
    console.error("[Email Error] RESEND_API_KEY is not configured; verification email was not sent.");
    return false;
  }

  try {
    const { data, error } = await client.emails.send({
      from: `Gastronotlar <${fromEmail}>`,
      to: [to],
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error("[Email Error] Resend failed:", error);
      return false;
    }

    console.log("[Email] Sent successfully:", data?.id);
    return true;
  } catch (err) {
    console.error("[Email Exception] Failed to send email:", err);
    return false;
  }
}
