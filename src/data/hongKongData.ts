type RawSpot = {
  name: string;
  english_name: string;
  address: string;
  lat: number | null;
  lon: number | null;
  description: string;
};

const rawSpots = require("./hongKongSpots.json") as RawSpot[];

const spotIds = [
  "mong-kok",
  "yau-ma-tei",
  "tsim-sha-tsui",
  "central",
  "the-peak",
  "causeway-bay",
  "avenue-of-stars",
  "star-ferry",
  "mid-levels-escalator",
  "central-pier-7",
  "tai-tam-reservoir",
  "turtle-cove",
  "stanley",
  "repulse-bay",
  "aberdeen",
  "kennedy-town",
  "sai-ying-pun",
  "sham-shui-po",
  "nathan-road",
  "victoria-harbour",
  "sheung-wan",
  "hk-palace-museum",
  "yau-ma-tei-police-station",
  "temple-street",
  "cookies-quartet-mong-kok",
  "chungking-mansions",
  "golden-bauhinia-square",
  "sai-wan-swimming-shed",
  "tai-kwun",
  "fringe-club",
  "lugard-road-lookout",
  "harbour-city",
  "peninsula-hong-kong",
  "admiralty",
  "ngong-ping-360",
  "tai-o",
  "hk-observation-wheel",
  "central-market",
  "hong-kong-disneyland",
] as const;

const themeById: Record<string, string> = {
  "mong-kok": "九龙夜色",
  "yau-ma-tei": "老九龙",
  "tsim-sha-tsui": "维港南岸",
  central: "港岛核心",
  "the-peak": "山顶视角",
  "causeway-bay": "商圈夜晚",
  "avenue-of-stars": "海滨电影地标",
  "star-ferry": "维港交通",
  "mid-levels-escalator": "坡地城市",
  "central-pier-7": "海滨码头",
  "tai-tam-reservoir": "南区自然",
  "turtle-cove": "海湾慢游",
  stanley: "南区海边",
  "repulse-bay": "城市海湾",
  aberdeen: "港湾旧景",
  "kennedy-town": "港岛西",
  "sai-ying-pun": "港岛西",
  "sham-shui-po": "街头烟火",
  "nathan-road": "九龙主轴",
  "victoria-harbour": "香港总景观",
  "sheung-wan": "老街慢走",
  "hk-palace-museum": "馆藏文化",
  "yau-ma-tei-police-station": "影视打卡",
  "temple-street": "夜市烟火",
  "cookies-quartet-mong-kok": "伴手礼补给",
  "chungking-mansions": "全球化街区",
  "golden-bauhinia-square": "会展海滨",
  "sai-wan-swimming-shed": "海边摄影",
  "tai-kwun": "历史建筑活化",
  "fringe-club": "艺文空间",
  "lugard-road-lookout": "山顶步道",
  "harbour-city": "购物与海景",
  "peninsula-hong-kong": "经典地标酒店",
  admiralty: "港岛转换点",
  "ngong-ping-360": "山海缆车",
  "tai-o": "渔村水乡",
  "hk-observation-wheel": "中环海滨",
  "central-market": "中环更新",
  "hong-kong-disneyland": "主题乐园",
};

const stayById: Record<string, [number, number]> = {
  "mong-kok": [45, 80],
  "yau-ma-tei": [35, 60],
  "tsim-sha-tsui": [60, 100],
  central: [60, 110],
  "the-peak": [75, 120],
  "causeway-bay": [50, 90],
  "avenue-of-stars": [25, 45],
  "star-ferry": [15, 25],
  "mid-levels-escalator": [25, 45],
  "central-pier-7": [10, 20],
  "tai-tam-reservoir": [15, 30],
  "turtle-cove": [25, 45],
  stanley: [60, 120],
  "repulse-bay": [40, 80],
  aberdeen: [30, 60],
  "kennedy-town": [35, 70],
  "sai-ying-pun": [35, 60],
  "sham-shui-po": [45, 80],
  "nathan-road": [20, 40],
  "victoria-harbour": [20, 40],
  "sheung-wan": [35, 60],
  "hk-palace-museum": [90, 150],
  "yau-ma-tei-police-station": [10, 20],
  "temple-street": [35, 70],
  "cookies-quartet-mong-kok": [10, 20],
  "chungking-mansions": [15, 30],
  "golden-bauhinia-square": [15, 30],
  "sai-wan-swimming-shed": [20, 40],
  "tai-kwun": [60, 100],
  "fringe-club": [20, 40],
  "lugard-road-lookout": [35, 60],
  "harbour-city": [45, 90],
  "peninsula-hong-kong": [15, 30],
  admiralty: [20, 40],
  "ngong-ping-360": [120, 180],
  "tai-o": [90, 150],
  "hk-observation-wheel": [20, 35],
  "central-market": [25, 45],
  "hong-kong-disneyland": [360, 540],
};

