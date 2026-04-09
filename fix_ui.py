import re

with open('js/map.js', 'r', encoding='utf-8') as f:
    text = f.read()

replacements = {
    '馃搷': '📍',
    '鏃堕棿:': '时间:',
    '璺嚎瑙勫垝瀹屾垚': '路线规划完成',
    '璺嚎瑙勫垝澶辫触锛': '路线规划失败: ',
    '鏆傛湭鑾峰彇鍒拌缁嗚绋嬶紝宸插畾浣嶅埌': '暂未获取到详细行程，已定位到',
    '鏆傛湭鑾峰彇鍒拌缁嗚绋?': '暂未获取到详细行程'
}

for k, v in replacements.items():
    text = text.replace(k, v)

with open('js/map.js', 'w', encoding='utf-8') as f:
    f.write(text)
print("Replaced UI strings.")
