import { useState, useRef, useEffect } from 'react'
import './App.css'
import WelcomeCard     from './components/WelcomeCard.jsx'
import ChatMessage     from './components/ChatMessage.jsx'
import TypingIndicator from './components/TypingIndicator.jsx'
import ChatInput       from './components/ChatInput.jsx'
import { handleUserMessage } from './chatLogic.js'

function makeMessage(role, text) {
  return { id: Date.now() + Math.random(), role, text, timestamp: new Date() }
}

export default function App() {
  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState('')
  const [isTyping, setIsTyping]   = useState(false)
  // 등록된 응원팀의 MLB teamId (null이면 미등록 상태)
  const [registeredTeamId, setRegisteredTeamId] = useState(null)

  const bottomRef = useRef(null)

  // 메시지나 타이핑 상태가 바뀔 때마다 하단으로 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  function handleExampleClick(text) {
    setInput(text)
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || isTyping) return

    // 1) 사용자 메시지 추가
    setMessages(prev => [...prev, makeMessage('user', text)])
    setInput('')
    setIsTyping(true)

    // 2) 챗봇 로직 실행 (내부에서 MLB Stats API 호출)
    //    실패 시에도 chatLogic/mlbApi가 항상 안전한 문자열을 반환하므로
    //    여기서는 try/catch 없이도 안전하지만, 방어적으로 한 번 더 감쌉니다.
    let reply
    let newTeamId
    try {
      const result = await handleUserMessage(text, registeredTeamId)
      reply = result.reply
      newTeamId = result.newTeamId
    } catch (error) {
      console.error('[App] handleUserMessage 처리 중 오류:', error)
      reply = '현재 해당 정보를 확인할 수 없습니다.'
    }

    if (newTeamId) {
      setRegisteredTeamId(newTeamId)
    }

    setIsTyping(false)
    setMessages(prev => [...prev, makeMessage('ai', reply)])
  }

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <span className="header-logo">⚾</span>
        <h1 className="header-title">MLB<span> Mate</span></h1>
        <span className="header-badge">Beta</span>
      </header>

      {/* ── Chat Window ── */}
      <main className="chat-window">
        <WelcomeCard onExampleClick={handleExampleClick} />

        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={bottomRef} />
      </main>

      {/* ── Input Area ── */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={isTyping}
      />
    </div>
  )
}
