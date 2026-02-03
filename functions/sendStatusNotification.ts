import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const payload = await req.json();
    const { event, data, old_data } = payload;
    
    let entityData = data;
    if (payload.payload_too_large) {
      entityData = await base44.asServiceRole.entities.get(event.entity_name, event.entity_id);
    }
    
    // Skip if no status change
    if (!old_data || old_data.status === entityData.status) {
      return Response.json({ message: 'No status change' });
    }
    
    const oldStatus = old_data.status;
    const newStatus = entityData.status;
    
    if (event.entity_name === 'Order') {
      await handleOrderStatusChange(base44, entityData, oldStatus, newStatus);
    }
    
    if (event.entity_name === 'Application') {
      await handleApplicationStatusChange(base44, entityData, oldStatus, newStatus);
    }
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleOrderStatusChange(base44, order, oldStatus, newStatus) {
  const emailMap = {
    'under_review': {
      subject: 'Your Application is Under Review',
      body: `Hello ${order.customer_name},\n\nYour visa application (Tracking: ${order.tracking_number}) is now under review by our team.\n\nWe'll notify you once the review is complete.\n\nBest regards,\nVisa Flow UAE Team`
    },
    'ready_for_processing': {
      subject: 'Your Application is Ready for Payment',
      body: `Hello ${order.customer_name},\n\nGreat news! Your visa application (Tracking: ${order.tracking_number}) has been approved and is ready for payment.\n\nPlease visit your tracking page to complete the payment.\n\nBest regards,\nVisa Flow UAE Team`
    },
    'payment_pending': {
      subject: 'Payment Required for Your Visa Application',
      body: `Hello ${order.customer_name},\n\nYour visa application (Tracking: ${order.tracking_number}) is ready for payment.\n\nPayment Link: ${order.payment_link || 'Check tracking page'}\nTotal Amount: AED ${order.total_amount?.toFixed(2)}\n\nPlease complete the payment to proceed with processing.\n\nBest regards,\nVisa Flow UAE Team`
    },
    'paid': {
      subject: 'Payment Confirmed - Processing Your Visa',
      body: `Hello ${order.customer_name},\n\nYour payment for visa application (Tracking: ${order.tracking_number}) has been confirmed.\n\nWe're now processing your visa application with the authorities.\n\nBest regards,\nVisa Flow UAE Team`
    },
    'processing': {
      subject: 'Your Visa Application is Being Processed',
      body: `Hello ${order.customer_name},\n\nYour visa application (Tracking: ${order.tracking_number}) is now being processed with the UAE authorities.\n\nWe'll notify you once your visa is ready.\n\nBest regards,\nVisa Flow UAE Team`
    },
    'completed': {
      subject: '🎉 Your Visa is Ready!',
      body: `Hello ${order.customer_name},\n\nExcellent news! Your visa application (Tracking: ${order.tracking_number}) is complete.\n\nYou can now download your visa document(s) from the tracking page.\n\nBest regards,\nVisa Flow UAE Team`
    },
    'returned_for_modification': {
      subject: 'Action Required: Modifications Needed',
      body: `Hello ${order.customer_name},\n\nYour visa application (Tracking: ${order.tracking_number}) requires some modifications.\n\nReason: ${order.modification_notes || 'Please check tracking page for details'}\n\nPlease visit the tracking page to update your application.\n\nBest regards,\nVisa Flow UAE Team`
    },
    'cannot_process_application': {
      subject: 'Application Cannot Be Processed',
      body: `Hello ${order.customer_name},\n\nWe regret to inform you that we cannot process your visa application (Tracking: ${order.tracking_number}).\n\nReason: ${order.rejection_reason || 'Not specified'}\n\nIf you have questions, please contact our support team.\n\nBest regards,\nVisa Flow UAE Team`
    },
    'government_rejected': {
      subject: 'Visa Application Rejected',
      body: `Hello ${order.customer_name},\n\nWe regret to inform you that your visa application (Tracking: ${order.tracking_number}) has been rejected by the UAE government.\n\nReason: ${order.rejection_reason || 'Not specified'}\n\nIf you have questions, please contact our support team.\n\nBest regards,\nVisa Flow UAE Team`
    }
  };
  
  const notification = emailMap[newStatus];
  if (notification) {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: order.customer_email,
      subject: notification.subject,
      body: notification.body
    });
  }
}

async function handleApplicationStatusChange(base44, application, oldStatus, newStatus) {
  const order = await base44.asServiceRole.entities.Order.get(application.order_id);
  
  if (newStatus === 'completed' && application.visa_document_url) {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: order.customer_email,
      subject: `🎉 Visa Ready for ${application.applicant_name}`,
      body: `Hello ${order.customer_name},\n\nGreat news! The visa for ${application.applicant_name} (${application.service_name}) is now ready for download.\n\nTracking Number: ${order.tracking_number}\n\nPlease visit your tracking page to download the visa document.\n\nBest regards,\nVisa Flow UAE Team`
    });
  }
  
  if ((newStatus === 'rejected' || application.government_rejection_reason) && oldStatus !== 'rejected') {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: order.customer_email,
      subject: `Visa Rejected for ${application.applicant_name}`,
      body: `Hello ${order.customer_name},\n\nWe regret to inform you that the visa application for ${application.applicant_name} (${application.service_name}) has been rejected.\n\nTracking Number: ${order.tracking_number}\nReason: ${application.government_rejection_reason || 'Not specified'}\n\nIf you have questions, please contact our support team.\n\nBest regards,\nVisa Flow UAE Team`
    });
  }
  
  if (newStatus === 'returned_for_modification') {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: order.customer_email,
      subject: `Modification Required for ${application.applicant_name}`,
      body: `Hello ${order.customer_name},\n\nThe visa application for ${application.applicant_name} requires modifications.\n\nTracking Number: ${order.tracking_number}\n\nPlease visit the tracking page to update the application.\n\nBest regards,\nVisa Flow UAE Team`
    });
  }
}