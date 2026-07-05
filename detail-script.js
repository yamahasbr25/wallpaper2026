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
                // Mengarahkan tombol ke halaman download khusus
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
        // ALGORITMA MASTER FILTER ANTI-KEMBAR
        // ==========================================
        async function buildContent() {
            const [relatedApi, randomTxt] = await Promise.all([fetchRelated(), fetchRandom()]);
            
            let randomPool = randomTxt.filter(k => k.toLowerCase() !== keyword.toLowerCase());
            randomPool.sort(() => Math.random() - 0.5); // Acak cadangan
            
            const usedImageUrls = new Set();
            
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

            // 1. Eksekusi 10 Related
            let finalRelated = [];
            let r1 = relatedApi.map(k => k.replace(/wallpaper/gi, '').trim()).filter(k => k);
            
            for (let k of r1) {
                if (finalRelated.length >= 10) break;
                let data = getUniqueData(k);
                if (data) {
                    finalRelated.push(data);
                } else {
                    // JIKA KEMBAR -> Lompati dan ambil dari keyword.txt
                    while(randomPool.length > 0) {
                        let backupKw = randomPool.pop();
                        let backupData = getUniqueData(backupKw);
                        if (backupData) {
                            finalRelated.push(backupData);
                            break;
                        }
                    }
                }
            }
            
            // Tambal darurat
            let i = 1;
            while (finalRelated.length < 10) { 
                let data = getUniqueData(`${keyword} aesthetic ${i++}`);
                if (data) finalRelated.push(data);
            }
            renderGrid(finalRelated, 'related-wallpapers-container');

            // 2. Eksekusi 10 Random
            let finalRandom = [];
            while (finalRandom.length < 10 && randomPool.length > 0) {
                let rk = randomPool.pop();
                let data = getUniqueData(rk);
                if (data) finalRandom.push(data);
            }
            
            let j = 1;
            while (finalRandom.length < 10) { 
                let data = getUniqueData(`cool background ${j++}`);
                if (data) finalRandom.push(data);
            }
            renderGrid(finalRandom, 'random-wallpapers-container');
        }

        buildContent();
    }
});