const ratingById: Record<string, number> = {
  "mong-kok": 4.8,
  "yau-ma-tei": 4.7,
  "tsim-sha-tsui": 4.9,
  central: 4.9,
  "the-peak": 5,
  "causeway-bay": 4.7,
  "avenue-of-stars": 4.8,
  "star-ferry": 4.9,
  "mid-levels-escalator": 4.7,
  "central-pier-7": 4.5,
  "tai-tam-reservoir": 4.2,
  "turtle-cove": 4.4,
  stanley: 4.8,
  "repulse-bay": 4.7,
  aberdeen: 4.4,
  "kennedy-town": 4.7,
  "sai-ying-pun": 4.5,
  "sham-shui-po": 4.7,
  "nathan-road": 4.4,
  "victoria-harbour": 5,
  "sheung-wan": 4.6,
  "hk-palace-museum": 4.8,
  "yau-ma-tei-police-station": 4.2,
  "temple-street": 4.6,
  "cookies-quartet-mong-kok": 4.1,
  "chungking-mansions": 4.3,
  "golden-bauhinia-square": 4.3,
  "sai-wan-swimming-shed": 4.7,
  "tai-kwun": 4.9,
  "fringe-club": 4.4,
  "lugard-road-lookout": 4.9,
  "harbour-city": 4.5,
  "peninsula-hong-kong": 4.7,
  admiralty: 4.3,
  "ngong-ping-360": 4.8,
  "tai-o": 4.8,
  "hk-observation-wheel": 4.5,
  "central-market": 4.4,
  "hong-kong-disneyland": 4.9,
};

const openHoursById: Record<string, string> = {
  "mong-kok": "全天可达",
  "yau-ma-tei": "全天可达",
  "tsim-sha-tsui": "全天可达",
  central: "全天可达",
  "the-peak": "全天可达",
  "causeway-bay": "全天可达",
  "avenue-of-stars": "全天可达",
  "star-ferry": "以天星小轮当日航班为准",
  "mid-levels-escalator": "全天可达",
  "central-pier-7": "全天可达",
  "tai-tam-reservoir": "白天前往更稳妥",
  "turtle-cove": "白天前往更稳妥",
  stanley: "全天可达",
  "repulse-bay": "全天可达",
  aberdeen: "全天可达",
  "kennedy-town": "全天可达",
  "sai-ying-pun": "全天可达",
  "sham-shui-po": "全天可达",
  "nathan-road": "全天可达",
  "victoria-harbour": "全天可达",
  "sheung-wan": "全天可达",
  "hk-palace-museum": "以官方预约时段为准",
  "yau-ma-tei-police-station": "外观全天可看",
  "temple-street": "傍晚后更热闹",
  "cookies-quartet-mong-kok": "以门店营业时间为准",
  "chungking-mansions": "全天可达",
  "golden-bauhinia-square": "全天可达",
  "sai-wan-swimming-shed": "白天前往更稳妥",
  "tai-kwun": "以当日场馆开放时间为准",
  "fringe-club": "以展演安排为准",
  "lugard-road-lookout": "白天到夜景时段都可",
  "harbour-city": "以商场营业时间为准",
  "peninsula-hong-kong": "外观全天可看",
  admiralty: "全天可达",
  "ngong-ping-360": "以缆车运营时间为准",
  "tai-o": "白天前往更稳妥",
  "hk-observation-wheel": "以官方运营时间为准",
  "central-market": "以商场营业时间为准",
  "hong-kong-disneyland": "以乐园当日开园时间为准",
};

const imageKeys = Array.from({ length: 33 }, (_, index) =>
  `spot_detail_image_${String(index + 1).padStart(2, "0")}.png`
);

const imageById = Object.fromEntries(
  spotIds.slice(0, 33).map((id, index) => [id, imageKeys[index]])
) as Record<string, string>;

const imageFallbackById: Record<string, string> = {
  admiralty: imageById["golden-bauhinia-square"],
  "ngong-ping-360": imageById["the-peak"],
  "tai-o": imageById.aberdeen,
  "hk-observation-wheel": imageById["central-pier-7"],
  "central-market": imageById.central,
  "hong-kong-disneyland": imageById["avenue-of-stars"],
};

