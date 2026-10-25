import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { trackInitialPage } from './lib/analytics';
import './styles/global.css';

trackInitialPage(window.location);
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
