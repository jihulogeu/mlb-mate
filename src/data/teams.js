// MLB 30개 구단의 한글/영문 별칭 → MLB teamId 매핑
// teamId는 MLB Stats API의 고정 식별자입니다 (예: 다저스 = 119)
export const TEAM_ALIASES = {
  // AL East
  '오리올스':        110, 'orioles':        110, 'baltimore':      110,
  '레드삭스':        111, 'redsox':         111, 'red sox':        111, 'boston':       111,
  '양키스':          147, 'yankees':        147, 'new york yankees': 147,
  '레이스':          139, 'rays':           139, 'tampa bay':      139,
  '블루제이스':      141, 'bluejays':       141, 'blue jays':      141, 'toronto':      141,

  // AL Central
  '화이트삭스':      145, 'whitesox':       145, 'white sox':      145, 'chicago white sox': 145,
  '가디언즈':        114, 'guardians':      114, 'cleveland':      114,
  '타이거즈':        116, 'tigers':         116, 'detroit':        116,
  '로열스':          118, 'royals':         118, 'kansas city':    118,
  '트윈스':          142, 'twins':          142, 'minnesota':      142,

  // AL West
  '애스트로스':      117, 'astros':         117, 'houston':        117,
  '에인절스':        108, 'angels':         108, 'los angeles angels': 108,
  '애슬레틱스':      133, 'athletics':      133, 'oakland':        133,
  '매리너스':        136, 'mariners':       136, 'seattle':        136,
  '레인저스':        140, 'rangers':        140, 'texas':          140,

  // NL East
  '브레이브스':      144, 'braves':         144, 'atlanta':        144,
  '마린스':          146, 'marlins':        146, 'miami':          146,
  '메츠':            121, 'mets':           121, 'new york mets':  121,
  '필리스':          143, 'phillies':       143, 'philadelphia':   143,
  '내셔널스':        120, 'nationals':      120, 'washington':     120,

  // NL Central
  '컵스':            112, 'cubs':           112, 'chicago cubs':   112,
  '레즈':            113, 'reds':           113, 'cincinnati':     113,
  '브루어스':        158, 'brewers':        158, 'milwaukee':      158,
  '파이어리츠':      134, 'pirates':        134, 'pittsburgh':     134,
  '카디널스':        138, 'cardinals':      138, 'st louis':       138, 'st. louis':    138,

  // NL West
  '다이아몬드백스':  109, 'diamondbacks':   109, 'arizona':        109, 'd-backs':      109,
  '다저스':          119, 'dodgers':        119, 'los angeles dodgers': 119, 'la dodgers': 119,
  '자이언츠':        137, 'giants':         137, 'san francisco':  137,
  '파드리스':        135, 'padres':         135, 'san diego':      135,
  '로키스':          115, 'rockies':        115, 'colorado':       115,
}

// 팀 ID → 한글 표시명 (응답 메시지용)
export const TEAM_NAMES_KO = {
  110: '오리올스', 111: '레드삭스', 147: '양키스', 139: '레이스', 141: '블루제이스',
  145: '화이트삭스', 114: '가디언즈', 116: '타이거즈', 118: '로열스', 142: '트윈스',
  117: '애스트로스', 108: '에인절스', 133: '애슬레틱스', 136: '매리너스', 140: '레인저스',
  144: '브레이브스', 146: '마린스', 121: '메츠', 143: '필리스', 120: '내셔널스',
  112: '컵스', 113: '레즈', 158: '브루어스', 134: '파이어리츠', 138: '카디널스',
  109: '다이아몬드백스', 119: '다저스', 137: '자이언츠', 135: '파드리스', 115: '로키스',
}

/**
 * 사용자가 입력한 팀명(한글/영문, 자유 형식)으로 MLB teamId를 찾습니다.
 * @param {string} text - 사용자가 입력한 문장 또는 팀명
 * @returns {number|null} teamId 또는 찾지 못하면 null
 */
export function findTeamId(text) {
  if (!text) return null
  const normalized = text.toLowerCase().trim()

  // 가장 긴 별칭부터 매칭 (부분 문자열 오매칭 방지: "레드삭스" vs "삭스")
  const aliases = Object.keys(TEAM_ALIASES).sort((a, b) => b.length - a.length)

  for (const alias of aliases) {
    if (normalized.includes(alias.toLowerCase())) {
      return TEAM_ALIASES[alias]
    }
  }
  return null
}

export function getTeamNameKo(teamId) {
  return TEAM_NAMES_KO[teamId] || `팀 #${teamId}`
}
