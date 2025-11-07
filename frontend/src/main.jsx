import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Elemento #root não encontrado no DOM!');
  document.body.innerHTML = `
    <div style="padding: 40px; text-align: center; color: red;">
      <h1>Erro: Elemento #root não encontrado</h1>
      <p>O elemento com id="root" não foi encontrado no HTML.</p>
      <p>Verifique se o index.html contém: &lt;div id="root"&gt;&lt;/div&gt;</p>
    </div>
  `;
} else {
  console.log('=== Iniciando aplicação React ===');
  console.log('Root element encontrado:', rootElement);
  
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('=== Aplicação React renderizada com sucesso ===');
  } catch (error) {
    console.error('=== ERRO ao renderizar aplicação React ===', error);
    rootElement.innerHTML = `
      <div style="padding: 40px; text-align: center; color: red; font-family: Arial, sans-serif;">
        <h1>Erro ao inicializar a aplicação</h1>
        <p><strong>Erro:</strong> ${error.message}</p>
        <pre style="text-align: left; background: #f5f5f5; padding: 20px; border-radius: 4px; margin-top: 20px;">
${error.stack}
        </pre>
        <button onclick="window.location.reload()" style="
          padding: 10px 20px;
          margin-top: 20px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        ">
          Recarregar Página
        </button>
      </div>
    `;
  }
}
