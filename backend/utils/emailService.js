const { Resend } = require('resend');

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Test email connection with Resend
async function testEmailConnection() {
  try {
    console.log('🔍 Testing Resend connection...');
    console.log(`🔑 API Key: ${process.env.RESEND_API_KEY ? 'Set ✓' : 'Not Set ✗'}`);

    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not found in environment variables');
      return false;
    }

    // Send a test email to verify everything works
    await sendTestEmail();

    console.log('✅ Resend Email service connected successfully');
    console.log('📧 Ready to send emails via Resend');

    return true;

  } catch (error) {
    console.error('❌ Resend connection failed:', error);
    console.error('💡 Make sure your RESEND_API_KEY is correct in .env file');
    return false;
  }
}

// Send a test email on startup
async function sendTestEmail() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'CivicEye <onboarding@resend.dev>', // ⭐ FIXED: Use Resend's default domain
      to: ['sairohithtappatla45@gmail.com'], // ⭐ Your MVP email
      subject: '🚀 CivicEye Resend Test - Connection Successful',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f0f9ff; border-radius: 8px;">
          <h2 style="color: #059669;">✅ CivicEye Email System Working!</h2>
          <p>This is a test email to confirm that your Resend integration is working properly.</p>
          <p><strong>Service:</strong> Resend API</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>MVP Mode:</strong> All emails sent to sairohithtappatla45@gmail.com</p>
          
          <div style="background: #dcfce7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #166534;"><strong>✓ Ready to send:</strong></p>
            <ul style="margin: 10px 0; color: #166534;">
              <li>Report confirmation emails</li>
              <li>Status update notifications</li>
              <li>SLA breach alerts</li>
            </ul>
          </div>

          <div style="background: #e0f2fe; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #0369a1;"><strong>📧 Powered by Resend:</strong></p>
            <p style="margin: 5px 0 0 0; color: #0369a1;">
              Professional email delivery with high deliverability rates
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('❌ Failed to send test email:', error);
      return false;
    }

    console.log(`🧪 Test email sent successfully via Resend`);
    console.log(`📨 Email ID: ${data?.id}`);
    console.log(`📧 Sent to: sairohithtappatla45@gmail.com`);

    return true;

  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    return false;
  }
}

