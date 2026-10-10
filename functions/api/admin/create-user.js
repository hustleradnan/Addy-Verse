import { createClient } from '@supabase/supabase-js';

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return jsonResponse({ error: 'Missing authorization token' }, 401);
    }

    const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user: callerUser }, error: callerError } = await supabaseAdmin.auth.getUser(token);

    if (callerError || !callerUser) {
      return jsonResponse({ error: 'Invalid or expired session. Please log in again.' }, 401);
    }

    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role_id')
      .eq('id', callerUser.id)
      .single();

    if (profileError || !callerProfile) {
      return jsonResponse({ error: 'Profile not found for this account.' }, 403);
    }

    const { data: callerRole, error: callerRoleError } = await supabaseAdmin
      .from('roles')
      .select('name')
      .eq('id', callerProfile.role_id)
      .single();

    if (callerRoleError || !callerRole || callerRole.name !== 'super_admin') {
      return jsonResponse({ error: 'Forbidden: Only Super Admin can create staff accounts.' }, 403);
    }

    const body = await request.json();
    const { full_name, email, password, role } = body;

    if (!full_name || !email || !password || !role) {
      return jsonResponse({ error: 'All fields (name, email, password, role) are required.' }, 400);
    }

    if (!['admin', 'editor'].includes(role)) {
      return jsonResponse({ error: 'Invalid role. Only "admin" or "editor" can be created here.' }, 400);
    }

    if (password.length < 8) {
      return jsonResponse({ error: 'Password must be at least 8 characters long.' }, 400);
    }

    const { data: targetRole, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', role)
      .single();

    if (roleError || !targetRole) {
      return jsonResponse({ error: 'Requested role does not exist in the database.' }, 400);
    }

    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) {
      return jsonResponse({ error: createError.message }, 400);
    }

    const newUserId = newUserData.user.id;

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role_id: targetRole.id, full_name })
      .eq('id', newUserId);

    if (updateError) {
      return jsonResponse(
        { error: 'User account was created, but assigning the role failed: ' + updateError.message },
        500
      );
    }

    return jsonResponse({ success: true, user_id: newUserId, email, role }, 200);
  } catch (err) {
    return jsonResponse({ error: 'Server error: ' + err.message }, 500);
  }
}

export async function onRequestGet() {
  return jsonResponse({ error: 'Method not allowed' }, 405);
}
