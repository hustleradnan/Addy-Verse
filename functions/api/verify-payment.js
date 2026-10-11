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

    if (order.status === 'completed') {
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

    await supabaseAdmin
      .from('orders')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', order_id);

    await supabaseAdmin.from('payments').insert({
      order_id: order.id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount: order.total_amount,
      status: 'success',
      method: 'razorpay',
    });

    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('ebook_id')
      .eq('order_id', order.id);

    if (items && items.length > 0) {
      for (const item of items) {
        const downloadToken = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 365);

        await supabaseAdmin.from('downloads').insert({
          user_id: userId,
          ebook_id: item.ebook_id,
          order_id: order.id,
          download_token: downloadToken,
          expires_at: expiresAt.toISOString(),
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error: ' + err.message }), { status: 500 });
  }
}
