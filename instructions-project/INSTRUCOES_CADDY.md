# Instruções para Configurar o Caddy

## Problema Atual
O site `https://thecore.dsproject.pt/` está retornando **502 Bad Gateway** porque o Caddy não está configurado para fazer proxy reverso para o servidor Express.

## Situação
- **Servidor Express**: Rodando em `atlantis-dev` (192.168.2.77) na porta 5000 ✅
- **Caddy**: Rodando em outro servidor (gateway com IP público 95.136.9.53)
- **Problema**: Caddy precisa estar configurado para fazer proxy para `192.168.2.77:5000`

## Solução

### Opção 1: Se o Caddy está no mesmo servidor (dev)

Execute no servidor:

```bash
ssh dev
sudo /home/bids/fix-caddy-config.sh
```

### Opção 2: Se o Caddy está em outro servidor (gateway)

Você precisa acessar o servidor onde o Caddy está rodando e configurar:

1. **Encontrar o servidor do Caddy:**
   ```bash
   # O Caddy está provavelmente no servidor com IP público 95.136.9.53
   # Verifique qual servidor tem esse IP
   ```

2. **Configurar o Caddyfile:**
   ```bash
   # No servidor onde o Caddy está rodando:
   sudo nano /etc/caddy/Caddyfile
   ```

3. **Adicionar/Atualizar configuração:**
   ```caddy
   thecore.dsproject.pt {
       reverse_proxy 192.168.2.77:5000
       encode zstd gzip
   }
   ```

4. **Validar e recarregar:**
   ```bash
   sudo caddy validate --config /etc/caddy/Caddyfile
   sudo systemctl reload caddy
   ```

## Verificação

Após configurar, teste:

```bash
curl -I https://thecore.dsproject.pt/health
```

Deve retornar `200 OK` em vez de `502 Bad Gateway`.

## Nota Importante

⚠️ **Esta configuração é ÚNICA** - você só precisa fazer uma vez. Após configurar, o Caddy continuará fazendo proxy para a porta 5000 automaticamente, mesmo após fazer deploy de novas versões do código.

O Caddy faz proxy reverso para o servidor Express, então:
- ✅ Fazer push para Git → Não precisa reconfigurar Caddy
- ✅ Fazer build → Não precisa reconfigurar Caddy  
- ✅ Fazer deploy → Não precisa reconfigurar Caddy
- ✅ Reiniciar PM2 → Não precisa reconfigurar Caddy

A configuração do Caddy só precisa ser alterada se:
- Mudar o IP do servidor Express
- Mudar a porta do Express (atualmente 5000)
- Adicionar/remover domínios

