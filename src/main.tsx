import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AccessGate } from './ui/AccessGate';
import { App } from './ui/App';
import { PuppetLab } from './ui/PuppetLab';
import { registerOffline } from './pwa/offline';
import './styles.css';

registerOffline();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {import.meta.env.DEV && new URLSearchParams(location.search).has('lab') ? <PuppetLab /> : (
      <AccessGate>
        <App />
      </AccessGate>
    )}
  </StrictMode>,
);
