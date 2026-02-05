import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { event, data, old_data } = await req.json();

        if (event?.type !== 'update') {
            return Response.json({ message: 'Not an update event' });
        }

        const order = data;
        const oldOrder = old_data;

        // Only send email if status changed to payment_pending
        if (order.status !== 'payment_pending' || oldOrder?.status === 'payment_pending') {
            return Response.json({ message: 'Status not changed to payment_pending' });
        }
        
        if (!order.customer_email || !order.tracking_number) {
            return Response.json({ error: 'Missing required order fields' }, { status: 400 });
        }

        const trackingUrl = `${Deno.env.get('BASE44_APP_URL') || 'https://app.base44.com'}/Track?tracking=${order.tracking_number}`;
        
        const emailResult = await resend.emails.send({
            from: 'support@visaflowuae.com',
            to: order.customer_email,
            subject: `✅ Your Order is Ready for Payment - #${order.tracking_number}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">Great News!</h1>
                    </div>
                    
                    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                        <p style="font-size: 16px; color: #374151; line-height: 1.6;">Dear ${order.customer_name},</p>
                        
                        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                            Our team has completed the review of your visa application. 
                            Your order is <strong style="color: #059669;">accurate</strong>, and everything looks perfect!
                        </p>
                        
                        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #065f46; font-size: 15px; font-weight: 600;">
                                ✓ Your order has been verified and is ready for payment
                            </p>
                        </div>
                        
                        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0;">
                            <h3 style="margin-top: 0; color: #1f2937; font-size: 16px;">Order Summary</h3>
                            <p style="margin: 8px 0; color: #4b5563;"><strong>Tracking Number:</strong> ${order.tracking_number}</p>
                            <p style="margin: 8px 0; color: #4b5563;"><strong>Total Amount:</strong> ${order.total_amount} AED</p>
                        </div>
                        
                        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                            To proceed with your visa application, please complete the payment at your earliest convenience.
                        </p>
                        
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${trackingUrl}" 
                               style="display: inline-block; background: #2563eb; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">
                                View Order & Pay Now
                            </a>
                        </div>
                        
                        <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin-top: 30px;">
                            You can track your order status anytime using your tracking number: <strong>${order.tracking_number}</strong>
                        </p>
                        
                        <p style="font-size: 16px; color: #374151; margin-top: 25px;">
                            Thank you for choosing Visa Flow UAE!
                        </p>
                        
                        <p style="font-size: 16px; color: #374151;">
                            Best regards,<br>
                            <strong>Visa Flow UAE Team</strong>
                        </p>
                    </div>
                    
                    <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0;">
                            This is an automated message from Visa Flow UAE<br>
                            If you have any questions, please contact our support team
                        </p>
                    </div>
                </div>
            `
        });

        return Response.json({ 
            success: true, 
            message: 'Order ready email sent',
            emailId: emailResult.id 
        });
    } catch (error) {
        console.error(`Error in sendOrderReadyForPayment: ${error.message}`);
        return Response.json({ 
            error: error.message
        }, { status: 500 });
    }
});