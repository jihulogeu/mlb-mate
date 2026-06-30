// src/api/mlbApi.js
//
// MLB Stats API (공식, 무료, 인증 불필요) 호출 전용 모듈입니다.
// 이 파일은 순수하게 "데이터를 가져오고 가공"하는 역할만 하며,
// React 컴포넌트는 이 모듈이 내보내는 함수만 호출합니다.
//
// 참고: https://statsapi.mlb.com (비공식 문서: MLB-StatsAPI 위키)
//
// 시간대 처리:
// MLB Stats API가 내려주는 gameDate는 UTC ISO 문자열입니다.
// 이 모듈에서는 그 값을 Date 객체로 변환한 뒤, utils/dateFormat.js의
// formatToKST()를 통해 한국 시간(Asia/Seoul, KST)으로 통일해서 반환합니다.
// (프로젝트 내에서 경기 시간을 표시하는 곳은 모두 이 경로를 거칩니다.)

import { formatToKST } from '../utils/dateFormat'

const BASE_URL = 'https://statsapi.mlb.com/api/v1'

// 모든 API 호출 실패 시 통일된 사용자 메시지
export const FALLBACK_MESSAGE = '현재 해당 정보를 확인할 수 없습니다.'

/**
 * 내부 공통 fetch 헬퍼.
 * 네트워크 오류, HTTP 오류, JSON 파싱 오류를 모두 동일하게 처리합니다.
 */
async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`MLB API 응답 오류: ${response.status}`)
  }
  return response.json()
}

/**
 * 날짜 객체를 'YYYY-MM-DD' 문자열로 변환합니다.
 */
function toDateString(date) {
  return date.toISOString().slice(0, 10)
}

/**
 * 경기 상태 코드를 한글 설명으로 변환합니다.
 */
function formatGameStatus(statusCode) {
  const map = {
    F: '경기 종료',
    O: '경기 종료 (연장)',
    S: '예정',
    P: '경기 전',
    I: '경기 진행 중',
    D: '경기 지연',
    C: '경기 취소',
  }
  return map[statusCode] || statusCode
}

/**
 * 특정 팀의 가장 최근(완료된) 경기 결과를 조회합니다.
 *
 * @param {number} teamId - MLB teamId (예: 다저스 = 119)
 * @returns {Promise<{
 *   success: boolean,
 *   message?: string,           // 실패 시 표시할 메시지
 *   date?: string,
 *   dateTimeKST?: string,       // 경기 시작 시각, "2026년 7월 1일(수) 오전 11:10 (KST)" 형식
 *   opponent?: string,
 *   isHome?: boolean,
 *   teamScore?: number,
 *   opponentScore?: number,
 *   result?: 'W'|'L'|'T',
 *   status?: string,
 * }>}
 */
export async function getLastGameResult(teamId) {
  try {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 14) // 최근 2주 범위에서 탐색

    const url =
      `${BASE_URL}/schedule` +
      `?sportId=1&teamId=${teamId}` +
      `&startDate=${toDateString(startDate)}` +
      `&endDate=${toDateString(today)}` +
      `&hydrate=team,linescore,decisions`

    const data = await fetchJson(url)
    const dates = data?.dates ?? []

    // 모든 날짜의 게임을 펼친 뒤, 완료(Final)된 가장 마지막 경기를 찾습니다.
    const allGames = dates.flatMap(d => d.games ?? [])
    const finishedGames = allGames.filter(g => g.status?.abstractGameCode === 'F')

    if (finishedGames.length === 0) {
      return { success: false, message: FALLBACK_MESSAGE }
    }

    // 가장 최근 경기 (gameDate 기준 내림차순)
    const lastGame = finishedGames.sort(
      (a, b) => new Date(b.gameDate) - new Date(a.gameDate)
    )[0]

    const isHome = lastGame.teams?.home?.team?.id === teamId
    const myTeam = isHome ? lastGame.teams.home : lastGame.teams.away
    const oppTeam = isHome ? lastGame.teams.away : lastGame.teams.home

    const teamScore = myTeam?.score
    const opponentScore = oppTeam?.score

    let result = 'T'
    if (typeof teamScore === 'number' && typeof opponentScore === 'number') {
      result = teamScore > opponentScore ? 'W' : teamScore < opponentScore ? 'L' : 'T'
    }

    // API가 내려준 UTC 시각(gameDate) → Date 객체 → KST 포맷 문자열
    const gameDateUTC = new Date(lastGame.gameDate)

    return {
      success: true,
      date: lastGame.officialDate ?? lastGame.gameDate?.slice(0, 10),
      dateTimeKST: formatToKST(gameDateUTC),
      opponent: oppTeam?.team?.name,
      isHome,
      teamScore,
      opponentScore,
      result,
      status: formatGameStatus(lastGame.status?.codedGameState),
    }
  } catch (error) {
    console.error('[mlbApi] getLastGameResult 실패:', error)
    return { success: false, message: FALLBACK_MESSAGE }
  }
}

/**
 * 특정 팀의 다음 경기 일정과 예상 선발투수를 조회합니다.
 *
 * @param {number} teamId - MLB teamId
 * @returns {Promise<{
 *   success: boolean,
 *   message?: string,
 *   date?: string,
 *   dateTimeKST?: string,       // 경기 시작 시각, "2026년 7월 1일(수) 오전 11:10 (KST)" 형식
 *   opponent?: string,
 *   isHome?: boolean,
 *   venue?: string,
 *   myProbablePitcher?: string,
 *   opponentProbablePitcher?: string,
 * }>}
 */
export async function getNextGameSchedule(teamId) {
  try {
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 14) // 향후 2주 범위에서 탐색

    const url =
      `${BASE_URL}/schedule` +
      `?sportId=1&teamId=${teamId}` +
      `&startDate=${toDateString(today)}` +
      `&endDate=${toDateString(endDate)}` +
      `&hydrate=team,probablePitcher,venue`

    const data = await fetchJson(url)
    const dates = data?.dates ?? []
    const allGames = dates.flatMap(d => d.games ?? [])

    // 아직 시작하지 않은 경기 중 가장 빠른 경기
    const upcomingGames = allGames.filter(
      g => g.status?.abstractGameCode === 'P' || g.status?.abstractGameCode === 'S'
    )

    if (upcomingGames.length === 0) {
      return { success: false, message: FALLBACK_MESSAGE }
    }

    const nextGame = upcomingGames.sort(
      (a, b) => new Date(a.gameDate) - new Date(b.gameDate)
    )[0]

    const isHome = nextGame.teams?.home?.team?.id === teamId
    const myTeam = isHome ? nextGame.teams.home : nextGame.teams.away
    const oppTeam = isHome ? nextGame.teams.away : nextGame.teams.home

    // API가 내려준 UTC 시각(gameDate) → Date 객체 → KST 포맷 문자열
    const gameDateUTC = new Date(nextGame.gameDate)

    return {
      success: true,
      date: nextGame.officialDate ?? nextGame.gameDate?.slice(0, 10),
      dateTimeKST: formatToKST(gameDateUTC),
      opponent: oppTeam?.team?.name,
      isHome,
      venue: nextGame.venue?.name,
      myProbablePitcher: myTeam?.probablePitcher?.fullName ?? '미발표',
      opponentProbablePitcher: oppTeam?.probablePitcher?.fullName ?? '미발표',
    }
  } catch (error) {
    console.error('[mlbApi] getNextGameSchedule 실패:', error)
    return { success: false, message: FALLBACK_MESSAGE }
  }
}
