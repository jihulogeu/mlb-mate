import '../App.css'

function formatTime(date) {
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'
  const isAI   = message.role === 'ai'

  return (
    <div className={`message-group ${isUser ? 'user' : 'ai'}`}>
      {isAI && (
        <div className="message-meta">
          <div className="message-avatar ai-avatar">M</div>
          <span>MLB Mate</span>
          <span>·</span>
          <span>{formatTime(message.timestamp)}</span>
        </div>
      )}

      <div className={`bubble ${isUser ? 'user' : 'ai'}`}>
        {message.text}
      </div>

      {isUser && (
        <div className="message-meta">
          <span>{formatTime(message.timestamp)}</span>
          <div className="message-avatar user-avatar">나</div>
        </div>
      )}
    </div>
  )
}
