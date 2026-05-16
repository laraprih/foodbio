# Foodbio — VPS Setup Guide
> Ubuntu 22.04 LTS · VPS Cloud 05 · 6 vCores · 6 GB RAM · 65 GB SSD

---

## Especificações da VPS

| Item | Valor |
|---|---|
| SO | Ubuntu 22.04 LTS |
| vCores | 6 @ 5.7 GHz (boost) |
| RAM | 6 GB |
| Armazenamento | 65 GB SSD |
| IP | 1 fixo |
| Rede | 5 Gbps · tráfego ilimitado |
| Anti-DDoS | Incluído (verificar se cobre L7) |
| Uptime SLA | 99,9% |

---

## Arquitetura de processos na VPS

```
Internet (443/80)
       ↓
    Nginx
    ├── app.seudominio.com  → 127.0.0.1:3000  (Next.js  · 4 workers PM2)
    └── api.seudominio.com  → 127.0.0.1:3001  (Fastify  · 1 worker PM2)
                                   ↕ WebSocket upgrade em /socket.io/

Internos (não expostos):
  Next.js  → 127.0.0.1:5432  (PostgreSQL)
  Fastify  → 127.0.0.1:5432  (PostgreSQL via Prisma)
  Fastify  → 127.0.0.1:6379  (Redis — cache + BullMQ)
  Next.js  → 127.0.0.1:3001  (serverEmit → /api/internal/emit)

Distribuição de cores:
  Core 0–3  →  Next.js (4 workers cluster)
  Core 4    →  Fastify + Socket.IO + BullMQ workers
  Core 5    →  PostgreSQL + Redis + Nginx + OS
```

---

## FASE 1 — Preparação inicial do servidor

```bash
# Conectar como root na primeira vez
ssh root@SEU_IP_AQUI

# Atualizar sistema
apt update && apt upgrade -y

# Criar swap de 2 GB (proteção para next build)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
echo 'vm.swappiness=10' >> /etc/sysctl.conf
sysctl -p

# Criar usuário de deploy (nunca rodar como root em produção)
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy/.ssh
```

### Hardening SSH

```bash
nano /etc/ssh/sshd_config
```

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
```

```bash
systemctl restart sshd
```

---

## FASE 2 — Instalação de dependências

```bash
apt install -y curl git build-essential ufw fail2ban \
               nginx certbot python3-certbot-nginx \
               postgresql-14 redis-server

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# PM2 (gerenciador de processos)
npm install -g pm2

# Confirmar versões
node -v    # v20.x.x
npm -v     # 10.x.x
pm2 -v     # 5.x.x
```

---

## FASE 3 — PostgreSQL

```bash
sudo -u postgres psql
```

```sql
CREATE USER foodbio WITH PASSWORD 'TROCAR_SENHA_FORTE';
CREATE DATABASE foodbio OWNER foodbio;
GRANT ALL PRIVILEGES ON DATABASE foodbio TO foodbio;
\q
```

### postgresql.conf  (/etc/postgresql/14/main/postgresql.conf)

```conf
# Memória (calibrado para 6 GB RAM)
shared_buffers                = 1536MB
work_mem                      = 32MB
maintenance_work_mem          = 512MB
effective_cache_size          = 4GB
wal_buffers                   = 32MB

# Conexões
max_connections               = 100

# Checkpoints
checkpoint_completion_target  = 0.9
checkpoint_timeout            = 15min

# Logging (só queries lentas)
log_min_duration_statement    = 1000
log_line_prefix               = '%t [%p] %u@%d '
```

```bash
systemctl restart postgresql
systemctl enable postgresql
```

---

## FASE 4 — Redis

### redis.conf  (/etc/redis/redis.conf)

```conf
bind 127.0.0.1
port 6379
requirepass TROCAR_REDIS_SENHA_FORTE

# Limite de memória
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistência (necessário para BullMQ jobs)
save 900 1
save 300 10
appendonly yes
appendfilename "appendonly.aof"

# Desabilita comandos perigosos
rename-command FLUSHALL ""
rename-command FLUSHDB  ""
rename-command CONFIG   ""
```

```bash
systemctl restart redis-server
systemctl enable redis-server

