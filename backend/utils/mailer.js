import Brevo from "@getbrevo/brevo";

const client = new Brevo.TransactionalEmailsApi();

console.log("🔍 Brevo API Key loaded:", apiKey ? `Yes (starts with ${apiKey.substring(0, 10)}...)` : "MISSING - Check .env");

if (!apiKey) {
    console.error("❌ No BREVO_API_KEY in env - Add to .env and restart");
}

client.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

// Function to send order confirmation
export const sendOrderConfirmation = async (order, userEmail) => {
    try {
        // Build dynamic content
        const itemsHtml = order.items.map((item) => `<li><strong>${item.name}</strong> x${item.qty} - $${(item.price * item.qty).toFixed(2)}</li>`).join("");

        const sendSmtpEmail = {
            sender: {
                name: "How to be a Catholic Store",
                email: "howtobeacatholic23@gmail.com" || "noreply@yourstore.com",
            },
            to: [{email: userEmail}], // Customer's email
            subject: `Order Confirmation #${order.orderId}`,
            htmlContent: `
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
            // Optional: Add tracking (opens/clicks)
            // headers: {
            //     "X-Mailin-redirect": window.location.origin + "/unsubscribe", // Custom unsubscribe
            // },
        };

        const response = await client.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ Brevo email sent: ${response.messageId} for order ${order.orderId} to ${userEmail}`);
        return {success: true};
    } catch (error) {
        console.error(`❌ Brevo email failed for ${order.orderId}:`, {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data, // ← CHANGED: This should show {"message": "not verified", ...}
            headers: error.response?.headers,
        });
        return {success: false, error: error.message};
    }
};
