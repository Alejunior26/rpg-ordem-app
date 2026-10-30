# Mesa virtual por missão

A aba **Mesa virtual** reúne o cenário, os tokens e os controles do mestre. Um mestre pode abrir a mesa diretamente na seleção de missão, sem criar uma ficha pessoal. Jogadores entram usando seu personagem da missão.

## Preparar uma sessão

1. Abra **Biblioteca da campanha** e use **Adicionar mapas e tokens v6**. O pacote contém 19 mapas vinculados à história e 19 tokens PNG transparentes. A instalação cria cenários em preparação, atualiza artes antigas reconhecidas e pode ser repetida sem duplicar o conteúdo. Também é possível importar a pasta original `ASA_Tower_2077` ou enviar PNG, JPEG e WebP individuais de até 12 MB.
2. Em **Novo cenário**, escolha o mapa, dê um nome e informe as dimensões da grade. Os mapas táticos fornecidos usam 24 × 18 quadrados. Deixe a grade sobreposta desativada quando a imagem já tiver linhas.
3. Crie os tokens. Ameaças começam ocultas; escolha a arte correspondente e o tamanho. Uma criatura Grande pode usar 2 × 2 quadrados. O mestre pode atribuir o controle de uma peça a um participante.
4. Use **Cobrir área** e arraste para esconder trechos do mapa. **Revelar última área** desfaz a última cobertura; **Revelar tudo** limpa as áreas cobertas.
5. Clique **Exibir para os jogadores**. A publicação e a troca de cena ocorrem juntas. A opção **Prévia dos jogadores** permite conferir o cenário ativo, sem tokens ocultos ou cobertos.

Jogadores podem colocar o próprio personagem numa área já revelada. Arraste um token ou selecione-o e use as setas. O mestre pode pausar a movimentação. A régua mede a distância em metros, usando quadrados de 1,5 m. A rodada exibida vem do combate existente; a mesa não cria uma segunda ordem de iniciativa.

## Navegação e salas

A roda do mouse aplica zoom de 50% a 400%, mantendo o ponto sob o cursor. Arrastar o fundo com **Mover** desloca o mapa; o botão do meio funciona também com outras ferramentas. **Centralizar** recupera o enquadramento completo. Arrastar um token e desenhar áreas continuam sendo gestos separados. A câmera do mestre é restaurada ao sair da prévia dos jogadores.

**Marcar sala** cria uma área retangular e ativa a visão por salas. O centro de um token do tipo **Personagem**, visível, com jogador definido e fora de cobertura manual abre a sala para o grupo. O último personagem a sair cobre a sala novamente. NPCs e ameaças não abrem salas. Áreas não marcadas podem ser usadas como corredores visíveis; as marcações não podem se sobrepor.

O pacote prioriza cenários próprios para os ambientes importantes, incluindo o arquivo GhostNet, a clínica auxiliar e o arquivo da diretoria. Cada cenário começa como uma sala dedicada; remova essa marcação para subdividir o mapa. A cobertura é visual por áreas, sem cálculo de raios ou colisão com paredes. A imagem do mapa autorizado é recebida como arquivo completo; segredos relevantes devem usar cenários separados. Tokens fora da visão são filtrados também pelo banco.

**Marcar entrada** define onde chegam novos personagens. O pacote traz entradas posicionadas nos acessos. Para transformar uma peça existente em observador, escolha **Tipo do token → Personagem** e defina **Controlado por**. A escolha da ilustração sozinha não muda o tipo da peça.

## Persistência e acesso

- Cenas, sala ativa e tokens ficam no Supabase, separados por missão. A versão de cada linha evita sobrescrever uma alteração simultânea da mesma peça.
- Somente mestres e administradores preparam/publicam cenas, gerenciam imagens, alteram a visibilidade ou controlam qualquer token. Jogadores podem mover apenas peças que lhes foram atribuídas, no cenário ativo e com movimento liberado.
- As políticas RLS excluem cenas não publicadas, inimigos ocultos e peças sob cobertura das consultas dos jogadores. Não se trata de apenas esconder elementos na tela.
- Uploads usam o bucket privado `asa-tabletop`. O acesso às imagens acompanha as referências liberadas da cena e dos tokens. URLs assinadas duram 15 minutos; uma imagem já vista não pode ser retirada da memória ou cache de quem a recebeu.
- As artes v6 ficam nos arquivos da função `api/tabletop-art.js`, fora do diretório público e do bundle do cliente. Cada imagem exige JWT e uma consulta a `asa_tabletop_assets` sob RLS. O catálogo completo exige mestre com acesso à missão. A função usa chave publicável e o JWT do solicitante, sem chave de serviço. As miniaturas carregam ao entrar na tela, com cache e limite de quatro downloads simultâneos.
- O cálculo de ocupação usa um helper restrito ao schema não exposto `asa_private`, com verificação de identidade e acesso à missão, para evitar recursão da RLS de tokens. As funções públicas novas usam `SECURITY INVOKER`; a importação exige mestre e valida a missão dos vínculos de imagem.
- Realtime sinaliza mudanças e os clientes relêem os dados sob RLS. Broadcast transmite somente um aviso vazio de atualização. Uma reconciliação periódica recupera eventos perdidos e alterações de visibilidade.

## Validação

Os testes usam React Testing Library e Postgres local via PGlite. Cobrem isolamento entre missões, nomes e imagens ocultos, áreas cobertas, movimento por dono, bloqueio de alterações em campos privilegiados, limites do mapa, publicação atômica, versões concorrentes, bucket privado e acesso de mestre sem ficha pessoal.

A migração base está em `supabase/migrations/20261029205625_virtual_tabletop.sql`; a extensão de salas e catálogo está em `supabase/migrations/20261030031756_tabletop_room_vision.sql`, com versão alinhada à migração aplicada pelo MCP. As regras especiais e os atributos das fichas existentes não foram modificados. A biblioteca v6 é instalada na missão escolhida pelo mestre; as artes não são incorporadas ao bundle público do navegador.

Referências de implementação: [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes), [Storage privado](https://supabase.com/docs/guides/storage/buckets/fundamentals), [controle de acesso do Storage](https://supabase.com/docs/guides/storage/security/access-control) e [arquivos em funções Vercel](https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions).
