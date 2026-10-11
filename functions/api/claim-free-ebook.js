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

    const effectivePrice = ebook.discount_price && ebook.discount_price > 0 ? ebook.discount_price : ebook.price;

    if (effectivePrice && effectivePrice > 0) {
      return new Response(JSON.stringify({ error: 'Ye eBook free nahi hai.' }), { status: 400 });
    }

    const { data: existingDownload } = await supabaseAdmin
      .from('downloads')
      .select('id')
      .eq('user_id', userId)
      .eq('ebook_id', ebook.id)
      .maybeSingle();

    if (existingDownload) {
      return new Response(JSON.stringify({ success: true, message: 'Aapne ye eBook pehle hi claim kar li hai.' }), { status: 200 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        total_amount: 0,
        status: 'paid',
      })
      .select()
      .single();

    if (orderError) {
      return new Response(JSON.stringify({ error: 'Order create karne mein error: ' + orderError.message }), { status: 500 });
    }

    await supabaseAdmin.from('order_items').insert({
      order_id: order.id,
      ebook_id: ebook.id,
      price: 0,
      quantity: 1,
    });

    const downloadToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 365);

    await supabaseAdmin.from('downloads').insert({
      user_id: userId,
      ebook_id: ebook.id,
      order_id: order.id,
      download_token: downloadToken,
      expires_at: expiresAt.toISOString(),
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error: ' + err.message }), { status: 500 });
  }
}
