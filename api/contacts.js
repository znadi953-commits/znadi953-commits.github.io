import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'POST') {
      const { name, email, subject, message } = req.body || {};
      if (!name || !email || !subject || !message) return res.status(400).json({ error: 'Veuillez remplir tous les champs.' });
      const { data, error } = await supabase.from('contacts').insert({ name, email, subject, message }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API contacts error:', err);
    return res.status(500).json({ error: err.message });
  }
}
