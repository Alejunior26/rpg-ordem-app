# RPG Ordem — A.S.A.

Aplicação React para fichas, inventário, bestiário e combate por missão. O cliente usa somente a chave publicável do Supabase; autorização é aplicada no PostgreSQL.

## Desenvolvimento

Requer Node.js 22.12 ou superior; CI usa Node 24.

```sh
npm ci
cp .env.example .env
npm run dev
```

Configure `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY` e, opcionalmente, `REACT_APP_AUTH_REDIRECT_URL`. Cadastre os endereços local e publicado como redirects permitidos no Supabase Auth. Não coloque chaves secretas ou service_role no navegador ou repositório.

`REACT_APP_BYPASS_AUTH` só funciona em desenvolvimento; não cria uma sessão no banco nem ignora RLS. Não use esse modo para verificar a integração com o Supabase.

```sh
npm test
npm run build
npm run preview
```

Os testes executam a migração em PostgreSQL local via PGlite, incluindo instalação limpa, upgrade com histórico, permissões, conflito de versões e isolamento de campanhas. Também verificam a fila de salvamento e a troca de personagens na interface real com o cliente Supabase simulado. Nenhum teste precisa acessar produção.

## Banco e upgrade da versão 1.1

A fonte atual é `supabase/migrations/202610290001_reliable_campaigns.sql`. Os antigos arquivos SQL em `docs/` são apontadores; não reaplique versões antigas de políticas.

1. Inspecione o schema, os gatilhos e as permissões existentes.
2. Execute os testes e o build do commit que será publicado.
3. Aplique a migração por uma conexão administrativa ou pelo SQL Editor do Supabase.
4. Publique esse mesmo commit na Vercel. A saída do build é `dist/` e `vercel.json` seleciona Vite.
5. Confira os contadores de registros, a integridade das fichas e os advisories do banco.

A migração preserva fichas, perfis, missões e tabelas antigas de combate. Converte apenas os papéis legados `adm` e `jogador` para `admin` e `player`. Corrige o gatilho de cadastro, restringe as APIs públicas, adiciona versões às fichas e cria `asa_mission_members`, `asa_combat_state` e `asa_combat_log`.

Como o combate antigo não identificava missão, ele só é importado automaticamente quando existe exatamente uma missão. Nesse caso, todos os eventos são processados no banco, sem o antigo limite de 40 mensagens; mensagens visíveis são copiadas com um identificador que impede duplicação. Com múltiplas missões, o histórico original é preservado e exige uma decisão explícita sobre a missão de destino. A nova interface não usa as tabelas antigas.

O upgrade aposenta as gravações pelas APIs antigas. Se for necessário reverter o cliente, planeje também a compatibilidade das APIs do banco; não reaplique as políticas antigas indiscriminadamente.

## Acesso e uso

- Jogadores veem suas fichas e as missões às quais pertencem.
- O vínculo dos personagens existentes com suas missões é preservado como associação de campanha.
- Mestres e administradores liberam o acesso à missão selecionada no painel administrativo.
- A seleção pessoal sempre mostra apenas personagens do usuário, inclusive para administradores. Inspeção de terceiros fica no painel.
- Novos cadastros começam como `player`. O primeiro administrador deve ser definido por uma conexão administrativa, usando o identificador verificado da conta; não há promoção automática pelo cliente.
- Uma missão pode ser criada pelo mestre na tela de pré-missão.

## Salvamento e conflitos

A ficha só começa a salvar depois de ser carregada. Cada gravação envia a revisão conhecida; o banco rejeita versões antigas. A fila serializa alterações, mantém uma cópia pendente no navegador e tenta novamente ao recuperar a conexão. Antes de trocar de personagem, o app conclui a gravação pendente.

O rodapé informa o estado e permite exportar as cópias. Em conflito com outra aba, “Usar versão do servidor” arquiva a cópia local antes de recarregar; ela continua incluída na exportação. O armazenamento antigo `asa-sheet-v2:<userId>` permanece intacto e também pode ser exportado. Um erro ao criar personagem não produz uma falsa ficha sincronizada.

## Estrutura

- `src/App.jsx`: login, confirmação de e-mail, recuperação e carregamento da aplicação autenticada.
- `src/CharacterApp.jsx`: telas e regras de apresentação da ficha e da mesa.
- `src/services/characterStore.js`: fila, cópias locais e conflitos de gravação.
- `src/hooks/useMissionCombat.js`: estado durável, eventos transacionais e timeline filtrados por missão.
- `src/hooks/useDialogFocus.js`: foco de teclado e Escape nos diálogos.
- `src/domain/`: regras de papéis e itens.
- `src/data/`: catálogos e tema.
- `supabase/migrations/`: schema e autorização versionados.

O `App.js` da raiz apenas reexporta a entrada atual, para evitar duas implementações divergentes. Os catálogos e a aplicação autenticada são carregados depois do login.
