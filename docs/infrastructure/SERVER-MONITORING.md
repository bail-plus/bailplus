# Monitoring du Serveur Ubuntu

## Vérifier l'état du serveur en temps réel

### 1. Vue d'ensemble rapide (htop)

```bash
# Installer htop si pas déjà fait
sudo apt install htop -y

# Lancer htop
htop
```

**Lecture** :
- **CPU** : Barres en haut (si > 80% = serveur en charge)
- **Mem** : Mémoire RAM utilisée
- **Load average** : Charge du système (doit être < nombre de CPU)
- **Processus** : Liste des programmes en cours

**Touches utiles** :
- `F10` ou `q` : Quitter
- `F6` : Trier par CPU/RAM
- `F9` : Tuer un processus

---

### 2. Statistiques CPU, RAM, Disque (une ligne)

```bash
# Afficher CPU, RAM, Disque en une commande
top -bn1 | head -n 5 && free -h && df -h
```

**Lecture** :
```
Cpu(s):  5.2%us,  2.1%sy  → Utilisation CPU (user + system)
MiB Mem:  7892.5 total, 2341.2 free  → RAM totale et libre
/dev/sda1  50G  12G  36G  25% /  → Disque utilisé à 25%
```

---

### 3. Surveillance en temps réel (vmstat)

```bash
# Rafraîchir toutes les 2 secondes
vmstat 2
```

**Colonnes importantes** :
- `r` : Processus en attente (si > 2 = charge élevée)
- `free` : RAM libre
- `si/so` : Swap in/out (si > 0 = RAM saturée)
- `us/sy` : % CPU utilisateur/système
- `wa` : % CPU en attente I/O (disque lent si élevé)

Appuie sur `Ctrl+C` pour arrêter.

---

### 4. Utilisation disque détaillée

```bash
# Voir l'espace disque
df -h

# Voir les plus gros dossiers
du -h --max-depth=1 / 2>/dev/null | sort -hr | head -20

# Voir les fichiers Docker (images, volumes)
docker system df
```

---

### 5. Monitoring réseau (débit)

#### Installer iftop (si pas déjà fait)

```bash
sudo apt install iftop -y
```

#### Voir le trafic réseau en temps réel

```bash
sudo iftop -i eno1
```

**Lecture** :
- Flèches `=>` : Upload (envoi)
- Flèches `<=` : Download (réception)
- Colonnes : 2s, 10s, 40s (débit moyen)

**Touches utiles** :
- `q` : Quitter
- `t` : Changer le mode d'affichage
- `n` : Afficher les IPs au lieu des noms

---

### 6. Tester le débit internet (speedtest)

```bash
# Installer speedtest
curl -s https://packagecloud.io/install/repositories/ookla/speedtest-cli/script.deb.sh | sudo bash
sudo apt-get install speedtest -y

# Lancer le test
speedtest
```

**Résultat** :
```
Download: 500 Mbps
Upload: 250 Mbps
Ping: 10 ms
```

---

## Tester les performances du site web

### 1. Temps de réponse depuis le serveur

```bash
# Test simple (temps total)
time curl -o /dev/null -s -w "Status: %{http_code}\nTemps: %{time_total}s\n" https://bailogenius.gaignerot.com
```

**Résultat** :
```
Status: 200
Temps: 0.234s
```

---

### 2. Test de charge détaillé

```bash
# Installer apache2-utils
sudo apt install apache2-utils -y

# Test avec 100 requêtes, 10 en parallèle
ab -n 100 -c 10 https://bailogenius.gaignerot.com/
```

**Lecture** :
```
Time per request: 245 ms (moyenne)
Requests per second: 40.82
Failed requests: 0
```

---

### 3. Test depuis l'extérieur (ton Mac)

```bash
# Depuis ton Mac
curl -o /dev/null -s -w "Status: %{http_code}\nTemps total: %{time_total}s\nTemps connexion: %{time_connect}s\nTemps SSL: %{time_appconnect}s\nTemps premier byte: %{time_starttransfer}s\n" https://bailogenius.gaignerot.com
```

**Résultat** :
```
Status: 200
Temps total: 0.523s
Temps connexion: 0.012s
Temps SSL: 0.145s
Temps premier byte: 0.234s
```

---

### 4. Test avec Google PageSpeed Insights

En ligne : https://pagespeed.web.dev/

Entre `https://bailogenius.gaignerot.com` et analyse :
- Temps de chargement
- Performance mobile/desktop
- Optimisations recommandées

---

## Monitoring Docker

### Voir l'utilisation des conteneurs

```bash
# Stats en temps réel
docker stats

# Stats une fois
docker stats --no-stream
```

**Résultat** :
```
CONTAINER         CPU %    MEM USAGE / LIMIT    MEM %    NET I/O
bailogenius-front 0.02%    45MiB / 7.7GiB      0.57%    1.2MB / 850kB
```

