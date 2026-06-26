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
            pwaButton.closest('.more')?.classList.remove('hide');

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
        // ponytail: iOS Safari never fires beforeinstallprompt, and iOS exposes web
        // push ONLY inside an installed Home-Screen PWA (16.4+). Show a prominent
        // fixed bottom banner guiding the user to Add to Home Screen. We do NOT claim
        // a toolbar location: Safari hides Share behind the ... menu depending on
        // version/layout and that is not detectable from JS, so we reference both the
        // Share icon and the ... button. Leaves the #pwa/#form panel hidden.
        const mb_ua = navigator.userAgent;
        const mb_isIPad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
        const mb_isIOS = /iP(hone|ad|od)/.test(mb_ua) || mb_isIPad;
        if (mb_isIOS && !window.navigator.standalone && !document.getElementById('movim-ios-install')) {
            // Safari "Version/X.Y" tracks the iOS major.minor on iOS devices.
            const mb_v = mb_ua.match(/Version\/(\d+)\.(\d+)/);
            const mb_major = mb_v ? +mb_v[1] : 0, mb_minor = mb_v ? +mb_v[2] : 0;
            const mb_pushOK = mb_major > 16 || (mb_major === 16 && mb_minor >= 4);
            const mb_share = '<svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-.22em">'
                + '<path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/></svg>';
            const mb_b = document.createElement('div');
            mb_b.id = 'movim-ios-install';
            // px not rem (Movim sets html{font-size:51%} -> rem renders tiny); !important on
            // layout because body>*{height:100%;position:relative} would otherwise stretch this
            // div to cover the whole page.
            mb_b.style.cssText = 'position:fixed !important;left:0 !important;right:0 !important;'
                + 'bottom:0 !important;top:auto !important;height:auto !important;width:auto !important;'
                + 'z-index:99999 !important;margin:0 !important;box-sizing:border-box;'
                + 'background:#e9540d;color:#fff;text-align:center;'
                + 'padding:16px 18px calc(16px + env(safe-area-inset-bottom,0px));'
                + 'box-shadow:0 -3px 18px rgba(0,0,0,.4);font-size:17px;line-height:1.5;';
            mb_b.innerHTML =
                '<div style="font-size:22px;font-weight:800;margin-bottom:6px;">Install Movim'
                + (mb_pushOK ? ' to get notifications' : '') + '</div>'
                + '<div style="font-size:17px;">Tap ' + mb_share + ' <b>or the &#8230; button</b> by the address bar, '
                + 'then <b>&ldquo;Add to Home Screen&rdquo;</b>.'
                + (mb_pushOK ? '' : '<br><span style="opacity:.85;font-size:13px">Notifications need iOS 16.4 or newer.</span>')
                + '</div>';
            document.body.appendChild(mb_b);
        }
    }
});