const regionById: Record<string, string> = {
  "mong-kok": "九龙",
  "yau-ma-tei": "九龙",
  "tsim-sha-tsui": "九龙",
  "sham-shui-po": "九龙",
  "nathan-road": "九龙",
  "yau-ma-tei-police-station": "九龙",
  "temple-street": "九龙",
  "cookies-quartet-mong-kok": "九龙",
  "chungking-mansions": "九龙",
  "harbour-city": "九龙",
  "peninsula-hong-kong": "九龙",
  central: "港岛",
  "the-peak": "港岛",
  "causeway-bay": "港岛",
  "avenue-of-stars": "维港",
  "star-ferry": "维港",
  "mid-levels-escalator": "港岛",
  "central-pier-7": "维港",
  "victoria-harbour": "维港",
  "sheung-wan": "港岛",
  "golden-bauhinia-square": "港岛",
  "kennedy-town": "港岛",
  "sai-ying-pun": "港岛",
  "sai-wan-swimming-shed": "港岛",
  "tai-kwun": "港岛",
  "fringe-club": "港岛",
  "lugard-road-lookout": "港岛",
  admiralty: "港岛",
  "hk-observation-wheel": "港岛",
  "central-market": "港岛",
  "tai-tam-reservoir": "南区",
  "turtle-cove": "南区",
  stanley: "南区",
  "repulse-bay": "南区",
  aberdeen: "南区",
  "hk-palace-museum": "西九龙",
  "ngong-ping-360": "大屿山",
  "tai-o": "大屿山",
  "hong-kong-disneyland": "大屿山",
};

function buildSubtitle(description: string) {
  const sentence = description.replace(/\s+/g, " ").split("。")[0].trim();
  return sentence.length > 34 ? `${sentence.slice(0, 34)}…` : sentence;
}

function mapLabel(name: string) {
  return name.replace(/（.*?）/g, "").trim();
}

function getAreaLine(id: string) {
  switch (regionById[id]) {
    case "九龙":
      return "适合串成地铁+步行的一整段夜色线。";
    case "港岛":
      return "适合边走边切换街区、坡地和历史建筑。";
    case "维港":
      return "黄昏到夜景时段最容易出片。";
    case "南区":
      return "建议白天前往，别把海边段压得太赶。";
    case "西九龙":
      return "更适合预留完整室内参观时间。";
    case "大屿山":
      return "建议单独留一天，不要和市区硬拼同天。";
    default:
      return "建议结合当天片区顺路安排。";
  }
}

const places = Object.fromEntries(
  rawSpots.map((spot, index) => {
    const id = spotIds[index];
    const coords =
      typeof spot.lat === "number" && typeof spot.lon === "number"
        ? ([spot.lat, spot.lon] as [number, number])
        : undefined;

    return [
      id,
      {
        id,
        name: spot.name,
        mapLabel: mapLabel(spot.name),
        subtitle: buildSubtitle(spot.description),
        theme: themeById[id],
        area: regionById[id],
        address: spot.address,
        coords,
        stay: stayById[id] || [25, 45],
        bestTime:
          regionById[id] === "维港"
            ? "黄昏到夜景时段"
            : regionById[id] === "南区" || regionById[id] === "大屿山"
              ? "白天"
              : "下午到晚上",
        bestFor:
          regionById[id] === "九龙"
            ? "看街头密度、霓虹感和老香港生活层次"
            : regionById[id] === "港岛"
              ? "看坡地城市、商业核心与历史建筑混在一起"
              : regionById[id] === "维港"
                ? "把香港最经典的海景和城市天际线一次看全"
                : regionById[id] === "南区"
                  ? "给高密度城市留一点海边和山路的呼吸感"
                  : regionById[id] === "西九龙"
                    ? "排一段完整的室内文化参观"
                    : "把香港从城市核心拉向山海和离岛",
        overview: [spot.description],
        text: spot.description,
        tags: [regionById[id], themeById[id], spot.english_name].filter(Boolean),
        travel: getAreaLine(id),
        tips:
          regionById[id] === "维港"
            ? ["尽量把黄昏留给这一带。", "风大时拍照和等船都要留一点时间。"]
            : regionById[id] === "南区"
              ? ["建议穿轻便鞋，海边和坡路切换会比较多。", "天气太闷或太晒时，先看交通再决定是否拉长停留。"]
              : regionById[id] === "大屿山"
                ? ["这一段最好单独成天，不要和中环夜景硬塞同一天。", "缆车或船班遇天气变化时要预留机动时间。"]
                : ["把地铁口、街角和转场时间一起算进去，体验会更顺。"] ,
      },
    ];
  })
) as Record<string, any>;

