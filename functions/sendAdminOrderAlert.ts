import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { event, data } = await req.json();

        if (event?.type !== 'create') {
            console.log('Not a create event, skipping.');
            return Response.json({ message: 'Not a create event' });
        }

        const order = data;
        
        if (!order.tracking_number) {
            console.error('Missing tracking number in order data, cannot send alert.');
            return Response.json({ error: 'Missing tracking number' }, { status: 400 });
        }
        
        // Fetch all admin users
        const allUsers = await base44.asServiceRole.entities.User.list();
        const adminUsers = allUsers.filter(user => user.role === 'admin');
        
        console.log(`Found ${adminUsers.length} admin users.`);

        if (adminUsers.length === 0) {
            console.warn('No admin users found to send alert to.');
            return Response.json({ message: 'No admin users found' });
        }
        
        // Send email to each admin
        const emailPromises = adminUsers.map(async admin => {
            try {
                console.log(`Attempting to send alert email to admin: ${admin.email}`);
                const emailResult = await resend.emails.send({
                    from: 'alerts@visaflowuae.com',
                    to: admin.email,
                    subject: `🔔 New Order Alert - #${order.tracking_number}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #2563eb;">New Order Received</h2>
                            <p>A new visa application order has been submitted.</p>
                            
                            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="margin-top: 0;">Order Details</h3>
                                <p><strong>Tracking Number:</strong> ${order.tracking_number}</p>
                                <p><strong>Customer:</strong> ${order.customer_name}</p>
                                <p><strong>Email:</strong> ${order.customer_email}</p>
                                <p><strong>Phone:</strong> ${order.customer_phone}</p>
                                <p><strong>Total Amount:</strong> ${order.total_amount} AED</p>
                                <p><strong>Status:</strong> ${order.status.replace(/_/g, ' ').toUpperCase()}</p>
                            </div>
                            
                            <p>Please review this order in the admin dashboard.</p>
                            
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
            message: `Alert emails sent to ${successful}/${adminUsers.length} admin users`
        });
    } catch (error) {
        console.error(`Error in sendAdminOrderAlert function: ${error.message}`);
        return Response.json({ 
            error: error.message
        }, { status: 500 });
    }
});