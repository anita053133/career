const { createApp, ref, computed, watch, nextTick, onMounted } = Vue;

Chart.register(ChartDataLabels);

// --- 動態生成展開的牌卡資料 (不再包含 "/"，每個職業獨立一張牌卡) ---
const rawData = {
    R: '家具組裝人員,營造工程人員,水電維修技師,設備工程師,駕駛員,消防員,模型師,按摩師,生產線作業人員,檢驗人員,運動人員,隨扈安全人員,餐飲服務員,房務員,廚師,烘焙師,務農者,動物保育員',
    I: '教授,研究員,立法法院法案助理,電影評論員,程式設計師,AI 工程師,律師,法官,醫師,刑事鑑識人員,精算師,結構工程技師,巨量資料分析師,投資分析師,生物科技研究員,農業技術研究員,市場調查人員,民意調查人員',
    S: '社會工作人員,就業服務人員,人資工作者,職涯發展師,教師,教練,幼兒保育員,照顧服務員,門市人員,接待人員,職能治療師,生命禮儀師,心理師,輔導教師,調節員,客服人員,民宿飯店管家,社區總幹事',
    C: '倉管人員,收納整理師,稽核人員,電玩測試員,品管人員,銀行行員,記者,編輯,視覺圖像紀錄師,收銀人員,會計人員,行政人員,公務員,財務管理人員,資訊安全工程師,主管秘書,物流管理人員,營運管理人員,生產管理人員',
    A: 'UI/UX 設計師,工業設計師,編劇,特效設計師,行銷企劃,廣告企劃,產品研發人員,遊戲設計師,旅遊規劃師,婚禮規劃師,調酒師,造型師,美術設計師,服務設計師,珠寶鑑定師,藝術經紀人,演員,歌手,街頭藝人',
    E: '創業者,企管顧問,導演,船長,節目企劃,活動企劃,業務人員,購物節目主持人,自媒體經營者,環境教育人員,公關人員,演藝宣傳人員,專案管理師,工地主任,策展人員,商場營運專員,採購人員,外交人員'
};

const initialCards = [];
let cardId = 1;
for (const [type, str] of Object.entries(rawData)) {
    str.split(',').forEach(role => {
        initialCards.push({ id: cardId++, text: role.trim(), type });
    });
}

// --- Traits Dictionary (包含細節行為特徵) ---
const traitData = {
    R: { 
        name: '實做型', subtitle: '實作派 / 身體感強 / 做中學', quote: '你的動手能力，是解決問題最直接的利器。',
        behaviors: [
            { title: '喜歡動手實作', desc: '偏好操作型學習，如做模型、裝配、實驗等。' },
            { title: '習慣用身體記憶', desc: '透過動作/實作強化記憶，較不愛長篇文字。' },
            { title: '重視實用與結果', desc: '會問「做這個有什麼用？」，喜歡具體目標。' },
            { title: '較不愛理論推演', desc: '對抽象概念興趣低，需用實例轉譯理解。' }
        ]
    },
    I: { 
        name: '研究型', subtitle: '分析派 / 邏輯強 / 探索知識', quote: '當你能把複雜的事說清楚， পরীক্ষ就是你被需要的時刻。', // wait original quote was "當你能把複雜的事說清楚，就是你被需要的時刻。" Let me fix that.
        behaviors: [
            { title: '喜歡問「為什麼」', desc: '思考型，對知識探索充滿好奇。' },
            { title: '擅長邏輯與分析', desc: '喜歡拆解問題、驗證假設、閱讀資料。' },
            { title: '偏好獨立作業', desc: '習慣自己研究、設計解法，較不喜群體討論。' },
            { title: '需要理解才行動', desc: '不喜歡只照做，重視知識背後的結構與原理。' }
        ]
    },
    // Fix typo in quote locally right away
};
traitData.I.quote = '當你能把複雜的事說清楚，就是你被需要的時刻。';

