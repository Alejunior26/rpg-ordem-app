# Supabase setup do A.S.A.

Este guia prepara o banco para parar de depender de `localStorage` e de eventos escondidos no `combat_log` para dados importantes.

## Criar tabelas

Abra o Supabase, vá em **SQL Editor**, crie uma nova query e rode o conteúdo de `docs/supabase-schema.sql`.

As tabelas novas são:

- `missions`: missões/campanhas disponíveis.
- `characters`: personagens de cada jogador, com a ficha salva em `sheet_json`.
- `combat_sessions`: estado principal da mesa, incluindo rodada e índice do turno.
- `combat_participants`: jogadores, monstros, NPCs e boss dentro de um combate.
- `combat_turns`: histórico de quem já agiu em cada rodada.

## Ativar Realtime

No Supabase:

1. Vá em **Database**.
2. Abra **Replication**.
3. Ative realtime para estas tabelas:
   - `characters`
   - `combat_sessions`
   - `combat_participants`
   - `combat_turns`
   - `combat_log`

## Conferir mestre

O app usa `profiles.role` para saber quem é mestre.

```sql
update profiles
set role = 'adm'
where email = 'SEU_EMAIL_AQUI';
```

Jogadores normais devem ficar com `role = 'jogador'`.