# Testar conexão
redis-cli -a TROCAR_REDIS_SENHA_FORTE ping  # deve retornar PONG
```

---

## FASE 5 — Clone e build da aplicação

```bash
su - deploy
mkdir -p /home/deploy/foodbio /home/deploy/logs /home/deploy/backups

cd /home/deploy/foodbio
git clone https://github.com/seu-usuario/foodbio.git .

# ── Next.js ──────────────────────────────────────────────────────
npm ci
npm run build

# Copia arquivos estáticos para dentro do standalone
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

# ── Fastify ──────────────────────────────────────────────────────
cd api
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
cd ..
```

---

## FASE 6 — Variáveis de ambiente

### /home/deploy/foodbio/.env.production

```env
# NextAuth
AUTH_SECRET=                          # openssl rand -base64 32
NEXTAUTH_URL=https://app.seudominio.com

# Fastify (mesmo servidor)
NEXT_PUBLIC_API_URL=https://api.seudominio.com
NEXT_PUBLIC_SOCKET_URL=https://api.seudominio.com

# Banco de dados
DATABASE_URL=postgresql://foodbio:TROCAR_SENHA_FORTE@127.0.0.1:5432/foodbio

# Comunicação interna Next.js ↔ Fastify
INTERNAL_SECRET=                      # openssl rand -hex 32

# Mercado Pago
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-...
MP_WEBHOOK_SECRET=
MP_ACCESS_TOKEN=APP_USR-...
MP_CLIENT_ID=
MP_CLIENT_SECRET=

# Facebook OAuth (opcional)
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# Cloudinary (imagens)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_UPLOAD_PRESET=
```

### /home/deploy/foodbio/api/.env

```env
DATABASE_URL=postgresql://foodbio:TROCAR_SENHA_FORTE@127.0.0.1:5432/foodbio
DIRECT_URL=postgresql://foodbio:TROCAR_SENHA_FORTE@127.0.0.1:5432/foodbio
REDIS_URL=redis://:TROCAR_REDIS_SENHA_FORTE@127.0.0.1:6379
PORT=3001

# Segredos
JWT_SECRET=                           # openssl rand -hex 32
INTERNAL_SECRET=                      # mesmo valor do .env.production
ENCRYPTION_KEY=                       # openssl rand -hex 32  (64 chars = 32 bytes AES-256)

# Frontend
FRONTEND_URL=https://app.seudominio.com

# Mercado Pago
MP_ACCESS_TOKEN=APP_USR-...
MP_PUBLIC_KEY=APP_USR-...
MP_CLIENT_ID=
MP_CLIENT_SECRET=
MP_REDIRECT_URI=https://api.seudominio.com/api/admin/payment/mp/callback
MP_WEBHOOK_SECRET=

