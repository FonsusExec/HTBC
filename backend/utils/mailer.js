import Brevo from "@getbrevo/brevo";

const client = new Brevo.TransactionalEmailsApi();
let brevoConfigured = false;

const getBrevoClient = () => {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
        throw new Error("BREVO_API_KEY is missing from backend/.env");
    }

    if (!brevoConfigured) {
        client.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
        brevoConfigured = true;
    }

    return client;
};

const getSender = (fallbackName = "How to be Catholic") => ({
    name: process.env.BREVO_FROM_NAME || fallbackName,
    email: process.env.BREVO_FROM_EMAIL || "howtobeacatholic23@gmail.com",
});

const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

export const sendOrderConfirmation = async (order, userEmail) => {
    try {
        const itemsHtml = order.items.map((item) => `<li><strong>${escapeHtml(item.name)}</strong> x${item.qty} - $${(item.price * item.qty).toFixed(2)}</li>`).join("");

        const sendSmtpEmail = {
            sender: getSender("How to be a Catholic Store"),
            to: [{email: userEmail}],
            subject: `Order Confirmation #${order.orderId}`,
            htmlContent: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">Thanks for your order!</h2>
                    <p><strong>Order ID:</strong> ${escapeHtml(order.orderId)}</p>
                    <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                    <p><strong>Shipping Address:</strong><br>
                       ${escapeHtml(order.shipping.firstName || "")} ${escapeHtml(order.shipping.lastName || "")}<br>
                       ${escapeHtml(order.shipping.shippingAddress || "")}, ${escapeHtml(order.shipping.houseNumber || "")}<br>
                       ${escapeHtml(order.shipping.state || "")} ${escapeHtml(order.shipping.zip || "")}<br>
                       Email: ${escapeHtml(order.shipping.email || "")}
                    </p>
                    <h3>Order Items:</h3>
                    <ul style="list-style-type: none; padding: 0;">
                        ${itemsHtml}
                    </ul>
                    <p><strong>Payment ID:</strong> ${escapeHtml(order.paymentId || "")}</p>
                    <p>We'll notify you when your order ships. Questions? Reply to this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee;">
                    <small>Order placed on ${new Date(order.createdAt).toLocaleDateString()}.</small>
                </div>
            `,
        };

        const response = await getBrevoClient().sendTransacEmail(sendSmtpEmail);
        console.log(`Brevo email sent: ${response.messageId || "ok"} for order ${order.orderId} to ${userEmail}`);
        return {success: true};
    } catch (error) {
        console.error(`Brevo email failed for ${order.orderId}:`, {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers,
        });
        return {success: false, error: error.message};
    }
};

export const sendPasswordResetEmail = async ({userEmail, userName, resetUrl}) => {
    try {
        const sendSmtpEmail = {
            sender: getSender(),
            to: [{email: userEmail, name: userName || userEmail}],
            subject: "Reset your How to be Catholic password",
            htmlContent: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
                    <h2 style="color: #0b557f; margin-top: 0;">Reset your password</h2>
                    <p>Hello ${escapeHtml(userName || "there")},</p>
                    <p>We received a request to reset your How to be Catholic account password.</p>
                    <p>
                        <a href="${escapeHtml(resetUrl)}" style="display: inline-block; background: #efbf04; color: #111827; padding: 14px 22px; border-radius: 6px; text-decoration: none; font-weight: 700;">
                            Reset Password
                        </a>
                    </p>
                    <p>This link will expire in 1 hour. If you did not request this, you can ignore this email.</p>
                    <p style="font-size: 13px; color: #64748b;">If the button does not work, copy and paste this link into your browser:<br>${escapeHtml(resetUrl)}</p>
                </div>
            `,
        };

        const response = await getBrevoClient().sendTransacEmail(sendSmtpEmail);
        console.log(`Password reset email sent: ${response.messageId || "ok"} to ${userEmail}`);
        return {success: true};
    } catch (error) {
        console.error("Password reset email failed:", {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
        });
        return {success: false, error: error.message};
    }
};

export const sendContactMessageEmail = async (contactMessage) => {
    try {
        const sendSmtpEmail = {
            sender: getSender(),
            to: [{email: process.env.CONTACT_TO_EMAIL || process.env.BREVO_FROM_EMAIL || "howtobeacatholic23@gmail.com"}],
            replyTo: {
                email: contactMessage.email,
                name: contactMessage.fullName,
            },
            subject: `New contact message from ${contactMessage.fullName}`,
            htmlContent: `
                <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #1f2937;">
                    <h2 style="color: #0b557f; margin-top: 0;">New contact message</h2>
                    <p><strong>Name:</strong> ${escapeHtml(contactMessage.fullName)}</p>
                    <p><strong>Email:</strong> ${escapeHtml(contactMessage.email)}</p>
                    <p><strong>Newsletter:</strong> ${contactMessage.newsletter ? "Yes" : "No"}</p>
                    <div style="margin-top: 18px; padding: 16px; border-left: 4px solid #efbf04; background: #f8fafc; line-height: 1.6;">
                        ${escapeHtml(contactMessage.message).replace(/\n/g, "<br>")}
                    </div>
                </div>
            `,
        };

        const response = await getBrevoClient().sendTransacEmail(sendSmtpEmail);
        console.log(`Contact email sent: ${response.messageId || "ok"} for ${contactMessage._id}`);
        return {success: true};
    } catch (error) {
        console.error("Contact message email failed:", {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
        });
        return {success: false, error: error.message};
    }
};