const placeMedia = Object.fromEntries(
  spotIds.map((id) => [
    id,
    {
      image: imageById[id] || imageFallbackById[id] || imageById.central,
    },
  ])
);

const spotGuideMeta = Object.fromEntries(
  spotIds.map((id) => [
    id,
    {
      rating: ratingById[id] || 4.4,
      openHours: openHoursById[id] || "以现场安排为准",
    },
  ])
);

const routeDefinitions = [
  {
    id: "one-day",
    label: "一日游",
    badge: "香港一日游",
    days: "1 天",
    stopLabel: "途径点",
    modeLabel: "出行方式",
    mode: "地铁 + 步行",
    fit: "第一次来港",
    note: "适合用一天时间先把香港最具代表性的城市风貌走一遍。",
    mapKicker: "一日路线",
    headline: "一日打卡香港经典街巷、维港海景与中环天际线",
    lead:
      "从旺角、油麻地的市井街巷出发，沿尖沙咀海滨漫步，一路打卡中环与太平山顶，最终在铜锣湾收尾，适合第一次来港的游客，用一天时间走遍香港最具代表性的城市风貌。",
    heroImage: imageById["mong-kok"],
    stops: [
      "mong-kok",
      "yau-ma-tei",
      "tsim-sha-tsui",
      "central",
      "the-peak",
      "causeway-bay",
    ],
    panels: [
      {
        title: "路线气质",
        body: "这条线把老九龙、维港海景、港岛核心和夜间商圈压在同一天里，节奏快，但辨识度最高。",
      },
      {
        title: "最适合谁",
        body: "适合第一次来香港、时间只有一天，又想先把“香港为什么像香港”这件事看明白的人。",
      },
      {
        title: "要留意什么",
        body: "白天不要在前半段停得太满，山顶和铜锣湾都更吃傍晚后的时段。",
      },
    ],
    chapters: [
      {
        step: "01",
        title: "先从九龙街巷进入状态",
        body: "旺角和油麻地负责把香港最直接的街头密度、招牌感和生活噪音先推到眼前。",
      },
      {
        step: "02",
        title: "尖沙咀把海景和商圈压到一起",
        body: "这一段是从街区切向海滨的转场，适合开始把维港视角放进整天的记忆里。",
      },
      {
        step: "03",
        title: "中环与山顶给城市一个完整轮廓",
        body: "从地面商业核走到高处观景台，会把香港的坡地城市感和天际线一起补齐。",
      },
      {
        step: "04",
        title: "铜锣湾收尾，把节奏重新拉回夜晚",
        body: "最后在高密度商圈里结束，会让这条线从观景回到消费与城市活力本身。",
      },
    ],
    schedule: [
      {
        phase: "上午",
        title: "旺角、油麻地",
        body: "先把老九龙的街区感走出来，早点到的话街面节奏更好控制。",
      },
      {
        phase: "下午",
        title: "尖沙咀、中环",
        body: "把海滨视角和港岛核心串起来，尽量不要在商场里耗掉太多时间。",
      },
      {
        phase: "傍晚到夜里",
        title: "太平山顶、铜锣湾",
        body: "把最好的天色留给山顶，夜间再回到铜锣湾收束整天的城市速度。",
      },
    ],
    prep: [
      "地铁换乘会比步行跨区高效，别硬走所有过海段。",
      "山顶建议预留排队和观景时间，别把它挤到太晚。",
      "如果你想留一点购物时间，尖沙咀和铜锣湾二选一会更轻松。",
    ],
  },
  {
    id: "three-day",
    label: "三日游",
    badge: "香港三日游",
    days: "3 天",
    stopLabel: "途径点",
    modeLabel: "出行节奏",
    mode: "分片区游览",
    fit: "第一次认真玩",
    note: "把港岛、老九龙与西九龙拆开走，体验会更完整。",
    mapKicker: "三日路线",
    headline: "三天深度游，分片区解锁港岛、老九龙与西九龙",
    lead:
      "Day1 打卡港岛核心与港岛西，Day2 串联深水埗、油麻地、旺角与维港南岸的老九龙烟火气，Day3 慢逛上环老街与西九龙文化区，轻松收尾。",
    heroImage: imageById.central,
    stops: [
      "central",
      "kennedy-town",
      "sai-ying-pun",
      "tsim-sha-tsui",
      "sham-shui-po",
      "yau-ma-tei",
      "mong-kok",
      "nathan-road",
      "victoria-harbour",
      "sheung-wan",
      "hk-palace-museum",
    ],
    panels: [
      {
        title: "路线气质",
        body: "不再把香港压成一天，而是按片区节奏拆开，体验会更完整，也更不累。",
      },
      {
        title: "最适合谁",
        body: "适合第一次来香港但愿意多待几天，希望把街区、海景和文化馆都看进去的人。",
      },
      {
        title: "要留意什么",
        body: "第三天别排太满，文化馆与上环老街最怕被赶时间毁掉节奏。",
      },
    ],
    chapters: [
      {
        step: "01",
        title: "港岛核心与港岛西先立住城市骨架",
        body: "中环、坚尼地城和西营盘会先给你一个更立体的港岛印象。",
      },
      {
        step: "02",
        title: "第二天回到九龙，把地面层香港走出来",
        body: "深水埗、油麻地、旺角与弥敦道会把旧街区、人流和消费密度补齐。",
      },
      {
        step: "03",
        title: "最后用文化馆线把节奏放慢",
        body: "上环与香港故宫文化博物馆更适合作为收尾，让这趟行程从热闹退回到观看和消化。",
      },
    ],
    schedule: [
      {
        phase: "第 1 天",
        title: "中环、坚尼地城、西营盘、尖沙咀",
        body: "先看港岛，再过海到尖沙咀，让第一天就把维港两岸的空间关系看懂。",
      },
      {
        phase: "第 2 天",
        title: "深水埗、油麻地、旺角、弥敦道、维港",
        body: "把九龙主轴压成完整的一天，街区烟火会比第一天更密、更贴地。",
      },
      {
        phase: "第 3 天",
        title: "上环、香港故宫文化博物馆",
        body: "留一整段给西九龙文化区和上环老街，不用再赶跨区打卡。",
      },
    ],
    prep: [
      "三天版本最好把酒店设在地铁换乘更方便的位置。",
      "第二天是最耗体力的一天，午后最好留一段坐下来的时间。",
      "如果天气不好，第三天可以把文化馆线放到最前面。",
    ],
  },
  {
    id: "five-day",
    label: "五日游",
    badge: "香港五日游",
    days: "5 天",
    stopLabel: "途径点",
    modeLabel: "出行节奏",
    mode: "城市 + 南区 + 大屿山",
    fit: "第一次长一点地待在香港",
    note: "适合用更从容的节奏，把香港街区、海湾、山海和离岛都走进去。",
    mapKicker: "五日路线",
    headline: "五天从容漫游，解锁香港街区、海湾、山海与离岛的多元风貌",
    lead:
      "先逛遍港岛与九龙的城市烟火，再奔赴南区海湾与大屿山的山海风光，最后在中环海滨与老建筑里慢收尾，用从容节奏玩透香港的多样魅力。",
    heroImage: imageById["victoria-harbour"],
    stops: [
      "mong-kok",
      "yau-ma-tei",
      "nathan-road",
      "tsim-sha-tsui",
      "harbour-city",
      "peninsula-hong-kong",
      "avenue-of-stars",
      "kennedy-town",
      "sai-ying-pun",
      "admiralty",
      "repulse-bay",
      "stanley",
      "ngong-ping-360",
      "tai-o",
      "hk-observation-wheel",
      "fringe-club",
      "tai-kwun",
      "sheung-wan",
      "central-market",
      "star-ferry",
    ],
    panels: [
      {
        title: "路线气质",
        body: "它不再只是看地标，而是把香港城市节奏和山海留白都放进来。",
      },
      {
        title: "最适合谁",
        body: "适合第一次来香港就想一次把经典区、南区海边和大屿山都覆盖的人。",
      },
      {
        title: "要留意什么",
        body: "第四天的大屿山必须单独看待，第五天才适合再回到中环收尾。",
      },
    ],
    chapters: [
      {
        step: "01",
        title: "先用九龙和尖沙咀把城市节奏拉满",
        body: "前两天把最典型的香港街面、维港和商圈先走出来，后面就更能放心放慢。",
      },
      {
        step: "02",
        title: "第三天把速度交给南区海湾",
        body: "从金钟转到浅水湾和赤柱，香港会从高密度突然切成海边尺度。",
      },
      {
        step: "03",
        title: "第四天交给大屿山",
        body: "昂坪和大澳不适合塞进短日程，单独成天才会有完整体验。",
      },
      {
        step: "04",
        title: "最后一天回到中环海滨做漂亮收尾",
        body: "把摩天轮、艺穗会、大馆、上环、中环街市和天星小轮连起来，会很像一趟城市漫游版的谢幕。",
      },
    ],
    schedule: [
      {
        phase: "第 1 天",
        title: "旺角、油麻地、弥敦道",
        body: "先把九龙主轴踩熟，晚上不用再折返。",
      },
      {
        phase: "第 2 天",
        title: "尖沙咀、海港城、半岛酒店、星光大道、坚尼地城、西营盘",
        body: "把海滨和港岛西放在同一天，城市层次会很明显。",
      },
      {
        phase: "第 3 天",
        title: "金钟、浅水湾、赤柱",
        body: "这一天故意留白，给香港南区更轻松的海边节奏。",
      },
      {
        phase: "第 4 天",
        title: "昂坪 360、大澳",
        body: "用整天完成大屿山，不跟中环和九龙混排。",
      },
      {
        phase: "第 5 天",
        title: "香港摩天轮、艺穗会、大馆、上环、中环街市、天星小轮",
        body: "最后回到中环海滨与老建筑，用一条更松弛的线把整趟收回来。",
      },
    ],
    prep: [
      "五天版本不用所有景点都打满，宁可留一点机动时间给天气和夜景。",
      "南区和大屿山那两天更吃交通衔接，别拖到太晚出门。",
      "如果你想加购物，优先放在第一天或第二天，不要占掉大屿山当天。",
    ],
  },
];

