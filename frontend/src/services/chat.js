const RASA_URL = 'https://daren-plumular-monet.ngrok-free.dev';

const getSessionId = () => {
  // genereaza session_id nou la fiecare incarcare a paginii
  if (!window._rasaSessionId) {
    window._rasaSessionId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }
  return window._rasaSessionId;
};

export const connectToRasa = (onMessage) => {
  // REST nu are conexiune persistenta — returnam un obiect mock
  console.log('Rasa REST mode activ');
  return {
    disconnect: () => {},
    on: () => {},
  };
};

export const sendMessage = async (text, onMessage) => {
  const sessionId = getSessionId();
  try {
    const response = await fetch(`${RASA_URL}/webhooks/rest/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: sessionId,
        message: text,
      }),
    });

    const messages = await response.json();
    messages.forEach(msg => {
      if (msg.text) {
        onMessage({ text: msg.text, sender: 'bot' });
      }
    });
  } catch (err) {
    console.error('Eroare Rasa:', err);
    onMessage({
      text: 'Conexiunea cu asistentul a eșuat. Verificați că serverul Rasa rulează.',
      sender: 'bot'
    });
  }
};