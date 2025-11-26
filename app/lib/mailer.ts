import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
export async function sendVerificationCodeEmail(email: string, verificationCode: string) {
    console.log(`Sending verification code ${verificationCode} to email: ${email}`);
    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Email Verification',
        text: `The verification code you received is: ${verificationCode}`,
        html: `<p>(${verificationCode})This verification code is for registering an account.</p>`,
    };

    await transporter.sendMail(mailOptions);
}
export async function sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${process.env.BASE_URL}/api/background-auth/verify-email?token=${token}`;
    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Email Verification',
        text: `Please verify your email by clicking the following link: ${verificationUrl}`,
        html: `<p>Please verify your email by clicking the following link: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
    };

    await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.BASE_URL}/reset-password?token=${token}`;
    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Password Reset',
        text: `You can reset your password by clicking the following link: ${resetUrl}`,
        html: `<p>You can reset your password by clicking the following link: <a href="${resetUrl}">${resetUrl}</a></p>`,
    };

    await transporter.sendMail(mailOptions);
}