// Send report confirmation email to citizen when they submit
async function sendReportConfirmation(report) {
  try {
    console.log(`📤 Sending confirmation email for ticket ${report.ticketNumber}...`);

    const { data, error } = await resend.emails.send({
      from: 'CivicEye <onboarding@resend.dev>', // ⭐ FIXED: Use Resend's default domain
      to: ['sairohithtappatla45@gmail.com'], // ⭐ MVP: Send to your email
      subject: `✅ Report Submitted Successfully - Ticket #${report.ticketNumber}`,
      html: generateReportConfirmationTemplate(report)
    });

    if (error) {
      console.error(`❌ Error sending report confirmation for ${report.ticketNumber}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Report confirmation email sent for ${report.ticketNumber}`);
    console.log(`📧 Service: Resend API`);
    console.log(`📨 Email ID: ${data?.id}`);
    console.log(`📧 Sent to: sairohithtappatla45@gmail.com (MVP Mode)`);

    return {
      success: true,
      emailId: data?.id,
      recipient: 'sairohithtappatla45@gmail.com',
      service: 'Resend API',
      message: 'Email sent successfully via Resend'
    };

  } catch (error) {
    console.error(`❌ Error sending report confirmation for ${report.ticketNumber}:`, error);
    return { success: false, error: error.message };
  }
}

// Send status update notification
async function sendStatusUpdateNotification(report, citizenEmail) {
  try {
    console.log(`📤 Sending status update email for ticket ${report.ticketNumber}...`);

    const { data, error } = await resend.emails.send({
      from: 'CivicEye <onboarding@resend.dev>', // ⭐ FIXED: Use Resend's default domain
      to: ['sairohithtappatla45@gmail.com'], // ⭐ MVP: Send to your email
      subject: `📋 CivicEye Update: Report #${report.ticketNumber} - ${report.status.toUpperCase()}`,
      html: generateStatusUpdateTemplate(report)
    });

    if (error) {
      console.error(`❌ Error sending status update for ${report.ticketNumber}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Status update email sent for ${report.ticketNumber}`);
    console.log(`📧 Service: Resend API`);
    console.log(`📨 Email ID: ${data?.id}`);

    return {
      success: true,
      emailId: data?.id,
      recipient: 'sairohithtappatla45@gmail.com',
      service: 'Resend API',
      message: 'Email sent successfully via Resend'
    };

  } catch (error) {
    console.error(`❌ Error sending status update for ${report.ticketNumber}:`, error);
    return { success: false, error: error.message };
  }
}

// Send SLA alert
async function sendSLAAlert(report) {
  try {
    console.log(`🚨 Sending SLA alert for ticket ${report.ticketNumber}...`);

    const { data, error } = await resend.emails.send({
      from: 'CivicEye Alerts <onboarding@resend.dev>', // ⭐ FIXED: Use Resend's default domain
      to: ['sairohithtappatla45@gmail.com'], // ⭐ MVP: Send to your email
      subject: `🚨 URGENT: SLA Breach Alert - Report #${report.ticketNumber}`,
      html: generateSLAAlertTemplate(report)
    });

    if (error) {
      console.error(`❌ Error sending SLA alert for ${report.ticketNumber}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`🚨 SLA Alert sent for ${report.ticketNumber}`);
    console.log(`📧 MVP Email: sairohithtappatla45@gmail.com`);
    console.log(`📨 Email ID: ${data?.id}`);

    return {
      success: true,
      emailId: data?.id,
      recipient: 'sairohithtappatla45@gmail.com',
      service: 'Resend API',
      message: 'SLA Alert sent via Resend'
    };

  } catch (error) {
    console.error(`❌ Error sending SLA alert for ${report.ticketNumber}:`, error);
    return { success: false, error: error.message };
  }
}

// Beautiful report confirmation email template
function generateReportConfirmationTemplate(report) {
  const estimatedTime = getEstimatedResolutionTime(report.priority);

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>✅ Report Submitted Successfully</title>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 0; border-radius: 12px; max-width: 600px; margin: 0 auto; box-shadow: 0 8px 32px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
            .ticket-badge { background: rgba(255,255,255,0.2); color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin: 20px 0; font-weight: bold; font-size: 18px; }
            .content { padding: 30px; }
            .details { background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981; }
            .priority-badge { padding: 8px 16px; border-radius: 20px; font-weight: bold; color: white; display: inline-block; margin: 10px 0; }
            .next-steps { background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; }
            .resend-badge { background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Report Submitted Successfully!</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px;">Thank you for helping make our city better</p>
                <div class="ticket-badge">
                    Ticket #${report.ticketNumber}
                </div>
            </div>
            
            <div class="content">
                <div class="resend-badge">
                    <strong>🚀 POWERED BY RESEND</strong><br>
                    Professional Email Delivery • MVP Demo Mode
                </div>

                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #10b981; margin: 0;">🎯 Your Report is Now Active</h2>
                    <p style="color: #6b7280; margin: 10px 0;">Our team has received your civic issue report</p>
                </div>
                
                <div class="details">
                    <h4 style="margin: 0 0 15px 0; color: #1e293b;">📋 Report Details:</h4>
                    <p style="margin: 8px 0; color: #374151;"><strong>Title:</strong> ${report.title}</p>
                    <p style="margin: 8px 0; color: #374151;"><strong>Category:</strong> ${report.category.charAt(0).toUpperCase() + report.category.slice(1)}</p>
                    <p style="margin: 8px 0; color: #374151;"><strong>Department:</strong> ${report.assignedDepartment}</p>
                    <p style="margin: 8px 0; color: #374151;"><strong>Original Reporter:</strong> ${report.reportedBy}</p>
                    <p style="margin: 8px 0; color: #374151;"><strong>Location:</strong> ${report.location.address}</p>
                    <p style="margin: 8px 0; color: #374151;"><strong>Submitted:</strong> ${new Date(report.createdAt).toLocaleString()}</p>
                    
                    <div style="margin: 15px 0;">
                        <span style="color: #374151;"><strong>Priority:</strong></span>
                        <div class="priority-badge" style="background: ${getPriorityColor(report.priority)};">
                            ${report.priority.charAt(0).toUpperCase() + report.priority.slice(1)} Priority
                        </div>
                    </div>
                </div>
                
                <div class="next-steps">
                    <h4 style="margin: 0 0 15px 0; color: #92400e;">📅 What Happens Next:</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                        <li><strong>Immediate:</strong> Your report assigned to ${report.assignedDepartment}</li>
                        <li><strong>Within 2 hours:</strong> Department review and acknowledgment</li>
                        <li><strong>Estimated Resolution:</strong> ${estimatedTime}</li>
                        <li><strong>Updates:</strong> You'll receive email notifications for any status changes</li>
                    </ul>
                </div>
                
                <div style="background: #e0f2fe; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                    <h4 style="margin: 0 0 10px 0; color: #0369a1;">📱 Track Your Report</h4>
                    <p style="margin: 0; color: #0369a1; font-size: 14px;">Save your ticket number: <strong>${report.ticketNumber}</strong></p>
                    <p style="margin: 5px 0 0 0; color: #0369a1; font-size: 12px;">Use this to track progress and reference in any communication</p>
                </div>
                
                <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                    <p style="margin: 0; color: #475569; font-size: 14px;">🏛️ CivicEye - Smart City Management System</p>
                    <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 12px;">Making cities smarter, one report at a time</p>
                    <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 10px;">Powered by Resend API • Production Ready</p>
                </div>
            </div>
            
            <div class="footer">
                <p style="margin: 0; font-weight: bold; color: white;">Thank you for your civic engagement! 🇮🇳</p>
                <p style="margin: 5px 0 0 0; font-size: 14px;">CivicEye Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Status update template
function generateStatusUpdateTemplate(report) {
  const statusColors = {
    'submitted': '#3b82f6',
    'acknowledged': '#f59e0b',
    'in-progress': '#8b5cf6',
    'resolved': '#10b981',
    'closed': '#6b7280'
  };

  const statusColor = statusColors[report.status] || '#6b7280';

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>📋 CivicEye Report Update</title>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 0; border-radius: 12px; max-width: 600px; margin: 0 auto; box-shadow: 0 8px 32px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; }
            .status-badge { background: ${statusColor}; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin: 20px 0; font-weight: bold; font-size: 16px; }
            .content { padding: 30px; }
            .details { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; }
            .resend-badge { background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📋 Report Status Update</h1>
                <p style="margin: 0; font-size: 18px;">Your civic issue has been updated</p>
            </div>
            
            <div class="content">
                <div class="resend-badge">
                    <strong>🚀 POWERED BY RESEND</strong><br>
                    Professional Email Delivery • MVP Demo Mode
                </div>

                <div style="text-align: center;">
                    <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <h3 style="margin: 0; color: #1e293b;">Ticket #${report.ticketNumber}</h3>
                        <div class="status-badge">
                            Status: ${report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </div>
                    </div>
                </div>
                
                <div class="details">
                    <h4 style="margin: 0 0 15px 0; color: #1e293b;">📋 Issue Details:</h4>
                    <p style="margin: 5px 0; color: #374151;"><strong>Title:</strong> ${report.title}</p>
                    <p style="margin: 5px 0; color: #374151;"><strong>Category:</strong> ${report.category.charAt(0).toUpperCase() + report.category.slice(1)}</p>
                    <p style="margin: 5px 0; color: #374151;"><strong>Department:</strong> ${report.assignedDepartment}</p>
                    <p style="margin: 5px 0; color: #374151;"><strong>Priority:</strong> ${report.priority.charAt(0).toUpperCase() + report.priority.slice(1)}</p>
                    <p style="margin: 5px 0; color: #374151;"><strong>Original Reporter:</strong> ${report.reportedBy}</p>
                </div>
                
                ${report.status === 'resolved' ? `
                    <div style="background: linear-gradient(45deg, #10b981, #059669); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                        <h3 style="margin: 0 0 10px 0;">🎉 Issue Resolved!</h3>
                        <p style="margin: 0; font-size: 16px;">Thank you for your patience. Your civic engagement makes our city better!</p>
                    </div>
                ` : ''}
            </div>
            
            <div class="footer">
                <p style="margin: 0; font-weight: bold; color: white;">Thank you for helping make our city better! 🏙️</p>
                <p style="margin: 5px 0 0 0; font-size: 14px;">CivicEye Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

// SLA alert template  
function generateSLAAlertTemplate(report) {
  const hoursSinceCreation = Math.floor((Date.now() - new Date(report.createdAt)) / (1000 * 60 * 60));

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>🚨 SLA Breach Alert</title>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 0; border-radius: 12px; max-width: 600px; margin: 0 auto; box-shadow: 0 8px 32px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #ff6b6b 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .resend-badge { background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚨 SLA BREACH ALERT</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px;">Immediate Action Required</p>
            </div>
            
            <div class="content">
                <div class="resend-badge">
                    <strong>🚀 POWERED BY RESEND</strong><br>
                    All department alerts sent to: sairohithtappatla45@gmail.com
                </div>

                <p style="font-size: 16px; color: #374151; margin-bottom: 25px;">
                    <strong>Dear Department Supervisor,</strong><br>
                    Report ${report.ticketNumber} has exceeded SLA deadline by ${hoursSinceCreation} hours.
                </p>
                
                <div style="background: #f8fafc; border-left: 5px solid #dc2626; padding: 20px; border-radius: 8px;">
                    <h3 style="margin: 0; color: #1e293b;">Ticket #${report.ticketNumber}</h3>
                    <p style="color: #4b5563; margin: 10px 0;"><strong>Issue:</strong> ${report.title}</p>
                    <p style="color: #6b7280; margin: 5px 0;"><strong>Priority:</strong> ${report.priority.toUpperCase()}</p>
                    <p style="color: #6b7280; margin: 5px 0;"><strong>Department:</strong> ${report.assignedDepartment}</p>
                    <p style="color: #6b7280; margin: 5px 0;"><strong>Original Reporter:</strong> ${report.reportedBy}</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Helper functions
function getSupervisorEmail(department) {
  // ⭐ MVP: Return your email for all departments
  return 'sairohithtappatla45@gmail.com';
}

function getPriorityColor(priority) {
  const colors = {
    'critical': '#dc2626',
    'high': '#f59e0b',
    'medium': '#3b82f6',
    'low': '#10b981'
  };
  return colors[priority] || '#6b7280';
}

function getEstimatedResolutionTime(priority) {
  const timeframes = {
    'critical': '4 hours',
    'high': '24 hours',
    'medium': '72 hours',
    'low': '7 days'
  };
  return timeframes[priority] || '72 hours';
}

// ⭐ EXPORTS
module.exports = {
  testEmailConnection,
  sendReportConfirmation,
  sendStatusUpdateNotification,
  sendSLAAlert,
  generateReportConfirmationTemplate,
  generateStatusUpdateTemplate,
  generateSLAAlertTemplate
};

