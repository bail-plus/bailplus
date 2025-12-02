# Guide Auto-Restart et Résilience

## État actuel de ton infrastructure

### ✅ Ce qui redémarre automatiquement

1. **Docker Container (bailogenius-front)**
   - Configuration : `restart: unless-stopped`
   - Redémarre si : crash, Docker redémarre, serveur redémarre
   - Ne redémarre PAS si : arrêt manuel (`docker stop`)

2. **Cloudflare Tunnel**
   - Configuration : Service systemd `enabled`
   - Redémarre si : crash, serveur redémarre

3. **GitHub Actions Runner**
   - Configuration : Service systemd `enabled`
   - Redémarre si : crash, serveur redémarre

4. **Docker Daemon**
   - Configuration : Service systemd `enabled`
   - Redémarre si : crash, serveur redémarre

---

## 🧪 Vérifier la configuration

### Commandes de vérification

```bash
# Sur le serveur
# 1. Vérifier Docker container restart policy
docker inspect bailogenius-front | grep -A 3 "RestartPolicy"

# 2. Vérifier que cloudflared démarre au boot
sudo systemctl is-enabled cloudflared
# Résultat attendu: enabled

# 3. Vérifier que le runner démarre au boot
sudo systemctl is-enabled actions.runner.*
# Résultat attendu: enabled

# 4. Vérifier que Docker démarre au boot
sudo systemctl is-enabled docker
# Résultat attendu: enabled

# 5. Voir tous les services qui démarrent au boot
systemctl list-unit-files | grep enabled | grep -E 'docker|cloudflared|actions'
```

---

## 🧪 Tests de résilience

### Test 1 : Crash du conteneur

```bash
# Tuer le conteneur brutalement
docker kill bailogenius-front

# Attendre quelques secondes
sleep 5

# Vérifier qu'il a redémarré
docker ps | grep bailogenius-front
# Le conteneur doit apparaître avec un uptime de quelques secondes

# Vérifier les logs
docker logs --tail 20 bailogenius-front
```

**Résultat attendu** : Le conteneur redémarre automatiquement en 1-2 secondes.

---

### Test 2 : Redémarrage Docker

```bash
# Redémarrer le service Docker
sudo systemctl restart docker

# Attendre quelques secondes
sleep 10

# Vérifier que le conteneur est reparti
docker ps
sudo systemctl status cloudflared
```

**Résultat attendu** : Tous les conteneurs avec `restart: unless-stopped` redémarrent.

---

### Test 3 : Redémarrage du serveur complet

```bash
# ⚠️  ATTENTION : Ça coupe la connexion SSH !
sudo reboot
```

**Attends 2-3 minutes**, puis depuis ton Mac :

```bash
# Tester le site
curl -I https://bailogenius.gaignerot.com
# Résultat attendu: HTTP/2 200

# Reconnecter en SSH
ssh srv
```

Une fois reconnecté, vérifie :

```bash
# Vérifier tous les services
docker ps
sudo systemctl status cloudflared
sudo systemctl status docker
cd ~/actions-runner && sudo ./svc.sh status

# Vérifier l'uptime du serveur
uptime
# Doit montrer quelques minutes seulement
```

**Résultat attendu** : Tout est reparti automatiquement !

---

## 📊 Scénarios de crash et récupération

| Scénario | Auto-restart | Temps de récupération |
|----------|--------------|----------------------|
| **Crash application** (bug dans le code) | ✅ OUI | 1-2 secondes |
| **Crash Nginx** (dans le conteneur) | ✅ OUI | 1-2 secondes |
| **Crash Docker daemon** | ✅ OUI | 5-10 secondes |
| **Crash Cloudflare Tunnel** | ✅ OUI | 5-10 secondes |
| **Crash GitHub Runner** | ✅ OUI | 5-10 secondes |
| **Redémarrage serveur** (reboot) | ✅ OUI | 30-60 secondes |
| **Coupure électrique** | ✅ OUI* | Dès que l'électricité revient |
| **OOM (Out of Memory)** | ✅ OUI** | 1-2 secondes |
| **Disque plein** | ❌ NON*** | Intervention manuelle |

