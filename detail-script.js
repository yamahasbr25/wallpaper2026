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
            // Mencegah server yang merespons 200 OK pada halaman 404
            if (htmlData.toLowerCase().includes('<title>404') || htmlData.toLowerCase().includes('page not found')) {
                throw new Error('Soft 404 detected');
            }
            document.open();
            document.write(htmlData);
            document.close();
        })
        .catch(() => {
            const keyword = cleanQuery.replace(/-/g, ' ').trim();
            runAGC(keyword);
        });

    // ==========================================
    // FUNGSI UTAMA AGC (BULLETPROOF VERSION)
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

        // 1. FUNGSI AMBIL DESKRIPSI (Dilindungi dari error 404 HTML)
        function fetchDescriptionTemplate(term) {
            fetch('deskripsi.txt')
                .then(response => {
                    if (!response.ok) throw new Error('Deskripsi Not Found');
                    return response.text();
                })
                .then(data => {
                    // Cek jika yang ter-fetch adalah tag HTML (404 page)
                    if(data.trim().toLowerCase().startsWith('<!doctype') || data.trim().toLowerCase().startsWith('<html')) {
                        throw new Error('HTML Detected');
                    }
                    const templates = data.split('---').map(t => t.trim()).filter(t => t.length > 0);
                    if(templates.length > 0) {
                        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
                        let parsedText = processSpintax(randomTemplate);
                        parsedText = parsedText.replace(/%keyword%/gi, `<strong>${capitalizeEachWord(term)}</strong>`);
                        
                        const htmlContent = parsedText.split('\n').map(line => `<p style="text-align:center; font-size: 0.95rem; color:#555; margin-bottom:8px;">${line}</p>`).join('');
                        if(detailBody) detailBody.innerHTML = htmlContent;
                    } else {
                        fallbackDescription(term);
                    }
                })
                .catch(() => fallbackDescription(term));
        }

        function fallbackDescription(term) {
            const spintaxArticleTemplate = `{Discover|Explore} the best <strong>${capitalizeEachWord(term)}</strong> iPhone wallpaper HD lockscreen background to beautifully customize your mobile device. Scroll down to find high-quality 9:16 resolution images perfect for your screen.`;
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
                const imgUrl = `https://tse1.mm.bing.net/th?q=${encodeURIComponent(queryImage)}&w=500&h=888&c=7&rs=1&p=0`;
                const keywordForUrl = kw.replace(/\s+/g, '-').toLowerCase();
                const linkUrl = `detail.html?q=${encodeURIComponent(keywordForUrl)}`;
                const altText = `${capitalizeEachWord(kw)} iPhone Wallpaper`;

                htmlContent += `
                <div class="wallpaper-card">
                    <a href="${linkUrl}" class="img-link" title="${altText}">
                        <img src="${imgUrl}" alt="${altText}" loading="lazy">
                    </a>
                    <a href="${imgUrl}" target="_blank" download class="download-btn">📥 Download</a>
                </div>
                `;
            });
            container.innerHTML = htmlContent;
        }

        let isRelatedRendered = false;

        // --- 2. AMBIL 10 RELATED KEYWORD (Dengan Timeout Bypass) ---
        function fetchRelatedWallpapers(term) {
            const script = document.createElement('script');
            const callbackName = 'handleRelatedSuggest_' + Math.round(Math.random() * 10000);
            script.src = `https://suggestqueries.google.com/complete/search?client=youtube&jsonp=${callbackName}&hl=en&q=${encodeURIComponent(term + " wallpaper")}`;
            document.head.appendChild(script);

            // Timeout 3 detik. Jika API Google mati/diblokir, paksa pakai fallback
            const timeoutId = setTimeout(() => {
                if (!isRelatedRendered) {
                    isRelatedRendered = true;
                    handleRelatedFallback(term);
                }
            }, 3000);

            window[callbackName] = function(data) {
                clearTimeout(timeoutId);
                if (isRelatedRendered) return;
                isRelatedRendered = true;
                
                const suggestions = data[1];
                let relatedKeywords = [];
                
                if (suggestions && suggestions.length > 0) {
                    suggestions.forEach(item => {
                        let relatedTerm = typeof item === 'string' ? item : item[0];
                        let cleanTerm = relatedTerm.replace(/wallpaper/gi, '').trim();
                        if (cleanTerm) relatedKeywords.push(cleanTerm);
                    });
                }
                processAndRenderRelated(relatedKeywords, term);
            };

            script.onerror = () => {
                clearTimeout(timeoutId);
                if (!isRelatedRendered) {
                    isRelatedRendered = true;
                    handleRelatedFallback(term);
                }
            };
        }

        function handleRelatedFallback(term) {
            processAndRenderRelated([term], term);
        }

        function processAndRenderRelated(relatedArray, originalTerm) {
            let uniqueRelated = [...new Set(relatedArray)];
            const paddingWords = ['aesthetic', 'hd', '4k', 'dark', 'cute', 'vintage', 'minimalist', 'art', 'background', 'cool'];
            let padIndex = 0;
            
            while (uniqueRelated.length < 10 && padIndex < paddingWords.length) {
                uniqueRelated.push(`${originalTerm} ${paddingWords[padIndex]}`);
                padIndex++;
            }
            renderWallpapers(uniqueRelated.slice(0, 10), 'related-wallpapers-container');
        }

        // --- 3. AMBIL 10 RANDOM KEYWORD (Dilindungi dari error 404 HTML) ---
        function fetchRandomWallpapers(term) {
            fetch('keyword.txt')
                .then(response => {
                    if (!response.ok) throw new Error('Keyword txt not found');
                    return response.text();
                })
                .then(data => {
                    if(data.trim().toLowerCase().startsWith('<!doctype') || data.trim().toLowerCase().startsWith('<html')) {
                        throw new Error('HTML Detected');
                    }
                    let keywords = data.split('\n')
                        .map(k => k.replace(/\/gi, '').trim())
                        .filter(k => k.length > 0 && k.toLowerCase() !== term.toLowerCase());
                    
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
                    for(let i=1; i<=10; i++) fallbackRandom.push(`aesthetic hd wallpaper ${i}`);
                    renderWallpapers(fallbackRandom, 'random-wallpapers-container');
                });
        }

        // Eksekusi semua fungsi
        const newTitle = generateSeoTitle(keyword);
        document.title = `${newTitle} | DecorHouz`;
        if(detailTitle) detailTitle.textContent = newTitle;
        
        fetchDescriptionTemplate(keyword);
        fetchRelatedWallpapers(keyword);
        fetchRandomWallpapers(keyword);
    }
});