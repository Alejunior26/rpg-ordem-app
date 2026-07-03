# Supabase setup do A.S.A.

Este guia prepara o banco para salvar personagens e combate de forma sincronizada entre PC, celular e contas diferentes. Hoje o app ainda usa `localStorage` e eventos `[FLOW]` dentro de `combat_log`; estas tabelas são a base para migrar isso com segurança.

## 1. Rodar o schema

1. Abra o painel do Supabase.
2. Entre no projeto do RPG.
3. No menu esquerdo, clique em **SQL Editor**.
4. Clique em **New query**.
5. Abra o arquivo `docs/supabase-schema.sql` no GitHub.
6. Copie todo o conteúdo do SQL.
7. Cole no SQL Editor.
8. Clique em **Run**.

Se aparecer mensagem de sucesso, as tabelas e policies foram criadas.

## 2. Tabelas criadas

- `missions`: missões/campanhas disponíveis.
- `characters`: personagens de cada jogador, com a ficha salva em `sheet_json`.
- `combat_sessions`: estado principal da mesa, incluindo rodada e índice do turno.
- `combat_participants`: jogadores, monstros, NPCs e boss dentro de um combate.
- `combat_turns`: histórico de quem já agiu em cada rodada.

## 3. Ativar Realtime

1. No Supabase, vá em **Database**.
2. Abra **Replication**.
3. Procure a publicação realtime.
4. Ative estas tabelas:
   - `characters`
   - `combat_sessions`
   - `combat_participants`
   - `combat_turns`
   - `combat_log`

Isso permite que a tela de combate e os personagens atualizem em tempo real.

## 4. Confirmar quem é mestre

O app usa `profiles.role` para saber quem é mestre. Rode isto trocando o e-mail:

```sql
update profiles
set role = 'adm'
where email = 'SEU_EMAIL_AQUI';
```

Jogadores normais devem ficar com:

```sql
update profiles
set role = 'jogador'
where email = 'EMAIL_DO_JOGADOR';
```

## 5. Criar missão inicial

O schema já tenta criar a missão `Operação Aurora`. Se quiser criar outra manualmente:

```sql
insert into missions (name, description)
values ('Nome da Missão', 'Descrição curta da missão');
```

## 6. Como conferir se deu certo

No Supabase, vá em **Table Editor** e veja se existem:

- `missions`
- `characters`
- `combat_sessions`
- `combat_participants`
- `combat_turns`

Depois abra `missions` e confirme se existe pelo menos uma missão.

## 7. Próxima etapa no código

Com essas tabelas prontas, o app pode ser migrado assim:

- tela de missão passa a ler `missions`.
- criação/seleção de personagem passa a ler e gravar `characters`.
- ficha inteira passa a salvar em `characters.sheet_json`.
- entrada no combate passa a inserir em `combat_participants`.
- ordem e rodada passam a atualizar `combat_sessions`.
- turnos concluídos passam a gravar em `combat_turns`.
- `combat_log` fica somente para mensagens visíveis na timeline.

Essa migração remove a principal causa dos bugs de ficha misturada e melhora o uso no celular, porque os dados deixam de ficar presos em um navegador específico.
