import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sendMessage } from '../services/chat';

const QR = [
  { label: '📦 Statusul comenzii', text: 'Unde este comanda mea?' },
  { label: '🔄 Retur produs',      text: 'Vreau sa returnez un produs' },
  { label: '❌ Anulez comanda',    text: 'Vreau sa anulez o comanda' },
  { label: '🔧 Garanție',          text: 'Informatii despre garantie' },
  { label: '💳 Problemă plată',    text: 'Am o problema cu plata' },
  { label: '🚚 Livrare',           text: 'Am o problema cu livrarea' },
];

const TypingDots = () => (
  <div style={S.typingWrap}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{ ...S.dot, animationDelay: `${i * 160}ms` }} />
    ))}
  </div>
);

const AgentWaiting = () => (
  <div style={S.waitingWrap}>
    <span style={S.waitingText}>🔄 Se conectează la un agent uman</span>
    <span style={S.waitingDotsWrap} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ ...S.waitingDot, animationDelay: `${i * 180}ms` }} />
      ))}
    </span>
  </div>
);

const ESCALATE_TEXT = 'Va transfer catre un agent uman';

const ChatWidget = () => {
  const [open, setOpen]             = useState(false);
  const [messages, setMessages]     = useState([{
    id: 0,
    text: 'Bună ziua! Sunt Asisto, asistentul virtual FilipShop. Cu ce vă pot ajuta astăzi?',
    sender: 'bot',
    time: now(),
  }]);
  const [input, setInput]     = useState('');
  const [typing, setTyping]   = useState(false);
  const [showQR, setShowQR]   = useState(true);
  const [locked, setLocked] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const idRef     = useRef(1);

  function now() {
    return new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  }

  function nextId() { return idRef.current++; }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

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
      const isTransfer = (msg.text || '').toLowerCase().includes(ESCALATE_TEXT.toLowerCase());

      if (isTransfer) {
        setLocked(true);
        setShowQR(false);
        setMessages(prev => [
          ...prev,
          { id: nextId(), text: '🔄 Se conectează la un agent uman...', sender: 'bot', isTransfer: true, isTransferWaiting: true, time: now() },
          { id: nextId(), ...msg, time: now() },
        ]);
      } else {
        pushMsg({ ...msg, sender: 'bot' });
      }
    });
  }, [input, locked, pushMsg]);

  const handleKey = (e) => {
    if (locked) return;
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
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

      {/* Window */}
      {open && (
        <div style={windowStyle}>
          {/* Header */}
          <div style={S.header}>
            <div style={S.hLeft}>
              <div style={S.hAvatar}>A</div>
              <div>
                <div style={S.hName}>Asisto</div>
                <div style={S.hStatus}>
                  <span style={S.hDot} />
                  Online acum
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={S.closeBtn} aria-label="Închide">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={S.msgs}>
            {messages.map((msg) => (
              <div key={msg.id} style={{
                ...S.row,
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              }}>
                {msg.sender === 'bot' && <div style={S.botAv}>A</div>}
                <div style={{
                  ...S.bubble,
                  ...(msg.sender === 'user' ? S.userB
                    : msg.isTransfer ? S.transferB
                    : S.botB),
                }}>
                  {msg.isTransferWaiting ? (
                    <AgentWaiting />
                  ) : (
                    <span style={{ whiteSpace: 'pre-line', lineHeight: 1.55 }}>{msg.text}</span>
                  )}
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

          {/* Quick replies */}
          {showQR && !locked && (
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

          {locked && (
            <div style={S.lockBanner}>🔄 Agent uman preluat — chat blocat</div>
          )}

          {/* Input */}
          <div style={S.inputWrap}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Scrieți un mesaj..."
              disabled={locked}
              style={S.input}
            />
            <button
              onClick={() => handleSend()}
              disabled={locked || !input.trim()}
              style={{ ...S.sendBtn, opacity: (locked || !input.trim()) ? 0.4 : 1 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4 20-7z" /><path d="M22 2 11 13" />
              </svg>
            </button>
          </div>
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
        @keyframes shimmer {
          0%   { background-position:-400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes pulseAgent {
          0%, 100% { opacity: 0.75; }
          50%      { opacity: 1; }
        }
        @keyframes dotWave {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40%           { transform: translateY(-3px); opacity: 1; }
        }
        @keyframes lockPulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }
      `}</style>
    </>
  );
};

const S = {
  fab: {
    position: 'fixed',
    bottom: '28px',
    right: '28px',
    width: '54px',
    height: '54px',
    background: '#0f172a',
    border: 'none',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(15,23,42,0.35)',
    zIndex: 1000,
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  fabDot: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '11px',
    height: '11px',
    borderRadius: '50%',
    background: '#22c55e',
    border: '2px solid white',
  },
  window: {
    position: 'fixed',
    bottom: '28px',
    right: '28px',
    width: '364px',
    height: '580px',
    background: 'white',
    borderRadius: '22px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    overflow: 'hidden',
    animation: 'chatPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
  },
  header: {
    background: '#0f172a',
    padding: '16px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  hLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  hAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)',
    border: '2px solid rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '700',
    fontSize: '16px',
    fontFamily: "'Outfit', sans-serif",
  },
  hName: {
    color: 'white',
    fontWeight: '700',
    fontSize: '15px',
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: '-0.2px',
  },
  hStatus: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontFamily: "'Outfit', sans-serif",
  },
  hDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#22c55e',
    boxShadow: '0 0 0 2px rgba(34,197,94,0.3)',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: 'rgba(255,255,255,0.8)',
    cursor: 'pointer',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
  },
  msgs: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    background: '#fafbfc',
    scrollBehavior: 'smooth',
  },
  row: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    animation: 'msgIn 0.25s ease both',
  },
  botAv: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#0f172a',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    flexShrink: 0,
    fontFamily: "'Outfit', sans-serif",
  },
  bubble: {
    maxWidth: '78%',
    padding: '10px 14px',
    borderRadius: '16px',
    fontSize: '13.5px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontFamily: "'Outfit', sans-serif",
  },
  botB: {
    background: 'white',
    color: '#0f172a',
    borderBottomLeftRadius: '4px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9',
    lineHeight: '1.55',
  },
  userB: {
    background: '#0f172a',
    color: 'white',
    borderBottomRightRadius: '4px',
    lineHeight: '1.55',
  },
  transferB: {
    background: '#fffbeb',
    color: '#92400e',
    border: '1px solid #fde68a',
    borderBottomLeftRadius: '4px',
    lineHeight: '1.55',
  },
  ts: {
    fontSize: '10px',
    opacity: 0.45,
    alignSelf: 'flex-end',
    marginTop: '2px',
  },
  typingWrap: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    height: '18px',
    padding: '2px 0',
  },
  dot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#94a3b8',
    display: 'inline-block',
    animation: 'bounce 1.2s ease infinite',
  },
  waitingWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  waitingText: {
    whiteSpace: 'pre-line',
    lineHeight: 1.55,
    fontWeight: '600',
    animation: 'pulseAgent 1.4s ease-in-out infinite',
  },
  waitingDotsWrap: {
    display: 'inline-flex',
    gap: '3px',
    alignItems: 'center',
    transform: 'translateY(1px)',
  },
  waitingDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: '#92400e',
    display: 'inline-block',
    animation: 'dotWave 1.1s ease-in-out infinite',
  },
  qrWrap: {
    padding: '10px 14px',
    borderTop: '1px solid #f1f5f9',
    background: 'white',
    flexShrink: 0,
  },
  qrLabel: {
    fontSize: '10px',
    color: '#cbd5e1',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: '8px',
    fontFamily: "'Outfit', sans-serif",
  },
  qrList: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  qrBtn: {
    padding: '5px 12px',
    borderRadius: '999px',
    border: '1.5px solid #e2e8f0',
    background: '#f8fafc',
    color: '#334155',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    fontFamily: "'Outfit', sans-serif",
    transition: 'all 0.15s',
  },
  lockBanner: {
    margin: '0 14px 8px',
    background: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fde68a',
    padding: '8px 14px',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '13px',
    animation: 'lockPulse 1.4s ease-in-out infinite',
    fontFamily: "'Outfit', sans-serif",
  },
  inputWrap: {
    display: 'flex',
    padding: '12px 14px',
    gap: '8px',
    borderTop: '1px solid #f1f5f9',
    background: 'white',
    flexShrink: 0,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '11px 16px',
    borderRadius: '999px',
    border: '1.5px solid #e2e8f0',
    fontSize: '13.5px',
    outline: 'none',
    background: '#fafbfc',
    color: '#0f172a',
    fontFamily: "'Outfit', sans-serif",
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  sendBtn: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: '#0f172a',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(15,23,42,0.25)',
  },
};

export default ChatWidget;