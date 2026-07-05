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
            // Mencegah Soft 404 menimpa halaman menjadi putih/blank
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

        // Fungsi Render Grid Gambar
        function renderGrid(keywords, containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            const html = keywords.map(kw => {
                const queryImage = kw + " iphone wallpaper";
                const imageUrl = `https://tse1.mm.bing.net/th?q=${encodeURIComponent(queryImage)}&w=720&h=1280&c=7&rs=1&p=0`;
                const hdUrl = `https://tse1.mm.bing.net/th?q=${encodeURIComponent(queryImage)}&w=1080&h=1920&c=7&rs=1&p=0`;
                const linkUrl = `detail.html?q=${encodeURIComponent(kw.replace(/\s+/g, '-').toLowerCase())}`;
                
                return `
                <div class="wallpaper-card">
                    <a href="${linkUrl}" class="img-link">
                        <img src="${imageUrl}" alt="${capitalize(kw)} Wallpaper" loading="lazy">
                    </a>
                    <a href="${hdUrl}" target="_blank" download class="download-btn">📥 Download HD</a>
                </div>
                `;
            }).join('');
            
            container.innerHTML = html;
        }

        // Ambil Google Suggest secara Paksa (Anti-Crash)
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
                
                // Batas waktu 3 detik agar halaman tidak macet
                setTimeout(() => resolve([]), 3000); 
            });
        }

        // Ambil random keyword.txt secara Paksa (Anti-Crash)
        function fetchRandom() {
            return fetch('keyword.txt')
                .then(res => res.ok ? res.text() : '')
                .then(txt => {
                    if (txt.includes('<html')) return [];
                    return txt.split('\n').map(l => l.trim()).filter(l => l);
                })
                .catch(() => []);
        }

        // Master Fungsi Asynchronous
        async function buildContent() {
            const [related, random] = await Promise.all([fetchRelated(), fetchRandom()]);
            
            // 1. Eksekusi Related (Pembersihan dan pastikan genap 10)
            let r1 = related.map(k => k.replace(/wallpaper/gi, '').trim()).filter(k => k);
            r1 = [...new Set(r1)];
            let i = 1;
            while (r1.length < 10) { r1.push(`${keyword} aesthetic ${i++}`); }
            renderGrid(r1.slice(0, 10), 'related-wallpapers-container');

            // 2. Eksekusi Random (Pengacakan dan pastikan genap 10)
            let r2 = random.filter(k => k.toLowerCase() !== keyword.toLowerCase());
            r2.sort(() => Math.random() - 0.5);
            r2 = [...new Set(r2)];
            let j = 1;
            while (r2.length < 10) { r2.push(`cool background ${j++}`); }
            renderGrid(r2.slice(0, 10), 'random-wallpapers-container');
        }

        buildContent();
    }
});
