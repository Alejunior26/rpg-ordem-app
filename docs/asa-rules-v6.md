# Fichas A.S.A. v6

As 13 ameaças do catálogo usam a revisão consolidada da campanha e condições de Ordem Paranormal RPG 1.3. Os nomes das condições e seus efeitos foram conferidos no exemplar fornecido pelo mestre; as descrições são resumos. DTs, dano, perfis e habilidades da campanha continuam autorais.

O livro e o site têm fonte comum: `bestiary.py` e `rules_v13.py` no pacote editorial da campanha. O exportador `export_site_v6.py` gera `src/data/asaBestiary.js` e `src/data/ordemConditions.json`. Não edite o efeito de uma condição em um único destino: atualize a fonte editorial e exporte novamente. O PDF oficial e sua extração não entram no repositório.

As ações descrevem alcance, alvo, ataque/resistência, sucesso, falha, duração e contramedidas. A consulta junto de cada ação mostra a condição aplicada e suas condições derivadas. O apagão do Maestro tem alcance, prazo e meios de encerramento; não convoca Portadores. O Ruína anuncia seu cone antes de descarregar.

Combates salvos podem conter uma cópia antiga da ficha. O resolvedor consulta a referência atual para os IDs do catálogo, preserva o estado e os registros do encontro e mantém fichas personalizadas. Os IDs das ameaças não mudaram, conservando a associação dos tokens.

Usar ação apenas registra o texto no histórico. A revisão não aplica dano, move tokens, abre portas ou altera iluminação automaticamente. O mestre resolve esses efeitos com as regras indicadas.