const routes = routeDefinitions.map((route) => ({
  ...route,
  chapters: route.chapters,
  schedule: route.schedule,
  prep: route.prep,
  panels: route.panels,
}));

const galleryItems = [
  {
    kicker: "九龙夜色",
    title: "从旺角到油麻地，先进入香港最直接的街头密度",
    note: "这一组画面决定了你会不会立刻进入“这就是香港”的情绪里。",
    image: imageById["mong-kok"],
    spotIds: ["mong-kok", "yau-ma-tei", "nathan-road"],
  },
  {
    kicker: "维港海滨",
    title: "尖沙咀与天星小轮是最稳的维港入门方式",
    note: "先看海岸线，再过海，维港会从照片背景变成一条真实的水路。",
    image: imageById["avenue-of-stars"],
    spotIds: ["avenue-of-stars", "star-ferry", "victoria-harbour"],
  },
  {
    kicker: "港岛核心",
    title: "中环不是一个点，而是一整套坡地城市体验",
    note: "扶梯、大馆、街市和中环海滨都围着它转。",
    image: imageById.central,
    spotIds: ["central", "mid-levels-escalator", "tai-kwun", "central-market"],
  },
  {
    kicker: "山顶视角",
    title: "太平山顶和卢吉道决定了香港天际线的上限",
    note: "想看白天层次和夜景灯海，这里都值得留时段。",
    image: imageById["the-peak"],
    spotIds: ["the-peak", "lugard-road-lookout"],
  },
  {
    kicker: "南区海边",
    title: "浅水湾、赤柱和香港仔会把香港切到另一种呼吸频率",
    note: "这一段让香港不再只是霓虹和商场。",
    image: imageById.stanley,
    spotIds: ["repulse-bay", "stanley", "aberdeen"],
  },
  {
    kicker: "大屿山",
    title: "昂坪与大澳适合单独留一天，不适合硬塞进市区行程",
    note: "缆车、山海与渔村一起出现时，香港的边界会被拉开。",
    image: imageFallbackById["ngong-ping-360"],
    spotIds: ["ngong-ping-360", "tai-o", "hong-kong-disneyland"],
  },
];

