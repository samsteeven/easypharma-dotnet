# Mesure de performance : ASP.NET Core contre Spring Boot

Comparaison des deux implémentations de la même API (mêmes endpoints, même base SQL Server, mêmes requêtes), avec k6.
Les chiffres sont des **ordres de grandeur sur un portable**, pas un benchmark de laboratoire : lire d'abord la section « Limites ».

## Méthode

| | |
|---|---|
| Machine | Windows 11, AMD Ryzen 7 5825U (16 threads logiques), 15,3 Go de RAM. k6, les deux API et SQL Server (Docker) se partagent la machine |
| Base | SQL Server 2022 (conteneur), la **même instance** pour les deux API : 300 médicaments, 2 000 pharmacies (95 % approuvées), 80 000 offres (`seed-bench.sql`, déterministe) |
| API .NET | .NET 10, publication `Release`, EF Core 10, pool de connexions limité à 10, journaux au niveau `Warning` |
| API Java | Spring Boot 3.5, Java 21 (Temurin), `java -jar` sans option JVM, pool Hikari de 10 (défaut), journaux au niveau `WARN`, `show-sql` désactivé |
| Charge | k6 2.2.0, 16 utilisateurs virtuels en boucle fermée, passes de 20 s ; **échauffement de 20 s non retenu**, puis 3 passes mesurées par scénario |
| Répétition | 2 rounds en ordre inversé (.NET puis Java, puis Java puis .NET) pour neutraliser l'effet d'ordre : **6 passes par ligne** |
| Entrées | mêmes 200 points GPS et mêmes termes de recherche, générés par un tirage déterministe (`inputs.json`), dans le même ordre |
| Parité | avant chaque campagne, `parity.mjs` compare les réponses des deux API (64 requêtes : mêmes éléments, même ordre) |

Scénarios :
- **nearby** : `GET /pharmacies/nearby` (rayon 15 km, environ 20 pharmacies en moyenne) ; endpoint public ;
- **search_nearest** : `GET /patient/search?sortBy=POSTGIS_NEAREST` (≈ 230 offres, jointures et tri par distance) ;
- **catalogue_search** : `GET /medications/search` (15 médicaments).

## Résultats

Médiane des 6 passes ; entre parenthèses, la plage min-max du p95 sur ces 6 passes. Aucune requête en échec.

### 1. Code Java d'origine

| Scénario | ASP.NET Core p95 | Spring Boot p95 | Spring Boot req/s |
|---|---|---|---|
| nearby | 128 ms (90 - 252) | 2,1 s (1,9 - 2,1) | 31 |
| search_nearest | 226 ms (146 - 421) | **21,6 s** (17,5 - 24,1) | 1 |
| catalogue_search | 21 ms (9 - 26) | 72 ms (67 - 76) | 259 |

Cet écart ne dit rien des frameworks : il vient d'un **défaut N+1** dans le code Java d'origine. Les entités sont chargées en mode paresseux et le mapper lit le propriétaire de chaque pharmacie, donc une requête SQL par ligne :

| Une requête HTTP | .NET | Java d'origine | Java corrigé |
|---|---|---|---|
| nearby (113 pharmacies) | 4 requêtes SQL | **119** | 7 |
| search_nearest (238 offres) | 4 | **490** | 13 |

### 2. Après correction du N+1 côté Java

Correction (dépôt `easypharma-backend-lab`, branche `perf/fix-n-plus-1`) : les requêtes spatiales ne renvoient que les identifiants triés par distance, puis une requête `JOIN FETCH` charge les entités avec leurs relations. Deux tests comptent les requêtes SQL et échouent si le N+1 revient.

| Scénario | API | p50 | **p95** (min - max) | p99 | req/s |
|---|---|---|---|---|---|
| nearby | ASP.NET Core | 79 ms | **132 ms** (96 - 264) | 154 ms | 199 |
| | Spring Boot corrigé | 105 ms | **226 ms** (175 - 241) | 282 ms | 156 |
| search_nearest | ASP.NET Core | 138 ms | **226 ms** (156 - 359) | 333 ms | 109 |
| | Spring Boot corrigé | 224 ms | **348 ms** (299 - 422) | 512 ms | 70 |
| catalogue_search | ASP.NET Core | 12 ms | **18 ms** (11 - 32) | 22 ms | 1 231 |
| | Spring Boot corrigé | 55 ms | **73 ms** (63 - 75) | 196 ms | 269 |

