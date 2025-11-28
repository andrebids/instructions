# ServerRestart.ps1
# Reinicialização do servidor PM2

function Restart-Server {
    param(
        [string]$SshKey,
        [string]$SshUser,
        [string]$SshHost,
        [string]$ServerRootPath,
        [string]$ServerPath,
        [string]$Pm2AppName
    )
    
    # Normalizar caminhos removendo caracteres de retorno de linha
    $ServerRootPath = ($ServerRootPath -replace "`r`n", "" -replace "`r", "" -replace "`n", "").Trim()
    $ServerPath = ($ServerPath -replace "`r`n", "" -replace "`r", "" -replace "`n", "").Trim()
    $Pm2AppName = ($Pm2AppName -replace "`r`n", "" -replace "`r", "" -replace "`n", "").Trim()
    
    Write-Host "=== 5. Reiniciar Servidor ===" -ForegroundColor Cyan
    Write-Host "Reiniciando servidor PM2..." -ForegroundColor Gray
    # Criar comando bash usando variáveis bash para evitar problemas com \r
    # Caminhos e nomes não têm aspas, então podemos usar interpolação direta
    $restartCommands = @"
PM2_APP_NAME='$Pm2AppName'
SERVER_ROOT_PATH='$ServerRootPath'
SERVER_PATH='$ServerPath'
echo "DEBUG: PM2_APP_NAME=`$PM2_APP_NAME"
echo "DEBUG: SERVER_ROOT_PATH=`$SERVER_ROOT_PATH"
echo "DEBUG: SERVER_PATH=`$SERVER_PATH"

echo 'Status atual do PM2:'
pm2 status "`$PM2_APP_NAME" || echo 'App nao encontrado no PM2'
echo ''
echo 'Ultimas linhas dos logs (se houver erros):'
pm2 logs "`$PM2_APP_NAME" --lines 10 --nostream 2>&1 | tail -20 || echo 'Nao foi possivel ler logs'
echo ''
echo 'Reiniciando servidor...'
pm2 restart "`$PM2_APP_NAME" 2>&1
RESTART_EXIT=`$?
if [ `$RESTART_EXIT -eq 0 ]; then
    echo 'Servidor reiniciado com sucesso!'
    sleep 3
    echo ''
    echo 'Status do PM2:'
    pm2 status "`$PM2_APP_NAME"
    echo ''
    echo 'Verificando processo...'
    PM2_PID=`$(pm2 jlist | grep -A 5 "\"name\":\"`$PM2_APP_NAME\"" | grep -o '"pid":[0-9]*' | cut -d: -f2 | head -1)
    if [ -n "`$PM2_PID" ] && [ "`$PM2_PID" != "null" ]; then
        echo "PID do servidor: `$PM2_PID"
        if ps -p `$PM2_PID > /dev/null 2>&1; then
            echo 'Processo esta rodando'
        else
            echo 'AVISO: Processo nao esta mais rodando!'
        fi
    else
        echo 'AVISO: Nao foi possivel obter PID do servidor'
    fi
    echo ''
    echo 'Aguardando servidor iniciar...'
    sleep 3
    echo 'Verificando se servidor backend responde...'
    HTTP_CODE=`$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5000/health 2>/dev/null || echo '000')
    if [ -z "`$HTTP_CODE" ]; then
        HTTP_CODE='000'
    fi
    if [ "`$HTTP_CODE" = "200" ]; then
        echo '✅ Backend esta online e respondendo na porta 5000!'
    elif [ "`$HTTP_CODE" = "000" ]; then
        echo 'ERRO: Backend nao esta respondendo (curl falhou)'
        echo 'Verificando logs de erro...'
        pm2 logs "`$PM2_APP_NAME" --err --lines 20 --nostream 2>&1 | tail -20
    else
        echo "AVISO: Backend respondeu com codigo HTTP `$HTTP_CODE"
    fi
    echo ''
    echo 'Parando dev server (instructions-client) se estiver rodando...'
    CLIENT_STATUS=`$(pm2 jlist | grep -A 5 "\"name\":\"instructions-client\"" | grep -o '"pm_id":[0-9]*' | cut -d: -f2 | head -1)
    if [ -n "`$CLIENT_STATUS" ] && [ "`$CLIENT_STATUS" != "null" ]; then
        echo 'Parando instructions-client (dev server)...'
        pm2 stop instructions-client 2>&1 || true
        pm2 delete instructions-client 2>&1 || true
        echo '✅ Dev server parado (produção usa build estático servido pelo Express)'
    else
        echo 'ℹ️  Dev server (instructions-client) nao estava rodando'
    fi
    echo ''
    echo 'Verificando se Express esta servindo build de produção (dist/)...'
    # Verificar se dist/ existe no servidor
    if [ -d "`$SERVER_PATH/dist" ] && [ -f "`$SERVER_PATH/dist/index.html" ]; then
        echo '✅ Build de produção encontrado em dist/'
        # Verificar se Express está servindo o frontend corretamente
        FRONTEND_CODE=`$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5000/ 2>/dev/null || echo '000')
        if [ "`$FRONTEND_CODE" = "200" ] || [ "`$FRONTEND_CODE" = "304" ]; then
            echo '✅ Express esta servindo o frontend corretamente na porta 5000!'
            # Verificar se é HTML (não JSON da API)
            CONTENT_TYPE=`$(curl -s -I http://localhost:5000/ 2>/dev/null | grep -i 'content-type' | cut -d: -f2 | tr -d ' \r\n' || echo '')
            if echo "`$CONTENT_TYPE" | grep -qi 'text/html'; then
                echo '✅ Frontend HTML sendo servido corretamente!'
            else
                echo "⚠️  Resposta nao e HTML (Content-Type: `$CONTENT_TYPE) - pode estar servindo API info em vez de index.html"
            fi
        else
            echo "⚠️  Express respondeu com codigo HTTP `$FRONTEND_CODE na porta 5000"
            echo '💡 Verifique se o Express detectou o dist/ e esta servindo arquivos estaticos'
        fi
    else
        echo '⚠️  Build de producao nao encontrado em dist/'
        echo "   Caminho esperado: `$SERVER_PATH/dist"
        echo '💡 Certifique-se de que o build foi enviado corretamente'
    fi
