import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AccessGate } from './ui/AccessGate';
import { CrashScreen } from './ui/CrashScreen';
import { App } from './ui/App';
import { FamilyGate } from './ui/FamilyGate';
import { PuppetLab } from './ui/PuppetLab';
import { registerOffline } from './pwa/offline';
import './styles.css';

registerOffline();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {import.meta.env.DEV && new URLSearchParams(location.search).has('lab') ? <PuppetLab /> : (
      <CrashScreen>
        <AccessGate>
          <FamilyGate>
            <App />
          </FamilyGate>
        </AccessGate>
      </CrashScreen>
    )}
  </StrictMode>,
);
