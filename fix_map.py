import io

with open('js/map.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    "'哈尔滨?:": "'哈尔滨':",
    "'石家庄?:": "'石家庄':",
    "'南通?:": "'南通':",
    "'娉夊窞'": "'泉州'",
    "'娴峰彛'": "'海口'",
    "/[锛堬級()]/g": "/[（）()]/g",
    "/[锛宂/g": "/[，]/g",
    "includes('绔?)": "includes('站')",
    "includes('鏈哄満')": "includes('机场')",
    "includes('鍦伴搧')": "includes('地铁')",
    "/(.+?)(鏈哄満|鍥介檯鏈哄満|澶╁簻鏈哄満|钀у北鏈哄満|鐏溅绔檤楂橀搧绔檤绔檤鍦伴搧绔?/": "/(.+?)(机场|国际机场|天府机场|萧山机场|火车站|高铁站|站|地铁站)/",
    "/甯?/": "/市/g",
    "if (text === '鏅偣')": "if (text === '景点')",
    "if (text === '鏃╅')": "if (text === '早餐')",
    "if (text === '鍗堥')": "if (text === '午餐')",
    "if (text === '鏅氶')": "if (text === '晚餐')",
    "if (text === '浣忓')": "if (text === '住宿')",
    "if (text === '鑸彮')": "if (text === '航班')",
    "鑸彮鍑鸿锛?{startText || '璧风偣'} 鈫?${endText || '缁堢偣'}": "航班出行：${startText || '起点'} -> ${endText || '终点'}",
    "浣忓锛?{position}": "住宿：${position}",
    "鐢ㄩ锛?{position}": "用餐：${position}",
    "鏅偣娓歌锛岄璁℃父鐜?{calculateDuration(safeActivity.start_time, safeActivity.end_time)}": "景点游览，预计游玩${calculateDuration(safeActivity.start_time, safeActivity.end_time)}",
    "琛岀▼鍦扮偣锛?{position}": "行程地点：${position}",
    "鍑哄彂鍩庡競锛?{startCity}": "出发城市：${startCity}",
    "鐩殑鍩庡競锛?{targetCity}": "目的城市：${targetCity}",
    "鏈煡鏃堕暱": "未知时长",
    "灏忔椂": "小时",
    "鍒嗛挓": "分钟",
    "路线规划失败: ? + result": "路线规划失败: ' + result",
    "暂未获取到详细行程\n": "暂未获取到详细行程\"\n",
    "鍏ㄥ浗": "全国"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('js/map.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Replacements done.')