else
    echo 'ERRO ao reiniciar servidor PM2'
    echo ''
    echo 'Tentando iniciar o servidor...'
    cd "`$SERVER_ROOT_PATH/server"
    pm2 start npm --name "`$PM2_APP_NAME" -- start 2>&1 || echo 'Falha ao iniciar servidor'
    pm2 save 2>&1 || true
    echo ''
    echo 'Status final:'
    pm2 status
fi
RESTART_COUNT=`$(pm2 jlist | grep -A 10 "\"name\":\"`$PM2_APP_NAME\"" | grep -o '"restart_time":[0-9]*' | cut -d: -f2 | head -1)
if [ -n "`$RESTART_COUNT" ] && [ "`$RESTART_COUNT" != "null" ] && [ "`$RESTART_COUNT" -gt 10 ] 2>/dev/null; then
    echo ''
    echo "AVISO: Servidor reiniciou `$RESTART_COUNT vezes - possivel crash loop"
    echo 'Ultimos logs de erro:'
    pm2 logs "`$PM2_APP_NAME" --err --lines 30 --nostream 2>&1 | tail -30
fi
"@
    
    $restartOutput = Invoke-SshCommand -User $SshUser -SshHost $SshHost -Key $SshKey -BashCommand $restartCommands
    Write-Host $restartOutput -ForegroundColor Gray
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[AVISO] Pode ter havido problemas ao reiniciar o servidor" -ForegroundColor Yellow
        Write-Host "   Verifique manualmente: ssh $SshUser@$SshHost 'pm2 status'" -ForegroundColor Yellow
        Write-Host "   Ver logs: ssh $SshUser@$SshHost 'pm2 logs instructions-server --lines 50'" -ForegroundColor Yellow
    }
    else {
        Write-Host "[OK] Servidor reiniciado com sucesso!" -ForegroundColor Green
    }
    Write-Host ""
}

