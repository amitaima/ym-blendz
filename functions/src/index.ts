
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import { defineString } from "firebase-functions/params";

admin.initializeApp();

const brevoEmail = defineString("BREVO_EMAIL");
const brevoPassword = defineString("BREVO_PASSWORD");

export const onBookingCanceled = onDocumentUpdated("bookings/{bookingId}", async (event) => {
    const transporter = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        auth: {
            user: brevoEmail.value(),
            pass: brevoPassword.value(),
        },
    });

    if (!event.data) {
        return;
    }
    const booking = event.data.after.data();
    const previousBooking = event.data.before.data();

    if (booking.status === "canceled" && previousBooking.status !== "canceled") {
        const customerId = booking.customerId;
        const userDoc = await admin.firestore().collection("users").doc(customerId).get();
        const user = userDoc.data();

        const mailOptions = {
            from: "amitai.malka@gmail.com",
            to: "yoav.malka2009@gmail.com",
            subject: "התראת ביטול תור - YM Blendz",
            html: `
            <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                <div style="background-color: #d9534f; color: #ffffff; padding: 25px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">התראה על ביטול תור</h1>
                </div>
                <div style="padding: 25px 30px;">
                    <p style="font-size: 18px;">שלום יואב,</p>
                    <p style="font-size: 16px;">הלקוח <strong>${user?.name}</strong> ביטל את התור.</p>
                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 20px; border-left: 5px solid #d9534f;">
                        <h3 style="margin-top: 0; color: #333; font-size: 20px;">פרטי התור שבוטל:</h3>
                        <p style="font-size: 16px; margin: 10px 0;"><strong>תאריך:</strong> ${booking.date}</p>
                        <p style="font-size: 16px; margin: 10px 0;"><strong>שעה:</strong> ${booking.timeSlot}</p>
                    </div>
                </div>
                <div style="text-align: center; padding: 20px; font-size: 12px; color: #777; background-color: #f4f4f4;">
                    <p style="margin: 0;">זוהי הודעה אוטומטית מ-YM Blendz</p>
                </div>
            </div>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log("Email sent successfully");
        } catch (error) {
            console.error("Error sending email:", error);
        }
    }
});
