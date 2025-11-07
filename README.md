Social API (POC) + Discover Mock
================================

API REST d'un mini réseau social (inscription, login JWT, posts avec scroll infini, likes) et un mock d'API d'articles (JSON Server) pour la découverte de contenus (pagination, filtres par tags, commentaires).

Prérequis
---------
- Node.js 18+ (pour exécuter localement et lancer les tests Newman)
- Docker & Docker Compose (recommandé pour lancer l'ensemble rapidement)

Démarrage rapide (Docker recommandé)
------------------------------------
```
# (optionnel) définir le secret JWT
export JWT_SECRET="change_me_in_prod"

# build & run
docker compose up --build -d

# Vérifications
curl -s http://localhost:3000/health     # API
curl -s http://localhost:4000/articles   # Mock Discover
```

- API: http://localhost:3000
- Mock Discover (json-server): http://localhost:4000

Démarrage en local (sans Docker)
--------------------------------
```
# installer dépendances
npm install

# config (recommandé)
cp ENV.EXAMPLE .env
# éditer .env et mettre votre JWT_SECRET

# lancer l'API
npm run dev   # ou npm start
# -> http://localhost:3000/health

# lancer le mock Discover
npm run mock:discover
# -> http://localhost:4000/articles
```

Tests automatisés (Postman/Newman)
-----------------------------------
Une collection Postman et un environnement sont fournis.

- Collection: tests/postman/social-api.postman_collection.json
- Environnement: tests/postman/local.postman_environment.json

Exécution en CLI (Newman):
```
npm run test:api         # exécute la collection (auth + posts + scénario 30 posts + mock Discover)
npm run test:api:html    # idem + rapport HTML: tests/postman/report.html
```

La collection enchaîne:
- Register → Login (stocke le token)
- Create Post → List Posts (cursor) → Like/Unlike
- Scénario: seed 30 posts puis vérifie la pagination cursor sans doublons
- Mock Discover: pagination _page/_limit, filtre par tag, liste/ajout de commentaires

API principale (Express)
------------------------
Auth (JWT):
- POST /api/auth/register → crée un utilisateur
  - body: { "username": string, "password": string }
  - 201: { id, username, createdAt }
- POST /api/auth/login → renvoie un token JWT
  - body: { "username": string, "password": string }
  - 200: { token }

Posts (Authorization: Bearer <token> requis):
- POST /api/posts → crée un post
  - body: { "title": string, "content": string }
  - 201: { id, title, content, createdAt, author, likesCount, likedByViewer }
- GET /api/posts?limit=10&cursor=<token> → liste paginée (scroll infini)
  - 200: { items: Post[], nextCursor: string | null }
  - Pagination basée sur un curseur base64 { createdAt, id } (ordre stable: createdAt desc, id desc), évite les doublons lorsque de nouveaux posts arrivent entre deux pages.
- POST /api/posts/:postId/like → 204
- DELETE /api/posts/:postId/like → 204

Healthcheck:
- GET /health → { status: 'ok' }

API Mock Discover (JSON Server)
-------------------------------
Données: mock/discover/db.json, routes custom: mock/discover/routes.json

Routes de base (json-server):
- GET /articles, GET /articles/:id, POST /articles, PUT/PATCH/DELETE /articles/:id
- GET /comments, POST /comments, ...
- Alias custom: GET /articles/:articleId/comments → GET /comments?articleId=:articleId

Paramètres utiles:
- Pagination: _page, _limit (ou _per_page alias de _limit)
- Tri: _sort=likes&_order=desc (ou _sort=publishedAt&_order=desc)
- Filtre par tag: GET /articles?tags_like=tech
- Embedding: GET /articles?_embed=comments

Exemples:
```
# page 1 de 5 articles
curl "http://localhost:4000/articles?_page=1&_limit=5"

# page 2 sans doublons vs page 1
curl "http://localhost:4000/articles?_page=2&_limit=5"

# filtres par tag
curl "http://localhost:4000/articles?tags_like=tech"

# tri par likes desc
curl "http://localhost:4000/articles?_sort=likes&_order=desc&_limit=5"

# commentaires d'un article
curl "http://localhost:4000/articles/art-001/comments"

# création d'un commentaire
curl -X POST "http://localhost:4000/comments" \
  -H "Content-Type: application/json" \
  -d '{"articleId":"art-001","author":"John","message":"Cool!"}'
```

Variables d'environnement
-------------------------
- PORT (défaut 3000)
- JWT_SECRET (obligatoire en production)

Avec Docker Compose, vous pouvez exporter JWT_SECRET avant up:
```
export JWT_SECRET="une_valeur_secrete"
docker compose up -d
```

Développement
-------------
- Lancer l'API en watch: npm run dev
- Lancer les tests: npm run test:api
- Lancer le mock: npm run mock:discover

Déploiement Docker
------------------
- Image API construite via Dockerfile (Node 18 Alpine)
- Mock Discover packagé via mock/discover/Dockerfile (json-server)
- Stack complète: docker compose up --build -d

Sécurité & limites (POC)
------------------------
- Mots de passe hashés (bcryptjs)
- JWT stateless (jsonwebtoken)
- Stockage en mémoire (pas de persistance) — remplaçable par une BDD (ex: SQLite/Prisma)
- Rate limiting, CORS strict, et validation schéma peuvent être ajoutés si besoin

—
Si vous souhaitez: génération de JWT dès l'inscription, persistance BDD, CI GitHub (Newman), ou API Gateway, ouvrez une issue/PR.

