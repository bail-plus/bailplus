# Guide de Déploiement - BailoGenius Frontend

## Architecture

```
GitHub → GitHub Actions (self-hosted runner) → Docker Build → Cloudflare Tunnel → Internet
                                                      ↓
                                                 bailogenius.gaignerot.com (SSL via Cloudflare)
```

Le déploiement utilise **Cloudflare Tunnel** au lieu d'exposer directement le serveur sur Internet. Cela offre :
- Protection DDoS automatique
- SSL/TLS géré par Cloudflare
- Pas besoin d'IP publique statique
- Pas besoin de configurer de firewall/NAT

## Prérequis sur le Serveur Ubuntu

### 1. Installation de Docker et Docker Compose

```bash
# Se connecter au serveur
ssh srv

# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter l'utilisateur ubuntu au groupe docker
sudo usermod -aG docker gaignerot

# Installer Docker Compose
sudo apt install docker-compose -y

# Redémarrer la session pour appliquer les changements
exit
ssh srv

# Vérifier l'installation
docker --version
docker-compose --version
```

### 2. Configuration du GitHub Actions Runner

Tu as déjà configuré le runner, mais vérifie qu'il tourne en tant que service :

```bash
# Dans le dossier actions-runner
cd ~/actions-runner

# Installer le runner comme service
sudo ./svc.sh install
sudo ./svc.sh start

# Vérifier le statut
sudo ./svc.sh status
```

### 3. Installation de Cloudflared

```bash
# Télécharger et installer cloudflared
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Vérifier l'installation
cloudflared --version
```

### 4. Configuration du Cloudflare Tunnel

Tu as déjà créé ton tunnel ! Il faut maintenant le configurer correctement.

```bash
# Créer le dossier de configuration
mkdir -p ~/.cloudflared

# Copier le fichier de configuration
# Le fichier cloudflared-config.yml sera copié par GitHub Actions
```

**Important** : Ton tunnel existe déjà avec l'ID `b160e405-a950-4c2a-bb34-8fb6df60114e`

### 5. Configurer le tunnel comme service systemd

```bash
# Copier la configuration du tunnel
sudo cp ~/bailogenius-front/cloudflared-config.yml ~/.cloudflared/config.yml

# Installer le service cloudflared
sudo cloudflared service install

# Démarrer le service
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# Vérifier le statut
sudo systemctl status cloudflared
```

### 6. Création de la structure de dossiers

```bash
# Créer le dossier pour l'application
mkdir -p /home/gaignerot/bailogenius-front
cd /home/gaignerot/bailogenius-front
```

## Configuration Cloudflare (dans le dashboard)

### Étape 1 : Vérifier les enregistrements DNS

1. Connecte-toi à ton dashboard Cloudflare
2. Sélectionne ton domaine **gaignerot.com**
3. Va dans **DNS** → **Records**
4. Vérifie que tu as bien les enregistrements CNAME créés par cloudflared :

```
Type: CNAME
Nom: bailogenius
Contenu: b160e405-a950-4c2a-bb34-8fb6df60114e.cfargotunnel.com
Proxy: Activé (nuage orange)

Type: CNAME
Nom: www.bailogenius
Contenu: b160e405-a950-4c2a-bb34-8fb6df60114e.cfargotunnel.com
Proxy: Activé (nuage orange)
```

Ces enregistrements ont normalement été créés automatiquement quand tu as exécuté :
```bash
cloudflared tunnel route dns bailogenius bailogenius.gaignerot.com
cloudflared tunnel route dns bailogenius www.bailogenius.gaignerot.com
```

### Étape 2 : Configuration SSL/TLS (Important !)

