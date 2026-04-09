import os

def fix_file(filepath):
    if not os.path.exists(filepath):
        print(f'{filepath} does not exist')
        return
        
    with open(filepath, 'rb') as f:
        content = f.read()
        
    # It seems the files are saved as utf-8, but contain characters that were originally utf-8 interpreted as gbk.
    # Actually, let's just do a simple text replace for the known garbled strings if we can't do a full encoding fix.
    
    text = content.decode('utf-8', errors='ignore')
    
    replacements = {
        '鍖椾含': '北京',
        '涓婃捣': '上海',
        '骞垮窞': '广州',
        '娣卞湷': '深圳',
        '鎴愰兘': '成都',
        '閲嶅簡': '重庆',
        '瑗垮畨': '西安',
        '鏉窞': '杭州',
        '姝︽眽': '武汉',
        '鍗椾含': '南京',
        '浜戦€旀櫤娓?- 鍦板浘': '云途智游 - 地图'
    }
    
    for k, v in replacements.items():
        text = text.replace(k, v)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(text)
        
    print(f'Fixed {filepath}')

fix_file('js/map.js')
fix_file('map.html')
