import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { event, data, old_data } = await req.json();

        if (event?.type !== 'update') {
            console.log('Not an update event, skipping.');
            return Response.json({ message: 'Not an update event' });
        }

        const order = data;
        const oldOrder = old_data;

        // Only send email if status changed to customer_confirmed_payment
        if (order.status !== 'customer_confirmed_payment' || oldOrder?.status === 'customer_confirmed_payment') {
            return Response.json({ message: 'Status not changed to customer_confirmed_payment' });
        }
        
        if (!order.tracking_number) {
            console.error('Missing tracking number in order data, cannot send alert.');
            return Response.json({ error: 'Missing tracking number' }, { status: 400 });
        }
        
        // Fetch admin users only
        const adminUsers = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
        
        console.log(`Found ${adminUsers.length} admin users.`);

        if (adminUsers.length === 0) {
            console.warn('No admin users found to send alert to.');
            return Response.json({ message: 'No admin users found' });
        }
        
        // Send email to each admin
        const emailPromises = adminUsers.map(async admin => {
            try {
                console.log(`Attempting to send payment confirmation alert to admin: ${admin.email}`);
                const emailResult = await resend.emails.send({
                    from: 'alerts@visaflowuae.com',
                    to: admin.email,
                    subject: `💳 Payment Confirmed by Customer - Order #${order.tracking_number}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #f59e0b;">Customer Payment Confirmation</h2>
                            <p>A customer has confirmed they have completed payment for their order.</p>
                            
                            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 4px; margin: 20px 0;">
                                <p style="margin: 0; color: #92400e; font-weight: 600;">
                                    ⚠️ Action Required: Please verify the payment in your system
                                </p>
                            </div>
                            
                            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="margin-top: 0;">Order Details</h3>
                                <p><strong>Tracking Number:</strong> ${order.tracking_number}</p>
                                <p><strong>Customer:</strong> ${order.customer_name}</p>
                                <p><strong>Email:</strong> ${order.customer_email}</p>
                                <p><strong>Phone:</strong> ${order.customer_phone}</p>
                                <p><strong>Total Amount:</strong> ${order.total_amount} AED</p>
                                <p><strong>Status:</strong> ${order.status.replace(/_/g, ' ').toUpperCase()}</p>
                                <p><strong>Confirmed Date:</strong> ${new Date(order.customer_payment_confirmation_date).toLocaleString()}</p>
                            </div>
                            
                            <p>Please log in to the admin dashboard to verify the payment and update the order status accordingly.</p>
                            
                            <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                                This is an automated alert from Visa Flow UAE
                            </p>
                        </div>
                    `
                });
                console.log(`Successfully sent email to ${admin.email}. Email ID: ${emailResult.id}`);
                return { status: 'fulfilled', value: emailResult };
            } catch (emailError) {
                console.error(`Failed to send email to admin ${admin.email}: ${emailError.message}`);
                return { status: 'rejected', reason: emailError };
            }
        });
        
        const results = await Promise.allSettled(emailPromises);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        
        return Response.json({ 
            success: true, 
            message: `Payment confirmation alerts sent to ${successful}/${adminUsers.length} admin users`
        });
    } catch (error) {
        console.error(`Error in notifyAdminPaymentConfirmed function: ${error.message}`);
        return Response.json({ 
            error: error.message
        }, { status: 500 });
    }
});