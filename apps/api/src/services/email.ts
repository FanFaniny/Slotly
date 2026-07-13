import { serverEnv } from "@slotly/shared/env";

interface BookingEmailData {
  to: string;
  clientName: string;
  masterName: string;
  serviceName: string;
  startsAt: string;
  timezone: string;
}

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  if (!serverEnv.RESEND_API_KEY) {
    console.info(
      "[email] RESEND_API_KEY not set — skipping confirmation email to",
      data.to,
    );
    return { sent: false, reason: "RESEND_API_KEY_NOT_CONFIGURED" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(serverEnv.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: "Slotly <onboarding@resend.dev>",
      to: data.to,
      subject: `Booking confirmed — ${data.serviceName}`,
      html: `
        <h2>Your booking is confirmed!</h2>
        <p>Hi ${data.clientName},</p>
        <p>Your appointment with <strong>${data.masterName}</strong> is confirmed.</p>
        <ul>
          <li><strong>Service:</strong> ${data.serviceName}</li>
          <li><strong>Date:</strong> ${data.startsAt}</li>
        </ul>
        <p>Thank you for booking with Slotly.</p>
      `,
    });

    return { sent: true, id: result.data?.id };
  } catch (error) {
    console.error("[email] Failed to send confirmation:", error);
    return { sent: false, reason: "SEND_FAILED" };
  }
}
