export default function TypingIndicator() {
  return (
    <div className="message-group ai">
      <div className="message-meta">
        <div className="message-avatar ai-avatar">M</div>
        <span>MLB Mate</span>
      </div>
      <div className="typing-indicator">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  )
}
