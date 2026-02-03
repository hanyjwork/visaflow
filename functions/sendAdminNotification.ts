import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const payload = await req.json();
    const { event, data, old_data } = payload;
    
    let order = data;
    if (payload.payload_too_large) {
      order = await base44.asServiceRole.entities.Order.get(event.entity_id);
    }
    
    // Get all admin users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const adminUsers = allUsers.filter(user => user.role === 'admin');
    
    if (adminUsers.length === 0) {
      return Response.json({ message: 'No admin users found' });
    }
    
    // Handle new order creation
    if (event.type === 'create') {
      const applications = await base44.asServiceRole.entities.Application.filter({ order_id: order.id });
      
      const applicantsList = applications.map(app => 
        `- ${app.applicant_name} (${app.service_name}) - AED ${app.service_price?.toFixed(2)}`
      ).join('\n');
      
      for (const admin of adminUsers) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: `🆕 New Order Received - ${order.tracking_number}`,
          body: `Hello ${admin.full_name},\n\nA new visa application order has been submitted:\n\nTracking Number: ${order.tracking_number}\nCustomer: ${order.customer_name}\nEmail: ${order.customer_email}\nPhone: ${order.customer_phone}\nTotal Amount: AED ${order.total_amount?.toFixed(2)}\n\nApplicants:\n${applicantsList}\n\nPlease review this application in the admin dashboard.\n\nBest regards,\nVisa Flow UAE System`
        });
      }
      
      return Response.json({ success: true, message: 'Admin notifications sent for new order' });
    }
    
    // Handle payment confirmation
    if (event.type === 'update' && old_data && old_data.status !== 'paid' && order.status === 'paid') {
      for (const admin of adminUsers) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: `💰 Payment Confirmed - ${order.tracking_number}`,
          body: `Hello ${admin.full_name},\n\nPayment has been confirmed for order:\n\nTracking Number: ${order.tracking_number}\nCustomer: ${order.customer_name}\nEmail: ${order.customer_email}\nAmount Paid: AED ${order.total_amount?.toFixed(2)}\nPayment Date: ${new Date(order.payment_date).toLocaleString()}\n\nPlease proceed with processing this application.\n\nBest regards,\nVisa Flow UAE System`
        });
      }
      
      return Response.json({ success: true, message: 'Admin notifications sent for payment confirmation' });
    }
    
    return Response.json({ message: 'No notification needed' });
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});