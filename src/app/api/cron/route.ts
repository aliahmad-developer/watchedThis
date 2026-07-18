import type { NextRequest } from 'next/server';
 
export function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
 
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }
 
  return Response.json({ success: true });
}