\* Si le BIOS est configuré pour redémarrer après coupure électrique
\*\* Docker tue le conteneur et le relance, mais si la RAM est saturée ça recommencera
\*\*\* Si le disque est plein, rien ne peut s'écrire, donc il faut nettoyer manuellement

---

## 🛡️ Amélioration : Ajouter un Healthcheck

Le healthcheck permet à Docker de **détecter si l'application est morte** même si le conteneur tourne.

### Option 1 : Healthcheck simple (recommandé)

Remplace ton `docker-compose.yml` par :

```yaml
version: '3.8'

services:
  bailogenius-front:
    image: bailogenius-front:latest
    container_name: bailogenius-front
    restart: unless-stopped
    ports:
      - "3000:80"
    networks:
      - bailogenius-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  bailogenius-network:
    driver: bridge
```

**Ce que ça fait** :
- Teste toutes les 30 secondes si l'app répond
- Si 3 échecs consécutifs → Marque le conteneur comme `unhealthy`
- Docker peut alors le redémarrer

### Option 2 : Ajouter curl dans l'image

Si `wget` n'est pas disponible dans l'image nginx, modifie le `Dockerfile` :

```dockerfile
# Production stage
FROM nginx:alpine

# Installer curl pour le healthcheck
RUN apk add --no-cache curl

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD curl -f http://localhost || exit 1

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

Puis dans `docker-compose.yml`, le healthcheck est déjà dans l'image.

---

## 📈 Monitoring avancé (optionnel)

### Alertes en cas de crash

Créer un script qui t'envoie un email si le site est down :

```bash
# ~/check-site.sh
#!/bin/bash

URL="https://bailogenius.gaignerot.com"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ "$STATUS" != "200" ]; then
  echo "🚨 ALERTE: Site down! Status: $STATUS" | \
    mail -s "BailoGenius DOWN" ton-email@exemple.com
fi
```

Ajouter dans crontab (toutes les 5 minutes) :

```bash
crontab -e
```

Ajouter :

```
*/5 * * * * /home/gaignerot/check-site.sh
```

---

## 🔧 Commandes de récupération manuelle

Si jamais quelque chose ne redémarre pas automatiquement :

### Redémarrer le conteneur

```bash
cd /home/gaignerot/bailogenius-front
docker-compose restart
```

### Redémarrer Cloudflare Tunnel

```bash
sudo systemctl restart cloudflared
```

### Redémarrer GitHub Runner

```bash
cd ~/actions-runner
sudo ./svc.sh restart
```

### Redémarrer Docker complètement

```bash
sudo systemctl restart docker
```

### Tout redémarrer en une commande

```bash
sudo systemctl restart docker cloudflared && \
cd /home/gaignerot/bailogenius-front && \
docker-compose up -d
```

---

## 📋 Checklist de déploiement

Avant de considérer que ton site est "production-ready", vérifie :

- [x] Docker container avec `restart: unless-stopped`
- [x] Cloudflare Tunnel comme service systemd
- [x] GitHub Actions Runner comme service systemd
- [x] Docker daemon enabled au boot
- [ ] Healthcheck Docker (optionnel mais recommandé)
- [ ] Monitoring externe (UptimeRobot, etc.)
- [ ] Alertes email/SMS en cas de down
- [ ] Backup automatique de la configuration

---

## 🎯 Recommandation finale

**Ton infrastructure actuelle est déjà très bien !**

✅ **Ce que tu as** :
- Auto-restart à tous les niveaux
- Services systemd configurés
- Redémarrage après reboot serveur

🔧 **Ce que tu pourrais améliorer** (optionnel) :
1. Ajouter un healthcheck Docker
2. Monitoring externe (UptimeRobot gratuit : https://uptimerobot.com)
3. Script d'alerte par email

Mais honnêtement, pour commencer, **tu es déjà très bien équipé** ! 🚀

---

## 🧪 Test final recommandé

Fais un test de redémarrage complet :

```bash
# 1. Sur le serveur
sudo reboot

# 2. Attends 2 minutes

# 3. Depuis ton Mac
curl -I https://bailogenius.gaignerot.com

# 4. Reconnecte en SSH
ssh srv

# 5. Vérifie tout
docker ps
sudo systemctl status cloudflared
```

Si tout fonctionne → **Tu es production-ready** ! 🎉
