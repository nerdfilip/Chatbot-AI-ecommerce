// ════════════════════════════════════════════════════════════
// FILE 1: src/components/ChatWidget.jsx
// ════════════════════════════════════════════════════════════
// SAVE AS: frontend/src/components/ChatWidget.jsx

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
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleSend = (text, fromQuickReply = false) => {
    const messageText = text || input.trim();
    if (!messageText) return;
    if (fromQuickReply) setShowReplies(false);
    setMessages(prev => [...prev, {
      text: messageText, sender: 'user',
      time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
    }]);
    setInput('');
    setTyping(true);
    sendMessage(messageText, (msg) => {
      setTyping(false);

      const isTransfer = msg.text && (
        msg.text.includes('transfer') ||
        msg.text.includes('agent') ||
        msg.text.includes('operator')
      );

      if (isTransfer) {
        // adauga mesaj de status INAINTE de mesajul real
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
        setMessages(prev => [...prev, {
          ...msg,
          time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    });
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // dimensiuni responsive
  const isMobile = window.innerWidth <= 480;
  const windowStyle = isMobile
    ? { ...styles.window, width: '100vw', height: '100vh', bottom: 0, right: 0, borderRadius: 0 }
    : styles.window;

  return (
    <>
      {/* FAB — doar bulina verde, fara emoji */}
      {!open && (
        <button onClick={() => setOpen(true)} style={styles.fab} aria-label="Deschide chat">
          <span style={styles.fabIcon}>💬</span>
          <span style={styles.onlineDot}></span>
        </button>
      )}

      {open && (
        <div style={windowStyle}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.avatar}>A</div>
              <div>
                <div style={styles.headerName}>Asisto</div>
                <div style={styles.headerStatus}>
                  <span style={styles.statusDotGreen}></span>
                  Online
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={styles.closeBtn}>✕</button>
          </div>

          {/* Mesaje */}
          <div style={styles.messages}>
            {messages.map((msg, i) => (
              <div key={i} style={{ ...styles.msgRow, justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.sender === 'bot' && <div style={styles.botAvatar}>A</div>}
                <div style={{
                  ...styles.bubble,
                  ...(msg.sender === 'user' ? styles.userBubble :
                      msg.isTransfer ? styles.transferBubble : styles.botBubble)
                }}>
                  <span style={{ whiteSpace: 'pre-line' }}>{msg.text}</span>
                  <span style={styles.time}>{msg.time}</span>
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ ...styles.msgRow, justifyContent: 'flex-start' }}>
                <div style={styles.botAvatar}>A</div>
                <div style={{ ...styles.bubble, ...styles.botBubble }}>
                  <span style={styles.typingDots}>● ● ●</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {showReplies && (
            <div style={styles.quickReplies}>
              {QUICK_REPLIES.map((qr, i) => (
                <button key={i} onClick={() => handleSend(qr.text, true)} style={styles.qrBtn}>
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
              style={{ ...styles.sendBtn, opacity: input.trim() ? 1 : 0.5 }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  fab: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '52px',
    height: '52px',
    background: '#1a56db',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(26,86,219,0.45)',
    zIndex: 1000,
  },
  fabIcon: {
    fontSize: '22px',
    lineHeight: 1,
  },
  transferBubble: {
  background: '#fef3c7',
  color: '#92400e',
  borderBottomLeftRadius: '4px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  animation: 'pulse 1.5s ease-in-out infinite',
  },
  onlineDot: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#22c55e',
    border: '2px solid white',
  },
  window: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '360px',
    height: '560px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    overflow: 'hidden',
  },
  header: {
    background: '#1a56db',
    padding: '14px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontWeight: '700', fontSize: '16px',
  },
  headerName: { color: 'white', fontWeight: '700', fontSize: '15px' },
  headerStatus: {
    color: 'rgba(255,255,255,0.85)', fontSize: '12px',
    display: 'flex', alignItems: 'center', gap: '5px',
  },
  statusDotGreen: {
    width: '7px', height: '7px', borderRadius: '50%',
    background: '#22c55e', display: 'inline-block',
    boxShadow: '0 0 0 2px rgba(34,197,94,0.3)',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
    cursor: 'pointer', borderRadius: '50%', width: '28px', height: '28px',
    fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  messages: {
    flex: 1, overflowY: 'auto', padding: '16px',
    display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc',
  },
  msgRow: { display: 'flex', alignItems: 'flex-end', gap: '8px' },
  botAvatar: {
    width: '28px', height: '28px', borderRadius: '50%', background: '#1a56db',
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: '700', flexShrink: 0,
  },
  bubble: {
    maxWidth: '75%', padding: '10px 14px', borderRadius: '16px',
    fontSize: '14px', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '4px',
  },
  botBubble: {
    background: 'white', color: '#111827', borderBottomLeftRadius: '4px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  userBubble: { background: '#1a56db', color: 'white', borderBottomRightRadius: '4px' },
  time: { fontSize: '11px', opacity: 0.6, alignSelf: 'flex-end' },
  typingDots: { fontSize: '14px', color: '#9ca3af', letterSpacing: '2px' },
  quickReplies: {
    padding: '8px 12px', display: 'flex', gap: '6px', flexWrap: 'wrap',
    borderTop: '1px solid #e5e7eb', background: 'white', flexShrink: 0,
  },
  qrBtn: {
    padding: '5px 10px', borderRadius: '12px', border: '1px solid #dbeafe',
    background: '#eff6ff', color: '#1a56db', cursor: 'pointer',
    fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap',
  },
  inputArea: {
    display: 'flex', padding: '12px', gap: '8px',
    borderTop: '1px solid #e5e7eb', background: 'white', flexShrink: 0,
  },
  input: {
    flex: 1, padding: '10px 14px', borderRadius: '20px',
    border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none',
  },
  sendBtn: {
    width: '40px', height: '40px', borderRadius: '50%', background: '#1a56db',
    color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};

export default ChatWidget;