const lonelyPlanetHighlights = [
  {
    source: "城市气质",
    title: "先住进维港的节奏里",
    text: "如果你第一次来香港，不一定要先冲购物，先把维港两岸和过海方式走通，后面的街区就更容易有整体感。",
    chips: ["维港", "天际线", "过海体验"],
    image: imageById["star-ferry"],
    spotIds: ["avenue-of-stars", "star-ferry", "victoria-harbour", "central-pier-7"],
  },
  {
    source: "街头体验",
    title: "老香港电影感最好从九龙开始",
    text: "旺角、油麻地、庙街和重庆大厦会把香港的街头噪音、人流密度和夜色气味先建立起来。",
    chips: ["旺角", "油麻地", "夜市"],
    image: imageById["mong-kok"],
    spotIds: ["mong-kok", "yau-ma-tei", "temple-street", "chungking-mansions"],
  },
  {
    source: "慢走片区",
    title: "港岛西比想象中更适合慢走",
    text: "坚尼地城、西营盘、上环和中环旧街之间有很强的坡地连贯感，适合把脚步放慢。",
    chips: ["坚尼地城", "上环", "旧街区"],
    image: imageById["kennedy-town"],
    spotIds: ["kennedy-town", "sai-ying-pun", "sheung-wan", "central"],
  },
  {
    source: "山海留白",
    title: "南区能给高密度城市留出海边和风",
    text: "浅水湾、赤柱、龟背湾和香港仔不追高密度打卡，反而更像给整趟香港行程加一段呼吸。",
    chips: ["浅水湾", "赤柱", "香港仔"],
    image: imageById["repulse-bay"],
    spotIds: ["repulse-bay", "stanley", "turtle-cove", "aberdeen"],
  },
  {
    source: "拉开尺度",
    title: "如果你有整天，优先把大屿山单独拿出来",
    text: "昂坪、大澳和迪士尼都不适合塞进中环或尖沙咀当天，独立成天才不会让体验变形。",
    chips: ["昂坪", "大澳", "离岛节奏"],
    image: imageFallbackById["ngong-ping-360"],
    spotIds: ["ngong-ping-360", "tai-o", "hong-kong-disneyland"],
  },
];

