# Combate junto ao mapa

A coluna esquerda reúne o mapa, as ferramentas logo abaixo dele, as opções da
cena, os tokens e a preparação. A lateral direita fica reservada ao combate,
com rolagem independente. Em telas pequenas, o combate vem logo depois do mapa,
seguido pelas opções e pela preparação.

As artes funcionam como miniaturas em pé: a base marca o espaço ocupado no chão,
e a imagem inteira se estende para cima, ancorada no centro dessa base. O controle
“Miniaturas” ajusta a escala visual desta visualização, inicialmente em 2,5×,
sem mudar posição, tamanho de ocupação, movimento ou visão por salas. O arrasto
pelo corpo mantém o ponto de apoio; a ordem de desenho usa a posição dos pés.

A aba Mesa recebe a mesma instância de `useMissionCombat` de `CharacterApp`.
Alternar para Combate não recria a assinatura; a missão continua sendo a unidade
persistente. O painel não possui um segundo motor nem cria participantes pelo mapa.

O painel permite entrar, finalizar o próprio turno e, para o mestre, encerrar o
turno corrente e avançar após todos agirem. A gaveta “Ações e ficha na mesa”
renderiza os mesmos controles das abas de recursos, habilidades, perícias,
rituais, inventário e direção do combate. Não adiciona novas regras de dados,
movimento ou gasto de ações. Um ritual só desconta PE depois da confirmação do
log; respostas antigas não alteram os recursos de outro personagem.

## Identidade e apresentação

- O JOIN continua passando `characterId` e `userId` à RPC que valida propriedade,
  missão e permissões no servidor. A seleção no mapa não troca esse ator.
- O contrato atual não persiste o characterId do jogador no participante. Nesse
  caso, somente um token de personagem com owner_id correspondente pode receber
  destaque. Se houver múltiplos tokens, não há escolha automática, mesmo que um
  deles esteja oculto. Com characterId explícito, a correspondência é por esse ID.
- NPCs usam IDs sintéticos e não possuem vínculo seguro com tokens no contrato
  atual. Não são associados por nome. A visão de jogador/prévia omite esses
  participantes; a visão de mestre conserva a ordem completa.
- Logs legados são texto livre, sem campo de audiência. A visão de jogador/prévia
  exibe apenas entradas de autores identificados como participantes jogadores e
  omite textos que mencionam nomes de NPCs da lista. Prosa de mestre/sistema/NPC
  fica na visão de mestre. É uma projeção conservadora de apresentação, não uma
  nova fronteira de autorização: o RLS existente segue concedendo leitura do
  combate e de logs por missão. Privacidade de campos no transporte exigiria
  outro contrato de backend, fora desta mudança.
- O histórico começa nas 100 entradas mais recentes desde o reset e pode carregar
  páginas anteriores sob demanda. O painel exibe quatro entradas ao recolher.

## Concorrência e mapa

Requisições usam a versão persistida. Conflitos 40001 atualizam o estado e exigem
nova tentativa explícita. Travas síncronas evitam cliques duplicados; pendência,
falha e conexão têm estados visíveis. Cada seleção de missão possui um escopo
próprio, de modo que respostas antigas, inclusive erros e finally, não alteram
ou destravam a missão seguinte. Reset invalida histórico e inserções pendentes
na apresentação.

O SVG é memoizado e callbacks estáveis encaminham para a versão atual do handler;
editar a ficha não recalcula os tokens. A mesa conserva viewport, zoom no cursor,
pan, régua, PNG transparente, salas, fog, spawn e restauração da prévia. Localizar
um participante apenas seleciona/centraliza um token visível autorizado; não
move tokens, não gasta ações e não muda o personagem selecionado.

## Validação e limites

- Testes novos exercitam App/CharacterApp reais com o hook real, usando fronteiras
  Supabase simuladas: identidade no JOIN, troca de abas, invalidação Realtime,
  ação de habilidade dentro da mesa, recusa de gravação e ausência de falso sucesso.
- Testes de painel/hook cobrem mestre/jogador/prévia, turno alheio, pendência,
  erro, conflitos, troca de missão com resposta atrasada, histórico paginado,
  reset, tokens ocultos/ambíguos e preservação de pan/zoom/seleção.
- A suíte existente de SQL/RLS roda em PGlite com os papéis do banco; não equivale
  a um teste autenticado de duas sessões reais de produção.
- Inspeção somente de leitura no Supabase conectado confirmou a RPC vigente,
  RLS ativo em asa_combat_state, asa_combat_log e asa_tabletop_tokens, políticas
  de missão/autoria e a identificação da Operação Aurora. Nenhuma migração,
  alteração de cena ou escrita em missões foi executada nesta tarefa.
- A prévia de navegador chegou à tela de login. Não houve teste visual autenticado
  nem E2E com dois navegadores/sessões de produção. Não foram produzidas capturas
  como evidência visual.
- O executor de nuvem foi interrompido e recuperado durante o trabalho; os arquivos
  foram preservados. O terminal não tinha credenciais de push; a publicação usa
  o conector GitHub da conta Alejunior26, sem credenciais locais do Windows.
