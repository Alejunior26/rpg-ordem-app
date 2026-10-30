import React from 'react';
import rules from '../data/ordemConditions.json';

const byId = new Map(rules.conditions.map((condition) => [condition.id, condition]));
const derived = {
  agarrado: ['desprevenido', 'imovel'],
  atordoado: ['desprevenido'],
  cego: ['desprevenido', 'lento'],
  enredado: ['lento', 'vulneravel'],
  exausto: ['debilitado', 'lento', 'vulneravel'],
  fatigado: ['fraco', 'vulneravel'],
  inconsciente: ['indefeso'],
  paralisado: ['imovel', 'indefeso'],
  surpreendido: ['desprevenido'],
};

export default function ActionConditions({ ids = [] }) {
  const requested = Array.isArray(ids) ? ids : [];
  const conditions = [...new Set(requested.flatMap((id) => [id, ...(Object.hasOwn(derived, id) ? derived[id] : [])]))]
    .map((id) => byId.get(id)).filter(Boolean);
  if (!conditions.length) return null;
  return <details className="action-conditions" style={{ color: '#d1d5db', fontSize: '12px', lineHeight: 1.6, margin: '8px 0 12px' }}>
    <summary style={{ cursor: 'pointer', color: '#c4b5fd' }}>
      Ver condições: {requested.map((id) => byId.get(id)?.name).filter(Boolean).join(', ')}
    </summary>
    <dl style={{ margin: '8px 0' }}>
      {conditions.map((condition) => <React.Fragment key={condition.id}>
        <dt style={{ fontWeight: 'bold', marginTop: '8px' }}>{condition.name}{condition.kind ? ` · ${condition.kind}` : ''}</dt>
        <dd style={{ margin: '2px 0 8px' }}>{condition.summary} <span style={{ color: '#9ca3af' }}>Ordem 1.3, p. {condition.source_page}.</span></dd>
      </React.Fragment>)}
    </dl>
    <p style={{ margin: 0, color: '#9ca3af' }}>A duração e o teste estão na ação. Condições do sistema; dano e DT da campanha.</p>
  </details>;
}
