# 📦 Guide de Déploiement en Production - IvoireStore

## ✅ Changements Effectués
- ✅ Système de vérification email implémenté et testé
- ✅ Code poussé sur GitHub pour les deux repos (client + serveur)
- ✅ Fichier `.env.production.example` créé avec toutes les variables

## 🚀 Déploiement du Serveur (Render ou Railway)

### Variables d'Environnement Obligatoires:

```
# Obligatoire - À changer absolument
FRONTEND_URL=https://votre-domaine-frontend.com
JWT_SECRET=generer_une_nouvelle_clé_secrète_longue
NODE_ENV=production

# Base de Données (déjà fonctionnelle)
MONGO_URI=mongodb+srv://Armel:Armel1122@myatlasclusteredu.203frdb.mongodb.net/Ivoirestore

# Email (déjà configuré - vérifier que ça fonctionne)
EMAIL_USER=ivoirestore878@gmail.com
EMAIL_PASSWORD=tigkrpqyzhsvdntr

# CORS - À mettre à jour avec votre domaine frontend
ALLOWED_ORIGINS=https://votre-domaine-frontend.com,https://admin.votre-domaine-frontend.com

# CloudinarySTATUS (déjà fonctionnel)
CLOUDINARY_CLOUD_NAME=dsjjw6iew
CLOUDINARY_API_KEY=811425657389136
CLOUDINARY_API_SECRET=VPWbRpcXLS07AZ3Gnw44kL_RwgI
```

### ⚠️ IMPORTANT - FRONTEND_URL pour les Emails
Le lien de vérification dans les emails utilise cette variable:
```
${FRONTEND_URL}/vendeur/verify-email?token=${token}&email=${email}
```

**Exemples:**
- Vercel: `https://ivoirestore.vercel.app`
- Netlify: `https://ivoirestore.netlify.app`
- Custom domain: `https://app.ivoirestore.ci`

---

## 🎯 Déploiement du Frontend (Vercel/Netlify)

### Variables d'Environnement Obligatoires:

```
VITE_API_URL=https://votre-backend-url.com
```

**Exemple si backend sur Render:**
```
VITE_API_URL=https://ivoirestore-server.onrender.com
```

---

## 📧 Test du Système Email en Production

Une fois déployé:

1. **Accédez au frontend en production**
   - Exemple: `https://ivoirestore.vercel.app`

2. **Allez à `/vendeur/register` ou cliquez sur "Créer Votre Boutique"**

3. **Remplissez le formulaire avec une vraie adresse email**

4. **Vérifiez que l'email arrive dans votre inbox**
   - Sujet: "🎉 Vérifiez votre adresse email - IvoireStore"
   - Contient un lien clickable vers `/vendeur/verify-email?token=...`

5. **Cliquez le lien pour terminer l'inscription**
   - Redirection automatique au dashboard
   - Auto-login
   - Boutique visible

---

## 🔒 Checklist de Sécurité

- [ ] JWT_SECRET changé et unique pour production
- [ ] FRONTEND_URL configurée avec le bon domaine
- [ ] ALLOWED_ORIGINS inclut le domaine du frontend
- [ ] EMAIL_PASSWORD est un Gmail AppPassword (16 chars)
- [ ] NODE_ENV=production
- [ ] Base de données MongoDB configurée
- [ ] Cloudinary credentials en place

---

## 📱 Vérification que les Emails sont Accessibles sur Autres Appareils

Puisque vous utilisez maintenant `FRONTEND_URL` en production:
✅ Les liens dans les emails fonctionnent sur n'importe quel appareil
✅ Pas de localhost:5173
✅ Domaine réel et accessible de partout

**Exemple complet d'email:**
```
Lien de vérification: https://ivoirestore.vercel.app/vendeur/verify-email?token=abc123def456&email=user@example.com
Fonctionne sur: 
  - Desktop
  - Mobile
  - Tablette
  - N'importe quel appareil avec internet
```

---

## 🔄 Redéploiement Automatique

Si vous avez activé les webhooks GitHub:
1. Push sur GitHub ✅ (fait)
2. Service de déploiement détecte le changement
3. Rebuild et redéploie automatiquement
4. Pas besoin de redéployer manuellement

**Commandes de déploiement utilisées:**
```bash
# Serveur
cd server
git add -A
git commit -m "feat: email verification system..."
git push origin main

# Client
cd client
git add -A
git commit -m "feat: vendor self-registration with email..."
git push origin main
```

---

## 💡 Problèmes Courants

### Email ne s'envoie pas en production
- Vérifier EMAIL_USER et EMAIL_PASSWORD dans les variables
- Vérifier que Gmail AcceptTrusted Apps (App Passwords)
- Vérifier les logs sur Render/Railway

### Lien email ne fonctionne pas
- Vérifier que FRONTEND_URL est configurée correctement
- Vérifier que ALLOWED_ORIGINS inclut le domaine
- Tester le lien manuellement dans un navigateur

### CORS error
- Ajouter l'URL du frontend à ALLOWED_ORIGINS
- Redéployer le serveur

---

## 📞 Support
Pour plus d'infos, consultez `.env.production.example` dans le repo serveur.
