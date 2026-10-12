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

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const rawBody = await request.text();
    const razorpaySignature = request.headers.get('x-razorpay-signature');

    if (!razorpaySignature) {
      return new Response(JSON.stringify({ error: 'Signature missing.' }), { status: 400 });
    }

    const expectedSignature = await sha256Hmac(env.RAZORPAY_WEBHOOK_SECRET, rawBody);

    if (expectedSignature !== razorpaySignature) {
      return new Response(JSON.stringify({ error: 'Invalid signature.' }), { status: 400 });
    }

    const payload = JSON.parse(rawBody);

    if (payload.event !== 'payment.captured') {
      return new Response(JSON.stringify({ success: true, message: 'Event ignored.' }), { status: 200 });
    }

    const paymentEntity = payload.payload?.payment?.entity;
    if (!paymentEntity) {
      return new Response(JSON.stringify({ error: 'Payment entity missing.' }), { status: 400 });
    }

    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;
    const amount = paymentEntity.amount / 100;

    const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, status')
      .eq('razorpay_order_id', razorpayOrderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order nahi mila.' }), { status: 404 });
    }

    if (order.status === 'paid') {
      return new Response(JSON.stringify({ success: true, message: 'Already processed.' }), { status: 200 });
    }

    await supabaseAdmin
      .from('orders')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', order.id);

    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('razorpay_payment_id', razorpayPaymentId)
      .maybeSingle();

    if (!existingPayment) {
      await supabaseAdmin.from('payments').insert({
        order_id: order.id,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        amount,
        status: 'success',
        method: 'razorpay',
      });
    }

    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('ebook_id')
      .eq('order_id', order.id);

    if (items && items.length > 0) {
      for (const item of items) {
        const { data: existingDownload } = await supabaseAdmin
          .from('downloads')
          .select('id')
          .eq('user_id', order.user_id)
          .eq('ebook_id', item.ebook_id)
          .eq('order_id', order.id)
          .maybeSingle();

        if (!existingDownload) {
          const downloadToken = crypto.randomUUID();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 365);

          await supabaseAdmin.from('downloads').insert({
            user_id: order.user_id,
            ebook_id: item.ebook_id,
            order_id: order.id,
            download_token: downloadToken,
            expires_at: expiresAt.toISOString(),
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error: ' + err.message }), { status: 500 });
  }
}
