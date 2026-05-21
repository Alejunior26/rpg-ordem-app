import { useAuth } from "./auth/AuthProvider";
import LoginPage from "./LoginPage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./lib/supabase";

const NEX_VALUES = [
  5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99,
];
const ATTR_KEYS = ["FOR", "AGI", "INT", "VIG", "PRE"];
const TRAINING_BONUS = {
  destreinado: 0,
  treinado: 5,
  veterano: 10,
  expert: 15,
};
const TRAINING_LABEL = {
  destreinado: "0",
  treinado: "5",
  veterano: "10",
  expert: "15",
};
const TRAINING_THEME = {
  destreinado: { text: "#8a8a8a", border: "#2f2f35", glow: "none" },
  treinado: {
    text: "#00f5d4",
    border: "#00f5d466",
    glow: "0 0 12px rgba(0,245,212,0.25)",
  },
  veterano: {
    text: "#ff4fd8",
    border: "#ff4fd866",
    glow: "0 0 12px rgba(255,79,216,0.25)",
  },
  expert: {
    text: "#ffd166",
    border: "#ffd16666",
    glow: "0 0 12px rgba(255,209,102,0.28)",
  },
  auto: {
    text: "#7c4dff",
    border: "#7c4dff88",
    glow: "0 0 14px rgba(124,77,255,0.32)",
  },
  normal: { text: "#ffffff", border: "#333333", glow: "none" },
};

const colors = {
  background: "#050507",
  surface: "rgba(17, 17, 21, 0.95)",
  brand: "#00e5ff",
  brandDark: "#003d44",
  pv: "#ff1744",
  san: "#9c27b0",
  pe: "#c5a000",
  text: "#e0e0e0",
  muted: "#8a8a8a",
  border: "rgba(0, 229, 255, 0.08)",
  glow: "0 0 10px rgba(0, 229, 255, 0.4)",
};

const MISSIONS_CATALOG = [
  "Operação Aurora",
  "Rastro no Outro Lado",
  "Confinamento 19",
  "Eco de Sangue",
];

const rulesByClass = {
  Combatente: {
    pvBase: 20,
    pvNivel: 4,
    peBase: 2,
    peNivel: 2,
    sanBase: 12,
    sanNivel: 3,
    fixedChoices: [
      { label: "Combate Base", options: ["Luta", "Pontaria"] },
      { label: "Resistência Base", options: ["Fortitude", "Reflexos"] },
    ],
    freeChoicesBase: 1,
    defaultTrilha: "Aniquilador",
  },
  Especialista: {
    pvBase: 16,
    pvNivel: 3,
    peBase: 3,
    peNivel: 3,
    sanBase: 16,
    sanNivel: 4,
    fixedChoices: [],
    freeChoicesBase: 7,
    defaultTrilha: "Atirador de Elite",
  },
  Ocultista: {
    pvBase: 12,
    pvNivel: 2,
    peBase: 4,
    peNivel: 4,
    sanBase: 20,
    sanNivel: 5,
    fixedChoices: [
      { label: "Treino Base 1", options: ["Ocultismo"] },
      { label: "Treino Base 2", options: ["Vontade"] },
    ],
    freeChoicesBase: 3,
    defaultTrilha: "Conduíte",
  },
};

// 👇 CATÁLOGO COMPLETO DE RITUAIS COM FORMAS AVANÇADAS 👇
const rituaisCatalog = [
  // 1º CÍRCULO (Custo Base: 1 PE)
  {
    nome: "Alterar Destino",
    elemento: "Energia",
    circulo: 4,
    custoBase: 10,
    alcance: "Pessoal",
    alvo: "Você",
    desc: "Você vislumbra seu futuro próximo, analisando milhões de possibilidades e escolhendo a melhor. Você recebe +15 em um teste de resistência ou na Defesa contra um ataque.",
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): muda o alcance para “curto” e o alvo para “um aliado à sua escolha”.",
    },
  },
  {
    nome: "Alterar Memória",
    elemento: "Conhecimento",
    circulo: 3,
    custoBase: 6,
    alcance: "Toque",
    alvo: "1 pessoa",
    desc: "Você invade a mente do alvo e altera ou apaga suas memórias de até uma hora atrás. Se escolher alterar as memórias, você pode mudar detalhes de eventos recentes, como a identidade de alguém encontrado ou o endereço de um lugar visitado, mas não reescrever completamente esses eventos. O alvo recupera suas memórias após 1d4 dias.",
    verdadeiro: {
      custoExtra: 4,
      desc: "Verdadeiro (+4 PE): você pode alterar ou apagar memórias de até 24 horas atrás. Requer 4º círculo.",
    },
  },
  {
    nome: "Amaldiçoar Arma",
    elemento: "Geral",
    circulo: 1,
    custoBase: 1,
    alcance: "Toque",
    alvo: "1 arma corpo a corpo ou pacote de munição",
    desc: "Quando aprender este ritual, escolha um elemento entre Conhecimento, Energia, Morte e Sangue. Este ritual passa a ser do elemento escolhido. Você imbui a arma ou munições com o elemento, fazendo com que causem +1d6 de dano do tipo do elemento.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): muda o bônus de dano para +2d6. Requer 2º círculo.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): muda o bônus de dano para +4d6. Requer 3º círculo e afinidade.",
    },
  },
  {
    nome: "Amaldiçoar Tecnologia",
    elemento: "Energia",
    circulo: 1,
    custoBase: 1,
    alcance: "Toque",
    alvo: "1 acessório ou arma de fogo",
    desc: "Você imbui o alvo com Energia, fazendo-o funcionar acima de sua capacidade. O item recebe uma modificação a sua escolha.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): muda para duas modificações. Requer 2º círculo.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): muda para três modificações. Requer 3º círculo e afinidade.",
    },
  },
  {
    nome: "Âncora Temporal",
    elemento: "Morte",
    circulo: 3,
    custoBase: 6,
    alcance: "Curto",
    alvo: "1 ser",
    desc: "Uma aura espiralada surge sobre o alvo. No início de cada turno dele, ele deve fazer um teste de Vontade. Se falhar, não poderá se deslocar naquele turno (ele ainda pode agir, só não pode se deslocar). Se o alvo passar nesse teste dois turnos seguidos o efeito termina.",
    verdadeiro: {
      custoExtra: 4,
      desc: "Verdadeiro (+4 PE): muda o alvo para “seres a sua escolha”. Requer 4º círculo.",
    },
  },
  {
    nome: "Aprimorar Físico",
    elemento: "Sangue",
    circulo: 2,
    custoBase: 3,
    alcance: "Toque",
    alvo: "1 ser",
    desc: "O alvo tem seus músculos tonificados e seus ligamentos reforçados, recebendo +1 em Agilidade ou Força, à escolha dele.",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): muda o bônus para +2. Requer 3º círculo.",
    },
    verdadeiro: {
      custoExtra: 7,
      desc: "Verdadeiro (+7 PE): muda o bônus para +3. Requer 4º círculo e afinidade.",
    },
  },
  {
    nome: "Aprimorar Mente",
    elemento: "Conhecimento",
    circulo: 2,
    custoBase: 3,
    alcance: "Toque",
    alvo: "1 ser",
    desc: "O alvo tem sua mente energizada por fagulhos do Conhecimento. Ele recebe +1 em Intelecto ou Presença, à escolha dele (PE, perícias treinadas ou graus de treinamento).",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): muda o bônus para +2. Requer 3º círculo.",
    },
    verdadeiro: {
      custoExtra: 7,
      desc: "Verdadeiro (+7 PE): muda o bônus para +3. Requer 4º círculo e afinidade.",
    },
  },
  {
    nome: "Arma Atroz",
    elemento: "Sangue",
    circulo: 1,
    custoBase: 1,
    alcance: "Toque",
    alvo: "1 arma corpo a corpo",
    desc: "A arma é recoberta por veias carmesim e passa a exalar uma aura de violência. Ela fornece +2 em testes de ataque e +1 na margem de ameaça.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): muda o bônus para +5 em testes de ataque. Requer 2º círculo.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): muda o bônus para +5 em testes de ataque e +2 na margem de ameaça e no multiplicador de crítico. Requer 3º círculo e afinidade.",
    },
  },
  {
    nome: "Armadura de Sangue",
    elemento: "Sangue",
    circulo: 1,
    custoBase: 1,
    alcance: "Pessoal",
    alvo: "Você",
    desc: "Seu sangue escorre para fora do corpo, cobrindo-o sob a forma de uma carapaça que fornece +5 em Defesa. Esse bônus é cumulativo com outros rituais, mas não com bônus fornecido por equipamento.",
    discente: {
      custoExtra: 5,
      desc: "Discente (+5 PE): muda o efeito para “fornece +10 na Defesa e resistência a balístico, corte, impacto e perfuração 5”. Requer 3º círculo.",
    },
    verdadeiro: {
      custoExtra: 9,
      desc: "Verdadeiro (+9 PE): muda o efeito para “fornece +15 na Defesa e resistência a balístico, corte, impacto e perfuração 10”. Requer 4º círculo e afinidade.",
    },
  },
  {
    nome: "Canalizar o Medo",
    elemento: "Medo",
    circulo: 4,
    custoBase: 10,
    alcance: "Toque",
    alvo: "1 pessoa",
    desc: "Você transfere parte de seu poder para outra pessoa. Escolha um ritual de até 3º círculo que você conheça; o alvo pode conjurar este ritual em sua forma básica uma vez, sem pagar seu custo em PE (mas pode usar formas avançadas gastando seus próprios PE para isso). Até o ritual transferido ser conjurado, seus PE máximos diminuem em um valor igual ao custo dele.",
  },
  {
    nome: "Capturar o Coração",
    elemento: "Sangue",
    circulo: 4,
    custoBase: 10,
    alcance: "Curto",
    alvo: "1 pessoa",
    desc: "Você desperta uma paixão doentia e obcecada por você no alvo, que passa a querar agradá-lo a todo custo, mesmo que para isso precise ficar contra seus amigos. No início de cada turno do alvo ele deve fazer um teste de Vontade. Se falhar, age de forma a ajudá-lo na melhor de suas capacidades naquele turno. Se o alvo passar nesse teste dois turnos seguidos o efeito termina.",
  },
  {
    nome: "Chamas do Caos",
    elemento: "Energia",
    circulo: 2,
    custoBase: 3,
    alcance: "Curto",
    alvo: "veja texto",
    desc: "Você manipula o calor e o fogo. Ao conjurar o ritual, escolha um dos seguintes efeitos.\nChamejar: o alvo é uma arma corpo a corpo. Ela causa +1d6 pontos de dano de fogo.\nEsquentar: o alvo é um objeto, que começa a esquentar. Ele sofre 1d6 pontos de dano de fogo por rodada e causa o mesmo dano a qualquer ser que o esteja empunhando ou vestindo. A critério do mestre, o objeto ou o ser pode pegar fogo. Um ser pode gastar uma ação completa para resfriar o objeto (jogando areia ou jogando-o numa fonte de água próxima, por exemplo) e cancelar o efeito do ritual.\nExtinguir: o alvo é uma chama de tamanho Grande ou menor, que é apagada. Isso cria uma nuvem de fumaça que ocupa uma esfera de 3m de raio centrada onde estava a chama. Dentro da fumaça, seres têm camuflagem leve.\nModelar: o alvo é uma chama de tamanho Grande ou menor. A cada rodada, você pode gastar uma ação livre para movimentá-la 9m em qualquer direção. Se atravessar o espaço ocupado por um ser, ela causa 3d6 pontos de dano de fogo nele. Um ser só pode sofrer dano dessa maneira uma vez por rodada.",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): muda a duração para sustentada e adiciona “Resistência: Reflexos reduz à metade”. Em vez do normal, uma vez por rodada você pode gastar uma ação de movimento para projetar uma labareda, num alvo em alcance curto. O alvo sofre 4d6 pontos de dano de Energia (Reflexos reduz à metade).",
    },
    verdadeiro: {
      custoExtra: 7,
      desc: "Verdadeiro (+7 PE): como discente, mas muda o dano para 8d6. Requer 3º círculo.",
    },
  },
  {
    nome: "Cicatrização",
    elemento: "Morte",
    circulo: 1,
    custoBase: 1,
    alcance: "Toque",
    alvo: "1 ser",
    desc: "Você acelera o tempo ao redor das feridas do alvo, que cicatrizam instantaneamente. O alvo recupera 3d8+3 PV, mas envelhece 1 ano automaticamente.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): aumenta a cura para 5d8+5 PV. Requer 2º círculo.",
    },
    verdadeiro: {
      custoExtra: 9,
      desc: "Verdadeiro (+9 PE): muda o alcance para “curto”, o alvo para “seres escolhidos” e aumenta a cura para 7d8+7 PV. Requer 4º círculo e afinidade com Morte.",
    },
  },
  {
    nome: "Cinerária",
    elemento: "Medo",
    circulo: 1,
    custoBase: 1,
    alcance: "Curto",
    alvo: "nuvem de 6m de raio",
    desc: "Você manifesta uma névoa carregada de essência paranormal. Rituais conjurados dentro da névoa têm sua DT aumentada em +5.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): além do normal, rituais conjurados dentro da névoa custam –2 PE.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): além do normal, rituais conjurados dentro da névoa causam dano maximizado.",
    },
  },
  {
    nome: "Coincidência Forçada",
    elemento: "Energia",
    circulo: 1,
    custoBase: 1,
    alcance: "Curto",
    alvo: "1 ser",
    desc: "Você manipula os caminhos do caos para que o alvo tenha mais sorte. O alvo recebe +2 em testes de perícias.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): muda o alvo para aliados à sua escolha. Requer 2º círculo.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): muda o alvo para aliados à sua escolha e o bônus para +5. Requer 3º círculo e afinidade.",
    },
  },
  {
    nome: "Compreensão Paranormal",
    elemento: "Conhecimento",
    circulo: 1,
    custoBase: 1,
    alcance: "Toque",
    alvo: "1 ser ou objeto",
    desc: "O ritual confere a você compreensão sobrenatural da linguagem. Se tocar um objeto contendo informação (ou livro, um dispositivo com uma gravação…), você entende as palavras mesmo que não conheça seu idioma, contanto que se trate de um idioma humano (não funciona com símbolos ou sigilos paranormais). Se tocar uma pessoa, pode se comunicar com ela como se falassem um idioma em comum. Se tocar um ser não inteligente, como um animal, pode perceber seus sentimentos básicos, como medo ou felicidade. Um alvo involuntário tem direito a um teste de Vontade.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): muda o alcance para “curto” e o alvo para “alvos escolhidos”. Você pode entender todos os alvos afetados. Requer 2º círculo.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): muda o alcance para “pessoal” e o alvo para “você”. Em vez do normal, você pode falar, entender e escrever qualquer idioma humano. Requer 3º círculo.",
    },
  },
  {
    nome: "Conhecendo o Medo",
    elemento: "Medo",
    circulo: 4,
    custoBase: 10,
    alcance: "Toque",
    alvo: "1 pessoa",
    desc: "Você manifesta medo absoluto na mente do alvo. Se ele falhar no teste de resistência, a Sanidade dele é reduzida a 0 e ele fica enlouquecendo. Se ele passar, sofre 10d6 pontos de dano mental e fica apavorado por 1 rodada. Uma pessoa que fique insana pelo efeito deste ritual se transforma em uma criatura paranormal a critério do mestre.",
  },
  {
    nome: "Consumir Manancial",
    elemento: "Morte",
    circulo: 1,
    custoBase: 1,
    alcance: "Pessoal",
    alvo: "você",
    desc: "Você suga uma pequena porção do tempo de vida de plantas, insetos e até mesmo do solo ao redor, gerando Lodo e recebendo 3d6 pontos de vida temporários. Os PV temporários desaparecem ao final da cena.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): muda os PV temporários recebidos para 6d6. Requer 2º círculo.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): muda o alvo para “área: esfera com 6m de raio centrada em você” e a resistência para “Fortitude reduz à metade”. Em vez do normal, você suga energia de todos os seres vivos na área, causando 3d6 pontos de dano de Morte em cada um e recebendo PV temporários iguais ao dano total causado até o final da cena. Requer 3º círculo e afinidade.",
    },
  },
  {
    nome: "Contato Paranormal",
    elemento: "Conhecimento",
    circulo: 3,
    custoBase: 6,
    alcance: "Pessoal",
    alvo: "você",
    desc: "Você barganha com a entidade de Conhecimento para que o auxilie durante o dia, em troca de se alimentar de sua Sanidade. Quando o ritual é conjurado, você recebe seis d6. Sempre que fizer um teste de perícia, você pode gastar um desses d6, rolá-lo e adicionar o resultado no teste. No entanto, essa ajuda tem um preço: sempre que rolar um 6 no dado, a entidade toma 2 pontos de Sanidade de você. Se você ficar sem dados ou chegar a Sanidade 0, o ritual acaba.",
    discente: {
      custoExtra: 4,
      desc: "Discente (+4 PE): muda os dados de auxílio para d8. Sempre que rolar um 8 num desses dados, a entidade toma 3 pontos de sua Sanidade. Requer 4º círculo.",
    },
    verdadeiro: {
      custoExtra: 9,
      desc: "Verdadeiro (+9 PE): muda os dados de auxílio para d12. Sempre que rolar um 12 num desses dados, a entidade toma 5 pontos de sua Sanidade. Requer 4º círculo e afinidade.",
    },
  },
  {
    nome: "Contenção Fantasmagórica",
    elemento: "Energia",
    circulo: 2,
    custoBase: 3,
    alcance: "Médio",
    alvo: "1 ser",
    desc: "Três laços de Energia surgem do chão e se enroscam no alvo, deixando-o agarrado. O alvo pode tentar se livrar, gastando uma ação padrão para fazer um teste de Atletismo (DT do ritual). Se passar, destrói um laço, mais um laço adicional para cada 5 pontos pelos quais superou a DT. Os laços também podem ser atacados e destruídos: cada um tem Defesa 10, 10 PV, RD 5 e imunidade a Energia. Se todos os laços forem destruídos, o ritual é dissipado. Por serem feitos de Energia, os laços afetam criaturas incorpóreas.",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): aumenta o número de laços para 6, e você pode escolher o alvo de cada laço, com um mínimo de dois laços por alvo. Requer 3º círculo.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): como discente, e cada laço destruído libera uma onda de choque que causa 2d6+2 pontos de dano de Energia no alvo agarrado. Requer 3º círculo e afinidade.",
    },
  },
  {
    nome: "Controle Mental",
    elemento: "Conhecimento",
    circulo: 4,
    custoBase: 10,
    alcance: "Médio",
    alvo: "1 pessoa ou animal",
    desc: "Você domina a mente do alvo, que obedece todos os seus comandos, exceto ordens suicidas. Um alvo tem direito a um teste de Vontade no final de cada um de seus turnos para se livrar do efeito. Alvos que passarem no teste ficam pasmos por 1 rodada (apenas uma vez por cena).",
    discente: {
      custoExtra: 5,
      desc: "Discente (+5 PE): muda o alvo para até cinco pessoas ou animais.",
    },
    verdadeiro: {
      custoExtra: 10,
      desc: "Verdadeiro (+10 PE): muda o alvo para até dez pessoas ou animais. Requer afinidade com Conhecimento.",
    },
  },
  {
    nome: "Convocação Instantânea",
    elemento: "Energia",
    circulo: 3,
    custoBase: 6,
    alcance: "Ilimitado",
    alvo: "1 objeto de até 2 espaços",
    desc: "Você invoca um objeto de qualquer lugar para sua mão. O item deve ter sido previamente preparado com o símbolo do ritual e pode ocupar no máximo 2 espaços. Se o objeto estiver sendo empunhado por outra pessoa, ela pode fazer um teste de Vontade para negar o efeito, mas você saberá onde o objeto está e quem o está carregando (ou sua aparência, caso não conheça a pessoa). Por até 1h depois da convocação, você pode gastar uma ação de movimento para enviar o objeto de volta para o local em que ele estava antes.",
    discente: {
      custoExtra: 4,
      desc: "Discente (+4 PE): muda o alvo para um objeto de até 10 espaços.",
    },
    verdadeiro: {
      custoExtra: 9,
      desc: "Verdadeiro (+9 PE): muda o alvo para “1 recipiente Médio (como uma mala ou caixote), com itens que somem até 10 espaços” e a duração para “permanente”. Em vez do normal, você encanta o recipiente para mantê-lo escondido no Outro Lado. Você pode convocar o recipiente para um espaço livre adjacente, ou de volta para o esconderijo paranormal, com uma ação padrão. Para isso, você deve ter em mãos uma miniatura do objeto, que funciona como um utensílio de categoria II. Quando conjura esta versão do ritual, você perde 1 PE permanentemente.",
    },
  },
  {
    nome: "Convocar o Algoz",
    elemento: "Morte",
    circulo: 4,
    custoBase: 10,
    alcance: "1,5m",
    alvo: "1 pessoa",
    desc: "Usando os medos subconscientes do alvo, você manipula a espiral da Morte para criar uma imagem daquilo que ele mais teme. Apenas a própria vítima vê o algoz com nitidez; outros seres presentes (incluindo você) enxergam apenas um vulto sombrio. O algoz surge adjacente a você. No fim de cada turno seu, ele flutua 12m em direção à vítima. Se o algoz terminar o turno em alcance curto da vítima, ela deve fazer um teste de Vontade; se falhar, ficará abalada. Se o algoz terminar o turno adjacente à vítima, ela deve fazer um teste de Fortitude. Se falhar, sofre um colapso e fica com 0 PV. Se passar, sofre 6d6 pontos de dano de Morte (este dano não pode reduzir o alvo a menos de 1 PV). O algoz persegue o alvo implacavelmente, mesmo além do alcance do ritual. Ele é incorpóreo e imune a dano e só desaparece se deixar o alvo morrendo ou se for dissipado.",
  },
  {
    nome: "Corpo Adaptado",
    elemento: "Sangue",
    circulo: 1,
    custoBase: 1,
    alcance: "Toque",
    alvo: "1 pessoa ou animal",
    desc: "Este ritual modifica a biologia do alvo para permitir a sobrevivência em ambientes hostis. O alvo fica imune a calor e frio extremos, pode respirar na água se respirar ar (ou vice-versa) e não sufoca em fumaça densa.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): muda a duração para 1 dia.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): muda o alcance para “curto” e o alvo para “pessoas ou animais escolhidos”.",
    },
  },
  {
    nome: "Decadência",
    elemento: "Morte",
    circulo: 1,
    custoBase: 1,
    alcance: "Toque",
    alvo: "1 ser",
    desc: "Espirais de trevas envolvem sua mão e definham o alvo, que sofre 2d8+2 pontos de dano de Morte.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): muda a resistência para “nenhuma” e o dano para 3d8+3. Como parte da execução do ritual, você transfere as espirais para uma arma e faz um ataque corpo a corpo contra o alvo com esta arma. Se acertar, causa o dano da arma e do ritual, somados.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): muda o alcance para “pessoal” o alvo para “área: explosão com 6m de raio” e o dano para 8d8+8. As espirais afetam todos seres na área. Requer 3º círculo.",
    },
  },
  {
    nome: "Definhar",
    elemento: "Morte",
    circulo: 1,
    custoBase: 1,
    alcance: "Curto",
    alvo: "1 ser",
    desc: "Você dispara uma lufada de cinzas que drena as forças do alvo. O alvo fica fatigado. Se passar no teste de resistência, em vez disso fica vulnerável.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): em vez do normal, o alvo fica exausto. Se passar na resistência, fica fatigado. Requer 2º círculo.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): como discente, mas muda o alvo para “até 5 seres”. Requer 3º círculo e afinidade com Morte.",
    },
  },
  {
    nome: "Deflagração de Energia",
    elemento: "Energia",
    circulo: 4,
    custoBase: 10,
    alcance: "Pessoal",
    alvo: "explosão de 15m de raio",
    desc: "Você acumula uma quantidade imensa de Energia, então a libera em uma explosão intensa, como uma estrela em plena terra. Todos na área sofrem 3d10 x 10 pontos de dano de Energia e todos os itens tecnológicos (armas de fogo, acessórios e utensílios) param de funcionar (em termos de regras, estão quebrados). Você não é afetado pela explosão. Alvos que passem no teste de Fortitude sofrem metade do dano e seus itens voltam a funcionar após 1d4 rodadas.",
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): afeta apenas alvos a sua escolha.",
    },
  },
  {
    nome: "Desacelerar Impacto",
    elemento: "Morte",
    circulo: 2,
    custoBase: 3,
    alcance: "Curto",
    alvo: "1 ser ou objetos somando até 10 espaços",
    desc: "O alvo cai lentamente. A velocidade da queda é reduzida para 18m por rodada — o suficiente para não causar dano. Como conjurar este ritual é uma reação, você pode conjurá-lo rápido o bastante para salvar a si ou um aliado de quedas inesperadas. Se o alvo for um projétil — como um disparo de arma ou um objeto largado do alto de um prédio —, o ritual faz com que ele cause metade do dano normal, devido à lentidão.\nEste ritual só funciona em alvos em queda livre ou similar; não pode frear um golpe de faca ou o mergulho rasante de um atacante voador.",
    verdadeiro: {
      custoExtra: 3,
      desc: "Verdadeiro (+3 PE): aumenta o total de alvos para seres ou objetos somando até 100 espaços.",
    },
  },
  {
    nome: "Descarnar",
    elemento: "Sangue",
    circulo: 2,
    custoBase: 3,
    alcance: "Toque",
    alvo: "1 ser",
    desc: "Este ritual cruel faz com que lacerações se manifestem na pele e órgãos do alvo, que sofre 6d8 pontos de dano (metade corte, metade Sangue) e fica com uma hemorragia severa. No início de cada turno dele, o alvo deve fazer um teste de Fortitude. Se falhar, sofre 2d8 pontos de dano de Sangue. Se passar nesse teste dois turnos seguidos, a hemorragia é estancada. Alvos que passem no teste de resistência inicial sofrem metade do dano e não ficam com hemorragia.",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): muda o dano direto para 10d8 e o dano da hemorragia para 4d8. Requer 3º círculo.",
    },
    verdadeiro: {
      custoExtra: 7,
      desc: "Verdadeiro (+7 PE): muda o alvo para você e a duração para sustentada. Enquanto o ritual durar, seus ataques corpo a corpo causam 4d8 pontos de dano de Sangue adicional e deixam o alvo com hemorragia automaticamente (como no efeito básico do ritual). O alvo ainda tem direito a um teste de Fortitude no início de seus turnos. Requer 3º círculo e afinidade.",
    },
  },
  {
    nome: "Detecção de Ameaças",
    elemento: "Conhecimento",
    circulo: 2,
    custoBase: 3,
    alcance: "Pessoal",
    alvo: "esfera de 18m de raio",
    desc: "Você recebe uma percepção aguçada sobre perigos à sua volta. Quando um ser hostil ou armadilha entra na área do efeito, você tem uma sensação de perigo e pode gastar uma ação de movimento para fazer um teste de Percepção (DT 20). Se passar, sabe a direção e distância do perigo.",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): além do normal, você não fica desprevenido contra perigos detectados e recebe +5 em testes de resistência contra armadilhas. Requer 3º círculo.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): muda a duração para “1 dia” e concede os mesmos benefícios de discente. Requer 4º círculo.",
    },
  },
  {
    nome: "Dissipar Ritual",
    elemento: "Medo",
    circulo: 3,
    custoBase: 6,
    alcance: "Médio",
    alvo: "1 ser ou objeto, ou esfera com 3m de raio",
    desc: "Você dissipa rituais ativos, como se a duração deles tivesse acabado. Efeitos de rituais instantâneos não podem ser dissipados (não se pode dissipar uma área de Paradoxo depois que já causou dano…). Faça um teste de Ocultismo; você anula quaisquer rituais ativos no alvo ou na área com DT igual ou menor que o resultado do teste. Você pode conjurar esse ritual em um item amaldiçoado para que se torne um item mundano (perdendo seus poderes) por um dia. Se o item estiver em posse de alguém, seu usuário pode fazer um teste de Vontade para negar o efeito.",
  },
  {
    nome: "Dissonância Acústica",
    elemento: "Energia",
    circulo: 2,
    custoBase: 3,
    alcance: "Médio",
    alvo: "esfera com 6m de raio",
    desc: "Você manipula a vibração do ar, criando uma área de dissonância sonora. Enquanto estiverem na área, todos os seres ficam surdos. Essa dissonância impede que seres dentro da área conjurem rituais.",
    discente: {
      custoExtra: 1,
      desc: "Discente (+1 PE): muda a área para “alvo: 1 objeto”. Em vez do normal, o alvo emana uma área de silêncio com 3m de raio. Se conjurar o ritual num objeto de um ser involuntário, ele tem direito a um teste de Vontade para anulá-lo.",
    },
    verdadeiro: {
      custoExtra: 3,
      desc: "Verdadeiro (+3 PE): muda a duração para cena. Em vez do normal, nenhum som pode deixar a área, mas seres dentro da área podem falar, ouvir e conjurar rituais normalmente. Requer 3º círculo.",
    },
  },
  {
    nome: "Distorção Temporal",
    elemento: "Morte",
    circulo: 4,
    custoBase: 10,
    alcance: "Pessoal",
    alvo: "veja texto",
    desc: "Este ritual distorce o fluxo de tempo em relação a você, criando um pequeno bolsão temporal que dura 3 rodadas. Durante este tempo, você pode agir, mas não pode se deslocar do lugar nem interagir com seres e objetos. Da mesma forma, efeitos contínuos não o afetam, e quaisquer efeitos que você iniciar não afetarão a área ao seu redor. Efeitos de área com duração maior que este efeito vão agir normalmente quando o bolsão temporal acabar.",
  },
  {
    nome: "Distorcer Aparência",
    elemento: "Sangue",
    circulo: 1,
    custoBase: 1,
    alcance: "Pessoal",
    alvo: "você",
    desc: "Você modifica sua aparência de modo a parecer outra pessoa. Isso inclui altura, peso, tom de pele, cor de cabelo, timbre de voz, impressão digital, córnea etc. Você recebe +10 em testes de Enganação para disfarce, mas não recebe habilidades da nova forma nem modifica suas demais estatísticas.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): muda o alcance para “curto” e o alvo para “1 ser”. Um alvo involuntária pode anular o efeito com um teste de Vontade.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): como em Discente, mas muda o alvo para “seres escolhidos”. Requer 3º círculo.",
    },
  },
  {
    nome: "Eco Espiral",
    elemento: "Morte",
    circulo: 2,
    custoBase: 3,
    alcance: "Curto",
    alvo: "1 ser",
    desc: "Você manifesta em suas mãos uma pequena cópia do alvo feita de cinzas. No início do próximo turno após conjurar este ritual, você precisa gastar uma ação padrão para se concentrar nele; caso contrário, ele se dissipa sem efeito. No início do segundo turno, você precisa gastar uma ação padrão para descarregá-lo. Se fizer isso, a cópia explode e o alvo sofre dano de Morte igual a quantidade de dano que sofreu na rodada em que você se concentrou (Fortitude reduz à metade). Se não fizer, o ritual se dissipa sem efeito.",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): muda o alvo para “até 5 seres”.",
    },
    verdadeiro: {
      custoExtra: 7,
      desc: "Verdadeiro (+7 PE): muda a duração para “até 3 rodadas”, permitindo que você se concentre nas duas primeiras e descarregue na terceira. Requer 4º círculo e afinidade.",
    },
  },
  {
    nome: "Eletrocussão",
    elemento: "Energia",
    circulo: 1,
    custoBase: 1,
    alcance: "Curto",
    alvo: "1 ser ou objeto",
    desc: "Você manifesta e dispara uma corrente elétrica contra o alvo, que sofre 3d6 pontos de dano de eletricidade e fica vulnerável por uma rodada. Se passar no teste de resistência, sofre apenas metade do dano e evita a condição. Se usado contra objetos eletrônicos, este ritual causa o dobro de dano e ignora resistência.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): muda o alvo para “área: linha de 30m”. Você dispara um poderoso raio que causa 6d6 pontos de dano de Energia em todos os seres e objetos livres na área. Requer 2º círculo.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): muda o alvo para “alvos escolhidos”. Em vez do normal, você dispara vários relâmpagos, um para cada alvo escolhido, causando 8d6 pontos de dano de Energia em cada. Requer 3º círculo.",
    },
  },
  {
    nome: "Embaralhar",
    elemento: "Energia",
    circulo: 1,
    custoBase: 1,
    alcance: "Pessoal",
    alvo: "você",
    desc: "Você cria três cópias ilusórias suas, como hologramas extremamente realistas. As cópias ficam ao seu redor e imitam suas ações, tornando difícil para um inimigo saber quem é o verdadeiro. Você recebe +6 na Defesa. Cada vez que um ataque contra você erra, uma das imagens desaparece e o bônus na Defesa diminui em 2. Um oponente deve ver as cópias para ser confundido. Se você estiver invisível, ou o atacante fechar os olhos, você não recebe o bônus (mas o atacante sofre as penalidades normais por não enxergar).",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): muda o número de cópias para 5 (e o bônus na Defesa para +10). Requer 2º círculo.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): muda o número de cópias para 8 (e o bônus na Defesa para +16). Além do normal, toda vez que uma cópia é destruída, emite um clarão de luz. O ser que destruiu a cópia fica ofuscado por uma rodada. Requer 3º círculo.",
    },
  },
  {
    nome: "Enfeitiçar",
    elemento: "Conhecimento",
    circulo: 1,
    custoBase: 1,
    alcance: "Curto",
    alvo: "1 pessoa",
    desc: "Este ritual torna o alvo prestativo (veja a página 45). Ele não fica sob seu controle, mas percebe suas palavras e ações da maneira mais favorável possível. Você recebe um bônus de +10 em testes de Diplomacia com ele. Um alvo hostil ou que esteja envolvido em combate recebe +5 em seu teste de resistência. Se você ou seus aliados tomarem qualquer ação hostil contra o alvo, o efeito é dissipado e o alvo retorna à atitude que tinha antes (ou piorada, de acordo com o mestre).",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): em vez do normal, você sugere uma ação para o alvo e ele obedece. A sugestão deve ser feita de modo que pareça aceitável, a critério do mestre. Pedir que o alvo atire em seu companheiro, por exemplo, dissipa o efeito. Já sugerir a um guarda que descanse um pouco, de modo que você e seus aliados passem por ele, é aceitável. Quando o alvo executa a ação, o efeito termina. Você pode determinar uma condição específica para a sugestão: por exemplo, que o policial prenda a próxima pessoa de casaco verde que ele encontrar. Requer 2º círculo.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): afeta todos os alvos dentro do alcance. Requer 3º círculo.",
    },
  },
  {
    nome: "Esconder dos Olhos",
    elemento: "Conhecimento",
    circulo: 2,
    custoBase: 3,
    alcance: "Pessoal",
    alvo: "você",
    desc: "Você fica invisível, incluindo seu equipamento, recebendo camuflagem total e +15 em testes de Furtividade. Como o normal, seres que não possam vê-lo ficam desprevenidos contra seus ataques.\nO efeito termina se você faz um ataque ou usa uma habilidade hostil. Ações contra objetos livres não dissipam Esconder dos Olhos (você pode tocar ou apanhar objetos que não estejam sendo segurados por outros seres). Causar dano indiretamente — por exemplo, preparar explosivos para detonar mais tarde — não é considerado um ataque.\nObjetos soltos voltam a ser visíveis e objetos apanhados por você ficam invisíveis. Luz transportada nunca fica invisível (mesmo que sua fonte esteja). Qualquer parte de um item carregado que se estenda além de seu alcance corpo a corpo natural se torna visível.",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): muda a duração para “sustentada”. Em vez do normal, você gera uma esfera de invisibilidade. Você e todos os aliados a até 3m de você se tornam invisíveis, como no efeito normal do ritual (ainda ficam visíveis caso façam uma ação hostil). A esfera se move junto com você; qualquer coisa que saia da esfera fica visível. Requer 3º círculo.",
    },
    verdadeiro: {
      custoExtra: 7,
      desc: "Verdadeiro (+7 PE): muda a execução para “ação padrão”, o alcance para “toque”, o alvo para “1 ser” e a duração para “sustentada”. O efeito não é dissipado caso o alvo faça um ataque ou ação hostil. Requer 4º círculo e afinidade.",
    },
  },
  {
    nome: "Espirais da Perdição",
    elemento: "Morte",
    circulo: 1,
    custoBase: 1,
    alcance: "Curto",
    alvo: "1 ser",
    desc: "Espirais surgem no corpo do alvo, tornando seus movimentos lentos. O alvo sofre -1d20 em testes de ataque.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): muda a penalidade para -2d20. Requer 2º círculo.",
    },
    verdadeiro: {
      custoExtra: 8,
      desc: "Verdadeiro (+8 PE): muda a penalidade para -2d20 e o alvo para “seres escolhidos”. Requer 3º círculo.",
    },
  },
  {
    nome: "Ferver Sangue",
    elemento: "Sangue",
    circulo: 3,
    custoBase: 6,
    alcance: "Curto",
    alvo: "1 ser",
    desc: "O sangue do alvo aquece até entrar em ebulição. Quando o ritual é conjurado, e no início de cada turno do alvo, ele deve fazer um teste de Fortitude. Se falhar, sofre 4d8 pontos de dano de Sangue e fica fraco; se passar, sofre metade do dano e não fica fraco nesta rodada. Se o alvo passar nesse teste dois turnos seguidos o efeito termina.",
    verdadeiro: {
      custoExtra: 4,
      desc: "Verdadeiro (+4 PE): muda o alvo para “seres escolhidos”. Requer 4º círculo e afinidade.",
    },
  },
  {
    nome: "Fim Inevitável",
    elemento: "Morte",
    circulo: 4,
    custoBase: 10,
    alcance: "Extremo",
    alvo: "buraco negro com 1,5m de diâmetro",
    desc: "Você cria um vácuo em um espaço desocupado a sua escolha. No início de cada um de seus quatro turnos seguintes, todos os seres a até 90m do vácuo, incluindo você, devem fazer um teste de Fortitude. Em caso de falha, ficam caídas e são puxadas 30m na direção do vácuo. Objetos soltos também são puxados. Seres podem gastar uma ação de movimento para se segurar em algum objeto fixo, recebendo +5 em seus testes de resistência. Seres e objetos que iniciem seu turno tocando o vácuo temporal sofrem 100 pontos de dano de Morte por rodada.",
    discente: {
      custoExtra: 5,
      desc: "Discente (+5 PE): muda a duração para “5 rodadas” e o efeito para que você não seja afetado. Requer afinidade.",
    },
    verdadeiro: {
      custoExtra: 10,
      desc: "Verdadeiro (+10 PE): muda a duração para “6 rodadas” e o efeito para que seres escolhidos dentro do alcance não sejam afetados. Requer afinidade.",
    },
  },
  {
    nome: "Flagelo de Sangue",
    elemento: "Sangue",
    circulo: 2,
    custoBase: 3,
    alcance: "Toque",
    alvo: "1 pessoa",
    desc: "Você toca uma pessoa, gravando uma marca escarificada no corpo dela enquanto profere uma ordem, como “não ataque a mim ou meus aliados”, “siga-me” ou “não saia desta sala”. A cada rodada que o alvo desobedecer a ordem, a marca inflige uma dor excruciante, que causa 10d6 pontos de dano de Sangue e deixa o alvo enjoado pela rodada (Fortitude reduz o dano à metade e evita a condição). Se o alvo passar nesse teste dois turnos seguidos a marca desaparece.",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): muda o alvo para “1 ser (exceto criaturas de Sangue)”. Requer 3º círculo.",
    },
    verdadeiro: {
      custoExtra: 7,
      desc: "Verdadeiro (+7 PE): como Discente, e muda a duração para “1 dia”. Requer 4º círculo e afinidade.",
    },
  },
  {
    nome: "Forma Monstruosa",
    elemento: "Sangue",
    circulo: 3,
    custoBase: 6,
    alcance: "Pessoal",
    alvo: "você",
    desc: "Seu corpo se transforma, assumindo uma forma que combina suas características com as de uma criatura de Sangue; suas roupas e proteção se mesclam à sua carne, transformando-se em uma couraça, e quaisquer objetos em suas mãos se fundem aos seus braços, transformando-se em garras pontiagudas. Seu equipamento fica inacessível, mas seus bônus se mantém. Seu tamanho muda para Grande e você recebe +5 em testes de ataque e rolagens de dano corpo a corpo e 30 PV temporários. Enquanto estiver transformado, sua mente é tomada por fúria selvagem; você não pode falar nem conjurar rituais e a cada rodada deve atacar o ser mais próximo possível. Se não houver um ser que possa atacar, deve se deslocar em direção ao ser mais próximo da melhor forma possível. Se o ser mais próximo for um aliado, você pode fazer um teste de Vontade (DT do ritual). Se passar, neste turno você pode escolher qual ser atacar.",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): além do normal, você recebe imunidade a atordoamento, fadiga, sangramento, sono e veneno.",
    },
    verdadeiro: {
      custoExtra: 9,
      desc: "Verdadeiro (+9 PE): muda os bônus em testes de ataque e rolagens de dano para +10 e os PV temporários para 50. Requer 4º círculo e afinidade.",
    },
  },
  {
    nome: "Fortalecimento Sensorial",
    elemento: "Sangue",
    circulo: 1,
    custoBase: 1,
    alcance: "Pessoal",
    alvo: "você",
    desc: "Você potencializa seus sentidos, recebendo +1d20 em Investigação, Luta, Percepção e Pontaria.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): além do normal, seus inimigos sofrem -1d20 em testes de ataque contra você. Requer 2º círculo.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): além do normal, você apura seus sentidos para perceber perigo. Você fica imune às condições surpreendido e desprevenido e recebe +10 em Defesa e Reflexos. Requer 4º círculo e afinidade.",
    },
  },
  {
    nome: "Hemofagia",
    elemento: "Sangue",
    circulo: 2,
    custoBase: 3,
    alcance: "Toque",
    alvo: "1 ser",
    desc: "Você arranca o sangue do corpo do alvo através da pele dele, causando 6d6 pontos de dano de Sangue. Você então absorve esse sangue, recuperando pontos de vida iguais à metade do dano causado.",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): muda a resistência para “nenhuma”. Como parte da execução do ritual, você faz um ataque corpo a corpo contra o alvo. Se acertar, causa o dano do ataque e do ritual, recuperando PV em quantidade igual à metade do dano total causado.",
    },
    verdadeiro: {
      custoExtra: 7,
      desc: "Verdadeiro (+7 PE): muda o alcance para “pessoal”, o alvo para “você” e a duração para “cena”. Em vez do normal, a cada rodada você pode gastar uma ação padrão para tocar 1 ser e causar 4d6 pontos de dano de Sangue. Você recupera PV iguais à metade do dano causado. Requer 4º círculo.",
    },
  },
  {
    nome: "Inexistir",
    elemento: "Conhecimento",
    circulo: 4,
    custoBase: 10,
    alcance: "Toque",
    alvo: "1 ser",
    desc: "Este é um ritual extremamente cruel, que já condenou grandes agentes da Ordem ao oblívio. Você toca o alvo com a intenção de apagá-lo por completo da existência, fazendo a mente e o corpo do alvo serem reescritos e desmantelados da existência. O alvo começa a levitar a poucos centímetros do chão e textos narrando todos os momentos de sua vida surgem e brilham por cima de sua pele, até que a existência dele começa a ser destruída de dentro, causando 10d12+10 pontos de dano de Conhecimento. Se o alvo passar no teste de resistência, em vez disso sofre 2d12 pontos de dano e fica debilitado por uma rodada. Independente do resultado do teste de resistência, se os PV do alvo forem reduzidos a 0 ou menos, ele será completamente apagado, não restando nenhum traço de sua existência.",
    discente: {
      custoExtra: 5,
      desc: "Discente (+5 PE): muda o dano para 15d12+15 e o dano resistido para 3d12.",
    },
    verdadeiro: {
      custoExtra: 10,
      desc: "Verdadeiro (+10 PE): muda o dano para 20d12+20 e o dano resistido para 4d12. Requer afinidade.",
    },
  },
  {
    nome: "Invadir Mente",
    elemento: "Conhecimento",
    circulo: 2,
    custoBase: 3,
    alcance: "Médio ou toque",
    alvo: "1 ser ou 2 pessoas voluntárias",
    desc: "Quando conjura este ritual, você gera um dos efeitos a seguir, a sua escolha:\nRajada Mental: você infecta a mente do alvo com o Conhecimento proibido do Outro Lado, dilacerando o cérebro dele. O alvo sofre 6d6 pontos de dano de Conhecimento e fica atordoado por uma rodada. Se passar no teste de Vontade, sofre metade do dano e não fica atordoado. Um mesmo alvo só pode ficar atordoado por este ritual uma vez por cena.\nLigação Telepática: você cria um elo mental entre duas pessoas (você pode ser uma delas), que podem se comunicar independente da distância pela duração do ritual (1 dia).",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): se escolhar rajada mental, aumenta o dano para 10d6. Se escolher ligação telepática, em vez do normal, você cria um elo mental que permite que você gaste uma ação de movimento para ver e ouvir pelos sentidos do alvo. Um alvo involuntário pode fazer um teste de Vontade para suprimir o ritual por uma hora. Requer 3º círculo.",
    },
    verdadeiro: {
      custoExtra: 7,
      desc: "Verdadeiro (+7 PE): se escolher rajada mental, aumenta o dano para 10d6 e muda o alvo para “seres escolhidos”. Se escolher ligação telepática, você pode criar um vínculo mental entre até 5 pessoas. Requer 4º círculo.",
    },
  },
  {
    nome: "Invólucro de Carne",
    elemento: "Sangue",
    circulo: 4,
    custoBase: 10,
    alcance: "Curto",
    alvo: "1 clone",
    desc: "Você manifesta uma poça de sangue no chão, de onde emerge uma cópia sua. Ela é idêntica em aparência e capacidades (em termos de jogo, tem as mesmas estatísticas) e surge com uma cópia de todo equipamento mundano que você estiver carregando. A cópia não tem consciência (valor de Intelecto e Presença nulos) e não age sem que você dê uma ordem. Você pode gastar uma ação de movimento para dar uma ordem à cópia, como “lute contra aquele ser”. No final de cada um de seus turnos, a cópia segue a ordem da melhor maneira possível, mas ainda é incapaz de tomar decisões sozinha e acatará qualquer ordem perigosa sem hesitar, mesmo que leve à sua destruição. Alternativamente, no início de seu turno, você pode controlar ativamente a cópia. Se fizer isso, você entra num transe temporário e assume o controle da cópia como se fosse seu corpo, usando os sentidos dela. Qualquer ser que interagir com a cópia tem direito a um teste de Percepção (DT do ritual) para perceber que é uma cópia. A cópia se desfaz em uma poça de sangue coagulado se chegar a 0 PV ou sair do alcance.",
  },
  {
    nome: "Lâmina do Medo",
    elemento: "Medo",
    circulo: 4,
    custoBase: 10,
    alcance: "Toque",
    alvo: "1 ser",
    desc: "Você manifesta uma lâmina impossível, que pode ser descrita apenas como uma “fenda na Realidade”, com a qual golpeia um alvo adjacente. Se o alvo falhar no teste de Fortitude, seus PV são reduzidos a 0 e ele fica morrendo; se passar, sofre 10d8 pontos de dano de Medo (ignora todas as resistências) e fica apavorado por uma rodada. Se uma pessoa ficar morrendo pela Lâmina do Medo e sobreviver, o ferimento causado pelo ritual passa a se transformar constantemente, jamais cicatrizando e fazendo com que a pessoa passe a viver em dor constante. Aprender este ritual requer um poder de trilha específico.",
  },
  {
    nome: "Localização",
    elemento: "Conhecimento",
    circulo: 2,
    custoBase: 3,
    alcance: "Pessoal",
    alvo: "círculo com 90m de raio",
    desc: "Este ritual pode encontrar uma pessoa ou objeto a sua escolha. Você pode pensar em termos gerais (“um policial”, “algo de metal”) ou específicos (“A delegada Joana”, “uma pistola”). O ritual indica a direção e distância da pessoa ou objeto mais próximo desse tipo, caso esteja ao alcance. Você pode movimentar-se para continuar procurando. Procurar algo muito específico (“a chave do armazém 4 no porto”) exige que você tenha em mente uma imagem precisa do objeto; caso a imagem não seja parecida com a verdade, o ritual falha, mas você gasta os PE mesmo assim. Este ritual pode ser bloqueado por uma fina camada de chumbo.",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): muda o alcance para “toque”, o alvo para “1 pessoa” e a duração para “1 hora”. Em vez do normal, a pessoa tocada descobre o caminho mais direto para entrar ou sair de um lugar. Assim, o ritual pode ser usado para descobrir a rota até o relicário de uma catedral ou a saída mais próxima de uma caverna (mas não para encontrar a localização de uma pessoa ou objeto; funciona apenas em relação a lugares). Caso a pessoa demore mais de uma hora para percorrer o caminho, o conhecimento se perde.",
    },
    verdadeiro: {
      custoExtra: 7,
      desc: "Verdadeiro (+7 PE): aumenta a área para círculo de 1km de raio. Requer 4º círculo.",
    },
  },
  {
    nome: "Luz",
    elemento: "Energia",
    circulo: 1,
    custoBase: 1,
    alcance: "Curto",
    alvo: "1 objeto",
    desc: "O alvo emite luz de cores alternadas e brilhantes (mas não produz calor) em uma área com 9m de raio. O objeto pode ser guardado (em um bolso, por exemplo) para interromper a luz, que voltará a funcionar caso o objeto seja revelado. Se o alvo for um objeto em posse de uma pessoa involuntária, ela tem direito a um teste de Vontade para anular o efeito.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): muda o alcance para longo e o efeito para 4 esferas brilhantes. Cria esferas flutuantes de pura luz com 10cm de diâmetro, que você pode posicionar onde quiser dentro do alcance. Você pode enviar uma esfera à frente, outra para trás, outra para cima e manter uma perto de você, por exemplo. Uma vez por rodada, você pode mover as esferas com uma ação livre. Cada esfera ilumina uma área de 6m de raio, mas não produz calor. Se uma esfera ocupar o espaço de um ser, ele fica ofuscada e sua silhueta pode ser vista claramente (ela não recebe camuflagem por escuridão ou invisibilidade). Requer 2º círculo.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): a luz é cálida como a do sol. Dentro da área seus aliados recebem +1d20 em testes de Vontade, e seus inimigos ficam ofuscados. Requer 3º círculo.",
    },
  },
  {
    nome: "Medo Tangível",
    elemento: "Medo",
    circulo: 4,
    custoBase: 10,
    alcance: "Pessoal",
    alvo: "você",
    desc: "O ritual transforma seu corpo em uma manifestação do Medo, tornando-o imune a efeitos mundanos. Você fica imune às condições atordoado, cego, debilitado, enjoado, envenenado, exausto, fatigado, fraco, lento, ofuscado e paralisado, além de doenças e venenos, e não sofre dano adicional por acertos críticos e ataques furtivos. Além disso, dano do tipo balístico, corte, impacto ou perfuração não podem reduzir seu total de pontos de vida abaixo de 1, tornando-o virtualmente imortal contra efeitos mundanos.",
  },
  {
    nome: "Mergulho Mental",
    elemento: "Conhecimento",
    circulo: 3,
    custoBase: 6,
    alcance: "Toque",
    alvo: "1 pessoa",
    desc: "Você mergulha nos pensamentos do alvo para descobrir informações sobre ele. Durante o mergulho, você fica desprevenido. No início de cada turno seu que estiver sustentando o efeito e tocando o alvo, ele deve fazer um teste de Vontade. Se falhar, deve responder uma pergunta sua que possa ser respondida com “sim” ou “não”, sendo incapaz de mentir. O que você descobre depende das suas perguntas e do mestre: talvez você não descubra tudo que há para saber, mas pode ganhar pistas para continuar a investigação.",
    verdadeiro: {
      custoExtra: 4,
      desc: "Verdadeiro (+4 PE): muda a execução para 1 dia, o alcance para ilimitado e adiciona como componente ritualístico uma cuba de ouro cheia d’água e uma máscara (acessório de categoria II). Você pode realizar o mergulho mental à distância, submergindo seu rosto mascarado na água enquanto mentaliza o alvo. Para que esse ritual funcione, você precisa ter alguma informação sobre o alvo, como nome completo, e um objeto pessoal ou fotografia. Requer 4º círculo.",
    },
  },
  {
    nome: "Miasma Entrópico",
    elemento: "Morte",
    circulo: 2,
    custoBase: 3,
    alcance: "Médio",
    alvo: "nuvem com 6m de raio",
    desc: "Cria uma explosão de emanações tóxicas. Seres na área sofrem 4d8 pontos de dano químico e ficam enjoados por 1 rodada. Se passarem na resistência, sofrem metade do dano e não ficam enjoados.",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): muda o dano para 6d8 de Morte.",
    },
    verdadeiro: {
      custoExtra: 7,
      desc: "Verdadeiro (+7 PE): como a versão discente, mas muda a duração para 3 rodadas. Um ser que inicie seu turno dentro da área sofre o dano novamente. Requer 3º círculo.",
    },
  },
  {
    nome: "Nuvem de Cinzas",
    elemento: "Morte",
    circulo: 1,
    custoBase: 1,
    alcance: "Curto",
    alvo: "nuvem com 6m de raio e 6m de altura",
    desc: "Uma nuvem de fuligem espessa eleva-se de um ponto a sua escolha, obscurecendo toda a visão — seres a até 1,5m têm camuflagem leve e seres a partir de 3m têm camuflagem total. Um vento forte dispersa a nuvem em 4 rodadas e um vendaval a dispersa em 1 rodada. A nuvem não funciona sob a água.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): você pode escolher seres no alcance ao conjurar o ritual; eles enxergam através do efeito. Requer 2º círculo.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): além do normal, a nuvem fica espessa, quase sólida. Qualquer ser dentro dela tem seu deslocamento reduzido para 3m (independente de seu deslocamento normal) e sofre –2 em testes de ataque. Requer 3º círculo.",
    },
  },
  {
    nome: "Ódio Incontrolável",
    elemento: "Sangue",
    circulo: 1,
    custoBase: 1,
    alcance: "Toque",
    alvo: "1 pessoa",
    desc: "O alvo entra em um frenesi, aumentando sua agressividade e capacidade de luta. Ele recebe +2 em testes de ataque e rolagens de dano corpo a corpo e resistência a balístico, corte, impacto e perfuração 5. Enquanto o efeito durar, o alvo não pode fazer nenhuma ação que exige calma e concentração (como usar a perícia Furtividade ou conjurar rituais), e deve sempre atacar um alvo em sua rodada, mesmo que seja um aliado se ele for o único a seu alcance.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): além do normal, sempre que o alvo usar a ação agredir, pode fazer um ataque corpo a corpo adicional contra o mesmo alvo.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): muda o bônus de ataque e dano para +5 e o alvo passa a sofrer apenas metade do dano dos tipos balístico, corte, impacto e perfuração. Requer 3º círculo e afinidade.",
    },
  },
  {
    nome: "Ouvir os Sussurros",
    elemento: "Conhecimento",
    circulo: 1,
    custoBase: 1,
    alcance: "Pessoal",
    alvo: "você",
    desc: "O ritual conecta você com os sussurros, memórias ecoadas pelo Outro Lado, que você pode consultar para receber conhecimento proibido em relação a uma ação que tomará em breve. Ao usar este ritual, faça uma pergunta sobre um evento que você está prestes a fazer (na mesma cena) que possa ser respondida com “sim” ou “não”. O mestre rola 1d6 em segredo; com um resultado de 2 a 6, o ritual funciona e você recebe sua resposta, que pode ser “sim”, “não” ou “sim e não”.\nCom um resultado 1, o ritual falha e oferece o resultado “não”. Não há como saber se esse resultado foi dado porque o ritual falhou ou não. Lançar este ritual múltiplas vezes sobre o mesmo assunto gera sempre o primeiro resultado.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): muda a execução para 1 minuto. Em vez do normal, você pode consultar os ecos fazendo uma pergunta sobre um evento que poderá acontecer até um dia no futuro. O mestre rola a chance de falha; com um resultado de 2 a 6, você recebe uma resposta, desde uma simples frase até uma profecia ou enigma. Em geral, este uso oferece pistas, indicando um caminho a tomar para descobrir a resposta que se procura. Numa falha você não recebe resposta alguma. Requer 2º círculo.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): muda a execução para 10 minutos e a duração para 5 rodadas. Em vez do normal, você consulta os ecos, podendo fazer uma pergunta por rodada, desde que ela possa ser respondida com “sim”, “não” ou “ninguém sabe”. O mestre rola a chance de falha para cada pergunta. Em caso de falha, a resposta também é “ninguém sabe”. Requer 3º círculo.",
    },
  },
  {
    nome: "Paradoxo",
    elemento: "Morte",
    circulo: 2,
    custoBase: 3,
    alcance: "Médio",
    alvo: "esfera com 6m de raio",
    desc: "O ritual cria uma poderosa implosão de distorção temporal contraditória, causando 6d6 pontos de dano de Morte em todos os seres na área.",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): muda a área para efeito: esfera de 1,5 m de diâmetro e a duração para cena. Em vez do normal, cria uma esfera de emanações espirais sibilantes com 1,5m de diâmetro que causa 4d6 pontos de dano de Morte a qualquer ser no mesmo espaço. Você pode gastar uma ação de movimento para fazer a esfera voar 9m em qualquer direção. Um ser só pode sofrer dano da esfera uma vez por rodada.",
    },
    verdadeiro: {
      custoExtra: 7,
      desc: "Verdadeiro (+7 PE): muda o dano para 13d6. Seres reduzidos a 0 PV pelo dano do Paradoxo devem fazer um teste de Fortitude. Se falharem, são reduzidos a cinzas (morrem imediatamente). Requer 4º círculo.",
    },
  },
  {
    nome: "Perturbação",
    elemento: "Conhecimento",
    circulo: 1,
    custoBase: 1,
    alcance: "Curto",
    alvo: "1 pessoa",
    desc: "Você dá uma ordem que o alvo deve ser capaz de ouvir (mas não precisa entender). Se falhar na resistência, ele deve obedecer à ordem em seu próprio turno da melhor maneira possível. Escolha um dos efeitos.\nFuja: O alvo gasta seu turno tentando se afastar de você (usando todas as suas ações).\nLargue: O alvo solta quaisquer itens que esteja segurando e não pode pegá-los de volta até o início de seu próximo turno. Como esta é uma ação livre, ele ainda pode executar outras ações (exceto pegar aquilo que largou).\nPare: O alvo fica pasmo (não pode realizar ações, só reações).\nSente-se: Com uma ação livre, o alvo se senta no chão (se estava pendurado ou voando, desce até o chão). Ele pode fazer outras ações, mas não se levantar até o início de seu próximo turno.\nVenha: O alvo gasta seu turno se aproximando de você (usando todas as suas ações).",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): muda o alvo para “1 ser” e adiciona o seguinte comando: “Sofra. O alvo é acometido de dor aguda. Ele sofre 3d8 pontos de dano de Conhecimento e fica abalado por uma rodada”.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): muda o alvo para “até 5 seres” ou adiciona o seguinte comando: “Ataque. O alvo deve fazer a ação agredir contra um outro alvo a sua escolha em alcance médio, com todas as suas capacidades”. Requer 3º círculo e afinidade.",
    },
  },
  {
    nome: "Poeira da Podridão",
    elemento: "Morte",
    circulo: 3,
    custoBase: 6,
    alcance: "Médio",
    alvo: "nuvem com 6m de raio",
    desc: "Você manifesta uma nuvem de poeira que apodrece os seres na área. Ao conjurar o ritual, e no início de cada um de seus turnos, seres e objetos na área sofrem 4d8 pontos de dano de Morte (Fortitude reduz à metade). Alvos que falharem no teste também não podem recuperar PV de nenhuma forma por uma rodada.",
    verdadeiro: {
      custoExtra: 4,
      desc: "Verdadeiro (+4 PE): muda o dano para 4d8+16.",
    },
  },
  {
    nome: "Polarização Caótica",
    elemento: "Energia",
    circulo: 1,
    custoBase: 1,
    alcance: "Curto",
    alvo: "você",
    desc: "Você gera uma aura magnética sobrenatural. Escolha um dos efeitos a seguir.\nAtrair: você pode usar uma ação de movimento para puxar um objeto metálico de espaço 2 ou menor dentro do alcance. Se o objeto estiver livre, voa para suas mãos (caso tenha mãos livres para apanhá-lo) ou para seus pés.\nRepelir: você repele objetos de espaço 2 ou menor (o que envolve quase todos os projéteis e armas de arremesso), recebendo resistência a balístico, corte, impacto e perfuração 5.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): muda a duração para instantânea. nesta versão a energia magnética é expelida de uma única vez e arremessa até 10 objetos, ou um total de 10 espaços, o que for menor. Os objetos devem estar a até 3m uns dos outros. Objetos arremessados podem atingir seres em seu caminho, causando de 1 ponto de dano de impacto por espaço (objetos macios, sem pontas ou sem fio) até 1d6 pontos de dano por espaço (objetos duros, pontudos ou afiados). Seres atingidos têm direito a um teste de Reflexos para reduzir o dano à metade. Seres dentro da capacidade de carga do efeito podem ser arremessados, mas têm direito a um teste de Vontade para evitar o efeito (em si mesmos ou em objetos que estejam segurando). Um ser arremessado contra uma superfície sólida sofre 1d6 pontos de dano de impacto para cada 3m que “voou” no deslocamento (incluindo outros seres; nesse caso, ambos sofrem o dano).",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): muda o alcance para médio e a duração para instantânea. Você pode usar uma ação de movimento para fazer com que a força magnética levite e mova um ser ou objeto de espaço 10 ou menor por até 9m em qualquer direção dentro do alcance. Um ser pode anular o efeito sobre ele, ou sobre um objeto que possua, passando num teste de Vontade. O alvo cai no chão se sair do alcance ou o efeito terminar.",
    },
  },
  {
    nome: "Possessão",
    elemento: "Conhecimento",
    circulo: 4,
    custoBase: 10,
    alcance: "longo",
    alvo: "1 pessoa viva ou morta",
    desc: "Você projeta sua consciência no corpo de uma pessoa viva ou morta. Enquanto possuir o alvo, você assume o controle total do corpo dele (se o alvo estiver vivo, a consciência dele troca de lugar com a sua, ficando inerte dentro do seu corpo desacordado). Em termos de jogo, você continua usando a sua ficha, mas com os atributos físicos (Agilidade, Força e Vigor) e deslocamento do alvo. Se o alvo passar no teste de resistência, sabe que você tentou possuí-lo e fica imune a este ritual por um dia. Caso qualquer um dos envolvidos no ritual morra, a mente sobrevivente ficará permanentemente presa no corpo novo, a não ser que use o ritual outra vez para voltar a seu corpo antigo. Retornar para o seu corpo voluntariamente é uma ação livre.",
  },
  {
    nome: "Presença do Medo",
    elemento: "Medo",
    circulo: 4,
    custoBase: 10,
    alcance: "Pessoal",
    alvo: "emanação de 9m de raio",
    desc: "Você se torna um receptáculo para o Medo puro, emanando ondas de pavor e ruína. Alvos dentro da área no momento da conjuração ou no início de cada um de seus turnos são acometidos por sofrimento intenso e sofrem 5d8 de dano mental e 5d8 de dano de Medo (Vontade reduz ambos à metade). Alvos que falharem no teste ficam atordoados por uma rodada (este efeito funciona apenas uma vez por cena).",
  },
  {
    nome: "Proteção contra Rituais",
    elemento: "Medo",
    circulo: 2,
    custoBase: 3,
    alcance: "Toque",
    alvo: "1 ser",
    desc: "Você canaliza uma aura de Medo puro, que protege o alvo contra efeitos paranormais. O alvo recebe resistência a dano paranormal 5 e +5 em testes de resistência contra rituais e habilidades de criaturas paranormais.",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): muda o alvo para até 5 seres tocados. Requer 3º círculo.",
    },
    verdadeiro: {
      custoExtra: 6,
      desc: "Verdadeiro (+6 PE): muda o alvo para até 5 seres tocados, a resistência a dano para 10 e o bônus em testes de resistência para +10. Requer 4º círculo.",
    },
  },
  {
    nome: "Purgatório",
    elemento: "Sangue",
    circulo: 3,
    custoBase: 6,
    alcance: "Curto",
    alvo: "área de 6m de raio",
    desc: "Você faz brotar uma poça de sangue pegajoso na área afetada. Inimigos na área se tornam vulneráveis a dano balístico, de corte, de impacto e de perfuração. Um alvo que tente sair da área é acometido de uma dor terrível; sofre 6d6 pontos de dano de Sangue e deve fazer um teste de Fortitude. Se passar, consegue sair. Se falhar, a dor faz com que não consiga se mover e perca a ação de movimento.",
  },
  {
    nome: "Rejeitar Névoa",
    elemento: "Medo",
    circulo: 2,
    custoBase: 3,
    alcance: "Curto",
    alvo: "nuvem de 6m de raio",
    desc: "Você manifesta um leve redemoinho de névoa que se movimenta suavemente dentro da área. Rituais conjurados dentro da área têm seu custo aumentado em +2 PE por círculo e sua execução aumentada em um passo (de livre para movimento, de movimento para padrão, de padrão para completa, de completa para duas rodadas). Rejeitar a Névoa anula os efeitos de Cinerária, a menos que o conjurador de Cinerária use uma ação completa por rodada para manter o ritual ativo, neutralizando o efeito dos dois rituais.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): além do normal, a DT de testes de resistência contra rituais realizados na área diminui em –5.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): como discente, e o dano causado dentro da névoa por rituais é sempre mínimo.",
    },
  },
  {
    nome: "Salto Fantasma",
    elemento: "Energia",
    circulo: 3,
    custoBase: 6,
    alcance: "Médio",
    alvo: "você",
    desc: "Seu corpo se transforma momentaneamente em Energia pura e viaja até outro ponto. Você não precisa perceber nem ter linha de efeito ao seu destino, podendo apenas imaginá-lo, desde que já tenha observado o local de alguma forma (em pessoa, por fotografia, por vídeo…). Por exemplo, pode se transportar 3m adiante para ultrapassar uma porta fechada. Uma vez transportado, você não pode agir pelo resto do seu turno. Este ritual não permite que você apareça dentro de um corpo sólido; se o ponto de chegada não tem espaço livre, você ressurge na área vazia mais próxima.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): muda a execução para reação. Em vez do normal, você salta para um espaço adjacente (1,5m), recebendo +10 na Defesa e em testes de Reflexos contra um ataque ou efeito que esteja prestes a atingi-lo.",
    },
    verdadeiro: {
      custoExtra: 4,
      desc: "Verdadeiro (+4 PE): muda o alcance para longo e o alvo para você e até dois outros seres voluntários que você esteja tocando.",
    },
  },
  {
    nome: "Sopro do Caos",
    elemento: "Energia",
    circulo: 2,
    custoBase: 3,
    alcance: "Médio",
    alvo: "varia",
    desc: "Você altera os movimentos de massas de ar de forma caótica. Ao conjurar o ritual, escolha um dos efeitos abaixo.\nAscender: cria uma corrente de ar ascendente capaz de erguer do chão um ser ou objeto Médio, fazendo o alvo flutuar para cima e para baixo conforme sua vontade. Você pode gastar uma ação de movimento para subir ou descer o alvo até 6m por rodada, até um máximo de 30m de altura. Você não pode mover o alvo horizontalmente — mas o alvo pode, por exemplo, escalar uma colina ou se apoiar no teto para mover-se para os lados (com metade de seu deslocamento normal). Um ser levitando fica vulnerável. Alvos involuntários têm direito a um teste de Fortitude no início de cada um de seus turnos para encerrar o efeito. Derrubar um alvo flutuando (simplesmente parando a corrente de ar) causa o dano normal de queda, mas um alvo que passe no teste pode “nadar” para o chão contra a corrente. Você pode usar essa opção para fazer uma manobra derrubar contra um alvo voador dentro do alcance, usando Ocultismo em vez de Luta.\nSopro: cria uma lufada de vento a partir de suas mãos, que empurra qualquer alvo Médio ou menor, em um cone de 4,5m — faça uma manobra empurrar usando Ocultismo em vez de Luta, usando uma mesma rolagem sua para todos os alvos. A lufada de vento também faz qualquer coisa que um vento forte e súbito faria, como levantar pó, dispersar vapores, apagar chamas, espalhar papéis ou mover uma embarcação. Manter o sopro ativo exige uma ação padrão no seu turno.\nVento: cria uma área de vento forte (página 291) dentro do alcance. Se conjurada numa área que já esteja com algum efeito de vento, aumenta esse efeito em um passo. Manter o vento ativo requer uma ação de movimento. Você também pode usar essa opção para reduzir os efeitos de vento em uma área.",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): passa a afetar alvos Grandes.",
    },
    verdadeiro: {
      custoExtra: 9,
      desc: "Verdadeiro (+9 PE): passa a afetar alvos Enormes.",
    },
  },
  {
    nome: "Tecer Ilusão",
    elemento: "Conhecimento",
    circulo: 1,
    custoBase: 1,
    alcance: "Médio",
    alvo: "ilusão que se estende a até 4 cubos de 1,5m",
    desc: "Este ritual cria uma ilusão visual (uma pessoa, uma parede…) ou sonora (um grito de socorro, um uivo assustador…). O ritual cria apenas imagens ou sons simples, com volume equivalente à voz de uma pessoa para cada cubo de 1,5m no efeito. Não é possível criar cheiros, texturas ou temperaturas, nem sons complexos, como uma música ou diálogo. Seres e objetos atravessam uma ilusão sem sofrer dano, mas o ritual pode, por exemplo, esconder uma armadilha ou emboscada. A ilusão é dissipada se você sair do alcance.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): muda o efeito para até 8 cubos de 1,5m e a duração para sustentada. Você pode criar ilusões de imagem e som combinados, e pode criar sons complexos, odores e sensações térmicas. Também pode criar sensações táteis, como texturas; objetos ainda atravessam a ilusão, mas seres não conseguem atravessá-la sem passar em um teste de Vontade. A cada rodada, você pode usar uma ação livre para mover a imagem ou alterar o som, como aumentar o volume ou fazer com que pareça se afastar ou se aproximar, ainda dentro dos limites do efeito. Você pode, por exemplo, criar a ilusão de um fantasma que anda pela sala, controlando seus movimentos. A ilusão ainda é incapaz de causar ou sofrer dano. Quando você para de sustentar o ritual, a imagem ou som persiste por mais uma rodada antes do ritual se dissipar. Requer 2º círculo.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): você cria a ilusão de um perigo mortal. Quando o ritual é conjurado, e no início de cada um de seus turnos, um alvo interagindo com a ilusão deve fazer um teste de Vontade; se falhar, acredita que a ilusão é real e sofre 6d6 pontos de dano de Conhecimento. O alvo racionaliza o efeito sempre que falha no teste (por exemplo, acredita que o mesmo teto pode cair sobre ele várias vezes). Se um alvo passar em dois testes de Vontade seguidos, o efeito é anulado para ele. Requer 3º círculo.",
    },
  },
  {
    nome: "Tela de Ruído",
    elemento: "Energia",
    circulo: 2,
    custoBase: 3,
    alcance: "Pessoal",
    alvo: "você",
    desc: "Este ritual cria uma película de Energia que recobre seu corpo e absorve energia cinética. Você recebe 30 PV temporários, mas apenas contra dano balístico, de corte, de impacto ou de perfuração. Alternativamente, você pode conjurar este ritual como uma reação quando sofrer dano, recebendo resistência 15 apenas contra esse dano.",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): aumenta os PV temporário para 60 e a resistência para 30.",
    },
    verdadeiro: {
      custoExtra: 7,
      desc: "Verdadeiro (+7 PE): muda o alcance para curto e o alvo para 1 ser ou objeto Enorme ou menor. Em vez do normal, cria uma esfera imóvel e tremeluzente com o tamanho do alvo e centrada nele. Nenhum ser, objeto ou efeito de dano pode passar pela esfera, embora seres possam respirar normalmente dentro dela. O alvo tem direito a um teste de Reflexos para evitar ser aprisionado. Requer 4º círculo.",
    },
  },
  {
    nome: "Teletransporte",
    elemento: "Energia",
    circulo: 4,
    custoBase: 10,
    alcance: "Toque",
    alvo: "até 5 seres voluntários",
    desc: "O ritual transforma o corpo e equipamento dos alvos em energia pura e os faz reaparecer num lugar a sua escolha a até 1.000km. Quando conjura este ritual, você precisa fazer um teste de Ocultismo, com DT definida pelo seu conhecimento sobre o destino.\nDT 25. Um lugar que você visita com frequência.\nDT 30. Um lugar que você já visitou pelo menos uma vez.\nDT 35. Um lugar que você nunca visitou e só conhece a partir da descrição de outra pessoa que esteve lá.\nVocê não pode se teletransportar para um lugar que nunca visitou sem a descrição de alguém. Ou seja, não pode se transportar para “o local onde Júlia está presa” se nunca esteve lá nem falou com alguém que esteve.\nSe passar no teste, os alvos chegam ao lugar desejado. Se falhar, você chega em um lugar parecido, mas errado ou distante (até 1d10 x 10 km). Se você falhar por 5 ou mais, o ritual falha, mas você gasta PE normalmente e fica atordoado por 1d4 rodadas.",
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): pode se teletransportar para qualquer local na Terra.",
    },
  },
  {
    nome: "Tentáculos de Lodo",
    elemento: "Morte",
    circulo: 3,
    custoBase: 6,
    alcance: "Médio",
    alvo: "círculo com 6m de raio",
    desc: "Uma fenda sombria se abre no chão, de onde surgem tentáculos feitos de Lodo da Morte. Ao conjurar o ritual e no início de cada um de seus turnos, você faz um teste da manobra agarrar (usando Ocultismo em vez de Luta) contra cada alvo na área. Se você vencer, o ser é agarrado; se já estava agarrado, é esmagado, sofrendo 4d6 pontos de dano (metade impacto, metade Morte). A área do ritual conta como terreno difícil. Os tentáculos são imunes a dano.",
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): aumenta o raio da área para 9m e aumenta o dano dos tentáculos para 6d6.",
    },
  },
  {
    nome: "Terceiro Olho",
    elemento: "Conhecimento",
    circulo: 1,
    custoBase: 1,
    alcance: "Pessoal",
    alvo: "você",
    desc: "Seus olhos se enchem de sigilos e você passa a enxergar auras paranormais em alcance longo. Rituais, itens amaldiçoados e criaturas emitem auras. Você sabe o elemento da aura e seu poder aproximado — rituais de 1º círculo e criaturas de VD até 80 emitem uma aura fraca; rituais de 2º e 3º círculos e criaturas de VD entre 81 e 280 emitem uma aura moderada, e rituais de 4º círculo e criaturas de VD 281 ou maior emitem uma aura poderosa.\nAlém disso, você pode gastar uma ação de movimento para descobrir se um ser que possa ver em alcance médio tem poderes paranormais ou se é capaz de conjurar rituais e de quais elementos.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): muda a duração para 1 dia.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): também pode enxergar objetos e seres invisíveis, que aparecem como formas translúcidas.",
    },
  },
  {
    nome: "Transfigurar Água",
    elemento: "Energia",
    circulo: 3,
    custoBase: 6,
    alcance: "Longo",
    alvo: "esfera com 30m de raio",
    desc: "Você canaliza Energia sobre um corpo de água, para que ele adquira movimentos e comportamentos paranormais e caóticos. Ao conjurar o ritual, escolha um dos seguintes efeitos.\nCongelar: toda a água mundana na área é congelada. Seres nadando na área ficam imóveis; escapar exige gastar uma ação padrão e passar num teste de Atletismo (DT igual a do ritual).\nDerreter: gelo mundano na área vira água e o ritual termina. A critério do mestre, isso pode criar terreno difícil.\nEnchente: eleva o nível da água mundana na área em até 4,5m. A sua escolha, muda área para “alvo: uma embarcação”. O alvo recebe +6m em seu deslocamento pela duração do efeito.\nEvaporar: toda a água e gelo mundano na área evaporam instantaneamente e o ritual termina. Qualquer ser vivo na área sofre 5d8 de dano de Energia (Fortitude reduz à metade).\nPartir: diminui o nível de toda água mundana na área em até 4,5m. Em um corpo d’água raso, isso abre um caminho seco, que pode ser atravessado a pé. Em um corpo d’água profundo, cria um redemoinho que pode prender barcos (um teste de Pilotagem com DT igual à do ritual permite ao piloto livrar a embarcação).",
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): aumenta o deslocamento de enchente para +12m e o dano de evaporar para 10d8.",
    },
  },
  {
    nome: "Transfigurar Terra",
    elemento: "Energia",
    circulo: 3,
    custoBase: 6,
    alcance: "Longo",
    alvo: "9 cubos com 1,5m de lado",
    desc: "Você imbui terra, pedra, lama, argila ou areia na área com Energia, gerando efeitos sobrenaturais e caóticos. Ao conjurar o ritual, escolha um dos seguintes efeitos.\nAmolecer: se afetar o teto, uma coluna ou suporte, provoca um desabamento que causa 10d6 pontos de dano de impacto aos seres na área (Reflexos reduz à metade). Se afetar um piso de terra ou pedra, cria terreno difícil de areia ou argila, respectivamente.\nModelar: pode usar pedra ou argila para criar um ou mais objetos simples de tamanho Enorme ou menor (sem mecanismos ou partes móveis). Por exemplo, pode transformar um tijolo em um martelo, criar uma passagem onde antes havia apenas uma parede ou levantar uma ou mais paredes que oferecem cobertura total (RD 8 e 50 PV para cada 3m).\nSolidificar: transforma lama ou areia em terra ou pedra. Seres com os pés na superfície ficam agarrados. Eles podem se soltar com uma ação padrão e um teste de Atletismo (DT igual a do ritual).",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): muda a área para 15 cubos com 1,5m de lado.",
    },
    verdadeiro: {
      custoExtra: 7,
      desc: "Verdadeiro (+7 PE): também afeta todos os tipos de minerais e metais. Requer 4º círculo.",
    },
  },
  {
    nome: "Transfusão Vital",
    elemento: "Sangue",
    circulo: 2,
    custoBase: 3,
    alcance: "Toque",
    alvo: "1 ser",
    desc: "Você toca outro ser e transfere sua própria energia vital para ele, podendo perder até 30 pontos de vida para que o alvo recupere a mesma quantidade em PV. Você não pode ficar com menos de 1 PV por causa desse ritual.",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): Você pode transferir até 50 pontos de vida. Requer 3º círculo.",
    },
    verdadeiro: {
      custoExtra: 7,
      desc: "Verdadeiro (+7 PE): Você pode transferir até 100 pontos de vida. Requer 4º círculo.",
    },
  },
  {
    nome: "Velocidade Mortal",
    elemento: "Morte",
    circulo: 2,
    custoBase: 3,
    alcance: "Curto",
    alvo: "1 ser",
    desc: "Você distorce a passagem do tempo ao redor do alvo, tornando-o extremamente veloz. O alvo pode realizar uma ação de movimento adicional por turno. Esta ação não pode ser usada para conjurar rituais.",
    discente: {
      custoExtra: 3,
      desc: "Discente (+3 PE): em vez de uma ação de movimento, o alvo recebe uma ação padrão adicional por turno.",
    },
    verdadeiro: {
      custoExtra: 7,
      desc: "Verdadeiro (+7 PE): muda o alvo para “alvos escolhidos”. Requer 4º círculo e afinidade.",
    },
  },
  {
    nome: "Vidência",
    elemento: "Conhecimento",
    circulo: 3,
    custoBase: 6,
    alcance: "ilimitado",
    alvo: "1 ser",
    desc: "Através de uma superfície reflexiva, como um espelho, uma bacia de água ou mesmo uma TV desligada, você pode ver e ouvir um ser escolhido e seus arredores (cerca de 6m em qualquer direção). O alvo pode estar a qualquer distância, mas tem direito a um teste de resistência no início de cada um de seus turnos para impedir a Vidência naquele turno. Se o alvo passar em dois testes seguidos, o ritual é encerrado e o alvo fica imune a ele por uma semana. Para esse ritual funcionar, você precisa ter alguma informação sobre o alvo, como seu nome ou uma foto. Dependendo do conhecimento que você tiver dele, o alvo recebe bônus ou penalidades em seu teste de resistência.\n- Você sabe o mínimo sobre o alvo: +10.\n- Você possui algumas informações sobre o alvo (idade, profissão…) ou já o viu pessoalmente: +5.\n- Você conhece bem o alvo: -0.\n- Você tem um pertence pessoal ou roupa do alvo: -5.\n- Você tem uma parte do corpo do alvo (unhas, cabelos…): -10.",
  },
  {
    nome: "Vínculo de Sangue",
    elemento: "Sangue",
    circulo: 4,
    custoBase: 10,
    alcance: "Curto",
    alvo: "1 ser",
    desc: "Você manifesta um símbolo de Sangue no seu corpo e no corpo do alvo. Sempre que você sofrer dano, o alvo deve fazer um teste de Fortitude. Se ele falhar, você sofre apenas metade do dano e ele sofre a metade restante.\nVocê pode conjurar o ritual com efeito inverso, fazendo com que você receba metade de todo o dano que o alvo receberia. Alvos voluntários não precisam fazer testes de resistência.",
  },
  {
    nome: "Vomitar Pestes",
    elemento: "Sangue",
    circulo: 3,
    custoBase: 6,
    alcance: "Médio",
    alvo: "1 enxame Grande (quadrado de 3m)",
    desc: "Você vomita um enxame de pequenas criaturas de Sangue, que surge em um ponto adjacente a sua escolha. O enxame pode passar pelo espaço de outros seres e não impede que outros seres entrem no espaço dele. No final de cada um de seus turnos, o enxame causa 5d12 pontos de dano de sangue a qualquer ser no espaço dele (Reflexos reduz à metade). Você pode gastar uma ação de movimento para mover o enxame com deslocamento de 12m.",
    discente: {
      custoExtra: 2,
      desc: "Discente (+2 PE): além do normal, um alvo que falhe no teste de Reflexos fica agarrado (o enxame escala e cobre o corpo dele). O alvo pode gastar uma ação padrão e fazer um teste de Acrobacia ou Atletismo para escapar. Se você mover o enxame, o alvo fica livre.",
    },
    verdadeiro: {
      custoExtra: 5,
      desc: "Verdadeiro (+5 PE): o enxame vira Enorme (cubo de 6m de lado) e ganha deslocamento de voo 18m.",
    },
  },
  {
    nome: "Zerar Entropia",
    elemento: "Morte",
    circulo: 3,
    custoBase: 6,
    alcance: "Curto",
    alvo: "1 pessoa",
    desc: "Você zera completamente a entropia do alvo em relação ao ambiente, deixando-o paralisado. Se passar na resistência, em vez disso fica lento. No início de cada um de seus turnos, o alvo pode gastar uma ação completa para fazer um novo teste de Vontade. Se passar, encerra o efeito.",
    discente: {
      custoExtra: 4,
      desc: "Discente (+4 PE): muda o alvo para “1 ser”. Requer 4º círculo.",
    },
    verdadeiro: {
      custoExtra: 11,
      desc: "Verdadeiro (+11 PE): muda o alvo para “seres escolhidos”. Requer 4º círculo e afinidade.",
    },
  },
];

// 👇 CATÁLOGO DE EQUIPAMENTOS E ARMAS DO LIVRO 👇
const itemsCatalog = [
  // --- ARMAS CORPO A CORPO SIMPLES ---
  {
    nome: "Coronhada",
    cat: 0,
    espacos: 0,
    grupo: "Armas Corpo a Corpo",
    dano: "1d4/1d6",
    critico: "x2",
    tipo: "Impacto",
    desc: "Ataque com a coronha de uma arma.",
  },
  {
    nome: "Faca",
    cat: 0,
    espacos: 1,
    grupo: "Armas Corpo a Corpo",
    dano: "1d4",
    critico: "19",
    alcance: "Curto",
    tipo: "Corte",
    desc: "Uma lâmina afiada, como uma navalha, uma faca de churrasco ou uma faca militar (facas de cozinha pequenas causam apenas 1d3 pontos de dano). É uma arma ágil e pode ser arremessada.",
  },
  {
    nome: "Martelo",
    cat: 0,
    espacos: 1,
    grupo: "Armas Corpo a Corpo",
    dano: "1d6",
    critico: "x2",
    tipo: "Impacto",
    desc: "Esta ferramenta comum pode ser usada como arma na falta de opções melhores.",
  },
  {
    nome: "Punhal",
    cat: 0,
    espacos: 1,
    grupo: "Armas Corpo a Corpo",
    dano: "1d4",
    critico: "x3",
    tipo: "Perfuração",
    desc: "Uma faca de lâmina longa e pontiaguda, usada por cultistas em seus rituais. É uma arma ágil.",
  },
  {
    nome: "Bastão",
    cat: 0,
    espacos: 1,
    grupo: "Armas Corpo a Corpo",
    dano: "1d6/1d8",
    critico: "x2",
    tipo: "Impacto",
    desc: "Um cilindro de madeira maciça. Pode ser um taco de beisebol, um cassetete da polícia, uma tonfa ou apenas uma clava envolta em pregos ou arame farpado. Você pode empunhar um bastão com uma mão (dano 1d6) ou com as duas (dano 1d8).",
  },
  {
    nome: "Machete",
    cat: 0,
    espacos: 1,
    grupo: "Armas Corpo a Corpo",
    dano: "1d6",
    critico: "19",
    tipo: "Corte",
    desc: "Uma lâmina longa e larga, muito usada como ferramenta para abrir trilhas.",
  },
  {
    nome: "Lança",
    cat: 0,
    espacos: 1,
    grupo: "Armas Corpo a Corpo",
    dano: "1d6",
    critico: "x2",
    alcance: "Curto",
    tipo: "Perfuração",
    desc: "Uma haste de madeira com uma ponta metálica afiada, a lança é uma arma arcaica, mas usada ainda hoje por artistas marciais. Pode ser arremessada.",
  },
  {
    nome: "Cajado",
    cat: 0,
    espacos: 2,
    grupo: "Armas Corpo a Corpo",
    dano: "1d6/1d6",
    critico: "x2",
    tipo: "Impacto",
    desc: "Um cabo de madeira ou barra de ferro longos. Inclui o bo usado em artes marciais. É uma arma ágil. Além disso, pode ser usado com Combater com Duas Armas (e poderes similares) para fazer ataques adicionais, como se fosse uma arma de uma mão e uma arma leve.",
  },

  // --- ARMAS CORPO A CORPO TÁTICAS ---
  {
    nome: "Machadinha",
    cat: 0,
    espacos: 1,
    grupo: "Armas Corpo a Corpo",
    dano: "1d6",
    critico: "x3",
    alcance: "Curto",
    tipo: "Corte",
    desc: "Machadinha. Ferramenta útil para cortar madeira, muito comum em fazendas e canteiros de obras. Pode ser arremessada.",
  },
  {
    nome: "Nunchaku",
    cat: 0,
    espacos: 1,
    grupo: "Armas Corpo a Corpo",
    dano: "1d8",
    critico: "x2",
    tipo: "Impacto",
    desc: "Dois bastões curtos de madeira ligados por uma corrente. É uma arma ágil.",
  },
  {
    nome: "Corrente",
    cat: 0,
    espacos: 1,
    grupo: "Armas Corpo a Corpo",
    dano: "1d8",
    critico: "x2",
    tipo: "Impacto",
    desc: "Um pedaço de corrente grossa pode ser usado como uma arma bastante efetiva. A corrente fornece +2 em testes para desarmar e derrubar.",
  },
  {
    nome: "Espada",
    cat: 1,
    espacos: 1,
    grupo: "Armas Corpo a Corpo",
    dano: "1d8/1d10",
    critico: "19",
    tipo: "Corte",
    desc: "Uma arma medieval, como uma espada longa dos cavaleiros europeus ou uma cimitarra sarracena. Você pode empunhar uma espada com uma mão (dano 1d8) ou com as duas (dano 1d10).",
  },
  {
    nome: "Florete",
    cat: 1,
    espacos: 1,
    grupo: "Armas Corpo a Corpo",
    dano: "1d6",
    critico: "18",
    tipo: "Corte",
    desc: "Esta espada de lâmina fina e comprida é usada por esgrimistas. É uma arma ágil.",
  },
  {
    nome: "Machado",
    cat: 1,
    espacos: 1,
    grupo: "Armas Corpo a Corpo",
    dano: "1d8",
    critico: "x3",
    tipo: "Corte",
    desc: "Uma ferramenta importante para lenhadores e bombeiros, um machado pode causar ferimentos terríveis.",
  },
  {
    nome: "Maça",
    cat: 1,
    espacos: 1,
    grupo: "Armas Corpo a Corpo",
    dano: "2d4",
    critico: "x2",
    tipo: "Impacto",
    desc: "Bastão com uma cabeça metálica cheia de protuberâncias.",
  },
  {
    nome: "Acha",
    cat: 1,
    espacos: 2,
    grupo: "Armas Corpo a Corpo",
    dano: "1d12",
    critico: "x3",
    tipo: "Corte",
    desc: "Acha. Um machado grande e pesado, usado no corte de árvores largas.",
  },
  {
    nome: "Gadanho",
    cat: 1,
    espacos: 2,
    grupo: "Armas Corpo a Corpo",
    dano: "2d4",
    critico: "x4",
    tipo: "Corte",
    desc: "Uma ferramenta agrícola, o gadanho é uma versão maior da foice, para uso com as duas mãos. Foi criada para ceifar cereais, mas também pode ceifar vidas.",
  },
  {
    nome: "Katana",
    cat: 1,
    espacos: 2,
    grupo: "Armas Corpo a Corpo",
    dano: "1d10",
    critico: "19",
    tipo: "Corte",
    desc: "Originária do Japão, esta espada longa e levemente curvada transcendeu os séculos. É uma arma ágil. Se você for veterano em Luta pode usá-la como uma arma de uma mão.",
  },
  {
    nome: "Marreta",
    cat: 1,
    espacos: 2,
    grupo: "Armas Corpo a Corpo",
    dano: "3d4",
    critico: "x2",
    tipo: "Impacto",
    desc: "Marreta. Normalmente usada para demolir paredes, também pode ser usada para demolir pessoas. Use estas estatísticas para outras ferramentas de construção civil, como picaretas.",
  },
  {
    nome: "Montante",
    cat: 1,
    espacos: 2,
    grupo: "Armas Corpo a Corpo",
    dano: "2d6",
    critico: "19",
    tipo: "Corte",
    desc: "Enorme e pesada, esta espada de 1,5m de comprimento foi uma das armas mais poderosas em seu tempo.",
  },
  {
    nome: "Motosserra",
    cat: 1,
    espacos: 2,
    grupo: "Armas Corpo a Corpo",
    dano: "3d6",
    critico: "x2",
    tipo: "Corte",
    desc: "Motosserra. Uma ferramenta capaz de causar ferimentos profundos; sempre que rolar um 6 em um dado de dano com uma motosserra, role um dado de dano adicional. Apesar de potente, esta arma é desajeitada e impõe -1d20 nos seus testes de ataque. Ligar uma motosserra gasta uma ação de movimento.",
  },

  // --- ARMAS DE DISPARO ---
  {
    nome: "Arco",
    cat: 0,
    espacos: 2,
    grupo: "Armas de Disparo",
    dano: "1d6",
    critico: "x3",
    alcance: "Médio",
    tipo: "Perfuração",
    desc: "Arco. Um arco e flecha comum, próprio para tiro ao alvo.",
  },
  {
    nome: "Besta",
    cat: 0,
    espacos: 2,
    grupo: "Armas de Disparo",
    dano: "1d8",
    critico: "19",
    alcance: "Médio",
    tipo: "Perfuração",
    desc: "Besta. Esta arma da antiguidade exige uma ação de movimento para ser recarregada a cada disparo.",
  },
  {
    nome: "Arco Composto",
    cat: 1,
    espacos: 2,
    grupo: "Armas de Disparo",
    dano: "1d10",
    critico: "x3",
    alcance: "Médio",
    tipo: "Perfuração",
    desc: "Arco Composto. Este arco moderno usa materiais de alta tensão e um sistema de roldanas para gerar mais pressão. Ao contrário de outras armas de disparo, permite que você aplique seu valor de Força às rolagens de dano.",
  },
  {
    nome: "Balestra",
    cat: 1,
    espacos: 2,
    grupo: "Armas de Disparo",
    dano: "1d12",
    critico: "19",
    alcance: "Médio",
    tipo: "Perfuração",
    desc: "Balestra. Uma besta pesada, capaz de disparos poderosos. Exige uma ação de movimento para ser recarregada a cada disparo.",
  },

  // --- ARMAS DE FOGO ---
  {
    nome: "Pistola",
    cat: 1,
    espacos: 1,
    grupo: "Armas de Fogo",
    dano: "1d12",
    critico: "18",
    alcance: "Curto",
    tipo: "Balístico",
    desc: "Pistola. Uma arma de mão comum entre policiais e militares por ser facilmente recarregável.",
  },
  {
    nome: "Revólver",
    cat: 1,
    espacos: 1,
    grupo: "Armas de Fogo",
    dano: "2d6",
    critico: "19/x3",
    alcance: "Curto",
    tipo: "Balístico",
    desc: "Revólver. A arma de fogo mais comum, e uma das mais confiáveis.",
  },
  {
    nome: "Fuzil de Caça",
    cat: 1,
    espacos: 2,
    grupo: "Armas de Fogo",
    dano: "2d8",
    critico: "19/x3",
    alcance: "Médio",
    tipo: "Balístico",
    desc: "Fuzil de Caça. Esta arma de fogo é bastante popular entre fazendeiros, caçadores e atiradores esportistas.",
  },
  {
    nome: "Submetralhadora",
    cat: 1,
    espacos: 1,
    grupo: "Armas de Fogo",
    dano: "2d6",
    critico: "19/x3",
    alcance: "Curto",
    tipo: "Balístico",
    desc: "Submetralhadora. Esta arma de fogo automática pode ser empunhada com apenas uma mão.",
  },
  {
    nome: "Espingarda",
    cat: 1,
    espacos: 2,
    grupo: "Armas de Fogo",
    dano: "4d6",
    critico: "x3",
    alcance: "Curto",
    tipo: "Balístico",
    desc: "Espingarda. Arma de fogo longa e com cano liso. A espingarda causa apenas metade do dano em alcance médio ou maior.",
  },
  {
    nome: "Fuzil de Assalto",
    cat: 2,
    espacos: 2,
    grupo: "Armas de Fogo",
    dano: "2d10",
    critico: "19/x3",
    alcance: "Médio",
    tipo: "Balístico",
    desc: "Fuzil de Assalto. A arma de fogo padrão da maioria dos exércitos modernos. É uma arma automática.",
  },
  {
    nome: "Fuzil de Precisão",
    cat: 3,
    espacos: 2,
    grupo: "Armas de Fogo",
    dano: "2d10",
    critico: "19/x3",
    alcance: "Longo",
    tipo: "Balístico",
    desc: "Fuzil de Precisão. Esta arma de fogo de uso militar é projetada para disparos longos e precisos. Se for veterano em Pontaria e mirar com um fuzil de precisão (veja a página 87), você recebe +5 na margem de ameaça de seu ataque.",
  },

  // --- ARMAS PESADAS ---
  {
    nome: "Bazuca",
    cat: 3,
    espacos: 2,
    grupo: "Armas Pesadas",
    dano: "10d8",
    critico: "x2",
    alcance: "Médio",
    tipo: "Impacto",
    desc: "Bazuca. Este lança-foguetes foi concebido como uma arma anti-tanques, mas também se mostrou eficaz contra criaturas. A bazuca causa seu dano no alvo atingido e em todos os seres num raio de 3m; esses seres (mas não o alvo atingido diretamente) têm direito a um teste de Reflexos (DT Agi) para reduzir o dano à metade. Você pode disparar o foguete num ponto qualquer em alcance médio, em vez de num ser específico; nesse caso, não precisa rolar ataque e não tem chance de errar (mas também não acerta nenhum ser diretamente). A bazuca exige uma ação de movimento para ser recarregada a cada disparo.",
  },
  {
    nome: "Lança-Chamas",
    cat: 3,
    espacos: 2,
    grupo: "Armas Pesadas",
    dano: "6d6",
    critico: "x2",
    alcance: "Curto",
    tipo: "Fogo",
    desc: "Lança-chamas. Equipamento militar que esguicha líquido inflamável incandescente. Um lança-chamas atinge todos os seres em uma linha de 1,5m de largura com alcance curto, mas não alcança além disso. Faça um único teste de ataque e compare o resultado com a Defesa de todos os seres na área. Além de sofrer dano, seres atingidos ficam em chamas.",
  },
  {
    nome: "Metralhadora",
    cat: 2,
    espacos: 2,
    grupo: "Armas Pesadas",
    dano: "2d12",
    critico: "19/x3",
    alcance: "Médio",
    tipo: "Balístico",
    desc: "Metralhadora. Uma arma de fogo pesada, de uso militar. Para atacar com uma metralhadora, você precisa ter Força 4 ou maior ou gastar uma ação de movimento para apoiá-la em seu tripé ou suporte apropriado; caso contrário, sofre –5 em seus ataques. Uma metralhadora é uma arma automática.",
  },

  // --- PROTEÇÕES ---
  {
    nome: "Proteção Leve",
    cat: 1,
    espacos: 2,
    grupo: "Proteção",
    desc: "Proteção Leve. Jaqueta de couro pesada ou um colete de kevlar. Essa proteção é tipicamente usada por seguranças e policiais.",
  },
  {
    nome: "Proteção Pesada",
    cat: 2,
    espacos: 5,
    grupo: "Proteção",
    desc: "Proteção Pesada. Equipamento usado por forças especiais da polícia e pelo exército. Consiste de capacete, ombreiras, joelheiras e caneleiras, além de um colete com várias camadas de kevlar. Fornece resistência a balístico, corte, impacto e perfuração 2. No entanto, por ser desconfortável e volumosa, impõe -5 em testes de perícias que sofrem penalidade de carga.",
  },
  {
    nome: "Escudo",
    cat: 1,
    espacos: 2,
    grupo: "Proteção",
    desc: "Escudo. Um escudo medieval ou moderno, como aqueles usados por tropas de choque. Precisa ser empunhado em uma mão e fornece Defesa +2. Bônus na Defesa fornecido por um escudo acumula com o de uma proteção. Para efeitos de proficiência e penalidade por não proficiência, escudos contam como proteção pesada.",
  },

  // --- MUNIÇÕES ---
  {
    nome: "Balas Curtas (Pacote)",
    cat: 0,
    espacos: 1,
    grupo: "Munição",
    desc: "Munição básica, usada em pistolas, revólveres e submetralhadoras. Um pacote de balas curtas dura duas cenas.",
  },
  {
    nome: "Balas Longas (Pacote)",
    cat: 1,
    espacos: 1,
    grupo: "Munição",
    desc: "Maior e mais potente, esta munição é usada em fuzis e metralhadoras. Um pacote de balas longas dura uma cena.",
  },
  {
    nome: "Cartuchos (Pacote)",
    cat: 1,
    espacos: 1,
    grupo: "Munição",
    desc: "Usados em espingardas, esses cartuchos são carregados com esferas de chumbo. Um pacote de cartuchos dura uma cena.",
  },
  {
    nome: "Combustível (Pacote)",
    cat: 1,
    espacos: 1,
    grupo: "Munição",
    desc: "Um tanque de combustível para lança-chamas. Dura uma cena.",
  },
  {
    nome: "Flechas (Pacote)",
    cat: 0,
    espacos: 1,
    grupo: "Munição",
    desc: "Usadas em arcos e bestas, flechas podem ser reaproveitadas após cada combate. Por isso, um pacote de flechas dura uma missão inteira.",
  },
  {
    nome: "Foguete",
    cat: 1,
    espacos: 1,
    grupo: "Munição",
    desc: "Disparado por bazucas. Ao contrário de outras munições, cada foguete dura um único disparo, não uma cena. Para fazer vários ataques, você precisará carregar vários foguetes.",
  },

  // --- ACESSÓRIOS ---
  {
    nome: "Kit de Perícia",
    cat: 0,
    espacos: 1,
    grupo: "Acessórios",
    desc: "Um conjunto de ferramentas necessárias para algumas perícias ou usos de perícias. Sem o kit, você sofre –5 no teste. Existe um kit de perícia para cada perícia que exige este item.",
  },
  {
    nome: "Utensílio",
    cat: 1,
    espacos: 1,
    grupo: "Acessórios",
    desc: "Um item comum que tenha uma utilidade específica, como um canivete, uma lupa, um smartphone ou um notebook. Um utensílio fornece +2 em uma perícia (exceto Luta e Pontaria). Utensílios sempre ocupam 1 espaço e precisam ser empunhados para que o bônus seja aplicado.",
  },
  {
    nome: "Vestimenta",
    cat: 1,
    espacos: 1,
    grupo: "Acessórios",
    desc: "Uma peça de vestuário que fornece +2 em uma perícia (exceto Luta ou Pontaria). Você pode receber os bônus de no máximo duas vestimentas ao mesmo tempo. Vestir ou despir uma vestimenta é uma ação completa.",
  },

  // --- EXPLOSIVOS ---
  {
    nome: "Granada de Atordoamento",
    cat: 0,
    espacos: 1,
    grupo: "Explosivos",
    desc: "Também chamadas de flash-bang, por criarem um estouro barulhento e luminoso. Seres na área (6m) ficam atordoados por 1 rodada (Fortitude DT Agi reduz para ofuscado e surdo por uma rodada).",
  },
  {
    nome: "Granada de Fragmentação",
    cat: 1,
    espacos: 1,
    grupo: "Explosivos",
    dano: "8d6",
    alcance: "6m raio",
    tipo: "Perfuração",
    desc: "Espalha fragmentos perfurantes. Seres na área sofrem 8d6 pontos de dano de perfuração (Reflexos DT Agi reduz à metade).",
  },
  {
    nome: "Granada de Fumaça",
    cat: 0,
    espacos: 1,
    grupo: "Explosivos",
    desc: "Produz uma fumaça espessa e escura. Seres na área ficam cegos e sob camuflagem total. A fumaça dura 2 rodadas.",
  },
  {
    nome: "Granada Incendiária",
    cat: 1,
    espacos: 1,
    grupo: "Explosivos",
    dano: "6d6",
    alcance: "6m raio",
    tipo: "Fogo",
    desc: "Espalha labaredas incandescentes. Seres na área sofrem 6d6 pontos de dano de fogo e ficam em chamas (Reflexos DT Agi reduz o dano à metade e evita a condição em chamas).",
  },
  {
    nome: "Mina Antipessoal",
    cat: 1,
    espacos: 1,
    grupo: "Explosivos",
    dano: "12d6",
    alcance: "Cone 6m",
    tipo: "Perfuração",
    desc: "Esta mina é ativada por controle remoto. Se você estiver a até alcance longo dela, pode gastar uma ação padrão para detoná-la. Ao explodir, a mina dispara centenas de bolas de aço em um cone de 6m, causando 12d6 pontos de dano de perfuração em todos os seres na área (Reflexos DT Int reduz à metade). Instalar a mina exige uma ação completa e um teste de Tática contra DT 15.",
  },

  // --- ITENS OPERACIONAIS ---
  {
    nome: "Algemas",
    cat: 0,
    espacos: 1,
    grupo: "Itens Operacionais",
    desc: "Um par de algemas de aço. Para prender uma pessoa que não esteja indefesa você precisa empunhar a algema, agarrar a pessoa e então vencer um novo teste de agarrar contra ela. Você pode prender os dois pulsos da pessoa (–5 em testes que exijam o uso das mãos, impede conjuração). Escapar das algemas exige um teste de Acrobacia contra DT 30.",
  },
  {
    nome: "Arpéu",
    cat: 0,
    espacos: 1,
    grupo: "Itens Operacionais",
    desc: "Um gancho de aço que pode ser amarrado na ponta de uma corda para se fixar em muros, janelas, parapeitos de prédios… Prender um arpéu exige um teste de Pontaria (DT 15). Subir um muro com a ajuda de uma corda fornece +5 no teste de Atletismo.",
  },
  {
    nome: "Bandoleira",
    cat: 1,
    espacos: 1,
    grupo: "Itens Operacionais",
    desc: "Um cinto com bolsos e alças. Uma vez por rodada, você pode sacar ou guardar um item em seu inventário como uma ação livre.",
  },
  {
    nome: "Binóculos",
    cat: 0,
    espacos: 1,
    grupo: "Itens Operacionais",
    desc: "Estes binóculos militares fornecem +5 em testes de Percepção para observar coisas distantes.",
  },
  {
    nome: "Bloqueador de Sinal",
    cat: 1,
    espacos: 1,
    grupo: "Itens Operacionais",
    desc: "Este dispositivo compacto emite ondas que “poluem” a frequência de rádio usada por celulares, impedindo que qualquer aparelho desse tipo em alcance médio se conecte.",
  },
  {
    nome: "Cicatrizante",
    cat: 1,
    espacos: 1,
    grupo: "Itens Operacionais",
    desc: "Um spray contendo um remédio com potente efeito cicatrizante. Você pode gastar uma ação padrão e este item para curar 2d8+2 PV em você ou em um ser adjacente.",
  },
  {
    nome: "Corda",
    cat: 0,
    espacos: 1,
    grupo: "Itens Operacionais",
    desc: "Um rolo com 10 metros de corda resistente. Possui diversas utilidades: pode ajudar a descer um buraco ou prédio (+5 em testes de Atletismo nessas situações), amarrar pessoas inconscientes etc.",
  },
  {
    nome: "Equipamento de Sobrevivência",
    cat: 0,
    espacos: 2,
    grupo: "Itens Operacionais",
    desc: "Uma mochila com saco de dormir, panelas, GPS e outros itens úteis para sobreviver no mato. Fornece +5 em testes de Sobrevivência para acampar e orientar-se e permite que você faça esses testes sem treinamento.",
  },
  {
    nome: "Lanterna Tática",
    cat: 1,
    espacos: 1,
    grupo: "Itens Operacionais",
    desc: "Ilumina um cone de 9m. Além disso, você pode gastar uma ação de movimento para mirar a luz nos olhos de um ser em alcance curto. Ele fica ofuscado por 1 rodada, mas imune à lanterna pelo resto da cena.",
  },
  {
    nome: "Máscara de Gás",
    cat: 0,
    espacos: 1,
    grupo: "Itens Operacionais",
    desc: "Uma máscara com filtro que cobre o rosto inteiro. Fornece +10 em testes de Fortitude contra efeitos que dependam de respiração.",
  },
  {
    nome: "Mochila Militar",
    cat: 1,
    espacos: 0,
    grupo: "Itens Operacionais",
    desc: "Uma mochila leve e de alta qualidade. Ela não usa nenhum espaço e aumenta sua capacidade de carga em 2 espaços.",
  },
  {
    nome: "Óculos de Visão Térmica",
    cat: 1,
    espacos: 1,
    grupo: "Itens Operacionais",
    desc: "Estes óculos eliminam a penalidade em testes por camuflagem.",
  },
  {
    nome: "Pé de Cabra",
    cat: 0,
    espacos: 1,
    grupo: "Itens Operacionais",
    desc: "Esta barra de ferro fornece +5 em testes de Força para arrombar portas. Pode ser usada em combate como um bastão.",
  },
  {
    nome: "Pistola de Dardos",
    cat: 1,
    espacos: 1,
    grupo: "Itens Operacionais",
    desc: "Esta arma leve dispara dardos com um sonífero em alcance curto. Para disparar em um ser, faça um ataque à distância contra ele. Se acertá-lo, ele fica inconsciente até o fim da cena (Fortitude DT Agi reduz para desprevenido e lento por uma rodada). A pistola vem com 2 dardos.",
  },
  {
    nome: "Pistola Sinalizadora",
    cat: 0,
    espacos: 1,
    grupo: "Itens Operacionais",
    desc: "Esta pistola dispara um sinalizador luminoso, útil para chamar outras pessoas para sua localização. Pode ser usada como uma arma de disparo leve com alcance curto que causa 2d6 pontos de dano de fogo. A pistola vem com 2 cargas.",
  },
  {
    nome: "Soqueira",
    cat: 0,
    espacos: 1,
    grupo: "Itens Operacionais",
    dano: "+1",
    tipo: "Impacto",
    desc: "Esta peça de metal é usada entre os dedos e permite socos mais perigosos — fornece +1 em rolagens de dano desarmado e os torna letal. Uma soqueira pode receber modificações e maldições de armas corpo a corpo e aplica os efeitos delas em seus ataques desarmados.",
  },
  {
    nome: "Spray de Pimenta",
    cat: 1,
    espacos: 1,
    grupo: "Itens Operacionais",
    desc: "Este spray dispara um composto químico que causa dor e lacrimação. Você pode gastar uma ação padrão para atingir um ser adjacente. O ser fica cego por 1d4 rodadas (Fortitude DT Agi evita). A carga do spray dura dois usos.",
  },
  {
    nome: "Taser",
    cat: 1,
    espacos: 1,
    grupo: "Itens Operacionais",
    desc: "Um dispositivo de eletrochoque capaz de atordoar ou até incapacitar um alvo. Você pode gastar uma ação padrão para atingir um ser adjacente. O alvo sofre 1d6 pontos de dano de eletricidade e fica atordoado por uma rodada (Fortitude DT Agi evita). A bateria do taser dura dois usos.",
  },
  {
    nome: "Traje Hazmat",
    cat: 1,
    espacos: 2,
    grupo: "Itens Operacionais",
    desc: "Uma roupa impermeável e que cobre o corpo inteiro, usada para impedir o contato do usuário com materiais tóxicos. Fornece +5 em testes de resistência contra efeitos ambientais e resistência a químico 10.",
  },

  // --- ITENS PARANORMAIS ---
  {
    nome: "Amarras Paranormais",
    cat: 2,
    espacos: 1,
    grupo: "Itens Paranormais",
    desc: "Amarras de (Elemento). Cordas ou correntes feitas de um elemento paranormal específico. As amarras são preparadas para imobilizar criaturas do Outro Lado vulneráveis ao elemento que as compõem e podem ser usadas de duas formas. Armadilha: você gasta as amarras, uma ação completa e 2 PE para preparar uma armadilha de 3x3m; uma criatura que atravesse o espaço pela primeira vez em seu turno precisa fazer um teste de Reflexos (DT Int); se falhar, fica imóvel até o final da cena; mesmo se passar, considera o espaço ocupado pela armadilha como terreno difícil. Laçar: você gasta uma ação padrão e 1 PE e escolhe uma criatura em alcance curto; se falhar num teste de Vontade (DT Agi), a criatura fica paralisada até o início de seu próximo turno, quando pode repetir o teste. Manter a criatura enlaçada requer o gasto de 1 PE por rodada.",
  },
  {
    nome: "Câmera de Aura Paranormal",
    cat: 2,
    espacos: 1,
    grupo: "Itens Paranormais",
    desc: "Esta câmera amaldiçoada com Energia possui sigilos de Conhecimento para capturar auras paranormais. Tirar uma foto gasta uma ação padrão e 1 PE. As fotos são instantâneas e revelam a presença de auras paranormais em pessoas e objetos.",
  },
  {
    nome: "Componentes Ritualísticos",
    cat: 0,
    espacos: 1,
    grupo: "Itens Paranormais",
    desc: "Componentes Ritualísticos de (Elemento). Um conjunto de objetos utilizados em rituais de um elemento entre Sangue, Morte, Conhecimento ou Energia (não existem componentes ritualísticos de Medo). Componentes ritualísticos são necessários para a conjuração de rituais do elemento em questão.",
  },
  {
    nome: "Emissor de Pulsos Paranormais",
    cat: 2,
    espacos: 1,
    grupo: "Itens Paranormais",
    desc: "Esta pequena caixa coberta de sigilos foi desenvolvida para servir como uma “isca” de criaturas paranormais. Ativar a caixa gasta uma ação completa e 1 PE. Emite um pulso que atrai criaturas do mesmo elemento e afasta as do elemento oposto. Vontade (DT Pre) evita.",
  },
  {
    nome: "Escuta de Ruídos Paranormais",
    cat: 2,
    espacos: 1,
    grupo: "Itens Paranormais",
    desc: "Este microfone funciona como um aparato espião que consegue captar ruídos paranormais. Ativar a escuta gasta uma ação completa e 2 PE e faz com que ela grave ruídos por até 24 horas. Ouvir a escuta fornece +5 em testes de Ocultismo para identificar criatura.",
  },
  {
    nome: "Medidor de Estabilidade da Membrana",
    cat: 2,
    espacos: 1,
    grupo: "Itens Paranormais",
    desc: "Um dispositivo complexo, composto por diversos medidores. Um agente treinado em Ocultismo pode usar o medidor para avaliar o estado da Membrana em uma área, o que indica a chance de uma entidade se manifestar nela.",
  },
  {
    nome: "Scanner de Manifestação",
    cat: 2,
    espacos: 1,
    grupo: "Itens Paranormais",
    desc: "Scanner de Manifestação Paranormal de (Elemento). Este item é composto por um dispositivo conectado a pequenos objetos amaldiçoados de uma entidade específica e adornado com uma série de sigilos. Ativar o scanner é uma ação padrão. Quando ativado, o scanner consome 1 PE por rodada do usuário, que sempre sabe a direção de todas as manifestações paranormais ativas (rituais, criaturas, itens amaldiçoados etc.) do elemento escolhido em alcance longo. Se o elemento principal de uma criatura for outro, mas ela tiver como complemento o elemento escolhido do scanner, também será detectada.",
  },
];

const MOD_RULES = {
  "Armas Corpo a Corpo": ["Certeira", "Cruel", "Discreta", "Perigosa", "Tática"],
  "Armas de Disparo": ["Certeira", "Cruel", "Discreta", "Perigosa", "Tática"],
  "Armas de Fogo": [
    "Alongada",
    "Calibre Grosso",
    "Compensador",
    "Discreta",
    "Ferrolho Automático",
    "Mira Laser",
    "Mira Telescópica",
    "Silenciador",
    "Tática",
    "Visão de Calor",
  ],
  "Armas Pesadas": [
    "Alongada",
    "Calibre Grosso",
    "Compensador",
    "Discreta",
    "Ferrolho Automático",
    "Mira Laser",
    "Mira Telescópica",
    "Silenciador",
    "Tática",
    "Visão de Calor",
  ],
  "Munição:Balas Curtas (Pacote)": ["Dum Dum", "Explosiva"],
  "Munição:Balas Longas (Pacote)": ["Dum Dum", "Explosiva"],
};

const MOD_EFFECTS = {
  Alongada: "+2 em testes de ataque.",
  "Calibre Grosso": "Aumenta o dano em mais um dado do mesmo tipo.",
  Compensador: "Anula penalidade por rajadas.",
  Certeira: "+2 em testes de ataque.",
  Cruel: "+2 em rolagens de dano.",
  Discreta: "+5 em Crime para ocultar e -1 espaço.",
  "Ferrolho Automático": "A arma se torna automática.",
  "Mira Laser": "+2 na margem de ameaça.",
  "Mira Telescópica": "Aumenta alcance em uma categoria e melhora Ataque Furtivo.",
  Perigosa: "+2 na margem de ameaça.",
  Silenciador: "Reduz em -10 a penalidade de Furtividade após atacar.",
  Tática: "Pode sacar como ação livre.",
  "Visão de Calor": "Ignora camuflagem.",
  "Dum Dum": "+1 no multiplicador de crítico.",
  Explosiva: "+2d6 de dano.",
};

const MOD_FULL_DESC = {
  Alongada:
    "Com um cano mais longo, que aumenta a precisão dos disparos, a arma fornece +2 nos testes de ataque.",
  "Calibre Grosso":
    "A arma é modificada para disparar munição de maior calibre, aumentando seu dano em mais um dado do mesmo tipo. Armas com esta modificação precisam usar munição específica de calibre grosso.",
  Compensador:
    "Apenas para armas automáticas. Um sistema de amortecimento reduz o coice da arma, anulando a penalidade em testes de ataque por disparar rajadas.",
  Certeira:
    "Fabricada para ser mais precisa e balanceada, a arma fornece +2 nos testes de ataque.",
  Cruel:
    "A arma possui a lâmina especialmente afiada ou foi fabricada com materiais mais densos. Fornece +2 nas rolagens de dano.",
  Discreta:
    "A arma possui modificações para chamar menos atenção e ocupar menos espaço. Fornece +5 em testes de Crime para ser ocultada e reduz o número de espaços ocupados em 1.",
  "Ferrolho Automático":
    "O mecanismo de ação da arma é modificado para disparar várias vezes em sequência. A arma se torna automática.",
  "Mira Laser":
    "Um laser interno ajuda disparos mais letais. Aumenta a margem de ameaça em +2.",
  "Mira Telescópica":
    "A arma possui uma luneta para disparos de longa distância. Aumenta o alcance da arma em uma categoria e permite usar Ataque Furtivo em qualquer alcance.",
  Perigosa:
    "A arma possui impacto terrível. Aumenta a margem de ameaça em +2.",
  Silenciador:
    "Um silenciador reduz em -10 a penalidade em Furtividade para se esconder no mesmo turno em que atacou com arma de fogo.",
  Tática:
    "A arma possui acessórios que facilitam manuseio. Você pode sacar a arma como ação livre.",
  "Visão de Calor":
    "A mira sobrepõe imagens visíveis e infravermelho. Ao disparar com a arma, você ignora qualquer camuflagem do alvo.",
  "Dum Dum":
    "Estas balas se expandem no impacto. Só em balas curtas/longas. Aumenta o multiplicador de crítico em +1.",
  Explosiva:
    "Estas munições explodem ao atingir o alvo. Só em balas curtas/longas. Aumenta o dano em +2d6.",
};

const CURSE_RULES = {
  "Armas Corpo a Corpo": [
    "Antielemento",
    "Ritualística",
    "Senciente",
    "Empuxo",
    "Energética",
    "Vibrante",
    "Consumidora",
    "Erosiva",
    "Repulsora",
    "Lancinante",
    "Predadora",
    "Sanguinária",
  ],
  "Armas de Disparo": [
    "Antielemento",
    "Ritualística",
    "Senciente",
    "Energética",
    "Vibrante",
    "Consumidora",
    "Erosiva",
    "Repulsora",
    "Lancinante",
    "Predadora",
    "Sanguinária",
  ],
  "Armas de Fogo": [
    "Antielemento",
    "Ritualística",
    "Senciente",
    "Energética",
    "Vibrante",
    "Consumidora",
    "Erosiva",
    "Repulsora",
    "Lancinante",
    "Predadora",
    "Sanguinária",
  ],
  "Armas Pesadas": [
    "Antielemento",
    "Ritualística",
    "Senciente",
    "Energética",
    "Vibrante",
    "Consumidora",
    "Erosiva",
    "Repulsora",
    "Lancinante",
    "Predadora",
    "Sanguinária",
  ],
};

const CURSE_EFFECTS = {
  Antielemento: "Pode gastar 2 PE para causar +4d8 contra elemento alvo.",
  "Ritualística": "Armazena ritual e descarrega ao acertar ataque.",
  Empuxo: "Arremessável e retorna; +1 dado ao arremessar.",
  Energética: "Gasto de 2 PE: +5 ataque, ignora RD e dano de Energia.",
  Lancinante: "A arma causa +1d8 de dano de Sangue.",
  Vibrante: "A arma causa +1d8 de dano de Energia.",
  Senciente: "A arma pode atacar sozinha ao seu lado.",
  Consumidora: "Pode gastar 2 PE para deixar alvo imóvel por 1 rodada.",
  Erosiva: "A arma causa +1d8 de dano de Morte.",
  Repulsora: "+2 Defesa empunhada; bloqueio com +5 adicional por 2 PE.",
  Predadora: "Ignora camuflagem/cobertura leves e duplica margem de ameaça.",
  Sanguinária: "Causa sangramento cumulativo e gera PV temporários em crítico.",
};

const CURSE_FULL_DESC = {
  Antielemento:
    "A arma é letal contra criaturas de um elemento. Quando ataca uma criatura desse elemento, você pode gastar 2 PE. Se fizer isso e acertar o ataque, causa +4d8 pontos de dano.",
  "Ritualística":
    "Você pode armazenar na arma um ritual que tenha como alvo um ser ou que afete uma área, gastando os PE normalmente. O ritual fica guardado e pode ser descarregado como ação livre quando você acerta um ataque.",
  Senciente:
    "Você pode gastar uma ação de movimento e 2 PE para imbuir a arma com uma fagulha de sua consciência. A arma flutua ao seu lado e, uma vez por rodada, ataca um ser em alcance curto (ou no alcance da arma, o que for maior).",
  Empuxo:
    "A arma ganha a capacidade de ser arremessada em alcance curto (ou aumenta uma categoria se já era arremessável), causa mais um dado de dano do mesmo tipo quando usada assim e retorna voando para você. Somente armas corpo a corpo podem receber essa maldição.",
  Energética:
    "Você pode gastar 2 PE por ataque para transformar a arma (ou munição) em Energia pura. Neste ataque, recebe +5 em testes de ataque, ignora resistência a dano e converte todo o dano para Energia.",
  Vibrante:
    "A arma vibra com um fluxo de Energia. Você recebe a habilidade Ataque Extra da trilha Operações Especiais do combatente; se já a possui, o custo para usá-la diminui em -1 PE.",
  Consumidora:
    "A arma drena a entropia dos seres. Quando ataca, você pode gastar 2 PE. Se fizer isso e acertar, o alvo fica imóvel por uma rodada.",
  Erosiva:
    "A arma acelera o envelhecimento dos alvos, causando +1d8 de dano de Morte. Quando ataca, você pode gastar 2 PE. Se acertar, a vítima sofre 2d4 de dano de Morte no início dos turnos pelas próximas duas rodadas.",
  Repulsora:
    "A arma gera uma aura espiralada que desacelera ataques, fornecendo +2 de Defesa enquanto empunhada. Ao bloquear, você pode gastar 2 PE para receber +5 adicional na Defesa.",
  Lancinante:
    "A arma inflige ferimentos terríveis, causando +1d8 de dano de Sangue. Este dado é multiplicado em acertos críticos.",
  Predadora:
    "A arma anula penalidades por camuflagem e cobertura leves. Se for à distância, o alcance aumenta em uma categoria. Além disso, a margem de ameaça da arma duplica.",
  Sanguinária:
    "Os ferimentos causados pela arma se rasgam além da área acertada. O alvo fica sangrando e o sangramento é cumulativo. Em acerto crítico, você recebe 2d10 PV temporários.",
};

const CURSE_ELEMENT = {
  Lancinante: "Sangue",
  Vibrante: "Energia",
  Senciente: "Conhecimento",
  Erosiva: "Morte",
};

const ELEMENT_COLORS = {
  Conhecimento: "#4ecdc4",
  Energia: "#ffd166",
  Morte: "#9b5de5",
  Sangue: "#ef476f",
  Medo: "#ffffff",
};

const OPPRESSOR_ELEMENTS = {
  Sangue: "Conhecimento",
  Conhecimento: "Sangue",
  Energia: "Morte",
  Morte: "Energia",
};

function getAllowedModsForItem(item) {
  if (!item) return [];
  if (item.grupo === "Munição") {
    return MOD_RULES[`Munição:${item.nome}`] || [];
  }
  return MOD_RULES[item.grupo] || [];
}

function getAllowedCursesForItem(item) {
  if (!item) return [];
  return CURSE_RULES[item.grupo] || [];
}

function addPlusFlatDamage(dano, value) {
  if (!dano) return dano;
  const text = String(dano).trim();
  if (!text) return text;
  return `${text}+${value}`;
}

function increaseDiceCount(dano, amount = 1) {
  if (!dano) return dano;
  const match = String(dano).match(/^(\d+)d(\d+)(.*)$/i);
  if (!match) return dano;
  const qtd = Number(match[1]) + amount;
  return `${qtd}d${match[2]}${match[3] || ""}`;
}

function shiftRangeUp(alcance) {
  const map = {
    Curto: "Médio",
    "Curto ": "Médio",
    Médio: "Longo",
    Longo: "Extremo",
  };
  return map[alcance] || alcance;
}

function parseCrit(critico) {
  const raw = (critico || "").trim();
  if (!raw) return { margin: null, mult: null };
  const marginMatch = raw.match(/^(\d+)(?:\s*\/\s*x(\d+))?$/i);
  if (marginMatch) {
    return {
      margin: Number(marginMatch[1]),
      mult: marginMatch[2] ? Number(marginMatch[2]) : 2,
    };
  }
  const multMatch = raw.match(/^x(\d+)$/i);
  if (multMatch) {
    return { margin: 20, mult: Number(multMatch[1]) };
  }
  return { margin: null, mult: null };
}

function formatCrit({ margin, mult }, original) {
  if (!margin || !mult) return original;
  if (margin === 20) return `x${mult}`;
  return `${margin}/x${mult}`;
}

function applyWeaponModifications(baseItem, selectedMods) {
  const item = { ...baseItem };
  const notes = [];
  const crit = parseCrit(item.critico);

  selectedMods.forEach((mod) => {
    item.cat = Number(item.cat || 0) + 1;

    switch (mod) {
      case "Cruel":
        item.dano = addPlusFlatDamage(item.dano, 2);
        break;
      case "Calibre Grosso":
        item.dano = increaseDiceCount(item.dano, 1);
        notes.push("Requer munição de calibre grosso.");
        break;
      case "Discreta":
        item.espacos = Math.max(0, Number(item.espacos || 0) - 1);
        notes.push("+5 em Crime para ocultar.");
        break;
      case "Perigosa":
      case "Mira Laser":
        if (crit.margin) crit.margin = Math.max(12, crit.margin - 2);
        break;
      case "Mira Telescópica":
        item.alcance = shiftRangeUp(item.alcance);
        notes.push("Ataque Furtivo pode ser usado em qualquer alcance.");
        break;
      case "Dum Dum":
        if (crit.mult) crit.mult += 1;
        break;
      case "Explosiva":
        item.dano = addPlusFlatDamage(item.dano, "2d6");
        break;
      case "Alongada":
        notes.push("+2 em testes de ataque.");
        break;
      case "Compensador":
        notes.push("Anula penalidade por rajadas.");
        break;
      case "Certeira":
        notes.push("+2 em testes de ataque.");
        break;
      case "Ferrolho Automático":
        notes.push("A arma se torna automática.");
        break;
      case "Silenciador":
        notes.push("Reduz em -10 a penalidade de Furtividade após atacar.");
        break;
      case "Tática":
        notes.push("Pode sacar como ação livre.");
        break;
      case "Visão de Calor":
        notes.push("Ignora camuflagem.");
        break;
      default:
        break;
    }
  });

  item.critico = formatCrit(crit, item.critico);
  if (notes.length) {
    const fullModsText = selectedMods
      .map((m) => `${m}. ${MOD_FULL_DESC[m] || MOD_EFFECTS[m] || ""}`)
      .join("\n\n");
    item.desc =
      `${item.desc || ""}\n\nModificações aplicadas:\n${fullModsText}`.trim();
  }
  item.modificacoes = selectedMods;
  return item;
}

function applyWeaponCurses(baseItem, selectedCurses) {
  const item = { ...baseItem };
  const notes = [];
  selectedCurses.forEach((curse, index) => {
    item.cat = Number(item.cat || 0) + (index === 0 ? 2 : 1);
    if (curse === "Lancinante") {
      item.dano = addPlusFlatDamage(item.dano, "1d8");
      item.tipo = item.tipo ? `${item.tipo} + Sangue` : "Sangue";
    }
    if (curse === "Vibrante") {
      item.dano = addPlusFlatDamage(item.dano, "1d8");
      item.tipo = item.tipo ? `${item.tipo} + Energia` : "Energia";
    }
    if (curse === "Senciente") {
      item.dano = addPlusFlatDamage(item.dano, "1d8");
      item.tipo = item.tipo ? `${item.tipo} + Conhecimento` : "Conhecimento";
    }
    if (curse === "Erosiva") {
      item.dano = addPlusFlatDamage(item.dano, "1d8");
      item.tipo = item.tipo ? `${item.tipo} + Morte` : "Morte";
    }
    notes.push(CURSE_FULL_DESC[curse] || CURSE_EFFECTS[curse] || curse);
  });
  if (notes.length) {
    const fullCurseText = selectedCurses
      .map((c) => {
        const el = CURSE_ELEMENT[c];
        return `${c}${el ? ` (${el})` : ""}. ${CURSE_FULL_DESC[c] || CURSE_EFFECTS[c] || ""}`;
      })
      .join("\n\n");
    item.desc =
      `${item.desc || ""}\n\nMaldições aplicadas:\n${fullCurseText}`.trim();
  }
  item.maldicoes = selectedCurses;
  return item;
}

const trilhasData = {
  Combatente: {
    Aniquilador: [
      {
        nex: 10,
        nome: "A Favorita",
        desc: "Escolha uma arma para ser sua favorita, como katana ou fuzil de assalto. A categoria da arma escolhida é reduzida em I.",
      },
      {
        nex: 40,
        nome: "Técnica Secreta",
        desc: "A categoria da arma favorita passa a ser reduzida em II. Quando faz um ataque com ela, você pode gastar 2 PE para executar um dos efeitos abaixo como parte do ataque. Você pode adicionar mais efeitos gastando +2 PE por efeito adicional.\n- Amplo. O ataque pode atingir um alvo adicional em seu alcance e adjacente ao original (use o mesmo teste de ataque para ambos).\n- Destruidor. Aumenta o multiplicador de crítico da arma em +1.",
      },
      {
        nex: 65,
        nome: "Técnica Sublime",
        desc: "Você adiciona os seguintes efeitos à lista de sua Técnica Secreta:\n- Letal. Aumenta a margem de ameaça em +2. Você pode escolher este efeito duas vezes para aumentar a margem de ameaça em +5.\n- Perfurante. Ignora até 5 pontos de resistência a dano de qualquer tipo do alvo.",
      },
      {
        nex: 99,
        nome: "Máquina de Matar",
        desc: "A categoria da arma favorita passa a ser reduzida em III, ela recebe +2 na margem de ameaça e seu dano aumenta em um dado do mesmo tipo.",
      },
    ],
    "Comandante de Campo": [
      {
        nex: 10,
        nome: "Inspirar Confiança",
        desc: "Sua liderança inspira seus aliados. Você pode gastar uma reação e 2 PE para fazer um aliado em alcance curto rolar novamente um teste recém realizado.",
      },
      {
        nex: 40,
        nome: "Estrategista",
        desc: "Você pode direcionar aliados em alcance curto. Gaste uma ação padrão e 1 PE por aliado que quiser direcionar (limitado pelo seu Intelecto). No próximo turno dos aliados afetados, eles ganham uma ação de movimento adicional.",
      },
      {
        nex: 65,
        nome: "Brecha na Guarda",
        desc: "Uma vez por rodada, quando um aliado causar dano em um inimigo que esteja em seu alcance curto, você pode gastar uma reação e 2 PE para que você ou outro aliado em alcance curto faça um ataque adicional contra o mesmo inimigo. Além disso, o alcance de inspirar confiança e estrategista aumenta para médio.",
      },
      {
        nex: 99,
        nome: "Oficial Comandante",
        desc: "Você pode gastar uma ação padrão e 5 PE para que cada aliado que você possa ver em alcance médio receba uma ação padrão adicional no próximo turno dele.",
      },
    ],
    Guerreiro: [
      {
        nex: 10,
        nome: "Técnica Letal",
        desc: "Você recebe um aumento de +2 na margem de ameaça com todos os seus ataques corpo a corpo.",
      },
      {
        nex: 40,
        nome: "Revidar",
        desc: "Sempre que bloquear um ataque, você pode gastar uma reação e 2 PE para fazer um ataque corpo a corpo no inimigo que o atacou.",
      },
      {
        nex: 65,
        nome: "Força Opressora",
        desc: "Quando acerta um ataque corpo a corpo, você pode gastar 1 PE para realizar uma manobra derrubar ou empurrar contra o alvo do ataque como ação livre. Se escolher empurrar, recebe um bônus de +5 para cada 10 pontos de dano que causou no alvo. Se escolher derrubar e vencer no teste oposto, você pode gastar 1 PE para fazer um ataque adicional contra o alvo caído.",
      },
      {
        nex: 99,
        nome: "Potência Máxima",
        desc: "Quando usa seu Ataque Especial com armas corpo a corpo, todos os bônus numéricos são dobrados. Por exemplo, se usar 5 PE para receber +5 no ataque e +15 no dano, você recebe +10 no ataque e +30 no dano.",
      },
    ],
    "Operações Especiais": [
      {
        nex: 10,
        nome: "Iniciativa Aprimorada",
        desc: "Você recebe +5 em Iniciativa e uma ação de movimento adicional na primeira rodada.",
      },
      {
        nex: 40,
        nome: "Ataque Extra",
        desc: "Uma vez por rodada, quando faz um ataque, você pode gastar 2 PE para fazer um ataque adicional.",
      },
      {
        nex: 65,
        nome: "Surto de Adrenalina",
        desc: "Uma vez por rodada, você pode gastar 5 PE para realizar uma ação padrão ou de movimento adicional.",
      },
      {
        nex: 99,
        nome: "Sempre Alerta",
        desc: "Você recebe uma ação padrão adicional no início de cada cena de combate.",
      },
    ],
    "Tropa de Choque": [
      {
        nex: 10,
        nome: "Casca Grossa",
        desc: "Você recebe +1 PV para cada 5% de NEX e, quando faz um bloqueio, soma seu Vigor na resistência a dano recebida.",
      },
      {
        nex: 40,
        nome: "Cai Dentro",
        desc: "Sempre que um oponente em alcance curto ataca um de seus aliados, você pode gastar uma reação e 1 PE para fazer com que esse oponente faça um teste de Vontade (DT Vig). Se falhar, o oponente deve atacar você em vez de seu aliado. Este poder só funciona se você puder ser efetivamente atacado e estiver no alcance do ataque (por exemplo, adjacente a um oponente atacando em corpo a corpo ou dentro do alcance de uma arma de ataque à distância). Um oponente que passe no teste de Vontade não pode ser afetado por seu poder Cai Dentro até o final da cena.",
      },
      {
        nex: 65,
        nome: "Duro de Matar",
        desc: "Ao sofrer dano não paranormal, você pode gastar uma reação e 2 PE para reduzir esse dano à metade. Em NEX 85%, você pode usar esta habilidade para reduzir dano paranormal.",
      },
      {
        nex: 99,
        nome: "Inquebrável",
        desc: "Enquanto estiver machucado, você recebe +5 na Defesa e resistência a dano 5. Enquanto estiver morrendo, em vez do normal, você não fica indefeso e ainda pode realizar ações. Você ainda segue as regras de morte normalmente.",
      },
    ],
  },
  Especialista: {
    "Atirador de Elite": [
      {
        nex: 10,
        nome: "Mira de Elite",
        desc: "Você recebe proficiência com armas de fogo que usam balas longas e soma seu Intelecto em rolagens de dano com essas armas.",
      },
      {
        nex: 40,
        nome: "Disparo Letal",
        desc: "Quando faz a ação mirar você pode gastar 1 PE para aumentar em +2 a margem de ameaça do próximo ataque que fizer até o final de seu próximo turno.",
      },
      {
        nex: 65,
        nome: "Disparo Impactante",
        desc: "Quando ataca com uma arma de fogo, você pode gastar 2 PE e, em vez de causar dano, fazer uma manobra entre derrubar, desarmar, empurrar ou quebrar.",
      },
      {
        nex: 99,
        nome: "Atirar para Matar",
        desc: "Quando faz um acerto crítico com uma arma de fogo, você causa dano máximo, sem precisar rolar dados.",
      },
    ],
    Infiltrador: [
      {
        nex: 10,
        nome: "Ataque Furtivo",
        desc: "Você sabe atingir os pontos vitais de um inimigo distraído. Uma vez por rodada, quando atinge um alvo desprevenido com um ataque corpo a corpo ou em alcance curto, ou um alvo que você esteja flanqueando, você pode gastar 1 PE para causar +1d6 pontos de dano do mesmo tipo da arma. Em NEX 40% o dano adicional aumenta para +2d6, em NEX 65% aumenta para +3d6 e em NEX 99% aumenta para +4d6.",
      },
      {
        nex: 40,
        nome: "Gatuno",
        desc: "Você recebe +5 em Atletismo e Crime e pode percorrer seu deslocamento normal quando se esconder sem penalidade (veja a perícia Furtividade).",
      },
      {
        nex: 65,
        nome: "Assassinar",
        desc: "Você pode gastar uma ação de movimento e 3 PE para analisar um alvo em alcance curto. Até o fim de seu próximo turno, seu primeiro Ataque Furtivo que causar dano a ele tem seus dados de dano extras dessa habilidade dobrados. Além disso, se sofrer dano de seu ataque, o alvo fica inconsciente ou morrendo, à sua escolha (Fortitude DT Agi evita).",
      },
      {
        nex: 99,
        nome: "Sombra Fugaz",
        desc: "Quando faz um teste de Furtividade após atacar ou fazer outra ação chamativa, você pode gastar 3 PE para não sofrer a penalidade de -3d20 no teste.",
      },
    ],
    "Médico de Campo": [
      {
        nex: 10,
        nome: "Paramédico",
        desc: "Você pode usar uma ação padrão e 2 PE para curar 2d10 pontos de vida de si mesmo ou de um aliado adjacente. Você pode curar +1d10 PV respectivamente em NEX 40%, 65% e 99%, gastando +1 PE por dado adicional de cura.",
      },
      {
        nex: 40,
        nome: "Equipe de Trauma",
        desc: "Você pode usar uma ação padrão e 2 PE para remover uma condição negativa (exceto morrendo) de um aliado adjacente.",
      },
      {
        nex: 65,
        nome: "Resgate",
        desc: "Uma vez por rodada, se estiver em alcance curto de um aliado machucado ou morrendo, você pode se aproximar do aliado com uma ação livre (desde que seja capaz de fazê-lo usando seu deslocamento normal). Além disso, sempre que curar PV ou remover condições do aliado, você e o aliado recebem +5 na Defesa até o início de seu próximo turno. Por fim, para você, o total de espaços ocupados por carregar um personagem é reduzido pela metade.",
      },
      {
        nex: 99,
        nome: "Reanimação",
        desc: "Uma vez por cena, você pode gastar uma ação completa e 10 PE para trazer de volta à vida um personagem que tenha morrido na mesma cena (exceto morte por dano massivo).",
      },
    ],
    Negociador: [
      {
        nex: 10,
        nome: "Eloquência",
        desc: "Você pode usar uma ação completa e 1 PE por alvo em alcance curto para afetar outras pessoas com sua fala. Faça um teste de Diplomacia, Enganação ou Intimidação contra a Vontade dos alvos. Se você vencer, os alvos ficam fascinados enquanto você se concentrar (uma ação padrão por rodada). Um alvo hostil ou que esteja envolvido em combate recebe +5 em seu teste de resistência e tem direito a um novo teste por rodada, sempre que você se concentrar. Uma pessoa que passar no teste fica imune a este efeito por um dia.",
      },
      {
        nex: 40,
        nome: "Discurso Motivador",
        desc: "Você pode gastar uma ação padrão e 4 PE para inspirar seus aliados com suas palavras. Você e todos os seus aliados em alcance curto ganham +1d20 em testes de perícia até o fim da cena. A partir de NEX 65%, você pode gastar 8 PE para fornecer um bônus total de +2d20.",
      },
      {
        nex: 65,
        nome: "Eu Conheço um Cara",
        desc: "Uma vez por missão, você pode ativar sua rede de contatos para pedir um favor, como por exemplo trocar todo o equipamento do seu grupo (como se tivesse uma segunda fase de preparação de missão), conseguir um local de descanso ou mesmo ser resgatado de uma cena. O mestre tem a palavra final de quando é possível usar essa habilidade e quais favores podem ser obtidos.",
      },
      {
        nex: 99,
        nome: "Truque de Mestre",
        desc: "Acostumado a uma vida de fingimento e manipulação, você pode gastar 5 PE para simular o efeito de qualquer habilidade que você tenha visto um de seus aliados usar durante a cena. Você ignora os pré-requisitos da habilidade, mas ainda precisa pagar todos os seus custos, incluindo ações, PE e materiais, e ela usa os seus parâmetros de jogo, como se você estivesse usando a habilidade em questão.",
      },
    ],
    Técnico: [
      {
        nex: 10,
        nome: "Inventário Otimizado",
        desc: "Você soma seu Intelecto à sua Força para calcular sua capacidade de carga. Por exemplo, se você tem Força 1 e Intelecto 3, seu inventário tem 20 espaços.",
      },
      {
        nex: 40,
        nome: "Remendão",
        desc: "Você pode gastar uma ação completa e 1 PE para remover a condição quebrado de um equipamento adjacente até o final da cena. Além disso, qualquer equipamento geral tem sua categoria reduzida em I para você.",
      },
      {
        nex: 65,
        nome: "Improvisar",
        desc: "Você pode improvisar equipamentos com materiais ao seu redor. Escolha um equipamento geral e gaste uma ação completa e 2 PE, mais 2 PE por categoria do item escolhido. Você cria uma versão funcional do equipamento, que segue suas regras de espaço e categoria como normal. Ao final da cena, seu equipamento improvisado se torna inútil.",
      },
      {
        nex: 99,
        nome: "Preparado para Tudo",
        desc: "Você sempre tem o que precisa para qualquer situação. Sempre que precisar de um item qualquer (exceto armas), pode gastar uma ação de movimento e 3 PE por categoria do item para lembrar que colocou ele no fundo da bolsa! Depois de encontrado, o item segue normalmente as regras de inventário.",
      },
    ],
  },
  Ocultista: {
    Conduíte: [
      {
        nex: 10,
        nome: "Ampliar Ritual",
        desc: "Quando lança um ritual, você pode gastar +2 PE para aumentar seu alcance em um passo (de curto para médio, de médio para longo ou de longo para extremo) ou dobrar sua área de efeito.",
      },
      {
        nex: 40,
        nome: "Acelerar Ritual",
        desc: "Uma vez por rodada, você pode aumentar o custo de um ritual em 4 PE para conjurá-lo como uma ação livre.",
      },
      {
        nex: 65,
        nome: "Anular Ritual",
        desc: "Quando for alvo de um ritual, você pode gastar uma quantidade de PE igual ao custo pago por esse ritual e fazer um teste oposto de Ocultismo contra o conjurador. Se vencer, você anula o ritual, cancelando todos os seus efeitos.",
      },
      {
        nex: 99,
        nome: "Canalizar o Medo",
        desc: "Você aprende o ritual Canalizar o Medo.",
      },
    ],
    Flagelador: [
      {
        nex: 10,
        nome: "Poder do Flagelo",
        desc: "Ao conjurar um ritual, você pode gastar seus próprios pontos de vida para pagar o custo em pontos de esforço, à taxa de 2 PV por PE pago. Pontos de vida gastos dessa forma só podem ser recuperados com descanso.",
      },
      {
        nex: 40,
        nome: "Abraçar a Dor",
        desc: "Sempre que sofrer dano não paranormal, você pode gastar uma reação e 2 PE para reduzir esse dano à metade.",
      },
      {
        nex: 65,
        nome: "Absorver Agonia",
        desc: "Sempre que reduz um ou mais inimigos a 0 PV com um ritual, você recebe uma quantidade de PE temporários igual ao círculo do ritual utilizado. Por exemplo, se ativar esse poder com um ritual de 2º círculo, receberá 2 PE.",
      },
      {
        nex: 99,
        nome: "Medo Tangível",
        desc: "Você aprende o ritual Medo Tangível.",
      },
    ],
    Graduado: [
      {
        nex: 10,
        nome: "Saber Ampliado",
        desc: "Você aprende um ritual de 1º círculo. Toda vez que ganha acesso a um novo círculo, aprende um ritual adicional daquele círculo. Esses rituais não contam no seu limite de rituais.",
      },
      {
        nex: 40,
        nome: "Grimório Ritualístico",
        desc: "Você cria um grimório especial, que armazena rituais que sua mente não seria capaz de guardar. Você aprende uma quantidade de rituais de 1º ou 2º círculos igual ao seu Intelecto. Quando ganha acesso a um novo círculo, pode incluir um novo ritual desse círculo em seu grimório. Esses rituais não contam em seu limite de rituais conhecidos. Para conjurar um ritual armazenado em seu grimório, você precisa antes empunhar o grimório e gastar uma ação completa o folheando para relembrar o ritual. O grimório ocupa 1 espaço em seu inventário. Se perdê-lo, você pode replicá-lo com duas ações de interlúdio.",
      },
      {
        nex: 65,
        nome: "Rituais Eficientes",
        desc: "A DT para resistir a todos os seus rituais aumenta em +5.",
      },
      {
        nex: 99,
        nome: "Conhecendo o Medo",
        desc: "Você aprende o ritual Conhecendo o Medo.",
      },
    ],
    Intuitivo: [
      {
        nex: 10,
        nome: "Mente Sã",
        desc: "Você compreende melhor as entidades do Outro Lado, e passa a ser menos abalado por seus efeitos. Você recebe resistência paranormal +5 (+5 em testes de resistência contra efeitos paranormais).",
      },
      {
        nex: 40,
        nome: "Presença Poderosa",
        desc: "Sua resiliência mental faz com que você possa extrair mais do Outro Lado. Você adiciona sua Presença ao seu limite de PE por turno, mas apenas para conjurar rituais (não para DT).",
      },
      {
        nex: 65,
        nome: "Inabalável",
        desc: "Você recebe resistência a dano mental e paranormal 10. Além disso, quando é alvo de um efeito paranormal que permite um teste de Vontade para reduzir o dano à metade, você não sofre dano algum se passar.",
      },
      {
        nex: 99,
        nome: "Presença do Medo",
        desc: "Você aprende o ritual Presença do Medo.",
      },
    ],
    "Lâmina Paranormal": [
      {
        nex: 10,
        nome: "Lâmina Maldita",
        desc: "Você aprende o ritual Amaldiçoar Arma. Se já o conhece, pode gastar +1 PE quando o lança para reduzir seu tempo de conjuração para movimento. Além disso, quando conjura esse ritual, você pode usar Ocultismo, em vez de Luta ou Pontaria, para testes de ataque com a arma amaldiçoada.",
      },
      {
        nex: 40,
        nome: "Gladiador Paranormal",
        desc: "Sempre que acerta um ataque corpo a corpo em um inimigo, você recebe 2 PE temporários. Você pode ganhar um máximo de PE temporários por cena igual ao seu limite de PE. PE temporários desaparecem no final da cena.",
      },
      {
        nex: 65,
        nome: "Conjuração Marcial",
        desc: "Uma vez por rodada, quando você lança um ritual com execução de uma ação padrão, pode gastar 2 PE para fazer um ataque corpo a corpo como uma ação livre.",
      },
      {
        nex: 99,
        nome: "Lâmina do Medo",
        desc: "Você aprende o ritual Lâmina do Medo.",
      },
    ],
  },
};

const classBaseAbilities = {
  Combatente: [
    {
      nex: 5,
      nome: "Ataque Especial",
      tipo: "classe",
      desc: "Quando faz um ataque, você pode gastar 2 PE para receber +5 no teste de ataque ou na rolagem de dano. Conforme avança de NEX, você pode gastar +1 PE para receber mais bônus de +5 (veja a Tabela 1.3). Você pode aplicar cada bônus de +5 em ataque ou dano. Por exemplo, em NEX 55%, você pode gastar 4 PE para receber +5 no teste de ataque e +10 na rolagem de dano.",
    },
    {
      nex: 25,
      nome: "Ataque Especial",
      tipo: "classe",
      desc: "Você pode gastar 3 PE para receber um bônus total de +10 no ataque ou no dano.",
    },
    {
      nex: 55,
      nome: "Ataque Especial",
      tipo: "classe",
      desc: "Você pode gastar 4 PE para receber um bônus total de +15 no ataque ou no dano.",
    },
    {
      nex: 85,
      nome: "Ataque Especial",
      tipo: "classe",
      desc: "Você pode gastar 5 PE para receber um bônus total de +20 no ataque ou no dano.",
    },
    {
      nex: 20,
      nome: "Aumento de Atributo",
      tipo: "progressão",
      desc: "Aumente um atributo em +1.",
    },
    {
      nex: 35,
      nome: "Grau de Treinamento",
      tipo: "progressão",
      desc: "Aumente o grau de treinamento de 3 + Int perícias.",
    },
    {
      nex: 50,
      nome: "Versatilidade",
      tipo: "progressão",
      desc: "Escolha versatilidade.",
    },
    {
      nex: 50,
      nome: "Aumento de Atributo",
      tipo: "progressão",
      desc: "Aumente um atributo em +1.",
    },
    {
      nex: 70,
      nome: "Grau de Treinamento",
      tipo: "progressão",
      desc: "Aumente novamente o grau de treinamento de 3 + Int perícias.",
    },
    {
      nex: 80,
      nome: "Aumento de Atributo",
      tipo: "progressão",
      desc: "Aumente um atributo em +1.",
    },
    {
      nex: 95,
      nome: "Aumento de Atributo",
      tipo: "progressão",
      desc: "Aumente um atributo em +1.",
    },
  ],

  Especialista: [
    {
      nex: 5,
      nome: "Eclético",
      tipo: "classe",
      desc: "Quando faz um teste de uma perícia, você pode gastar 2 PE para receber os benefícios de ser treinado nesta perícia.",
    },
    {
      nex: 5,
      nome: "Perito",
      tipo: "classe",
      desc: "Escolha duas perícias nas quais você é treinado (exceto Luta e Pontaria). Quando faz um teste de uma dessas perícias, você pode gastar 2 PE para somar +1d6 no resultado do teste. Conforme avança de NEX, você pode gastar +1 PE para aumentar o dado de bônus (veja a Tabela 1.4). Por exemplo, em NEX 55%, pode gastar 4 PE para receber +1d10 no teste.",
    },
    {
      nex: 25,
      nome: "Perito",
      tipo: "classe",
      desc: "Você pode gastar 3 PE para somar +1d8 em testes de perícia.",
    },
    {
      nex: 55,
      nome: "Perito",
      tipo: "classe",
      desc: "Você pode gastar 4 PE para somar +1d10 em testes de perícia.",
    },
    {
      nex: 85,
      nome: "Perito",
      tipo: "classe",
      desc: "Você pode gastar 5 PE para somar +1d12 em testes de perícia.",
    },
    {
      nex: 20,
      nome: "Aumento de Atributo",
      tipo: "progressão",
      desc: "Aumente um atributo em +1.",
    },
    {
      nex: 35,
      nome: "Grau de Treinamento",
      tipo: "progressão",
      desc: "Aumente o grau de treinamento de 3 + Int perícias.",
    },
    {
      nex: 50,
      nome: "Versatilidade",
      tipo: "progressão",
      desc: "Escolha versatilidade.",
    },
    {
      nex: 50,
      nome: "Aumento de Atributo",
      tipo: "progressão",
      desc: "Aumente um atributo em +1.",
    },
    {
      nex: 70,
      nome: "Grau de Treinamento",
      tipo: "progressão",
      desc: "Aumente novamente o grau de treinamento de 3 + Int perícias.",
    },
    {
      nex: 80,
      nome: "Aumento de Atributo",
      tipo: "progressão",
      desc: "Aumente um atributo em +1.",
    },
    {
      nex: 95,
      nome: "Aumento de Atributo",
      tipo: "progressão",
      desc: "Aumente um atributo em +1.",
    },
  ],

  Ocultista: [
    {
      nex: 5,
      nome: "Escolhido pelo Outro Lado",
      tipo: "classe",
      desc: "Você teve uma experiência paranormal e foi marcado pelo Outro Lado, absorvendo o conhecimento e poder necessários para realizar rituais. Você pode lançar rituais de 1º círculo. À medida que aumenta seu NEX, pode lançar rituais de círculos maiores (2º círculo em NEX 25%, 3º círculo em NEX 55% e 4º círculo em NEX 85%). Você começa com três rituais de 1º círculo. Sempre que avança de NEX, aprende um ritual de qualquer círculo que possa lançar. Esses rituais não contam no seu limite de rituais conhecidos.",
    },
    {
      nex: 25,
      nome: "Escolhido pelo Outro Lado",
      tipo: "classe",
      desc: "Acesso aos rituais de 2º círculo.",
    },
    {
      nex: 55,
      nome: "Escolhido pelo Outro Lado",
      tipo: "classe",
      desc: "Acesso aos rituais de 3º círculo.",
    },
    {
      nex: 85,
      nome: "Escolhido pelo Outro Lado",
      tipo: "classe",
      desc: "Acesso aos rituais de 4º círculo.",
    },
    {
      nex: 20,
      nome: "Aumento de Atributo",
      tipo: "progressão",
      desc: "Aumente um atributo em +1.",
    },
    {
      nex: 35,
      nome: "Grau de Treinamento",
      tipo: "progressão",
      desc: "Aumente o grau de treinamento de 3 + Int perícias.",
    },
    {
      nex: 50,
      nome: "Versatilidade",
      tipo: "progressão",
      desc: "Escolha versatilidade.",
    },
    {
      nex: 50,
      nome: "Aumento de Atributo",
      tipo: "progressão",
      desc: "Aumente um atributo em +1.",
    },
    {
      nex: 70,
      nome: "Grau de Treinamento",
      tipo: "progressão",
      desc: "Aumente novamente o grau de treinamento de 3 + Int perícias.",
    },
    {
      nex: 80,
      nome: "Aumento de Atributo",
      tipo: "progressão",
      desc: "Aumente um atributo em +1.",
    },
    {
      nex: 95,
      nome: "Aumento de Atributo",
      tipo: "progressão",
      desc: "Aumente um atributo em +1.",
    },
  ],
};

const classPowers = {
  Combatente: [
    {
      nome: "Armamento Pesado",
      tipo: "classe",
      desc: "Você recebe proficiência com armas pesadas. Pré-requisito: For 2.",
    },
    {
      nome: "Artista Marcial",
      tipo: "classe",
      desc: "Seus ataques desarmados causam 1d6 pontos de dano, podem causar dano letal e se tornam ágeis (veja p. 59). Em NEX 35%, o dano aumenta para 1d8 e, em NEX 70%, para 1d10.",
    },
    {
      nome: "Ataque de Oportunidade",
      tipo: "classe",
      desc: "Sempre que um ser sair voluntariamente de um espaço adjacente ao seu, você pode gastar uma reação e 1 PE para fazer um ataque corpo a corpo contra ele.",
    },
    {
      nome: "Combater com Duas Armas",
      tipo: "classe",
      desc: "Se estiver empunhando duas armas (e pelo menos uma for leve) e fizer a ação agredir, você pode fazer dois ataques, um com cada arma. Se fizer isso, sofre -1d20 em todos os testes de ataque até o seu próximo turno. Pré-requisitos: Agi 3, treinado em Luta ou Pontaria.",
    },
    {
      nome: "Combate Defensivo",
      tipo: "classe",
      desc: "Quando usa a ação agredir, você pode combater defensivamente. Se fizer isso, até seu próximo turno, sofre -1d20 em todos os testes de ataque, mas recebe +5 na Defesa. Pré-requisito: Int 2.",
    },
    {
      nome: "Golpe Demolidor",
      tipo: "classe",
      desc: "Quando usa a manobra quebrar ou ataca um objeto, você pode gastar 1 PE para causar dois dados de dano extra do mesmo tipo de sua arma. Pré-requisitos: For 2, treinado em Luta.",
    },
    {
      nome: "Golpe Pesado",
      tipo: "classe",
      desc: "Enquanto estiver empunhando uma arma corpo a corpo, o dano dela aumenta em mais um dado do mesmo tipo.",
    },
    {
      nome: "Incansável",
      tipo: "classe",
      desc: "Uma vez por cena, você pode gastar 2 PE para fazer uma ação de investigação adicional, mas deve usar Força ou Agilidade como atributo-base do teste.",
    },
    {
      nome: "Presteza Atlética",
      tipo: "classe",
      desc: "Quando faz um teste de facilitar a investigação, você pode gastar 1 PE para usar Força ou Agilidade no lugar do atributo-base da perícia. Se passar no teste, o próximo aliado que usar seu bônus também recebe +1d20 no teste.",
    },
    {
      nome: "Proteção Pesada",
      tipo: "classe",
      desc: "Você recebe proficiência com Proteções Pesadas. Pré-requisito: NEX 30%.",
    },
    {
      nome: "Reflexos Defensivos",
      tipo: "classe",
      desc: "Você recebe +2 em Defesa e em testes de resistência. Pré-requisitos: Agi 2.",
    },
    {
      nome: "Saque Rápido",
      tipo: "classe",
      desc: "Você pode sacar ou guardar itens como uma ação livre (em vez de ação de movimento). Além disso, caso esteja usando a regra opcional de contagem de munição, uma vez por rodada pode recarregar uma arma de disparo como uma ação livre. Pré-requisito: treinado em Iniciativa.",
    },
    {
      nome: "Segurar o Gatilho",
      tipo: "classe",
      desc: "Sempre que acerta um ataque com uma arma de fogo, pode fazer outro ataque com a mesma arma contra o mesmo alvo, pagando 2 PE por cada ataque já realizado no turno. Ou seja, pode fazer o primeiro ataque extra gastando 2 PE e, se acertar, pode fazer um segundo ataque extra gastando mais 4 PE e assim por diante, até errar um ataque ou atingir o limite de seus PE por rodada. Pré-requisito: NEX 60%.",
    },
    {
      nome: "Sentido Tático",
      tipo: "classe",
      desc: "Você pode gastar uma ação de movimento e 2 PE para analisar o ambiente. Se fizer isso, recebe um bônus em Defesa e em testes de resistência igual ao seu Intelecto até o final da cena. Pré-requisitos: Int 2, treinado em Percepção e Tática.",
    },
    {
      nome: "Tanque de Guerra",
      tipo: "classe",
      desc: "Se estiver usando uma proteção pesada, a Defesa e a resistência a dano que ela fornece aumentam em +2. Pré-requisito: Proteção Pesada.",
    },
    {
      nome: "Tiro Certeiro",
      tipo: "classe",
      desc: "Se estiver usando uma arma de disparo, você soma sua Agilidade nas rolagens de dano e ignora a penalidade contra alvos envolvidos em combate corpo a corpo (mesmo se não usar a ação mirar). Pré-requisito: treinado em Pontaria.",
    },
    {
      nome: "Tiro de Cobertura",
      tipo: "classe",
      desc: "Você pode gastar uma ação padrão e 1 PE para disparar uma arma de fogo na direção de um ser no alcance da arma para forçá-lo a se proteger. Faça um teste de Pontaria contra a Vontade do alvo. Se vencer, até o início do seu próximo turno o alvo não pode sair do lugar onde está e sofre –5 em testes de ataque. A critério do mestre, o alvo recebe +5 no teste de Vontade se estiver em um lugar extremamente perigoso, como uma casa em chamas ou um barco afundando. Este é um efeito de medo.",
    },
    {
      nome: "Transcender",
      tipo: "transcender",
      desc: "Escolha um poder paranormal (veja a página 114). Você recebe o poder escolhido, mas não ganha Sanidade neste aumento de NEX. Você pode escolher este poder várias vezes.",
    },
    {
      nome: "Treinamento em Perícia",
      tipo: "classe",
      desc: "Escolha duas perícias. Você se torna treinado nessas perícias. A partir de NEX 35%, você pode escolher perícias nas quais já é treinado para se tornar veterano. A partir de NEX 70%, pode escolher perícias nas quais já é veterano para se tornar expert. Você pode escolher este poder várias vezes.",
    },
  ],

  Especialista: [
    {
      nome: "Artista Marcial",
      tipo: "classe",
      desc: "Seus ataques desarmados causam 1d6 pontos de dano, podem causar dano letal e se tornam ágeis (veja p. 59). Em NEX 35%, o dano aumenta para 1d8 e, em NEX 70%, para 1d10.",
    },
    {
      nome: "Balística Avançada",
      tipo: "classe",
      desc: "Você recebe proficiência com armas táticas de fogo e +2 em rolagens de dano com armas de fogo.",
    },
    {
      nome: "Conhecimento Aplicado",
      tipo: "classe",
      desc: "Quando faz um teste de perícia (exceto Luta e Pontaria), você pode gastar 2 PE para mudar o atributo-base da perícia para Int. Pré-requisito: Int 2.",
    },
    {
      nome: "Hacker",
      tipo: "classe",
      desc: "Você recebe +5 em testes de Tecnologia para invadir sistemas e diminui o tempo necessário para hackear qualquer sistema para uma ação completa. Pré-requisito: treinado em Tecnologia.",
    },
    {
      nome: "Mãos Rápidas",
      tipo: "classe",
      desc: "Ao fazer um teste de Crime, você pode pagar 1 PE para fazê-lo como uma ação livre. Pré-requisitos: Agi 3, treinado em Crime.",
    },
    {
      nome: "Mochila de Utilidades",
      tipo: "classe",
      desc: "Um item a sua escolha (exceto armas) conta como uma categoria abaixo e ocupa 1 espaço a menos.",
    },
    {
      nome: "Movimento Tático",
      tipo: "classe",
      desc: "Você pode gastar 1 PE para ignorar a penalidade em deslocamento por terreno difícil e por escalar até o final do turno. Pré-requisito: treinado em Atletismo.",
    },
    {
      nome: "Na Trilha Certa",
      tipo: "classe",
      desc: "Sempre que tiver sucesso em um teste para procurar pistas, você pode gastar 1 PE para receber +1d20 no próximo teste. Os custos e os bônus são cumulativos (se passar num segundo teste, pode pagar 2 PE para receber um total de +2d20 no próximo teste, e assim por diante).",
    },
    {
      nome: "Nerd",
      tipo: "classe",
      desc: "Você é um repositório de conhecimento útil (e inútil). Uma vez por cena, pode gastar 2 PE para fazer um teste de Atualidades (DT 20). Se passar, recebe uma informação útil para essa cena (se for uma investigação, uma dica para uma pista; se for um combate, uma fraqueza de um inimigo, e assim por diante). A fonte da informação pode ser desde um livro antigo que você leu na biblioteca até um episódio de sua série de ficção favorita.",
    },
    {
      nome: "Ninja Urbano",
      tipo: "classe",
      desc: "Você recebe proficiência com armas táticas de ataque corpo a corpo e de disparo (exceto de fogo) e +2 em rolagens de dano com armas de corpo a corpo e de disparo.",
    },
    {
      nome: "Pensamento Ágil",
      tipo: "classe",
      desc: "Uma vez por rodada, durante uma cena de investigação, você pode gastar 2 PE para fazer uma ação de procurar pistas adicional.",
    },
    {
      nome: "Perito em Explosivos",
      tipo: "classe",
      desc: "Você soma seu Intelecto na DT para resistir aos seus explosivos e pode excluir dos efeitos da explosão um número de alvos igual ao seu valor de Intelecto.",
    },
    {
      nome: "Primeira Impressão",
      tipo: "classe",
      desc: "Você recebe +2d20 no primeiro teste de Diplomacia, Enganação, Intimidação ou Intuição que fizer em uma cena.",
    },
    {
      nome: "Transcender",
      tipo: "transcender",
      desc: "Escolha um poder paranormal (veja a página 114). Você recebe o poder escolhido, mas não ganha Sanidade neste aumento de NEX. Você pode escolher este poder várias vezes.",
    },
    {
      nome: "Treinamento em Perícia",
      tipo: "classe",
      desc: "Escolha duas perícias. Você se torna treinado nessas perícias. A partir de NEX 35%, você pode escolher perícias nas quais já é treinado para se tornar veterano. A partir de NEX 70%, pode escolher perícias nas quais já é veterano para se tornar expert. Você pode escolher este poder várias vezes.",
    },
  ],

  Ocultista: [
    {
      nome: "Camuflar Ocultismo",
      tipo: "classe",
      desc: "Você pode gastar uma ação livre para esconder símbolos e sigilos que estejam desenhados ou gravados em objetos ou em sua pele, tornando-os invisíveis para outras pessoas além de você mesmo. Além disso, quando lança um ritual, pode gastar +2 PE para lançá-lo sem usar componentes ritualísticos e sem gesticular (o que permite conjurar um ritual com as mãos presas), usando apenas concentração. Outros seres só perceberão que você lançou um ritual se passarem num teste de Ocultismo (DT 25).",
    },
    {
      nome: "Criar Selo",
      tipo: "classe",
      desc: "Você sabe fabricar selos paranormais de rituais que conheça (veja a página 151). Fabricar um selo gasta uma ação de interlúdio e um número de PE iguais ao custo de conjurar o ritual. Você pode ter um número máximo de selos criados ao mesmo tempo igual à sua Presença.",
    },
    {
      nome: "Envolto em Mistério",
      tipo: "classe",
      desc: "Sua aparência e postura assombrosas o permitem manipular e assustar pessoas ignorantes ou supersticiosas. O mestre define o que exatamente você pode fazer e quem se encaixa nessa descrição. Como regra geral, você recebe +5 em Enganação e Intimidação contra pessoas não treinadas em Ocultismo.",
    },
    {
      nome: "Especialista em Elemento",
      tipo: "classe",
      desc: "Escolha um elemento. A DT para resistir aos seus rituais desse elemento aumenta em +2.",
    },
    {
      nome: "Ferramentas Paranormais",
      tipo: "classe",
      desc: "Você reduz a categoria de um item paranormal em I e pode ativar itens paranormais sem pagar seu custo em PE.",
    },
    {
      nome: "Fluxo de Poder",
      tipo: "classe",
      desc: "Você pode manter dois efeitos sustentados de rituais ativos ao mesmo tempo com apenas uma ação livre, pagando o custo de cada efeito separadamente. Pré-requisito: NEX 60%.",
    },
    {
      nome: "Guiado pelo Paranormal",
      tipo: "classe",
      desc: "Uma vez por cena, você pode gastar 2 PE para fazer uma ação de investigação adicional.",
    },
    {
      nome: "Identificação Paranormal",
      tipo: "classe",
      desc: "Você recebe +10 em testes de Ocultismo para identificar criaturas, objetos ou rituais.",
    },
    {
      nome: "Improvisar Componentes",
      tipo: "classe",
      desc: "Uma vez por cena, você pode gastar uma ação completa para fazer um teste de Investigação (DT 15). Se passar, encontra objetos que podem servir como componentes ritualísticos de um elemento à sua escolha. O mestre define se é possível usar esse poder na cena atual.",
    },
    {
      nome: "Intuição Paranormal",
      tipo: "classe",
      desc: "Sempre que usa a ação facilitar investigação, você soma seu Intelecto ou Presença no teste (à sua escolha).",
    },
    {
      nome: "Mestre em Elemento",
      tipo: "classe",
      desc: "Escolha um elemento. O custo para lançar rituais desse elemento diminui em –1 PE. Pré-requisitos: Especialista em Elemento no elemento escolhido, NEX 45%.",
    },
    {
      nome: "Ritual Potente",
      tipo: "classe",
      desc: "Você soma seu Intelecto nas rolagens de dano ou nos efeitos de cura de seus rituais. Pré-requisito: Int 2.",
    },
    {
      nome: "Ritual Predileto",
      tipo: "classe",
      desc: "Escolha um ritual que você conhece. Você reduz em –1 PE o custo do ritual. Essa redução se acumula com reduções fornecidas por outras fontes.",
    },
    {
      nome: "Tatuagem Ritualística",
      tipo: "classe",
      desc: "Símbolos marcados em sua pele reduzem em –1 PE o custo de rituais de alcance pessoal que têm você como alvo.",
    },
    {
      nome: "Transcender",
      tipo: "transcender",
      desc: "Escolha um poder paranormal (veja a página 114). Você recebe o poder escolhido, mas não ganha Sanidade neste aumento de NEX. Você pode escolher este poder várias vezes.",
    },
    {
      nome: "Treinamento em Perícia",
      tipo: "classe",
      desc: "Escolha duas perícias. Você se torna treinado nessas perícias. A partir de NEX 35%, você pode escolher perícias nas quais já é treinado para se tornar veterano. A partir de NEX 70%, pode escolher perícias nas quais já é veterano para se tornar expert. Você pode escolher este poder várias vezes.",
    },
  ],
};

const paranormalPowers = [
  {
    nome: "Aprender Ritual",
    elemento: "Geral",
    desc: "Através de uma conexão com as memórias de ocultistas do passado e os segredos das entidades, você aprende e pode conjurar um ritual de 1º círculo à sua escolha. Além disso, você pode substituir um ritual que já conhece por outro. A partir de 45% de NEX, quando escolhe este poder, você aprende um ritual de até 2º círculo e, a partir de 75% de NEX, aprende um ritual de até 3º círculo. Você pode escolher esse poder quantas vezes quiser, mas está sujeito ao limite de rituais conhecidos. Este poder conta como um poder do elemento do ritual escolhido.",
  },
  {
    nome: "Resistir a Elemento", // Ajustado para ser mais claro na interface
    elemento: "Geral",
    desc: "Escolha entre Conhecimento, Energia, Morte ou Sangue. Você recebe resistência 10 contra esse elemento. Este poder conta como um poder do elemento escolhido. Afinidade: aumenta a resistência para 20.",
  },
  {
    nome: "Expansão de Conhecimento",
    elemento: "Conhecimento",
    desc: "Você se conecta com o Conhecimento do Outro Lado, rompendo os limites de sua compreensão. Você aprende um poder de classe que não pertença à sua classe (caso o poder possua pré-requisitos, você precisa preenchê-los). Pré-requisito: Conhecimento 1. Afinidade: você aprende um segundo poder de classe que não pertença à sua classe.",
  },
  {
    nome: "Percepção Paranormal",
    elemento: "Conhecimento",
    desc: "O Conhecimento sussurra em sua mente. Em cenas de investigação, sempre que fizer um teste para procurar pistas, você pode rolar novamente um dado com resultado menor que 10. Você deve aceitar a segunda rolagem, mesmo que seja menor que a primeira. Afinidade: você pode rolar novamente até dois dados com resultado menor que 10.",
  },
  {
    nome: "Precognição",
    elemento: "Conhecimento",
    desc: "Você possui um “sexto sentido” que o avisa do perigo antes que ele aconteça. Você recebe +2 em Defesa e em testes de resistência. Pré-requisito: Conhecimento 1. Afinidade: você fica imune à condição desprevenido.",
  },
  {
    nome: "Sensitivo",
    elemento: "Conhecimento",
    desc: "Você consegue sentir as emoções e intenções de outros seres, como medo, raiva ou malícia, recebendo +5 em testes de Diplomacia, Intimidação e Intuição. Afinidade: quando você faz um teste oposto usando uma dessas perícias, o oponente sofre -1d20.",
  },
  {
    nome: "Visão do Oculto",
    elemento: "Conhecimento",
    desc: "Você não enxerga mais pelos olhos, mas sim pela percepção do Conhecimento em sua mente. Você recebe +5 em testes de Percepção e enxerga no escuro. Afinidade: você ignora camuflagem.",
  },
  {
    nome: "Afortunado",
    elemento: "Energia",
    desc: "A Energia considera resultados medíocres entediantes. Uma vez por rolagem, você pode rolar novamente um resultado 1 em qualquer dado que não seja d20. Afinidade: além disso, uma vez por teste, você pode rolar novamente um resultado 1 em d20.",
  },
  {
    nome: "Campo Protetor",
    elemento: "Energia",
    desc: "Você consegue gerar um campo de Energia que o protege de perigos. Quando usa a ação esquiva, você pode gastar 1 PE para receber +5 em Defesa. Pré-requisito: Energia 1. Afinidade: quando usa este poder, você também recebe +5 em Reflexo e, até o início de seu próximo turno, se passar em um teste de Reflexo que reduziria o dano à metade, em vez disso não sofre nenhum dano.",
  },
  {
    nome: "Causalidade Fortuita",
    elemento: "Energia",
    desc: "A Energia o conduz rumo a descobertas. Em cenas de investigação, a DT para procurar pistas diminui em –5 para você até você encontrar uma pista. Afinidade: a DT para procurar pistas sempre diminui em –5 para você.",
  },
  {
    nome: "Golpe de Sorte",
    elemento: "Energia",
    desc: "Seus ataques recebem +1 na margem de ameaça. Pré-requisito: Energia 1. Afinidade: seus ataques recebem +1 no multiplicador de crítico.",
  },
  {
    nome: "Manipular Entropia",
    elemento: "Energia",
    desc: "Nada diverte mais a Energia do que a possibilidade de um desastre ainda maior. Quando outro ser em alcance curto faz um teste de perícia, você pode gastar 2 PE para fazê-lo rolar novamente um dos dados desse teste. Pré-requisito: Energia 1. Afinidade: o alvo rola novamente todos os dados que você escolher.",
  },
  {
    nome: "Encarar a Morte",
    elemento: "Morte",
    desc: "Sua conexão com a Morte faz com que você não hesite em situações de perigo. Durante cenas de ação, seu limite de gasto de PE aumenta em +1 (isso não afeta a DT de seus efeitos). Afinidade: durante cenas de ação, seu limite de gasto de PE aumenta em +2 (para um total de +3).",
  },
  {
    nome: "Escapar da Morte",
    elemento: "Morte",
    desc: "A Morte tem um interesse especial em sua caminhada. Uma vez por cena, quando receber dano que o deixaria com 0 PV, você fica com 1 PV. Não funciona em caso de dano massivo. Pré-requisito: Morte 1. Afinidade: em vez do normal, você evita completamente o dano. Em caso de dano massivo, você fica com 1 PV.",
  },
  {
    nome: "Potencial Aprimorado",
    elemento: "Morte",
    desc: "A Morte lhe concede potencial latente de momentos roubados de outro lugar. Você recebe +1 ponto de esforço por NEX. Quando sobe de NEX, os PE que recebe por este poder aumentam de acordo. Por exemplo, se escolher este poder em NEX 30%, recebe 6 PE. Quando subir para NEX 35%, recebe +1 PE adicional, e assim por diante. Afinidade: você recebe +1 PE adicional por NEX (para um total de +2 PE por NEX).",
  },
  {
    nome: "Potencial Reaproveitado",
    elemento: "Morte",
    desc: "Você absorve os momentos desperdiçados de outros seres. Uma vez por rodada, quando passa num teste de resistência, você ganha 2 PE temporários cumulativos. Os pontos desaparecem no final da cena. Afinidade: você ganha 3 PE temporários, em vez de 2.",
  },
  {
    nome: "Surto Temporal",
    elemento: "Morte",
    desc: "A sua percepção temporal se torna distorcida e espiralizada, fazendo com que a noção de passagem do tempo nunca mais seja a mesma para você. Uma vez por cena, durante seu turno, você pode gastar 3 PE para realizar uma ação padrão adicional. Pré-requisito: Morte 2. Afinidade: em vez de uma vez por cena, você pode usar este poder uma vez por turno.",
  },
  {
    nome: "Anatomia Insana",
    elemento: "Sangue",
    desc: "O seu corpo é transfigurado e parece desenvolver um instinto próprio separado da sua consciência. Você tem 50% de chance (resultado par em 1d4) de ignorar o dano adicional de um acerto crítico ou ataque furtivo. Pré-requisito: Sangue 2. Afinidade: você é imune aos efeitos de acertos críticos e ataques furtivos.",
  },
  {
    nome: "Arma de Sangue",
    elemento: "Sangue",
    desc: "O Sangue devora parte de seu corpo e se manifesta como parte de você. Você pode gastar uma ação de movimento e 2 PE para produzir garras, chifres ou uma lâmina de sangue cristalizado que brota de seu antebraço. Qualquer que seja sua escolha, é considerada uma arma simples, corpo a corpo e leve, que você não precisa empunhar e causa 1d6 pontos de dano de Sangue. Uma vez por turno, quando você usa a ação agredir, pode gastar 1 PE para fazer um ataque adicional com essa arma. A arma dura até o final da cena, e então se desfaz numa poça de sangue coagulado. Afinidade: a arma se torna parte permanente de você e causa 1d10 pontos de dano de Sangue.",
  },
  {
    nome: "Sangue de Ferro",
    elemento: "Sangue",
    desc: "O seu sangue flui de forma paranormal e agressiva, concedendo vigor não natural. Você recebe +2 pontos de vida por NEX. Quando sobe de NEX, os PV que recebe por este poder aumentam de acordo. Por exemplo, se escolher este poder em NEX 50%, recebe 20 PV. Quando subir para NEX 55%, recebe +2 PV, e assim por diante. Afinidade: você recebe +5 em Fortitude e se torna imune a venenos e doenças.",
  },
  {
    nome: "Sangue Fervente",
    elemento: "Sangue",
    desc: "A intensidade da dor desperta em você sentimentos bestiais e prazerosos que você nem imaginava que existiam. Enquanto estiver machucado, você recebe +1 em Agilidade ou Força, à sua escolha (escolha sempre que este efeito for ativado). Pré-requisito: Sangue 2. Afinidade: o bônus que você recebe em Agilidade ou Força aumenta para +2.",
  },
  {
    nome: "Sangue Vivo",
    elemento: "Sangue",
    desc: "A carnificina não pode parar, o Sangue precisa continuar fluindo. Na primeira vez que ficar machucado durante uma cena, você recebe cura acelerada 2 (veja a página 179). Esse efeito nunca cura você acima da metade dos PV máximos (ou seja, você nunca deixa de estar machucado) e termina no fim da cena ou caso você perca a condição machucado. Pré-requisito: Sangue 1. Afinidade: a cura acelerada aumenta para 5.",
  },
];

const powerMilestones = [15, 30, 45, 60, 75, 90];
function getPowerSlots(nex) {
  return powerMilestones.filter((value) => nex >= value).length;
}
function getPowerUnlocks(oldNex, newNex, classe) {
  return powerMilestones
    .filter((value) => value > oldNex && value <= newNex)
    .map((value) => ({
      nome: "Poder de Classe/Paranormal",
      tipo: "poder",
      nex: value,
      desc: "Desbloqueou slot.",
    }));
}
function getUnlocksForNexRange(oldNex, newNex, classe, trilha) {
  const b =
    classBaseAbilities[classe]?.filter(
      (h) => h.nex > oldNex && h.nex <= newNex
    ) || [];
  const t =
    trilhasData[classe][trilha]?.filter(
      (h) => h.nex > oldNex && h.nex <= newNex
    ) || [];
  const p = getPowerUnlocks(oldNex, newNex, classe);
  return [...b, ...t, ...p].sort((a, b) => a.nex - b.nex);
}

const originsData = {
  Acadêmico: ["Ciências", "Investigação"],
  "Agente de Saúde": ["Intuição", "Medicina"],
  Amnésico: [],
  Artista: ["Artes", "Enganação"],
  Atleta: ["Acrobacia", "Atletismo"],
  Chef: ["Fortitude", "Profissão"],
  Criminoso: ["Crime", "Furtividade"],
  "Cultista Arrependido": ["Ocultismo", "Religião"],
  Desgarrado: ["Fortitude", "Sobrevivência"],
  Engenheiro: ["Profissão", "Tecnologia"],
  Executivo: ["Diplomacia", "Profissão"],
  Investigador: ["Investigação", "Percepção"],
  Lutador: ["Luta", "Reflexos"],
  Magnata: ["Diplomacia", "Pilotagem"],
  Mercenário: ["Iniciativa", "Intimidação"],
  Militar: ["Pontaria", "Tática"],
  Operário: ["Fortitude", "Profissão"],
  Policial: ["Percepção", "Pontaria"],
  Religioso: ["Religião", "Vontade"],
  "Servidor Público": ["Intuição", "Vontade"],
  "Teórico da Conspiração": ["Investigação", "Ocultismo"],
  "T.I.": ["Investigação", "Tecnologia"],
  "Trabalhador Rural": ["Adestramento", "Sobrevivência"],
  Trambiqueiro: ["Crime", "Enganação"],
  Universitário: ["Atualidades", "Investigação"],
  Vítima: ["Reflexos", "Vontade"],
};

const originPowerName = {
  Acadêmico: "Saber é Poder",
  "Agente de Saúde": "Técnica Medicinal",
  Amnésico: "Vislumbres do Passado",
  Artista: "Magnum Opus",
  Atleta: "110%",
  Chef: "Ingrediente Secreto",
  Criminoso: "O Crime Compensa",
  "Cultista Arrependido": "Traços do Outro Lado",
  Desgarrado: "Calejado",
  Engenheiro: "Ferramenta Favorita",
  Executivo: "Processo Otimizado",
  Investigador: "Faro para Pistas",
  Lutador: "Mão Pesada",
  Magnata: "Patrocinador da Ordem",
  Mercenário: "Posição de Combate",
  Militar: "Para Bellum",
  Operário: "Ferramenta de Trabalho",
  Policial: "Patrulha",
  Religioso: "Acalentar",
  "Servidor Público": "Espírito Cívico",
  "Teórico da Conspiração": "Eu Já Sabia",
  "T.I.": "Motor de Busca",
  "Trabalhador Rural": "Desbravador",
  Trambiqueiro: "Impostor",
  Universitário: "Dedicação",
  Vítima: "Cicatrizes Psicológicas",
};

const originPowerDesc = {
  Acadêmico:
    "Quando faz um teste usando Intelecto, você pode gastar 2 PE para receber +5 nesse teste.",
  "Agente de Saúde":
    "Sempre que cura um personagem, você adiciona seu Intelecto no total de PV curados.",
  Amnésico:
    "Uma vez por sessão, você pode fazer um teste de Intelecto (DT 10) para reconhecer pessoas ou lugares familiares. Se passar, recebe 1d4 PE temporários e, a critério do mestre, uma informação útil.",
  Artista:
    "Uma vez por missão, você pode determinar que uma pessoa envolvida em uma cena de interação o reconheça. Você recebe +5 em testes de Presença e perícias baseadas em Presença contra ela.",
  Atleta:
    "Quando faz um teste de perícia usando Força ou Agilidade (exceto Luta e Pontaria), você pode gastar 2 PE para receber +5 nesse teste.",
  Chef:
    "Em cenas de interlúdio, ao fazer a ação alimentar-se para cozinhar um prato especial, você e aliados que se alimentarem recebem o benefício de dois pratos.",
  Criminoso:
    "No final de uma missão, escolha um item encontrado nela. Na próxima missão, você pode incluir esse item no inventário sem contar no limite de itens por patente.",
  "Cultista Arrependido":
    "Você possui um poder paranormal à sua escolha. Porém, começa o jogo com metade da Sanidade normal para sua classe.",
  Desgarrado: "Você recebe +1 PV para cada 5% de NEX.",
  Engenheiro:
    "Um item à sua escolha (exceto armas) conta como uma categoria abaixo.",
  Executivo:
    "Sempre que faz um teste de perícia durante teste estendido, ou ação para revisar documentos, pode pagar 2 PE para receber +5 nesse teste.",
  Investigador:
    "Uma vez por cena, quando fizer um teste para procurar pistas, você pode gastar 1 PE para receber +5 nesse teste.",
  Lutador: "Você recebe +2 em rolagens de dano com ataques corpo a corpo.",
  Magnata: "Seu limite de crédito é sempre considerado um acima do atual.",
  Mercenário:
    "No primeiro turno de cada cena de ação, você pode gastar 2 PE para receber uma ação de movimento adicional.",
  Militar: "Você recebe +2 em rolagens de dano com armas de fogo.",
  Operário:
    "Escolha uma arma simples ou tática adequada à profissão. Você recebe +1 em ataques, dano e margem de ameaça com ela.",
  Policial: "Você recebe +2 em Defesa.",
  Religioso:
    "Você recebe +5 em testes de Religião para acalmar. Além disso, quando acalma uma pessoa, ela recupera 1d6 + Presença de Sanidade.",
  "Servidor Público":
    "Sempre que faz um teste para ajudar, você pode gastar 1 PE para aumentar o bônus concedido em +2.",
  "Teórico da Conspiração":
    "Você recebe resistência a dano mental igual ao seu Intelecto.",
  "T.I.":
    "Sempre que tiver acesso à internet, a critério do mestre, você pode gastar 2 PE para substituir um teste de perícia por um teste de Tecnologia.",
  "Trabalhador Rural":
    "Quando faz um teste de Adestramento ou Sobrevivência, você pode gastar 2 PE para receber +5. Além disso, não sofre penalidade por terreno difícil.",
  Trambiqueiro:
    "Uma vez por cena, você pode gastar 2 PE para substituir um teste de perícia qualquer por um teste de Enganação.",
  Universitário:
    "Você recebe +1 PE, e +1 PE adicional a cada NEX ímpar (15%, 25%...). Além disso, seu limite de PE por turno aumenta em 1.",
  Vítima: "Você recebe +1 de Sanidade para cada 5% de NEX.",
};

const originDescription = {
  Acadêmico:
    "Você era um pesquisador ou professor universitário. De forma proposital ou não, seus estudos tocaram em assuntos misteriosos e chamaram a atenção da Ordo Realitas.",
  "Agente de Saúde":
    "Você era um profissional da saúde, como enfermeiro, farmacêutico, médico, psicólogo ou socorrista, treinado no atendimento e cuidado de pessoas.",
  Amnésico:
    "Você perdeu a maior parte da memória. Sua amnésia pode ser resultado de trauma paranormal ou ritual. Hoje, a Ordem é a única família que você conhece.",
  Artista:
    "Você era ator, músico, escritor, dançarino, influenciador... Seu trabalho pode ter sido inspirado por experiências paranormais e chamou atenção da Ordem.",
  Atleta:
    "Você competia em esporte individual ou coletivo. Seu desempenho e rotina podem ter cruzado com o paranormal em competições ou treinamentos.",
  Chef:
    "Você é cozinheiro amador ou profissional. Ninguém sabe exatamente como sua comida o conectou ao paranormal, mas sua presença em missão é sempre valorizada.",
  Criminoso:
    "Você viveu fora da lei, de pequenos golpes a facções criminosas. Em algum momento, trombou com algo da Ordem e foi recrutado pelos talentos que possui.",
  "Cultista Arrependido":
    "Você fez parte de um culto paranormal. Algo abriu seus olhos e agora você luta pelo lado certo, carregando marcas e desconfiança do passado.",
  Desgarrado:
    "Você não vivia de acordo com as normas da sociedade. A vida sem confortos modernos o deixou mais forte para enfrentar o impossível.",
  Engenheiro:
    "Enquanto outros discutem teoria, você coloca a mão na massa. Seu talento técnico e prático chamou a atenção da Ordem para operações de campo.",
  Executivo:
    "Você tinha carreira de escritório em empresa, banco ou corporação. Sua rotina mudou quando descobriu algo paranormal nos bastidores da organização.",
  Investigador:
    "Você era investigador do governo ou privado, como perito forense, policial federal ou detetive particular, com grande foco em resolução de mistérios.",
  Lutador:
    "Você pratica arte marcial, esporte de luta ou aprendeu briga de rua. Já quebrou ossos e transformou isso em método para sobreviver ao paranormal.",
  Magnata:
    "Você possui muito dinheiro ou patrimônio, e decidiu usar seus recursos para apoiar uma causa maior ao lado da Ordem.",
  Mercenário:
    "Você é soldado de aluguel, sozinho ou em organização militar privada. Missões de risco o levaram naturalmente a conflitos com o Outro Lado.",
  Militar:
    "Você serviu em força militar como exército ou marinha, treinando disciplina, armas de fogo e tática para cumprir missões de alto risco.",
  Operário:
    "Pedreiro, industriário, operador de máquinas... Seu trabalho braçal deu visão pragmática do mundo e preparo para situações extremas.",
  Policial:
    "Você fez parte de força de segurança pública, civil ou militar. Em patrulha ou atendimento, se deparou com um caso paranormal e sobreviveu.",
  Religioso:
    "Você é devoto ou sacerdote de uma fé e se dedica a auxiliar pessoas com problemas espirituais, o que o colocou em contato com o paranormal.",
  "Servidor Público":
    "Você tinha carreira em órgão do governo, lidando com burocracia e atendimento. Descobertas sombrias o levaram a trocar a rotina pela Ordem.",
  "Teórico da Conspiração":
    "Você investigava conspirações e verdades ocultas. Sua determinação parecia loucura até encontrar evidências reais do Outro Lado.",
  "T.I.":
    "Programador, engenheiro de software ou simplesmente “o cara da T.I.”, você tem treinamento e experiência para lidar com sistemas informatizados. Seu talento (ou curiosidade exagerada) chamou a atenção da Ordem.",
  "Trabalhador Rural":
    "Você trabalhava no campo ou em áreas isoladas, como fazendeiro, pescador, biólogo ou veterinário, convivendo com natureza e histórias estranhas.",
  Trambiqueiro:
    "Você vivia de pequenos golpes, jogatina e falcatruas. Um dia enganou a pessoa errada e acabou servindo à Ordem.",
  Universitário:
    "Você era aluno de faculdade. Em meio a estudos e rotina acadêmica, encontrou algo amaldiçoado ou proibido e foi convocado pela Ordem.",
  Vítima:
    "Em algum momento da vida, você encontrou o paranormal de forma traumática. Sobreviveu e decidiu impedir que outros passem pelo mesmo.",
};

const classInfo = {
  Combatente: {
    role: "Treinado para lutar com armas brancas e de fogo, servindo como linha de frente contra o Outro Lado.",
    full:
      "Um perito em armas brancas e de fogo, este agente serve como a linha de frente na luta contra o Outro Lado. Combatentes apresentam ampla gama de técnicas para confronto direto, liderança em batalha e sobrevivência sob pressão.",
    pv: "20 + VIG",
    pe: "2 + PRE",
    san: "12",
    pericias: "Luta ou Pontaria; Fortitude ou Reflexos; + (1 + INT) à escolha.",
    prof: "Armas simples, armas táticas e proteções leves.",
    corePowers:
      "Ataque Especial: quando faz um ataque, pode gastar 2 PE para +5 no teste de ataque ou no dano (escala com NEX).\nPoder de Combatente: recebe em NEX 15% e depois a cada 15%.\nTrilha: escolhe em NEX 10% e evolui em 40%, 65% e 99%.",
  },
  Especialista: {
    role: "Agente de conhecimento, esperteza e lábia, focado em resolver problemas diversos.",
    full:
      "Com conhecimento, esperteza e lábia, este agente é focado em resolver problemas diversos. Especialistas dominam perícias, improviso e apoio tático/social, sendo peças-chave em investigação e infiltração.",
    pv: "16 + VIG",
    pe: "3 + PRE",
    san: "16",
    pericias: "7 + INT perícias à escolha.",
    prof: "Armas simples e proteções leves.",
    corePowers:
      "Eclético: quando faz teste de perícia, pode gastar 2 PE para receber os benefícios de treinado naquela perícia.\nPerito: em duas perícias treinadas, pode gastar PE para somar dado extra no teste (+1d6, escalando por NEX).\nTrilha: escolhe em NEX 10% e evolui em 40%, 65% e 99%.",
  },
  Ocultista: {
    role: "Estudioso do paranormal, focado em rituais e no domínio dos elementos do Outro Lado.",
    full:
      "Um estudioso do paranormal que busca entender os mistérios dos elementos e usá-los a seu favor. Ocultistas conjuram rituais, controlam efeitos do Outro Lado e atuam como especialistas em ameaças paranormais.",
    pv: "12 + VIG",
    pe: "4 + PRE",
    san: "20",
    pericias: "Ocultismo e Vontade; + (3 + INT) à escolha.",
    prof: "Armas simples.",
    corePowers:
      "Escolhido pelo Outro Lado: começa com 3 rituais de 1º círculo, aprende novos por NEX e libera círculos maiores em 25%, 55% e 85%.\nPoder de Ocultista: recebe em NEX 15% e depois a cada 15%.\nTrilha: escolhe em NEX 10% e evolui em 40%, 65% e 99%.",
  },
};

const skillsCatalog = [
  {
    nome: "Acrobacia",
    attr: "AGI",
    trainedOnly: false,
    carga: true,
    color: "#ffffff",
  },
  {
    nome: "Adestramento",
    attr: "PRE",
    trainedOnly: true,
    carga: false,
    color: "#ffffff",
  },
  {
    nome: "Artes",
    attr: "PRE",
    trainedOnly: true,
    carga: false,
    color: "#ffffff",
  },
  {
    nome: "Atletismo",
    attr: "FOR",
    trainedOnly: false,
    carga: true,
    color: "#ffffff",
  },
  {
    nome: "Atualidades",
    attr: "INT",
    trainedOnly: false,
    carga: false,
    color: "#ffffff",
  },
  {
    nome: "Ciências",
    attr: "INT",
    trainedOnly: true,
    carga: false,
    color: "#ffffff",
  },
  {
    nome: "Crime",
    attr: "AGI",
    trainedOnly: true,
    carga: false,
    color: "#ffffff",
  },
  {
    nome: "Diplomacia",
    attr: "PRE",
    trainedOnly: false,
    carga: false,
    color: "#37d65a",
  },
  {
    nome: "Enganação",
    attr: "PRE",
    trainedOnly: false,
    carga: false,
    color: "#ffffff",
  },
  {
    nome: "Fortitude",
    attr: "VIG",
    trainedOnly: false,
    carga: false,
    color: "#ff9d00",
  },
  {
    nome: "Furtividade",
    attr: "AGI",
    trainedOnly: true,
    carga: true,
    color: "#ffd644",
  },
  {
    nome: "Iniciativa",
    attr: "AGI",
    trainedOnly: false,
    carga: false,
    color: "#ffffff",
  },
  {
    nome: "Intimidação",
    attr: "PRE",
    trainedOnly: false,
    carga: false,
    color: "#ffffff",
  },
  {
    nome: "Intuição",
    attr: "PRE",
    trainedOnly: false,
    carga: false,
    color: "#37d65a",
  },
  {
    nome: "Investigação",
    attr: "INT",
    trainedOnly: false,
    carga: false,
    color: "#00a6ff",
  },
  {
    nome: "Luta",
    attr: "FOR",
    trainedOnly: false,
    carga: false,
    color: "#ffffff",
  },
  {
    nome: "Medicina",
    attr: "INT",
    trainedOnly: true,
    carga: false,
    color: "#ff9d00",
  },
  {
    nome: "Ocultismo",
    attr: "INT",
    trainedOnly: true,
    carga: false,
    color: "#ffffff",
  },
  {
    nome: "Percepção",
    attr: "PRE",
    trainedOnly: false,
    carga: false,
    color: "#37d65a",
  },
  {
    nome: "Pilotagem",
    attr: "AGI",
    trainedOnly: true,
    carga: false,
    color: "#ffffff",
  },
  {
    nome: "Pontaria",
    attr: "AGI",
    trainedOnly: false,
    carga: false,
    color: "#ffffff",
  },
  {
    nome: "Profissão",
    attr: "INT",
    trainedOnly: true,
    carga: false,
    color: "#ffffff",
  },
  {
    nome: "Reflexos",
    attr: "AGI",
    trainedOnly: false,
    carga: false,
    color: "#ff9d00",
  },
  {
    nome: "Religião",
    attr: "PRE",
    trainedOnly: true,
    carga: false,
    color: "#00a6ff",
  },
  {
    nome: "Sobrevivência",
    attr: "INT",
    trainedOnly: false,
    carga: false,
    color: "#ff9d00",
  },
  {
    nome: "Tática",
    attr: "INT",
    trainedOnly: true,
    carga: false,
    color: "#ffffff",
  },
  {
    nome: "Tecnologia",
    attr: "INT",
    trainedOnly: true,
    carga: false,
    color: "#ffffff",
  },
  {
    nome: "Vontade",
    attr: "PRE",
    trainedOnly: false,
    carga: false,
    color: "#ff9d00",
  },
];

const createDefaultSkillState = () =>
  skillsCatalog.reduce((acc, skill) => {
    acc[skill.nome] = { treino: "destreinado", outros: 0 };
    return acc;
  }, {});

const styles = {
  selectField: {
    width: "100%",
    background: "#000",
    color: colors.brand,
    padding: "10px",
    border: `1px solid ${colors.brand}33`,
    outline: "none",
    borderRadius: "8px",
    fontFamily: "inherit",
  },
  popupOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.72)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9998,
    padding: "20px",
  },
  popupBox: {
    width: "100%",
    maxWidth: "720px",
    background: "rgba(10, 10, 16, 0.94)",
    border: `1px solid ${colors.brand}33`,
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 0 24px rgba(0, 229, 255, 0.18)",
  },
  popupItem: {
    background: "rgba(0,0,0,0.35)",
    borderLeft: `3px solid ${colors.brand}`,
    padding: "12px",
    borderRadius: "0 8px 8px 0",
    marginBottom: "10px",
  },
  body: {
    color: colors.text,
    fontFamily: "'Share Tech Mono', monospace",
    minHeight: "100vh",
    display: "flex",
    backgroundColor: colors.background,
    backgroundImage: "url('https://i.imgur.com/TCzZgPn.jpeg')",
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundAttachment: "fixed",
  },
  sidebar: {
    width: "74px",
    background: "rgba(0, 0, 0, 0.88)",
    borderRight: `1px solid ${colors.brand}33`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "18px 0",
    gap: "24px",
    zIndex: 100,
    backdropFilter: "blur(10px)",
    position: "fixed",
    height: "100vh",
  },
  navBtn: {
    background: "none",
    border: "none",
    color: "#444",
    cursor: "pointer",
    fontSize: "28px",
    transition: "0.2s ease",
    outline: "none",
  },
  mainContent: {
    flex: 1,
    marginLeft: "74px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 2,
    width: "calc(100% - 74px)",
  },
  container: {
    maxWidth: "980px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  statusBox: {
    width: "100%",
    background: colors.surface,
    padding: "24px",
    border: `1px solid ${colors.border}`,
    boxShadow: "0 10px 50px rgba(0,0,0,0.9)",
    margin: "0 auto",
    backdropFilter: "blur(5px)",
    borderRadius: "16px",
  },
  sectionTitle: {
    color: colors.brand,
    borderBottom: `1px solid ${colors.brand}33`,
    paddingBottom: "10px",
    margin: "0 0 20px 0",
    letterSpacing: "2px",
    fontSize: "18px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    marginBottom: "20px",
    borderBottom: `1px solid ${colors.border}`,
    paddingBottom: "15px",
    flexWrap: "wrap",
  },
  dataBlock: {
    flex: 1,
    minWidth: "140px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
  },
  btnStep: {
    background: "none",
    border: "1px solid #333",
    color: "#fff",
    cursor: "pointer",
    padding: "4px 8px",
    fontSize: "12px",
    fontFamily: "inherit",
    borderRadius: "6px",
  },
  inputField: {
    background: "none",
    border: "none",
    color: colors.brand,
    fontFamily: "inherit",
    fontSize: "20px",
    fontWeight: "bold",
    width: "50px",
    textAlign: "center",
    outline: "none",
  },
  inputSmall: {
    background: "none",
    border: "none",
    color: "#d5d5d5",
    fontFamily: "inherit",
    fontSize: "12px",
    width: "42px",
    textAlign: "center",
    borderBottom: "1px dashed #333",
    outline: "none",
  },
  attrLabel: { color: "#666", fontSize: "11px", textTransform: "uppercase" },
  attrValue: {
    color: colors.brand,
    fontSize: "26px",
    fontWeight: "bold",
    textShadow: colors.glow,
  },
  mandalaContainer: {
    position: "relative",
    width: "520px",
    height: "520px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.9)",
    borderRadius: "50%",
    maxWidth: "100%",
  },
  centralSymbol: {
    position: "absolute",
    width: "530px",
    height: "520px",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    mixBlendMode: "screen",
    maxWidth: "100%",
  },
  attributeNode: {
    position: "absolute",
    width: "76px",
    height: "76px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5, 5, 7, 0.98)",
    borderRadius: "50%",
    border: `1px solid ${colors.border}`,
    zIndex: 10,
    cursor: "pointer",
    boxShadow: "0 0 15px rgba(0,0,0,0.8)",
  },
  habCard: {
    background: "rgba(0, 0, 0, 0.4)",
    padding: "15px",
    marginBottom: "10px",
    borderLeft: `3px solid ${colors.brand}`,
    borderRadius: "0 8px 8px 0",
  },
  tabGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
  },
  summaryCard: {
    background: "rgba(0,0,0,0.42)",
    border: `1px solid ${colors.border}`,
    borderRadius: "12px",
    padding: "14px",
  },
};

function StatusControl({ label, current, max, setCurrent, color }) {
  const visualPercentage = max <= 0 ? 0 : Math.min((current / max) * 100, 100);
  const updateCur = (val) => setCurrent((prev) => Math.max(0, prev + val)); // 👈 Agora não barra mais no limite máximo!

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        color,
        marginBottom: "15px",
      }}
    >
      <div
        style={{ width: "130px", fontSize: "11px", textTransform: "uppercase" }}
      >
        {label}
      </div>
      <button style={styles.btnStep} onClick={() => updateCur(-5)}>
        {"<<"}
      </button>
      <button style={styles.btnStep} onClick={() => updateCur(-1)}>
        {"<"}
      </button>
      <div
        style={{
          flex: 1,
          height: "14px",
          background: "#000",
          border: "1px solid #222",
          position: "relative",
          overflow: "hidden",
          borderRadius: "6px",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${visualPercentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`,
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <button style={styles.btnStep} onClick={() => updateCur(1)}>
        {">"}
      </button>
      <button style={styles.btnStep} onClick={() => updateCur(5)}>
        {">>"}
      </button>
      <div style={{ width: "110px", textAlign: "right", fontSize: "14px" }}>
        <span>{current}</span> <span style={{ color: "#444" }}>/</span>{" "}
        <span style={{ color: "#fff", fontWeight: "bold" }}>{max}</span>
      </div>
    </div>
  );
}

function AppContent() {
  const { signOut, role, user } = useAuth();
  const isDM = role === "adm";
  const storageKey = useMemo(() => `asa-sheet-v2:${user.id}`, [user.id]);

  // ==========================================
  // 1. TODOS OS ESTADOS (useState) PRIMEIRO!
  // ==========================================
  const [nex, setNex] = useState(5);
  const [deslocamento, setDeslocamento] = useState(9);
  const [defArmadura, setDefArmadura] = useState(0);
  const [defOutros, setDefOutros] = useState(0);
  const [origin, setOrigin] = useState("Acadêmico");
  const [originLocked, setOriginLocked] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [setupComplete, setSetupComplete] = useState(false);

  const [attrs, setAttrs] = useState({
    FOR: 1,
    AGI: 2,
    INT: 2,
    VIG: 2,
    PRE: 2,
  });

  const [pvAtual, setPvAtual] = useState(20);
  const [peAtual, setPeAtual] = useState(4);
  const [sanAtual, setSanAtual] = useState(12);

  const [classe, setClasse] = useState("Combatente");
  const [trilha, setTrilha] = useState(rulesByClass.Combatente.defaultTrilha);
  const [classSkillChoices, setClassSkillChoices] = useState(["", ""]);
  const [skillStates, setSkillStates] = useState(createDefaultSkillState);

  const [selectedPowers, setSelectedPowers] = useState([]);
  const [selectedParanormalPowers, setSelectedParanormalPowers] = useState([]);
  const [nexPopup, setNexPopup] = useState(null);

  const [rodadaAtual, setRodadaAtual] = useState(1);
  const [combatLogs, setCombatLogs] = useState([]);
  const [aliadosCampanha, setAliadosCampanha] = useState([]);
  const [combatParticipants, setCombatParticipants] = useState([]);
  const [turnOrder, setTurnOrder] = useState([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [turnDoneBy, setTurnDoneBy] = useState([]);
  const [selectedOrderDraft, setSelectedOrderDraft] = useState([]);
  const [selectedMission, setSelectedMission] = useState("");
  const [playerCharacters, setPlayerCharacters] = useState([
    { id: `char-${Date.now()}`, nome: "" },
  ]);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [preMissionReady, setPreMissionReady] = useState(false);

  const [rituaisSelecionados, setRituaisSelecionados] = useState([]);
  const [alvosRituais, setAlvosRituais] = useState({});
  const [versoesRituais, setVersoesRituais] = useState({});
  const [isRitualModalOpen, setIsRitualModalOpen] = useState(false);
  const [filtroElemento, setFiltroElemento] = useState("Todos");
  const [filtroCirculo, setFiltroCirculo] = useState("Todos");

  const [nomePersonagem, setNomePersonagem] = useState("");
  const [efeitoRitual, setEfeitoRitual] = useState(null);

  const [prestigio, setPrestigio] = useState(0);
  const [inventario, setInventario] = useState([]);

  const [itemBaseSelecionado, setItemBaseSelecionado] = useState(null);
  const [modsSelecionadas, setModsSelecionadas] = useState([]);
  const [maldicoesSelecionadas, setMaldicoesSelecionadas] = useState([]);
  const [infoModal, setInfoModal] = useState(null);

  function openInfoModal(kind, keys, startIndex = 0) {
    setInfoModal({
      kind,
      keys,
      index: startIndex,
    });
  }

  function getInfoEntry(modal) {
    if (!modal || !modal.keys?.length) return null;
    const key = modal.keys[modal.index];
    if (modal.kind === "mod") {
      return {
        title: `Modificação: ${key}`,
        text: MOD_FULL_DESC[key] || MOD_EFFECTS[key] || key,
      };
    }
    return {
      title: `Maldição: ${key}`,
      text: CURSE_FULL_DESC[key] || CURSE_EFFECTS[key] || key,
    };
  }

  function restartCharacterSetup() {
    if (
      !window.confirm(
        "Recomeçar seleção inicial? Origem e Classe serão desbloqueadas."
      )
    ) {
      return;
    }
    setSetupComplete(false);
    setSetupStep(1);
    setOriginLocked(false);
  }
  const itemDescRef = useRef(null);

  const [expandedDesc, setExpandedDesc] = useState({});
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );

  const [activeTab, setActiveTab] = useState("status");
  const [editingAttr, setEditingAttr] = useState(null);
  const [attrError, setAttrError] = useState("");
  const [skillsError, setSkillsError] = useState("");
  const [profileError, setProfileError] = useState("");

  const errorTimerRef = useRef(null);
  const skillsTimerRef = useRef(null);
  const profileTimerRef = useRef(null);
  const prevNexRef = useRef(5);
  const isInitialMount = useRef(true);
  const isMobile = viewportWidth <= 900;
  const isSmallMobile = viewportWidth <= 520;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function getActiveCharacterName() {
    const selected = playerCharacters.find((c) => c.id === selectedCharacterId);
    if (selected?.nome?.trim()) return selected.nome.trim();
    if (nomePersonagem?.trim()) return nomePersonagem.trim();
    return user.email.split("@")[0];
  }

  function parseFlowEvents(logs) {
    const events = [];
    for (const log of [...logs].reverse()) {
      if (!log?.acao || typeof log.acao !== "string") continue;
      if (!log.acao.startsWith("[FLOW]")) continue;
      const raw = log.acao.slice(6);
      try {
        const event = JSON.parse(raw);
        events.push(event);
      } catch {
        // ignora evento inválido
      }
    }
    return events;
  }

  function computeCombatFlow(logs, currentRound) {
    const joinedByUser = new Map();
    let order = [];
    let done = [];
    let idx = 0;

    for (const event of parseFlowEvents(logs)) {
      if (event?.event === "JOIN" && event?.payload?.userId) {
        joinedByUser.set(event.payload.userId, {
          userId: event.payload.userId,
          nome: event.payload.nome || "Sem nome",
        });
      }
      if (event?.event === "SET_ORDER" && Array.isArray(event?.payload?.order)) {
        order = event.payload.order;
        idx = 0;
        done = [];
      }
      if (
        event?.event === "TURN_DONE" &&
        event?.payload?.userId &&
        Number(event?.payload?.round) === Number(currentRound)
      ) {
        if (!done.includes(event.payload.userId)) done.push(event.payload.userId);
        if (order[idx] === event.payload.userId) {
          idx = Math.min(idx + 1, Math.max(order.length - 1, 0));
        }
      }
      if (
        event?.event === "ROUND_RESET" &&
        Number(event?.payload?.round) === Number(currentRound)
      ) {
        idx = 0;
        done = [];
      }
    }

    const participants = [...joinedByUser.values()];
    return { participants, order, done, idx };
  }

  async function emitCombatFlow(event, payload) {
    await supabase.from("combat_log").insert([
      {
        personagem: "SISTEMA FLOW",
        acao: `[FLOW]${JSON.stringify({ event, payload, at: Date.now() })}`,
        rodada: rodadaAtual,
      },
    ]);
  }

  // ==========================================
  // 2. CÁLCULOS E DERIVAÇÕES (Agora é seguro usar as variáveis!)
  // ==========================================
  const patenteInfo = useMemo(() => {
    if (prestigio >= 200)
      return {
        nome: "Agente de Elite",
        credito: "Ilimitado",
        limite: { I: 3, II: 3, III: 3, IV: 2 },
      };
    if (prestigio >= 100)
      return {
        nome: "Oficial de Operações",
        credito: "Alto",
        limite: { I: 3, II: 3, III: 2, IV: 1 },
      };
    if (prestigio >= 50)
      return {
        nome: "Agente Especial",
        credito: "Médio",
        limite: { I: 3, II: 2, III: 1, IV: 0 },
      };
    if (prestigio >= 20)
      return {
        nome: "Operador",
        credito: "Médio",
        limite: { I: 3, II: 1, III: 0, IV: 0 },
      };
    return {
      nome: "Recruta",
      credito: "Baixo",
      limite: { I: 2, II: 0, III: 0, IV: 0 },
    };
  }, [prestigio]);

  const isTecnico =
    classe === "Especialista" && trilha === "Técnico" && nex >= 10;
  const forEfetiva = attrs.FOR + (isTecnico ? attrs.INT : 0);
  const cargaMaxima = forEfetiva <= 0 ? 2 : forEfetiva * 5;
  const cargaAtual = inventario.reduce(
    (acc, curr) => acc + Number(curr.espacos),
    0
  );
  const modsDisponiveis = getAllowedModsForItem(itemBaseSelecionado);
  const maldicoesDisponiveis = getAllowedCursesForItem(itemBaseSelecionado);
  const canUseCursedItems = [
    "Agente Especial",
    "Oficial de Operações",
    "Agente de Elite",
  ].includes(patenteInfo.nome);
  const previewItem = useMemo(() => {
    if (!itemBaseSelecionado) return null;
    const base = {
      nome: itemBaseSelecionado.nome,
      cat: itemBaseSelecionado.cat,
      espacos: itemBaseSelecionado.espacos,
      dano: itemBaseSelecionado.dano || "",
      critico: itemBaseSelecionado.critico || "",
      alcance: itemBaseSelecionado.alcance || "",
      tipo: itemBaseSelecionado.tipo || "",
      desc: itemBaseSelecionado.desc || "",
    };
    let next = base;
    if (modsSelecionadas.length > 0) {
      next = applyWeaponModifications(next, modsSelecionadas);
    }
    if (maldicoesSelecionadas.length > 0) {
      next = applyWeaponCurses(next, maldicoesSelecionadas);
    }
    return next;
  }, [itemBaseSelecionado, modsSelecionadas, maldicoesSelecionadas]);

  useEffect(() => {
    if (!itemDescRef.current) return;
    itemDescRef.current.style.height = "auto";
    itemDescRef.current.style.height = `${itemDescRef.current.scrollHeight}px`;
  }, [previewItem?.desc]);

  useEffect(() => {
    if (canUseCursedItems) return;
    if (maldicoesSelecionadas.length > 0) setMaldicoesSelecionadas([]);
  }, [canUseCursedItems, maldicoesSelecionadas]);

  useEffect(() => {
    if (!selectedCharacterId && playerCharacters.length > 0) {
      setSelectedCharacterId(playerCharacters[0].id);
    }
  }, [selectedCharacterId, playerCharacters]);

  useEffect(() => {
    if (!selectedMission || !selectedCharacterId) {
      setPreMissionReady(false);
    }
  }, [selectedMission, selectedCharacterId]);

  const categoriasUsadas = useMemo(() => {
    const contagem = { I: 0, II: 0, III: 0, IV: 0 };
    inventario.forEach((item) => {
      if (item.cat === 1) contagem.I++;
      if (item.cat === 2) contagem.II++;
      if (item.cat === 3) contagem.III++;
      if (item.cat >= 4) contagem.IV++;
    });
    return contagem;
  }, [inventario]);

  const limiteRituais = useMemo(() => {
    let total = 0;
    if (classe === "Ocultista") {
      total += 2 + Math.floor(nex / 5);
      if (trilha === "Graduado" && nex >= 10) {
        total += 1;
        if (nex >= 25) total += 1;
        if (nex >= 55) total += 1;
        if (nex >= 85) total += 1;
      }
      if (trilha === "Graduado" && nex >= 40) {
        total += attrs.INT;
        if (nex >= 55) total += 1;
        if (nex >= 85) total += 1;
      }
    }
    const aprenderRitualCount = selectedParanormalPowers.filter(
      (p) => p === "Aprender Ritual"
    ).length;
    total += aprenderRitualCount;
    return total;
  }, [classe, trilha, nex, attrs.INT, selectedParanormalPowers]);

  // ==========================================
  // 3. EFEITOS DO SUPABASE (Abaixo dessa linha fica tudo igual)
  // ==========================================

  useEffect(() => {
    if (!user) return;

    // Puxa o estado atual ao entrar
    const carregarMesa = async () => {
      const { data: st } = await supabase
        .from("combat_state")
        .select("rodada")
        .eq("id", 1)
        .single();
      if (st) setRodadaAtual(st.rodada);

      const { data: logs } = await supabase
        .from("combat_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40);
      if (logs) setCombatLogs(logs);
    };
    carregarMesa();

    // Fica escutando qualquer pessoa atualizando o banco
    const stateSub = supabase
      .channel("state-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "combat_state" },
        (payload) => {
          setRodadaAtual(payload.new.rodada);
        }
      )
      .subscribe();

    const logSub = supabase
      .channel("log-inserts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "combat_log" },
        (payload) => {
          setCombatLogs((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(stateSub);
      supabase.removeChannel(logSub);
    };
  }, [user]);

  useEffect(() => {
    const flow = computeCombatFlow(combatLogs, rodadaAtual);
    setCombatParticipants(flow.participants);
    setTurnOrder(flow.order);
    setTurnDoneBy(flow.done);
    setTurnIndex(flow.idx);
  }, [combatLogs, rodadaAtual]);

  useEffect(() => {
    if (turnOrder.length > 0) {
      setSelectedOrderDraft(turnOrder);
      return;
    }
    setSelectedOrderDraft((prev) => {
      if (prev.length > 0) return prev;
      return combatParticipants.map((p) => p.userId);
    });
  }, [turnOrder, combatParticipants]);

  // Função exclusiva do Mestre
  const avancarRodada = async () => {
    if (!isDM) return;
    if (!turnOrder.length) {
      alert("Defina a ordem do turno antes de avançar rodada.");
      return;
    }
    const pendentes = turnOrder.filter((id) => !turnDoneBy.includes(id));
    if (pendentes.length > 0) {
      const nomesPendentes = pendentes
        .map((id) => combatParticipants.find((p) => p.userId === id)?.nome || id)
        .join(", ");
      alert(`Ainda faltam agir nesta rodada: ${nomesPendentes}`);
      return;
    }
    const prox = rodadaAtual + 1;
    setRodadaAtual(prox);
    await supabase.from("combat_state").update({ rodada: prox }).eq("id", 1);
    await emitCombatFlow("ROUND_RESET", { round: prox });
    await supabase.from("combat_log").insert([
      {
        personagem: "SISTEMA A.S.A.",
        acao: `A Rodada ${prox} começou!`,
        rodada: prox,
      },
    ]);
  };

  useEffect(() => {
    async function fetchProfiles() {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome_personagem, email");

      if (!error && data) {
        const players = data
          .filter((p) => p.id !== user.id)
          .map((p) => ({
            id: p.id,
            nome: p.nome_personagem || p.email.split("@")[0],
          }));
        setAliadosCampanha(players);

        const myProfile = data.find((p) => p.id === user.id);
        if (myProfile?.nome_personagem) {
          setNomePersonagem(myProfile.nome_personagem);
          setPlayerCharacters((prev) => {
            if (prev.some((c) => c.nome === myProfile.nome_personagem)) return prev;
            return [
              ...prev,
              { id: `char-${Date.now()}-main`, nome: myProfile.nome_personagem },
            ];
          });
        }
      }
    }
    fetchProfiles();
  }, [user]);

  const handleSalvarNome = async () => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ nome_personagem: nomePersonagem })
      .eq("id", user.id);
  };

  useEffect(() => {
    const oldNex = prevNexRef.current;
    if (nex > oldNex) {
      const unlocks = getUnlocksForNexRange(oldNex, nex, classe, trilha);
      if (unlocks.length > 0) setNexPopup({ from: oldNex, to: nex, unlocks });
    }
    prevNexRef.current = nex;
  }, [nex, classe, trilha]);

  const regra = rulesByClass[classe];
  const nexIndex = NEX_VALUES.indexOf(nex);
  const nivel = Math.max(1, Math.floor(nex / 5));
  const limitePE = nex === 99 ? 20 : Math.floor(nex / 5);
  const limitePERitual =
    classe === "Ocultista" && trilha === "Intuitivo" && nex >= 40
      ? limitePE + attrs.PRE
      : limitePE;
  const defesaTotal = 10 + attrs.AGI + defArmadura + defOutros;
  const mandalaSize = isSmallMobile ? 320 : isMobile ? 390 : 520;
  const nodeSize = isSmallMobile ? 58 : isMobile ? 66 : 76;
  const attrRadius = isSmallMobile ? 120 : isMobile ? 150 : 200;

  // 👇 NOVA MATEMÁTICA: LENDO OS PODERES PASSIVOS 👇
  const temSangueDeFerro = selectedParanormalPowers.includes("Sangue de Ferro");
  const temCascaGrossa =
    classe === "Combatente" && trilha === "Tropa de Choque" && nex >= 10;
  const temPotencialAprimorado = selectedParanormalPowers.includes(
    "Potencial Aprimorado"
  );

  const bonusPV =
    (temSangueDeFerro ? nivel * 2 : 0) + (temCascaGrossa ? nivel * 1 : 0);
  const bonusPE = temPotencialAprimorado ? nivel * 1 : 0;

  const maxPVCalculado =
    regra.pvBase +
    attrs.VIG +
    (nivel - 1) * (regra.pvNivel + attrs.VIG) +
    bonusPV;
  const maxPECalculado =
    regra.peBase +
    attrs.PRE +
    (nivel - 1) * (regra.peNivel + attrs.PRE) +
    bonusPE;
  // 👆 FIM DA NOVA MATEMÁTICA 👆

  const transcendCount = selectedPowers.filter(
    (power) => power === "Transcender"
  ).length;
  const maxSANCalculado =
    regra.sanBase +
    (nivel - 1) * regra.sanNivel -
    transcendCount * regra.sanNivel;

  let maxSingleAttr = 3;
  if (nex >= 50) maxSingleAttr = 5;
  else if (nex >= 20) maxSingleAttr = 4;

  let maxTotalPoints = 9;
  if (nex >= 20) maxTotalPoints += 1;
  if (nex >= 50) maxTotalPoints += 1;
  if (nex >= 80) maxTotalPoints += 1;
  if (nex >= 95) maxTotalPoints += 1;

  const currentTotalPoints = useMemo(
    () => Object.values(attrs).reduce((a, b) => a + b, 0),
    [attrs]
  );
  // 👇 NOVO: CÁLCULO DE LIMITE DE RITUAIS 👇
  const trainingCap =
    nex >= 70 ? "expert" : nex >= 35 ? "veterano" : "treinado";
  const trainingRank = { destreinado: 0, treinado: 1, veterano: 2, expert: 3 };

  const trilhasDisponiveis = Object.keys(trilhasData[classe]);

  const habilidadesBaseAtuais = classBaseAbilities[classe].filter(
    (h) => nex >= h.nex
  );
  const habilidadesTrilhaAtuais = trilhasData[classe][trilha].filter(
    (h) => nex >= h.nex
  );
  const habilidadesAtuais = [
    ...habilidadesBaseAtuais,
    ...habilidadesTrilhaAtuais.map((h) => ({ ...h, tipo: "trilha" })),
  ].sort((a, b) => a.nex - b.nex);
  const powerSlots = getPowerSlots(nex);
  const originSkills = originsData[origin] ?? [];
  const fixedClassSkills = classSkillChoices.filter(Boolean);
  const freeChoicesAllowed = regra.freeChoicesBase + attrs.INT;

  const manualChosenSkills = useMemo(() => {
    const autoSkills = new Set([...originSkills, ...fixedClassSkills]);
    return Object.entries(skillStates)
      .filter(([, val]) => val.treino !== "destreinado")
      .map(([name]) => name)
      .filter((name) => !autoSkills.has(name));
  }, [skillStates, originSkills, fixedClassSkills]);

  const totalChosenTrained = useMemo(() => {
    const names = new Set([
      ...originSkills,
      ...fixedClassSkills,
      ...manualChosenSkills,
    ]);
    return names.size;
  }, [originSkills, fixedClassSkills, manualChosenSkills]);

  const expectedTrainedCount = 2 + fixedClassSkills.length + freeChoicesAllowed;
  const freeChoicesUsed = manualChosenSkills.length;

  function flashAttrError(message) {
    setAttrError(message);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setAttrError(""), 4000);
  }
  function flashSkillsError(message) {
    setSkillsError(message);
    if (skillsTimerRef.current) clearTimeout(skillsTimerRef.current);
    skillsTimerRef.current = setTimeout(() => setSkillsError(""), 4000);
  }
  function flashProfileError(message) {
    setProfileError(message);
    if (profileTimerRef.current) clearTimeout(profileTimerRef.current);
    profileTimerRef.current = setTimeout(() => setProfileError(""), 4000);
  }

  function handleAttrChange(key, rawValue) {
    const parsed = rawValue === "" ? 0 : Number(rawValue);
    if (Number.isNaN(parsed) || parsed < 0) return;
    const updatedAttrs = { ...attrs, [key]: parsed };
    const newTotal = Object.values(updatedAttrs).reduce((a, b) => a + b, 0);
    const zeroCount = Object.values(updatedAttrs).filter((v) => v === 0).length;

    if (parsed > maxSingleAttr) {
      flashAttrError(
        `LIMITE ATINGIDO: o teto de atributo no NEX ${nex}% é ${maxSingleAttr}.`
      );
      return;
    }
    if (newTotal > maxTotalPoints) {
      flashAttrError(
        `CARGA EXCEDIDA: você só pode ter ${maxTotalPoints} pontos totais no NEX ${nex}%.`
      );
      return;
    }
    if (nex === 5 && zeroCount > 1) {
      flashAttrError(
        "Na criação, apenas um atributo pode ser reduzido para 0."
      );
      return;
    }

    setAttrError("");
    setAttrs(updatedAttrs);
  }

  function handleClasseChange(novaClasse) {
    setClasse(novaClasse);
    setTrilha(rulesByClass[novaClasse].defaultTrilha);
    setProfileError("");

    // 👇 Limpa os poderes antigos para não bugar a ficha 👇
    setSelectedPowers([]);
    setSelectedParanormalPowers([]);

    if (novaClasse === "Combatente") {
      setClassSkillChoices(["", ""]);
    } else if (novaClasse === "Ocultista") {
      setClassSkillChoices(["Ocultismo", "Vontade"]);
    } else {
      setClassSkillChoices([]);
    }
  }

  function isAutoTrained(skillName) {
    return (
      (originLocked && originSkills.includes(skillName)) ||
      fixedClassSkills.includes(skillName)
    );
  }

  function resetSkills() {
    const next = createDefaultSkillState();
    for (const skillName of originLocked ? originSkills : []) {
      next[skillName] = { ...next[skillName], treino: "treinado", outros: 0 };
    }
    for (const skillName of fixedClassSkills) {
      next[skillName] = { ...next[skillName], treino: "treinado", outros: 0 };
    }
    setSkillStates(next);
    setSkillsError("");
  }

  function lockOriginAndClassSkills() {
    const requiredChoices = regra.fixedChoices.length;
    if (!origin) {
      flashProfileError("Selecione uma origem antes de confirmar o arquétipo.");
      return;
    }
    if (
      requiredChoices > 0 &&
      classSkillChoices.filter(Boolean).length !== requiredChoices
    ) {
      flashProfileError(
        "Preencha todas as perícias obrigatórias da classe antes de confirmar."
      );
      return;
    }
    if (
      new Set(classSkillChoices.filter(Boolean)).size !==
      classSkillChoices.filter(Boolean).length
    ) {
      flashProfileError("As escolhas fixas da classe não podem se repetir.");
      return;
    }

    setOriginLocked(true);
    setProfileError("");

    setSkillStates((prev) => {
      const next = { ...prev };
      for (const skillName of originSkills) {
        next[skillName] = {
          ...next[skillName],
          treino:
            trainingRank[next[skillName]?.treino || "destreinado"] >
            trainingRank[trainingCap]
              ? trainingCap
              : next[skillName]?.treino === "destreinado"
              ? "treinado"
              : next[skillName]?.treino || "treinado",
        };
      }
      for (const skillName of fixedClassSkills) {
        next[skillName] = {
          ...next[skillName],
          treino:
            trainingRank[next[skillName]?.treino || "destreinado"] >
            trainingRank[trainingCap]
              ? trainingCap
              : next[skillName]?.treino === "destreinado"
              ? "treinado"
              : next[skillName]?.treino || "treinado",
        };
      }
      return next;
    });
  }

  function setSkillTraining(skillName, nextTraining) {
    const skill = skillsCatalog.find((item) => item.nome === skillName);
    if (!skill) return;
    if (trainingRank[nextTraining] > trainingRank[trainingCap]) {
      flashSkillsError(
        `No NEX ${nex}%, o grau máximo permitido é ${trainingCap}.`
      );
      return;
    }
    if (isAutoTrained(skillName) && nextTraining === "destreinado") {
      flashSkillsError(
        "Essa perícia está sendo treinada automaticamente por origem ou classe."
      );
      return;
    }

    const nextStates = {
      ...skillStates,
      [skillName]: { ...skillStates[skillName], treino: nextTraining },
    };
    const autoSkills = new Set([...originSkills, ...fixedClassSkills]);
    const manualCount = Object.entries(nextStates)
      .filter(([, val]) => val.treino !== "destreinado")
      .map(([name]) => name)
      .filter((name) => !autoSkills.has(name)).length;

    if (
      !autoSkills.has(skillName) &&
      nextTraining !== "destreinado" &&
      manualCount > freeChoicesAllowed
    ) {
      flashSkillsError(
        `Você excedeu as perícias livres da classe. Limite atual: ${freeChoicesAllowed}.`
      );
      return;
    }

    setSkillsError("");
    setSkillStates(nextStates);
  }

  function setSkillOtherBonus(skillName, value) {
    const parsed = value === "" ? 0 : Number(value);
    if (Number.isNaN(parsed)) return;
    setSkillStates((prev) => ({
      ...prev,
      [skillName]: { ...prev[skillName], outros: parsed },
    }));
  }

  function handleSelectPower(slotIndex, powerName) {
    const next = [...selectedPowers];
    next[slotIndex] = powerName;
    setSelectedPowers(next);
    if (powerName !== "Transcender") {
      const nextParanormal = [...selectedParanormalPowers];
      nextParanormal[slotIndex] = "";
      setSelectedParanormalPowers(nextParanormal);
    }
  }

  function handleSelectParanormalPower(slotIndex, powerName) {
    const next = [...selectedParanormalPowers];
    next[slotIndex] = powerName;
    setSelectedParanormalPowers(next);
  }

  useEffect(() => {
    if (!trilhasDisponiveis.includes(trilha)) {
      setTrilha(trilhasDisponiveis[0]);
    }
  }, [classe, trilha, trilhasDisponiveis]);

  useEffect(() => {
    setSkillStates((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const skill of skillsCatalog) {
        const current = prev[skill.nome]?.treino ?? "destreinado";
        if (trainingRank[current] > trainingRank[trainingCap]) {
          next[skill.nome] = { ...prev[skill.nome], treino: trainingCap };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [trainingCap]);

  useEffect(() => {
    setOriginLocked(false);
    setProfileError("");
  }, [origin, classe, classSkillChoices.join("|")]);

  // 💾 SAVE NO LOCALSTORAGE
  useEffect(() => {
    // 👇 Impede que o React salve a ficha zerada logo ao abrir a página!
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const payload = {
      ownerUserId: user.id,
      ownerEmail: user.email || "",
      nex,
      deslocamento,
      defArmadura,
      defOutros,
      origin,
      attrs,
      pvAtual,
      peAtual,
      sanAtual,
      classe,
      trilha,
      classSkillChoices,
      skillStates,
      selectedPowers,
      selectedParanormalPowers,
      rituaisSelecionados,
      prestigio,
      inventario,
      originLocked,
      setupComplete,
      selectedMission,
      playerCharacters,
      selectedCharacterId,
      preMissionReady,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [
    nex,
    deslocamento,
    defArmadura,
    defOutros,
    origin,
    attrs,
    pvAtual,
    peAtual,
    sanAtual,
    classe,
    trilha,
    classSkillChoices,
    skillStates,
    selectedPowers,
    selectedParanormalPowers,
    rituaisSelecionados,
    prestigio,
    inventario,
    originLocked,
    setupComplete,
    selectedMission,
    playerCharacters,
    selectedCharacterId,
    preMissionReady,
    storageKey,
    user.id,
    user.email,
  ]);
  // 💾 LOAD DO LOCALSTORAGE
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      if (data?.ownerUserId && data.ownerUserId !== user.id) {
        localStorage.removeItem(storageKey);
        return;
      }
      if (data.nex) {
        // Evita abrir popup de "up de NEX" ao apenas carregar a ficha salva.
        prevNexRef.current = data.nex;
        setNex(data.nex);
      }
      if (typeof data.deslocamento === "number")
        setDeslocamento(data.deslocamento);
      if (typeof data.defArmadura === "number")
        setDefArmadura(data.defArmadura);
      if (typeof data.defOutros === "number") setDefOutros(data.defOutros);
      if (data.origin) setOrigin(data.origin);
      if (data.attrs) setAttrs(data.attrs);
      if (typeof data.pvAtual === "number") setPvAtual(data.pvAtual);
      if (typeof data.peAtual === "number") setPeAtual(data.peAtual);
      if (typeof data.sanAtual === "number") setSanAtual(data.sanAtual);
      if (data.classe) setClasse(data.classe);
      if (data.trilha) setTrilha(data.trilha);
      if (Array.isArray(data.classSkillChoices))
        setClassSkillChoices(data.classSkillChoices);
      if (typeof data.originLocked === "boolean")
        setOriginLocked(data.originLocked);
      if (typeof data.setupComplete === "boolean") {
        setSetupComplete(data.setupComplete);
      } else if (typeof data.originLocked === "boolean") {
        setSetupComplete(data.originLocked);
      }
      if (data.skillStates)
        setSkillStates({ ...createDefaultSkillState(), ...data.skillStates });
      if (Array.isArray(data.selectedPowers))
        setSelectedPowers(data.selectedPowers);
      if (Array.isArray(data.selectedParanormalPowers))
        setSelectedParanormalPowers(data.selectedParanormalPowers);
      if (Array.isArray(data.rituaisSelecionados))
        setRituaisSelecionados(data.rituaisSelecionados);

      // 👈 CARREGANDO INVENTÁRIO
      if (typeof data.prestigio === "number") setPrestigio(data.prestigio);
      if (Array.isArray(data.inventario)) setInventario(data.inventario);
      if (typeof data.selectedMission === "string")
        setSelectedMission(data.selectedMission);
      if (Array.isArray(data.playerCharacters) && data.playerCharacters.length) {
        setPlayerCharacters(data.playerCharacters);
      }
      if (typeof data.selectedCharacterId === "string")
        setSelectedCharacterId(data.selectedCharacterId);
      if (typeof data.preMissionReady === "boolean")
        setPreMissionReady(data.preMissionReady);
    } catch {
      /* erro silencioso */
    }
  }, [storageKey, user.id]);

  if (!preMissionReady) {
    const selectedChar = playerCharacters.find((c) => c.id === selectedCharacterId);
    return (
      <div style={styles.body}>
        <div style={{ ...styles.container, maxWidth: "760px" }}>
          <div style={styles.statusBox}>
            <h2 style={styles.sectionTitle}>PRÉ-MISSÃO</h2>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ ...styles.attrLabel, marginBottom: "8px" }}>MISSÃO</div>
              <select
                value={selectedMission}
                onChange={(e) => setSelectedMission(e.target.value)}
                style={styles.selectField}
              >
                <option value="">Selecione a missão</option>
                {MISSIONS_CATALOG.map((mission) => (
                  <option key={mission} value={mission}>
                    {mission}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ ...styles.attrLabel, marginBottom: "8px" }}>
                PERSONAGENS DO AGENTE
              </div>
              <div style={{ display: "grid", gap: "8px" }}>
                {playerCharacters.map((character) => (
                  <div key={character.id} style={{ display: "flex", gap: "8px" }}>
                    <input
                      value={character.nome}
                      onChange={(e) =>
                        setPlayerCharacters((prev) =>
                          prev.map((c) =>
                            c.id === character.id ? { ...c, nome: e.target.value } : c
                          )
                        )
                      }
                      placeholder="Nome do personagem"
                      style={{ ...styles.selectField, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedCharacterId(character.id)}
                      style={{
                        ...styles.btnStep,
                        borderColor:
                          selectedCharacterId === character.id ? colors.brand : "#333",
                        color: selectedCharacterId === character.id ? colors.brand : "#888",
                        minWidth: "92px",
                      }}
                    >
                      Selecionar
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setPlayerCharacters((prev) => [
                    ...prev,
                    { id: `char-${Date.now()}-${prev.length}`, nome: "" },
                  ])
                }
                style={{ ...styles.btnStep, marginTop: "10px" }}
              >
                + Novo personagem
              </button>
            </div>
            <button
              onClick={async () => {
                if (!selectedMission) {
                  alert("Escolha a missão para continuar.");
                  return;
                }
                if (!selectedChar?.nome?.trim()) {
                  alert("Selecione um personagem com nome.");
                  return;
                }
                setNomePersonagem(selectedChar.nome.trim());
                await supabase
                  .from("profiles")
                  .update({ nome_personagem: selectedChar.nome.trim() })
                  .eq("id", user.id);
                setPreMissionReady(true);
              }}
              style={{
                ...styles.btnStep,
                width: "100%",
                marginTop: "8px",
                borderColor: colors.brand,
                color: colors.brand,
                fontWeight: "bold",
              }}
            >
              Confirmar missão e personagem
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!setupComplete) {
    return (
      <div style={styles.body}>
        <button
          onClick={signOut}
          style={{
            position: "fixed",
            top: isMobile ? "10px" : "20px",
            right: isMobile ? "10px" : "20px",
            zIndex: 9999,
            background: "#ff1744",
            color: "#fff",
            border: "none",
            padding: isMobile ? "8px 12px" : "10px 14px",
            borderRadius: "8px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: "bold",
            fontSize: isMobile ? "12px" : "14px",
            boxShadow: "0 0 10px rgba(255, 23, 68, 0.4)",
          }}
        >
          Sair
        </button>
        <main
          style={{
            width: "100%",
            maxWidth: "900px",
            margin: "0 auto",
            padding: isMobile ? "72px 12px 20px" : "40px 20px",
          }}
        >
          <div style={{ ...styles.summaryCard, marginBottom: "14px" }}>
            <h2
              style={{
                margin: 0,
                color: colors.brand,
                letterSpacing: "3px",
                textShadow: colors.glow,
              }}
            >
              INICIALIZAÇÃO DE AGENTE
            </h2>
            <p style={{ color: "#9fb7c2", marginTop: "8px", marginBottom: 0 }}>
              Selecione Origem e Classe para iniciar a ficha.
            </p>
          </div>

          {setupStep === 1 && (
            <div style={styles.summaryCard}>
              <div style={{ ...styles.attrLabel, marginBottom: "10px" }}>
                ETAPA 1/4 · ORIGEM
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1.1fr 1fr",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignContent: "flex-start" }}>
                  {Object.keys(originsData).map((item) => (
                    <button
                      key={item}
                      onClick={() => setOrigin(item)}
                      style={{
                        ...styles.btnStep,
                        borderColor: origin === item ? colors.brand : "#333",
                        color: origin === item ? colors.brand : "#999",
                        background: origin === item ? `${colors.brand}11` : "#0b0b0f",
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    border: "1px solid #2a2a2a",
                    borderRadius: "10px",
                    padding: "12px",
                    background: "rgba(0,0,0,0.2)",
                  }}
                >
                  <div style={{ color: colors.brand, fontSize: "12px", marginBottom: "8px" }}>
                    {origin}
                  </div>
                  <div style={{ color: "#b6c7d0", fontSize: "12px", lineHeight: 1.5 }}>
                    {originDescription[origin]}
                  </div>
                  <div style={{ marginTop: "10px", fontSize: "12px", color: "#ddd" }}>
                    <strong>Perícias treinadas:</strong>{" "}
                    {originsData[origin]?.length
                      ? originsData[origin].join(" • ")
                      : "Duas à escolha do mestre"}
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "#ddd" }}>
                    <strong>Poder da origem:</strong> {originPowerName[origin]}
                  </div>
                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "12px",
                      color: "#cfd8dc",
                      lineHeight: 1.5,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {originPowerDesc[origin]}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: "16px", textAlign: "right" }}>
                <button
                  onClick={() => setSetupStep(2)}
                  style={{ ...styles.btnStep, borderColor: colors.brand, color: colors.brand }}
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

          {setupStep === 2 && (
            <div style={styles.summaryCard}>
              <div style={{ ...styles.attrLabel, marginBottom: "10px" }}>
                ETAPA 2/4 · CLASSE
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignContent: "flex-start" }}>
                  {["Combatente", "Especialista", "Ocultista"].map((c) => (
                    <button
                      key={c}
                      onClick={() => handleClasseChange(c)}
                      style={{
                        ...styles.btnStep,
                        borderColor: classe === c ? colors.brand : "#333",
                        color: classe === c ? colors.brand : "#999",
                        background: classe === c ? `${colors.brand}11` : "#0b0b0f",
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    border: "1px solid #2a2a2a",
                    borderRadius: "10px",
                    padding: "12px",
                    background: "rgba(0,0,0,0.2)",
                    fontSize: "12px",
                    color: "#ddd",
                    lineHeight: 1.55,
                  }}
                >
                  <div style={{ color: colors.brand, marginBottom: "8px" }}>
                    {classe}
                  </div>
                  <div style={{ color: "#b6c7d0", marginBottom: "8px" }}>
                    {classInfo[classe]?.role}
                  </div>
                  <div
                    style={{
                      color: "#cfd8dc",
                      marginBottom: "8px",
                      lineHeight: 1.5,
                    }}
                  >
                    {classInfo[classe]?.full}
                  </div>
                  <div>
                    <strong>PV iniciais:</strong> {classInfo[classe]?.pv}
                  </div>
                  <div>
                    <strong>PE iniciais:</strong> {classInfo[classe]?.pe}
                  </div>
                  <div>
                    <strong>SAN inicial:</strong> {classInfo[classe]?.san}
                  </div>
                  <div style={{ marginTop: "6px" }}>
                    <strong>Perícias:</strong> {classInfo[classe]?.pericias}
                  </div>
                  <div style={{ marginTop: "6px" }}>
                    <strong>Proficiências:</strong> {classInfo[classe]?.prof}
                  </div>
                  <div
                    style={{
                      marginTop: "8px",
                      color: "#cfd8dc",
                      lineHeight: 1.5,
                      whiteSpace: "pre-line",
                    }}
                  >
                    <strong>Núcleo de habilidades:</strong>
                    {"\n"}
                    {classInfo[classe]?.corePowers}
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <button onClick={() => setSetupStep(1)} style={styles.btnStep}>
                  Voltar
                </button>
                <button
                  onClick={() => setSetupStep(3)}
                  style={{ ...styles.btnStep, borderColor: colors.brand, color: colors.brand }}
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

          {setupStep === 3 && (
            <div style={styles.summaryCard}>
              <div style={{ ...styles.attrLabel, marginBottom: "10px" }}>
                ETAPA 3/4 · TRILHA
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignContent: "flex-start" }}>
                  {trilhasDisponiveis.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTrilha(t)}
                      style={{
                        ...styles.btnStep,
                        borderColor: trilha === t ? colors.brand : "#333",
                        color: trilha === t ? colors.brand : "#999",
                        background: trilha === t ? `${colors.brand}11` : "#0b0b0f",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div style={{ border: "1px solid #2a2a2a", borderRadius: "10px", padding: "12px", background: "rgba(0,0,0,0.2)" }}>
                  <div style={{ color: colors.brand, marginBottom: "8px", fontSize: "12px" }}>
                    {trilha}
                  </div>
                  <div style={{ fontSize: "12px", color: "#cfd8dc", lineHeight: 1.5, whiteSpace: "pre-line" }}>
                    {(trilhasData[classe]?.[trilha] || [])
                      .map((h) => `NEX ${h.nex}% - ${h.nome}\n${h.desc}`)
                      .join("\n\n")}
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <button onClick={() => setSetupStep(2)} style={styles.btnStep}>
                  Voltar
                </button>
                <button
                  onClick={() => setSetupStep(4)}
                  style={{
                    ...styles.btnStep,
                    borderColor: colors.brand,
                    color: colors.brand,
                    fontWeight: "bold",
                  }}
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

          {setupStep === 4 && (
            <div style={styles.summaryCard}>
              <div style={{ ...styles.attrLabel, marginBottom: "10px" }}>
                ETAPA 4/4 · CONFIRMAÇÃO
              </div>
              <div style={{ color: "#ddd", lineHeight: 1.7 }}>
                <div>
                  <strong>Origem:</strong> {origin}
                </div>
                <div>
                  <strong>Classe:</strong> {classe}
                </div>
                <div>
                  <strong>Trilha Inicial:</strong> {trilha}
                </div>
              </div>
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <button onClick={() => setSetupStep(3)} style={styles.btnStep}>
                  Voltar
                </button>
                <button
                  onClick={() => {
                    setOriginLocked(true);
                    setSetupComplete(true);
                    setActiveTab("status");
                  }}
                  style={{
                    ...styles.btnStep,
                    borderColor: colors.brand,
                    color: colors.brand,
                    fontWeight: "bold",
                  }}
                >
                  Iniciar Ficha
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div style={styles.body}>
      <button
        onClick={signOut}
        style={{
          position: "fixed",
          top: isMobile ? "10px" : "20px",
          right: isMobile ? "10px" : "20px",
          zIndex: 9999,
          background: "#ff1744",
          color: "#fff",
          border: "none",
          padding: isMobile ? "8px 12px" : "10px 14px",
          borderRadius: "8px",
          cursor: "pointer",
          fontFamily: "inherit",
          fontWeight: "bold",
          fontSize: isMobile ? "12px" : "14px",
          boxShadow: "0 0 10px rgba(255, 23, 68, 0.4)",
        }}
      >
        Sair
      </button>
      <button
        onClick={restartCharacterSetup}
        style={{
          position: "fixed",
          top: isMobile ? "10px" : "20px",
          right: isMobile ? "88px" : "92px",
          zIndex: 9999,
          background: "#1a1b22",
          color: colors.brand,
          border: `1px solid ${colors.brand}66`,
          padding: isMobile ? "8px 10px" : "10px 12px",
          borderRadius: "8px",
          cursor: "pointer",
          fontFamily: "inherit",
          fontWeight: "bold",
          fontSize: isMobile ? "12px" : "14px",
        }}
      >
        Recomeçar
      </button>
      {/* 👇 ANIMAÇÃO DE RITUAIS 👇 */}
      <style>
        {`
          @keyframes ritualCast {
            0% { opacity: 0; filter: contrast(1); }
            15% { opacity: 1; filter: contrast(1.3); }
            100% { opacity: 0; filter: contrast(1); }
          }
        `}
      </style>

      {efeitoRitual && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            pointerEvents: "none", // 👈 MUITO IMPORTANTE: permite clicar "através" do efeito
            zIndex: 10000,
            background:
              efeitoRitual === "Sangue"
                ? "radial-gradient(circle, transparent 30%, rgba(255, 23, 68, 0.45) 100%)"
                : efeitoRitual === "Morte"
                ? "radial-gradient(circle, transparent 30%, rgba(10, 10, 15, 0.9) 100%)"
                : efeitoRitual === "Conhecimento"
                ? "radial-gradient(circle, transparent 30%, rgba(255, 209, 102, 0.45) 100%)"
                : efeitoRitual === "Energia"
                ? "radial-gradient(circle, transparent 30%, rgba(0, 229, 255, 0.45) 100%)"
                : "radial-gradient(circle, transparent 30%, rgba(255, 255, 255, 0.6) 100%)", // Medo
            boxShadow: `inset 0 0 150px ${
              efeitoRitual === "Sangue"
                ? "#ff1744"
                : efeitoRitual === "Morte"
                ? "#000000"
                : efeitoRitual === "Conhecimento"
                ? "#ffd166"
                : efeitoRitual === "Energia"
                ? "#00e5ff"
                : "#ffffff"
            }`,
            animation: "ritualCast 1.5s ease-out forwards",
          }}
        />
      )}
      {/* 👆 FIM DA ANIMAÇÃO 👆 */}
      {nexPopup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupBox}>
            <h3
              style={{
                marginTop: 0,
                color: colors.brand,
                letterSpacing: "2px",
              }}
            >
              NEX {nexPopup.to}% DESBLOQUEADO
            </h3>
            <p
              style={{
                color: "#8fb7c4",
                fontSize: "12px",
                marginBottom: "18px",
              }}
            >
              Novos acessos liberados na progressão.
            </p>
            {nexPopup.unlocks.map((item, i) => (
              <div key={`${item.nome}-${i}`} style={styles.popupItem}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    marginBottom: "6px",
                  }}
                >
                  <strong style={{ color: "#fff" }}>{item.nome}</strong>
                  <span
                    style={{
                      fontSize: "10px",
                      color: colors.pe,
                      background: "rgba(197, 160, 0, 0.1)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    NEX {item.nex}%
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    color: "#aaa",
                    fontSize: "12px",
                    lineHeight: 1.5,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
            <button
              onClick={() => setNexPopup(null)}
              style={{
                ...styles.btnStep,
                marginTop: "10px",
                padding: "10px 14px",
                borderColor: colors.brand,
                color: colors.brand,
                width: "100%",
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* 👇 MODAL DA BIBLIOTECA DE RITUAIS (EM TELA CHEIA) 👇 */}
      {isRitualModalOpen && (
        <div
          style={{
            ...styles.popupOverlay,
            width: "100vw",
            height: "100vh",
            top: 0,
            left: 0,
          }}
          onClick={() => setIsRitualModalOpen(false)}
        >
          <div
            style={{
              ...styles.popupBox,
              width: "100%",
              maxWidth: "850px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CABEÇALHO DO MODAL */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                borderBottom: `1px solid ${colors.brand}44`,
                paddingBottom: "15px",
              }}
            >
              <h2
                style={{
                  color: colors.brand,
                  margin: 0,
                  letterSpacing: "2px",
                  fontSize: "18px",
                }}
              >
                BIBLIOTECA ARCANA
              </h2>
              <button
                onClick={() => setIsRitualModalOpen(false)}
                style={{
                  ...styles.btnStep,
                  borderColor: colors.pv,
                  color: colors.pv,
                }}
              >
                FECHAR ✖
              </button>
            </div>

            {/* FILTROS */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <select
                value={filtroElemento}
                onChange={(e) => setFiltroElemento(e.target.value)}
                style={styles.selectField}
              >
                <option value="Todos">Todos os Elementos</option>
                <option value="Conhecimento">Conhecimento</option>
                <option value="Energia">Energia</option>
                <option value="Medo">Medo</option>
                <option value="Morte">Morte</option>
                <option value="Sangue">Sangue</option>
              </select>

              <select
                value={filtroCirculo}
                onChange={(e) => setFiltroCirculo(e.target.value)}
                style={styles.selectField}
              >
                <option value="Todos">Todos os Círculos</option>
                <option value="1">1º Círculo</option>
                <option value="2">2º Círculo</option>
                <option value="3">3º Círculo</option>
                <option value="4">4º Círculo</option>
              </select>
            </div>

            {/* GRID DE RITUAIS FILTRADOS */}
            <div
              style={{
                ...styles.tabGrid,
                overflowY: "auto",
                paddingRight: "10px",
                flex: 1,
              }}
            >
              {rituaisCatalog
                .filter((r) => !rituaisSelecionados.includes(r.nome))
                .filter(
                  (r) =>
                    filtroElemento === "Todos" || r.elemento === filtroElemento
                )
                .filter(
                  (r) =>
                    filtroCirculo === "Todos" ||
                    r.circulo.toString() === filtroCirculo
                )
                .sort(
                  (a, b) =>
                    a.circulo - b.circulo ||
                    a.elemento.localeCompare(b.elemento)
                )
                .map((r) => {
                  let corRitual = colors.pe;
                  if (r.elemento === "Morte") corRitual = "#9e9e9e";
                  if (r.elemento === "Sangue") corRitual = "#ff1744";
                  if (r.elemento === "Energia") corRitual = "#00e5ff";
                  if (r.elemento === "Conhecimento") corRitual = "#ffd166";
                  if (r.elemento === "Medo") corRitual = "#ffffff";

                  return (
                    <div
                      key={r.nome}
                      style={{
                        ...styles.summaryCard,
                        borderLeft: `3px solid ${corRitual}`,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "8px",
                          }}
                        >
                          <strong
                            style={{
                              color: "#fff",
                              fontSize: "14px",
                              letterSpacing: "1px",
                            }}
                          >
                            {r.nome.toUpperCase()}
                          </strong>
                          <span
                            style={{
                              fontSize: "10px",
                              color: corRitual,
                              background: `${corRitual}11`,
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {r.circulo}º CÍRCULO
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#aaa",
                            lineHeight: 1.6,
                            margin: "0 0 15px 0",
                            whiteSpace: "pre-line",
                          }}
                        >
                          {r.desc}
                          {r.discente && (
                            <>
                              <br />
                              <br />
                              <span style={{ color: "#00e5ff" }}>
                                [ DISCENTE ]: {r.discente.desc}
                              </span>
                            </>
                          )}
                          {r.verdadeiro && (
                            <>
                              <br />
                              <br />
                              <span style={{ color: "#ffd166" }}>
                                [ VERDADEIRO ]: {r.verdadeiro.desc}
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          setRituaisSelecionados([
                            ...rituaisSelecionados,
                            r.nome,
                          ])
                        }
                        style={{
                          ...styles.btnStep,
                          width: "100%",
                          borderColor: corRitual,
                          color: corRitual,
                          fontWeight: "bold",
                        }}
                      >
                        + APRENDER
                      </button>
                    </div>
                  );
                })}
            </div>
            {/* MENSAGEM SE NÃO ACHAR NADA */}
            {rituaisCatalog.filter(
              (r) =>
                !rituaisSelecionados.includes(r.nome) &&
                (filtroElemento === "Todos" || r.elemento === filtroElemento) &&
                (filtroCirculo === "Todos" ||
                  r.circulo.toString() === filtroCirculo)
            ).length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#666",
                  padding: "40px 0",
                }}
              >
                Nenhum ritual novo encontrado com esses filtros.
              </div>
            )}
          </div>
        </div>
      )}
      {/* 👆 FIM DO MODAL DE RITUAIS 👆 */}

      <nav
        style={{
          ...styles.sidebar,
          width: isMobile ? "58px" : "74px",
          gap: isMobile ? "14px" : "24px",
          padding: isMobile ? "12px 0" : "18px 0",
        }}
      >
        <div
          style={{
            color: colors.brand,
            fontWeight: "bold",
            fontSize: "12px",
            marginBottom: "20px",
            letterSpacing: "2px",
          }}
        >
          A.S.A
        </div>
        <button
          onClick={() => setActiveTab("status")}
          style={{
            ...styles.navBtn,
            fontSize: isMobile ? "22px" : styles.navBtn.fontSize,
            color: activeTab === "status" ? colors.brand : "#333",
          }}
          title="Bio-Monitor"
        >
          ◈
        </button>
        <button
          onClick={() => setActiveTab("classe")}
          style={{
            ...styles.navBtn,
            fontSize: isMobile ? "22px" : styles.navBtn.fontSize,
            color: activeTab === "classe" ? colors.brand : "#333",
          }}
          title="Arquétipo"
        >
          ◬
        </button>
        <button
          onClick={() => setActiveTab("pericias")}
          style={{
            ...styles.navBtn,
            fontSize: isMobile ? "22px" : styles.navBtn.fontSize,
            color: activeTab === "pericias" ? colors.brand : "#333",
          }}
          title="Perícias"
        >
          ⌘
        </button>
        <button
          onClick={() => setActiveTab("rituais")}
          style={{
            ...styles.navBtn,
            fontSize: isMobile ? "22px" : styles.navBtn.fontSize,
            color: activeTab === "rituais" ? colors.brand : "#333",
          }}
          title="Rituais"
        >
          ✧
        </button>
        <button
          onClick={() => setActiveTab("inventario")}
          style={{
            ...styles.navBtn,
            fontSize: isMobile ? "22px" : styles.navBtn.fontSize,
            color: activeTab === "inventario" ? colors.brand : "#333",
          }}
          title="Inventário"
        >
          🎒
        </button>
        <button
          onClick={() => setActiveTab("combate")}
          style={{
            ...styles.navBtn,
            fontSize: isMobile ? "22px" : styles.navBtn.fontSize,
            color: activeTab === "combate" ? colors.brand : "#333",
          }}
          title="Mesa de Combate"
        >
          ⚔️
        </button>
      </nav>

      <main
        style={{
          ...styles.mainContent,
          marginLeft: isMobile ? "58px" : "74px",
          width: isMobile ? "calc(100% - 58px)" : "calc(100% - 74px)",
          padding: isMobile ? "12px" : "20px",
        }}
      >
        {/* ABA 1: STATUS (BIO-MONITOR) */}
        {activeTab === "status" && (
          <div style={styles.container}>
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
              <h2
                style={{
                  color: colors.brand,
                  letterSpacing: isMobile ? "2px" : "5px",
                  fontSize: isMobile ? "24px" : "30px",
                  margin: 0,
                  textShadow: colors.glow,
                }}
              >
                A.S.A. BIO-MONITOR
              </h2>
              <small style={{ color: "#4a4a4a" }}>
                SYSTEM_VERSION: v6.0 [RULES_PATCHED]
              </small>
            </div>

            {/* NOME DO PERSONAGEM - INPUT COM SUPABASE */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "10px",
              }}
            >
              <input
                type="text"
                value={nomePersonagem}
                onChange={(e) => setNomePersonagem(e.target.value)}
                onBlur={handleSalvarNome}
                placeholder="[ INSIRA O NOME DE IDENTIFICAÇÃO ]"
                style={{
                  ...styles.inputField,
                  width: "100%",
                  maxWidth: "400px",
                  fontSize: "14px",
                  borderBottom: `1px solid ${colors.brand}`,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                }}
              />
            </div>

            {attrError && (
              <div
                style={{
                  color: colors.pv,
                  fontSize: "12px",
                  fontWeight: "bold",
                  textAlign: "center",
                  marginBottom: "10px",
                  padding: "8px",
                  border: `1px solid ${colors.pv}`,
                  background: "rgba(255, 23, 68, 0.1)",
                  letterSpacing: "1px",
                  borderRadius: "10px",
                }}
              >
                [ ALERTA DE SISTEMA: {attrError} ]
              </div>
            )}

            <div
              style={{
                textAlign: "center",
                color: "#666",
                fontSize: "11px",
                marginBottom: "5px",
              }}
            >
              CARGA DE ATRIBUTOS (NEX {nex}%):{" "}
              <span
                style={{
                  color:
                    currentTotalPoints === maxTotalPoints
                      ? colors.brand
                      : "#fff",
                }}
              >
                {currentTotalPoints} / {maxTotalPoints}
              </span>
            </div>

            <div
              style={{
                ...styles.mandalaContainer,
                width: `${mandalaSize}px`,
                height: `${mandalaSize}px`,
              }}
            >
              <div
                style={{
                  ...styles.centralSymbol,
                  width: `${mandalaSize}px`,
                  height: `${mandalaSize}px`,
                }}
              >
                <img
                  src="https://i.imgur.com/kbm8h0V.png"
                  alt="Maestro"
                  style={{
                    width: "100%",
                    maxWidth: `${mandalaSize}px`,
                    mixBlendMode: "screen",
                  }}
                />
              </div>
              {ATTR_KEYS.map((key, index) => {
                const angle = (index * 72 - 90) * (Math.PI / 180);
                const radius = attrRadius;
                const individualOffsets = {
                  FOR: { x: 0, y: 20 },
                  AGI: { x: 0, y: 15 },
                  INT: { x: 2, y: 10 },
                  VIG: { x: -7, y: 10 },
                  PRE: { x: 5, y: 15 },
                };
                const offset = individualOffsets[key] || { x: 0, y: 0 };
                const x = Math.cos(angle) * radius + offset.x;
                const y = Math.sin(angle) * radius + offset.y;
                return (
                  <div
                    key={key}
                    style={{
                      ...styles.attributeNode,
                      width: `${nodeSize}px`,
                      height: `${nodeSize}px`,
                      transform: `translate(${x}px, ${y}px)`,
                    }}
                    onClick={() => setEditingAttr(key)}
                  >
                    <span style={styles.attrLabel}>{key}</span>
                    {editingAttr === key ? (
                      <input
                        type="number"
                        min={0}
                        max={maxSingleAttr}
                        value={attrs[key]}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleAttrChange(key, e.target.value)}
                        onBlur={() => setEditingAttr(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "Escape")
                            setEditingAttr(null);
                        }}
                        style={styles.inputField}
                      />
                    ) : (
                      <span style={styles.attrValue}>{attrs[key]}</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={styles.statusBox}>
              <div style={styles.infoRow}>
                <div style={styles.dataBlock}>
                  <label style={styles.attrLabel}>NEX %</label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <button
                      style={styles.btnStep}
                      onClick={() =>
                        setNex(NEX_VALUES[Math.max(0, nexIndex - 1)])
                      }
                    >
                      -
                    </button>
                    <span
                      style={{
                        color: colors.brand,
                        fontSize: "20px",
                        fontWeight: "bold",
                      }}
                    >
                      {nex}%
                    </span>
                    <button
                      style={styles.btnStep}
                      onClick={() =>
                        setNex(
                          NEX_VALUES[
                            Math.min(NEX_VALUES.length - 1, nexIndex + 1)
                          ]
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    ...styles.dataBlock,
                    borderLeft: "1px solid #222",
                    borderRight: "1px solid #222",
                  }}
                >
                  <label style={styles.attrLabel}>LIMITE PE</label>
                  <div
                    style={{
                      color: colors.pe,
                      fontSize: "28px",
                      fontWeight: "bold",
                    }}
                  >
                    {limitePE}
                  </div>
                  {limitePERitual !== limitePE && (
                    <small style={{ color: "#b89700" }}>
                      Rituais: {limitePERitual}
                    </small>
                  )}
                </div>
                <div style={styles.dataBlock}>
                  <label style={styles.attrLabel}>DESLOCAMENTO</label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "4px",
                    }}
                  >
                    <input
                      type="number"
                      value={deslocamento}
                      onChange={(e) =>
                        setDeslocamento(Number(e.target.value) || 0)
                      }
                      style={{ ...styles.inputField, width: "35px" }}
                    />
                    <span style={{ fontSize: "12px", color: "#444" }}>m</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  ...styles.infoRow,
                  borderBottom: "none",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    ...styles.dataBlock,
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: "30px",
                    width: "100%",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <label style={styles.attrLabel}>DEFESA TOTAL</label>
                    <div
                      style={{
                        color: "#fff",
                        fontSize: "32px",
                        fontWeight: "bold",
                        textShadow: "0 0 15px rgba(255,255,255,0.2)",
                      }}
                    >
                      {defesaTotal}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "15px",
                      alignItems: "center",
                      background: "#000",
                      padding: "8px 15px",
                      borderRadius: "8px",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <label style={{ ...styles.attrLabel, fontSize: "9px" }}>
                        EQUIP.
                      </label>
                      <input
                        type="number"
                        value={defArmadura}
                        onChange={(e) =>
                          setDefArmadura(Number(e.target.value) || 0)
                        }
                        style={styles.inputSmall}
                      />
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <label style={{ ...styles.attrLabel, fontSize: "9px" }}>
                        OUTROS
                      </label>
                      <input
                        type="number"
                        value={defOutros}
                        onChange={(e) =>
                          setDefOutros(Number(e.target.value) || 0)
                        }
                        style={styles.inputSmall}
                      />
                    </div>
                    <div style={{ textAlign: "center", opacity: 0.7 }}>
                      <label style={{ ...styles.attrLabel, fontSize: "9px" }}>
                        BASE+AGI
                      </label>
                      <div style={{ fontSize: "12px", color: colors.brand }}>
                        {10 + attrs.AGI}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <StatusControl
                label="PV"
                current={pvAtual}
                max={maxPVCalculado}
                setCurrent={setPvAtual}
                color={colors.pv}
              />
              <StatusControl
                label="PE"
                current={peAtual}
                max={maxPECalculado}
                setCurrent={setPeAtual}
                color={colors.pe}
              />
              <StatusControl
                label="SAN"
                current={sanAtual}
                max={maxSANCalculado}
                setCurrent={setSanAtual}
                color={colors.san}
              />
            </div>
          </div>
        )}

        {/* ABA 2: ARQUÉTIPO (CLASSE E ORIGEM) */}
        {activeTab === "classe" && (
          <div style={styles.container}>
            <div style={styles.statusBox}>
              <h2 style={styles.sectionTitle}>PROFILER_ARQUÉTIPO</h2>
              {profileError && (
                <div
                  style={{
                    color: colors.pv,
                    fontSize: "12px",
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: "14px",
                    padding: "8px",
                    border: `1px solid ${colors.pv}`,
                    background: "rgba(255, 23, 68, 0.1)",
                    borderRadius: "10px",
                  }}
                >
                  [ ALERTA DE PERFIL: {profileError} ]
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                }}
              >
                {["Combatente", "Especialista", "Ocultista"].map((c) => (
                  <button
                    key={c}
                    onClick={() => handleClasseChange(c)}
                    disabled={setupComplete}
                    style={{
                      flex: 1,
                      minWidth: "180px",
                      padding: "15px",
                      background: classe === c ? `${colors.brand}22` : "#000",
                      border: `1px solid ${
                        classe === c ? colors.brand : "#333"
                      }`,
                      color: classe === c ? colors.brand : "#666",
                      cursor: setupComplete ? "not-allowed" : "pointer",
                      opacity: setupComplete ? 0.75 : 1,
                      fontFamily: "inherit",
                      borderRadius: "10px",
                    }}
                  >
                    {c.toUpperCase()}
                  </button>
                ))}
              </div>
              <div style={styles.tabGrid}>
                <div style={styles.summaryCard}>
                  <div style={{ ...styles.attrLabel, marginBottom: "6px" }}>
                    ORIGEM
                  </div>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    disabled={setupComplete}
                    style={styles.selectField}
                  >
                    {Object.keys(originsData).map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <div
                    style={{
                      color: originLocked
                        ? TRAINING_THEME.auto.text
                        : colors.muted,
                      fontSize: "12px",
                      marginTop: "8px",
                    }}
                  >
                    {originLocked
                      ? `Origem confirmada: ${
                          originSkills.join(" • ") || "sem treino automático"
                        }`
                      : "Confirme a origem para liberar os treinos automáticos."}
                  </div>
                </div>
                <div style={styles.summaryCard}>
                  <div style={{ ...styles.attrLabel, marginBottom: "6px" }}>
                    TRILHA
                  </div>
                  <select
                    value={trilha}
                    onChange={(e) => setTrilha(e.target.value)}
                    disabled={setupComplete}
                    style={styles.selectField}
                  >
                    {trilhasDisponiveis.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.summaryCard}>
                  <div style={{ ...styles.attrLabel, marginBottom: "6px" }}>
                    SÍNTESE
                  </div>
                  <div style={{ fontSize: "14px", lineHeight: 1.6 }}>
                    <div>
                      <strong>Classe:</strong> {classe}
                    </div>
                    <div>
                      <strong>Origem:</strong> {origin}
                    </div>
                    <div>
                      <strong>NEX:</strong> {nex}%
                    </div>
                    <div>
                      <strong>Poderes:</strong> {powerSlots}
                    </div>
                    <div>
                      <strong>Transcender:</strong>{" "}
                      {selectedPowers.filter((p) => p === "Transcender").length}
                    </div>
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: "18px",
                  marginBottom: "20px",
                  background: "rgba(0,0,0,0.35)",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "12px",
                  padding: "14px",
                }}
              >
                <div style={{ ...styles.attrLabel, marginBottom: "10px" }}>
                  TRILHAS DA CLASSE ({classe.toUpperCase()})
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {Object.entries(trilhasData[classe] || {}).map(
                    ([nomeTrilha, habilidades]) => (
                      <div
                        key={nomeTrilha}
                        style={{
                          ...styles.summaryCard,
                          borderColor:
                            trilha === nomeTrilha ? `${colors.brand}66` : "#262a30",
                        }}
                      >
                        <div
                          style={{
                            color: trilha === nomeTrilha ? colors.brand : "#d7dde5",
                            fontWeight: "bold",
                            fontSize: "12px",
                            letterSpacing: "1px",
                            marginBottom: "8px",
                          }}
                        >
                          {nomeTrilha}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#cfd8dc",
                            lineHeight: 1.5,
                            whiteSpace: "pre-line",
                          }}
                        >
                          {habilidades
                            .map((h) => `NEX ${h.nex}% - ${h.nome}\n${h.desc}`)
                            .join("\n\n")}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div
                style={{
                  marginTop: "18px",
                  marginBottom: "20px",
                  background: "rgba(0,0,0,0.35)",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "12px",
                  padding: "14px",
                }}
              >
                <div style={{ ...styles.attrLabel, marginBottom: "10px" }}>
                  SELEÇÃO DE PERÍCIAS AUTOMÁTICAS
                </div>
                {regra.fixedChoices.length === 0 ? (
                  <div style={{ color: colors.muted, fontSize: "12px" }}>
                    Esta classe não exige escolhas fixas. Basta confirmar a
                    origem para travar os treinos automáticos.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    {regra.fixedChoices.map((choice, idx) => (
                      <label
                        key={choice.label}
                        style={{ display: "grid", gap: "6px" }}
                      >
                        <span style={{ color: "#bdbdbd", fontSize: "11px" }}>
                          {choice.label}
                        </span>
                        <select
                          value={classSkillChoices[idx] ?? ""}
                          onChange={(e) => {
                            const next = [...classSkillChoices];
                            next[idx] = e.target.value;
                            if (
                              new Set(next.filter(Boolean)).size !==
                              next.filter(Boolean).length
                            ) {
                              flashProfileError(
                                "As escolhas fixas da classe não podem se repetir."
                              );
                              return;
                            }
                            setClassSkillChoices(next);
                          }}
                          style={styles.selectField}
                        >
                          <option value="">Selecione</option>
                          {choice.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginTop: "14px",
                  }}
                >
                  <button
                    onClick={lockOriginAndClassSkills}
                    style={{
                      ...styles.btnStep,
                      padding: "10px 14px",
                      borderColor: TRAINING_THEME.auto.border,
                      color: TRAINING_THEME.auto.text,
                      boxShadow: TRAINING_THEME.auto.glow,
                    }}
                  >
                    Confirmar origem e classe
                  </button>
                  <button
                    onClick={() => {
                      setOriginLocked(false);
                      setProfileError("");
                    }}
                    style={{ ...styles.btnStep, padding: "10px 14px" }}
                  >
                    Liberar edição
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  margin: "22px 0 15px",
                }}
              >
                <h3
                  style={{ fontSize: "14px", color: colors.brand, margin: 0 }}
                >
                  HABILIDADES DESBLOQUEADAS
                </h3>
                <span style={{ fontSize: "12px", color: "#666" }}>
                  NEX ATUAL:{" "}
                  <strong style={{ color: colors.brand }}>{nex}%</strong>
                </span>
              </div>

              {habilidadesAtuais.length > 0 ? (
                habilidadesAtuais.map((h, idx) => (
                  <div key={`${h.nome}-${h.nex}-${idx}`} style={styles.habCard}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <strong style={{ color: "#fff", letterSpacing: "1px" }}>
                          {h.nome.toUpperCase()}
                        </strong>
                        <span
                          style={{
                            fontSize: "10px",
                            color:
                              h.tipo === "classe"
                                ? "#00e5ff"
                                : h.tipo === "progressão"
                                ? "#ffd166"
                                : "#ff4fd8",
                            border: "1px solid rgba(255,255,255,0.12)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {(h.tipo || "trilha").toUpperCase()}
                        </span>

                        {/* 👇 BOTÃO DE LOG ADICIONADO AQUI 👇 */}
                        <button
                          onClick={async () => {
                            const pNome =
                              nomePersonagem || user.email.split("@")[0];
                            const textoAcao = `Usou a habilidade: ${h.nome.toUpperCase()}`;
                            alert(textoAcao);
                            await supabase.from("combat_log").insert([
                              {
                                personagem: pNome,
                                acao: textoAcao,
                                rodada: rodadaAtual,
                              },
                            ]);
                          }}
                          style={{
                            background: "none",
                            border: `1px solid ${colors.brand}55`,
                            color: colors.brand,
                            borderRadius: "4px",
                            padding: "2px 8px",
                            fontSize: "9px",
                            cursor: "pointer",
                            marginLeft: "10px",
                          }}
                        >
                          ENVIAR PRO LOG
                        </button>
                      </div>
                      <span
                        style={{
                          fontSize: "10px",
                          color: colors.pe,
                          background: "rgba(197, 160, 0, 0.1)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        NEX {h.nex}%
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "#aaa",
                        lineHeight: "1.5",
                        whiteSpace: "pre-line",
                      }}
                    >
                      {h.desc}
                    </p>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    border: "1px dashed #333",
                    borderRadius: "10px",
                  }}
                >
                  <p style={{ color: "#444", fontSize: "12px", margin: 0 }}>
                    Aumente seu NEX na tela de Bio-Monitor para desbloquear
                    habilidades.
                  </p>
                </div>
              )}

              <div style={{ marginTop: "26px" }}>
                <h3
                  style={{
                    fontSize: "14px",
                    color: colors.brand,
                    margin: "0 0 12px 0",
                  }}
                >
                  PODERES DA CLASSE
                </h3>
                <div style={styles.tabGrid}>
                  {Array.from({ length: powerSlots }).map((_, index) => {
                    const selectedPowerName = selectedPowers[index] || "";
                    const selectedPowerData = classPowers[classe].find(
                      (p) => p.nome === selectedPowerName
                    );
                    const selectedParanormalName =
                      selectedParanormalPowers[index] || "";
                    const selectedParanormalData = paranormalPowers.find(
                      (p) => p.nome === selectedParanormalName
                    );

                    return (
                      <div key={index} style={styles.summaryCard}>
                        <div
                          style={{ ...styles.attrLabel, marginBottom: "8px" }}
                        >
                          PODER {index + 1}
                        </div>
                        <select
                          value={selectedPowerName}
                          onChange={(e) =>
                            handleSelectPower(index, e.target.value)
                          }
                          style={styles.selectField}
                        >
                          <option value="">Selecione um poder</option>
                          {classPowers[classe]
                            .filter(
                              (power) =>
                                !selectedPowers.includes(power.nome) ||
                                power.nome === selectedPowers[index] ||
                                [
                                  "Transcender",
                                  "Treinamento em Perícia",
                                  "Especialista em Elemento",
                                  "Mestre em Elemento",
                                  "Ritual Predileto",
                                ].includes(power.nome) // 👈 PERMITE REPETIR ESSES AQUI!
                            )
                            .map((power) => (
                              <option key={power.nome} value={power.nome}>
                                {power.nome}
                              </option>
                            ))}
                        </select>
                        {selectedPowerData && (
                          <p
                            style={{
                              marginTop: "10px",
                              fontSize: "12px",
                              color: "#aaa",
                              lineHeight: 1.5,
                            }}
                          >
                            {selectedPowerData.desc}
                          </p>
                        )}

                        {selectedPowerName === "Transcender" && (
                          <>
                            <div
                              style={{
                                ...styles.attrLabel,
                                marginTop: "12px",
                                marginBottom: "8px",
                              }}
                            >
                              PODER PARANORMAL
                            </div>
                            <select
                              value={selectedParanormalName}
                              onChange={(e) =>
                                handleSelectParanormalPower(
                                  index,
                                  e.target.value
                                )
                              }
                              style={{
                                ...styles.selectField,
                                color: "#ff4fd8",
                                border: "1px solid rgba(255, 79, 216, 0.35)",
                              }}
                            >
                              <option value="">
                                Selecione um poder paranormal
                              </option>
                              {paranormalPowers
                                .filter(
                                  (power) =>
                                    !selectedParanormalPowers.includes(
                                      power.nome
                                    ) ||
                                    power.nome ===
                                      selectedParanormalPowers[index] ||
                                    [
                                      "Aprender Ritual",
                                      "Resistir a Elemento", // No seu catálogo está salvo como "Resistir a"
                                      "Expansão de Conhecimento",
                                    ].includes(power.nome) // 👈 PERMITE REPETIR ESSES TAMBÉM!
                                )
                                .map((power) => (
                                  <option key={power.nome} value={power.nome}>
                                    {power.nome}
                                  </option>
                                ))}
                            </select>
                            {selectedParanormalData && (
                              <p
                                style={{
                                  marginTop: "10px",
                                  fontSize: "12px",
                                  color: "#caa3ff",
                                  lineHeight: 1.5,
                                }}
                              >
                                {selectedParanormalData.desc}
                              </p>
                            )}
                          </>
                        )}
                        {/* 👇 BOTÃO DE LOG DO PODER ADICIONADO AQUI 👇 */}
                        {selectedPowerName && (
                          <button
                            onClick={async () => {
                              const pNome =
                                nomePersonagem || user.email.split("@")[0];
                              const poderReal =
                                selectedPowerName === "Transcender"
                                  ? selectedParanormalName
                                  : selectedPowerName;

                              if (!poderReal) return;

                              const textoAcao = `Usou o poder: ${poderReal.toUpperCase()}`;
                              alert(textoAcao);

                              await supabase.from("combat_log").insert([
                                {
                                  personagem: pNome,
                                  acao: textoAcao,
                                  rodada: rodadaAtual,
                                },
                              ]);
                            }}
                            style={{
                              ...styles.btnStep,
                              width: "100%",
                              marginTop: "12px",
                              borderColor: colors.brand,
                              color: colors.brand,
                              background: "rgba(0, 229, 255, 0.05)",
                            }}
                          >
                            ENVIAR PRO LOG DA MESA
                          </button>
                        )}
                        {/* 👆 FIM DO BOTÃO 👆 */}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: PERÍCIAS */}
        {activeTab === "pericias" && (
          <div style={styles.container}>
            <div style={styles.statusBox}>
              <h2 style={styles.sectionTitle}>MÓDULO_DE_PERÍCIAS</h2>
              {skillsError && (
                <div
                  style={{
                    color: colors.pv,
                    fontSize: "12px",
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: "14px",
                    padding: "8px",
                    border: `1px solid ${colors.pv}`,
                    background: "rgba(255, 23, 68, 0.1)",
                    borderRadius: "10px",
                  }}
                >
                  [ ALERTA DE TREINAMENTO: {skillsError} ]
                </div>
              )}
              <div style={{ ...styles.tabGrid, marginBottom: "18px" }}>
                <div style={styles.summaryCard}>
                  <div style={{ ...styles.attrLabel, marginBottom: "8px" }}>
                    Origem
                  </div>
                  <div style={{ fontSize: "14px" }}>{origin}</div>
                  <div
                    style={{
                      color: originLocked
                        ? TRAINING_THEME.auto.text
                        : colors.muted,
                      fontSize: "12px",
                      marginTop: "8px",
                    }}
                  >
                    {originLocked
                      ? originSkills.length
                        ? originSkills.join(" • ")
                        : "sem treino automático"
                      : "Origem ainda não confirmada no profiler."}
                  </div>
                </div>
                <div style={styles.summaryCard}>
                  <div style={{ ...styles.attrLabel, marginBottom: "8px" }}>
                    Treinos automáticos da classe
                  </div>
                  <div
                    style={{
                      color: fixedClassSkills.length
                        ? TRAINING_THEME.auto.text
                        : colors.muted,
                      fontSize: "12px",
                      lineHeight: 1.7,
                    }}
                  >
                    {fixedClassSkills.length
                      ? fixedClassSkills.join(" • ")
                      : "Nenhum definido ainda."}
                  </div>
                  <div
                    style={{
                      color: colors.muted,
                      fontSize: "11px",
                      marginTop: "8px",
                    }}
                  >
                    {originLocked
                      ? "Essas perícias recebem destaque especial e não podem ser removidas por engano."
                      : "Confirme origem e classe na aba PROFILER_ARQUÉTIPO."}
                  </div>
                </div>
                <div style={styles.summaryCard}>
                  <div style={{ ...styles.attrLabel, marginBottom: "8px" }}>
                    Controle
                  </div>
                  <div style={{ fontSize: "14px", lineHeight: 1.7 }}>
                    <div>
                      <strong>Grau máximo:</strong> {trainingCap}
                    </div>
                    <div>
                      <strong>Perícias livres:</strong> {freeChoicesUsed} /{" "}
                      {freeChoicesAllowed}
                    </div>
                    <div>
                      <strong>Total treinadas:</strong> {totalChosenTrained} /{" "}
                      {expectedTrainedCount}
                    </div>
                  </div>
                  <button
                    onClick={resetSkills}
                    style={{
                      ...styles.btnStep,
                      marginTop: "10px",
                      padding: "10px 14px",
                      borderColor: colors.pv,
                      color: colors.pv,
                      width: "100%",
                      display: "block",
                      fontWeight: "bold",
                    }}
                  >
                    Resetar perícias
                  </button>
                </div>
              </div>
              <div
                style={{
                  overflowX: "auto",
                  background: "rgba(0,0,0,0.4)",
                  borderRadius: "12px",
                  border: `1px solid ${colors.border}`,
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: isMobile ? "620px" : "760px",
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        "PERÍCIA",
                        "DADOS",
                        "BÔNUS",
                        "TREINO",
                        "OUTROS",
                        "GRAU",
                      ].map((header) => (
                        <th
                          key={header}
                          style={{
                            textAlign: "left",
                            fontSize: "12px",
                            color: "#bdbdbd",
                            padding: "14px 12px",
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {skillsCatalog.map((skill) => {
                      const auto = isAutoTrained(skill.nome);
                      const currentTraining = auto
                        ? skillStates[skill.nome]?.treino === "destreinado"
                          ? "treinado"
                          : skillStates[skill.nome]?.treino || "treinado"
                        : skillStates[skill.nome]?.treino || "destreinado";
                      const outros = skillStates[skill.nome]?.outros || 0;
                      const bonus = TRAINING_BONUS[currentTraining] + outros;
                      const attrValue = attrs[skill.attr];
                      const theme = auto
                        ? TRAINING_THEME.auto
                        : currentTraining === "destreinado"
                        ? TRAINING_THEME.normal
                        : TRAINING_THEME[currentTraining];

                      return (
                        <tr
                          key={skill.nome}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            boxShadow: auto ? TRAINING_THEME.auto.glow : "none",
                          }}
                        >
                          <td style={{ padding: "12px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                color: theme.text,
                                fontWeight:
                                  currentTraining !== "destreinado" || auto
                                    ? "bold"
                                    : "normal",
                              }}
                            >
                              <span
                                style={{
                                  color: theme.text,
                                  textShadow: theme.glow,
                                }}
                              >
                                {auto ? "⬢" : "◈"}
                              </span>
                              <span>
                                {skill.nome}
                                {skill.carga ? "+" : ""}
                                {skill.trainedOnly ? "*" : ""}
                              </span>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              color: auto
                                ? TRAINING_THEME.auto.text
                                : "#d8d8d8",
                            }}
                          >
                            ( {skill.attr} ){" "}
                            <span style={{ color: "#8f8f8f" }}>
                              ({attrValue})
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              color: bonus > 0 ? theme.text : "#a0a0a0",
                              textShadow:
                                currentTraining !== "destreinado" || auto
                                  ? theme.glow
                                  : "none",
                            }}
                          >
                            {bonus}
                          </td>
                          <td style={{ padding: "12px" }}>
                            <span
                              style={{
                                color:
                                  TRAINING_BONUS[currentTraining] > 0 || auto
                                    ? theme.text
                                    : "#8f8f8f",
                                textShadow:
                                  currentTraining !== "destreinado" || auto
                                    ? theme.glow
                                    : "none",
                              }}
                            >
                              {TRAINING_LABEL[currentTraining]}
                            </span>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <input
                              type="number"
                              value={outros}
                              onChange={(e) =>
                                setSkillOtherBonus(skill.nome, e.target.value)
                              }
                              style={{
                                ...styles.inputSmall,
                                color: auto
                                  ? TRAINING_THEME.auto.text
                                  : "#d8d8d8",
                                width: "56px",
                                borderBottom: `1px dashed ${
                                  auto ? TRAINING_THEME.auto.border : "#444"
                                }`,
                              }}
                            />
                          </td>
                          <td style={{ padding: "12px" }}>
                            <select
                              value={currentTraining}
                              onChange={(e) =>
                                setSkillTraining(skill.nome, e.target.value)
                              }
                              style={{
                                background: "#000",
                                color: theme.text,
                                padding: "7px",
                                border: `1px solid ${theme.border}`,
                                borderRadius: "8px",
                                fontFamily: "inherit",
                                boxShadow:
                                  currentTraining !== "destreinado" || auto
                                    ? theme.glow
                                    : "none",
                              }}
                            >
                              <option value="destreinado">Destreinado</option>
                              <option value="treinado">Treinado</option>
                              <option value="veterano">Veterano</option>
                              <option value="expert">Expert</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "14px",
                  marginTop: "14px",
                  flexWrap: "wrap",
                  color: "#c5c5c5",
                  fontSize: "12px",
                }}
              >
                <span>+ Penalidade de carga.</span>
                <span>* Somente treinada.</span>
                <span>
                  <strong style={{ color: TRAINING_THEME.treinado.text }}>
                    Treinado
                  </strong>{" "}
                  •{" "}
                  <strong style={{ color: TRAINING_THEME.veterano.text }}>
                    Veterano
                  </strong>{" "}
                  •{" "}
                  <strong style={{ color: TRAINING_THEME.expert.text }}>
                    Expert
                  </strong>{" "}
                  •{" "}
                  <strong style={{ color: TRAINING_THEME.auto.text }}>
                    Auto
                  </strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: RITUAIS */}
        {activeTab === "rituais" && (
          <div style={styles.container}>
            <div style={styles.statusBox}>
              <h2 style={styles.sectionTitle}>MÓDULO_DE_RITUAIS</h2>

              {/* BARRA DE APRENDER NOVO RITUAL & LIMITE */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "25px",
                  flexWrap: "wrap",
                  gap: "15px",
                  borderBottom: `1px solid ${colors.border}`,
                  paddingBottom: "15px",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "14px",
                      color: colors.brand,
                      margin: "0 0 5px 0",
                    }}
                  >
                    SEU GRIMÓRIO
                  </h3>
                  <span
                    style={{
                      fontSize: "12px",
                      color:
                        rituaisSelecionados.length > limiteRituais
                          ? colors.pv
                          : "#aaa",
                    }}
                  >
                    RITUAIS CONHECIDOS:{" "}
                    <strong
                      style={{
                        color:
                          rituaisSelecionados.length > limiteRituais
                            ? colors.pv
                            : colors.brand,
                      }}
                    >
                      {rituaisSelecionados.length} / {limiteRituais}
                    </strong>
                  </span>
                </div>
                <button
                  onClick={() => setIsRitualModalOpen(true)}
                  style={{
                    ...styles.btnStep,
                    padding: "10px 20px",
                    borderColor: colors.brand,
                    color: colors.brand,
                    fontWeight: "bold",
                    background: "rgba(0, 229, 255, 0.1)",
                  }}
                >
                  + EXPLORAR BIBLIOTECA
                </button>
              </div>

              {/* 👇 NOVO: CONTADOR DE RITUAIS 👇 */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                  borderBottom: `1px solid ${colors.border}`,
                  paddingBottom: "10px",
                }}
              >
                <h3
                  style={{ fontSize: "14px", color: colors.brand, margin: 0 }}
                >
                  SEU GRIMÓRIO
                </h3>
                <span
                  style={{
                    fontSize: "12px",
                    color:
                      rituaisSelecionados.length > limiteRituais
                        ? colors.pv
                        : "#aaa",
                  }}
                >
                  RITUAIS CONHECIDOS:{" "}
                  <strong
                    style={{
                      color:
                        rituaisSelecionados.length > limiteRituais
                          ? colors.pv
                          : colors.brand,
                    }}
                  >
                    {rituaisSelecionados.length} / {limiteRituais}
                  </strong>
                </span>
              </div>

              {rituaisSelecionados.length === 0 && (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    border: "1px dashed #333",
                    borderRadius: "10px",
                  }}
                >
                  <p style={{ color: "#444", fontSize: "12px", margin: 0 }}>
                    Seu grimório está vazio. Aprenda rituais acima para poder
                    conjurá-los.
                  </p>
                </div>
              )}

              <div style={styles.tabGrid}>
                {rituaisSelecionados.map((nomeRitual) => {
                  const ritual = rituaisCatalog.find(
                    (r) => r.nome === nomeRitual
                  );
                  if (!ritual) return null;

                  const alvoSelecionado = alvosRituais[ritual.nome] || "self";
                  const versaoSelecionada =
                    versoesRituais[ritual.nome] || "basico";

                  let custoFinal = ritual.custoBase;
                  let textoDescricao = ritual.desc;
                  let corRitual = colors.pe;

                  if (ritual.elemento === "Morte") corRitual = "#9e9e9e";
                  if (ritual.elemento === "Sangue") corRitual = "#ff1744";
                  if (ritual.elemento === "Energia") corRitual = "#00e5ff";
                  if (ritual.elemento === "Conhecimento") corRitual = "#ffd166";
                  if (ritual.elemento === "Medo") corRitual = "#ffffff";

                  if (versaoSelecionada === "discente" && ritual.discente) {
                    custoFinal += ritual.discente.custoExtra;
                    textoDescricao = `${ritual.desc}\n\n[ FORMA DISCENTE ]: ${ritual.discente.desc}`;
                  } else if (
                    versaoSelecionada === "verdadeiro" &&
                    ritual.verdadeiro
                  ) {
                    custoFinal += ritual.verdadeiro.custoExtra;
                    textoDescricao = `${ritual.desc}\n\n[ FORMA VERDADEIRA ]: ${ritual.verdadeiro.desc}`;
                  }

                  return (
                    <div
                      key={ritual.nome}
                      style={{
                        ...styles.summaryCard,
                        borderTop: `3px solid ${corRitual}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          borderBottom: `1px solid ${colors.border}`,
                          paddingBottom: "10px",
                          marginBottom: "10px",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              color: "#fff",
                              margin: "0 0 5px 0",
                              letterSpacing: "1px",
                              fontSize: "14px",
                            }}
                          >
                            {ritual.nome.toUpperCase()}
                          </h3>
                          <div style={{ display: "flex", gap: "5px" }}>
                            <span
                              style={{
                                fontSize: "9px",
                                color: corRitual,
                                border: `1px solid ${corRitual}44`,
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              {ritual.elemento.toUpperCase()}
                            </span>
                            <span
                              style={{
                                fontSize: "9px",
                                color: "#aaa",
                                background: "rgba(255,255,255,0.1)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              CUSTO: {custoFinal} PE
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setRituaisSelecionados((prev) =>
                              prev.filter((r) => r !== ritual.nome)
                            )
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "#666",
                            cursor: "pointer",
                            fontSize: "14px",
                          }}
                          title="Esquecer Ritual"
                        >
                          ✖
                        </button>
                      </div>

                      <div style={{ marginBottom: "10px" }}>
                        <select
                          value={versaoSelecionada}
                          onChange={(e) =>
                            setVersoesRituais({
                              ...versoesRituais,
                              [ritual.nome]: e.target.value,
                            })
                          }
                          style={{
                            ...styles.selectField,
                            padding: "6px",
                            fontSize: "11px",
                            borderColor: "#333",
                            color: "#ddd",
                          }}
                        >
                          <option value="basico">Básico (+0 PE)</option>
                          {ritual.discente && (
                            <option value="discente">
                              Discente (+{ritual.discente.custoExtra} PE)
                            </option>
                          )}
                          {ritual.verdadeiro && (
                            <option value="verdadeiro">
                              Verdadeiro (+{ritual.verdadeiro.custoExtra} PE)
                            </option>
                          )}
                        </select>
                      </div>

                      <p
                        style={{
                          fontSize: "11px",
                          color: "#aaa",
                          lineHeight: 1.6,
                          marginBottom: "15px",
                          whiteSpace:
                            "pre-line" /* 👈 ESSENCIAL PARA O TEXTO NÃO SUMIR */,
                        }}
                      >
                        {textoDescricao}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                          flexWrap: "wrap",
                          borderTop: "1px dashed #333",
                          paddingTop: "12px",
                        }}
                      >
                        <select
                          value={alvoSelecionado}
                          onChange={(e) =>
                            setAlvosRituais({
                              ...alvosRituais,
                              [ritual.nome]: e.target.value,
                            })
                          }
                          style={{
                            ...styles.selectField,
                            flex: 2,
                            padding: "8px",
                            fontSize: "11px",
                            minWidth: "120px",
                          }}
                        >
                          <option value="self">Você mesmo</option>
                          {aliadosCampanha.map((aliado) => (
                            <option key={aliado.id} value={aliado.id}>
                              {aliado.nome}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={async () => {
                            if (peAtual >= custoFinal) {
                              setPeAtual((prev) => prev - custoFinal);
                              const nomeAlvo =
                                alvoSelecionado === "self"
                                  ? "a si mesmo"
                                  : aliadosCampanha.find(
                                      (a) => a.id === alvoSelecionado
                                    )?.nome;
                              const textoAcao = `Conjurou ${
                                ritual.nome
                              } (${versaoSelecionada.toUpperCase()}) em ${nomeAlvo}. [-${custoFinal} PE]`;

                              setEfeitoRitual(ritual.elemento);
                              setTimeout(() => setEfeitoRitual(null), 1500); // Remove após 1.5 segundos

                              alert(textoAcao);

                              // 👇 Manda para a Linha do Tempo da mesa 👇
                              await supabase.from("combat_log").insert([
                                {
                                  personagem:
                                    nomePersonagem || user.email.split("@")[0],
                                  acao: textoAcao,
                                  rodada: rodadaAtual,
                                },
                              ]);
                            } else {
                              alert(
                                `Você precisa de ${custoFinal} PE para conjurar a versão ${versaoSelecionada} de ${ritual.nome}.`
                              );
                            }
                          }}
                          style={{
                            ...styles.btnStep,
                            flex: 1,
                            minWidth: "80px",
                            padding: "8px",
                            background: "rgba(197, 160, 0, 0.15)",
                            borderColor: colors.pe,
                            color: colors.pe,
                            fontWeight: "bold",
                          }}
                        >
                          USAR
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {/* ABA 5: COMBATE / MESA (MÓDULO DO MESTRE) */}
        {/* ABA 5: COMBATE / MESA (MÓDULO DO MESTRE & TIMELINE) */}
        {activeTab === "combate" && (
          <div style={styles.container}>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              {/* PAINEL DE RODADA (ESQUERDA) */}
              <div
                style={{
                  ...styles.statusBox,
                  flex: 1,
                  minWidth: isMobile ? "0" : "300px",
                  textAlign: "center",
                  padding: isMobile ? "20px" : "40px",
                }}
              >
                <h2
                  style={{
                    color: colors.brand,
                    margin: "0 0 10px 0",
                    letterSpacing: "3px",
                  }}
                >
                  MESA DE COMBATE
                </h2>
                <p
                  style={{
                    color: "#666",
                    fontSize: "12px",
                    marginBottom: "30px",
                  }}
                >
                  Sincronização em tempo real
                </p>

                <div
                  style={{
                    marginBottom: "16px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "10px",
                    padding: "10px",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "8px" }}>
                    MISSÃO ATIVA
                  </div>
                  <div style={{ color: "#fff", fontWeight: "bold", marginBottom: "10px" }}>
                    {selectedMission || "Sem missão selecionada"}
                  </div>
                  <button
                    onClick={async () => {
                      const activeName = getActiveCharacterName();
                      await emitCombatFlow("JOIN", {
                        userId: user.id,
                        nome: activeName,
                      });
                      await supabase.from("combat_log").insert([
                        {
                          personagem: activeName,
                          acao: "Entrou no combate.",
                          rodada: rodadaAtual,
                        },
                      ]);
                    }}
                    style={{
                      ...styles.btnStep,
                      width: "100%",
                      borderColor: colors.brand,
                      color: colors.brand,
                    }}
                  >
                    Entrar no combate
                  </button>
                </div>

                {!!turnOrder.length && (
                  <div
                    style={{
                      marginBottom: "16px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "10px",
                      padding: "10px",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "8px" }}>
                      TURNO ATUAL
                    </div>
                    <div style={{ color: colors.brand, fontWeight: "bold", marginBottom: "8px" }}>
                      {combatParticipants.find((p) => p.userId === turnOrder[turnIndex])?.nome ||
                        "Aguardando ordem"}
                    </div>
                    {!isDM && turnOrder[turnIndex] === user.id && (
                      <button
                        onClick={async () => {
                          if (turnDoneBy.includes(user.id)) return;
                          await emitCombatFlow("TURN_DONE", {
                            userId: user.id,
                            round: rodadaAtual,
                          });
                          await supabase.from("combat_log").insert([
                            {
                              personagem: getActiveCharacterName(),
                              acao: "Finalizou o turno.",
                              rodada: rodadaAtual,
                            },
                          ]);
                        }}
                        style={{
                          ...styles.btnStep,
                          width: "100%",
                          borderColor: "#22c55e",
                          color: "#22c55e",
                        }}
                      >
                        Finalizar meu turno
                      </button>
                    )}
                  </div>
                )}

                {isDM && (
                  <div
                    style={{
                      marginBottom: "20px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "10px",
                      padding: "10px",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "8px" }}>
                      ORDEM DE TURNO (MESTRE)
                    </div>
                    <div style={{ display: "grid", gap: "8px", marginBottom: "10px" }}>
                      {combatParticipants.map((p) => (
                        <label
                          key={p.userId}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: "#d1d5db",
                            fontSize: "12px",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedOrderDraft.includes(p.userId)}
                            onChange={() =>
                              setSelectedOrderDraft((prev) =>
                                prev.includes(p.userId)
                                  ? prev.filter((id) => id !== p.userId)
                                  : [...prev, p.userId]
                              )
                            }
                          />
                          {p.nome}
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={async () => {
                        if (!selectedOrderDraft.length) {
                          alert("Selecione ao menos 1 participante.");
                          return;
                        }
                        await emitCombatFlow("SET_ORDER", {
                          order: selectedOrderDraft,
                        });
                        await supabase.from("combat_log").insert([
                          {
                            personagem: "SISTEMA A.S.A.",
                            acao: `Ordem definida pelo mestre (${selectedOrderDraft.length} participantes).`,
                            rodada: rodadaAtual,
                          },
                        ]);
                      }}
                      style={{
                        ...styles.btnStep,
                        width: "100%",
                        borderColor: colors.brand,
                        color: colors.brand,
                      }}
                    >
                      Definir ordem selecionada
                    </button>
                  </div>
                )}

                <div
                  style={{
                    display: "inline-block",
                    background: "rgba(0,0,0,0.5)",
                    border: `1px solid ${colors.brand}44`,
                    padding: "30px 50px",
                    borderRadius: "20px",
                    boxShadow: "0 0 40px rgba(0,0,0,0.8)",
                    width: "100%",
                    maxWidth: "250px",
                  }}
                >
                  <div
                    style={{
                      color: "#fff",
                      fontWeight: "bold",
                      letterSpacing: "2px",
                      fontSize: "16px",
                      marginBottom: "10px",
                    }}
                  >
                    RODADA ATUAL
                  </div>
                  <div
                    style={{
                      color: colors.brand,
                      fontSize: "64px",
                      fontWeight: "bold",
                      textShadow: colors.glow,
                    }}
                  >
                    {rodadaAtual}
                  </div>

                  {isDM ? (
                    <button
                      onClick={avancarRodada}
                      style={{
                        ...styles.btnStep,
                        marginTop: "20px",
                        width: "100%",
                        padding: "12px",
                        borderColor: colors.brand,
                        background: `${colors.brand}22`,
                        color: colors.brand,
                        fontWeight: "bold",
                        fontSize: "14px",
                      }}
                    >
                      AVANÇAR RODADA ❯
                    </button>
                  ) : (
                    <div
                      style={{
                        marginTop: "20px",
                        color: colors.pe,
                        fontSize: "12px",
                        background: "rgba(197, 160, 0, 0.1)",
                        border: `1px solid ${colors.pe}`,
                        padding: "8px 12px",
                        borderRadius: "8px",
                      }}
                    >
                      Aguardando o Mestre avançar...
                    </div>
                  )}
                </div>
              </div>

              {/* LINHA DO TEMPO (DIREITA) */}
              <div
                style={{
                  ...styles.statusBox,
                  flex: 2,
                  minWidth: isMobile ? "0" : "300px",
                  padding: "24px",
                }}
              >
                <h3
                  style={{
                    color: colors.brand,
                    marginTop: 0,
                    letterSpacing: "2px",
                    borderBottom: `1px solid ${colors.brand}33`,
                    paddingBottom: "10px",
                  }}
                >
                  LINHA DO TEMPO
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    maxHeight: "400px",
                    overflowY: "auto",
                    paddingRight: "10px",
                  }}
                >
                  {combatLogs.length === 0 && (
                    <p
                      style={{
                        color: "#666",
                        fontSize: "12px",
                        textAlign: "center",
                        marginTop: "20px",
                      }}
                    >
                      O combate ainda não começou.
                    </p>
                  )}
                  {combatLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        background: "rgba(0,0,0,0.4)",
                        padding: "12px",
                        borderRadius: "8px",
                        borderLeft: log.personagem?.includes("SISTEMA")
                          ? `3px solid ${colors.pe}`
                          : `3px solid ${colors.brand}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "4px",
                        }}
                      >
                        <strong
                          style={{
                            color: log.personagem?.includes("SISTEMA")
                              ? colors.pe
                              : "#fff",
                            fontSize: "13px",
                          }}
                        >
                          {/* 👇 AQUI ESTÁ A CORREÇÃO DO ERRO 👇 */}
                          {(log.personagem || "Desconhecido").toUpperCase()}
                        </strong>
                        <span style={{ fontSize: "10px", color: "#666" }}>
                          RODADA {log.rodada}
                        </span>
                      </div>
                      <div
                        style={{
                          color: "#aaa",
                          fontSize: "12px",
                          lineHeight: 1.5,
                        }}
                      >
                        {log.acao}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ABA 6: INVENTÁRIO */}
        {activeTab === "inventario" && (
          <div style={styles.container}>
            <div style={styles.statusBox}>
              <h2 style={styles.sectionTitle}>MÓDULO_DE_INVENTÁRIO</h2>

              {/* CARD DE PRESTÍGIO E PATENTE */}
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    ...styles.summaryCard,
                    flex: 1,
                    textAlign: "center",
                  }}
                >
                  <div style={{ ...styles.attrLabel, marginBottom: "10px" }}>
                    PONTOS DE PRESTÍGIO
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <button
                      style={styles.btnStep}
                      onClick={() => setPrestigio((p) => Math.max(0, p - 5))}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={prestigio}
                      onChange={(e) =>
                        setPrestigio(Number(e.target.value) || 0)
                      }
                      style={{ ...styles.inputField, width: "60px" }}
                    />
                    <button
                      style={styles.btnStep}
                      onClick={() => setPrestigio((p) => p + 5)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    ...styles.summaryCard,
                    flex: 2,
                    display: "flex",
                    justifyContent: "space-around",
                    alignItems: "center",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div style={styles.attrLabel}>PATENTE</div>
                    <div
                      style={{
                        color: colors.brand,
                        fontSize: "18px",
                        fontWeight: "bold",
                      }}
                    >
                      {patenteInfo.nome.toUpperCase()}
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      borderLeft: "1px solid #333",
                      paddingLeft: "20px",
                    }}
                  >
                    <div style={styles.attrLabel}>CRÉDITO</div>
                    <div style={{ color: "#fff", fontSize: "16px" }}>
                      {patenteInfo.credito.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD DE CARGA E LIMITES */}
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ ...styles.summaryCard, flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "5px",
                    }}
                  >
                    <span style={styles.attrLabel}>CARGA ATUAL</span>
                    <span
                      style={{
                        color: cargaAtual > cargaMaxima ? colors.pv : "#fff",
                        fontWeight: "bold",
                      }}
                    >
                      {cargaAtual} / {cargaMaxima}
                    </span>
                  </div>
                  <div
                    style={{
                      height: "10px",
                      background: "#000",
                      border: "1px solid #222",
                      borderRadius: "5px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(
                          (cargaAtual / Math.max(cargaMaxima, 1)) * 100,
                          100
                        )}%`,
                        background:
                          cargaAtual > cargaMaxima ? colors.pv : colors.brand,
                        transition: "0.3s",
                      }}
                    />
                  </div>
                  {isTecnico && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: colors.pe,
                        marginTop: "8px",
                      }}
                    >
                      *Habilidade Inventário Otimizado (Técnico) ativa.
                    </div>
                  )}
                </div>

                <div style={{ ...styles.summaryCard, flex: 1 }}>
                  <div
                    style={{
                      ...styles.attrLabel,
                      marginBottom: "8px",
                      textAlign: "center",
                    }}
                  >
                    LIMITES DA PATENTE
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-around" }}
                  >
                    {["I", "II", "III", "IV"].map((cat) => {
                      const limite = patenteInfo.limite[cat];
                      const usado = categoriasUsadas[cat];
                      const estourou = usado > limite;
                      return (
                        <div key={cat} style={{ textAlign: "center" }}>
                          <div
                            style={{
                              color: "#fff",
                              fontWeight: "bold",
                              fontSize: "14px",
                            }}
                          >
                            CAT {cat}
                          </div>
                          <div
                            style={{
                              color: estourou ? colors.pv : "#aaa",
                              fontSize: "12px",
                            }}
                          >
                            {usado} /{" "}
                            {limite === 0 &&
                            patenteInfo.nome !== "Agente Especial"
                              ? "0"
                              : limite}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 👇 CARD DE ADICIONAR ITEM (AUTOMÁTICO + MANUAL) 👇 */}
              <div style={{ ...styles.summaryCard, marginBottom: "20px" }}>
                <div
                  style={{
                    ...styles.attrLabel,
                    marginBottom: "10px",
                    color: colors.brand,
                  }}
                >
                  ARSENAL DA ORDEM (ADICIONAR ITEM)
                </div>

                {/* SELECT INTELIGENTE */}
                <select
                  onChange={(e) => {
                    const selected = itemsCatalog.find(
                      (i) => i.nome === e.target.value
                    );
                    if (selected) {
                      setItemBaseSelecionado(selected);
                      setModsSelecionadas([]);
                      setMaldicoesSelecionadas([]);
                    }
                  }}
                  style={{
                    ...styles.selectField,
                    marginBottom: "15px",
                    borderColor: "#444",
                    color: "#ddd",
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Escolha um item do livro ou crie um customizado abaixo...
                  </option>
                  {[
                    "Armas Corpo a Corpo",
                    "Armas de Disparo",
                    "Armas de Fogo",
                    "Armas Pesadas",
                    "Proteção",
                    "Explosivos",
                    "Acessórios",
                    "Munição",
                    "Itens Operacionais",
                    "Itens Paranormais",
                  ].map((grupo) => (
                    <optgroup
                      key={grupo}
                      label={grupo}
                      style={{ color: colors.brand }}
                    >
                      {itemsCatalog
                        .filter((i) => i.grupo === grupo)
                        .map((item) => (
                          <option
                            key={item.nome}
                            value={item.nome}
                            style={{ color: "#fff" }}
                          >
                            {item.nome} (Cat{" "}
                            {item.cat === 0
                              ? "0"
                              : item.cat === 1
                              ? "I"
                              : item.cat === 2
                              ? "II"
                              : item.cat === 3
                              ? "III"
                              : "IV"}{" "}
                            | {item.espacos} Espaços)
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginBottom: "10px",
                  }}
                >
                  <input
                    placeholder="Nome do item"
                    value={previewItem?.nome || ""}
                    readOnly
                    style={{
                      ...styles.selectField,
                      flex: 3,
                      minWidth: "150px",
                      opacity: 0.8,
                    }}
                  />
                  <select
                    value={previewItem?.cat ?? 0}
                    disabled
                    style={{
                      ...styles.selectField,
                      flex: 1,
                      minWidth: "90px",
                      opacity: 0.8,
                    }}
                  >
                    <option value={0}>Cat 0</option>
                    <option value={1}>Cat I</option>
                    <option value={2}>Cat II</option>
                    <option value={3}>Cat III</option>
                    <option value={4}>Cat IV</option>
                  </select>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "#000",
                      border: `1px solid ${colors.brand}33`,
                      borderRadius: "8px",
                      padding: "0 10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#666",
                        marginRight: "5px",
                      }}
                    >
                      ESPAÇOS:
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={previewItem?.espacos ?? 0}
                      readOnly
                      style={{
                        background: "none",
                        border: "none",
                        color: "#fff",
                        width: "35px",
                        outline: "none",
                        textAlign: "center",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginBottom: "15px",
                  }}
                >
                  <input
                    placeholder="Dano (ex: 1d10)"
                    value={previewItem?.dano || ""}
                    readOnly
                    style={{
                      ...styles.selectField,
                      flex: 1,
                      minWidth: "100px",
                      opacity: 0.8,
                    }}
                  />
                  <input
                    placeholder="Crítico (ex: 19)"
                    value={previewItem?.critico || ""}
                    readOnly
                    style={{
                      ...styles.selectField,
                      flex: 1,
                      minWidth: "100px",
                      opacity: 0.8,
                    }}
                  />
                  <input
                    placeholder="Alcance/Tipo"
                    value={
                      [previewItem?.alcance, previewItem?.tipo]
                        .filter(Boolean)
                        .join(" / ")
                    }
                    readOnly
                    style={{
                      ...styles.selectField,
                      flex: 1,
                      minWidth: "100px",
                      opacity: 0.8,
                    }}
                  />
                </div>
                <textarea
                  ref={itemDescRef}
                  placeholder="Descrição ou Efeito Específico (Opcional)"
                  value={previewItem?.desc || ""}
                  readOnly
                  rows={3}
                  onInput={(e) => {
                    e.currentTarget.style.height = "auto";
                    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                  }}
                  style={{
                    ...styles.selectField,
                    marginBottom: "15px",
                    minHeight: "90px",
                    resize: "none",
                    overflow: "hidden",
                    opacity: 0.9,
                  }}
                />
                {modsDisponiveis.length > 0 && (
                  <div
                    style={{
                      border: "1px solid #2a2a2a",
                      borderRadius: "10px",
                      padding: "12px",
                      marginBottom: "15px",
                      background: "rgba(0,0,0,0.25)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: colors.brand,
                        marginBottom: "8px",
                        letterSpacing: "1px",
                      }}
                    >
                      MODIFICAÇÕES DISPONÍVEIS (CADA UMA +1 CATEGORIA)
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {modsDisponiveis.map((mod) => {
                        const checked = modsSelecionadas.includes(mod);
                        return (
                          <label
                            key={mod}
                            style={{
                              border: `1px solid ${checked ? colors.brand : "#333"}`,
                              background: checked
                                ? "rgba(0,229,255,0.1)"
                                : "rgba(0,0,0,0.2)",
                              borderRadius: "999px",
                              padding: "6px 10px",
                              fontSize: "11px",
                              cursor: "pointer",
                              userSelect: "none",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setModsSelecionadas((prev) =>
                                  prev.includes(mod)
                                    ? prev.filter((m) => m !== mod)
                                    : [...prev, mod]
                                );
                              }}
                              style={{ marginRight: "6px" }}
                            />
                            {mod}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openInfoModal(
                                  "mod",
                                  modsDisponiveis,
                                  modsDisponiveis.indexOf(mod)
                                );
                              }}
                              style={{
                                marginLeft: "8px",
                                background: "none",
                                border: `1px solid ${colors.brand}88`,
                                color: colors.brand,
                                borderRadius: "999px",
                                fontSize: "10px",
                                padding: "1px 6px",
                                cursor: "pointer",
                              }}
                            >
                              i
                            </button>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                {maldicoesDisponiveis.length > 0 && (
                  <div
                    style={{
                      border: "1px solid #3a233f",
                      borderRadius: "10px",
                      padding: "12px",
                      marginBottom: "15px",
                      background: "rgba(54,20,66,0.2)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#d593ff",
                        marginBottom: "8px",
                        letterSpacing: "1px",
                      }}
                    >
                      MALDIÇÕES DE ARMA (1ª +II, DEMAIS +I)
                    </div>
                    {!canUseCursedItems && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#ff9aa2",
                          marginBottom: "8px",
                        }}
                      >
                        Itens amaldiçoados só são liberados para Agente
                        Especial, Oficial de Operações e Agente de Elite.
                      </div>
                    )}
                    {canUseCursedItems && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#c9b4d6",
                          marginBottom: "8px",
                          lineHeight: 1.4,
                          whiteSpace: "pre-line",
                        }}
                      >
                        {"Regra: 1ª maldição aumenta categoria em +II, demais em +I.\nNão é permitido combinar elementos opressores.\nCusto de Sanidade: Conhecimento (falhas em Intelecto), Energia (Agilidade), Morte (Presença), Sangue (Força/Vigor): -2 SAN por maldição do elemento."}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {maldicoesDisponiveis.map((curse) => {
                        const checked = maldicoesSelecionadas.includes(curse);
                        const element = CURSE_ELEMENT[curse];
                        return (
                          <label
                            key={curse}
                            style={{
                              border: `1px solid ${checked ? "#d593ff" : "#4a3554"}`,
                              background: checked
                                ? "rgba(213,147,255,0.15)"
                                : "rgba(0,0,0,0.2)",
                              borderRadius: "999px",
                              padding: "6px 10px",
                              fontSize: "11px",
                              cursor: "pointer",
                              userSelect: "none",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!canUseCursedItems}
                              onChange={() => {
                                if (!canUseCursedItems) return;
                                if (
                                  curse === "Empuxo" &&
                                  itemBaseSelecionado?.grupo !== "Armas Corpo a Corpo"
                                ) {
                                  alert("Empuxo só pode ser aplicada em armas corpo a corpo.");
                                  return;
                                }
                                setMaldicoesSelecionadas((prev) =>
                                  prev.includes(curse)
                                    ? prev.filter((c) => c !== curse)
                                    : (() => {
                                        const nextElements = prev.map(
                                          (c) => CURSE_ELEMENT[c]
                                        );
                                        const hasOppressor = nextElements.some(
                                          (el) =>
                                            OPPRESSOR_ELEMENTS[el] === element ||
                                            OPPRESSOR_ELEMENTS[element] === el
                                        );
                                        if (hasOppressor) {
                                          alert(
                                            "Não é permitido combinar maldições de elementos opressores."
                                          );
                                          return prev;
                                        }
                                        return [...prev, curse];
                                      })()
                                );
                              }}
                              style={{ marginRight: "6px" }}
                            />
                            {curse}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openInfoModal(
                                  "curse",
                                  maldicoesDisponiveis,
                                  maldicoesDisponiveis.indexOf(curse)
                                );
                              }}
                              style={{
                                marginLeft: "8px",
                                background: "none",
                                border: "1px solid #d593ff88",
                                color: "#d593ff",
                                borderRadius: "999px",
                                fontSize: "10px",
                                padding: "1px 6px",
                                cursor: "pointer",
                              }}
                            >
                              i
                            </button>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  disabled={!itemBaseSelecionado}
                  onClick={() => {
                    if (!itemBaseSelecionado || !previewItem) {
                      alert("Selecione um item do livro para adicionar.");
                      return;
                    }
                    const itemFinal = {
                      id: Date.now(),
                      ...previewItem,
                    };

                    setInventario([
                      itemFinal,
                      ...inventario,
                    ]);
                    // Limpar campos após adicionar
                    setItemBaseSelecionado(null);
                    setModsSelecionadas([]);
                    setMaldicoesSelecionadas([]);
                  }}
                  style={{
                    ...styles.btnStep,
                    width: "100%",
                    background: "rgba(0, 229, 255, 0.1)",
                    borderColor: colors.brand,
                    color: colors.brand,
                    fontWeight: "bold",
                    padding: "12px",
                    opacity: itemBaseSelecionado ? 1 : 0.5,
                    cursor: itemBaseSelecionado ? "pointer" : "not-allowed",
                  }}
                >
                  + ADICIONAR À MOCHILA
                </button>
              </div>

              {/* 👇 LISTA DE ITENS COM DETALHES 👇 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {inventario.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#666",
                      padding: "30px",
                      border: "1px dashed #333",
                      borderRadius: "10px",
                    }}
                  >
                    A mochila está vazia. Solicite equipamentos para a Ordem.
                  </div>
                )}
                {inventario.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      ...styles.summaryCard,
                      borderLeft: `4px solid ${
                        item.cat > 0 ? colors.pe : "#444"
                      }`,
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <strong
                        style={{
                          color: "#fff",
                          fontSize: "15px",
                          letterSpacing: "1px",
                        }}
                      >
                        {item.nome.toUpperCase()}
                      </strong>
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: "11px", color: "#aaa" }}>
                          CAT{" "}
                          {item.cat === 0
                            ? "0"
                            : item.cat === 1
                            ? "I"
                            : item.cat === 2
                            ? "II"
                            : item.cat === 3
                            ? "III"
                            : "IV"}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#aaa",
                            background: "#111",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {item.espacos} ESPAÇO{item.espacos !== 1 ? "S" : ""}
                        </span>
                        <button
                          onClick={() =>
                            setInventario(
                              inventario.filter((i) => i.id !== item.id)
                            )
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: colors.pv,
                            cursor: "pointer",
                            fontSize: "14px",
                          }}
                          title="Descartar Item"
                        >
                          ✖
                        </button>
                      </div>
                    </div>
                    {Array.isArray(item.modificacoes) &&
                      item.modificacoes.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                            marginTop: "8px",
                          }}
                        >
                          {item.modificacoes.map((mod) => (
                            <span
                              key={`${item.id}-mod-${mod}`}
                              style={{
                                fontSize: "10px",
                                border: `1px solid ${colors.brand}66`,
                                color: colors.brand,
                                borderRadius: "999px",
                                padding: "2px 8px",
                                background: "rgba(0,229,255,0.08)",
                              }}
                            >
                              MOD: {mod}
                            </span>
                          ))}
                        </div>
                      )}
                    {Array.isArray(item.maldicoes) &&
                      item.maldicoes.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                            marginTop: "6px",
                          }}
                        >
                          {item.maldicoes.map((curse) => {
                            const element = CURSE_ELEMENT[curse];
                            const elementColor = ELEMENT_COLORS[element] || "#d593ff";
                            return (
                              <span
                                key={`${item.id}-curse-${curse}`}
                                style={{
                                  fontSize: "10px",
                                  border: `1px solid ${elementColor}99`,
                                  color: elementColor,
                                  borderRadius: "999px",
                                  padding: "2px 8px",
                                  background: "rgba(255,255,255,0.03)",
                                }}
                              >
                                MALDIÇÃO: {curse}
                                {element ? ` (${element})` : ""}
                              </span>
                            );
                          })}
                        </div>
                      )}

                    {/* Exibe o Painel de Detalhes de Combate/Uso se a arma/item tiver informações preenchidas */}
                    {(item.dano ||
                      item.critico ||
                      item.alcance ||
                      item.desc) && (
                      <div
                        style={{
                          background: "rgba(0,0,0,0.3)",
                          padding: "10px",
                          borderRadius: "6px",
                        }}
                      >
                        {(item.dano || item.critico || item.alcance) && (
                          <div
                            style={{
                              display: "flex",
                              gap: "15px",
                              flexWrap: "wrap",
                              marginBottom: item.desc ? "8px" : "0",
                              fontSize: "12px",
                            }}
                          >
                            {item.dano && (
                              <span style={{ color: colors.pv }}>
                                ⚔️ <strong>DANO:</strong> {item.dano}
                              </span>
                            )}
                            {item.critico && (
                              <span style={{ color: "#ffd166" }}>
                                🎯 <strong>CRÍTICO:</strong> {item.critico}
                              </span>
                            )}
                            {item.alcance && (
                              <span style={{ color: "#00e5ff" }}>
                                📍 <strong>ALCANCE/TIPO:</strong> {item.alcance}
                              </span>
                            )}
                          </div>
                        )}
                        {item.desc && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#aaa",
                              lineHeight: 1.5,
                              whiteSpace: "pre-line",
                              borderTop:
                                item.dano || item.critico
                                  ? "1px dashed #333"
                                  : "none",
                              paddingTop:
                                item.dano || item.critico ? "6px" : "0",
                            }}
                          >
                            {item.desc}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {infoModal && (
          <div
            onClick={() => setInfoModal(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.68)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "16px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(760px, 95vw)",
                maxHeight: "80vh",
                overflowY: "auto",
                background: "#0f1016",
                border: `1px solid ${colors.brand}55`,
                borderRadius: "12px",
                padding: "16px",
                boxShadow: colors.glow,
              }}
            >
              {(() => {
                const entry = getInfoEntry(infoModal);
                if (!entry) return null;
                return (
                  <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <strong style={{ color: colors.brand }}>{entry.title}</strong>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() =>
                      setInfoModal((prev) => ({
                        ...prev,
                        index:
                          (prev.index - 1 + prev.keys.length) % prev.keys.length,
                      }))
                    }
                    style={{
                      background: "none",
                      border: "1px solid #444",
                      color: "#ddd",
                      borderRadius: "8px",
                      padding: "4px 8px",
                      cursor: "pointer",
                    }}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setInfoModal((prev) => ({
                        ...prev,
                        index: (prev.index + 1) % prev.keys.length,
                      }))
                    }
                    style={{
                      background: "none",
                      border: "1px solid #444",
                      color: "#ddd",
                      borderRadius: "8px",
                      padding: "4px 8px",
                      cursor: "pointer",
                    }}
                  >
                    Próxima
                  </button>
                  <button
                    type="button"
                    onClick={() => setInfoModal(null)}
                    style={{
                      background: "none",
                      border: "1px solid #444",
                      color: "#ddd",
                      borderRadius: "8px",
                      padding: "4px 8px",
                      cursor: "pointer",
                    }}
                  >
                    Fechar
                  </button>
                </div>
              </div>
              <div
                style={{
                  color: "#ddd",
                  fontSize: "13px",
                  lineHeight: 1.6,
                  whiteSpace: "pre-line",
                }}
              >
                {entry.text}
              </div>
              </>
                );
              })()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const [authFeedback, setAuthFeedback] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashRaw = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(hashRaw);

    const authParam = searchParams.get("auth");
    const errorDescription =
      searchParams.get("error_description") ||
      hashParams.get("error_description") ||
      searchParams.get("error") ||
      hashParams.get("error");
    const hashType = hashParams.get("type");
    const hasSessionToken =
      Boolean(hashParams.get("access_token")) ||
      Boolean(hashParams.get("refresh_token"));

    let feedback = null;

    if (errorDescription) {
      feedback = {
        type: "error",
        title: "Falha na confirmação",
        text: decodeURIComponent(errorDescription).replace(/\+/g, " "),
      };
    } else if (authParam === "confirmed" || (hashType === "signup" && hasSessionToken)) {
      feedback = {
        type: "success",
        title: "E-mail confirmado",
        text: "Sua conta foi confirmada com sucesso. Você já pode entrar no sistema.",
      };
    } else if (authParam === "reset") {
      feedback = {
        type: "info",
        title: "Recuperação de senha",
        text: "Link de recuperação validado. Defina sua nova senha para concluir.",
      };
    }

    if (feedback) {
      setAuthFeedback(feedback);
      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  if (loading)
    return (
      <div
        style={{
          color: colors.brand,
          padding: "40px",
          textAlign: "center",
          fontFamily: "monospace",
        }}
      >
        Conectando ao terminal A.S.A...
      </div>
    );

  if (authFeedback) {
    const accent =
      authFeedback.type === "error"
        ? "#ff4d4f"
        : authFeedback.type === "info"
        ? "#ffd166"
        : colors.brand;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: colors.background,
          color: colors.text,
        }}
      >
        <div
          style={{
            width: "min(560px, 95vw)",
            border: `1px solid ${accent}66`,
            boxShadow: "0 0 24px rgba(0,0,0,0.45)",
            borderRadius: "14px",
            background: "rgba(17, 17, 21, 0.96)",
            padding: "20px",
            fontFamily: "monospace",
          }}
        >
          <h2 style={{ margin: "0 0 10px", color: accent }}>{authFeedback.title}</h2>
          <p style={{ margin: "0 0 16px", lineHeight: 1.55 }}>{authFeedback.text}</p>
          <button
            type="button"
            onClick={() => setAuthFeedback(null)}
            style={{
              border: `1px solid ${accent}66`,
              background: "transparent",
              color: "#fff",
              borderRadius: "10px",
              padding: "10px 14px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return <AppContent key={user.id} />;
}
