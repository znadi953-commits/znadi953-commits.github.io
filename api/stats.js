import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const [p, s, r] = await Promise.all([
        supabase.from('prompts').select('*', { count: 'exact', head: true }),
        supabase.from('sellers').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
      ]);
      const { data: orders } = await supabase.from('orders').select('amount');
      const { data: rated } = await supabase.from('prompts').select('rating');
      const totalSales = (orders || []).length;
      const revenue = (orders || []).reduce((sum, o) => sum + Number(o.amount || 0), 0);
      const avgRating = rated && rated.length
        ? Math.round((rated.reduce((sum, x) => sum + Number(x.rating || 0), 0) / rated.length) * 10) / 10
        : 0;
      return res.status(200).json({
        prompts: p.count || 0, sellers: s.count || 0, reviews: r.count || 0,
        totalSales, revenue: Math.round(revenue * 100) / 100, avgRating,
      });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API stats error:', err);
    return res.status(500).json({ error: err.message });
  }
}
