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

    const { data: download, error: downloadError } = await supabaseAdmin
      .from('downloads')
      .select('id, expires_at')
      .eq('user_id', userId)
      .eq('ebook_id', ebook_id)
      .maybeSingle();

    if (downloadError || !download) {
      return new Response(JSON.stringify({ error: 'Aapne ye eBook khareedi/claim nahi ki hai.' }), { status: 403 });
    }

    if (download.expires_at && new Date(download.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Download link expire ho chuka hai.' }), { status: 403 });
    }

    const { data: ebook, error: ebookError } = await supabaseAdmin
      .from('ebooks')
      .select('file_path, title')
      .eq('id', ebook_id)
      .single();

    if (ebookError || !ebook || !ebook.file_path) {
      return new Response(JSON.stringify({ error: 'eBook file nahi mili.' }), { status: 404 });
    }

    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin
      .storage
      .from('ebook-files')
      .createSignedUrl(ebook.file_path, 300);

    if (signedUrlError || !signedUrlData) {
      return new Response(JSON.stringify({ error: 'Download link generate nahi ho paya: ' + (signedUrlError?.message || '') }), { status: 500 });
    }

    return new Response(
      JSON.stringify({ success: true, url: signedUrlData.signedUrl, title: ebook.title }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error: ' + err.message }), { status: 500 });
  }
}
