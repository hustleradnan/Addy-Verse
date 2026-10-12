import { createClient } from '@supabase/supabase-js';

async function sha256Hmac(key, message) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  return signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sendOrderEmail(env, { customerEmail, customerName, ebookTitles, amount, orderId }) {
  try {
    if (!env.BREVO_API_KEY || !env.ADMIN_NOTIFICATION_EMAIL) return;

    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'BookVault', email: env.ADMIN_NOTIFICATION_EMAIL },
        to: [{ email: env.ADMIN_NOTIFICATION_EMAIL }],
        subject: `New Order: ${ebookTitles} - ₹${amount}`,
        htmlContent: `
          <h2>New Order Received</h2>
          <p><strong>eBook(s):</strong> ${ebookTitles}</p>
          <p><strong>Amount:</strong> ₹${amount}</p>
          <p><strong>Customer Name:</strong> ${customerName || 'N/A'}</p>
          <p><strong>Customer Email:</strong> ${customerEmail}</p>
          <p><strong>Order ID:</strong> ${orderId}</p>
        `,
      }),
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return new Response(JSON.stringify({ error: 'Login zaroori hai.' }), { status: 401 });
    }

    const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Session invalid hai.' }), { status: 401 });
    }

    const userId = userData.user.id;

    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return new Response(JSON.stringify({ error: 'Payment details incomplete hain.' }), { status: 400 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, total_amount, status')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order nahi mila.' }), { status: 404 });
    }

    if (order.user_id !== userId) {
      return new Response(JSON.stringify({ error: 'Ye order aapka nahi hai.' }), { status: 403 });
    }

    if (order.status === 'paid') {
      return new Response(JSON.stringify({ success: true, message: 'Order pehle se hi complete hai.' }), { status: 200 });
    }

    const expectedSignature = await sha256Hmac(
      env.RAZORPAY_KEY_SECRET,
      `${razorpay_order_id}|${razorpay_payment_id}`
    );

    if (expectedSignature !== razorpay_signature) {
      await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('id', order_id);
      return new Response(JSON.stringify({ error: 'Payment verify nahi hua. Signature match nahi hui.' }), { status: 400 });
    }

    const { error: updateOrderError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', order_id);

    if (updateOrderError) {
      return new Response(JSON.stringify({ error: 'Order update karne mein error: ' + updateOrderError.message }), { status: 500 });
    }

    const { error: paymentInsertError } = await supabaseAdmin.from('payments').insert({
      order_id: order.id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount: order.total_amount,
      status: 'success',
      method: 'razorpay',
    });

    if (paymentInsertError) {
      return new Response(JSON.stringify({ error: 'Payment record create karne mein error: ' + paymentInsertError.message }), { status: 500 });
    }

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('ebook_id, ebooks ( title )')
      .eq('order_id', order.id);

    if (itemsError) {
      return new Response(JSON.stringify({ error: 'Order items fetch karne mein error: ' + itemsError.message }), { status: 500 });
    }

    if (items && items.length > 0) {
      for (const item of items) {
        const { data: existingDownload } = await supabaseAdmin
          .from('downloads')
          .select('id')
          .eq('user_id', userId)
          .eq('ebook_id', item.ebook_id)
          .maybeSingle();

        if (!existingDownload) {
          const downloadToken = crypto.randomUUID();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 365);

          const { error: downloadInsertError } = await supabaseAdmin.from('downloads').insert({
            user_id: userId,
            ebook_id: item.ebook_id,
            order_id: order.id,
            download_token: downloadToken,
            expires_at: expiresAt.toISOString(),
          });

          if (downloadInsertError) {
            return new Response(JSON.stringify({ error: 'Download record create karne mein error: ' + downloadInsertError.message }), { status: 500 });
          }
        }
      }
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    const ebookTitles = (items || []).map((i) => i.ebooks?.title).filter(Boolean).join(', ');

    await sendOrderEmail(env, {
      customerEmail: profile?.email || userData.user.email,
      customerName: profile?.full_name,
      ebookTitles,
      amount: order.total_amount,
      orderId: order.id,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error: ' + err.message }), { status: 500 });
  }
}
