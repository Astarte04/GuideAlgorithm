document.addEventListener('DOMContentLoaded', function() {
    // 1. 初始化地图
    var map = new AMap.Map('map-container', {
        viewMode: '2D', // 默认使用 2D 模式
        zoom: 11,       // 初始化视图层级
        center: [104.3984, 31.1265] // 默认中心点 (例如: 德阳)
    });

    // 2. 添加常用控件
    map.addControl(new AMap.ToolBar());
    map.addControl(new AMap.Scale());

    // 信息窗体实例，用于点击标记时显示详细信息
    var infoWindow = new AMap.InfoWindow({
        offset: new AMap.Pixel(0, -30)
    });

    // 3. 辅助函数：将API返回的行程数据转换为地图节点
    // 这里我们直接请求后端的 /api/plans 接口获取最新的行程数据
    async function fetchTripFromBackend() {
        try {
            // 获取最新的一条行程计划
            const response = await fetch('/api/plans');
            if (!response.ok) {
                throw new Error('网络请求失败');
            }
            const plans = await response.json();
            if (!Array.isArray(plans) || plans.length === 0) {
                return null;
            }
            
            // 找到最新的一条包含生成结果的计划
            const latestPlan = plans.filter(p => p.plan_generated).sort((a, b) => b.id - a.id)[0];
            if (!latestPlan) return null;
            
            // 获取该计划的详细行程数据
            const detailResponse = await fetch('/api/plan/' + latestPlan.id + '/itinerary');
            if (!detailResponse.ok) return null;
            const detailData = await detailResponse.json();
            
            return {
                id: latestPlan.id,
                itinerary: detailData.itinerary || detailData
            };
        } catch (error) {
            console.error('获取行程数据失败:', error);
            return null;
        }
    }

    // 核心处理函数：解析、获取坐标、打点、画线
    async function processAndRenderItinerary(itineraryData) {
        try {
            const days = itineraryData.itinerary || itineraryData;
            if (!Array.isArray(days)) return;

            // 1. 收集所有唯一的地点名称
            const locationNames = new Set();
            
            days.forEach(day => {
                // 兼容不同的行程数据结构：可能有 activities 数组，或者直接就是一个活动节点
                let activitiesList = [];
                if (day.activities && Array.isArray(day.activities)) {
                    activitiesList = day.activities;
                } else if (day.schedule && Array.isArray(day.schedule)) {
                    activitiesList = day.schedule;
                } else {
                    // 如果一天没有 activities 或 schedule，可能它本身就是一个节点，或者我们需要提取它里面的某些字段
                    activitiesList = [day]; 
                }

                activitiesList.forEach(activity => {
                    if (!activity) return;
                    
                    // 提取地点名称
                    if (activity.position) locationNames.add(activity.position);
                    else if (activity.location) locationNames.add(activity.location);
                    else if (activity.name) locationNames.add(activity.name);
                    
                    if (activity.start) locationNames.add(activity.start);
                    if (activity.end) locationNames.add(activity.end);
                    
                    if (activity.transports && Array.isArray(activity.transports)) {
                        activity.transports.forEach(t => {
                            if (t.start) locationNames.add(t.start);
                            if (t.end) locationNames.add(t.end);
                        });
                    }
                });
            });

            // 2. 通过高德 Geocoder 获取坐标
            const geocoder = new AMap.Geocoder();
            const locationToLngLat = {};
            
            const getPositionByName = (name) => {
                return new Promise((resolve) => {
                    let isResolved = false;
                    
                    // 增加超时处理，防止某个地点请求卡死整个渲染流程
                    const timeoutId = setTimeout(() => {
                        if (!isResolved) {
                            isResolved = true;
                            console.warn(`获取地点 "${name}" 的坐标超时 (2秒)`);
                            resolve(null);
                        }
                    }, 2000);

                    geocoder.getLocation(name, function(status, result) {
                        if (isResolved) return;
                        isResolved = true;
                        clearTimeout(timeoutId);

                        if (status === 'complete' && result.info === 'OK') {
                            const location = result.geocodes[0].location;
                            resolve([location.lng, location.lat]);
                        } else {
                            console.warn(`无法获取地点 "${name}" 的坐标, 状态: ${status}`, result);
                            resolve(null);
                        }
                    });
                });
            };

            console.log(`正在获取 ${locationNames.size} 个地点的坐标...`);
            let processedCount = 0;
            for (let name of locationNames) {
                // 过滤掉无效的地名
                if (!name || typeof name !== 'string' || name.trim() === '' || name.trim() === '-' || name.trim() === '无') {
                    continue;
                }
                
                processedCount++;
                console.log(`[${processedCount}/${locationNames.size}] 请求坐标: ${name}`);
                const pos = await getPositionByName(name);
                if (pos) {
                    locationToLngLat[name] = pos;
                }
                // 每次请求后稍微停顿一下，防止触发高德API并发限制(QPS)
                await new Promise(r => setTimeout(r, 200));
            }
            
            console.log('解析到的坐标字典:', locationToLngLat);

            // 3. 在地图上添加标点（Marker）
            const markers = [];
            let order = 1;
            
            Object.keys(locationToLngLat).forEach(name => {
                const pos = locationToLngLat[name];
                const marker = new AMap.Marker({
                    position: pos,
                    title: name,
                    map: map,
                    label: {
                        content: `<div class='marker-label'>${order++}</div>`,
                        direction: 'top'
                    }
                });

                marker.on('click', function() {
                    const infoContent = `<div class='amap-info-content' style='padding: 10px; max-width: 250px;'>
                        <h4 style='margin: 0 0 5px 0; color: #1890ff;'>📍 ${name}</h4>
                        </div>`;
                    infoWindow.setContent(infoContent);
                    infoWindow.open(map, marker.getPosition());
                });

                markers.push(marker);
            });

            if (markers.length === 0) {
                // 如果没有获取到坐标，在地图上显示提示，而不是替换整个容器的内容
                showEmptyMapMessage('无法解析任何有效地点坐标，无法渲染地图路径。');
                return;
            }

            // 调整视野
            map.setFitView(markers);

            // 4. 绘制路径
            const drawRoute = (startPos, endPos, mode) => {
                return new Promise((resolve) => {
                    let service = null;
                    // 确保插件已加载
                    if ((mode === 'walk' || mode === 'walking') && AMap.Walking) {
                        service = new AMap.Walking({ map: map, hideMarkers: true });
                    } else if (AMap.Driving) {
                        // 默认降级为驾车
                        service = new AMap.Driving({ map: map, hideMarkers: true, showTraffic: false });
                    }

                    if (service) {
                        service.search(new AMap.LngLat(startPos[0], startPos[1]), new AMap.LngLat(endPos[0], endPos[1]), function(status, result) {
                            if (status !== 'complete') {
                                drawStraightLine(startPos, endPos, '#09f'); // 失败回退为直线
                            }
                            resolve();
                        });
                    } else {
                        drawStraightLine(startPos, endPos, '#09f');
                        resolve();
                    }
                });
            };

            const drawStraightLine = (startPos, endPos, color = '#1e88e5', isDashed = false) => {
                new AMap.Polyline({
                    map: map,
                    path: [startPos, endPos],
                    strokeColor: color,
                    strokeWeight: 4,
                    strokeStyle: isDashed ? 'dashed' : 'solid',
                    lineJoin: 'round',
                    lineCap: 'round',
                    strokeOpacity: 0.8
                });
            };

            for (const day of days) {
                let activitiesList = [];
                if (day.activities && Array.isArray(day.activities)) {
                    activitiesList = day.activities;
                } else if (day.schedule && Array.isArray(day.schedule)) {
                    activitiesList = day.schedule;
                } else {
                    activitiesList = [day]; 
                }

                for (const activity of activitiesList) {
                    if (!activity) continue;
                    
                    // 飞机/高铁直接画虚线
                    if (['airplane', 'train', 'high_speed_train', 'flight'].includes(activity.type)) {
                        if (activity.start && activity.end && locationToLngLat[activity.start] && locationToLngLat[activity.end]) {
                            drawStraightLine(locationToLngLat[activity.start], locationToLngLat[activity.end], '#f44336', true);
                        }
                    }

                    // 交通分段绘制
                    if (activity.transports && Array.isArray(activity.transports)) {
                        for (const t of activity.transports) {
                            if (t.start && t.end && locationToLngLat[t.start] && locationToLngLat[t.end]) {
                                await drawRoute(locationToLngLat[t.start], locationToLngLat[t.end], t.mode);
                            }
                        }
                    }
                }
            }
            
            // 最后再自适应一次视野以包含路线
            setTimeout(() => map.setFitView(), 500);
        } catch (err) {
            console.error("处理行程数据时发生错误:", err);
            showEmptyMapMessage('地图渲染出错，请检查控制台日志。');
        }
    }

    // 5. 启动流程
    async function init() {
        console.log('开始获取行程数据...');
        
        // 显示加载提示
        document.getElementById('map-container').innerHTML = 
            '<div style="text-align:center; margin-top:200px; color:#1890ff; font-size: 16px;">正在加载行程数据与地图资源，请稍候...</div>';
            
        const tripData = await fetchTripFromBackend();
        
        if (tripData && tripData.itinerary) {
            console.log('获取到行程数据，开始解析...', tripData.itinerary);
            
            // 更新提示为正在解析坐标
            document.getElementById('map-container').innerHTML = 
                '<div style="text-align:center; margin-top:200px; color:#1890ff; font-size: 16px;">正在解析行程坐标 (可能需要几秒钟)，请稍候...</div>';
                
            // 因为我们要往 map-container 里画图，必须先把地图重新初始化回来，否则 AMap 找不到容器
            document.getElementById('map-container').innerHTML = '';
            // 重新初始化地图实例，因为上面的 innerHTML 清空了原来的 canvas
            map = new AMap.Map('map-container', {
                zoom: 5,
                center: [104.195397, 35.86166], // 中国中心点附近
                resizeEnable: true
            });
            
            // 重新绑定控件
            AMap.plugin(['AMap.ToolBar', 'AMap.Scale'], function() {
                map.addControl(new AMap.ToolBar());
                map.addControl(new AMap.Scale());
            });
            
            await processAndRenderItinerary(tripData.itinerary);
        } else {
            console.log('未获取到行程数据');
            // 在地图容器中显示提示
            document.getElementById('map-container').innerHTML = 
                '<div style="text-align:center; margin-top:200px; color:#666;">暂无行程数据，请先去“规划”页面生成。</div>';
        }
    }

    function showEmptyMapMessage(msg) {
        // 在地图中心显示一个提示信息
        var marker = new AMap.Marker({
            position: map.getCenter(),
            map: map
        });
        
        infoWindow.setContent("<div style='padding: 10px;'>" + msg + "</div>");
        infoWindow.open(map, marker.getPosition());
    }

    // 运行初始化
    init();
});