Spring Boot : p95 de la recherche triée par distance **de 21,6 s à 348 ms (÷ 62)** et de la proximité **de 2,1 s à 226 ms (÷ 9)** grâce à la seule correction du N+1.

## Ce que ces chiffres permettent de dire (et de ne pas dire)

- **Défendable** : « j'ai trouvé un N+1 dans l'API Java d'origine (490 requêtes SQL pour 238 lignes), je l'ai corrigé et protégé par un test, et le p95 de la recherche est passé de 21 s à 0,35 s. »
- **À implémentation équivalente, l'écart se resserre fortement** : environ 1,5 à 1,7 fois sur nearby et search_nearest, et il reste en faveur de .NET, mais **les plages min-max des deux API se chevauchent** sur ces deux scénarios (nearby : 96 - 264 ms contre 175 - 241 ms). Avec une seule machine bruyante, je n'en conclus pas que .NET est plus rapide sur ces deux requêtes.
- **Écart net et reproductible** : `catalogue_search` (plages 11 - 32 ms contre 63 - 75 ms, sans chevauchement), soit environ 4 fois. La cause n'a **pas** été étudiée : ce n'est pas un N+1 (le Java émet 7 requêtes SQL, le .NET 3), et le filtre de sécurité Java recharge l'utilisateur à chaque appel, mais je n'ai pas isolé la part de chacun.
- **Ne pas écrire** « ASP.NET Core est N fois plus rapide que Spring Boot » : l'écart initial est un défaut de code, et l'écart restant n'est ni isolé ni mesuré avec la rigueur nécessaire pour être attribué au framework.
- Mémoire de démarrage (processus au repos juste après le démarrage, une seule mesure) : environ 113 Mo pour .NET contre 845 à 902 Mo pour Java (mesures ponctuelles, à ne pas interpréter au-delà de l'ordre de grandeur).

## Limites

- Une seule machine, un portable, sous Windows ; k6 consomme du processeur sur la même machine que les API et la base.
- Bruit important : le p95 .NET varie de 96 à 264 ms sur la même requête d'une passe à l'autre.
- Boucle fermée à 16 utilisateurs virtuels, pas de montée en charge ni de test de saturation ; le pool de connexions (10) est plus petit que le nombre d'utilisateurs.
- Réglages par défaut des deux plateformes (pas de réglage JVM ni de GC .NET), sans optimisation propre à chaque côté.
- Un seul jeu de données, des requêtes volontairement lourdes en jointures ; pas de scénario d'écriture.
- Le Java mesuré est le jar de la branche `perf/fix-n-plus-1` ; le .NET est la version de ce dépôt.

## Reproduire

```bash
# 1. base vide + schéma, sans les données de démonstration
SEED_DEMO_DATA=false docker compose up -d mssql db-init
docker cp bench/seed-bench.sql easypharma-dotnet-mssql:/tmp/ && docker exec easypharma-dotnet-mssql \
  /opt/mssql-tools18/bin/sqlcmd -C -I -b -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -d easypharma_db -f 65001 -i /tmp/seed-bench.sql

# 2. publier le .NET et construire le jar Java (depuis easypharma-backend-lab)
dotnet publish src/EasyPharma.Api/EasyPharma.Api.csproj --configuration Release --output <dossier>
mvn package -DskipTests

# 3. parité, puis campagne (PowerShell), puis synthèse
node bench/parity.mjs http://localhost:5080 http://localhost:8080
./bench/run-bench.ps1 -App dotnet -Round 1 -DotnetDir <dossier> -JavaJar <jar> -Password $env:MSSQL_SA_PASSWORD
node bench/summarize.mjs results
```
Les résultats bruts (un fichier JSON k6 par passe) sont dans `results/` (après correction) et `results/avant-correction/`.
