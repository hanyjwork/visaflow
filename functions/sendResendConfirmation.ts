import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { event, data } = await req.json();

        // Only process create events
        if (event?.type !== 'create') {
            return Response.json({ message: 'Not a create event' });
        }

        const order = data;
        
        // Send confirmation email to customer
        const emailData = await resend.emails.send({
            from: 'Visa Flow UAE <support@visaflowuae.com>',
            to: order.customer_email,
            subject: `Order Confirmation - Tracking #${order.tracking_number}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Order Confirmation</h2>
                    <p>Dear ${order.customer_name},</p>
                    <p>Thank you for your order! We have received your visa application.</p>
                    
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Order Details</h3>
                        <p><strong>Tracking Number:</strong> ${order.tracking_number}</p>
                        <p><strong>Status:</strong> ${order.status.replace(/_/g, ' ').toUpperCase()}</p>
                        <p><strong>Total Amount:</strong> ${order.total_amount} AED</p>
                    </div>
                    
                    <p>You can track your application status anytime using your tracking number.</p>
                    <p>We will notify you of any updates to your application.</p>
                    
                    <p>Best regards,<br>Visa Flow UAE Team</p>
                </div>
            `
        });

        return Response.json({ 
            success: true, 
            message: 'Confirmation email sent',
            emailId: emailData.id 
        });
    } catch (error) {
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});