Object.assign(traitData, {
    A: { 
        name: '藝術型', subtitle: '創意派 / 表達型 / 不愛制式', quote: '創造力無需被解釋，只需要被展現。',
        behaviors: [
            { title: '喜歡創作與表達', desc: '用圖像、文字、聲音傳達內在想法。' },
            { title: '不愛制式規範', desc: '抗拒「標準答案」，偏好自由選擇與發揮。' },
            { title: '情感細膩、想像力強', desc: '擅捕捉氛圍與意境，思維跳躍有創意。' },
            { title: '表達方式多元', desc: '可透過詩、繪畫、影片、造型表現自我。' }
        ]
    },
    S: { 
        name: '社交型', subtitle: '關懷派 / 溫暖型 / 人際互動', quote: '你的溫柔與在意，是團隊最穩定的情感力量。',
        behaviors: [
            { title: '擅長傾聽與陪伴', desc: '能理解他人感受，是團體中的溫柔支持者。' },
            { title: '喜歡合作與互動', desc: '習慣從交流中學習，偏好小組型任務。' },
            { title: '對人際關係敏感', desc: '在意他人感受與氛圍，善察言觀色。' },
            { title: '喜歡幫助他人', desc: '做服務性任務時會特別投入與有成就感。' }
        ]
    },
    E: { 
        name: '企業型', subtitle: '目標派 / 帶動型 / 外向行動型', quote: '你帶的不是聲音，是讓事情開始的力量。',
        behaviors: [
            { title: '喜歡主導與帶動', desc: '在團體中容易主動組織或提議行動。' },
            { title: '具備目標與野心', desc: '在意成果與進步，善於設定挑戰目標。' },
            { title: '說服力強', desc: '能用語言影響他人，適合公開發表或簡報。' },
            { title: '喜歡表現自我', desc: '熱衷被看見或肯定，有展演或競賽動機。' }
        ]
    },
    C: { 
        name: '常規型', subtitle: '穩定派 / 細節型 / 紀律執行', quote: '你的細心和穩定，是整個團隊可以依賴的力量。',
        behaviors: [
            { title: '條理分明', desc: '做事有邏輯、有先後順序，習慣按步驟執行任務。' },
            { title: '喜歡固定結構', desc: '傾向重複的日常節奏，有明確流程會讓他更安心。' },
            { title: '擅長記錄與整理', desc: '習慣使用筆記、表格、清單工具，擅資訊統整。' },
            { title: '注重規則與責任', desc: '願意承擔行政類、紀錄類、協助型任務。' }
        ]
    }
});

