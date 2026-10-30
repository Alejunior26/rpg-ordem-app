# Mesa virtual por missão

A aba **Mesa virtual** reúne o cenário, os tokens e os controles do mestre. Um mestre pode abrir a mesa diretamente na seleção de missão, sem criar uma ficha pessoal. Jogadores entram usando seu personagem da missão.

## Preparar uma sessão

1. Abra **Biblioteca da campanha** e selecione a pasta `ASA_Tower_2077` descompactada. O importador escolhe os mapas sem grade, os retratos e as artes atuais de inimigos, incluindo a revisão dos Portadores. Também é possível enviar imagens PNG, JPEG ou WebP individualmente, até 12 MB por arquivo.
2. Em **Novo cenário**, escolha o mapa, dê um nome e informe as dimensões da grade. Os mapas táticos fornecidos usam 24 × 18 quadrados. Deixe a grade sobreposta desativada quando a imagem já tiver linhas.
3. Crie os tokens. Ameaças começam ocultas; escolha a arte correspondente e o tamanho. Uma criatura Grande pode usar 2 × 2 quadrados. O mestre pode atribuir o controle de uma peça a um participante.
4. Use **Cobrir área** e arraste para esconder trechos do mapa. **Revelar última área** desfaz a última cobertura; **Revelar tudo** limpa as áreas cobertas.
5. Clique **Exibir para os jogadores**. A publicação e a troca de cena ocorrem juntas. A opção **Prévia dos jogadores** permite conferir o cenário ativo, sem tokens ocultos ou cobertos.

Jogadores podem colocar o próprio personagem numa área já revelada. Arraste um token ou selecione-o e use as setas. O mestre pode pausar a movimentação. A régua mede a distância em metros, usando quadrados de 1,5 m. A rodada exibida vem do combate existente; a mesa não cria uma segunda ordem de iniciativa.

## Persistência e acesso

- Cenas, sala ativa e tokens ficam no Supabase, separados por missão. A versão de cada linha evita sobrescrever uma alteração simultânea da mesma peça.
- Somente mestres e administradores preparam/publicam cenas, gerenciam imagens, alteram a visibilidade ou controlam qualquer token. Jogadores podem mover apenas peças que lhes foram atribuídas, no cenário ativo e com movimento liberado.
- As políticas RLS excluem cenas não publicadas, inimigos ocultos e peças sob cobertura das consultas dos jogadores. Não se trata de apenas esconder elementos na tela.
- Uploads usam o bucket privado `asa-tabletop`. O acesso às imagens acompanha as referências liberadas da cena e dos tokens. URLs assinadas duram 15 minutos; uma imagem já vista não pode ser retirada da memória ou cache de quem a recebeu.
- Realtime sinaliza mudanças e os clientes relêem os dados sob RLS. Broadcast transmite somente um aviso vazio de atualização. Uma reconciliação periódica recupera eventos perdidos e alterações de visibilidade.

## Validação

Os testes usam React Testing Library e Postgres local via PGlite. Cobrem isolamento entre missões, nomes e imagens ocultos, áreas cobertas, movimento por dono, bloqueio de alterações em campos privilegiados, limites do mapa, publicação atômica, versões concorrentes, bucket privado e acesso de mestre sem ficha pessoal.

A migração está em `supabase/migrations/20261029205625_virtual_tabletop.sql`. As regras especiais e os atributos das fichas existentes não foram modificados. A importação envia arquivos somente depois de o mestre selecionar a pasta ou a imagem; as artes da campanha não são incorporadas ao bundle público.

Referências de implementação: [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes), [Storage privado](https://supabase.com/docs/guides/storage/buckets/fundamentals) e [controle de acesso do Storage](https://supabase.com/docs/guides/storage/security/access-control).
