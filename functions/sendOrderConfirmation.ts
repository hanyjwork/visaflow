import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { event, data } = await req.json();

        if (!data || !data.id) {
            return Response.json({ error: 'Order data not provided' }, { status: 400 });
        }

        // Fetch applications for this order
        const applications = await base44.asServiceRole.entities.Application.filter({ 
            order_id: data.id 
        });

        // Build email content
        const applicantsList = applications.map((app, index) => `
            <li style="margin-bottom: 10px;">
                <strong>${app.applicant_name}</strong><br>
                Service: ${app.service_name}<br>
                Price: AED ${app.service_price?.toFixed(2)}${app.security_deposit > 0 ? `<br>Security Deposit: AED ${app.security_deposit?.toFixed(2)}` : ''}
            </li>
        `).join('');

        const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
                <h2 style="color: #1e40af; margin-bottom: 20px;">UAE Visa Application Received</h2>
                
                <p style="color: #334155; margin-bottom: 20px;">Dear ${data.customer_name},</p>
                
                <p style="color: #334155; margin-bottom: 20px;">
                    Thank you for submitting your visa application. We have received your application and our team will review it shortly.
                </p>
                
                <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                    <h3 style="color: #1e40af; margin-top: 0;">Application Details</h3>
                    <p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${data.tracking_number}</p>
                    <p style="margin: 5px 0;"><strong>Total Amount:</strong> AED ${data.total_amount?.toFixed(2)}</p>
                    <p style="margin: 5px 0;"><strong>Status:</strong> Pending Review</p>
                </div>
                
                <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                    <h3 style="color: #1e40af; margin-top: 0;">Applicants (${applications.length})</h3>
                    <ul style="list-style: none; padding: 0;">
                        ${applicantsList}
                    </ul>
                </div>
                
                <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #1e40af;">
                        <strong>Track Your Application:</strong><br>
                        Use your tracking number <strong>${data.tracking_number}</strong> to check the status of your application at any time.
                    </p>
                </div>
                
                <p style="color: #334155; margin-bottom: 10px;">
                    You will receive another email once your application has been reviewed and is ready for payment.
                </p>
                
                <p style="color: #334155; margin-bottom: 0;">
                    Best regards,<br>
                    <strong>UAE Visa Team</strong>
                </p>
            </div>
        `;

        // Send email using Resend
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: "UAE Visa Services <onboarding@resend.dev>",
                to: [data.customer_email],
                subject: `Application Received - Tracking #${data.tracking_number}`,
                html: emailBody
            })
        });

        if (!resendResponse.ok) {
            const errorData = await resendResponse.json();
            throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
        }

        return Response.json({ 
            success: true,
            message: 'Order confirmation email sent successfully via Resend' 
        });

    } catch (error) {
        console.error('Error sending order confirmation:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});