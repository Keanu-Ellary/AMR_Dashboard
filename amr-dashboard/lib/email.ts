import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASS,
    },
});

export async function sendEmail(to: string, subject: string, body: string) {
    await transporter.sendMail({
        from: `"AMR Dashboard" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: body,
    });
}