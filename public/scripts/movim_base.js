/**
 * Register a service worker for the Progressive Web App
 */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register(SW_URI)
        .then(e => navigator.serviceWorker.ready)
        .then((r) => {
            console.log('Service Worker Registered');
        });

    const channel = new BroadcastChannel('messages');
    channel.addEventListener('message', event => {
        Notif.snackbarClear();
        window.focus();

        switch (event.data.type) {
            case 'call':
                break;
            case 'call_reject':
                VisioUtils.cancelLobby(event.data.data.fullJid, event.data.data.callId);
                break;
            case 'space_chat':
                MovimUtils.reload(event.data.data.server, event.data.data.node, event.data.data.room);
                break;
            case 'chat':
                Search.chat(event.data.data.jid, event.data.data.muc);
                break;
            default:
                if (event.data.data.url) {
                    MovimUtils.reload(event.data.data.url);
                }
                break;
        }
    });
}

MovimEvents.registerWindow('loaded', 'movimbase', () => {
    const pwaButton = document.querySelector('#pwa');

    if (pwaButton) {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            pwaButton.style.display = 'initial';

            pwaButton.addEventListener('click', () => {
                deferredPrompt.prompt();

                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('Movim App installed');
                    }

                    deferredPrompt = null;
                });
            });
        });
        // ponytail: iOS Safari never fires beforeinstallprompt, so the #pwa block
        // stays hidden there. iOS exposes notifications/web push ONLY inside an
        // installed Home-Screen PWA (16.4+), so show an accurate, version- and
        // device-specific Add-to-Home-Screen hint instead.
        const mb_ua = navigator.userAgent;
        const mb_isIPad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
        const mb_isIOS = /iP(hone|ad|od)/.test(mb_ua) || mb_isIPad;
        if (mb_isIOS && !window.navigator.standalone) {
            // Safari "Version/X.Y" tracks the iOS major.minor on iOS devices.
            const mb_v = mb_ua.match(/Version\/(\d+)\.(\d+)/);
            const mb_major = mb_v ? +mb_v[1] : 0, mb_minor = mb_v ? +mb_v[2] : 0;
            const mb_pushOK = mb_major > 16 || (mb_major === 16 && mb_minor >= 4);
            const mb_where = (mb_isIPad || /iPad/.test(mb_ua)) ? 'top toolbar' : 'bottom toolbar';
            const mb_share = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-.15em">'
                + '<path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/></svg>';
            const mb_tail = mb_pushOK
                ? ', then "Add to Home Screen", to install Movim and turn on notifications.'
                : ', then "Add to Home Screen", to install Movim. (Notifications need iOS 16.4 or newer.)';
            const mb_hint = pwaButton.querySelector('.all');
            if (mb_hint) mb_hint.innerHTML = 'Tap ' + mb_share + ' in the ' + mb_where + mb_tail;
            pwaButton.classList.remove('hide');
        }
    }
});
