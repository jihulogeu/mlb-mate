// src/utils/dateFormat.js
//
// MLB Stats API는 모든 시각을 UTC ISO 문자열(예: "2026-07-01T15:10:00Z")로 내려줍니다.
// 이 모듈은 그 값을 한국 시간(Asia/Seoul, KST)으로 변환해
// "YYYY년 M월 D일(요일) 오전/오후 H:MM (KST)" 형식의 문자열로 만들어 줍니다.
//
// 프로젝트 내에서 경기 시간을 표시하는 모든 곳은 이 유틸을 사용해야 합니다.

/**
 * UTC ISO 문자열 또는 Date 객체를 한국 시간(KST) 기준
 * "2026년 7월 1일(수) 오전 11:10 (KST)" 형식 문자열로 변환합니다.
 *
 * @param {string|Date} dateInput - API에서 받은 UTC 시각 문자열(예: gameDate) 또는 Date 객체
 * @returns {string} KST 기준으로 포맷된 문자열. 입력이 유효하지 않으면 빈 문자열을 반환합니다.
 */
export function formatToKST(dateInput) {
  if (!dateInput) return ''

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (Number.isNaN(date.getTime())) return ''

  // Intl.DateTimeFormat으로 Asia/Seoul 기준 각 구성요소를 24시간제로 추출한 뒤
  // 오전/오후 및 12시간제 표기는 직접 계산합니다.
  // (dayPeriod 필드는 일부 런타임에서 누락되거나 형식이 달라질 수 있어 직접 계산이 더 안전합니다.)
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short', // ko-KR 로케일에서 보통 "수" 형태로 반환됨
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const get = type => parts.find(p => p.type === type)?.value ?? ''

  const year = get('year')
  const month = get('month')
  const day = get('day')
  // ko-KR weekday는 환경에 따라 "수" 또는 "수요일"로 나올 수 있어 "요일" 접미사를 제거해 통일합니다.
  const weekday = get('weekday').replace('요일', '')

  // hour: hour12=false 설정 시 자정은 환경에 따라 "0" 또는 "24"로 나올 수 있어 모듈로 연산으로 정규화합니다.
  const hour24 = parseInt(get('hour'), 10) % 24
  const minute = get('minute')

  const dayPeriod = hour24 < 12 ? '오전' : '오후'
  let hour12 = hour24 % 12
  if (hour12 === 0) hour12 = 12

  return `${year}년 ${month}월 ${day}일(${weekday}) ${dayPeriod} ${hour12}:${minute} (KST)`
}
