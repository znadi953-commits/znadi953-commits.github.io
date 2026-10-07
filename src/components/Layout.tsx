import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function Layout() {
  const { pathname, hash } = useLocation();

  /* Capture du code de parrainage affiliate (?ref=CODE) — fenêtre 30 jours. */
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) {
      localStorage.setItem('nadi_ref', JSON.stringify({ code: ref.toUpperCase().slice(0, 16), ts: Date.now() }));
    }
  }, []);

  useEffect(() => {
    if (hash) {
      const scroll = () => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
      if (document.querySelector(hash)) scroll();
      else setTimeout(scroll, 120);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return (
    <div className="min-h-screen bg-noir-950 font-sans text-white">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-noir-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center" aria-label="NADIPROMTES — accueil">
            <img
              src="/images/logo-nadipromtes.png"
              alt="NADIPROMTES"
              className="h-10 w-auto sm:h-11"
            />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-noir-100/80 md:flex">
            <Link to="/catalogue" className="transition hover:text-white">Catalogue</Link>
            <Link to="/demo/galerie" className="transition hover:text-white">Démo Galerie</Link>
            <Link to="/#categories" className="transition hover:text-white">Catégories</Link>
            <Link to="/#vendre" className="transition hover:text-white">Vendre</Link>
            <Link to="/affiliation" className="transition hover:text-white">Affiliation</Link>
            <Link to="/#apropos" className="transition hover:text-white">À propos</Link>
          </nav>
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 rounded-full bg-burgundy-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-burgundy-900/40 transition hover:bg-burgundy-500"
          >
            <Sparkles className="h-4 w-4" /> Explorer
          </Link>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer id="apropos" className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-noir-100/50 sm:flex-row sm:px-6">
          <span className="font-display text-base text-noir-100/80">
            <img src="/images/logo-nadipromtes.png" alt="NADIPROMTES" className="h-8 w-auto" />
          </span>
          <p>© 2026 NADIPROMTES — Marketplace premium de prompts IA.</p>
          <div className="flex gap-6">
            <Link to="/catalogue" className="transition hover:text-white">Catalogue</Link>
            <Link to="/#vendre" className="transition hover:text-white">Vendeurs</Link>
            <Link to="/affiliation" className="transition hover:text-white">Affiliation</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