# PagBank
PB_API_TOKEN=
PB_WEBHOOK_SECRET=
```

> **Gerar todos os secrets de uma vez:**
> ```bash
> echo "AUTH_SECRET=$(openssl rand -base64 32)"
> echo "JWT_SECRET=$(openssl rand -hex 32)"
> echo "INTERNAL_SECRET=$(openssl rand -hex 32)"
> echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"
> echo "REDIS_PASS=$(openssl rand -hex 24)"
> echo "DB_PASS=$(openssl rand -hex 24)"
> ```

---

## FASE 7 — PM2 ecosystem

### /home/deploy/foodbio/ecosystem.config.js

```js
module.exports = {
  apps: [
    {
      name: 'foodbio-web',
      script: '.next/standalone/server.js',
      cwd: '/home/deploy/foodbio',
      instances: 4,
      exec_mode: 'cluster',
      env_file: '/home/deploy/foodbio/.env.production',
      max_memory_restart: '800M',
      error_file: '/home/deploy/logs/web-error.log',
      out_file: '/home/deploy/logs/web-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'foodbio-api',
      script: 'dist/server.js',
      cwd: '/home/deploy/foodbio/api',
      instances: 1,
      env_file: '/home/deploy/foodbio/api/.env',
      max_memory_restart: '600M',
      error_file: '/home/deploy/logs/api-error.log',
      out_file: '/home/deploy/logs/api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
```

```bash
# Iniciar
pm2 start /home/deploy/foodbio/ecosystem.config.js

# Persistir na inicialização do SO
pm2 save
pm2 startup systemd -u deploy --hp /home/deploy
# Executar o comando que o PM2 imprimir

# Verificar status
pm2 status
pm2 logs --lines 50
```

---

## FASE 8 — Nginx

### /etc/nginx/sites-available/foodbio

```nginx
# ── Configurações globais de performance ────────────────────────
upstream nextjs {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream fastify {
    server 127.0.0.1:3001;
    keepalive 16;
}

# ── Frontend (Next.js) ──────────────────────────────────────────
server {
    server_name app.seudominio.com;
    listen 80;

    client_max_body_size 10M;

    # Arquivos estáticos com cache longo
    location /_next/static/ {
        proxy_pass http://nextjs;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Uploads locais
    location /uploads/ {
        alias /home/deploy/foodbio/public/uploads/;
        add_header Cache-Control "public, max-age=86400";
        access_log off;
    }

    location / {
        proxy_pass          http://nextjs;
        proxy_http_version  1.1;
        proxy_set_header    Host              $host;
        proxy_set_header    X-Real-IP         $remote_addr;
        proxy_set_header    X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto $scheme;
        proxy_set_header    Connection        "";
        proxy_read_timeout  60s;
        proxy_send_timeout  60s;
    }
}

# ── Backend (Fastify + Socket.IO) ───────────────────────────────
server {
    server_name api.seudominio.com;
    listen 80;

    client_max_body_size 10M;

    # Socket.IO — requer upgrade de protocolo e sem buffering
    location /socket.io/ {
        proxy_pass          http://fastify;
        proxy_http_version  1.1;
        proxy_set_header    Upgrade           $http_upgrade;
        proxy_set_header    Connection        "upgrade";
        proxy_set_header    Host              $host;
        proxy_set_header    X-Real-IP         $remote_addr;
        proxy_read_timeout  3600s;
        proxy_send_timeout  3600s;
        proxy_buffering     off;
    }

    location / {
        proxy_pass          http://fastify;
        proxy_http_version  1.1;
        proxy_set_header    Host              $host;
        proxy_set_header    X-Real-IP         $remote_addr;
        proxy_set_header    X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto $scheme;
        proxy_set_header    Connection        "";
        proxy_read_timeout  30s;
    }
}
```

```bash
# Ativar site
ln -s /etc/nginx/sites-available/foodbio /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar e recarregar
nginx -t
systemctl reload nginx
systemctl enable nginx
```

---

## FASE 9 — SSL (Let's Encrypt)

```bash
certbot --nginx \
  -d app.seudominio.com \
  -d api.seudominio.com \
  --email seu@email.com \
  --agree-tos \
  --non-interactive \
  --redirect

# Verificar renovação automática
systemctl status certbot.timer
certbot renew --dry-run
```

---

## FASE 10 — Firewall (UFW)

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'    # 80 + 443

# Bloqueia acesso externo direto aos serviços internos
# PostgreSQL (5432), Redis (6379), Node (3000/3001) ficam apenas em 127.0.0.1

ufw enable
ufw status verbose
```

---

## FASE 11 — Fail2ban

### /etc/fail2ban/jail.local

```ini
[DEFAULT]
bantime  = 2h
findtime = 10m
maxretry = 5
ignoreip = 127.0.0.1/8

[sshd]
enabled  = true
port     = ssh
maxretry = 3

[nginx-http-auth]
enabled = true

[nginx-botsearch]
enabled  = true
maxretry = 2
bantime  = 24h

[nginx-limit-req]
enabled  = true
```

```bash
systemctl restart fail2ban
systemctl enable fail2ban
fail2ban-client status
```

---

## FASE 12 — Logrotate

### /etc/logrotate.d/foodbio

```
/home/deploy/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
```

---

## FASE 13 — Backup automático do PostgreSQL

### /home/deploy/backup.sh

```bash
#!/bin/bash
set -e

BACKUP_DIR=/home/deploy/backups
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Dump comprimido
PGPASSWORD="TROCAR_SENHA_FORTE" pg_dump \
  -U foodbio \
  -h 127.0.0.1 \
  foodbio | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Mantém últimos 7 dias
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "[$DATE] Backup concluído: db_$DATE.sql.gz"
```

```bash
chmod +x /home/deploy/backup.sh

# Agenda às 3h diariamente
crontab -e
# Adicionar:
0 3 * * * /home/deploy/backup.sh >> /home/deploy/logs/backup.log 2>&1
```

---

## FASE 14 — Script de deploy sem downtime

### /home/deploy/deploy.sh

```bash
#!/bin/bash
set -e

APP_DIR=/home/deploy/foodbio
LOG=/home/deploy/logs/deploy.log

echo "$(date '+%Y-%m-%d %H:%M:%S') — Iniciando deploy..." | tee -a $LOG

cd $APP_DIR

# Puxa atualizações
git pull origin main 2>&1 | tee -a $LOG

# ── Next.js ──────────────────────────────────────────────────────
npm ci --omit=dev 2>&1 | tee -a $LOG
npm run build 2>&1 | tee -a $LOG
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

# ── Fastify ──────────────────────────────────────────────────────
cd api
npm ci --omit=dev 2>&1 | tee -a $LOG
npx prisma migrate deploy 2>&1 | tee -a $LOG
npm run build 2>&1 | tee -a $LOG
cd ..

# Reinicia sem downtime
pm2 reload foodbio-web --update-env 2>&1 | tee -a $LOG
pm2 restart foodbio-api --update-env 2>&1 | tee -a $LOG

echo "$(date '+%Y-%m-%d %H:%M:%S') — Deploy concluído." | tee -a $LOG
```

```bash
chmod +x /home/deploy/deploy.sh
```

---

## Monitoramento de disco (alerta em 80%)

```bash
# Adicionar ao crontab do deploy
0 8 * * * df -h / | awk 'NR==2{gsub("%",""); if($5>80) print "ALERTA: disco em "$5"% em $(hostname)"}' | grep ALERTA | mail -s "Disco VPS Foodbio" seu@email.com
```

---

## Referência rápida — comandos do dia a dia

```bash
# Status dos processos
pm2 status
pm2 monit                          # dashboard tempo real

# Logs
pm2 logs foodbio-web --lines 100
pm2 logs foodbio-api --lines 100

# Deploy
/home/deploy/deploy.sh

# Restart manual
pm2 reload foodbio-web
pm2 restart foodbio-api

# PostgreSQL
sudo -u postgres psql foodbio
PGPASSWORD=SENHA pg_dump -U foodbio foodbio | gzip > backup.sql.gz

# Redis
redis-cli -a REDIS_SENHA info memory
redis-cli -a REDIS_SENHA dbsize

# Nginx
nginx -t
systemctl reload nginx
tail -f /var/log/nginx/error.log

# Certificado SSL
certbot renew --dry-run

# Uso de recursos
htop
df -h
free -h
```

---

## Projeção de capacidade

| Restaurantes ativos | Pedidos/hora | RAM estimada | CPU estimado |
|---|---|---|---|
| 1–5 | < 50 | ~1.5 GB | ~10% |
| 5–30 | < 300 | ~2.5 GB | ~30% |
| 30–80 | < 800 | ~4.5 GB | ~65% |
| 80–120 ⚠️ | < 1500 | ~5.5 GB | ~85% |

> Acima de ~80 restaurantes: separar PostgreSQL para servidor dedicado ou managed DB.

---

## Checklist pré-deploy

- [ ] Domínios `app.` e `api.` apontando para o IP da VPS
- [ ] Confirmar se o SSD é NVMe (pedir ao provedor)
- [ ] Confirmar localização do datacenter (SP/RJ = melhor latência BR)
- [ ] Confirmar se Anti-DDoS cobre camada 7 (HTTP flood)
- [ ] Gerar todos os secrets com `openssl rand`
- [ ] Testar conexão SSH com usuário `deploy` antes de desabilitar root
- [ ] Webhook MP configurado para `https://api.seudominio.com/api/webhooks/payment/mercadopago`
- [ ] Primeiro backup manual após o deploy inicial

---

*Gerado em: 2026-05-16 | Projeto: Foodbio | VPS: Cloud 05*
