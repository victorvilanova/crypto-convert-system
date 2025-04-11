# Configuração do Serviço de Email da FastCripto

Este documento explica como configurar e utilizar o serviço de envio de emails por SMTP da FastCripto, especificamente para o processo de KYC (Know Your Customer).

## Visão Geral

O sistema utiliza uma arquitetura completa para o envio de emails via SMTP:

1. **Backend**: Serviço Node.js com Express que gerencia o envio de emails
2. **Frontend**: Integração com o processo de KYC para solicitar validação de email
3. **Segurança**: Credenciais armazenadas em variáveis de ambiente
4. **Monitoramento**: Sistema de logs para rastreamento de todos os emails enviados

## Pré-requisitos

- Node.js 14+ e npm
- Conta de email SMTP válida (ex: Gmail, Microsoft 365, serviço SMTP próprio)
- Permissões para usar SMTP no serviço de email escolhido (alguns serviços precisam de configuração adicional)

## Configuração do SMTP

Para configurar o serviço de email, você precisa definir as variáveis de ambiente no arquivo `.env`:

```
# Configuração de email
EMAIL_FROM=compliance@fastcripto.com
SMTP_HOST=smtp.seu-provedor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=compliance@fastcripto.com
SMTP_PASSWORD=sua-senha-segura
EMAIL_CODE_EXPIRY=30
```

### Notas sobre configuração SMTP

1. **Gmail**: Para usar o Gmail como serviço SMTP:
   - Acesse https://myaccount.google.com/security
   - Ative a "Verificação em duas etapas"
   - Gere uma "Senha de app" para usar como SMTP_PASSWORD
   - Use `smtp.gmail.com` como SMTP_HOST e porta 587

2. **Microsoft 365/Outlook**:
   - Use `smtp.office365.com` como SMTP_HOST e porta 587
   - Use sua senha normal ou crie uma senha de app na sua conta Microsoft

3. **Serviço SMTP próprio**:
   - Configure de acordo com as especificações do seu provedor

## Iniciando o Serviço

1. Instale as dependências:
   ```
   npm install
   ```

2. Inicie o servidor:
   ```
   npm start
   ```

3. Para desenvolvimento:
   ```
   npm run dev
   ```

## Testando o Serviço de Email

Você pode testar o serviço de email utilizando:

1. **Frontend**: Use a funcionalidade de KYC para enviar um código de verificação
2. **API Direta**: Faça uma chamada para a API:

```
POST /api/email/verification/send
Content-Type: application/json

{
  "email": "destinatario@exemplo.com",
  "name": "Nome do Cliente"
}
```

## Monitoramento e Logs

Os logs de email são armazenados em:

- `logs/email.log`: Registro de todos os emails enviados
- `logs/error.log`: Erros relacionados a email e outros componentes

## Solução de Problemas

Se o email não estiver sendo enviado:

1. Verifique as credenciais SMTP no arquivo `.env`
2. Confira os logs em `logs/error.log` para mensagens de erro específicas
3. Confirme que o servidor SMTP não está bloqueando conexões (algumas redes corporativas bloqueiam a porta SMTP)
4. Para contas Gmail, confirme que a "Senha de app" está configurada corretamente

## Personalizando o Template

O template de email pode ser modificado em `src/services/emailService.js`. O sistema usa HTML para formatar o email, permitindo personalização completa.

## Segurança

- Nunca comite o arquivo `.env` no repositório
- Considere rotacionar as senhas SMTP periodicamente
- Para produção, use um serviço de email com proteção anti-spam adequada 