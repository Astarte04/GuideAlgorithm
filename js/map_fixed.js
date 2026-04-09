document.addEventListener('DOMContentLoaded', function() {
    var map = new AMap.Map('map-container', {
        viewMode: '2D',
        zoom: 11,
        center: [104.3984, 31.1265]
    });

    map.addControl(new AMap.ToolBar());
    map.addControl(new AMap.Scale());

    var infoWindow = new AMap.InfoWindow({
        offset: new AMap.Pixel(0, -30)
    });
    let geocoderInstance = null;
    const geocodeCache = new Map();

    const cityCoordinates = {
        '北京': [116.4074, 39.9042],
        '上海': [121.4737, 31.2304],
        '广州': [113.2644, 23.1291],
        '深圳': [114.0579, 22.5431],
        '杭州': [120.1551, 30.2741],
        '南京': [118.7969, 32.0603],
        '成都': [104.0665, 30.5723],
        '重庆': [106.5516, 29.5630],
        '武汉': [114.3052, 30.5931],
        '西安': [108.9402, 34.3416],
        '苏州': [120.5954, 31.2989],
        '天津': [117.1901, 39.1255],
        '长沙': [112.9388, 28.2282],
        '郑州': [113.6254, 34.7466],
        '沈阳': [123.4291, 41.7968],
        '青岛': [120.3826, 36.0671],
        '宁波': [121.5440, 29.8683],
        '东莞': [113.7461, 23.0462],
        '佛山': [113.1219, 23.0218],
        '合肥': [117.2272, 31.8206],
        '昆明': [102.8329, 24.8801],
        '大连': [121.6147, 38.9140],
        '厦门': [118.0894, 24.4798],
        '哈尔滨?: [126.5348, 45.8038],
        '长春': [125.3245, 43.8868],
        '福州': [119.2965, 26.0745],
        '济南': [117.1205, 36.6519],
        '温州': [120.6993, 28.0015],
        '南宁': [108.3661, 22.8172],
        '石家庄?: [114.5149, 38.0428],
        '泉州': [118.6754, 24.8741],
        '贵阳': [106.6302, 26.6477],
        '南昌': [115.8581, 28.6829],
        '金华': [120.1694, 29.0789],
        '常州': [119.9742, 31.8112],
        '珠海': [113.5539, 22.2245],
        '惠州': [114.4152, 23.1116],
        '嘉兴': [120.7509, 30.7627],
        '南通?: [120.8943, 31.9802],
        '中山': [113.3926, 22.5176],
        '兰州': [103.8343, 36.0611],
        '̫ԭ': [112.5489, 37.8706],
        '烟台': [121.4479, 37.4638],
        '海口': [110.1999, 20.0440],
        '乌鲁木齐': [87.6177, 43.7928],
        '呼和浩特': [111.7510, 40.8427],
        '拉萨': [91.1322, 29.6600],
        '永州': [111.6130, 26.4206],
        '德阳': [104.3984, 31.1265],
        '绵阳': [104.6793, 31.4677],
        '泸州': [105.4429, 28.8719],
        '宜宾': [104.6430, 28.7518],
        '乐山': [103.7656, 29.5521],
        '南充': [106.1107, 30.8378],
        '自贡': [104.7785, 29.3398],
        '内江': [105.0584, 29.5802],
        '攀枝花': [101.7183, 26.5804],
        '广元': [105.8434, 32.4353],
        '遂宁': [105.5928, 30.5328],
        'üɽ': [103.8485, 30.0757],
        '广安': [106.6333, 30.4564],
        '达州': [107.4680, 31.2096],
        '雅安': [103.0133, 29.9805],
        '巴中': [106.7537, 31.8588],
        '资阳': [104.6276, 30.1282]
    };
    const COORD_PI = Math.PI;
    const COORD_A = 6378245.0;
    const COORD_EE = 0.00669342162296594323;
    const COORD_X_PI = COORD_PI * 3000.0 / 180.0;

    function normalizeLocationName(locationName) {
        return String(locationName || '').trim();
    }

    function normalizeCoordType(coordType) {
        const text = String(coordType || '').toLowerCase().replace(/[_-]/g, '');
        if (text.includes('wgs84') || text.includes('gps')) return 'wgs84';
        if (text.includes('bd09') || text.includes('baidu')) return 'bd09';
        if (text.includes('gcj02') || text.includes('gaode') || text.includes('amap')) return 'gcj02';
        return 'gcj02';
    }

    function toNumber(value) {
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
    }

    function isValidLngLat(coords) {
        if (!Array.isArray(coords) || coords.length < 2) return false;
        const lng = toNumber(coords[0]);
        const lat = toNumber(coords[1]);
        if (lng === null || lat === null) return false;
        return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
    }

    function outOfChina(lng, lat) {
        return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
    }

    function transformLat(lng, lat) {
        let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * COORD_PI) + 20.0 * Math.sin(2.0 * lng * COORD_PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lat * COORD_PI) + 40.0 * Math.sin(lat / 3.0 * COORD_PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(lat / 12.0 * COORD_PI) + 320.0 * Math.sin(lat * COORD_PI / 30.0)) * 2.0 / 3.0;
        return ret;
    }

    function transformLng(lng, lat) {
        let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * COORD_PI) + 20.0 * Math.sin(2.0 * lng * COORD_PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lng * COORD_PI) + 40.0 * Math.sin(lng / 3.0 * COORD_PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(lng / 12.0 * COORD_PI) + 300.0 * Math.sin(lng / 30.0 * COORD_PI)) * 2.0 / 3.0;
        return ret;
    }

    function wgs84ToGcj02(coords) {
        const source = Array.isArray(coords) ? coords : [];
        const lng = toNumber(source[0]);
        const lat = toNumber(source[1]);
        if (lng === null || lat === null) return null;
        if (outOfChina(lng, lat)) return [lng, lat];
        let dLat = transformLat(lng - 105.0, lat - 35.0);
        let dLng = transformLng(lng - 105.0, lat - 35.0);
        const radLat = lat / 180.0 * COORD_PI;
        let magic = Math.sin(radLat);
        magic = 1 - COORD_EE * magic * magic;
        const sqrtMagic = Math.sqrt(magic);
        dLat = (dLat * 180.0) / ((COORD_A * (1 - COORD_EE)) / (magic * sqrtMagic) * COORD_PI);
        dLng = (dLng * 180.0) / (COORD_A / sqrtMagic * Math.cos(radLat) * COORD_PI);
        return [lng + dLng, lat + dLat];
    }

    function bd09ToGcj02(coords) {
        const source = Array.isArray(coords) ? coords : [];
        const bdLng = toNumber(source[0]);
        const bdLat = toNumber(source[1]);
        if (bdLng === null || bdLat === null) return null;
        const x = bdLng - 0.0065;
        const y = bdLat - 0.006;
        const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * COORD_X_PI);
        const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * COORD_X_PI);
        const ggLng = z * Math.cos(theta);
        const ggLat = z * Math.sin(theta);
        return [ggLng, ggLat];
    }

    function convertToGcj02(coords, sourceType) {
        if (!isValidLngLat(coords)) return null;
        const coordType = normalizeCoordType(sourceType);
        if (coordType === 'wgs84') return wgs84ToGcj02(coords);
        if (coordType === 'bd09') return bd09ToGcj02(coords);
        return [toNumber(coords[0]), toNumber(coords[1])];
    }

    function parseCoordinateText(text) {
        const raw = String(text || '').trim();
        if (!raw) return null;
        const cleaned = raw.replace(/[（）()]/g, ' ').replace(/[，]/g, ',').replace(/\s+/g, ' ');
        const match = cleaned.match(/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/);
        if (!match) return null;
        const lng = toNumber(match[1]);
        const lat = toNumber(match[2]);
        if (lng === null || lat === null) return null;
        return [lng, lat];
    }

    function normalizeMapPosition(coords) {
        if (!isValidLngLat(coords)) return null;
        const lng = toNumber(coords[0]);
        const lat = toNumber(coords[1]);
        if (lng === null || lat === null) return null;
        return [lng, lat];
    }

    function extractActivityCoords(activity) {
        if (!activity || typeof activity !== 'object') return null;
        const coordType = activity.coord_type || activity.coordType || activity.coordinate_system || activity.coordinateSystem || '';
        if (Array.isArray(activity.coordinates) && activity.coordinates.length >= 2) {
            return { coords: [activity.coordinates[0], activity.coordinates[1]], coordType };
        }
        if (Array.isArray(activity.location) && activity.location.length >= 2) {
            return { coords: [activity.location[0], activity.location[1]], coordType };
        }
        const lng = toNumber(activity.lng !== undefined && activity.lng !== null ? activity.lng : (activity.longitude !== undefined && activity.longitude !== null ? activity.longitude : activity.lon));
        const lat = toNumber(activity.lat !== undefined && activity.lat !== null ? activity.lat : activity.latitude);
        if (lng !== null && lat !== null) {
            return { coords: [lng, lat], coordType };
        }
        if (typeof activity.position === 'string') {
            const textCoords = parseCoordinateText(activity.position);
            if (textCoords) {
                return { coords: textCoords, coordType };
            }
        }
        return null;
    }

    function getStationOrAirportFallback(locationName, targetCity) {
        const targetCoords = cityCoordinates[targetCity] || null;
        if (!locationName || !targetCoords) return null;
        if (!(locationName.includes('绔?) || locationName.includes('机场') || locationName.includes('地铁'))) {
            return null;
        }
        const cityMatch = locationName.match(/(.+?)(机场|国际机场|澶╁簻鏈哄満|钀у北鏈哄満|鐏溅绔檤楂橀搧绔檤绔檤鍦伴搧绔?/);
        if (cityMatch) {
            const city = cityMatch[1];
            if (cityCoordinates[city]) {
                return cityCoordinates[city];
            }
            if (cityCoordinates[city.replace(/甯?/, '')]) {
                return cityCoordinates[city.replace(/甯?/, '')];
            }
        }
        return targetCoords;
    }

    function getExactCoordinates(locationName) {
        if (!locationName) return null;
        if (cityCoordinates[locationName]) {
            return convertToGcj02(cityCoordinates[locationName], 'gcj02');
        }
        const withoutCitySuffix = locationName.replace(/甯?/, '');
        if (cityCoordinates[withoutCitySuffix]) {
            return convertToGcj02(cityCoordinates[withoutCitySuffix], 'gcj02');
        }
        return null;
    }

    function getGeocoder() {
        if (geocoderInstance) {
            return Promise.resolve(geocoderInstance);
        }
        return new Promise((resolve) => {
            AMap.plugin('AMap.Geocoder', () => {
                geocoderInstance = new AMap.Geocoder({
                    city: '鍏ㄥ浗'
                });
                resolve(geocoderInstance);
            });
        });
    }

    async function geocodeAddress(address, cityHint) {
        const geocoder = await getGeocoder();
        return new Promise((resolve) => {
            geocoder.getLocation(address, function(status, result) {
                if (status === 'complete' && result && result.geocodes && result.geocodes.length > 0) {
                    const location = result.geocodes[0].location;
                    resolve(convertToGcj02([location.lng, location.lat], 'gcj02'));
                    return;
                }
                if (cityHint) {
                    geocoder.getLocation(`${cityHint}${address}`, function(status2, result2) {
                        if (status2 === 'complete' && result2 && result2.geocodes && result2.geocodes.length > 0) {
                            const location2 = result2.geocodes[0].location;
                            resolve(convertToGcj02([location2.lng, location2.lat], 'gcj02'));
                            return;
                        }
                        resolve(null);
                    });
                    return;
                }
                resolve(null);
            });
        });
    }

    async function getCoordinatesForLocation(locationName, targetCity) {
        const normalizedName = normalizeLocationName(locationName);
        if (!normalizedName) return null;
        const exactCoords = getExactCoordinates(normalizedName);
        if (exactCoords) return exactCoords;

        const stationOrAirportCoords = getStationOrAirportFallback(normalizedName, targetCity);
        if (stationOrAirportCoords) {
            return convertToGcj02(stationOrAirportCoords, 'gcj02');
        }

        const cacheKey = `${targetCity || ''}::${normalizedName}`;
        if (geocodeCache.has(cacheKey)) {
            return geocodeCache.get(cacheKey);
        }

        let coords = await geocodeAddress(normalizedName, targetCity);
        if (!coords && targetCity) {
            coords = await geocodeAddress(`${targetCity}${normalizedName}`, targetCity);
        }
        if (!coords && cityCoordinates[targetCity]) {
            coords = convertToGcj02(cityCoordinates[targetCity], 'gcj02');
        }
        geocodeCache.set(cacheKey, coords || null);
        return coords;
    }

    function normalizeActivityType(type) {
        const text = String(type || '').toLowerCase().trim();
        if (!text) return '';
        if (text === '鏅偣') return 'attraction';
        if (text === '鏃╅') return 'breakfast';
        if (text === '鍗堥') return 'lunch';
        if (text === '鏅氶') return 'dinner';
        if (text === '浣忓') return 'accommodation';
        if (text === '鑸彮') return 'airplane';
        return text;
    }

    function getActivityNodeMeta(activity) {
        const safeActivity = activity && typeof activity === 'object' ? activity : {};
        const type = normalizeActivityType(safeActivity.type);
        const position = normalizeLocationName(safeActivity.position || safeActivity.end || safeActivity.start || '');
        if (!position) return null;
        if (type === 'airplane') {
            const startText = normalizeLocationName(safeActivity.start || '');
            const endText = normalizeLocationName(safeActivity.end || position);
            return {
                name: endText || position,
                desc: `鑸彮鍑鸿锛?{startText || '起点'} 鈫?${endText || '终点'}`,
                type: 'airplane'
            };
        }
        if (type === 'accommodation') {
            return {
                name: position,
                desc: `浣忓锛?{position}`,
                type: 'accommodation'
            };
        }
        if (type === 'breakfast' || type === 'lunch' || type === 'dinner') {
            return {
                name: position,
                desc: `鐢ㄩ锛?{position}`,
                type
            };
        }
        if (type === 'attraction') {
            return {
                name: position,
                desc: `鏅偣娓歌锛岄璁℃父鐜?{calculateDuration(safeActivity.start_time, safeActivity.end_time)}`,
                type: 'attraction'
            };
        }
        return {
            name: position,
            desc: `琛岀▼鍦扮偣锛?{position}`,
            type: type || 'event'
        };
    }

    function parseItineraryData(value) {
        if (!value) return null;
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch (e) {
                return null;
            }
        }
        if (typeof value === 'object') {
            return value;
        }
        return null;
    }

    function normalizeItineraryData(raw) {
        const parsed = parseItineraryData(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        
        // 情况 1: 直接有 itinerary 数组
        if (Array.isArray(parsed.itinerary)) return parsed;
        
        // 情况 2: itinerary 字段内嵌套另一个包含 itinerary 数组的对象
        const inner = parseItineraryData(parsed.itinerary);
        if (inner && Array.isArray(inner.itinerary)) return inner;
        
        // 情况 3: parsed 本身就是 itinerary 数组（从 API 直接返回的解析后的数据）
        if (Array.isArray(parsed)) {
            return { itinerary: parsed };
        }
        
        return null;
    }

    function getApiBaseCandidates() {
        const candidates = [];
        if (window && window.location && window.location.origin) {
            candidates.push(`${window.location.origin}/api`);
        }
        if (typeof API_BASE_URL === 'string' && API_BASE_URL) {
            candidates.push(API_BASE_URL);
        }
        return Array.from(new Set(candidates));
    }

    function getTravelRecords() {
        const recordsStr = localStorage.getItem('travelRecords');
        if (!recordsStr) return [];
        try {
            const records = JSON.parse(recordsStr);
            return Array.isArray(records) ? records : [];
        } catch (e) {
            return [];
        }
    }

    function findRecordById(records, rawId) {
        const idText = String(rawId || '').trim();
        if (!idText) return null;
        const asNumber = Number(idText);
        const exact = records.find(record => String(record.id) === idText);
        if (exact) return exact;
        if (Number.isFinite(asNumber)) {
            return records.find(record => Number(record.id) === asNumber) || null;
        }
        return null;
    }

    function resolveTripForMap() {
        const records = getTravelRecords();
        if (!records.length) return null;
        const activeTripId = localStorage.getItem('activeTripId');
        const activeRecord = findRecordById(records, activeTripId);
        if (activeRecord && (activeRecord.dbPlanId || normalizeItineraryData(activeRecord.itinerary))) {
            return activeRecord;
        }
        const focusedRecord = records.find(record => record.focused);
        if (focusedRecord && (focusedRecord.dbPlanId || normalizeItineraryData(focusedRecord.itinerary))) {
            return focusedRecord;
        }
        const generatedRecord = records.find(record => record.planGenerated && (record.dbPlanId || normalizeItineraryData(record.itinerary)));
        if (generatedRecord) {
            return generatedRecord;
        }
        return activeRecord || focusedRecord || records[records.length - 1] || null;
    }

    async function fetchLatestItineraryByPlanId(planId) {
        if (!Number.isFinite(planId) || planId <= 0) return null;
        const apiBases = getApiBaseCandidates();
        if (!apiBases.length) return null;
        for (const base of apiBases) {
            try {
                const response = await fetch(`${base}/plan/${planId}/itinerary`);
                if (!response.ok) continue;
                const data = await response.json();
                const itinerary = normalizeItineraryData(data ? data.itinerary : null);
                if (itinerary) return itinerary;
            } catch (e) {
                continue;
            }
        }
        return null;
    }

    async function fetchTripFromBackend() {`n        console.log("正在从后端获取行程数据...");
        const apiBases = getApiBaseCandidates();
        for (const base of apiBases) {
            try {
                const response = await fetch(`${base}/plans`);
                if (!response.ok) continue;
                const plans = await response.json();
                if (!Array.isArray(plans) || !plans.length) continue;
                const latestPlan = plans
                    .filter(item => item && (item.itinerary || item.plan_generated))
                    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0];
                if (!latestPlan) continue;
                let normalized = normalizeItineraryData(latestPlan.itinerary);
                if (!normalized && latestPlan.id) {
                    normalized = await fetchLatestItineraryByPlanId(Number(latestPlan.id));
                }
                if (!normalized) continue;
                return {
                    id: `backend_${latestPlan.id}`,
                    dbPlanId: latestPlan.id,
                    itinerary: normalized
                };
            } catch (e) {
                continue;
            }
        }
        return null;
    }

    async function buildFallbackNodesFromCities(itineraryData) {
        if (!itineraryData || typeof itineraryData !== 'object') return [];
        const startCity = normalizeLocationName(itineraryData.start_city || '');
        const targetCity = normalizeLocationName(itineraryData.target_city || '');
        if (!startCity && !targetCity) return [];

        const nodes = [];
        if (startCity) {
            const startPos = await getCoordinatesForLocation(startCity, startCity);
            if (startPos) {
                nodes.push({
                    name: startCity,
                    position: startPos,
                    time: '',
                    desc: `鍑哄彂鍩庡競锛?{startCity}`,
                    type: 'start'
                });
            }
        }
        if (targetCity) {
            const targetPos = await getCoordinatesForLocation(targetCity, targetCity);
            if (targetPos) {
                const hasSame = nodes.some((node) => node.position[0] === targetPos[0] && node.position[1] === targetPos[1]);
                if (!hasSame) {
                    nodes.push({
                        name: targetCity,
                        position: targetPos,
                        time: '',
                        desc: `鐩殑鍩庡競锛?{targetCity}`,
                        type: 'target'
                    });
                }
            }
        }
        return nodes;
    }

    function updateLocalTripItinerary(tripId, itineraryData) {
        if (!tripId || !itineraryData) return;
        const recordsStr = localStorage.getItem('travelRecords');
        if (!recordsStr) return;
        let records = [];
        try {
            records = JSON.parse(recordsStr);
        } catch (e) {
            return;
        }
        const nextRecords = records.map((record) => {
            if (String(record.id) !== String(tripId)) return record;
            return {
                ...record,
                itinerary: itineraryData
            };
        });
        localStorage.setItem('travelRecords', JSON.stringify(nextRecords));
    }

    function dedupeNodes(nodes) {
        const result = [];
        nodes.forEach((node) => {
            const last = result[result.length - 1];
            if (!last) {
                result.push(node);
                return;
            }
            const sameName = last.name === node.name;
            const samePos = last.position[0] === node.position[0] && last.position[1] === node.position[1];
            if (sameName || samePos) return;
            result.push(node);
        });
        return result;
    }

    async function extractMapNodes(itineraryData) {
        const nodesWithOrder = [];
        const targetCity = itineraryData && itineraryData.target_city ? itineraryData.target_city : '';
        
        if (!itineraryData || !itineraryData.itinerary || !Array.isArray(itineraryData.itinerary)) {
            return [];
        }
        
        const pendingTasks = [];
        itineraryData.itinerary.forEach((dayData, dayIndex) => {
            if (!dayData.activities) return;
            dayData.activities.forEach((activity, activityIndex) => {
                const order = dayIndex * 1000 + activityIndex;
                const meta = getActivityNodeMeta(activity);
                if (!meta) return;
                const rawCoords = extractActivityCoords(activity);
                if (rawCoords && isValidLngLat(rawCoords.coords)) {
                    const gcjCoords = convertToGcj02(rawCoords.coords, rawCoords.coordType);
                    if (gcjCoords) {
                        nodesWithOrder.push({
                            order,
                            node: {
                                name: meta.name,
                                position: gcjCoords,
                                time: activity.start_time || '',
                                desc: meta.desc,
                                type: meta.type
                            }
                        });
                        return;
                    }
                }
                pendingTasks.push(
                    getCoordinatesForLocation(meta.name, targetCity).then((coords) => {
                        if (!coords) return;
                        nodesWithOrder.push({
                            order,
                            node: {
                                name: meta.name,
                                position: coords,
                                time: activity.start_time || '',
                                desc: meta.desc,
                                type: meta.type
                            }
                        });
                    })
                );
            });
        });
        await Promise.all(pendingTasks);
        const ordered = nodesWithOrder
            .sort((a, b) => a.order - b.order)
            .map(item => item.node)
            .filter(item => isValidLngLat(item.position));
        return dedupeNodes(ordered);
    }

    function calculateDuration(startTime, endTime) {
        if (!startTime || !endTime || !startTime.includes(':') || !endTime.includes(':')) {
            return '鏈煡鏃堕暱';
        }
        const start = startTime.split(':').map(Number);
        const end = endTime.split(':').map(Number);
        const startMinutes = start[0] * 60 + start[1];
        const endMinutes = end[0] * 60 + end[1];
        const diff = endMinutes - startMinutes;
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        if (hours > 0 && minutes > 0) {
            return `${hours}小时${minutes}分钟`;
        } else if (hours > 0) {
            return `${hours}小时`;
        } else {
            return `${minutes}分钟`;
        }
    }

    async function loadAndRenderMap() {`n        console.log("=== 开始加载地图数据 ===");`n        console.log("尝试从后端获取行程数据...");
        let trip = resolveTripForMap();
        if (!trip) {
            trip = await fetchTripFromBackend();
        }
        if (!trip) {
            renderDefaultMap();
            return;
        }

        const dbPlanId = Number(trip.dbPlanId);
        if (Number.isFinite(dbPlanId) && dbPlanId > 0) {
            const latest = await fetchLatestItineraryByPlanId(dbPlanId);
            if (latest) {
                trip.itinerary = latest;
                updateLocalTripItinerary(trip.id, latest);
            }
        }

        let itineraryData = normalizeItineraryData(trip.itinerary);
        if (!itineraryData) {
            const backendTrip = await fetchTripFromBackend();
            if (backendTrip) {
                trip = backendTrip;
                itineraryData = normalizeItineraryData(backendTrip.itinerary);
            }
        }
        if (!itineraryData) {
            renderDefaultMap();
            return;
        }
        
        let nodes = await extractMapNodes(itineraryData);
        if (!nodes.length) {
            nodes = await buildFallbackNodesFromCities(itineraryData);
        }
        
        if (nodes.length === 0) {
            renderDefaultMap(itineraryData.target_city || itineraryData.start_city || '');
            return;
        }
        
        renderMapNodes(nodes, itineraryData.target_city);
    }

    function renderMapNodes(nodes, targetCity) {
        const markers = [];
        let fallbackPolyline = null;
        
        nodes.forEach((node, index) => {
            const mapPosition = normalizeMapPosition(node.position);
            if (!mapPosition) return;
            var marker = new AMap.Marker({
                position: mapPosition,
                title: node.name,
                map: map,
                label: {
                    content: `<div class='marker-label'>${index + 1}</div>`,
                    direction: 'top'
                }
            });

            marker.on('click', function(e) {
                const infoContent = `
                    <div style="padding: 10px; max-width: 250px;">
                        <h4 style="margin: 0 0 5px 0; color: #1890ff;">📍 ${node.name}</h4>
                        <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">时间: ${node.time}</p>
                        <p style="margin: 0; font-size: 14px;">${node.desc}</p>
                    </div>
                `;
                infoWindow.setContent(infoContent);
                infoWindow.open(map, marker.getPosition());
            });

            markers.push(marker);
        });

        if (!markers.length) {
            renderDefaultMap();
            return;
        }

        const renderFallbackPath = () => {
            const path = nodes
                .map(node => normalizeMapPosition(node.position))
                .filter(Boolean)
                .map(pos => new AMap.LngLat(pos[0], pos[1]));
            if (path.length < 2) {
                map.setFitView(markers);
                return;
            }
            if (fallbackPolyline) {
                map.remove(fallbackPolyline);
            }
            fallbackPolyline = new AMap.Polyline({
                map: map,
                path: path,
                strokeColor: '#1e88e5',
                strokeWeight: 5,
                strokeOpacity: 0.75,
                lineJoin: 'round',
                lineCap: 'round'
            });
            map.setFitView([...markers, fallbackPolyline]);
        };

        if (nodes.length > 1) {
            var driving = new AMap.Driving({
                map: map,
                hideMarkers: true,
                showTraffic: false
            });

            const waypoints = nodes.slice(1, -1).map(node => new AMap.LngLat(node.position[0], node.position[1]));
            const start = new AMap.LngLat(nodes[0].position[0], nodes[0].position[1]);
            const end = new AMap.LngLat(nodes[nodes.length-1].position[0], nodes[nodes.length-1].position[1]);

            driving.search(start, end, { waypoints: waypoints }, function(status, result) {
                if (status === 'complete') {
                    console.log('路线规划完成');
                    map.setFitView(markers);
                } else {
                    console.error('路线规划失败: ? + result);
                    renderFallbackPath();
                }
            });
        } else {
            map.setFitView(markers);
        }
    }

    function renderDefaultMap(cityHint) {
        const city = normalizeLocationName(cityHint || '');
        const fallbackCity = cityCoordinates[city] ? city : '北京';
        const fallbackPosition = cityCoordinates[fallbackCity] || [116.4074, 39.9042];
        map.setCenter(fallbackPosition);
        map.setZoom(10);
        const tripNodes = [
            {
                name: fallbackCity,
                position: fallbackPosition,
                time: "",
                desc: city ? `暂未获取到详细行程，已定位到${fallbackCity}` : "暂未获取到详细行程
            }
        ];
        
        const markers = [];
        
        tripNodes.forEach((node, index) => {
            const mapPosition = normalizeMapPosition(node.position);
            if (!mapPosition) return;
            var marker = new AMap.Marker({
                position: mapPosition,
                title: node.name,
                map: map,
                label: {
                    content: `<div class='marker-label'>${index + 1}</div>`,
                    direction: 'top'
                }
            });

            marker.on('click', function(e) {
                const infoContent = `
                    <div style="padding: 10px; max-width: 250px;">
                        <h4 style="margin: 0 0 5px 0; color: #1890ff;">${node.name}</h4>
                        <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">时间: ${node.time}</p>
                        <p style="margin: 0; font-size: 14px;">${node.desc}</p>
                    </div>
                `;
                infoWindow.setContent(infoContent);
                infoWindow.open(map, marker.getPosition());
            });

            markers.push(marker);
        });
        if (markers.length) {
            map.setFitView(markers);
        }
    }

    loadAndRenderMap().catch(() => {
        renderDefaultMap();
    });
});














