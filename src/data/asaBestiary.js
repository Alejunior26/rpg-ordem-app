// Fichas autorais v6. Exportadas de LIVRO/Campanha_Fonte/bestiary.py.
// Condições conferidas no exemplar de Ordem Paranormal RPG 1.3 da mesa.
export const asaBestiary = [
  {
    "id": "drone-beija-flor-asa",
    "code": "A01",
    "name": "Drone Beija-Flor A.S.A.",
    "vd": 10,
    "type": "Tecnologia / sintético / Pequeno",
    "defense": "17",
    "hp": "24 | 12 machucado",
    "senses": "Percepção 2d20+5; Iniciativa 2d20+5; câmera em alcance médio",
    "resistances": "Fortitude 1d20+5 / Reflexos 2d20+5 / Vontade 1d20+0 | RD: Balístico e impacto 2; sem vulnerabilidade paranormal automática",
    "vulnerabilities": "Somente as fraquezas e contramedidas explicitadas nos traços e nas ações.",
    "traits": [
      "Uplink. Depois de três turnos completos transmitindo uma violação, Alerta +1, uma vez por incidente. O primeiro turno é visivelmente sinalizado por luz âmbar. Tecnologia DT 15 com acesso ao painel, isolar o rádio ou interromper linha de transmissão impede a contagem. Não tem poderes para ler mente.",
      "Condução: Prefere marcação e retirada. Os dados de câmera são prova de rotina, não uma solução para o mistério. Pode ser capturado intacto ao perder energia. Ataca no máximo uma pessoa por turno e nunca recebe área de dano mental por ser eletrônico.",
      "Presença Perturbadora: Não possui.",
      "Ameaça autoral v6. Não usa bloqueio, esquiva ou contra-ataque de personagem; suas defesas já estão calculadas. Os valores exibidos são do perfil Padrão; ajustes Contido/Intenso seguem o livro da campanha."
    ],
    "actions": [
      {
        "name": "Microtaser",
        "type": "Padrão",
        "text": "Um alvo visível a até 9 m. Ataque 2d20+5 contra Defesa; acerto causa 1d6+2 de eletricidade. Após o acerto, o alvo testa Fortitude DT 14: falha aplica Lento até o fim do próximo turno dele; sucesso evita Lento, mas não o dano do ataque. Um ataque por ação.",
        "condition_ids": [
          "lento"
        ]
      },
      {
        "name": "Subir ao abrigo",
        "type": "Movimento",
        "text": "Voa até 9 m para uma posição acessível. Só recebe cobertura se o cenário realmente bloquear ataques; essa ação não concede imunidade a reações nem atravessa paredes.",
        "condition_ids": []
      }
    ],
    "rulesVersion": 6
  },
  {
    "id": "agente-contencao-asa",
    "code": "A02",
    "name": "Agente de Contenção A.S.A.",
    "vd": 20,
    "type": "Mundano / humano / Médio",
    "defense": "18",
    "hp": "40 | 20 machucado",
    "senses": "Percepção 2d20+5; Iniciativa 2d20+5",
    "resistances": "Fortitude 2d20+5 / Reflexos 2d20+5 / Vontade 1d20+5 | RD: Balístico 2; proteção física não é resistência a todo tipo de dano",
    "vulnerabilities": "Somente as fraquezas e contramedidas explicitadas nos traços e nas ações.",
    "traits": [
      "Dupla de serviço. Próximo de outro agente consciente, pode usar ação de movimento para cobrir sua retirada, concedendo +2 Defesa contra o próximo ataque apenas. Lealdade não é imunidade a medo; rendição e negociação são possíveis. SAN para efeitos dirigidos a humanos: 16, valor próprio de campanha; não recebe imunidade mental de criatura.",
      "Condução: Tenta separar testemunhas de equipamento. Ao ficar machucado, procura cobertura e pede extração. Se perder o canal, busca um superior, não se torna combatente suicida. Alerta 4 não transforma todos os trabalhadores em executores sem critério.",
      "Presença Perturbadora: Não possui.",
      "Ameaça autoral v6. Não usa bloqueio, esquiva ou contra-ataque de personagem; suas defesas já estão calculadas. Os valores exibidos são do perfil Padrão; ajustes Contido/Intenso seguem o livro da campanha."
    ],
    "actions": [
      {
        "name": "Bastão",
        "type": "Padrão",
        "text": "Um alvo adjacente, a até 1,5 m. Ataque 2d20+5 contra Defesa; acerto causa 2d6+3 de impacto. Um ataque por ação. Para causar dano não letal com um bastão sem essa propriedade, o agente sofre -5 no teste; não há captura automática.",
        "condition_ids": []
      },
      {
        "name": "Disparo",
        "type": "Padrão",
        "text": "Um alvo visível a até 36 m. Ataque 2d20+5 contra Defesa; acerto causa 2d6+3 de dano balístico. Um ataque por ação. Cobertura e camuflagem são resolvidas normalmente.",
        "condition_ids": []
      },
      {
        "name": "Contenção",
        "type": "Padrão",
        "text": "Um alvo adjacente. Com uma mão livre, faz um teste de manobra 2d20+5 oposto ao teste de ataque corpo a corpo do alvo. Se vencer, aplica Agarrado; se perder, não agarra nem causa dano. A mão fica ocupada e arrastar o alvo reduz à metade o deslocamento do agente. O alvo pode gastar uma ação padrão para escapar vencendo outra manobra oposta; o agente pode soltá-lo como ação livre.",
        "condition_ids": [
          "agarrado"
        ]
      }
    ],
    "rulesVersion": 6
  },
  {
    "id": "especialista-ghostnet",
    "code": "A03",
    "name": "Especialista GhostNet",
    "vd": 30,
    "type": "Mundano / humano / Médio",
    "defense": "17",
    "hp": "45 | 22 machucado",
    "senses": "Percepção 3d20+5; Iniciativa 2d20+5",
    "resistances": "Fortitude 2d20+5 / Reflexos 2d20+5 / Vontade 3d20+5 | RD: Sem RD; equipamento pode oferecer cobertura",
    "vulnerabilities": "Somente as fraquezas e contramedidas explicitadas nos traços e nas ações.",
    "traits": [
      "Precisa de terminal e rede para operar remotamente. Tecnologia +10 em testes com 3d20 quando possui ferramentas e tempo. O operador não é uma consciência da rede nem conhece toda informação dos servidores. SAN para efeitos dirigidos a humanos: 20, valor próprio de campanha; não recebe imunidade mental de criatura.",
      "Condução: Não luta em corpo a corpo se houver rota de saída. Pode ser o operador cooperante de C15; nesse caso sua ficha mede risco quando ameaçado, não autoriza usá-lo como aliado descartável. Isolamento e conversa resolvem melhor que dano.",
      "Presença Perturbadora: Não possui.",
      "Ameaça autoral v6. Não usa bloqueio, esquiva ou contra-ataque de personagem; suas defesas já estão calculadas. Os valores exibidos são do perfil Padrão; ajustes Contido/Intenso seguem o livro da campanha."
    ],
    "actions": [
      {
        "name": "Arco de manutenção",
        "type": "Padrão",
        "text": "Um alvo visível a até 9 m, adjacente a um equipamento ligado que o especialista alcança pelo circuito. Ataque 3d20+5 contra Defesa; acerto causa 2d6 de eletricidade. Um ataque por ação; isolar o circuito impede essa opção.",
        "condition_ids": []
      },
      {
        "name": "Travar acesso",
        "type": "Padrão",
        "text": "Fecha uma porta monitorada visível a até 18 m, se o canal estiver ativo e o vão estiver livre. Não esmaga quem ocupa a passagem. A alavanca interna abre a porta com uma ação de movimento. Bloquear o canal ou desligar o painel impede novo fechamento remoto; a porta continua sendo um objeto físico.",
        "condition_ids": []
      },
      {
        "name": "Solicitar alerta",
        "type": "Completa",
        "text": "Se o canal estiver disponível ao concluir a ação, Alerta +1, no máximo uma vez pelo mesmo incidente. Cortar o canal antes do turno do especialista impede o uso. Não produz dano ou condição e não aumenta o Alerta apenas por continuar em combate.",
        "condition_ids": []
      }
    ],
    "rulesVersion": 6
  },
  {
    "id": "contaminado-pelo-chiado",
    "code": "A04",
    "name": "Contaminado pelo Chiado",
    "vd": 10,
    "type": "Humano contaminado / estágio 1 / Médio",
    "defense": "14",
    "hp": "30 | 15 machucado",
    "senses": "Percepção 1d20+5; Iniciativa 1d20+5",
    "resistances": "Fortitude 2d20+5 / Reflexos 1d20+5 / Vontade 1d20+5 | RD: Nenhuma; não adquire vulnerabilidade elemental por estar doente",
    "vulnerabilities": "Somente as fraquezas e contramedidas explicitadas nos traços e nas ações.",
    "traits": [
      "Recuperável. Três sucessos de estabilização descritos em C06 encerram a agressão. Cada abordagem concreta de lembrança familiar pode fornecer um sucesso sem teste, uma vez; Medicina ou Tecnologia DT 15 oferecem outros. Falhar custa tempo e materiais, não torna a pessoa irreversível sem novos acontecimentos. SAN para efeitos dirigidos a humanos: 14, valor próprio de campanha; não recebe imunidade mental de criatura.",
      "Condução: Usar como resgate sob pressão. Não impor Presença Perturbadora de criatura ou dano mental em área. Não utilizar o total de PV como medidor de quanto de consciência resta. Uma vítima a 0 PV necessita socorro conforme a edição adotada; não vira monstro automaticamente.",
      "Presença Perturbadora: Não possui; ainda humano.",
      "Ameaça autoral v6. Não usa bloqueio, esquiva ou contra-ataque de personagem; suas defesas já estão calculadas. Os valores exibidos são do perfil Padrão; ajustes Contido/Intenso seguem o livro da campanha."
    ],
    "actions": [
      {
        "name": "Espasmo",
        "type": "Padrão",
        "text": "Um alvo adjacente, a até 1,5 m. Ataque 2d20+5 contra Defesa; acerto causa 1d6+2 de impacto. Um ataque por ação. O contaminado reage à fonte do ruído; não escolhe automaticamente o personagem com menos PV.",
        "condition_ids": []
      },
      {
        "name": "Recuo",
        "type": "Movimento",
        "text": "Move até 6 m em direção a uma saída silenciosa que consiga perceber. Não atravessa obstáculos e não recebe ação de ataque adicional.",
        "condition_ids": []
      }
    ],
    "rulesVersion": 6
  },
  {
    "id": "portador-do-chiado",
    "code": "A05",
    "name": "Portador do Chiado",
    "vd": 40,
    "type": "Energia / influência de Conhecimento / Médio / Criatura",
    "defense": "19",
    "hp": "70 | 35 machucado",
    "senses": "Percepção 3d20+5; Iniciativa 3d20+5; aparelhos ligados percebidos a 9 m",
    "resistances": "Fortitude 2d20+10 / Reflexos 3d20+5 / Vontade 2d20+5 | RD: Energia 5; vulnerável a Conhecimento (dano dobrado)",
    "vulnerabilities": "Conhecimento (dano dobrado)",
    "traits": [
      "Origem Paranormal. Sem SAN, imune a dano mental e condições mentais e de medo, conforme referência fornecida. Memória residual. Uma lembrança verificável interrompe sua próxima ação ofensiva, uma vez por cena, sem controle permanente. Casos com atividade humana variável podem ser recuperáveis pelos procedimentos de C22; o diagnóstico precede a promessa.",
      "Condução: Movimenta-se para o aparelho mais próximo. Desligar fontes cria rota de fuga. Não concentre dano no mesmo personagem NEX 10% só para provar perigo. Os pacientes recuperáveis devem ter sinais distintos dos estágios irreversíveis.",
      "Origem Paranormal: sem SAN; imune a dano mental, condições mentais e de medo e rituais de Medo (Ordem 1.3, p. 180).",
      "Presença Perturbadora: DT 16 / 2d6 mental / imune a partir de NEX 35%. Vontade: sucesso causa metade do dano, arredondada para baixo. Com várias criaturas na cena, use a presença da de maior VD e +1d6 por criatura adicional; humanos, drones e nós sem ficha não contam.",
      "Ameaça autoral v6. Não usa bloqueio, esquiva ou contra-ataque de personagem; suas defesas já estão calculadas. Os valores exibidos são do perfil Padrão; ajustes Contido/Intenso seguem o livro da campanha."
    ],
    "actions": [
      {
        "name": "Golpe espasmódico",
        "type": "Padrão",
        "text": "Um alvo adjacente, a até 1,5 m. Ataque 3d20+10 contra Defesa; acerto causa 2d6+4 de impacto e 1d4 de Energia. Resolva os dois tipos de dano separadamente. Um ataque por ação.",
        "condition_ids": []
      },
      {
        "name": "Chiado",
        "type": "Padrão",
        "text": "Um alvo percebido a até 9 m, sem barreira sólida no caminho. Vontade DT 16: falha causa 2d6 de dano mental e Frustrado até o fim do próximo turno do alvo; sucesso causa metade do dano, arredondada para baixo, e evita a condição. O Portador não pode usar Chiado em turnos consecutivos. Imunidade mental impede os componentes correspondentes.",
        "condition_ids": [
          "frustrado"
        ]
      }
    ],
    "rulesVersion": 6
  },
  {
    "id": "portador-operacional",
    "code": "A06",
    "name": "Portador Operacional",
    "vd": 60,
    "type": "Energia / rotina motora preservada / Médio / Criatura",
    "defense": "20",
    "hp": "95 | 47 machucado",
    "senses": "Percepção 2d20+10; Iniciativa 3d20+10",
    "resistances": "Fortitude 3d20+10 / Reflexos 3d20+10 / Vontade 2d20+10 | RD: Energia 5 e impacto 3; vulnerável a Conhecimento",
    "vulnerabilities": "Conhecimento",
    "traits": [
      "Origem Paranormal. A rotina prévia pode ser interrompida ao apresentar uma ordem de serviço com o mesmo objeto. Isso suspende uma ação, uma vez por cena. A persistência de habilidade profissional não demonstra, sozinha, consciência recuperável.",
      "Condução: Protege seu posto até o grupo romper a sequência ou retirar o equipamento. Uma aproximação pelo lado que sua profissão não vigiava concede caminho de evasão. Não use “tático” como permissão para conhecer estratégias que o antigo trabalhador nunca aprendeu.",
      "Origem Paranormal: sem SAN; imune a dano mental, condições mentais e de medo e rituais de Medo (Ordem 1.3, p. 180).",
      "Presença Perturbadora: DT 17 / 2d6 mental / NEX 40%+ imune. Vontade: sucesso causa metade do dano, arredondada para baixo. Com várias criaturas na cena, use a presença da de maior VD e +1d6 por criatura adicional; humanos, drones e nós sem ficha não contam.",
      "Ameaça autoral v6. Não usa bloqueio, esquiva ou contra-ataque de personagem; suas defesas já estão calculadas. Os valores exibidos são do perfil Padrão; ajustes Contido/Intenso seguem o livro da campanha."
    ],
    "actions": [
      {
        "name": "Ferramenta de serviço",
        "type": "Padrão",
        "text": "Um alvo adjacente, a até 1,5 m. Ataque 3d20+10 contra Defesa; acerto causa 2d8+4 de corte. Um ataque por ação; não aplica Sangrando ou Agarrado automaticamente.",
        "condition_ids": []
      },
      {
        "name": "Rota conhecida",
        "type": "Movimento",
        "text": "Move até 9 m usando uma passagem técnica adjacente e fisicamente livre. Precisa caber na passagem. Não teleporta, atravessa paredes nem ignora portas fechadas.",
        "condition_ids": []
      },
      {
        "name": "Repetir tarefa",
        "type": "Completa",
        "text": "Aciona um comando de serviço adjacente e ligado, fechando uma porta ou religando um único circuito indicado pelo cenário. A porta só fecha com o vão livre e sua alavanca local permanece utilizável com uma ação de movimento. Desligar o posto ou apresentar a ordem de serviço pertinente interrompe a rotina conforme sua habilidade.",
        "condition_ids": []
      }
    ],
    "rulesVersion": 6
  },
  {
    "id": "eco-do-chiado",
    "code": "A07",
    "name": "Eco do Chiado",
    "vd": 40,
    "type": "Energia e Conhecimento / resíduo de transmissão / Médio / Criatura",
    "defense": "18",
    "hp": "55 | 27 machucado",
    "senses": "Percepção 3d20+10; Iniciativa 2d20+10; som a 18 m",
    "resistances": "Fortitude 2d20+5 / Reflexos 2d20+10 / Vontade 3d20+10 | RD: Energia 5; não é incorpóreo; vulnerável a Conhecimento",
    "vulnerabilities": "Conhecimento",
    "traits": [
      "Origem Paranormal. Não tem biografia humana própria recuperável; surge como manifestação ligada a registros. Desligar duas fontes conectadas remove seu salto e revela seu núcleo físico. Não é cópia independente de Josh.",
      "Condução: Use som e localização, não dano contínuo a todos. A ausência de SAN impede uma “disputa mental” contra ele; o grupo atua nos alto-falantes, nos cabos e na fuga. Uma gravação pode atraí-lo para uma câmara vazia.",
      "Origem Paranormal: sem SAN; imune a dano mental, condições mentais e de medo e rituais de Medo (Ordem 1.3, p. 180).",
      "Presença Perturbadora: DT 17 / 2d6 mental / NEX 40%+ imune. Vontade: sucesso causa metade do dano, arredondada para baixo. Com várias criaturas na cena, use a presença da de maior VD e +1d6 por criatura adicional; humanos, drones e nós sem ficha não contam.",
      "Ameaça autoral v6. Não usa bloqueio, esquiva ou contra-ataque de personagem; suas defesas já estão calculadas. Os valores exibidos são do perfil Padrão; ajustes Contido/Intenso seguem o livro da campanha."
    ],
    "actions": [
      {
        "name": "Ressonância",
        "type": "Padrão",
        "text": "Um alvo visível a até 18 m, adjacente a uma fonte sonora conectada. Ataque 2d20+10 contra Defesa; acerto causa 2d6 de Energia. Após o acerto, Fortitude DT 17: falha aplica Surdo até o fim do próximo turno do alvo; sucesso evita Surdo, mas não o dano. Desligar a fonte impede esse ataque por ela.",
        "condition_ids": [
          "surdo"
        ]
      },
      {
        "name": "Salto de retorno",
        "type": "Movimento",
        "text": "Desloca-se entre dois alto-falantes ligados e conectados por cabos, separados por até 9 m. A saída precisa comportar seu corpo. Isolar o setor ou desligar uma das fontes impede o salto; não é passagem livre através de qualquer parede.",
        "condition_ids": []
      },
      {
        "name": "Repetição",
        "type": "Padrão",
        "text": "Reproduz uma frase já ouvida. É uma imitação sonora, sem teste compulsório: não aplica Fascinado, Confuso, controle mental ou obrigação de responder.",
        "condition_ids": []
      }
    ],
    "rulesVersion": 6
  },
  {
    "id": "portador-ruina",
    "code": "A08",
    "name": "Portador Ruína",
    "vd": 80,
    "type": "Energia / estágio irreversível / Grande / Criatura",
    "defense": "22",
    "hp": "130 | 65 machucado",
    "senses": "Percepção 3d20+10; Iniciativa 2d20+10; Percepção às Cegas (vibração) 9 m",
    "resistances": "Fortitude 4d20+10 / Reflexos 2d20+10 / Vontade 3d20+10 | RD: Impacto e corte 5; Energia 10; vulnerável a Conhecimento",
    "vulnerabilities": "Conhecimento",
    "traits": [
      "Origem Paranormal. Irreversível. Isolamento confirma ausência de atividade autônoma; não existe teste secreto capaz de curá-lo. Um alimentador ligado concede RD adicional 3, removida ao desligar o equipamento, sem regeneração infinita.",
      "Condução: Sua força é ocupar espaço e impedir passagem. O mestre deve mostrar o cone antes da descarga. Marcos só usa esta ficha se a cena exigir confronto; a equipe pode desconectar o nó e preservar seu corpo sem vencê-lo por dano.",
      "Origem Paranormal: sem SAN; imune a dano mental, condições mentais e de medo e rituais de Medo (Ordem 1.3, p. 180).",
      "Presença Perturbadora: DT 19 / 3d6 mental / NEX 45%+ imune. Vontade: sucesso causa metade do dano, arredondada para baixo. Com várias criaturas na cena, use a presença da de maior VD e +1d6 por criatura adicional; humanos, drones e nós sem ficha não contam.",
      "Ameaça autoral v6. Não usa bloqueio, esquiva ou contra-ataque de personagem; suas defesas já estão calculadas. Os valores exibidos são do perfil Padrão; ajustes Contido/Intenso seguem o livro da campanha."
    ],
    "actions": [
      {
        "name": "Golpe de cabo",
        "type": "Padrão",
        "text": "Um alvo a até 1,5 m da borda de sua base de 2 x 2 quadrados. Ataque 4d20+10 contra Defesa; acerto causa 3d6+6 de impacto. Um ataque por ação.",
        "condition_ids": []
      },
      {
        "name": "Onda de Sincronia",
        "type": "Completa",
        "text": "Preparação: marque um cone fixo de 9 m a partir de sua base; o Ruína não causa dano nessa preparação. No próximo turno, precisa gastar uma ação padrão para descarregar: todos que ainda estiverem no cone e com caminho livre até a origem testam Reflexos DT 18. Falha: 3d6 de Energia e Surdo até o fim do próximo turno do alvo. Sucesso: metade do dano, arredondada para baixo, sem Surdo. Não pode mudar o cone nem fazer outro ataque ofensivo no turno da descarga. Se sair da origem marcada, se o alimentador for desligado ou se for impedido de executar a ação, a preparação se perde. O ataque pode ferir outros ocupantes; não escolhe só jogadores.",
        "condition_ids": [
          "surdo"
        ]
      }
    ],
    "rulesVersion": 6
  },
  {
    "id": "colmeia-do-chiado",
    "code": "A09",
    "name": "Colmeia do Chiado",
    "vd": 100,
    "type": "Conhecimento e Energia / estrutura de receptores / Grande / Criatura",
    "defense": "20",
    "hp": "180 | 90 machucado",
    "senses": "Percepção 4d20+10; Iniciativa 1d20+5; sensores a 18 m",
    "resistances": "Fortitude 4d20+10 / Reflexos 1d20+5 / Vontade 4d20+10 | RD: Energia 10; físico 5 enquanto dois nós ativos; sem vulnerabilidade automática de humano conectado",
    "vulnerabilities": "Somente as fraquezas e contramedidas explicitadas nos traços e nas ações.",
    "traits": [
      "Origem Paranormal. Quatro nós de função, não quatro criaturas adicionais. Cada nó isolado reduz o alcance em 3 m, mínimo 3 m. Dois isolados removem a RD física. Quatro encerram a atividade, mesmo com PV. Procedimentos clínicos de C24 preservam vítimas; destruir um nó com paciente mata aquele paciente e deve ser anunciado.",
      "Condução: A estrutura não se move para bloquear saída. Não recebe ação gratuita de cada Portador da sala. Se houver outra criatura, conte seu VD e sua própria iniciativa, aplicando a regra de múltiplas Presenças somente quando cabível, sem somar quatro nós como criaturas.",
      "Origem Paranormal: sem SAN; imune a dano mental, condições mentais e de medo e rituais de Medo (Ordem 1.3, p. 180).",
      "Presença Perturbadora: DT 19 / 3d6 mental / NEX 50%+ imune. Vontade: sucesso causa metade do dano, arredondada para baixo. Com várias criaturas na cena, use a presença da de maior VD e +1d6 por criatura adicional; humanos, drones e nós sem ficha não contam.",
      "Ameaça autoral v6. Não usa bloqueio, esquiva ou contra-ataque de personagem; suas defesas já estão calculadas. Os valores exibidos são do perfil Padrão; ajustes Contido/Intenso seguem o livro da campanha."
    ],
    "actions": [
      {
        "name": "Descarga de nó",
        "type": "Padrão",
        "text": "Um alvo visível, junto de um nó ativo e a até 18 m do núcleo. Ataque 3d20+10 contra Defesa; acerto causa 3d6 de Energia. O alcance cai 3 m por nó isolado, mínimo 3 m. Um ataque por ação, não um ataque por nó.",
        "condition_ids": []
      },
      {
        "name": "Coro de pressão",
        "type": "Completa",
        "text": "Todos os seres com SAN em um raio de 9 m, sem barreira sólida entre eles e o núcleo, testam Vontade DT 18. Falha: 2d6 de dano mental e Abalado até o fim do próximo turno do alvo. Sucesso: metade do dano, arredondada para baixo, sem Abalado. A Colmeia não usa essa ação em turnos consecutivos. Desligar todos os nós encerra a atividade antes de qualquer novo uso. As vítimas ligadas aos nós também são seres; o risco deve ser anunciado.",
        "condition_ids": [
          "abalado"
        ]
      }
    ],
    "rulesVersion": 6
  },
  {
    "id": "katia-moura",
    "code": "A10",
    "name": "Kátia Moura",
    "vd": 80,
    "type": "Mundana / humana / Médio / comando",
    "defense": "23",
    "hp": "120 | 60 machucado",
    "senses": "Percepção 3d20+10; Iniciativa 4d20+10",
    "resistances": "Fortitude 3d20+10 / Reflexos 4d20+10 / Vontade 3d20+10 | RD: Balístico 5 por proteção; não recebe imunidade mental de criatura",
    "vulnerabilities": "Somente as fraquezas e contramedidas explicitadas nos traços e nas ações.",
    "traits": [
      "Humana. Possui SAN conforme necessidade de cena da edição adotada, sem conversão automática de PV em SAN. Sua ficha não concede poderes paranormais. Rastreio depende de câmeras, matrículas ou testemunhas. Ao ficar machucada (60 PV ou menos), prioriza retirada. SAN para efeitos dirigidos a humanos: 40, valor próprio de campanha; não recebe imunidade mental de criatura.",
      "Condução: Dispara para abrir espaço, recuperar provas ou permitir evacuação de subordinados. Pode render-se ou negociar diante de prova incontestável. Não repõe reforços depois de perder o canal. Não use a antiga “Presença de Comando com imunidade por NEX” como efeito de criatura.",
      "Presença Perturbadora: Não possui. Autoridade e intimidação não são Presença Perturbadora.",
      "Ameaça autoral v6. Não usa bloqueio, esquiva ou contra-ataque de personagem; suas defesas já estão calculadas. Os valores exibidos são do perfil Padrão; ajustes Contido/Intenso seguem o livro da campanha."
    ],
    "actions": [
      {
        "name": "Disparo dirigido",
        "type": "Padrão",
        "text": "Um alvo visível a até 36 m. Ataque 4d20+10 contra Defesa; acerto causa 3d6+4 de dano balístico. Um ataque por ação.",
        "condition_ids": []
      },
      {
        "name": "Lâmina",
        "type": "Padrão",
        "text": "Um alvo adjacente, a até 1,5 m. Ataque 3d20+10 contra Defesa; acerto causa 2d6+4 de corte. Um ataque por ação.",
        "condition_ids": []
      },
      {
        "name": "Comando",
        "type": "Movimento",
        "text": "Uma vez por rodada, um aliado humano voluntário que a ouça a até 9 m pode usar uma reação para mover até 6 m por uma rota legal. Não concede ataque, não comanda criaturas e não move alguém incapaz de reagir.",
        "condition_ids": []
      },
      {
        "name": "Extração",
        "type": "Completa",
        "text": "Uma vez por cena, solicita a equipe de extração que o mestre já incluiu no encontro. Só funciona com canal e rota disponíveis. A chegada acontece três rodadas depois, antes do turno de Kátia: solicitação na rodada 1, chegada na rodada 4. A composição precisa ser anunciada e seu VD contado antes da cena; esta ação não cria tropas. Sem equipe preparada, permite apenas pedir transporte ou negociar retirada.",
        "condition_ids": []
      }
    ],
    "rulesVersion": 6
  },
  {
    "id": "maestro",
    "code": "A11",
    "name": "Maestro / primeiro confronto",
    "vd": 120,
    "type": "Humano paranormal / identidade oculta / Médio",
    "defense": "24",
    "hp": "180 | 90 machucado",
    "senses": "Percepção 4d20+10; Iniciativa 3d20+10; Percepção às Cegas 9 m somente enquanto um relé estiver ativo",
    "resistances": "Fortitude 3d20+10 / Reflexos 3d20+10 / Vontade 4d20+10 | RD: Energia 5; RD física 4 enquanto ambos os relés estiverem ativos",
    "vulnerabilities": "Somente as fraquezas e contramedidas explicitadas nos traços e nas ações.",
    "traits": [
      "Compasso I a IV. Avance um compasso por rodada; no IV, precisa partir fisicamente para cumprir a agenda de C17. A 0 PV, a contenção do ensaio rompe, forçando retirada e perda do objetivo. Os 180 PV representam essa proteção, visível nos relés, sem cura de fase. Isso não derrota a forma posterior. Humano paranormal: SAN 50, valor próprio da campanha, sem imunidade mental de criatura. Sua identidade permanece oculta até a revelação prevista.",
      "Condução: Fechar o Palco ocupa a ação completa, sem ataque normal nesse turno. E05 tem apenas o Maestro; os relés sustentam seus sensores de 9 m. A retirada usa saídas físicas. Preserve a identidade de Josh antes do Auditório.",
      "Presença Perturbadora: Não possui PP de criatura nesta fase; o terror é a ação do sinal.",
      "Ameaça autoral v6. Não usa bloqueio, esquiva ou contra-ataque de personagem; suas defesas já estão calculadas. Os valores exibidos são do perfil Padrão; ajustes Contido/Intenso seguem o livro da campanha."
    ],
    "actions": [
      {
        "name": "Corrente de sinal",
        "type": "Padrão",
        "text": "Um alvo visível a até 18 m, conectado ao mesmo circuito por um condutor visível. Ataque 3d20+10 contra Defesa; acerto causa 2d8+4 de Energia. Um ataque por ação. Romper o condutor ou isolar o relé impede essa ligação; possuir um implante desligado não basta para ser alvo.",
        "condition_ids": []
      },
      {
        "name": "Nota Impossível",
        "type": "Padrão",
        "text": "Um alvo percebido a até 9 m, com caminho livre até ele. Vontade DT 20: falha causa 2d6 de dano mental e Frustrado até o fim do próximo turno do alvo; sucesso causa metade do dano, arredondada para baixo, sem Frustrado. A condição representa a interferência nas decisões e na concentração do alvo.",
        "condition_ids": [
          "frustrado"
        ]
      },
      {
        "name": "Fechar o Palco",
        "type": "Completa",
        "text": "Uma vez por cena, com ao menos um relé ativo, afeta somente a sala atual, até 18 m: fecha as portas motorizadas com o vão livre e apaga a iluminação fixa ligada à rede por 3 rodadas. Encerra imediatamente antes de seu turno três rodadas depois: se usada na rodada 1, termina antes de seu turno na rodada 4. Lanternas e luzes independentes continuam funcionando. Quem ficar em escuridão total e depender da visão recebe Cego; luz parcial aplica a camuflagem correspondente. O Maestro usa Percepção às Cegas apenas a até 9 m enquanto houver relé ativo; fora desse alcance também sofre pela falta de visão. Cada alavanca interna abre sua porta com uma ação de movimento. Num painel adjacente, ação padrão e Tecnologia DT 20 restaura as luzes; desligar ambos os relés encerra o efeito e libera as travas. Não causa dano, não atordoa e não convoca Portadores.",
        "condition_ids": [
          "cego"
        ]
      },
      {
        "name": "Desviar retorno",
        "type": "Reação",
        "text": "Uma vez por rodada, quando um relé ainda ativo sofrer dano, reduz esse dano em 5. A redução protege somente o relé atingido, não o Maestro; não impede desligamento por procedimento e não funciona após ambos os relés terem sido desativados.",
        "condition_ids": []
      }
    ],
    "rulesVersion": 6
  },
  {
    "id": "josh-regente-revelado",
    "code": "A12",
    "name": "Josh / regente revelado",
    "vd": 160,
    "type": "Humano paranormal / consciente / Médio",
    "defense": "24",
    "hp": "240 | 120 machucado",
    "senses": "Percepção 4d20+10; Iniciativa 4d20+10",
    "resistances": "Fortitude 3d20+10 / Reflexos 4d20+10 / Vontade 4d20+15 | RD: Energia 8; físico 4 enquanto acoplamento ativo",
    "vulnerabilities": "Somente as fraquezas e contramedidas explicitadas nos traços e nas ações.",
    "traits": [
      "Provas reduzem em 2 um ataque e uma DT por rodada, sem alterar “dados da DT”. Três circuitos rompidos e contenção de equipe vencem a regência; 0 PV também representa derrota real. As perdas permanecem após a posse. A entidade só assume em C30, quando a vitória já foi reconhecida. SAN para efeitos dirigidos a humanos: 60, valor próprio de campanha; não recebe imunidade mental de criatura. Memória imposta pode aplicar Confuso, uma condição mental oficial, por prazo explícito. Josh é humano nesta fase e não recebe imunidade mental automática.",
      "Condução: Mostre desprezo, cálculo e fragilidade sem culpar uma IA pelos crimes. Ele pode ser capturado; o segundo pacto continua consequência estabelecida. Use vulnerabilidades descobertas, não imunidades inventadas para alongar a cena.",
      "Presença Perturbadora: Sem PP automática de criatura; não empilhar PP do Diabo antes da posse.",
      "Ameaça autoral v6. Não usa bloqueio, esquiva ou contra-ataque de personagem; suas defesas já estão calculadas. Os valores exibidos são do perfil Padrão; ajustes Contido/Intenso seguem o livro da campanha."
    ],
    "actions": [
      {
        "name": "Acorde cortante",
        "type": "Padrão",
        "text": "Um alvo visível a até 9 m, sem barreira sólida. Ataque 4d20+10 contra Defesa; acerto causa 3d8+4 de Energia. Um ataque por ação.",
        "condition_ids": []
      },
      {
        "name": "Memória imposta",
        "type": "Padrão",
        "text": "Um alvo percebido a até 18 m, com caminho livre até ele. Vontade DT 22: falha causa 3d6 de dano mental e Confuso até o fim do próximo turno do alvo; sucesso causa metade do dano, arredondada para baixo, sem Confuso. Resolva a rolagem de Confuso no início do turno afetado; um resultado 6 encerra a condição antes do prazo. Não pode usar esta ação em turnos consecutivos.",
        "condition_ids": [
          "confuso"
        ]
      },
      {
        "name": "Solo",
        "type": "Completa",
        "text": "Preparação: marque uma faixa reta, fixa, de 9 m por 1,5 m no palco, com origem a até 9 m de Josh. No próximo turno, gastar uma ação padrão descarrega a faixa: ocupantes testam Reflexos DT 20. Falha causa 4d6 de Energia; sucesso causa metade, arredondada para baixo. Não executa outro ataque ofensivo nesse turno. Desligar o circuito do palco, ou impedi-lo de realizar a ação, cancela a preparação. A faixa não atravessa barreiras sólidas.",
        "condition_ids": []
      },
      {
        "name": "Amplificar",
        "type": "Reação",
        "text": "Uma vez por rodada, antes de resolver um ataque que o tenha como alvo, recebe +2 Defesa somente contra esse ataque, se o painel de voz estiver ativo. Desligar o painel remove esta opção. Não se acumula consigo mesma.",
        "condition_ids": []
      }
    ],
    "rulesVersion": 6
  },
  {
    "id": "diabo-no-corpo-de-josh",
    "code": "A13",
    "name": "Diabo no corpo de Josh",
    "vd": 240,
    "type": "Sangue e Conhecimento / manifestação ancorada / Médio / Criatura",
    "defense": "26",
    "hp": "420 | 210 machucado",
    "senses": "Percepção 5d20+15; Iniciativa 4d20+15",
    "resistances": "Fortitude 5d20+15 / Reflexos 4d20+10 / Vontade 5d20+15 | RD: RD 16, menos 4 por âncora rompida, mínimo 0; Defesa -1 por âncora",
    "vulnerabilities": "Somente as fraquezas e contramedidas explicitadas nos traços e nas ações.",
    "traits": [
      "Origem Paranormal. Reservas de PV: Hospedeiro 140, CORO 140, Revelado 140. Dano que atravessa uma reserva passa à próxima; transição não cura. Contido: total 270 em três reservas de 90, Defesa base 23, ataques 3d20+10, dano de corrente 2d8+4, demais DTs 18 e mental 2d6. Intenso: total 540 em reservas de 180, Defesa 28, ataques 5d20+15 e corrente 4d8+6. Âncoras e vitórias alternativas seguem C32-C34. Nenhum perfil é a ficha oficial da Relíquia: esta é uma manifestação limitada ao corpo e à infraestrutura da campanha. Uma transição por objetivo descarta os PV restantes da reserva anterior; não os transfere como cura para outra reserva.",
      "Condução: Ao romper BIO-MONITOR, desaparece a pressão automática sobre pacientes. Ao romper Contrato, perde a reação de fixação: antes disso, uma vez por rodada, pode reduzir em 5 um dano recebido se um suporte ainda estiver ativo. Três âncoras abrem fase final; quatro permitem desacoplamento em três ações. A última vontade de Josh remove RD e reação por uma janela descrita em C34, não a culpa.",
      "Origem Paranormal: sem SAN; imune a dano mental, condições mentais e de medo e rituais de Medo (Ordem 1.3, p. 180).",
      "Presença Perturbadora: Padrão DT 22 / 3d6 mental / NEX 60%+ imune. Contido DT 16 / 2d6; Intenso DT 24 / 4d6. Vontade: sucesso causa metade do dano, arredondada para baixo. Com várias criaturas na cena, use a presença da de maior VD e +1d6 por criatura adicional; humanos, drones e nós sem ficha não contam.",
      "Ameaça autoral v6. Não usa bloqueio, esquiva ou contra-ataque de personagem; suas defesas já estão calculadas. Os valores exibidos são do perfil Padrão; ajustes Contido/Intenso seguem o livro da campanha."
    ],
    "actions": [
      {
        "name": "Corrente do hospedeiro",
        "type": "Padrão",
        "text": "Um alvo percebido a até 9 m, sem barreira sólida. Ataque 4d20+15 contra Defesa; acerto causa 3d8+6 de Sangue. Um ataque por ação. No perfil Contido: 3d20+10 e 2d8+4; no Intenso: 5d20+15 e 4d8+6.",
        "condition_ids": []
      },
      {
        "name": "O CORO responde",
        "type": "Padrão",
        "text": "Um alvo percebido a até 18 m, sem barreira sólida. Vontade DT 22: falha causa 3d6 de dano mental e Esmorecido até o fim do próximo turno do alvo; sucesso causa metade do dano, arredondada para baixo, sem condição. Contido: DT 18 e 2d6 mental; Intenso mantém os valores padrão. Não usa em turnos consecutivos e perde a ação ao romper o Servidor GhostNet.",
        "condition_ids": [
          "esmorecido"
        ]
      },
      {
        "name": "Fechar o anel",
        "type": "Completa",
        "text": "Preparação: marque duas faixas fixas de 9 m por 1,5 m, com origem a até 9 m do hospedeiro. No próximo turno, gastar uma ação padrão descarrega ambas: cada ocupante testa Reflexos DT 20 e recebe 4d6 de Energia na falha ou metade no sucesso, arredondada para baixo. Contido: DT 18; Intenso mantém os valores padrão. Quem ocupar ambas as faixas só testa e sofre dano uma vez. Não há outro ataque ofensivo nesse turno. Romper a Antena, ou impedir a ação de descarga, cancela a preparação. Barreiras sólidas bloqueiam a descarga.",
        "condition_ids": []
      },
      {
        "name": "Fixação do contrato",
        "type": "Reação",
        "text": "Uma vez por rodada, ao receber dano, reduz esse dano em 5 se a âncora Contrato e ao menos um suporte ainda estiverem ativos. Romper Contrato ou abrir a janela de última vontade de C34 remove esta reação. É a reação de fixação citada nas fases; não é regeneração e não restaura reservas de PV.",
        "condition_ids": []
      }
    ],
    "rulesVersion": 6
  }
];
