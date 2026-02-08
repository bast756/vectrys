# 🔒 SÉCURITÉ & CONFIDENTIALITÉ - VECTRYS LINGUA

**Dernière mise à jour:** 2026-02-06  
**Niveau de confidentialité:** PRIVÉ

---

## 🚨 RÈGLES DE CONFIDENTIALITÉ

### ❌ NE JAMAIS FAIRE

1. **Ne JAMAIS commit le fichier `.env`**
   - Contient des credentials sensibles
   - Utilisez `.env.example` pour partager la structure

2. **Ne JAMAIS partager les API Keys**
   - ANTHROPIC_API_KEY
   - ELEVENLABS_API_KEY
   - JWT_SECRET

3. **Ne JAMAIS commit les données utilisateurs**
   - Fichiers de backup (.sql, .dump)
   - Logs contenant des données personnelles
   - Uploads utilisateurs

4. **Ne JAMAIS exposer les credentials de base de données**
   - DATABASE_URL complète
   - Mots de passe PostgreSQL

5. **Ne JAMAIS partager publiquement**
   - Ce projet est PRIVÉ
   - Ne pas push sur GitHub public sans vérifier
   - Ne pas déployer sans configuration sécurisée

---

## ✅ BONNES PRATIQUES

### 1. Gestion des Secrets

```bash
# Générer un JWT secret sécurisé
openssl rand -base64 32

# Changer tous les secrets avant production
# Ne JAMAIS utiliser les valeurs par défaut
```

### 2. Variables d'Environnement

✅ **Utiliser `.env` pour les secrets locaux**
✅ **Utiliser `.env.example` comme template**
✅ **Vérifier que `.env` est dans `.gitignore`**

### 3. Base de Données

✅ **Utiliser des mots de passe forts**
✅ **Limiter les accès réseau**
✅ **Backups chiffrés uniquement**
✅ **Nettoyer les données de test en production**

### 4. API Keys

✅ **Stocker dans `.env` uniquement**
✅ **Utiliser des variables d'environnement**
✅ **Révoquer immédiatement si exposées**
✅ **Utiliser des keys différentes par environnement**

---

## 🔐 CHECKLIST SÉCURITÉ

### Avant de Commit

- [ ] Vérifier qu'aucun secret n'est dans le code
- [ ] `.env` n'est PAS dans git (`git status`)
- [ ] `.gitignore` est à jour
- [ ] Pas de API keys en dur dans le code
- [ ] Pas de passwords en clair

### Avant de Partager

- [ ] Supprimer toutes les données de test sensibles
- [ ] Nettoyer les logs
- [ ] Vérifier `.env.example` (pas de vraies valeurs)
- [ ] Documentation ne contient pas de secrets
- [ ] Pas de TODO avec des credentials

### Avant de Déployer

- [ ] Générer de nouveaux secrets pour production
- [ ] Utiliser HTTPS uniquement
- [ ] Configurer rate limiting
- [ ] Activer les logs de sécurité
- [ ] Tester les permissions database
- [ ] Vérifier CORS configuration
- [ ] Activer helmet.js
- [ ] Configuration SSL/TLS

---

## 🛡️ RGPD & DONNÉES PERSONNELLES

### Données Collectées

- ✅ Prénom, nom, email (housekeepers)
- ✅ Langue native
- ✅ Progression d'apprentissage
- ✅ Réponses aux quiz (anonymisées)

### Protection des Données

1. **Anonymisation**
   ```javascript
   // Les données pour LLM training sont anonymisées
   user_id → SHA-256 hash
   ```

2. **Droit à l'oubli**
   - API pour supprimer toutes les données utilisateur
   - Soft delete avec anonymisation

3. **Consentement**
   - Opt-in pour collection de données
   - Transparent sur l'utilisation

4. **Rétention**
   - Données conservées 90 jours par défaut
   - Purge automatique configurable

---

## 🔍 AUDIT DE SÉCURITÉ

### Commandes de Vérification

```bash
# Vérifier qu'aucun secret n'est dans git
git log --all --full-history --source -- .env

# Rechercher des patterns de secrets
grep -r "sk-ant-" . --exclude-dir=node_modules
grep -r "password.*=.*\"" . --exclude-dir=node_modules

# Vérifier les permissions fichiers
ls -la .env
# Devrait être: -rw------- (600)

# Scanner les vulnérabilités npm
npm audit

# Vérifier les dépendances obsolètes
npm outdated
```

---

## 🚀 DÉPLOIEMENT SÉCURISÉ

### Variables d'Environnement Production

**Ne PAS utiliser les mêmes que développement !**

```env
# Production - Exemples de bonnes pratiques
DATABASE_URL=postgresql://prod_user:COMPLEX_PASSWORD@db.example.com:5432/vectrys_prod
JWT_SECRET=VERY_LONG_RANDOM_STRING_64_CHARS_MINIMUM
NODE_ENV=production
```

### Hébergement Recommandé

- **Railway** - Variables d'env sécurisées
- **Render** - Secrets management
- **Vercel** - Environment variables
- **AWS** - Secrets Manager

### Checklist Déploiement

- [ ] Utiliser HTTPS (SSL/TLS)
- [ ] Rate limiting activé
- [ ] CORS restreint aux domaines autorisés
- [ ] Logs de sécurité activés
- [ ] Backup automatique de la DB
- [ ] Monitoring des erreurs (Sentry)
- [ ] Firewall configuré
- [ ] Accès SSH sécurisé
- [ ] Certificats à jour

---

## 📞 EN CAS DE FUITE DE SÉCURITÉ

### Actions Immédiates

1. **Révoquer tous les secrets exposés**
   - API keys (Anthropic, ElevenLabs)
   - JWT secrets
   - Database passwords

2. **Changer les credentials**
   - Générer de nouveaux secrets
   - Mettre à jour `.env`
   - Redémarrer les services

3. **Notifier**
   - Équipe technique
   - Utilisateurs si données personnelles affectées (RGPD)

4. **Audit**
   - Vérifier les logs d'accès
   - Identifier l'origine de la fuite
   - Documenter l'incident

---

## 🔐 CONTACTS SÉCURITÉ

**Responsable Sécurité:** [À définir]  
**Email Sécurité:** security@vectrys.com (à créer)  
**Rapport de vulnérabilité:** security-report@vectrys.com

---

## 📚 RESSOURCES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [RGPD Guide](https://www.cnil.fr/fr/reglement-europeen-protection-donnees)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)
- [Prisma Security](https://www.prisma.io/docs/guides/deployment/deployment)

---

**⚠️ CE PROJET EST CONFIDENTIEL**

**Ne pas partager publiquement sans autorisation.**

*Dernière révision: 2026-02-06*
