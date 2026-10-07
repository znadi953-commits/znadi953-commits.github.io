import { Link } from 'react-router-dom';
import { Clapperboard, Flame, Star, TrendingUp } from 'lucide-react';
import { fmtPrice, type Prompt } from '../lib/api';

export default function PromptCard({ prompt }: { prompt: Prompt }) {
  return (
    <Link
      to={`/prompt/${prompt.id}`}
      className="group overflow-hidden rounded-2xl border border-white/5 bg-noir-850 transition hover:border-burgundy-600/50 hover:shadow-xl hover:shadow-burgundy-900/20"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={prompt.preview_image_url}
          alt={prompt.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          {prompt.categories?.slug === 'video-ia' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-burgundy-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
              <Clapperboard className="h-3 w-3" /> Vidéo
            </span>
          )}
          {prompt.bestseller && (
            <span className="rounded-full bg-burgundy-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
              Bestseller
            </span>
          )}
          {prompt.trending && (
            <span className="inline-flex items-center gap-1 rounded-full bg-noir-950/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-burgundy-300">
              <TrendingUp className="h-3 w-3" /> Tendance
            </span>
          )}
        </div>
        <span className="absolute bottom-3 right-3 rounded-full bg-noir-950/85 px-3 py-1 text-[11px] font-medium text-noir-100/90">
          {prompt.ai_model}
        </span>
      </div>
      <div className="p-4">
        <div className="mb-1 text-[11px] uppercase tracking-wider text-burgundy-300/80">
          {prompt.categories?.name ?? 'Prompt'}
        </div>
        <h3 className="font-display line-clamp-1 font-semibold">{prompt.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-noir-100/60">{prompt.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-sm text-amber-300">
            <Star className="h-4 w-4 fill-current" />
            {(prompt.rating ?? 0).toFixed(1)}
            <span className="text-noir-100/40">· {prompt.sales_count ?? 0} ventes</span>
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-burgundy-300">
            {prompt.bestseller && <Flame className="h-3.5 w-3.5 text-burgundy-400" />}
            {fmtPrice(Number(prompt.price))}
          </span>
        </div>
      </div>
    </Link>
  );
}
