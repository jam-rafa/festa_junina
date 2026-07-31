# Deploy em KVM

Este projeto ja esta preparado para rodar em producao com Docker Compose:

- `server`: API Node/Express, banco SQLite e uploads em volume persistente.
- `client`: build React/Vite servido por Nginx, com proxy para `/api`, `/uploads` e `/socket.io`.

## 1. Preparar a KVM

Em uma VM Ubuntu/Debian, instale Docker e o plugin Compose:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Saia e entre novamente no SSH para o grupo `docker` valer.

## 2. Enviar o projeto

Opção com Git:

```bash
git clone <URL_DO_REPOSITORIO> festa_junina
cd festa_junina
```

Opção copiando do computador local:

```bash
rsync -av --exclude node_modules --exclude .git ./ usuario@IP_DA_KVM:/var/www/html/festa-junina/
ssh usuario@IP_DA_KVM
cd /var/www/html/festa-junina
```

## 3. Configurar variaveis

```bash
cp .env.example .env
openssl rand -hex 32
nano .env
```

No `.env`, defina pelo menos:

```env
HTTP_PORT=8080
ADMIN_PIN=SEU_PIN_ADMIN
JWT_SECRET=SEGREDO_GERADO_PELO_OPENSSL
JWT_EXPIRES_IN=12h
```

## 4. Subir a aplicacao

```bash
docker compose up -d --build
docker compose ps
```

Teste no proprio servidor:

```bash
curl http://localhost:8080/healthz
```

Se retornar `{"status":"ok"}`, acesse:

```text
http://IP_DA_KVM:8080
```

## 5. Usar dominio e HTTPS

Se tiver dominio, aponte o DNS para o IP da KVM e coloque um proxy reverso na frente. Com Caddy:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

Edite `/etc/caddy/Caddyfile`:

```caddyfile
seu-dominio.com.br {
  reverse_proxy 127.0.0.1:8080
}
```

Recarregue:

```bash
sudo systemctl reload caddy
```

Se usar Nginx como proxy reverso na VM, aumente o limite de upload para permitir fotos em
`/api/arrest-requests`. A API limita imagens a 3 MB, entao deixe o proxy um pouco acima disso:

```nginx
server {
  client_max_body_size 4m;

  location / {
    proxy_pass http://127.0.0.1:8080;
  }
}
```

Depois recarregue:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 6. Atualizar uma versao

```bash
cd /var/www/html/festa-junina
git pull
docker compose up -d --build
docker image prune -f
```

## 7. Deploy automatico com GitHub Actions

Crie no GitHub, em `Settings > Secrets and variables > Actions`, as secrets:

```text
KVM_HOST=145.223.26.181
KVM_USER=root
KVM_PORT=22
KVM_SSH_KEY=<conteudo inteiro da chave privada ~/.ssh/github_actions_deploy>
```

Na KVM, a chave publica correspondente deve estar em `/root/.ssh/authorized_keys`.

O projeto tambem precisa estar clonado na KVM em `/var/www/html/festa-junina`:

```bash
ssh root@145.223.26.181
mkdir -p /var/www/html
cd /var/www/html
git clone git@github.com:jam-rafa/festa_junina.git festa-junina
cd festa-junina
cp .env.example .env
nano .env
docker compose up -d --build
```

Depois disso, todo `git push origin main` executa o deploy automaticamente pelo workflow `.github/workflows/deploy.yml`.

## 8. Backup

O banco SQLite e uploads ficam no volume `queue-data`. Para gerar backup:

```bash
docker run --rm -v festa_junina_queue-data:/data -v "$PWD":/backup alpine tar czf /backup/queue-data-backup.tgz -C /data .
```

Para restaurar, pare a aplicacao e extraia o backup de volta no volume.
