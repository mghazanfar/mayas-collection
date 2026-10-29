// Supabase free projects pause after ~7 days without activity. This scheduled
// function runs daily and makes one tiny read so the project never goes idle.
const keepalive = async () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return new Response("supabase env not set", { status: 200 });

  const res = await fetch(`${url}/rest/v1/settings?select=key&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  console.log("supabase keepalive", res.status);
  return new Response(`ok ${res.status}`, { status: 200 });
};

export const config = { schedule: "@daily" };

export default keepalive;
