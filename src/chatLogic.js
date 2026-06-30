// src/chatLogic.js
//
// 사용자 입력 텍스트를 분석해 어떤 의도(intent)인지 판단하고,
// 적절한 mlbApi 함수를 호출해 응답 문자열을 만듭니다.
// React 컴포넌트는 이 모듈의 handleUserMessage()만 호출하면 됩니다.
//
// 경기 시간 표기: mlbApi.js가 반환하는 dateTimeKST(한국 시간 기준 포맷 문자열)를
// 그대로 사용합니다. 이 파일에서는 시간대를 직접 다루지 않습니다.

import { getLastGameResult, getNextGameSchedule, FALLBACK_MESSAGE } from './api/mlbApi.js'
import { findTeamId, getTeamNameKo } from './data/teams.js'

const RESULT_KEYWORDS = ['결과', '졌', '이겼', '스코어', '점수']
const SCHEDULE_KEYWORDS = ['다음 경기', '다음경기', '일정', '언제']
const PITCHER_KEYWORDS = ['선발', '선발투수', '투수']
const REGISTER_KEYWORDS = ['응원팀', '내 팀은', '팀은']

function detectIntent(text) {
  if (REGISTER_KEYWORDS.some(k => text.includes(k))) return 'register'
  if (PITCHER_KEYWORDS.some(k => text.includes(k))) return 'pitcher'
  if (SCHEDULE_KEYWORDS.some(k => text.includes(k))) return 'schedule'
  if (RESULT_KEYWORDS.some(k => text.includes(k))) return 'result'

  return 'unknown'
}

function formatResultMessage(teamName, data) {
  if (!data.success) return data.message ?? FALLBACK_MESSAGE

  const vsLabel = data.isHome ? `vs ${data.opponent} (홈)` : `@ ${data.opponent} (원정)`
  const resultLabel = { W: '승리 🎉', L: '패배 😢', T: '무승부' }[data.result] ?? data.result

  return (
    `${teamName} 최근 경기 결과입니다.\n\n` +
    `📅 ${data.dateTimeKST}\n` +
    `${vsLabel}\n` +
    `스코어: ${data.teamScore} : ${data.opponentScore}\n` +
    `결과: ${resultLabel}`
  )
}

function formatScheduleMessage(teamName, data) {
  if (!data.success) return data.message ?? FALLBACK_MESSAGE

  const vsLabel = data.isHome ? `vs ${data.opponent} (홈)` : `@ ${data.opponent} (원정)`

  return (
    `${teamName} 다음 경기 일정입니다.\n\n` +
    `📅 ${data.dateTimeKST}\n` +
    `${vsLabel}\n` +
    `🏟️ ${data.venue}\n` +
    `${teamName} 예상 선발: ${data.myProbablePitcher}\n` +
    `${data.opponent} 예상 선발: ${data.opponentProbablePitcher}`
  )
}

function formatPitcherMessage(teamName, data) {
  if (!data.success) return data.message ?? FALLBACK_MESSAGE

  return (
    `${teamName}의 다음 경기(${data.dateTimeKST}) 예상 선발투수입니다.\n\n` +
    `${teamName}: ${data.myProbablePitcher}\n` +
    `${data.opponent}: ${data.opponentProbablePitcher}`
  )
}

/**
 * 사용자 메시지를 처리해 챗봇 응답 문자열을 반환합니다.
 *
 * @param {string} text - 사용자가 입력한 메시지
 * @param {number|null} registeredTeamId - 등록된 응원팀 ID (없으면 null)
 * @returns {Promise<{ reply: string, newTeamId?: number }>}
 */
export async function handleUserMessage(text, registeredTeamId) {
  const intent = detectIntent(text)

  // 1) 팀 등록 의도 (또는 메시지에 새로운 팀명이 포함된 경우)
  const mentionedTeamId = findTeamId(text)

  if (intent === 'register') {
    if (!mentionedTeamId) {
      return { reply: '팀 이름을 찾지 못했어요. 예) "내 응원팀은 다저스야."' }
    }
    const teamName = getTeamNameKo(mentionedTeamId)
    return {
      reply: `${teamName}을(를) 응원팀으로 등록했어요! 이제 "오늘 경기 어때?"처럼 간단히 물어보세요 ⚾`,
      newTeamId: mentionedTeamId,
    }
  }

  // 2) 결과/일정/투수 질문 처리 — 메시지에 팀명이 있으면 그 팀, 없으면 등록된 팀 사용
  const teamId = mentionedTeamId ?? registeredTeamId

  if (intent === 'result' || intent === 'schedule' || intent === 'pitcher') {
    if (!teamId) {
      return {
        reply:
          '어느 팀인지 알 수 없어요. 응원팀을 먼저 등록하거나, ' +
          '"다저스 경기 결과 어때?"처럼 팀명을 함께 입력해 주세요.',
      }
    }

    const teamName = getTeamNameKo(teamId)
    // 등록된 팀과 다른 팀을 언급한 경우에도 등록 정보는 그대로 유지합니다.
    const newTeamId = mentionedTeamId && !registeredTeamId ? mentionedTeamId : undefined

    if (intent === 'result') {
      const data = await getLastGameResult(teamId)
      return { reply: formatResultMessage(teamName, data), newTeamId }
    }

    if (intent === 'schedule') {
      const data = await getNextGameSchedule(teamId)
      return { reply: formatScheduleMessage(teamName, data), newTeamId }
    }

    if (intent === 'pitcher') {
      const data = await getNextGameSchedule(teamId)
      return { reply: formatPitcherMessage(teamName, data), newTeamId }
    }
  }

  // 3) 알 수 없는 의도
  return {
    reply:
      '이해하지 못했어요. 예시처럼 물어봐 주세요.\n' +
      '예) "오늘 경기 결과 어때?", "다음 경기 언제야?", "선발투수가 누구야?"',
  }
}
