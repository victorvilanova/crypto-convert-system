# FastCripto - Sistema de Conversão de Criptomoedas

Sistema de conversão de criptomoedas com foco no mercado brasileiro, incluindo cálculo de taxas e impostos, processo KYC e gestão de transações.

## Estrutura de Ambientes

- Desenvolvimento: [dev.fastcripto.com](https://dev.fastcripto.com)
- Teste: [teste.fastcripto.com](https://teste.fastcripto.com)
- Produção: [app.fastcripto.com](https://app.fastcripto.com)

## Tecnologias Utilizadas

- Frontend: HTML5, CSS3, JavaScript puro
- Backend: API RESTful (em desenvolvimento)
- Hospedagem: Hostinger
- Build e Bundling: Parcel v2
- Logging: Winston

## Configuração do Ambiente de Desenvolvimento

1. Clone o repositório
2. Instale as dependências com `npm install`
3. Execute `npm start` para iniciar o servidor de desenvolvimento local
4. Execute `npm run build` para gerar a versão de produção

## Documentação

A documentação do projeto está disponível na pasta `docs/`:

- [Guia de Logging](./docs/logging-guide.md) - Guia completo sobre o sistema de logging
- [Melhorias Implementadas](./docs/melhorias-implementadas.md) - Lista de melhorias recentes
- [Guia de Event Handlers](./docs/event-handler-guide.md) - Práticas recomendadas para gerenciamento de event handlers

## Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera a versão de produção
- `npm test` - Executa os testes
- `npm run test:watch` - Executa os testes em modo de observação
- `npm run test:coverage` - Gera relatório de cobertura de testes
- `npm run lint` - Verifica o código com ESLint
- `npm run format` - Formata o código com Prettier

# Configuração do Fluxo de Desenvolvimento

## Processo de Desenvolvimento

1. **Desenvolvimento Local**

   - Use o `npm start` para desenvolver e testar localmente.
   - Utilize o Git para controle de versão com commits frequentes.
   - Quando uma funcionalidade estiver pronta, faça upload para o ambiente de desenvolvimento.

2. **Upload para o Ambiente de Desenvolvimento**

   - No VSCode, clique com o botão direito na pasta do projeto.
   - Selecione "SFTP: Upload to Hostinger Development".
   - Teste no ambiente online: [dev.fastcripto.com](http://dev.fastcripto.com).

3. **Promoção para o Ambiente de Teste**

   - Quando o desenvolvimento estiver estável:
     - Selecione "SFTP: Upload to Hostinger Test".
     - Realize testes mais rigorosos em [teste.fastcripto.com](http://teste.fastcripto.com).

4. **Promoção para Produção**
   - Após validação completa no ambiente de teste:
     - Selecione "SFTP: Upload to Hostinger Production".
     - Monitore o site em produção: [app.fastcripto.com](http://app.fastcripto.com).

## Configuração de Versionamento

### Branches Git para cada ambiente:

- **develop**: desenvolvimento contínuo
- **staging**: para o ambiente de teste
- **main**: para produção

### Exemplo de Fluxo de Trabalho

```bash
# Criar branch de feature
git checkout -b feature/nova-funcionalidade develop

# Desenvolvimento da funcionalidade
# ... (commits)

# Quando pronta, mesclar na develop
git checkout develop
git merge --no-ff feature/nova-funcionalidade

# Upload para ambiente de desenvolvimento
# Usando a extensão SFTP do VSCode

# Quando develop estiver estável
git checkout staging
git merge --no-ff develop

# Upload para ambiente de teste
# Usando a extensão SFTP do VSCode

# Após testes bem-sucedidos
git checkout main
git merge --no-ff staging

# Upload para produção
# Usando a extensão SFTP do VSCode
```

## Fluxo de Trabalho

- `develop`: Desenvolvimento contínuo
- `staging`: Testes e homologação
- `main`: Produção

## Características

- Cálculo de impostos brasileiros (IOF, IR)
- Sistema completo de KYC
- Integração com múltiplas redes blockchain
- Cotações em tempo real
- Logging estruturado e monitoramento
- Segurança aprimorada
