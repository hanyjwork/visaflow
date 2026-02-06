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

        // Only send email if status changed to cannot_process_order
        if (order.status !== 'cannot_process_order' || oldOrder?.status === 'cannot_process_order') {
            return Response.json({ message: 'Status not changed to cannot_process_order' });
        }
        
        if (!order.customer_email || !order.tracking_number) {
            return Response.json({ error: 'Missing required order fields' }, { status: 400 });
        }

        const trackingUrl = `https://visaflowuae.com/Track?tracking=${order.tracking_number}`;
        const rejectionReason = order.rejection_reason || 'Unable to process based on the information provided';
        
        const emailResult = await resend.emails.send({
            from: 'support@visaflowuae.com',
            to: order.customer_email,
            subject: `Order Update - Unable to Process #${order.tracking_number}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">Order Update</h1>
                    </div>
                    
                    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                        <p style="font-size: 16px; color: #374151; line-height: 1.6;">Dear ${order.customer_name},</p>
                        
                        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                            We regret to inform you that Visa Flow UAE is unable to process your visa application order <strong>#${order.tracking_number}</strong> at this time.
                        </p>
                        
                        <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; margin: 25px 0; border-radius: 4px;">
                            <p style="margin: 0 0 8px 0; color: #991b1b; font-size: 15px; font-weight: 600;">
                                ✗ Cannot Process Order
                            </p>
                            <p style="margin: 0; color: #7f1d1d; font-size: 14px;">
                                <strong>Reason:</strong> ${rejectionReason}
                            </p>
                        </div>
                        
                        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0;">
                            <h3 style="margin-top: 0; color: #1f2937; font-size: 16px;">Order Details</h3>
                            <p style="margin: 8px 0; color: #4b5563;"><strong>Tracking Number:</strong> ${order.tracking_number}</p>
                            <p style="margin: 8px 0; color: #4b5563;"><strong>Customer:</strong> ${order.customer_name}</p>
                            <p style="margin: 8px 0; color: #4b5563;"><strong>Email:</strong> ${order.customer_email}</p>
                        </div>
                        
                        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                            We understand this may be disappointing. You are welcome to reapply once the noted issues have been addressed or your circumstances have changed.
                        </p>
                        
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${trackingUrl}" 
                               style="display: inline-block; background: #f59e0b; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);">
                                View Order Details
                            </a>
                        </div>
                        
                        <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin-top: 30px;">
                            If you have any questions or would like to discuss this decision, please don't hesitate to contact our support team.
                        </p>
                        
                        <p style="font-size: 16px; color: #374151; margin-top: 25px;">
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
            message: 'Order cannot process notification sent',
            emailId: emailResult.id 
        });
    } catch (error) {
        console.error(`Error in notifyCustomerOrderCannotProcess: ${error.message}`);
        return Response.json({ 
            error: error.message
        }, { status: 500 });
    }
});