const cityRecommendations = [
  {
    title: "一日游替代线：海滨 + 中环 + 山顶",
    area: "适合第一次来但更想把维港走顺",
    text: "把星光大道、天星小轮、中环、半山扶梯、太平山顶和铜锣湾连成一条更顺的经典线，海景和坡地感会更强。",
    schedule: [
      "星光大道",
      "天星小轮",
      "中环",
      "中环至半山自动扶手电梯",
      "太平山顶",
      "铜锣湾",
    ],
    image: imageById["avenue-of-stars"],
    spotIds: [
      "avenue-of-stars",
      "star-ferry",
      "central",
      "mid-levels-escalator",
      "the-peak",
      "causeway-bay",
    ],
  },
  {
    title: "一日游替代线：南区海湾",
    area: "适合第二次来，想把香港从海边开始看",
    text: "从中环 7 号码头出发，绕到大潭、龟背湾、赤柱、浅水湾和香港仔，会得到一条更松弛也更有天气感的路线。",
    schedule: [
      "中环 7 号码头",
      "大潭水塘道休憩处",
      "龟背湾泳滩",
      "赤柱",
      "浅水湾",
      "香港仔",
    ],
    image: imageById["repulse-bay"],
    spotIds: [
      "central-pier-7",
      "tai-tam-reservoir",
      "turtle-cove",
      "stanley",
      "repulse-bay",
      "aberdeen",
    ],
  },
  {
    title: "三日游替代线：电影感 + 港岛西 + 迪士尼",
    area: "适合城市体验和乐园都想兼顾",
    text: "第一天把油麻地、庙街、重庆大厦、星光大道和铜锣湾压在一起，第二天走港岛西与中环，第三天整天留给迪士尼。",
    schedule: [
      "香港故宫文化博物馆、油麻地警署、庙街、重庆大厦、星光大道、金紫荆广场、铜锣湾、天星小轮",
      "西环钟声泳棚、坚尼地城、中环、半山扶梯、大馆、艺穗会、太平山顶、卢吉道",
      "香港迪士尼乐园",
    ],
    image: imageById["tai-kwun"],
    spotIds: [
      "hk-palace-museum",
      "temple-street",
      "chungking-mansions",
      "avenue-of-stars",
      "golden-bauhinia-square",
      "causeway-bay",
      "sai-wan-swimming-shed",
      "kennedy-town",
      "central",
      "mid-levels-escalator",
      "tai-kwun",
      "fringe-club",
      "the-peak",
      "lugard-road-lookout",
      "hong-kong-disneyland",
    ],
  },
];

