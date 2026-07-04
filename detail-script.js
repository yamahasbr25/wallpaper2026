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
            if (response.ok) return response.text();
            throw new Error('File not found');
        })
        .then(htmlData => {
            document.open();
            document.write(htmlData);
            document.close();
        })
        .catch(() => {
            const keyword = cleanQuery.replace(/-/g, ' ').trim();
            runAGC(keyword);
        });

    // ==========================================
    // FUNGSI UTAMA AGC (FIXED IMAGE URL)
    // ==========================================
    function runAGC(keyword) {
        const detailTitle = document.getElementById('detail-title');
        const detailBody = document.getElementById('detail-body');
        
        function capitalizeEachWord(str) { 
            if (!str) return ''; 
            return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); 
        }
        
        function generateSeoTitle(baseKeyword) { 
            const hookWords = ['Aesthetic', 'Beautiful', 'Cool', 'HD 4K', 'Best', 'Stunning', 'Cute']; 
            const suffixWords = ['iPhone Wallpaper', 'Lockscreen Background', 'Wallpaper Ideas'];
            const randomHook = hookWords[Math.floor(Math.random() * hookWords.length)]; 
            const randomSuffix = suffixWords[Math.floor(Math.random() * suffixWords.length)];
            return `${randomHook} ${capitalizeEachWord(baseKeyword)} ${randomSuffix}`; 
        }

        function processSpintax(text) {
            const spintaxPattern = /{([^{}]+)}/g;
            while (spintaxPattern.test(text)) {
                text = text.replace(spintaxPattern, (match, choices) => {
                    const options = choices.split('|');
                    return options[Math.floor(Math.random() * options.length)];
                });
            }
            return text;
        }

        function setWallpaperDescription(term) {
            const spintaxArticleTemplate = `Discover the best <strong>${capitalizeEachWord(term)}</strong> iPhone wallpaper HD lockscreen background to beautifully customize your mobile device. Scroll down to find high-quality 9:16 resolution images perfect for your screen.`;
            if(detailBody) detailBody.innerHTML = `<p style="text-align:center; font-size: 0.95rem; color:#555;">${processSpintax(spintaxArticleTemplate)}</p>`;
        }

        if (!keyword) { 
            if(detailTitle) detailTitle.textContent = 'Wallpaper Not Found'; 
            if(detailBody) detailBody.innerHTML = '<p>Please return to the <a href="index.html">homepage</a>.</p>'; 
            return; 
        }

        // --- RENDER GAMBAR KE GRID ---
        function renderWallpapers(keywords, containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            let htmlContent = '';
            keywords.forEach(kw => {
                const queryImage = kw + " iphone wallpaper";
                // Menggunakan parameter w=500&h=888&c=7 agar aman, berasio pas 9:16, dan muncul tajam tanpa broken link
                const imgUrl = `https://tse1.mm.bing.net/th?q=${encodeURIComponent(queryImage)}&w=500&h=888&c=7&rs=1&p=0`;
                const keywordForUrl = kw.replace(/\s+/g, '-').toLowerCase();
                const linkUrl = `detail.html?q=${encodeURIComponent(keywordForUrl)}`;
                const altText = `${capitalizeEachWord(kw)} iPhone Wallpaper`;

                htmlContent += `
                <div class="wallpaper-card">
                    <a href="${linkUrl}" class="img-link">
                        <img src="${imgUrl}" alt="${altText}" loading="lazy">
                    </a>
                    <a href="${imgUrl}" target="_blank" download class="download-btn">📥 Download</a>
                </div>
                `;
            });
            container.innerHTML = htmlContent;
        }

        // --- 1. AMBIL 10 RELATED KEYWORD (Google Suggest) ---
        function fetchRelatedWallpapers(term) {
            const script = document.createElement('script');
            script.src = `https://suggestqueries.google.com/complete/search?client=youtube&jsonp=handleRelatedSuggest&hl=en&q=${encodeURIComponent(term + " wallpaper")}`;
            document.head.appendChild(script);
            script.onload = () => script.remove();
            script.onerror = () => handleRelatedFallback(term);
        }

        window.handleRelatedSuggest = function(data) {
            const suggestions = data[1];
            let relatedKeywords = [];
            
            if (suggestions && suggestions.length > 0) {
                suggestions.forEach(item => {
                    let relatedTerm = typeof item === 'string' ? item : item[0];
                    let cleanTerm = relatedTerm.replace(/wallpaper/gi, '').trim();
                    if (cleanTerm) relatedKeywords.push(cleanTerm);
                });
            }
            processAndRenderRelated(relatedKeywords);
        };

        function handleRelatedFallback(term) {
            processAndRenderRelated([term]);
        }

        function processAndRenderRelated(relatedArray) {
            let uniqueRelated = [...new Set(relatedArray)];
            const paddingWords = ['aesthetic', 'hd', '4k', 'dark', 'cute', 'vintage', 'minimalist', 'art', 'background', 'cool'];
            let padIndex = 0;
            
            while (uniqueRelated.length < 10 && padIndex < paddingWords.length) {
                uniqueRelated.push(`${keyword} ${paddingWords[padIndex]}`);
                padIndex++;
            }
            
            renderWallpapers(uniqueRelated.slice(0, 10), 'related-wallpapers-container');
        }

        // --- 2. AMBIL 10 RANDOM KEYWORD (Dari keyword.txt) ---
        function fetchRandomWallpapers() {
            fetch('keyword.txt')
                .then(response => response.text())
                .then(data => {
                    let keywords = data.split('\n')
                        .map(k => k.replace(/\/gi, '').trim())
                        .filter(k => k.length > 0 && k.toLowerCase() !== keyword.toLowerCase());
                    
                    keywords.sort(() => Math.random() - 0.5);
                    let randomKeywords = keywords.slice(0, 10);
                    
                    let padIndex = 1;
                    while (randomKeywords.length < 10) {
                        randomKeywords.push(`cool background ${padIndex}`);
                        padIndex++;
                    }
                    
                    renderWallpapers(randomKeywords.slice(0, 10), 'random-wallpapers-container');
                })
                .catch(() => {
                    let fallbackRandom = [];
                    for(let i=1; i<=10; i++) fallbackRandom.push(`aesthetic hd ${i}`);
                    renderWallpapers(fallbackRandom, 'random-wallpapers-container');
                });
        }

        const newTitle = generateSeoTitle(keyword);
        document.title = `${newTitle} | DecorHouz`;
        if(detailTitle) detailTitle.textContent = newTitle;
        
        setWallpaperDescription(keyword);
        fetchRelatedWallpapers(keyword);
        fetchRandomWallpapers();
    }
});