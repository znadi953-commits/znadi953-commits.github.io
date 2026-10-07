import { useMemo, useState } from 'react';
import { Check, Copy, Gift, Link2, Share2, Users, Wallet } from 'lucide-react';
import { fmtPrice } from '../lib/api';

type Conv = { title: string; amount: number; commission: number; ref: string; date: string };

const readConvs = (): Conv[] => {
  try {
    return JSON.parse(localStorage.getItem('nadi_aff_conv') || '[]') as Conv[];
  } catch {
    return [];
  }
};

export default function Affiliation() {
  const [name, setName] = useState('');
  const [code, setCode] = useState<string | null>(() => localStorage.getItem('nadi_aff_code'));
  const [copied, setCopied] = useState(false);
  const [convs, setConvs] = useState<Conv[]>(readConvs);
  const [shares, setShares] = useState<number>(() => Number(localStorage.getItem('nadi_aff_shares') || 0));

  const link = useMemo(() => (code ? `${window.location.origin}/?ref=${code}` : ''), [code]);
  const earnings = convs.reduce((s, c) => s + c.commission, 0);

  const generate = () => {
    const slug = name.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
    const c = `${slug || 'NADI'}-${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem('nadi_aff_code', c);
    setCode(c);
  };

  const bumpShare = () => {
    setShares((s) => {
      const n = s + 1;
      localStorage.setItem('nadi_aff_shares', String(n));
      return n;
    });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      /* ignore */
    }
    bumpShare();
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const shareText = encodeURIComponent(
    `Découvre NADIPROMTES — la marketplace premium de prompts IA (Midjourney, GPT, Seedance…) : ${link}`,
  );
  const channels = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${shareText}` },
    { label: 'X / Twitter', href: `https://twitter.com/intent/tweet?text=${shareText}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}` },
    { label: 'E-mail', href: `mailto:?subject=${encodeURIComponent('NADIPROMTES — prompts IA premium')}&body=${shareText}` },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-16 sm:px-6">
      {/* Hero */}
      <div className="text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-gold-300">
          <Gift className="h-3.5 w-3.5" /> Programme d'affiliation
        </p>
        <h1 className="font-display mt-5 text-4xl font-semibold sm:text-5xl">
          Gagnez <span className="text-gold-300">15 %</span> sur chaque vente
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-noir-100/70">
          Partagez votre lien de parrainage : chaque achat conclu grâce à vous reverse 15 % du prix
          sur votre cagnotte. Sans plafond, sans stock, sans créer le moindre prompt.
        </p>
      </div>

      {/* Étapes */}
      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {[
          { icon: Link2, t: '1. Obtenez votre lien', d: 'Générez un code affilié unique — votre lien personnel suit chaque visiteur pendant 30 jours.' },
          { icon: Share2, t: '2. Partagez partout', d: 'WhatsApp, X, Facebook, e-mail… Un clic sur vos canaux préférés depuis cette page.' },
          { icon: Wallet, t: '3. Encaissez 15 %', d: 'Chaque commande confirmée via votre lien crédite votre cagnotte automatiquement.' },
        ].map((s) => (
          <div key={s.t} className="rounded-3xl border border-white/10 bg-noir-900/60 p-7">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-burgundy-600/20 text-burgundy-300">
              <s.icon className="h-5 w-5" />
            </span>
            <h3 className="font-display mt-4 text-lg font-semibold">{s.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-noir-100/60">{s.d}</p>
          </div>
        ))}
      </div>

      {/* Générateur + lien */}
      <div className="mt-14 rounded-3xl border border-white/10 bg-noir-900/60 p-8">
        <h2 className="font-display text-2xl font-semibold">Votre lien d'affilié</h2>
        {!code ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom ou pseudo (optionnel)"
              className="flex-1 rounded-xl border border-white/10 bg-noir-950/70 px-4 py-3 text-sm outline-none focus:border-burgundy-500"
            />
            <button
              onClick={generate}
              className="rounded-full bg-burgundy-600 px-6 py-3 font-semibold transition hover:bg-burgundy-500"
            >
              Générer mon code
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                readOnly
                value={link}
                className="flex-1 rounded-xl border border-gold-500/40 bg-noir-950/70 px-4 py-3 font-mono text-sm text-gold-300 outline-none"
              />
              <button
                onClick={copy}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-500 px-6 py-3 font-semibold text-noir-950 transition hover:bg-gold-400"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {channels.map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={bumpShare}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-noir-100/80 transition hover:border-burgundy-500/50 hover:text-white"
                >
                  {c.label}
                </a>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Dashboard */}
      {code && (
        <div className="mt-8 rounded-3xl border border-white/10 bg-noir-900/60 p-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold">Tableau de bord</h2>
            <span className="rounded-full border border-burgundy-500/40 bg-burgundy-900/30 px-4 py-1.5 font-mono text-xs text-burgundy-300">
              {code}
            </span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/5 bg-noir-950/60 p-5">
              <Users className="h-4 w-4 text-burgundy-400" />
              <div className="font-display mt-3 text-2xl font-semibold">{shares}</div>
              <p className="text-xs text-noir-100/50">Partages de votre lien</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-noir-950/60 p-5">
              <Check className="h-4 w-4 text-burgundy-400" />
              <div className="font-display mt-3 text-2xl font-semibold">{convs.length}</div>
              <p className="text-xs text-noir-100/50">Ventes parrainées (cet appareil)</p>
            </div>
            <div className="rounded-2xl border border-gold-500/30 bg-gold-500/5 p-5">
              <Wallet className="h-4 w-4 text-gold-400" />
              <div className="font-display mt-3 text-2xl font-semibold text-gold-300">{fmtPrice(earnings)}</div>
              <p className="text-xs text-noir-100/50">Commission estimée (15 %)</p>
            </div>
          </div>
          {convs.length > 0 && (
            <ul className="mt-6 space-y-2 text-sm text-noir-100/70">
              {convs.slice(-5).reverse().map((c, i) => (
                <li key={i} className="flex justify-between rounded-xl border border-white/5 bg-noir-950/40 px-4 py-2.5">
                  <span className="truncate pr-4">{c.title}</span>
                  <span className="shrink-0 text-gold-300">+{fmtPrice(c.commission)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-5 text-xs text-noir-100/40">
            Le suivi des clics et conversions s'effectue via le lien de parrainage (?ref=…) et est confirmé
            au moment du checkout. Les statistiques affichées correspondent à cet appareil de démonstration.
          </p>
        </div>
      )}

      {/* FAQ */}
      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {[
          { q: 'Combien je gagne ?', d: '15 % du prix de chaque prompt acheté via votre lien, pendant 30 jours après le clic.' },
          { q: 'Faut-il un compte ?', d: 'Non : votre code est généré instantanément, sans inscription ni minimum de ventes.' },
          { q: 'Quand suis-je payé ?', d: 'La cagnotte est versée chaque mois dès 20 $ atteints, via virement ou PayPal.' },
        ].map((f) => (
          <div key={f.q} className="rounded-3xl border border-white/10 bg-noir-900/40 p-6">
            <h3 className="font-semibold text-gold-300">{f.q}</h3>
            <p className="mt-2 text-sm leading-relaxed text-noir-100/60">{f.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
