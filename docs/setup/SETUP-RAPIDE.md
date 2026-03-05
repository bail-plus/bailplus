# Setup Rapide - Déploiement avec Cloudflare Tunnel

## Ce qu'il te reste à faire sur le serveur

### 1. Copier la configuration du tunnel

```bash
# Sur le serveur (ssh srv)
cd ~
mkdir -p .cloudflared

# Copier la config (à faire après le push)
cp ~/bailogenius-front/cloudflared-config.yml ~/.cloudflared/config.yml
```

### 2. Installer cloudflared comme service

```bash
# Installer le service
sudo cloudflared service install

# Démarrer le service
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# Vérifier que ça tourne
sudo systemctl status cloudflared
```

Tu devrais voir "Active: active (running)" et "Registered tunnel connection" dans les logs.

### 3. Créer le dossier de l'application

```bash
mkdir -p /home/gaignerot/bailogenius-front
```

### 4. Push ton code

```bash
# Sur ton Mac
git add .
git commit -m "Setup CI/CD with Cloudflare Tunnel"
git push origin main
```

Le GitHub Actions va automatiquement :
1. Builder l'image Docker
2. La transférer sur le serveur
3. Démarrer le conteneur sur le port 3000

### 5. Vérifier que tout fonctionne

```bash
# Sur le serveur
# Vérifier que le conteneur tourne
docker ps

# Tester localement
curl http://localhost:3000

# Vérifier les logs
docker logs -f bailogenius-front
sudo journalctl -u cloudflared -f
```

### 6. Tester depuis Internet

Ouvre un navigateur et va sur :
- https://bailogenius.gaignerot.com
- https://www.bailogenius.gaignerot.com

✅ Ça devrait marcher !

## En cas de problème

### Erreur 502 (comme tu avais)

Cela signifie que Cloudflare arrive à se connecter mais que l'application ne répond pas.

**Solution** :
```bash
# Vérifier que le conteneur tourne
docker ps

# Si absent, le démarrer
cd /home/gaignerot/bailogenius-front
docker-compose up -d

# Vérifier que ça répond localement
curl http://localhost:3000
```

### Le tunnel n'est pas connecté

```bash
# Redémarrer le service
sudo systemctl restart cloudflared

# Voir les logs
sudo journalctl -u cloudflared -f
```

Tu devrais voir "Registered tunnel connection" plusieurs fois.

## Commandes utiles

```bash
# Statut général
sudo systemctl status cloudflared
docker ps

# Logs en temps réel
docker logs -f bailogenius-front
sudo journalctl -u cloudflared -f

# Redémarrer
docker-compose restart
sudo systemctl restart cloudflared

# Redéployer manuellement
cd /home/gaignerot/bailogenius-front
./deploy.sh
```

## Architecture

```
GitHub (push)
   ↓
GitHub Actions Runner (sur ton serveur)
   ↓
Docker Build + Deploy
   ↓
Container bailogenius-front:3000
   ↓
Cloudflare Tunnel
   ↓
Internet (HTTPS automatique)
```

## Checklist

- [x] Docker et Docker Compose installés
- [x] GitHub Actions runner configuré et actif
- [x] Cloudflare Tunnel créé et routes DNS configurées
- [ ] Configuration cloudflared copiée dans ~/.cloudflared/config.yml
- [ ] Service cloudflared installé et démarré
- [ ] Dossier /home/gaignerot/bailogenius-front créé
- [ ] Code pushé sur GitHub
- [ ] Site accessible sur https://bailogenius.gaignerot.com

Pour plus de détails, consulte `docs/DEPLOYMENT.md`
