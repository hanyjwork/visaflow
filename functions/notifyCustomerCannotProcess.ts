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

        // Only send email if status changed to cannot_process_application
        if (order.status !== 'cannot_process_application' || oldOrder?.status === 'cannot_process_application') {
            return Response.json({ message: 'Status not changed to cannot_process_application' });
        }
        
        if (!order.customer_email || !order.tracking_number) {
            return Response.json({ error: 'Missing required order fields' }, { status: 400 });
        }

        const rejectionReason = order.rejection_reason || 'your application does not meet the current processing requirements';
        
        const emailResult = await resend.emails.send({
            from: 'support@visaflowuae.com',
            to: order.customer_email,
            subject: `Order Update - #${order.tracking_number}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">Order Status Update</h1>
                    </div>
                    
                    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                        <p style="font-size: 16px; color: #374151; line-height: 1.6;">Dear ${order.customer_name},</p>
                        
                        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                            Thank you for choosing Visa Flow UAE. After carefully reviewing your application, we regret to inform you that we are unable to process your order at this time.
                        </p>
                        
                        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #92400e; font-size: 15px;">
                                <strong>Reason:</strong> ${rejectionReason}
                            </p>
                        </div>
                        
                        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0;">
                            <h3 style="margin-top: 0; color: #1f2937; font-size: 16px;">Order Details</h3>
                            <p style="margin: 8px 0; color: #4b5563;"><strong>Tracking Number:</strong> ${order.tracking_number}</p>
                            <p style="margin: 8px 0; color: #4b5563;"><strong>Customer Name:</strong> ${order.customer_name}</p>
                            <p style="margin: 8px 0; color: #4b5563;"><strong>Total Amount:</strong> ${order.total_amount} AED</p>
                        </div>
                        
                        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                            We understand this may be disappointing. However, we encourage you to reapply when your circumstances or conditions change. Our team is committed to helping you with your visa needs when the time is right.
                        </p>
                        
                        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6;">
                                💡 <strong>We're Here to Help:</strong> If you have any questions about this decision or would like guidance on reapplying in the future, our support team is ready to assist you.
                            </p>
                        </div>
                        
                        <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin-top: 30px;">
                            Feel free to contact us at any time, and we'll be happy to provide more information or discuss alternative options that may be available to you.
                        </p>
                        
                        <p style="font-size: 16px; color: #374151; margin-top: 25px;">
                            We appreciate your understanding and look forward to serving you in the future.
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
            message: 'Cannot process notification sent',
            emailId: emailResult.id 
        });
    } catch (error) {
        console.error(`Error in notifyCustomerCannotProcess: ${error.message}`);
        return Response.json({ 
            error: error.message
        }, { status: 500 });
    }
});