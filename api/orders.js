import supabase from './db-client.js';

const COMMISSION_RATE = 0.15;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { seller_id, limit } = req.query;
      let query = supabase.from('orders').select('*, prompts(id,title,preview_image_url)').order('created_at', { ascending: false });
      if (seller_id) query = query.eq('seller_id', seller_id);
      if (limit) query = query.limit(Number(limit));
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { items, buyer_name, buyer_email } = req.body || {};
      if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Panier vide.' });
      if (!buyer_name || !buyer_email) return res.status(400).json({ error: 'Nom et e-mail requis.' });
      const created = [];
      for (const promptId of items) {
        const { data: prompt } = await supabase.from('prompts').select('id, price, seller_id, sales_count').eq('id', Number(promptId)).single();
        if (!prompt) continue;
        const amount = Number(prompt.price);
        const commission = Math.round(amount * COMMISSION_RATE * 100) / 100;
        const seller_payout = Math.round((amount - commission) * 100) / 100;
        const { data: order, error: oErr } = await supabase.from('orders').insert({
          prompt_id: prompt.id, seller_id: prompt.seller_id, buyer_name, buyer_email,
          amount, commission, seller_payout, status: 'completed',
        }).select().single();
        if (oErr) throw oErr;
        created.push(order);
        await supabase.from('prompts').update({ sales_count: (prompt.sales_count || 0) + 1 }).eq('id', prompt.id);
      }
      if (created.length === 0) return res.status(400).json({ error: 'Aucune commande creee.' });
      return res.status(201).json(created);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API orders error:', err);
    return res.status(500).json({ error: err.message });
  }
}
