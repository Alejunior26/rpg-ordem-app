export const MOD_RULES = {
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

export const MOD_EFFECTS = {
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

export const MOD_FULL_DESC = {
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

export const CURSE_RULES = {
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

export const CURSE_EFFECTS = {
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

export const CURSE_FULL_DESC = {
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

export const CURSE_ELEMENT = {
  Lancinante: "Sangue",
  Vibrante: "Energia",
  Senciente: "Conhecimento",
  Erosiva: "Morte",
};

export const ELEMENT_COLORS = {
  Conhecimento: "#4ecdc4",
  Energia: "#ffd166",
  Morte: "#9b5de5",
  Sangue: "#ef476f",
  Medo: "#ffffff",
};

export const OPPRESSOR_ELEMENTS = {
  Sangue: "Conhecimento",
  Conhecimento: "Sangue",
  Energia: "Morte",
  Morte: "Energia",
};

export function getAllowedModsForItem(item) {
  if (!item) return [];
  if (item.grupo === "Munição") {
    return MOD_RULES[`Munição:${item.nome}`] || [];
  }
  return MOD_RULES[item.grupo] || [];
}

export function getAllowedCursesForItem(item) {
  if (!item) return [];
  return CURSE_RULES[item.grupo] || [];
}

export function addPlusFlatDamage(dano, value) {
  if (!dano) return dano;
  const text = String(dano).trim();
  if (!text) return text;
  return `${text}+${value}`;
}

export function increaseDiceCount(dano, amount = 1) {
  if (!dano) return dano;
  const match = String(dano).match(/^(\d+)d(\d+)(.*)$/i);
  if (!match) return dano;
  const qtd = Number(match[1]) + amount;
  return `${qtd}d${match[2]}${match[3] || ""}`;
}

export function shiftRangeUp(alcance) {
  const map = {
    Curto: "Médio",
    "Curto ": "Médio",
    Médio: "Longo",
    Longo: "Extremo",
  };
  return map[alcance] || alcance;
}

export function parseCrit(critico) {
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

export function formatCrit({ margin, mult }, original) {
  if (!margin || !mult) return original;
  if (margin === 20) return `x${mult}`;
  return `${margin}/x${mult}`;
}

export function applyWeaponModifications(baseItem, selectedMods) {
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

export function applyWeaponCurses(baseItem, selectedCurses) {
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
