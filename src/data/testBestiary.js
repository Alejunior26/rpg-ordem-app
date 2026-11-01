// Neutral fixtures are safe to use in any newly created mission.
export const testBestiary = [{
  id: 'training-sentinel', name: 'Sentinela de treinamento', vd: 10,
  type: 'NPC de teste', defense: '15', hp: '20 | 10 machucado',
  senses: 'Percepção 1d20+5; Iniciativa 1d20+5', resistances: 'Sem RD',
  traits: ['Encontro de treinamento. Substitua esta ficha pelo NPC da sua missão.'],
  actions: [{ name: 'Golpe de treinamento', type: 'Padrão', text: 'Um alvo adjacente. Ataque 1d20+5 contra Defesa; acerto causa 1d6 de impacto. Sem efeitos adicionais.' }],
}];
