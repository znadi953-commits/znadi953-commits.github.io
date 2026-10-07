import { useState } from 'react';
import { Database, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';

type SyncResult = {
  ok?: boolean;
  pages?: number;
  inserted?: number;
  updated?: number;
  skipped?: string[];
  error?: string;
};

const SCHEMA = [
  ['Titre', 'title', 'Nom du prompt'],
  ['Prix', 'number', 'Prix en $ (ex: 3.99)'],
  ['Catégorie', 'select', 'Photographie, Mode, Vidéo IA…'],
  ['Modèle IA', 'select', 'Midjourney, Nano Banana, Seedance 2.0…'],
  ['Vendeur', 'select', 'Studio NADI, Elena Marchand…'],
  ['Image', 'url', '/images/mon-visuel.jpg'],
  ['Description', 'rich_text', 'Accroche courte (carte catalogue)'],
  ['Description longue', 'rich_text', 'Texte complet de la fiche'],
  ['Aperçu prompt', 'rich_text', 'Teaser verrouillé du prompt'],
  ['Prompt complet', 'rich_text', 'Prompt livré après achat'],
  ['Tags', 'multi_select', 'mots-clés'],
  ['Trending', 'checkbox', 'mise en avant'],
  ['Bestseller', 'checkbox', 'badge best-seller'],
];

export default function AdminSync() {
  const [token, setToken] = useState(() => localStorage.getItem('nadi_notion_token') || '');
  const [dbId, setDbId] = useState(() => localStorage.getItem('nadi_notion_db') || '');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const sync = async () => {
    setBusy(true);
    setResult(null);
    localStorage.setItem('nadi_notion_token', token);
    localStorage.setItem('nadi_notion_db', dbId);
    try {
      const res = await fetch('/api/notion-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, database_id: dbId }),
      });
      setResult((await res.json()) as SyncResult);
    } catch (e) {
      setResult({ error: String(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-16 sm:px-6">
      <p className="inline-flex items-center gap-2 rounded-full border border-burgundy-500/40 bg-burgundy-900/30 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-burgundy-300">
        <ShieldCheck className="h-3.5 w-3.5" /> Administration
      </p>
      <h1 className="font-display mt-5 text-4xl font-semibold">Notion → CMS du site</h1>
      <p className="mt-4 max-w-2xl text-noir-100/70">
        Votre base Notion devient le back-office de NADIPROMTES : ajoutez ou modifiez des lignes
        dans Notion, puis synchronisez — les fiches du catalogue se créent et se mettent à jour
        automatiquement (upsert par titre).
      </p>

      {/* Connexion */}
      <div className="mt-10 rounded-3xl border border-white/10 bg-noir-900/60 p-8">
        <h2 className="font-display flex items-center gap-2 text-2xl font-semibold">
          <Database className="h-5 w-5 text-burgundy-400" /> Connexion Notion
        </h2>
        <label className="mt-6 block text-sm">
          <span className="mb-1.5 block text-noir-100/70">Token d'intégration (secret_…)</span>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="secret_xxxxxxxxxxxx"
            className="w-full rounded-xl border border-white/10 bg-noir-950/70 px-4 py-3 font-mono text-sm outline-none focus:border-burgundy-500"
          />
        </label>
        <label className="mt-4 block text-sm">
          <span className="mb-1.5 block text-noir-100/70">ID de la base de données</span>
          <input
            value={dbId}
            onChange={(e) => setDbId(e.target.value)}
            placeholder="a1b2c3d4e5f6…"
            className="w-full rounded-xl border border-white/10 bg-noir-950/70 px-4 py-3 font-mono text-sm outline-none focus:border-burgundy-500"
          />
        </label>
        <button
          onClick={sync}
          disabled={busy || !token || !dbId}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-burgundy-600 px-7 py-3.5 font-semibold transition hover:bg-burgundy-500 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Synchroniser le catalogue
        </button>

        {result && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-noir-950/60 p-5 text-sm">
            {result.error ? (
              <p className="text-red-400">{result.error}</p>
            ) : (
              <>
                <p className="text-gold-300">
                  ✅ Sync terminée : {result.pages} lignes Notion → {result.inserted} créations,{' '}
                  {result.updated} mises à jour.
                </p>
                {(result.skipped?.length ?? 0) > 0 && (
                  <ul className="mt-3 list-inside list-disc text-noir-100/60">
                    {result.skipped!.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Guide */}
      <div className="mt-8 rounded-3xl border border-white/10 bg-noir-900/60 p-8">
        <h2 className="font-display text-2xl font-semibold">Guide d'installation (3 min)</h2>
        <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-noir-100/70">
          <li>
            Créez une intégration sur <span className="text-white">notion.so/my-integrations</span> →
            copiez le <b>token interne</b> (secret_…).
          </li>
          <li>
            Dans Notion : <b>Nouvelle base de données</b> avec les propriétés ci-dessous, puis menu
            <b> ⋯ → Connexions</b> → choisissez votre intégration (sinon l'API ne verra rien).
          </li>
          <li>
            Copiez l'<b>ID de la base</b> (fin de l'URL, 32 caractères) et collez token + ID
            ci-dessus → <b>Synchroniser</b>.
          </li>
        </ol>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-noir-950/60 text-noir-100/60">
              <tr>
                <th className="px-4 py-2.5">Propriété Notion</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Contenu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {SCHEMA.map(([n, t, d]) => (
                <tr key={n}>
                  <td className="px-4 py-2.5 font-mono text-gold-300">{n}</td>
                  <td className="px-4 py-2.5 text-burgundy-300">{t}</td>
                  <td className="px-4 py-2.5 text-noir-100/60">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-5 text-xs text-noir-100/40">
          Astuce : le champ Image accepte une URL publique ou un chemin du site
          (/images/…). La sync est un upsert par titre — renommer une ligne Notion crée une nouvelle
          fiche.
        </p>
      </div>
    </div>
  );
}
