import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sendMessage } from '../services/chat';

const QR = [
  { label: '📦 Statusul comenzii', text: 'Unde este comanda mea?' },
  { label: '🔄 Retur produs',      text: 'Vreau sa returnez un produs' },
  { label: '❌ Anulez comanda',    text: 'Vreau sa anulez o comanda' },
  { label: '🔧 Garantie',          text: 'Informatii despre garantie' },
  { label: '💳 Problema plata',    text: 'Am o problema cu plata' },
  { label: '🚚 Livrare',           text: 'Am o problema cu livrarea' },
];

const TypingDots = () => (
  <div style={S.typingWrap}>
    {[0,1,2].map(i => (
      <span key={i} style={{ ...S.dot, animationDelay: `${i*160}ms` }} />
    ))}
  </div>
);

const ChatWidget = () => {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState([{
    id: 0,
    text: 'Buna ziua! Sunt Asisto, asistentul virtual FilipShop. Cu ce va pot ajuta astazi?',
    sender: 'bot',
    time: now(),
  }]);
  const [input, setInput]     = useState('');
  const [typing, setTyping]   = useState(false);
  const [showQR, setShowQR]   = useState(true);
  const [showAgentConfirm, setShowAgentConfirm] = useState(false);
  const [locked, setLocked]   = useState(false);  // chat blocat dupa transfer
  const [showOverlay, setShowOverlay] = useState(false); // overlay blur

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const idRef     = useRef(1);

  function now() {
    return new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  }
  function nextId() { return idRef.current++; }

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, typing, scrollToBottom]);

  useEffect(() => {
    if (!open || !isMobile) return undefined;

    const handleViewportShift = () => {
      scrollToBottom('smooth');
    };

    window.addEventListener('resize', handleViewportShift);
    return () => window.removeEventListener('resize', handleViewportShift);
  }, [open, isMobile, scrollToBottom]);

  useEffect(() => {
    if (open && !locked) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open, locked]);

  const pushMsg = useCallback((msg) => {
    setMessages(prev => [...prev, { ...msg, id: nextId(), time: now() }]);
  }, []);

  const handleSend = useCallback((text, fromQR = false) => {
    if (locked) return;
    const txt = (text || input).trim();
    if (!txt) return;
    if (fromQR) setShowQR(false);

    pushMsg({ text: txt, sender: 'user' });
    setInput('');
    setTyping(true);

    sendMessage(txt, (msg) => {
      setTyping(false);

      const needsAgentConfirm = msg.text && (
        msg.text.includes('Aveti nevoie de ajutorul unui agent uman') ||
        msg.text.includes('Doriti sa va transfer la un agent')
      );

      // detecteaza mesajul real de transfer
      const isRealTransfer = msg.text && (
        msg.text.includes('Va transfer catre un agent uman') ||
        msg.text.includes('transfer catre un agent') ||
        msg.text.includes('Timp estimat de asteptare')
      );

      if (isRealTransfer) {
        setShowAgentConfirm(false);
        pushMsg({ ...msg, sender: 'bot' });
        // dupa 3 secunde, bloc chat si arata overlay
        setTimeout(() => {
          setLocked(true);
          setShowOverlay(true);
        }, 3000);
      } else {
        pushMsg({ ...msg, sender: 'bot' });
        if (needsAgentConfirm) {
          setShowAgentConfirm(true);
          setShowQR(false);
        }
      }
    });
  }, [input, locked, pushMsg]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !locked) {
      e.preventDefault();
      handleSend();
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 520;
  const windowStyle = isMobile
    ? { ...S.window, width: '100vw', height: '100dvh', bottom: 0, right: 0, borderRadius: 0 }
    : S.window;

  return (
    <>
      {/* FAB */}
      {!open && (
        <button onClick={() => setOpen(true)} style={S.fab} aria-label="Chat">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span style={S.fabDot} />
        </button>
      )}

      {open && (
        <div style={windowStyle}>
          {/* Header */}
          <div style={S.header}>
            <div style={S.hLeft}>
              <div style={S.hAvatar}>A</div>
              <div>
                <div style={S.hName}>Asisto</div>
                <div style={S.hStatus}>
                  <span style={locked ? S.hDotRed : S.hDot} />
                  {locked ? 'Agent preluat' : 'Online acum'}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={S.closeBtn} aria-label="Inchide">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages area — cu blur overlay daca e locked */}
          <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
            <div style={S.msgs}>
              {messages.map((msg) => (
                <div key={msg.id} style={{
                  ...S.row,
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  {msg.sender === 'bot' && <div style={S.botAv}>A</div>}
                  <div style={{
                    ...S.bubble,
                    ...(msg.sender === 'user' ? S.userB : S.botB),
                  }}>
                    <span style={{ whiteSpace: 'pre-line', lineHeight: 1.55 }}>{msg.text}</span>
                    <span style={S.ts}>{msg.time}</span>
                  </div>
                </div>
              ))}
              {typing && (
                <div style={{ ...S.row, justifyContent: 'flex-start' }}>
                  <div style={S.botAv}>A</div>
                  <div style={{ ...S.bubble, ...S.botB }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* OVERLAY BLUR + mesaj transfer */}
            {showOverlay && (
              <div style={S.overlay}>
                <div style={S.overlayCard}>
                  <div style={S.overlaySpinner}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="#0f172a" strokeWidth="3" strokeLinecap="round"
                        style={{ animation: 'spinAnim 1s linear infinite', transformOrigin: 'center' }}
                      />
                    </svg>
                  </div>
                  <p style={S.overlayTitle}>Transfer catre agent uman</p>
                  <p style={S.overlaySub}>Va rugam sa asteptati...</p>
                  <p style={S.overlaySub2}>Timp estimat: 5-10 minute</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick replies — ascunse daca e locked */}
          {showQR && !locked && !showAgentConfirm && (
            <div style={S.qrWrap}>
              <p style={S.qrLabel}>Subiecte frecvente</p>
              <div style={S.qrList}>
                {QR.map((q, i) => (
                  <button key={i} onClick={() => handleSend(q.text, true)} style={S.qrBtn}>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showAgentConfirm && !locked && (
            <div style={S.agentConfirmWrap}>
              <button
                style={{ ...S.agentConfirmBtn, ...S.agentConfirmAccept }}
                onClick={() => {
                  setShowAgentConfirm(false);
                  handleSend('da, vreau un agent uman');
                }}
              >
                ✓ Da, vreau un agent uman
              </button>
              <button
                style={{ ...S.agentConfirmBtn, ...S.agentConfirmDecline }}
                onClick={() => {
                  setShowAgentConfirm(false);
                  setShowQR(true);
                  pushMsg({ text: 'Ok, cu ce altceva va pot ajuta?', sender: 'bot' });
                }}
              >
                ✗ Nu, multumesc
              </button>
            </div>
          )}

          {/* Banner blocat */}
          {locked && (
            <div style={S.lockedBanner}>
              🔒 Chat blocat — agent uman preluat
            </div>
          )}

          {/* Input */}
          {!showAgentConfirm && (
            <div style={{ ...S.inputWrap, opacity: locked ? 0.45 : 1 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => {
                  if (locked) return;
                  setInput(e.target.value);
                  if (isMobile) {
                    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    scrollToBottom('smooth');
                  }
                }}
                onFocus={() => {
                  if (!isMobile) return;
                  scrollToBottom('smooth');
                  inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }}
                onKeyDown={handleKey}
                placeholder={locked ? '...' : 'Scrieti un mesaj...'}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="sentences"
                style={{ ...S.input, cursor: locked ? 'not-allowed' : 'text', background: locked ? '#f1f5f9' : '#fafbfc' }}
                disabled={locked}
              />
              <button
                onClick={() => !locked && handleSend()}
                disabled={!input.trim() || locked}
                style={{ ...S.sendBtn, opacity: (!input.trim() || locked) ? 0.4 : 1, cursor: locked ? 'not-allowed' : 'pointer' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4 20-7z" /><path d="M22 2 11 13" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes msgIn {
          from { opacity:0; transform: translateY(8px) scale(0.97); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }
        @keyframes chatPop {
          from { opacity:0; transform: scale(0.88) translateY(24px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
        @keyframes bounce {
          0%,80%,100% { transform:translateY(0); opacity:0.4; }
          40%          { transform:translateY(-5px); opacity:1; }
        }
        @keyframes spinAnim {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes overlayIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes cardIn {
          from { opacity:0; transform: scale(0.88) translateY(16px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
        @keyframes lockedPulse {
          0%,100% { opacity:1; }
          50%     { opacity:0.6; }
        }
      `}</style>
    </>
  );
};

const S = {
  fab: {
    position: 'fixed', bottom: '28px', right: '28px',
    width: '54px', height: '54px', background: '#0f172a',
    border: 'none', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', boxShadow: '0 8px 24px rgba(15,23,42,0.35)',
    zIndex: 1000, transition: 'transform 0.2s, box-shadow 0.2s',
  },
  fabDot: {
    position: 'absolute', top: '6px', right: '6px',
    width: '11px', height: '11px', borderRadius: '50%',
    background: '#22c55e', border: '2px solid white',
  },
  window: {
    position: 'fixed', bottom: '28px', right: '28px',
    width: '364px', height: '580px', background: 'white',
    borderRadius: '22px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column', zIndex: 1000, overflow: 'hidden',
    animation: 'chatPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
  },
  header: {
    background: '#0f172a', padding: '16px 18px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexShrink: 0,
  },
  hLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  hAvatar: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontWeight: '700', fontSize: '16px', fontFamily: "'Outfit', sans-serif",
  },
  hName: { color: 'white', fontWeight: '700', fontSize: '15px', fontFamily: "'Outfit', sans-serif" },
  hStatus: {
    color: 'rgba(255,255,255,0.6)', fontSize: '12px',
    display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Outfit', sans-serif",
  },
  hDot: {
    width: '7px', height: '7px', borderRadius: '50%',
    background: '#22c55e', boxShadow: '0 0 0 2px rgba(34,197,94,0.3)',
  },
  hDotRed: {
    width: '7px', height: '7px', borderRadius: '50%',
    background: '#f59e0b', boxShadow: '0 0 0 2px rgba(245,158,11,0.3)',
    animation: 'lockedPulse 1.5s ease infinite',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.8)',
    cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  msgs: {
    flex: 1, overflowY: 'auto', padding: '16px 14px',
    display: 'flex', flexDirection: 'column', gap: '10px',
    background: '#fafbfc', height: '100%',
  },
  row: {
    display: 'flex', alignItems: 'flex-end', gap: '8px',
    animation: 'msgIn 0.25s ease both',
  },
  botAv: {
    width: '28px', height: '28px', borderRadius: '50%', background: '#0f172a',
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', fontWeight: '700', flexShrink: 0, fontFamily: "'Outfit', sans-serif",
  },
  bubble: {
    maxWidth: '78%', padding: '10px 14px', borderRadius: '16px',
    fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: '4px',
    fontFamily: "'Outfit', sans-serif",
  },
  botB: {
    background: 'white', color: '#0f172a', borderBottomLeftRadius: '4px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', lineHeight: '1.55',
  },
  userB: {
    background: '#0f172a', color: 'white', borderBottomRightRadius: '4px', lineHeight: '1.55',
  },
  ts: { fontSize: '10px', opacity: 0.45, alignSelf: 'flex-end', marginTop: '2px' },
  typingWrap: {
    display: 'flex', gap: '4px', alignItems: 'center', height: '18px', padding: '2px 0',
  },
  dot: {
    width: '7px', height: '7px', borderRadius: '50%', background: '#94a3b8',
    display: 'inline-block', animation: 'bounce 1.2s ease infinite',
  },
  // OVERLAY
  overlay: {
    position: 'absolute', inset: 0,
    backdropFilter: 'blur(6px)',
    background: 'rgba(15,23,42,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
    animation: 'overlayIn 0.5s ease both',
  },
  overlayCard: {
    background: 'white', borderRadius: '18px',
    padding: '28px 32px', textAlign: 'center',
    boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
    animation: 'cardIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
    minWidth: '240px',
  },
  overlaySpinner: { marginBottom: '4px' },
  overlayTitle: {
    fontSize: '16px', fontWeight: '700', color: '#0f172a',
    fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.3px',
  },
  overlaySub: {
    fontSize: '13px', color: '#64748b', fontFamily: "'Outfit', sans-serif",
  },
  overlaySub2: {
    fontSize: '12px', color: '#94a3b8', fontFamily: "'Outfit', sans-serif",
  },
  // BANNER BLOCAT
  lockedBanner: {
    background: '#fef3c7', borderTop: '1px solid #fde68a',
    color: '#92400e', textAlign: 'center',
    fontSize: '12px', fontWeight: '600', padding: '8px 14px',
    fontFamily: "'Outfit', sans-serif", flexShrink: 0,
    animation: 'lockedPulse 2s ease infinite',
  },
  agentConfirmWrap: {
    padding: '12px',
    gap: '8px',
    display: 'flex',
    flexDirection: 'column',
    background: 'white',
    borderTop: '1px solid #f1f5f9',
    flexShrink: 0,
  },
  agentConfirmBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: "'Outfit', sans-serif",
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  agentConfirmAccept: {
    background: '#0f172a',
    color: 'white',
    border: 'none',
  },
  agentConfirmDecline: {
    background: 'white',
    color: '#0f172a',
    border: '1.5px solid #e2e8f0',
  },
  qrWrap: {
    padding: '10px 14px', borderTop: '1px solid #f1f5f9',
    background: 'white', flexShrink: 0,
  },
  qrLabel: {
    fontSize: '10px', color: '#cbd5e1', fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px',
    fontFamily: "'Outfit', sans-serif",
  },
  qrList: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  qrBtn: {
    padding: '5px 12px', borderRadius: '999px', border: '1.5px solid #e2e8f0',
    background: '#f8fafc', color: '#334155', cursor: 'pointer',
    fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap',
    fontFamily: "'Outfit', sans-serif", transition: 'all 0.15s',
  },
  inputWrap: {
    display: 'flex', padding: '12px 14px', gap: '8px',
    borderTop: '1px solid #f1f5f9', background: 'white',
    flexShrink: 0, alignItems: 'center',
    transition: 'opacity 0.3s',
  },
  input: {
    flex: 1, padding: '11px 16px', borderRadius: '999px',
    border: '1.5px solid #e2e8f0', fontSize: '13.5px', outline: 'none',
    color: '#0f172a', fontFamily: "'Outfit', sans-serif",
    transition: 'all 0.2s',
  },
  sendBtn: {
    width: '42px', height: '42px', borderRadius: '50%',
    background: '#0f172a', color: 'white', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(15,23,42,0.25)',
  },
};

export default ChatWidget;