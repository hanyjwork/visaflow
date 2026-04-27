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

        const application = data;
        const oldApplication = old_data;

        // Only send email if status changed to completed
        if (application.status !== 'completed' || oldApplication?.status === 'completed') {
            return Response.json({ message: 'Status not changed to completed' });
        }
        
        // Get the order details
        const orders = await base44.asServiceRole.entities.Order.filter({ id: application.order_id });
        if (orders.length === 0) {
            return Response.json({ error: 'Order not found' }, { status: 404 });
        }
        
        const order = orders[0];
        
        if (!order.customer_email || !order.tracking_number) {
            return Response.json({ error: 'Missing required order fields' }, { status: 400 });
        }

        const trackingUrl = `https://visaflowuae.com/Track?tracking=${order.tracking_number}`;
        
        const emailResult = await resend.emails.send({
            from: 'support@visaflowuae.com',
            to: order.customer_email,
            subject: `🎉 Visa Ready for ${application.applicant_name} - Order #${order.tracking_number}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Visa Ready!</h1>
                    </div>
                    
                    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                        <p style="font-size: 16px; color: #374151; line-height: 1.6;">Dear ${order.customer_name},</p>
                        
                        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                            Excellent news! The visa for <strong>${application.applicant_name}</strong> has been successfully processed and is now ready for download.
                        </p>
                        
                        <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #065f46; font-size: 15px; font-weight: 600;">
                                ✓ Visa application completed successfully
                            </p>
                        </div>
                        
                        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0;">
                            <h3 style="margin-top: 0; color: #1f2937; font-size: 16px;">Application Details</h3>
                            <p style="margin: 8px 0; color: #4b5563;"><strong>Applicant:</strong> ${application.applicant_name}</p>
                            <p style="margin: 8px 0; color: #4b5563;"><strong>Service:</strong> ${application.service_name}</p>
                            <p style="margin: 8px 0; color: #4b5563;"><strong>Passport Number:</strong> ${application.passport_number}</p>
                            <p style="margin: 8px 0; color: #4b5563;"><strong>Tracking Number:</strong> ${order.tracking_number}</p>
                        </div>
                        
                        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                            You can now download your visa document by visiting your order tracking page.
                        </p>
                        
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${trackingUrl}" 
                               style="display: inline-block; background: #10b981; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                                Download Your Visa
                            </a>
                        </div>
                        
                        <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin-top: 30px;">
                            Please review the visa details carefully and ensure all information is correct before traveling.
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
            message: 'Application completed notification sent',
            emailId: emailResult.id 
        });
    } catch (error) {
        console.error(`Error in notifyCustomerApplicationCompleted: ${error.message}`);
        return Response.json({ 
            error: error.message
        }, { status: 500 });
    }
});