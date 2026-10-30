import React, { useState } from 'react';
import { participantToken, tabletopCombatView } from '../domain/tabletopCombat';

export default function TabletopCombatPanel({ combat, manager, preview, userId, character,
  scene, tokens, onFocusToken, onJoinCombat, onFinishOwnTurn, onFinishCurrentTurn,
  onAdvanceRound, renderCharacterPanel, renderCombatDirection, onExitPreview }) {
  const [actionTab, setActionTab] = useState('rituais');
  const [expanded, setExpanded] = useState(false);
  const privileged = manager && !preview;
  const state = combat.state;
  const view = tabletopCombatView(state, combat.logs, privileged);
  const done = state?.turn_done_by || [];
  const joined = view.participants.some((p) => p.userId === userId);
  const ownTurn = view.currentId === userId && !done.includes(userId);
  const locked = combat.busy || combat.logBusy || !state || preview;
  const canAdvance = state?.turn_order?.length > 0 && state.turn_order.every((id) => done.includes(id));
  return <section className="vt-card vt-combat">
    <h3>Combate · Rodada {state?.rodada || '—'}</h3>
    <div className="vt-combat-grid">
    <div className="vt-combat-overview">
    <p className="vt-combat-mode">{preview ? 'Prévia dos jogadores' : privileged ? 'Visão do mestre' : 'Visão do jogador'}</p>
    {preview && manager && onExitPreview && <button type="button" onClick={onExitPreview}>Voltar à visão do mestre</button>}
    {combat.error && <div role="alert" className="vt-alert">{combat.error}<button type="button" onClick={() => combat.refresh()}>Reconectar combate</button></div>}
    {!state ? <p role="status">{combat.error ? 'Combate indisponível.' : 'Conectando ao combate…'}</p> : <>
      <p className="vt-combat-turn" aria-live="polite">Turno: {view.current?.nome || (state.turn_order?.length ? 'Aguardando a mesa' : 'Ordem ainda não definida')}{canAdvance ? ' · Rodada concluída' : ''}</p>
      {!view.order.length && <p className="vt-muted">Nenhum participante na ordem visível.</p>}
      <ol className="vt-initiative" aria-label="Ordem de iniciativa">
        {view.order.map((p) => {
          const token = participantToken(p, scene, tokens, privileged);
          return <li key={p.userId} aria-current={p.userId === view.currentId ? 'step' : undefined}>
            <button type="button" disabled={!token} onClick={() => token && onFocusToken(token)} aria-label={`Localizar ${p.nome} no mapa`}>{p.nome}</button>
            <small>{done.includes(p.userId) ? 'Já agiu' : p.userId === view.currentId ? p.userId === userId ? 'Sua vez' : 'Em turno' : 'Aguardando'}</small>
          </li>;
        })}
      </ol>
      {preview ? <p className="vt-muted">Prévia dos jogadores · controles desativados</p> : <div className="vt-combat-controls">
        {!joined && character?.id && <button type="button" disabled={locked} onClick={onJoinCombat}>Entrar no combate</button>}
        {joined && <button type="button" disabled={locked || !ownTurn} onClick={onFinishOwnTurn}>{ownTurn ? 'Finalizar meu turno' : done.includes(userId) ? 'Turno já finalizado' : 'Aguardando sua vez'}</button>}
        {privileged && <>
          <button type="button" disabled={locked || !view.currentId || done.includes(view.currentId)} onClick={onFinishCurrentTurn}>Encerrar turno atual (Mestre)</button>
          <button type="button" disabled={locked || !canAdvance} onClick={onAdvanceRound}>Avançar rodada</button>
          {!state.turn_order?.length && <p className="vt-muted">Adicione participantes e defina a ordem em “Direção do combate” para começar.</p>}
        </>}
      </div>}
    </>}
    {combat.busy && <p role="status">Salvando ação…</p>}
    </div>
    <div className="vt-combat-workspace">
    {privileged && renderCombatDirection && <details className="vt-combat-direction" open>
      <summary>Direção do combate (Mestre)</summary>
      <fieldset disabled={locked} className="vt-action-content">
        {renderCombatDirection()}
      </fieldset>
    </details>}
    {!preview && character?.id && renderCharacterPanel && <details className="vt-action-drawer" open={!manager}>
      <summary>Ações e ficha na mesa</summary>
      <label>Área de ação<select aria-label="Área de ação" value={actionTab} onChange={(e) => setActionTab(e.target.value)}>
        {character?.id && <>
          <option value="status">Recursos e atributos</option><option value="classe">Habilidades e poderes</option>
          <option value="pericias">Perícias</option><option value="rituais">Rituais</option><option value="inventario">Inventário e armas</option>
        </>}
      </select></label>
      <fieldset disabled={locked || combat.logBusy} className="vt-action-content">
        {renderCharacterPanel(actionTab)}
      </fieldset>
    </details>}
    <details className="vt-combat-history" open>
      <summary>Histórico recente</summary>
      {!view.logs.length && <p className="vt-muted">Nenhuma ação pública disponível.</p>}
      <ol aria-label="Histórico de ações" className="vt-history-list">
        {(expanded ? view.logs : view.logs.slice(0, 4)).map((log) => <li key={log.id}>
          <strong>{log.personagem}</strong><small>Rodada {log.rodada}</small><p>{log.acao}</p>
        </li>)}
      </ol>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Recolher histórico' : 'Expandir histórico'}</button>
      {expanded && combat.hasMoreLogs && <button type="button" disabled={combat.historyBusy} onClick={combat.loadMoreLogs}>Carregar ações anteriores</button>}
    </details>
    </div>
    </div>
  </section>;
}
