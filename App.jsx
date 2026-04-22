// tracker.js (The Main SDK)
(function() {
  const API_ENDPOINT = 'http://localhost:3000/collect';
  const SEND_INTERVAL = 3000; // Force send every 3 seconds if batch reaches limit or interval elapses

  // State
  let projectId = null;
  let sessionId = generateUUID();
  let anonymousId = getOrSetAnonymousId();
  let eventQueue = [];
  let sendTimer = null;

  function generateUUID() {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  function getOrSetAnonymousId() {
    let id = localStorage.getItem('_ht_anon_id');
    if (!id) {
      id = generateUUID();
      localStorage.setItem('_ht_anon_id', id);
    }
    return id;
  }

  // API Methods
  const api = {
    init: function(pid) {
      projectId = pid;
      this.track('pageview', {
        url: window.location.pathname,
        referrer: document.referrer
      });
      setupInteractions();
    },
    track: function(eventType, metadata = {}) {
      if (!projectId) return;

      const event = {
        projectId: projectId,
        sessionId: sessionId,
        eventType: eventType,
        timestamp: Date.now(),
        page: {
          url: window.location.pathname
        },
        device: {
          type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        },
        metadata
      };

      eventQueue.push(event);
      scheduleSend();
    }
  };

  // Interactions Setup
  function setupInteractions() {
    // 1. Click Listener (Passive)
    document.addEventListener('click', (e) => {
      // Don't track sensitive inputs
      if (e.target.tagName === 'INPUT' && e.target.type === 'password') return;
      
      let elementMetadata = { tag: e.target.tagName.toLowerCase() };
      if (e.target.id) elementMetadata.id = e.target.id;
      if (e.target.className && typeof e.target.className === 'string') {
        elementMetadata.class = e.target.className;
      }

      api.track('click', {
        x: e.clientX,
        y: e.clientY,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        element: elementMetadata
      });
    }, { passive: true });

    // 2. Scroll Listener (Throttled)
    let scrollTimeout;
    document.addEventListener('scroll', () => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          api.track('scroll', {
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            pageHeight: document.documentElement.scrollHeight,
            viewportHeight: window.innerHeight
          });
          scrollTimeout = null;
        }, 500); // 500ms throttle
      }
    }, { passive: true });

    // 3. Unload/Visibility Change to Send Data
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushQueue(true); // use beacon
      }
    });

    // 4. Session Recording (rrweb)
    function startSessionRecording() {
      if (window.rrweb) {
        window.rrweb.record({
          emit(event) {
            // Push rrweb events wrapped in our standard event format
            api.track('session_record', {
              rrwebEvent: event
            });
          },
        });
      }
    }

    if (!window.rrweb) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js';
      script.onload = startSessionRecording;
      document.head.appendChild(script);
    } else {
      startSessionRecording();
    }
  }

  // Networking
  function scheduleSend() {
    if (!sendTimer) {
      sendTimer = setTimeout(() => flushQueue(), SEND_INTERVAL);
    }
    // Also flush immediately if queue size is large
    if (eventQueue.length >= 20) {
      flushQueue();
    }
  }

  function flushQueue(useBeacon = false) {
    if (sendTimer) {
      clearTimeout(sendTimer);
      sendTimer = null;
    }

    if (eventQueue.length === 0) return;

    const payload = JSON.stringify(eventQueue);
    
    // As per user request: "Beacon (unload) + Fetch (normal)"
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(API_ENDPOINT, payload);
      eventQueue = []; // Assume success for beacon
    } else {
      const currentQueue = [...eventQueue];
      eventQueue = []; // Optimistically clear

      fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: payload
      }).catch((e) => {
        // Add back if failed, although this is tricky for ordering. We keep it simple.
        console.error("Tracker: failed to send events", e);
        eventQueue = [...currentQueue, ...eventQueue];
      });
    }
  }

  // --- Process commands queued before tracker loaded ---
  const globalObject = window.ht || function() { (window.ht.q = window.ht.q || []).push(arguments); };
  const queue = (window.ht && window.ht.q) ? window.ht.q : [];

  // Replace global object with our API
  window.ht = function() {
    const args = Array.prototype.slice.call(arguments);
    const command = args.shift();
    if (api[command]) {
      api[command].apply(api, args);
    }
  };

  // Replay existing queue
  for (let i = 0; i < queue.length; i++) {
    window.ht.apply(window, queue[i]);
  }

})();
