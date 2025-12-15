import nodemailer from "nodemailer";

// Create reusable transporter
const transporter = nodemailer.createTransport({
    // ← FIXED: createTransport (not Transporter)
    service: "gmail", // Or 'hotmail', 'yahoo', etc.
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Test connection on startup (optional—add to server.js)
export const testEmailConnection = async () => {
    try {
        await transporter.verify();
        console.log("✅ Gmail SMTP connected successfully");
        return true;
    } catch (error) {
        console.error("❌ Gmail SMTP connection failed:", error.message);
        return false;
    }
};

// Send order confirmation
export const sendOrderConfirmation = async (order, userEmail) => {
    try {
        // Build HTML body dynamically
        const itemsHtml = order.items.map((item) => `<li><strong>${item.name}</strong> x${item.qty} - $${(item.price * item.qty).toFixed(2)}</li>`).join("");

        const mailOptions = {
            from: `"Your Store" <${process.env.EMAIL_USER}>`,
            to: userEmail, // e.g., req.user.email
            subject: `Order Confirmation #${order.orderId}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">Thanks for your order!</h2>
                    <p><strong>Order ID:</strong> ${order.orderId}</p>
                    <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                    <p><strong>Shipping Address:</strong><br>
                       ${order.shipping.firstName || ""} ${order.shipping.lastName || ""}<br>
                       ${order.shipping.shippingAddress}, ${order.shipping.houseNumber || ""}<br>
                       ${order.shipping.state || ""} ${order.shipping.zip || ""}<br>
                       Email: ${order.shipping.email}
                    </p>
                    <h3>Order Items:</h3>
                    <ul style="list-style-type: none; padding: 0;">
                        ${itemsHtml}
                    </ul>
                    <p><strong>Payment ID:</strong> ${order.paymentId}</p>
                    <p>We'll notify you when your order ships. Questions? Reply to this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee;">
                    <small>Order placed on ${new Date(order.createdAt).toLocaleDateString()}.</small>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent: ${info.messageId} for order ${order.orderId} to ${userEmail}`);
        return {success: true};
    } catch (error) {
        console.error(`❌ Email failed for ${order.orderId} to ${userEmail}:`, error.message);
        return {success: false, error: error.message};
    }
};
