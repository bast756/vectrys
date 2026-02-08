import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>VECTRYS Guest Portal</h1>
      <p>✅ Monorepo initialisé</p>
      <p>✅ Frontend React + Vite + TypeScript</p>
      <p>✅ Integration Kit prêt (voir /integration-kit/)</p>
      <p>⏳ Backend NestJS en cours...</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