const regionDefinitions = [
  {
    id: "kowloon",
    title: "九龙街区",
    meta: "旺角、油麻地、尖沙咀、深水埗",
    intro:
      "如果你想先看老香港电影感、夜市、招牌和高密度街区，这一组最直接。白天和夜里都能走，但夜间辨识度更强。",
    spotIds: [
      "mong-kok",
      "yau-ma-tei",
      "sham-shui-po",
      "nathan-road",
      "temple-street",
      "yau-ma-tei-police-station",
      "cookies-quartet-mong-kok",
      "chungking-mansions",
      "tsim-sha-tsui",
      "harbour-city",
      "peninsula-hong-kong",
    ],
  },
  {
    id: "harbour",
    title: "维港海滨",
    meta: "星光大道、天星小轮、码头、摩天轮",
    intro:
      "这一组负责把香港的总景观立住。海滨步行、过海、水面视角和中环海边的公共空间都在这里。",
    spotIds: [
      "avenue-of-stars",
      "star-ferry",
      "central-pier-7",
      "victoria-harbour",
      "golden-bauhinia-square",
      "hk-observation-wheel",
    ],
  },
  {
    id: "hk-island-core",
    title: "港岛核心",
    meta: "中环、上环、金钟、铜锣湾",
    intro:
      "港岛核心更适合看坡地城市、历史建筑活化、商业核心与旧街更新同时出现的状态。",
    spotIds: [
      "central",
      "mid-levels-escalator",
      "tai-kwun",
      "fringe-club",
      "sheung-wan",
      "central-market",
      "admiralty",
      "causeway-bay",
    ],
  },
  {
    id: "hk-island-west",
    title: "港岛西与山顶",
    meta: "坚尼地城、西营盘、西环钟声泳棚、太平山顶",
    intro:
      "这条组更适合慢走和摄影。它的魅力不在于单点打卡，而在于街区、海边和高处视野之间的切换。",
    spotIds: [
      "kennedy-town",
      "sai-ying-pun",
      "sai-wan-swimming-shed",
      "the-peak",
      "lugard-road-lookout",
    ],
  },
  {
    id: "south-side",
    title: "南区海湾",
    meta: "浅水湾、赤柱、香港仔、龟背湾",
    intro:
      "当你觉得香港太密、太快时，南区这组会把节奏拉开。海湾、渔港和海边小镇感都在这里。",
    spotIds: [
      "tai-tam-reservoir",
      "turtle-cove",
      "repulse-bay",
      "stanley",
      "aberdeen",
    ],
  },
  {
    id: "culture-lantau",
    title: "文化与大屿山",
    meta: "故宫、昂坪、大澳、迪士尼",
    intro:
      "如果你不只想看街区，也想把文化馆线和大屿山单独排进去，这组会更像真正的长线行程。",
    spotIds: [
      "hk-palace-museum",
      "ngong-ping-360",
      "tai-o",
      "hong-kong-disneyland",
    ],
  },
];

const regionalSpotCollections = regionDefinitions.map((section) => ({
  id: section.id,
  title: section.title,
  meta: section.meta,
  intro: section.intro,
  spots: section.spotIds.map((spotId) => ({
    ...places[spotId],
    source: section.title,
    text: places[spotId].overview[0],
  })),
}));

const sourceLinks = [
  {
    label: "香港旅游方案.docx",
    note: "本地文档，包含 1 日、3 日、5 日行程与景点清单。",
    url: "本地资料 / 香港旅游方案.docx",
  },
  {
    label: "hong_kong_spot_details_with_address.json",
    note: "本地 JSON，提供 39 个点位的中英文名称、地址、坐标与简介。",
    url: "本地资料 / hong_kong_spot_details_with_address.json",
  },
  {
    label: "hk_spot_detail_images",
    note: "本地图片包，已转入应用资源并用于路线、图册和详情卡。",
    url: "本地资料 / hk_spot_detail_images",
  },
];

export const hongKongData = {
  places,
  routes,
  sourceLinks,
  galleryItems,
  lonelyPlanetHighlights,
  cityRecommendations,
  regionalSpotCollections,
  placeMedia,
  spotGuideMeta,
  placeImageOverrides: {},
  spotImageOverrides: imageFallbackById,
  ratingMethodNote:
    "页面里的导览评分是为了帮助你排优先级，不是某一家平台分数。高分通常代表它更适合第一次来香港、辨识度更强，或更值得占用黄金时段。",
  openingHoursMethodNote:
    "街区、海滨、海湾这类开放空间标成“全天可达”；馆舍、乐园、缆车和门店类内容统一写成“以官方当日安排为准”，出发前再看一次官方信息会更稳妥。",
  hongKongCenter: [22.28194, 114.15806] as [number, number],
};
