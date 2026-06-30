import '../App.css'

const EXAMPLES = [
  { icon: '🧡', text: '내 응원팀은 다저스야.' },
  { icon: '📊', text: '오늘 경기 결과 어때?' },
  { icon: '📅', text: '다음 경기 언제야?' },
  { icon: '🤾', text: '선발투수가 누구야?' },
]

export default function WelcomeCard({ onExampleClick }) {
  return (
    <div className="welcome-card">
      <div className="welcome-card-header">
        <span className="welcome-card-icon">⚾</span>
        <h2 className="welcome-card-title">MLB Mate에 오신 것을 환영합니다!</h2>
      </div>

      <div className="welcome-card-body">
        <p>
          경기 결과, 다음 경기 일정, <strong>선발투수 정보</strong>를 빠르게 확인할 수 있습니다.
        </p>
        <p style={{ marginTop: '8px' }}>
          먼저 <strong>응원팀을 등록</strong>하면 팀명을 반복해서 입력하지 않아도 됩니다.
        </p>
      </div>

      <div className="welcome-examples">
        {EXAMPLES.map(({ icon, text }) => (
          <button
            key={text}
            className="example-chip"
            onClick={() => onExampleClick(text)}
          >
            <span>{icon}</span>
            <span>{text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
