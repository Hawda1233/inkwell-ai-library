import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') as string;

  if (!supabaseUrl || !serviceKey || !anonKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase environment variables' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const authHeader = req.headers.get('Authorization');
  const jwt = authHeader?.replace('Bearer ', '');

  // Client for privileged operations
  const supabaseAdmin = createClient(supabaseUrl, serviceKey);
  // Client bound to caller JWT for role check
  const supabaseUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  try {
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Ensure caller is admin
    const { data: isAdminData, error: roleErr } = await supabaseAdmin
      .rpc('has_role', { _user_id: userData.user.id, _role: 'admin' });

    if (roleErr || !isAdminData) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const body = await req.json();
    const students = (body?.students || []) as Array<{ full_name: string; email: string }>;

    if (!Array.isArray(students) || students.length === 0) {
      return new Response(JSON.stringify({ error: 'No students provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    let success = 0;
    const errors: string[] = [];

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const rowPrefix = `Row ${i + 1}`;
      if (!s?.email) {
        errors.push(`${rowPrefix}: Missing email`);
        continue;
      }

      try {
        // Try to invite the user; if already exists, fetch their id
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
          s.email,
          { data: { full_name: s.full_name || '' } }
        );

        let userId = created?.user?.id;
        if (createErr && createErr.status !== 422) { // 422: user already exists
          errors.push(`${rowPrefix}: ${createErr.message}`);
          continue;
        }

        if (!userId) {
          // fetch existing user by email
          const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1,
          });
          if (listErr) {
            errors.push(`${rowPrefix}: ${listErr.message}`);
            continue;
          }
          // naive lookup (admin API lacks direct getByEmail); for large batches this is not ideal
          const existing = list.users.find(u => u.email?.toLowerCase() === s.email.toLowerCase());
          if (!existing) {
            errors.push(`${rowPrefix}: Could not resolve user id`);
            continue;
          }
          userId = existing.id;
        }

        // Ensure profile exists
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          email: s.email,
          full_name: s.full_name || '',
        }, { onConflict: 'id' });

        // Assign student role
        const { error: roleInsertErr } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: userId, role: 'student' })
          .single();
        if (roleInsertErr && !roleInsertErr.message.includes('duplicate key')) {
          errors.push(`${rowPrefix}: Role assign failed - ${roleInsertErr.message}`);
          continue;
        }

        success++;
      } catch (e: any) {
        errors.push(`${rowPrefix}: ${e?.message || 'Unknown error'}`);
      }
    }

    return new Response(
      JSON.stringify({ success, failed: students.length - success, errors }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
