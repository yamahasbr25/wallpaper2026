document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const keywordFromQuery = params.get('q') || '';
    const cleanQuery = keywordFromQuery.replace(/-\d+$/, '');
    
    if (!cleanQuery) {
        runAGC('');
        return;
    }

    const targetHtml = cleanQuery + '.html';

    fetch(targetHtml)
        .then(response => {
            if (!response.ok) throw new Error('Not found');
            return response.text();
        })
        .then(htmlData => {
            if (htmlData.toLowerCase().includes('<html') && !htmlData.toLowerCase().includes('preparing your recipe') && !htmlData.toLowerCase().includes('page not found')) {
                document.open();
                document.write(htmlData);
                document.close();
            } else {
                throw new Error('Soft 404');
            }
        })
        .catch(() => {
            const keyword = cleanQuery.replace(/-/g, ' ').trim();
            runAGC(keyword);
        });

    function runAGC(keyword) {
        const detailTitle = document.getElementById('detail-title');
        const detailBody = document.getElementById('detail-body');
        
        if (!keyword) {
            if(detailTitle) detailTitle.textContent = 'Wallpaper Not Found';
            return;
        }

        function capitalize(str) { 
            return str.replace(/\b\w/g, l => l.toUpperCase()); 
        }
        
        const seoTitle = `Aesthetic ${capitalize(keyword)} iPhone Wallpaper 4K`;
        document.title = seoTitle + ' | DecorHouz';
        if(detailTitle) detailTitle.textContent = seoTitle;
        if(detailBody) detailBody.innerHTML = `<p style="text-align:center;">Download the best high-quality <strong>${capitalize(keyword)}</strong> wallpapers for your phone. Explore our collection of perfect 9:16 lockscreen backgrounds below.</p>`;

        // Fungsi Render Grid
        function renderGrid(dataArray, containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            const html = dataArray.map(data => {
                const linkUrl = `detail.html?q=${encodeURIComponent(data.kw.replace(/\s+/g, '-').toLowerCase())}`;
                const downloadPageUrl = `download.html?img=${encodeURIComponent(data.hd)}`;
                
                return `
                <div class="wallpaper-card">
                    <a href="${linkUrl}" class="img-link" title="${capitalize(data.kw)} Wallpaper">
                        <img src="${data.img}" alt="${capitalize(data.kw)}" loading="lazy">
                    </a>
                    <a href="${downloadPageUrl}" target="_blank" class="download-btn">📥 Download</a>
                </div>
                `;
            }).join('');
            
            container.innerHTML = html;
        }

        // Ambil API Google
        function fetchRelated() {
            return new Promise(resolve => {
                const script = document.createElement('script');
                const cb = 'jsonp_' + Date.now() + Math.round(Math.random()*1000);
                
                window[cb] = function(data) {
                    delete window[cb];
                    script.remove();
                    if(data && data[1]) {
                        resolve(data[1].map(i => typeof i === 'string' ? i : i[0]));
                    } else {
                        resolve([]);
                    }
                };
                script.src = `https://suggestqueries.google.com/complete/search?client=youtube&jsonp=${cb}&hl=en&q=${encodeURIComponent(keyword + " wallpaper")}`;
                script.onerror = () => resolve([]);
                document.head.appendChild(script);
                setTimeout(() => resolve([]), 3000); 
            });
        }

        // Ambil File TXT
        function fetchRandom() {
            return fetch('keyword.txt')
                .then(res => res.ok ? res.text() : '')
                .then(txt => {
                    if (txt.includes('<html')) return [];
                    return txt.split('\n').map(l => l.trim()).filter(l => l);
                })
                .catch(() => []);
        }

        // ==========================================
        // ALGORITMA MASTER (3 RELATED + 17 RANDOM)
        // ==========================================
        async function buildContent() {
            const [relatedApi, randomTxt] = await Promise.all([fetchRelated(), fetchRandom()]);
            
            let randomPool = randomTxt.filter(k => k.toLowerCase() !== keyword.toLowerCase());
            randomPool.sort(() => Math.random() - 0.5); // Acak cadangan
            
            const usedImageUrls = new Set();
            const finalList = []; // Penampung ke-20 gambar unik
            
            // Core verifikasi unik link sumber
            function getUniqueData(kwString) {
                let cleanKw = kwString.replace(/wallpaper/gi, '').trim();
                if(!cleanKw) cleanKw = kwString;
                
                let queryImage = cleanKw + " iphone wallpaper";
                let imageUrl = `https://tse1.mm.bing.net/th?q=${encodeURIComponent(queryImage)}&w=720&h=1280&c=7&rs=1&p=0`;
                let hdUrl = `https://tse1.mm.bing.net/th?q=${encodeURIComponent(queryImage)}&w=1080&h=1920&c=7&rs=1&p=0`;
                
                if (!usedImageUrls.has(imageUrl)) {
                    usedImageUrls.add(imageUrl);
                    return { kw: cleanKw, img: imageUrl, hd: hdUrl };
                }
                return null;
            }

            // 1. Eksekusi Related (Maksimal 3 Gambar Saja)
            let r1 = relatedApi.map(k => k.replace(/wallpaper/gi, '').trim()).filter(k => k);
            let relatedCount = 0;
            
            for (let k of r1) {
                if (relatedCount >= 3) break; // Berhenti di 3
                let data = getUniqueData(k);
                if (data) {
                    finalList.push(data);
                    relatedCount++;
                }
            }

            // 2. Sisa kuota (hingga genap 20) dipenuhi dari keyword.txt
            while (finalList.length < 20 && randomPool.length > 0) {
                let rk = randomPool.pop();
                let data = getUniqueData(rk);
                if (data) {
                    finalList.push(data);
                }
            }
            
            // 3. Tambal Darurat jika file txt isinya kurang
            let padIndex = 1;
            while (finalList.length < 20) { 
                let data = getUniqueData(`cool aesthetic background ${padIndex++}`);
                if (data) finalList.push(data);
            }

            // 4. Bagi menjadi 10 atas dan 10 bawah (Agar ad3 pas di tengah)
            const top10 = finalList.slice(0, 10);
            const bottom10 = finalList.slice(10, 20);

            renderGrid(top10, 'related-wallpapers-container');
            renderGrid(bottom10, 'random-wallpapers-container');
        }

        buildContent();
    }
});
