import { createClient } from '@supabase/supabase-js';

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
      return new Response(JSON.stringify({ error: 'Session invalid hai. Dobara login karein.' }), { status: 401 });
    }

    const userId = userData.user.id;

    const body = await request.json();
    const { ebook_id } = body;

    if (!ebook_id) {
      return new Response(JSON.stringify({ error: 'eBook ID zaroori hai.' }), { status: 400 });
    }

    const { data: ebook, error: ebookError } = await supabaseAdmin
      .from('ebooks')
      .select('id, title, price, discount_price, is_published')
      .eq('id', ebook_id)
      .single();

    if (ebookError || !ebook) {
      return new Response(JSON.stringify({ error: 'eBook nahi mili.' }), { status: 404 });
    }

    if (!ebook.is_published) {
      return new Response(JSON.stringify({ error: 'Ye eBook abhi available nahi hai.' }), { status: 400 });
    }

    const finalPrice = ebook.discount_price && ebook.discount_price > 0 ? ebook.discount_price : ebook.price;

    if (!finalPrice || finalPrice <= 0) {
      return new Response(JSON.stringify({ error: 'Ye eBook free hai, is route se order nahi ban sakta.' }), { status: 400 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        total_amount: finalPrice,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      return new Response(JSON.stringify({ error: 'Order create karne mein error: ' + orderError.message }), { status: 500 });
    }

    await supabaseAdmin.from('order_items').insert({
      order_id: order.id,
      ebook_id: ebook.id,
      price: finalPrice,
      quantity: 1,
    });

    const amountInPaise = Math.round(finalPrice * 100);

    const razorpayAuth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${razorpayAuth}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.id,
        notes: {
          ebook_id: ebook.id,
          order_id: order.id,
        },
      }),
    });

    const razorpayData = await razorpayRes.json();

    if (!razorpayRes.ok) {
      return new Response(JSON.stringify({ error: 'Razorpay order create karne mein error: ' + (razorpayData?.error?.description || 'Unknown error') }), { status: 500 });
    }

    await supabaseAdmin
      .from('orders')
      .update({ razorpay_order_id: razorpayData.id })
      .eq('id', order.id);

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        razorpay_order_id: razorpayData.id,
        amount: amountInPaise,
        currency: 'INR',
        key_id: env.RAZORPAY_KEY_ID,
        ebook_title: ebook.title,
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error: ' + err.message }), { status: 500 });
  }
}
