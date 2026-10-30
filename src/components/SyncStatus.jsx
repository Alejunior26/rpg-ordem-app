export default function SyncStatus({ status, error, onRetry, onExport, onReload }) {
  const failed = status.state === 'error' || status.state === 'conflict' || error;
  if (!failed) return <span className="sync-status-quiet" role="status" aria-live="polite">{status.message}</span>;
  return <aside className="sync-status" aria-label="Sincronização da ficha">
    <span role="status" aria-live="polite">{error || status.message}</span>
    {failed && <button type="button" onClick={onRetry}>Tentar novamente</button>}
    <button type="button" onClick={onExport}>Exportar cópia</button>
    {status.state === 'conflict' && <button type="button" onClick={() => {
      if (window.confirm('Usar a versão do servidor? A cópia local ficará arquivada e poderá ser exportada.')) onReload();
    }}>Usar versão do servidor</button>}
  </aside>;
}
