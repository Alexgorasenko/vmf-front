import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import UAParser from 'ua-parser-js'
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

import * as serviceWorkerRegistration from './serviceWorkerRegistration'

const root = ReactDOM.createRoot(document.getElementById('root'));

const ua = UAParser()

Sentry.init({
  dsn: "https://ca1a3e35dd894eed912343aaaec9e186@o1021987.ingest.sentry.io/4505323550801920",
  integrations: [new BrowserTracing()],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0.01,
});

root.render(
    <App
        device={ua}
    />
);

serviceWorkerRegistration.register().then(reg => {
    console.log('Resolved register')
    console.log('Adding listener')
    window.addEventListener('beforeinstallprompt', evt => {
        window.deferredPrompt = evt
        console.log('BEFORE IP Fired. Need to show dialog...')
    })
})
