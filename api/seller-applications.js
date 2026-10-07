import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('seller_applications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { name, email, portfolio_url, specialty, message } = req.body || {};
      if (!name || !email || !specialty || !message) return res.status(400).json({ error: 'Veuillez remplir tous les champs requis.' });
      const { data, error } = await supabase.from('seller_applications').insert({ name, email, portfolio_url: portfolio_url || '', specialty, message, status: 'pending' }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API seller-applications error:', err);
    return res.status(500).json({ error: err.message });
  }
}
