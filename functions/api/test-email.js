export async function onRequestGet(context) {
  const { env } = context;

  const debugInfo = {
    hasApiKey: !!env.BREVO_API_KEY,
    hasSenderEmail: !!env.BREVO_SENDER_EMAIL,
    hasAdminEmail: !!env.ADMIN_NOTIFICATION_EMAIL,
    senderEmailValue: env.BREVO_SENDER_EMAIL || 'MISSING',
    adminEmailValue: env.ADMIN_NOTIFICATION_EMAIL || 'MISSING',
  };

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': env.BREVO_API_KEY || '',
      },
      body: JSON.stringify({
        sender: { name: 'BookVault', email: env.BREVO_SENDER_EMAIL },
        to: [{ email: env.ADMIN_NOTIFICATION_EMAIL }],
        subject: 'Test Email from BookVault',
        htmlContent: '<p>This is a test email to debug Brevo integration.</p>',
      }),
    });

    const responseText = await res.text();

    return new Response(
      JSON.stringify({
        debugInfo,
        brevoStatus: res.status,
        brevoOk: res.ok,
        brevoResponse: responseText,
      }, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        debugInfo,
        error: err.message,
      }, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
