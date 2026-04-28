// Prevent duplicate widget
if (!document.getElementById('tm-scraper-widget')) {

    window.addEventListener('load', () => {

        const widget = document.createElement('div');
        widget.id = 'tm-scraper-widget';

        // Initial state invisible taake flicker na ho
        widget.style.visibility = "hidden"; 
        widget.style.opacity = "0";

        // SVG Icons in White Color
        const eyeOpenIcon = `<svg stroke="white" fill="white" stroke-width="0" viewBox="0 0 576 512" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><path d="M288 144a110.94 110.94 0 0 0-31.24 5 55.4 55.4 0 0 1 7.24 27 56 56 0 0 1-56 56 55.4 55.4 0 0 1-27-7.24A111.71 111.71 0 1 0 288 144zm284.52 97.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400c-98.65 0-189.09-55-237.93-144C98.91 167 189.34 112 288 112s189.09 55 237.93 144C477.1 345 386.66 400 288 400z"></path></svg>`;
        const eyeSlashIcon = `<svg stroke="white" fill="white" stroke-width="0" viewBox="0 0 640 512" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg"><path d="M320 400c-75.85 0-137.25-58.71-142.9-133.11L72.2 185.82c-13.79 17.3-26.48 35.59-36.72 55.59a32.35 32.35 0 0 0 0 29.19C89.71 376.41 197.07 448 320 448c26.91 0 52.87-4 77.89-10.46L346 397.39a144.13 144.13 0 0 1-26 2.61zm313.82 58.1l-110.55-85.44a331.25 331.25 0 0 0 81.25-102.07 32.35 32.35 0 0 0 0-29.19C550.29 135.59 442.93 64 320 64a308.15 308.15 0 0 0-147.32 37.7L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zm-183.72-142l-39.3-30.38A94.75 94.75 0 0 0 416 256a94.76 94.76 0 0 0-121.31-92.21A47.65 47.65 0 0 1 304 192a46.64 46.64 0 0 1-1.54 10l-73.61-56.89A142.31 142.31 0 0 1 320 112a143.92 143.92 0 0 1 144 144c0 21.63-5.29 41.79-13.9 60.11z"></path></svg>`;

        widget.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; font-weight:bold; margin-bottom:2px;">
                <span id="toggle-eye" style="cursor:pointer; display: flex; align-items: center;" title="Show/Hide Control">${eyeOpenIcon}</span>
                <span id="lead-display" style="color:white; font-size:12px;">Leads: <span id="lead-count">0</span></span>
                <span id="close-widget" style="cursor:pointer; color:white; font-size:18px; line-height: 1;">×</span>
            </div>
            
            <div id="mini-status" style="font-size:10px; font-weight:bold; text-align:center; margin-bottom:4px; display:none;">Ready...</div>

            <div id="widget-content">
                <button id="scan-btn" style="width:100%;padding:8px;background:#27ae60;color:#fff;border:none;border-radius:5px;margin-top:5px;cursor:pointer;">Scan</button>
                <button id="download-btn" style="width:100%;padding:4px;background:#2980b9;color:#fff;border:none;border-radius:5px;margin-top:5px;cursor:pointer;">Download</button>
                <div style="text-align:center;">
                    <button id="clear-btn" style="margin-top:8px;font-size:11px;color:red;background:none;border:none;cursor:pointer;">clear data</button>
                </div>
                <div id="scraper-log" style="font-size:11px;margin-top:6px;color:white;">Ready...</div>
            </div>
        `;

        widget.style.position = "fixed";
        widget.style.top = "250px";
        widget.style.left = "0px";
        widget.style.background = "transparent";
        widget.style.padding = "8px";
        widget.style.borderRadius = "0 10px 10px 0";
        widget.style.boxShadow = "0 5px 20px rgba(0,0,0,0.3)";
        widget.style.zIndex = "999999";
        widget.style.transition = "width 0.3s ease, opacity 0.2s ease";

        document.body.appendChild(widget);

        let leads = [];
        const eyeBtn = document.getElementById('toggle-eye');
        const widgetContent = document.getElementById('widget-content');
        const miniStatus = document.getElementById('mini-status');
        const log = document.getElementById('scraper-log');
        const leadCountSpan = document.getElementById('lead-count');

        const setStatus = (msg, color) => {
            log.innerText = msg;
            log.style.color = color;
            miniStatus.innerText = msg;
            miniStatus.style.color = color;
            if (widgetContent.style.display === "none") miniStatus.style.display = "block";
        };

        const updateWidgetUI = (isHidden) => {
            if (isHidden) {
                widgetContent.style.display = "none";
                eyeBtn.innerHTML = eyeSlashIcon; // Hide icon
                widget.style.width = "95px";
                miniStatus.style.display = "block";
            } else {
                widgetContent.style.display = "block";
                eyeBtn.innerHTML = eyeOpenIcon; // Show icon
                widget.style.width = "140px";
                miniStatus.style.display = "none";
            }
            widget.style.visibility = "visible";
            widget.style.opacity = "1";
        };

        // 🔄 Real-time Storage Sync
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'local' && changes.leads) {
                leads = changes.leads.newValue || [];
                leadCountSpan.innerText = leads.length;
            }
        });

        // Initial Load
        chrome.storage.local.get(['leads', 'isWidgetHidden'], (res) => {
            leads = res.leads || [];
            leadCountSpan.innerText = leads.length;
            setStatus("Ready...", "white");
            updateWidgetUI(res.isWidgetHidden || false);
        });

        eyeBtn.onclick = () => {
            const isCurrentlyHidden = widgetContent.style.display === "none";
            const newState = !isCurrentlyHidden;
            updateWidgetUI(newState);
            chrome.storage.local.set({ isWidgetHidden: newState });
        };

        // ✅ SCAN BUTTON
        document.getElementById('scan-btn').addEventListener('click', () => {
            setStatus("Scanning...", "white");
            chrome.storage.local.get(['leads'], (res) => {
                leads = res.leads || [];
                leadCountSpan.innerText = leads.length;

                let allSpans = document.querySelectorAll('.expand_heading span');
                let targetContainer = null, targetSpan = null;
                allSpans.forEach(span => {
                    if (span.innerText.includes("Attorney/Correspondence Information")) {
                        targetSpan = span;
                        let heading = span.closest('.expand_heading');
                        if (heading) targetContainer = heading.nextElementSibling;
                    }
                });

                if (targetSpan) targetSpan.style.backgroundColor = "transparent";
                if (targetContainer) {
                    targetContainer.style.display = "block";
                    targetContainer.classList.remove('hide');
                    targetContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

                const bodyText = document.body.innerText;
                const isAbandoned = /Abandoned|Dead/i.test(bodyText);
                const isNone = /Attorney of Record\s*-\s*(None|NONE|Pro Se)/i.test(bodyText);

                if (!isAbandoned || !isNone) {
                    setStatus("❌ Invalid", "#ff4d4d");
                    if (targetSpan) targetSpan.style.backgroundColor = "#ffcccc";
                    return;
                }

                try {
                    const serial = bodyText.match(/(?:US )?Serial Number:\s*(\d+)/i)?.[1] || "";
                    const mark = bodyText.match(/Mark:\s*(.+)/)?.[1]?.split("\n")[0]?.trim() || "";
                    const dateAbandoned = bodyText.match(/Date Abandoned:\s*([A-Za-z]+\.?\s\d{1,2},\s\d{4})/i)?.[1] || "";
                    const block = bodyText.split(/Correspondent Name\/Address:/i)[1] || "";
                    const correspondent = block.split("\n").find(l => l.trim())?.trim() || "";
                    const phone = block.match(/(\+?\d{1,2}[\s-]?)?\(?\d{3}\)?[\/\s.-]?\d{3}[\/\s.-]?\d{4}/g)?.[0] || "";
                    const email = block.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/i)?.[0] || " ";

                    if (!serial || !mark || !dateAbandoned || !correspondent || !phone) {
                        setStatus("❌ Missing", "#ffeb3b");
                        if (targetSpan) targetSpan.style.backgroundColor = "#fff9c4";
                        return;
                    }

                    if (!leads.some(l => l.serial === serial)) {
                        leads.push({ mark, serial, dateAbandoned, correspondent, phone, email });
                        chrome.storage.local.set({ leads }, () => {
                            setStatus("✅ Saved!", "#4caf50");
                            if (targetSpan) targetSpan.style.backgroundColor = "#ccffcc";
                        });
                    } else {
                        setStatus("ℹ️ Exist", "#3498db");
                        if (targetSpan) targetSpan.style.backgroundColor = "#add8e6";
                    }
                } catch (err) { setStatus("Err!", "red"); }
            });
        });

        // ✅ DOWNLOAD & CLEAR
        document.getElementById('download-btn').addEventListener('click', () => {
            if (leads.length === 0) return alert("No data!");
            const formatted = leads.map(l => ({
                "Serial Link": { f: `HYPERLINK("https://tsdr.uspto.gov/#caseNumber=${l.serial}&caseSearchType=CASE_SEARCH_NUMBER&caseType=DEFAULT&searchType=statusSearch", "${l.serial}")`, v: l.serial },
                "Mark": l.mark, "US Serial Number": l.serial, "Date Abandoned": l.dateAbandoned, "Correspondent": l.correspondent, "Phone:": l.phone, "Correspondent e-mail:": l.email
            }));
            const ws = XLSX.utils.json_to_sheet(formatted);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Leads");
            XLSX.writeFile(wb, "TM_Leads.xlsx");
        });

        document.getElementById('clear-btn').addEventListener('click', () => {
            if (confirm("Clear all data?")) chrome.storage.local.set({ leads: [] }, () => setStatus("🗑 Cleared", "white"));
        });

        document.getElementById('close-widget').onclick = () => widget.style.display = "none";
    });
}

window.addEventListener('keydown', (e) => {
    if (e.altKey && e.code === 'Enter') {
        e.preventDefault();
        const btn = document.getElementById('scan-btn');
        if (btn) btn.click();
    }
});