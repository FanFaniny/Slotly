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
        <p>Hey ${data.clientName},</p>
        <p>Your appointment with <strong>${data.masterName}</strong> is confirmed.</p>
        <ul>
          <li><strong>Service:</strong> ${data.serviceName}</li>
          <li><strong>Date:</strong> ${data.startsAt} (${data.timezone})</li>
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

export type BookingUpdateType =
  | "RESCHEDULED"
  | "CANCELLED"
  | "STATUS_CHANGED"
  | "UPDATED";

export interface BookingUpdateEmailData {
  to: string;
  clientName: string;
  masterName: string;
  serviceName: string;
  startsAt: string;
  timezone: string;
  updateType: BookingUpdateType;
  newStatus?: string;
}

export async function sendBookingUpdateEmail(data: BookingUpdateEmailData) {
  if (!serverEnv.RESEND_API_KEY) {
    console.info(
      "[email] RESEND_API_KEY not set — skipping booking update email to",
      data.to,
    );
    return { sent: false, reason: "RESEND_API_KEY_NOT_CONFIGURED" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(serverEnv.RESEND_API_KEY);

    const subjectMap: Record<BookingUpdateType, string> = {
      RESCHEDULED: `Booking Rescheduled — ${data.serviceName}`,
      CANCELLED: `Booking Cancelled — ${data.serviceName}`,
      STATUS_CHANGED: `Booking Status Updated — ${data.serviceName}`,
      UPDATED: `Booking Details Updated — ${data.serviceName}`,
    };

    const result = await resend.emails.send({
      from: "Slotly <onboarding@resend.dev>",
      to: data.to,
      subject:
        subjectMap[data.updateType] ?? `Booking Updated — ${data.serviceName}`,
      html: `
        <h2>Your booking has been updated</h2>
        <p>Hey ${data.clientName},</p>
        <p>Your appointment for <strong>${data.serviceName}</strong> with <strong>${data.masterName}</strong> was updated.</p>
        <ul>
          <li><strong>Date & Time:</strong> ${data.startsAt} (${data.timezone})</li>
          ${data.newStatus ? `<li><strong>Status:</strong> ${data.newStatus}</li>` : ""}
        </ul>
        <p>Thank you for using Slotly.</p>
      `,
    });

    return { sent: true, id: result.data?.id };
  } catch (error) {
    console.error("[email] Failed to send update email:", error);
    return { sent: false, reason: "SEND_FAILED" };
  }
}
