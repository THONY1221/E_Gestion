# Variables d'environnement pour Render.com

## 🔧 Configuration OBLIGATOIRE sur Render.com

Copiez-collez ces variables d'environnement exactement dans votre dashboard Render.com :

### Base de données Supabase (CONNEXION DIRECTE - PAS DE POOLER)

```
DATABASE_URL=postgresql://postgres:3X7yhEOOhL6Mfdbj@db.oalzqdjcxgeigggkgfszv.supabase.co:5432/postgres
```

### Paramètres séparés (backup)

```
DB_HOST=db.oalzqdjcxgeigggkgfszv.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=3X7yhEOOhL6Mfdbj
DB_NAME=postgres
```

### Configuration Application

```
NODE_ENV=production
PORT=3000
JWT_SECRET=votre_secret_jwt_super_long_et_complexe_pour_production_2024
```

### Supabase API

```
SUPABASE_URL=https://oalzqdjcxgeigggkgfszv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hbHpxZGpjeGdlaWdna2dmc3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMzMyNTksImV4cCI6MjA2NDYwOTI1OX0.IgGTXkby2GY3mufQShWpQFtNfDmT_Ra_Y-04kjvEs7k
```

### Uploads et CORS

```
UPLOAD_DIR=./uploads
TEMP_IMPORT_DIR=./uploads/temp_imports
ALLOWED_ORIGINS=https://elsa-gestion-front-end.vercel.app,https://votre-frontend-url.com
```

## ⚠️ IMPORTANT - Différences clés :

### ❌ ANCIENNE configuration (qui causait l'erreur) :

- Host: `aws-0-eu-central-1.pooler.supabase.com`
- Port: `6543`
- User: `postgres.oalzqdjcxgeigggkgfszv`

### ✅ NOUVELLE configuration (correcte) :

- Host: `db.oalzqdjcxgeigggkgfszv.supabase.co`
- Port: `5432`
- User: `postgres`

## 🚀 Étapes pour appliquer sur Render.com :

1. Allez dans votre service Render.com
2. Cliquez sur "Environment"
3. Supprimez l'ancienne `DATABASE_URL`
4. Ajoutez la nouvelle `DATABASE_URL` ci-dessus
5. Ajoutez toutes les autres variables
6. Cliquez "Save Changes"
7. Render redémarrera automatiquement votre service

## 🔍 Vérification :

Après le redémarrage, vous devriez voir dans les logs :

```
🔄 Test de connexion à Supabase...
📋 Configuration utilisée:
   - Host: db.oalzqdjcxgeigggkgfszv.supabase.co
   - Port: 5432
   - Database: postgres
   - User: postgres
✅ Connexion PostgreSQL/Supabase réussie
📅 Heure serveur: [timestamp]
🗄️  Version DB: PostgreSQL
```
