# NOTION-CMS — Notion comme back-office de NADIPROMTES

Le site se synchronise depuis une base de données Notion : chaque ligne = une fiche
produit. Ajout / modification dans Notion → clic « Synchroniser » sur `/admin/sync`
(ou appel API) → le catalogue Supabase se met à jour (upsert par titre).

## 1. Créer l'intégration Notion
1. https://www.notion.so/my-integrations → **New integration** (type : interne).
2. Copier le **token interne** (`secret_…`).

## 2. Créer la base de données
Nouvelle base (table) avec **exactement** ces propriétés :

| Propriété            | Type         | Exemple / rôle                            |
| -------------------- | ------------ | ----------------------------------------- |
| Titre                | title        | Nom de la fiche                           |
| Prix                 | number       | 3.99                                      |
| Catégorie            | select       | Photographie, Mode, Vidéo IA… (doit exister sur le site) |
| Modèle IA            | select       | Midjourney, Nano Banana, Seedance 2.0…    |
| Vendeur              | select       | Studio NADI, Elena Marchand…              |
| Image                | url          | `/images/mon-visuel.jpg` ou URL publique  |
| Description          | rich_text    | Accroche courte (carte catalogue)         |
| Description longue   | rich_text    | Texte complet de la fiche                 |
| Aperçu prompt        | rich_text    | Teaser verrouillé avant achat             |
| Prompt complet       | rich_text    | Prompt livré après achat                  |
| Tags                 | multi_select | mots-clés                                 |
| Trending             | checkbox     | mise en avant                             |
| Bestseller           | checkbox     | badge best-seller                         |

Puis : menu **⋯ → Connexions** de la base → ajouter l'intégration créée en 1.
(Sans cette étape, l'API Notion ne voit pas la base.)

## 3. Récupérer l'ID de la base
URL de la base : `notion.so/AAAA…BBBB?v=…` → l'ID = les 32 caractères hex
(avant le `?v=`).

## 4. Synchroniser
- UI : `/admin/sync` → coller token + ID → **Synchroniser le catalogue**.
- API : `POST /api/notion-sync` avec `{"token":"secret_…","database_id":"…"}`
  (ou variables d'env `NOTION_TOKEN` / `NOTION_DATABASE_ID` sur Vercel).
- État : `GET /api/notion-sync` → `{"configured":true|false}`.

## Règles de sync
- **Upsert par titre** : titre identique → mise à jour ; nouveau titre → création.
- Renommer une ligne Notion = crée une nouvelle fiche (l'ancienne reste).
- Catégorie / Vendeur inconnus → valeurs par défaut (catégorie 1, vendeur 1).
- Prix absent → 3.99. Image absente → `/images/hero-bg.jpg`.
- 100 lignes max par sync (page_size Notion).
