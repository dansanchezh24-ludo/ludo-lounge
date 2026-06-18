import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.ludo-lounge.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body ?? {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  const { error } = await supabase
    .from('email_subscribers')
    .insert({ email: email.toLowerCase().trim(), source: 'popup_ludo_lounge' });

  if (error) {
    if (error.code === '23505') {
      return res.status(200).json({ ok: true, already: true });
    }
    console.error('Supabase error:', error);
    return res.status(500).json({ error: 'Error al guardar' });
  }

  return res.status(200).json({ ok: true });
}
