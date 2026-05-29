import React, { useState, useEffect, useRef } from 'react';
import { sendMessage } from '../services/chat';

const QUICK_REPLIES = [
  { label: '📦 Statusul comenzii', text: 'Unde este comanda mea?' },
  { label: '🔄 Retur produs',      text: 'Vreau sa returnez un produs' },
  { label: '❌ Anulez comanda',    text: 'Vreau sa anulez o comanda' },
  { label: '🔧 Garantie',          text: 'Informatii despre garantie' },
  { label: '💳 Problema plata',    text: 'Am o problema cu plata' },
  { label: '🚚 Problema livrare',  text: 'Am o problema cu livrarea' },
];

const ChatWidget = () => {
  const [open, setOpen]             = useState(false);
  const [messages, setMessages]     = useState([{
    text: 'Buna ziua! Sunt Asisto, asistentul virtual al magazinului FilipShop. Cu ce va pot ajuta?',
    sender: 'bot',
    time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
  }]);
  const [input, setInput]           = useState('');
  const [typing, setTyping]         = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const addMessage = (msg) => {
    setMessages(prev => [...prev, {
      ...msg,
      time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
    }]);
  };

  const handleSend = (text, fromQR = false) => {
    const txt = text || input.trim();
    if (!txt) return;
    if (fromQR) setShowReplies(false);

    addMessage({ text: txt, sender: 'user' });
    setInput('');
    setTyping(true);

    sendMessage(txt, (msg) => {
      setTyping(false);
      const isTransfer = msg.text && (
        msg.text.includes('transfer') || msg.text.includes('agent') || msg.text.includes('operator')
      );

      if (isTransfer) {
        setMessages(prev => [
          ...prev,
          {
            text: '🔄 În curs de transfer...',
            sender: 'bot',
            isTransfer: true,
            time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
          },
          {
            ...msg,
            time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      } else {
        addMessage(msg);
      }
    });
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Detecteaza mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 520;

  const windowStyle = isMobile
    ? {
        ...styles.window,
        width: '100vw',
        height: '100dvh',
        bottom: 0,
        right: 0,
        left: 0,
        borderRadius: 0,
        maxHeight: 'none',
      }
    : styles.window;

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={styles.fab}
          aria-label="Deschide chat"
        >
          <span style={{ fontSize: '22px', lineHeight: 1 }}>💬</span>
          <span style={styles.onlineDot} />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div style={windowStyle}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.avatar}>A</div>
              <div>
                <div style={styles.headerName}>Asisto</div>
                <div style={styles.headerStatus}>
                  <span style={styles.statusDot} />
                  Online
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={styles.closeBtn} aria-label="Inchide">
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={styles.messages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  ...styles.msgRow,
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  animation: 'slideUp 0.25s ease both',
                }}
              >
                {msg.sender === 'bot' && <div style={styles.botAvatar}>A</div>}
                <div style={{
                  ...styles.bubble,
                  ...(msg.sender === 'user'
                    ? styles.userBubble
                    : msg.isTransfer
                    ? styles.transferBubble
                    : styles.botBubble)
                }}>
                  <span style={{ whiteSpace: 'pre-line', lineHeight: '1.55' }}>{msg.text}</span>
                  <span style={styles.time}>{msg.time}</span>
                </div>
              </div>
            ))}

            {typing && (
              <div style={{ ...styles.msgRow, justifyContent: 'flex-start' }}>
                <div style={styles.botAvatar}>A</div>
                <div style={{ ...styles.bubble, ...styles.botBubble, padding: '12px 16px' }}>
                  <div style={styles.typingDots}>
                    <span style={{ animationDelay: '0ms' }} />
                    <span style={{ animationDelay: '160ms' }} />
                    <span style={{ animationDelay: '320ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {showReplies && (
            <div style={styles.quickReplies}>
              {QUICK_REPLIES.map((qr, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(qr.text, true)}
                  style={styles.qrBtn}
                >
                  {qr.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={styles.inputArea}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Scrieti un mesaj..."
              style={styles.input}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              style={{
                ...styles.sendBtn,
                opacity: input.trim() ? 1 : 0.45,
                transform: input.trim() ? 'scale(1)' : 'scale(0.95)',
              }}
              aria-label="Trimite"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes chatOpen {
          from { opacity: 0; transform: scale(0.88) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
};

const styles = {
  fab: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '54px',
    height: '54px',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(37,99,235,0.45), 0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 1000,
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  onlineDot: {
    position: 'absolute',
    top: '5px',
    right: '5px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#22c55e',
    border: '2px solid white',
    boxShadow: '0 0 0 2px rgba(34,197,94,0.3)',
  },
  window: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '360px',
    maxHeight: '600px',
    height: '600px',
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    overflow: 'hidden',
    animation: 'chatOpen 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both',
  },
  header: {
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    padding: '14px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.22)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '700',
    fontSize: '16px',
    fontFamily: "'DM Sans', sans-serif",
    border: '2px solid rgba(255,255,255,0.3)',
  },
  headerName: {
    color: 'white',
    fontWeight: '700',
    fontSize: '15px',
    fontFamily: "'DM Sans', sans-serif",
  },
  headerStatus: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontFamily: "'DM Sans', sans-serif",
  },
  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#22c55e',
    boxShadow: '0 0 0 2px rgba(34,197,94,0.4)',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.18)',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    background: '#f8fafc',
    scrollBehavior: 'smooth',
  },
  msgRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
  },
  botAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    flexShrink: 0,
    fontFamily: "'DM Sans', sans-serif",
  },
  bubble: {
    maxWidth: '78%',
    padding: '10px 14px',
    borderRadius: '16px',
    fontSize: '13.5px',
    lineHeight: '1.5',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontFamily: "'DM Sans', sans-serif",
  },
  botBubble: {
    background: 'white',
    color: '#0f172a',
    borderBottomLeftRadius: '4px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    border: '1px solid #f1f5f9',
  },
  userBubble: {
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: 'white',
    borderBottomRightRadius: '4px',
  },
  transferBubble: {
    background: '#fef3c7',
    color: '#92400e',
    borderBottomLeftRadius: '4px',
    border: '1px solid #fde68a',
    animation: 'pulse 1.5s ease infinite',
  },
  time: {
    fontSize: '10px',
    opacity: 0.55,
    alignSelf: 'flex-end',
    marginTop: '2px',
  },
  typingDots: {
    display: 'flex',
    gap: '5px',
    alignItems: 'center',
    height: '16px',
  },
  quickReplies: {
    padding: '8px 12px',
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    borderTop: '1px solid #f1f5f9',
    background: 'white',
    flexShrink: 0,
  },
  qrBtn: {
    padding: '5px 11px',
    borderRadius: '14px',
    border: '1.5px solid #dbeafe',
    background: '#eff6ff',
    color: '#2563eb',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.15s',
  },
  inputArea: {
    display: 'flex',
    padding: '12px',
    gap: '8px',
    borderTop: '1px solid #f1f5f9',
    background: 'white',
    flexShrink: 0,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '24px',
    border: '1.5px solid #e2e8f0',
    fontSize: '13.5px',
    outline: 'none',
    background: '#f8fafc',
    color: '#0f172a',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.2s',
  },
  sendBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
  },
};

export default ChatWidget;