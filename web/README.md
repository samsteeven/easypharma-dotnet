# Front Angular d'EasyPharma

Copie, sans historique ni secrets, du front de l'application d'origine (Angular 21, Tailwind 4). Voir le README à la racine pour le périmètre qui fonctionne sur l'API ASP.NET Core.

```bash
npm ci --legacy-peer-deps
npm start            # http://localhost:4210, /api proxifié vers http://localhost:8080 (voir proxy.conf.json)
npm run build        # dist/medi-find
```
En production (Docker), `default.conf` sert l'application avec nginx et proxifie `/api/` vers le service `api` du compose.