// --- Array Shuffle Helper ---
const shuffleArray = (array) => {
    let result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// --- Vue App Setup ---
const app = createApp({
    setup() {
        // Phases -> 1: Discovery, 2: Selection, 3: Report & Conversion, 4: Thank You
        const currentPhase = ref(1); 
        const nickname = ref('');
        const randomizedCards = ref([]);
        const selectedCards = ref([]);
        
        // Report specific data
        const topThreeCode = ref('');
        const topThreeTraits = ref([]);
        let chartInstance = null;

        // Conversion Phase states
        const email = ref('');
        const wantReport = ref(false);
        const isSubmitting = ref(false);

        // Watch phase changes to automatically scroll top
        watch(currentPhase, () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // 階段一：開始測驗
        const startSelection = () => {
            if (!nickname.value.trim()) return;
            selectedCards.value = [];
            randomizedCards.value = shuffleArray(initialCards);
            currentPhase.value = 2;
        };

        // 階段二：挑選牌卡
        const toggleCard = (card) => {
            const idx = selectedCards.value.indexOf(card.id);
            if (idx > -1) {
                selectedCards.value.splice(idx, 1);
            } else {
                if (selectedCards.value.length < 12) {
                    selectedCards.value.push(card.id);
                } else {
                    return;
                }
            }
        };

        // 從挑選牌卡進入報告 (Phase 3)
        const triggerPhase3 = () => {
            if (selectedCards.value.length < 10 || selectedCards.value.length > 12) return;
            
            // 計算 RIASEC 各類型數量
            const typeCounts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
            selectedCards.value.forEach(id => {
                const card = initialCards.find(c => c.id === id);
                if (card) typeCounts[card.type]++;
            });

            // 排序找前三高分
            const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
            
            // 擷取前三碼核心密碼
            topThreeCode.value = sortedTypes.slice(0, 3).map(x => x[0]).join('');
            
            // 準備特質診斷資料
            topThreeTraits.value = sortedTypes.slice(0, 3).map(x => ({
                code: x[0],
                ...traitData[x[0]]
            }));

            // 進入階段三
            currentPhase.value = 3;

            // 使用 setInterval 解決 Vue Transition out-in 造成的元件未掛載問題
            const checkCanvas = setInterval(() => {
                const ctx = document.getElementById('pieChart');
                if (ctx) {
                    clearInterval(checkCanvas);
                    initChart(sortedTypes, selectedCards.value.length, ctx);
                }
            }, 50);
        };

        // 繪製圓餅圖 Logic
        const initChart = (sortedTypes, totalCount, ctx) => {
            if (chartInstance) {
                chartInstance.destroy();
            }

            const activeTypes = sortedTypes.filter(x => x[1] > 0);
            const labels = activeTypes.map(x => x[0] + ' ' + traitData[x[0]].name);
            const data = activeTypes.map(x => Math.round((x[1] / totalCount) * 100));

            const baseColors = ['#0F172A', '#1E3A8A', '#3B82F6', '#94A3B8', '#CBD5E1', '#E2E8F0'];

            chartInstance = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: baseColors.slice(0, activeTypes.length),
                        borderWidth: 2,
                        borderColor: '#F8FAFC' // Surface color for gaps
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: { family: "'Inter', 'Noto Sans TC', sans-serif", size: 13, weight: 'bold' },
                                color: '#0F172A',
                                padding: 20,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            backgroundColor: '#0F172A',
                            padding: 12,
                            titleFont: { family: "'Inter', 'Noto Sans TC', sans-serif", size: 14 },
                            bodyFont: { family: "'Inter', 'Noto Sans TC', sans-serif", size: 14 },
                            callbacks: {
                                label: function(context) {
                                    return ` 佔比: ${context.parsed}%`;
                                }
                            }
                        },
                        datalabels: {
                            color: '#ffffff',
                            font: { weight: 'bold', size: 16, family: "'Inter', sans-serif" },
                            formatter: (value) => {
                                return value > 0 ? value + '%' : '';
                            }
                        }
                    }
                }
            });
        };

        // 提交表單進入感謝頁面 (Phases 3 -> 4)
        const submitData = async () => {
            isSubmitting.value = true;

            // 格式化 10~12 張牌卡清單
            const cardListStr = selectedCards.value.map((id, index) => {
                const c = initialCards.find(card => card.id === id);
                return `${index + 1}. ${c?.text}`;
            }).join('\n');

            // 計算精確的六大維度百分比物件
            const typeCounts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
            selectedCards.value.forEach(id => {
                const card = initialCards.find(c => c.id === id);
                if (card) typeCounts[card.type]++;
            });
            const totalCount = selectedCards.value.length;
            const resultsObj = {};
            for (let t in typeCounts) {
                resultsObj[t] = Math.round((typeCounts[t] / totalCount) * 100) + '%';
            }

            const params = new URLSearchParams();
            params.append('nickname', nickname.value);
            params.append('email', wantReport.value ? email.value : '');
            params.append('topThree', topThreeCode.value);
            params.append('results', JSON.stringify(resultsObj));
            params.append('cardList', cardListStr);

            const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwALvZ_qRG8CBrPiHF_X5lcz80Q64uoYAmM9rUJj4XajEtep2LxgNl2neqqK7OOmgtVPA/exec';
            
            try {
                // 改以 x-www-form-urlencoded 發送，讓 GAS 可以透過 e.parameter 讀取每個欄位
                await fetch(WEB_APP_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params.toString()
                });
            } catch (err) {
                console.error('Submission error:', err);
            } finally {
                isSubmitting.value = false;
                // 不論是否跨域錯誤，都進入 Thank You page
                currentPhase.value = 4;
            }
        };

        // 重置測驗
        const resetQuiz = () => {
            currentPhase.value = 1;
            nickname.value = '';
            email.value = '';
            wantReport.value = false;
            selectedCards.value = [];
        };

        return {
            currentPhase,
            nickname,
            randomizedCards,
            selectedCards,
            topThreeCode,
            topThreeTraits,
            startSelection,
            toggleCard,
            triggerPhase3,
            resetQuiz,
            // Conversion Phase
            email,
            wantReport,
            isSubmitting,
            submitData
        };
    }
});

app.mount('#app');
