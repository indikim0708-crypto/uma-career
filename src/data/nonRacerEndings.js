export const ANALYSIS_EVENT_IDS = new Set([
  'elem_library_book',
  'elem_racecourse_visit',
  'elem_famous_race_video',
  'middle_video_analysis',
  'middle_career_talk',
])

export const HELPING_EVENT_IDS = new Set([
  'elem_help_friend',
  'elem_baton_practice',
  'middle_team_leader',
])

export const TEAM_EVENT_IDS = new Set([
  'elem_baton_practice',
  'middle_team_leader',
  'middle_pair_senior',
])

export const NON_RACER_ENDINGS = {
  RACE_ANALYST: {
    id: 'RACE_ANALYST', priority: 1, title: '레이스를 읽는 사람', career: '레이스 분석가',
    body: '중앙 트레센 고등부의 문은 열리지 않았다.\n\n하지만 그녀는 레이스를 보는 것을 멈추지 않았다.\n\n선수들의 움직임, 페이스 변화,\n코너 진입 타이밍.\n\n남들이 놓치는 작은 차이를\n누구보다 빨리 찾아냈다.\n\n몇 년 후,\n그녀는 수많은 선수들이 찾는\n레이스 분석가가 되었다.\n\n달리는 대신,\n승리하는 방법을 찾아내는 사람이 되었다.',
  },
  TRAINER: {
    id: 'TRAINER', priority: 2, title: '달리게 만드는 사람', career: '트레이너',
    body: '자신이 선수로서\n중앙 트레센에 들어가지는 못했다.\n\n하지만 훈련 과정에서 그녀는\n다른 사람의 자세와 문제점을\n유난히 잘 찾아냈다.\n\n후배의 자세를 고쳐주고,\n친구에게 훈련 방법을 알려주는 일이\n점점 늘어났다.\n\n결국 그녀가 선택한 것은\n선수의 길이 아니었다.\n\n“좋아, 한 번 더.\n이번엔 훨씬 좋아졌어.”\n\n훗날 그녀는 트레이너가 되어\n자신이 도달하지 못한 무대로\n수많은 선수들을 보냈다.',
  },
  SPORTS_SCIENTIST: {
    id: 'SPORTS_SCIENTIST', priority: 3, title: '숫자로 증명하는 재능', career: '스포츠 과학 연구원',
    body: '훈련할 때마다\n그녀에게는 궁금한 것이 너무 많았다.\n\n왜 어떤 날은 더 빨리 달릴 수 있을까?\n어떤 훈련이 가장 효율적일까?\n피로는 언제 회복되는 걸까?\n\n관심은 어느새 달리는 것 자체보다\n달리는 몸의 원리로 향했다.\n\n대학에서 운동과학을 공부한 그녀는\n훗날 선수들의 훈련 프로그램을\n연구하는 사람이 되었다.\n\n그녀가 만든 데이터는\n수많은 선수들의 기록을 바꾸게 된다.',
  },
  SPRINT_ATHLETE: {
    id: 'SPRINT_ATHLETE', priority: 4, title: '트랙은 하나가 아니다', career: '단거리 육상 선수',
    body: '중앙 트레센 선발에서는 탈락했다.\n\n하지만 한 지도자는 그녀에게 말했다.\n\n“레이스 방식이 맞지 않았을 뿐이야.\n네 순수한 속도는 충분히 특별해.”\n\n이후 그녀는 일반 학교 육상부에 들어가\n100m와 200m 선수로\n새로운 도전을 시작했다.\n\n출발 신호가 울리는 순간만큼은\n예전과 똑같았다.\n\n그녀는 여전히\n누구보다 빠르게 달리고 있었다.',
  },
  ENDURANCE_ATHLETE: {
    id: 'ENDURANCE_ATHLETE', priority: 5, title: '끝까지 달리는 사람', career: '장거리 육상 선수',
    body: '빠른 경쟁에서는\n빛나지 못했을지도 모른다.\n\n하지만 다른 선수들이\n하나둘 지쳐갈 때마다\n그녀는 오히려 강해졌다.\n\n일반 학교 육상부에서\n장거리 종목을 시작한 그녀는\n마침내 자신에게 맞는 무대를 발견했다.\n\n5,000m.\n10,000m.\n그리고 더 먼 거리까지.\n\n속도보다 오래 버티는 힘이 필요한 곳에서\n그녀는 누구보다 멀리 달렸다.',
  },
  PHYSICAL_TRAINER: {
    id: 'PHYSICAL_TRAINER', priority: 6, title: '강함을 만드는 일', career: '피지컬 트레이너',
    body: '선수 생활을 준비하며\n가장 자신 있었던 것은\n언제나 강도 높은 훈련이었다.\n\n무거운 훈련도,\n가파른 언덕도\n그녀에게는 이상하게 즐거웠다.\n\n중앙 트레센에는 들어가지 못했지만\n그 경험은 사라지지 않았다.\n\n훗날 그녀는\n전문 피지컬 트레이너가 되었다.\n\n“한 세트 더 할 수 있지?”\n\n그 말을 들은 선수들은\n모두 그녀를 두려워했다고 한다.',
  },
  SPORTS_JOURNALIST: {
    id: 'SPORTS_JOURNALIST', priority: 7, title: '트랙 밖에서 전하는 이야기', career: '스포츠 기자',
    body: '그녀는 언제나\n레이스 이야기를 좋아했다.\n\n누가 왜 이겼는지,\n어떤 순간에 승부가 갈렸는지,\n선수들이 무슨 생각으로 달렸는지.\n\n직접 달리는 길은 끝났지만\n레이스에 대한 관심은 끝나지 않았다.\n\n몇 년 뒤 그녀는 스포츠 기자가 되어\n수많은 선수들의 이야기를\n세상에 전하기 시작했다.\n\n그리고 언젠가\n자신이 떨어졌던 선발 레이스에 대해서도\n글을 썼다.\n\n제목은\n“나의 마지막 레이스”였다.',
  },
  PHYSICAL_EDUCATOR: {
    id: 'PHYSICAL_EDUCATOR', priority: 8, title: '누군가의 등을 밀어주는 사람', career: '체육 지도자',
    body: '자신의 꿈은 이루지 못했지만\n이상하게도 그녀 주변에는\n항상 사람들이 모였다.\n\n힘들어하는 친구에게 먼저 손을 내밀고,\n후배가 포기하려 하면 함께 달렸다.\n\n시간이 흐른 뒤\n그녀는 아이들에게 운동을 가르치는\n지도자가 되었다.\n\n어느 날 한 아이가 물었다.\n\n“선생님도 선수였어요?”\n\n그녀는 잠시 웃었다.\n\n“거의 될 뻔했지.”',
  },
  TRACEN_STAFF: {
    id: 'TRACEN_STAFF', priority: 9, title: '트레센에 남는 방법', career: '트레센 운영 스태프',
    body: '고등부 선수로 올라가지는 못했다.\n\n하지만 중등부에서 보낸 시간 동안\n그녀는 트레센이라는 장소 자체를\n좋아하게 되었다.\n\n훈련장을 관리하고,\n대회를 준비하고,\n선수들의 일정을 돕는 일.\n\n달리는 사람만 있어서는\n레이스가 열릴 수 없다는 사실을 알게 되었다.\n\n그녀는 결국\n트레센 학원의 운영 스태프로 남았다.\n\n이번에는 트랙 밖에서\n선수들을 돕는다.',
  },
  ORDINARY_STUDENT: {
    id: 'ORDINARY_STUDENT', priority: 99, title: '평범하지만 소중한 나날', career: '일반 고등학교 진학',
    body: '오랫동안 꿈꿔왔던 선수의 길은\n중앙 트레센 고등부 선발에서 끝났다.\n\n처음에는 받아들이기 어려웠다.\n\n하지만 새로운 학교에 진학하고,\n새로운 친구를 만나고,\n평범한 하루를 보내는 동안\n조금씩 다른 행복을 발견하기 시작했다.\n\n가끔 운동장을 보면\n달리고 싶은 마음이 들기도 한다.\n\n그래도 이제는 안다.\n\n달리지 않아도\n인생은 계속된다는 것을.\n\n그녀의 새로운 고등학교 생활이 시작되었다.',
  },
}
