export {};

function loadCOIServiceWorker() {
  if (
    typeof window !== 'undefined' &&
    window.location.hostname != 'localhost'
  ) {
    const coi = window.document.createElement('script');
    coi.setAttribute('src', '/04-zkapp-browser-ui/coi-serviceworker.min.js'); // update if your repo name changes for 'npm run deploy' to work correctly
    window.document.head.appendChild(coi);
  }
}

loadCOIServiceWorker();