---

### Logs des conteneurs

```bash
# Voir les logs en temps réel
docker logs -f bailogenius-front

# Voir les 100 dernières lignes
docker logs --tail 100 bailogenius-front
```

---

## Dashboard de monitoring complet (optionnel)

### Installer Netdata (monitoring visuel gratuit)

```bash
# Installation automatique
bash <(curl -Ss https://my-netdata.io/kickstart.sh) --dont-wait

# Accès via Cloudflare Tunnel (configuration nécessaire)
# Ou accès local : http://localhost:19999
```

Netdata te donne un dashboard web avec :
- CPU, RAM, Disque en temps réel
- Graphiques interactifs
- Alertes automatiques
- Monitoring Docker

---

## Script de monitoring rapide

Créer un script pour tout vérifier d'un coup :

```bash
# Sur le serveur
nano ~/check-server.sh
```

Copie ce contenu :

```bash
#!/bin/bash

echo "==================================="
echo "📊 État du serveur $(date)"
echo "==================================="

echo ""
echo "🖥️  CPU et RAM"
top -bn1 | head -n 5

echo ""
echo "💾 Disque"
df -h | grep -E '^/dev'

echo ""
echo "🐳 Docker"
docker stats --no-stream

echo ""
echo "📦 Conteneurs actifs"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🌐 Cloudflare Tunnel"
sudo systemctl status cloudflared --no-pager | grep -E 'Active|Registered'

echo ""
echo "⚡ GitHub Actions Runner"
ps aux | grep -E 'Runner.Listener' | grep -v grep && echo "✅ Runner actif" || echo "❌ Runner inactif"

echo ""
echo "🌍 Test site web"
curl -o /dev/null -s -w "Status: %{http_code} | Temps: %{time_total}s\n" https://bailogenius.gaignerot.com

echo ""
echo "==================================="
```

Rends-le exécutable :

```bash
chmod +x ~/check-server.sh
```

Lance-le :

```bash
~/check-server.sh
```

---

## Alertes automatiques (optionnel)

### Créer une alerte si le serveur est en surcharge

```bash
# Créer un script d'alerte
nano ~/check-health.sh
```

```bash
#!/bin/bash

CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
MEM=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')
DISK=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

echo "CPU: ${CPU}% | RAM: ${MEM}% | Disk: ${DISK}%"

if (( $(echo "$CPU > 80" | bc -l) )); then
  echo "⚠️  CPU élevé: ${CPU}%"
fi

if (( $(echo "$MEM > 80" | bc -l) )); then
  echo "⚠️  RAM élevée: ${MEM}%"
fi

if (( $DISK > 80 )); then
  echo "⚠️  Disque plein: ${DISK}%"
fi
```

```bash
chmod +x ~/check-health.sh
```

Ajoute dans crontab pour vérifier toutes les heures :

```bash
crontab -e
```

Ajoute cette ligne :

```
0 * * * * /home/gaignerot/check-health.sh >> /home/gaignerot/health.log 2>&1
```

---

## Commandes rapides à retenir

```bash
# Vue d'ensemble complète
htop

# Stats Docker
docker stats

# Logs application
docker logs -f bailogenius-front

# Trafic réseau
sudo iftop

# Test de débit
speedtest

# Test site web
curl -o /dev/null -s -w "%{http_code} - %{time_total}s\n" https://bailogenius.gaignerot.com

# Script complet
~/check-server.sh
```

---

## Valeurs normales pour ton serveur

### Idle (repos)
- **CPU** : 0-5%
- **RAM** : 500 MB - 1 GB (avec Docker + runner)
- **Disque** : < 50%
- **Réseau** : < 1 Mbps

### Sous charge (déploiement)
- **CPU** : 20-50%
- **RAM** : 1-2 GB
- **Disque** : I/O élevé temporairement
- **Réseau** : 10-50 Mbps (docker pull/push)

### ⚠️  Alertes
- **CPU** > 80% sur 5+ min → Problème
- **RAM** > 90% → Risque de crash
- **Disque** > 90% → Nettoyer (docker system prune)
- **Swap** utilisé → RAM insuffisante

---

## Nettoyage si le serveur est saturé

```bash
# Nettoyer Docker
docker system prune -af --volumes

# Nettoyer les logs
sudo journalctl --vacuum-time=7d

# Nettoyer apt
sudo apt autoremove -y
sudo apt clean

# Voir les gros fichiers
du -h --max-depth=1 /var/log | sort -hr
du -h --max-depth=1 /home/gaignerot | sort -hr
```

---

## Support

Si tu vois des valeurs anormales :
1. Lance `~/check-server.sh` et copie le résultat
2. Vérifie les logs Docker : `docker logs bailogenius-front`
3. Redémarre le conteneur si besoin : `docker-compose restart`