1. Dans le dashboard Cloudflare
2. Va dans **SSL/TLS** → **Overview**
3. Sélectionne le mode : **Full** (pas "Full (strict)" car on n'a pas de certificat côté serveur)

Cela permet à Cloudflare de chiffrer la connexion entre le visiteur et Cloudflare, puis entre Cloudflare et ton serveur via le tunnel.

## Configuration sur le Serveur

Aucune configuration supplémentaire nécessaire ! Le docker-compose.yml expose simplement le port 3000 localement, et Cloudflare Tunnel s'en occupe.

## Déploiement

### Première mise en production

1. **Commit et push tes fichiers** :

```bash
# Sur ton ordinateur local
git add .
git commit -m "Setup CI/CD with Docker and Traefik"
git push origin main
```

2. **Le GitHub Actions va automatiquement** :
   - Builder l'image Docker
   - La transférer sur le serveur
   - Démarrer les conteneurs avec docker-compose

3. **Surveiller les logs** :

```bash
# Sur le serveur
docker-compose logs -f
```

### Commandes utiles

```bash
# Voir les conteneurs en cours d'exécution
docker ps

# Voir les logs de l'application
docker-compose logs -f bailogenius-front

# Voir les logs du tunnel Cloudflare
sudo journalctl -u cloudflared -f

# Redémarrer les conteneurs
docker-compose restart

# Redémarrer le tunnel
sudo systemctl restart cloudflared

# Arrêter les conteneurs
docker-compose down

# Vérifier le statut du tunnel
sudo systemctl status cloudflared
```

## Vérification du Déploiement

### 1. Vérifier que le conteneur tourne

```bash
docker ps
```

Tu devrais voir :
- `bailogenius-front` (ton application) qui écoute sur le port 3000

### 2. Vérifier que le tunnel Cloudflare est connecté

```bash
sudo systemctl status cloudflared
```

Tu devrais voir :
```
● cloudflared.service - Cloudflare Tunnel
   Active: active (running)
```

Et dans les logs :
```bash
sudo journalctl -u cloudflared -n 50
```

Tu devrais voir des lignes comme :
```
Registered tunnel connection
```

### 3. Tester l'application localement

```bash
# Vérifier que l'app répond sur le port 3000
curl http://localhost:3000
```

Tu devrais recevoir le HTML de ton application.

### 4. Tester depuis Internet

Dans un navigateur, va sur :
- `https://bailogenius.gaignerot.com` → ton application
- `https://www.bailogenius.gaignerot.com` → ton application

Le HTTPS est géré automatiquement par Cloudflare !

## Dépannage

### Le site n'est pas accessible (erreur 502)

C'est l'erreur que tu as eue ! Voici comment la résoudre :

1. **Vérifier que le conteneur Docker tourne** :
```bash
docker ps
```

Si le conteneur n'apparaît pas, le démarrer :
```bash
cd /home/gaignerot/bailogenius-front
docker-compose up -d
```

2. **Vérifier que le conteneur écoute sur le port 3000** :
```bash
curl http://localhost:3000
```

Si cela ne fonctionne pas, vérifier les logs :
```bash
docker logs bailogenius-front
```

3. **Vérifier que le tunnel Cloudflare est connecté** :
```bash
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -n 50
```

Tu devrais voir "Registered tunnel connection". Si ce n'est pas le cas :
```bash
sudo systemctl restart cloudflared
```

4. **Vérifier la configuration du tunnel** :
```bash
cat ~/.cloudflared/config.yml
```

Elle doit pointer vers `http://localhost:3000`

### Le tunnel Cloudflare n'arrive pas à se connecter

1. **Vérifier le service cloudflared** :
```bash
sudo systemctl status cloudflared
```

2. **Voir les logs détaillés** :
```bash
sudo journalctl -u cloudflared -f
```

3. **Redémarrer le tunnel** :
```bash
sudo systemctl restart cloudflared
```

4. **Vérifier que le fichier credentials existe** :
```bash
ls -la ~/.cloudflared/b160e405-a950-4c2a-bb34-8fb6df60114e.json
```

### Le build échoue dans GitHub Actions

1. **Vérifier que le runner est actif** :
```bash
cd ~/actions-runner
sudo ./svc.sh status
```

2. **Vérifier les logs du runner** :
```bash
cd ~/actions-runner
cat _diag/Runner_*.log
```

3. **Redémarrer le runner si nécessaire** :
```bash
sudo ./svc.sh stop
sudo ./svc.sh start
```

## Mises à jour

Pour déployer une nouvelle version :

```bash
# Sur ton ordinateur local
git add .
git commit -m "Nouvelle fonctionnalité"
git push origin main
```

Le GitHub Actions s'occupe du reste automatiquement !

## Sauvegarde

### Sauvegarder la configuration Cloudflare Tunnel

```bash
# Sauvegarder le fichier credentials
cp ~/.cloudflared/b160e405-a950-4c2a-bb34-8fb6df60114e.json ~/backup/

# Sauvegarder la configuration
cp ~/.cloudflared/config.yml ~/backup/
```

⚠️ **Important** : Le fichier credentials contient des secrets. Ne le commit JAMAIS dans Git !

## Monitoring

### Logs en temps réel

```bash
# Logs de l'application
docker logs -f bailogenius-front

# Logs du tunnel Cloudflare
sudo journalctl -u cloudflared -f

# Logs du runner GitHub Actions
cd ~/actions-runner
tail -f _diag/Runner_*.log
```

### Métriques Cloudflare

Tu peux voir les métriques de ton tunnel dans le dashboard Cloudflare :
1. Va sur **Zero Trust** → **Networks** → **Tunnels**
2. Clique sur ton tunnel **bailogenius**
3. Tu verras les métriques de trafic, latence, etc.

## Support

Si tu rencontres des problèmes :
1. Consulte les logs de l'application : `docker logs -f bailogenius-front`
2. Consulte les logs du tunnel : `sudo journalctl -u cloudflared -f`
3. Vérifie que le conteneur tourne : `docker ps`
4. Vérifie que le tunnel est connecté : `sudo systemctl status cloudflared`
5. Vérifie que le runner GitHub Actions est actif : `cd ~/actions-runner && sudo ./svc.sh status`

## Résumé des étapes de déploiement

1. ✅ GitHub Actions runner configuré et actif
2. ✅ Cloudflare Tunnel créé (ID: b160e405-a950-4c2a-bb34-8fb6df60114e)
3. ✅ DNS configuré (bailogenius.gaignerot.com et www.bailogenius.gaignerot.com)
4. 🔄 Copier la configuration du tunnel sur le serveur
5. 🔄 Installer le service cloudflared
6. 🔄 Push du code pour déclencher le premier déploiement
7. ✅ L'application sera accessible sur https://bailogenius.gaignerot.com

## Architecture finale

```
Internet
   ↓ HTTPS
Cloudflare (DDoS, SSL, CDN)
   ↓ Cloudflare Tunnel (chiffré)
Serveur Ubuntu (gaignerot@gaignerot)
   ↓ localhost:3000
Docker Container (bailogenius-front)
   ↓ Nginx
Application React (Vite)
```

Avantages de cette architecture :
- ✅ Pas besoin d'IP publique statique
- ✅ Pas de ports ouverts sur le firewall
- ✅ Protection DDoS gratuite
- ✅ SSL/TLS automatique
- ✅ CDN global Cloudflare
- ✅ Analytics et monitoring intégrés
