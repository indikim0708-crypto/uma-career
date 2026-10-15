export function getCareerEvaluation(potential, stability) {
  const growth = potential >= 80
    ? '매우 뛰어난 성장 잠재력을 가진 선수였습니다.'
    : potential >= 60
      ? '꾸준히 기대 이상의 성장을 보여준 선수였습니다.'
      : potential >= 40
        ? '차근차근 자신의 가능성을 키워낸 선수였습니다.'
        : '성실한 노력으로 긴 성장 과정을 완주한 선수였습니다.'

  const condition = stability >= 75
    ? '커리어 내내 안정적인 컨디션을 유지했습니다.'
    : stability < 35
      ? '성장 능력과 별개로 컨디션 기복이 큰 선수였습니다.'
      : '때로 흔들렸지만 자신의 리듬을 되찾았습니다.'

  return `${growth} ${condition}`
}
