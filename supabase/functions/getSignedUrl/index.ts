import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { verify } from 'https://deno.land/x/djwt@v2.8/mod.ts';

serve(async (req) => {
  try {
    // 1. Validate the user's JWT from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET');
    if (!jwtSecret) {
      return new Response('Server error: JWT secret not configured', { status: 500 });
    }

    const payload = await verify(token, jwtSecret, 'HS256');
    const userId = payload.sub; // The user ID is in the 'sub' claim

    const { filePath } = await req.json();
    if (!filePath) {
      return new Response('Bad Request: filePath is required', { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // 2. Check if the file exists and belongs to the user
    const { data, error } = await supabase
      .from('files')
      .select('id, owner_id')
      .eq('path', filePath)
      .single();

    if (error || !data) {
      return new Response('File not found or access denied.', { status: 404 });
    }

    if (data.owner_id !== userId) {
      // This is a safety check, RLS should already handle this.
      return new Response('Forbidden: You do not own this file.', { status: 403 });
    }

    // 3. If valid, return a signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('your-bucket-name') // Replace with your actual bucket name
      .createSignedUrl(filePath, 60);

    if (signedUrlError) {
      console.error(signedUrlError);
      return new Response('Error generating signed URL.', { status: 500 });
    }

    return new Response(JSON.stringify({ signedUrl: signedUrlData.signedUrl }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    console.error(e);
    return new Response('Internal Server Error', { status: 500 });
  }
});