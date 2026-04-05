// Prevent duplicate widget
if (!document.getElementById('tm-scraper-widget')) {

    window.addEventListener('load', () => {

        const widget = document.createElement('div');
        widget.id = 'tm-scraper-widget';

        widget.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-weight:bold;">
                <span>TM Scraper</span>
                <span id="close-widget" style="cursor:pointer;">×</span>
            </div>

            <div style="margin:8px 0;">
                Leads: <span id="lead-count" style="color:green;">0</span>
            </div>

            <button id="scan-btn" style="width:100%;padding:8px;background:#27ae60;color:#fff;border:none;border-radius:5px;margin-top:5px;">Scan</button>

            <button id="download-btn" style="width:100%;padding:8px;background:#2980b9;color:#fff;border:none;border-radius:5px;margin-top:5px;">Download</button>

            <!-- SMALL CLEAR BUTTON -->
            <div style="text-align:center;">
                <button id="clear-btn" style="margin-top:8px;font-size:11px;color:red;background:none;border:none;cursor:pointer;">
                    clear data
                </button>
            </div>

            <div id="scraper-log" style="font-size:11px;margin-top:6px;color:#555;">Ready...</div>
        `;

        // style
        widget.style.position = "fixed";
        widget.style.top = "70px";
        widget.style.right = "20px";
        widget.style.width = "220px";
        widget.style.background = "#fff";
        widget.style.padding = "10px";
        widget.style.borderRadius = "10px";
        widget.style.boxShadow = "0 5px 20px rgba(0,0,0,0.3)";
        widget.style.zIndex = "999999";

        document.body.appendChild(widget);

        let leads = [];

        // load data
        chrome.storage.local.get(['leads'], (res) => {
            leads = res.leads || [];
            document.getElementById('lead-count').innerText = leads.length;
        });

        // ✅ SCAN BUTTON (MAIN LOGIC — FIXED)
        document.getElementById('scan-btn').addEventListener('click', () => {

            const log = document.getElementById('scraper-log');

            log.innerText = "Scanning...";

            setTimeout(() => {

                const bodyText = document.body.innerText;

                const isAbandoned = /Abandoned|Dead/i.test(bodyText);
                const isNone = /Attorney of Record\s*-\s*(None|NONE|Pro Se)/i.test(bodyText);

                if (!isAbandoned || !isNone) {
                    log.innerText = "❌ Not valid lead";
                    return;
                }

                try {
                    // SERIAL
                    const serial = bodyText.match(/(?:US )?Serial Number:\s*(\d+)/i)?.[1] || "";

                    // MARK
                    const mark = bodyText.match(/Mark:\s*(.+)/)?.[1]?.split("\n")[0]?.trim() || "";

                    // DATE
                    const dateAbandoned = bodyText.match(/Date Abandoned:\s*([A-Za-z]+\.?\s\d{1,2},\s\d{4})/i)?.[1] || "";

                    // CORRESPONDENT BLOCK
                    const block = bodyText.split(/Correspondent Name\/Address:/i)[1] || "";

                    const correspondent = block.split("\n").find(l => l.trim())?.trim() || "";

                    // PHONE
                    const phones = block.match(/(\+?\d{1,2}[\s-]?)?\(?\d{3}\)?[\/\s.-]?\d{3}[\/\s.-]?\d{4}/g) || [];
                    const phone = phones[0] || "";

                    // EMAIL (only correspondent section)
                    const emailMatch = block.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/i);
                    const email = emailMatch ? emailMatch[0] : "N/A";

                    console.log("DEBUG:", { serial, mark, dateAbandoned, correspondent, phone, email });

                    // VALIDATION
                    if (!serial || !mark || !dateAbandoned || !correspondent || !phone) {
                        log.innerText = "❌ Missing data";
                        return;
                    }

                    const newLead = {
                        mark,
                        serial,
                        dateAbandoned,
                        correspondent,
                        phone,
                        email
                    };

                    // duplicate check
                    if (!leads.some(l => l.serial === serial)) {
                        leads.push(newLead);
                        chrome.storage.local.set({ leads }, () => {
                            document.getElementById('lead-count').innerText = leads.length;
                            log.innerText = "✅ Saved!";
                        });
                    } else {
                        log.innerText = "ℹ️ Already saved";
                    }

                } catch (err) {
                    log.innerText = "Error: " + err.message;
                }

            }, 0); // IMPORTANT delay

        });

        // ✅ DOWNLOAD
       document.getElementById('download-btn').addEventListener('click', () => {
            if (leads.length === 0) {
                alert("No data!");
                return;
            }

            // --- YAHAN SE PASTE KAREIN ---
            const formatted = leads.map(l => {
                // USPTO link generation logic
                const url = `https://tsdr.uspto.gov/#caseNumber=${l.serial}&caseSearchType=CASE_SEARCH_NUMBER&caseType=DEFAULT&searchType=statusSearch`;

                return {
                    "Serial Link": {
                        f: `HYPERLINK("${url}", "${l.serial}")`, 
                        v: l.serial 
                    },
                    "Mark": l.mark,
                    "US Serial Number": l.serial,
                    "Date Abandoned": l.dateAbandoned,
                    "Correspondent": l.correspondent,
                    "Phone:": l.phone,
                    "Correspondent e-mail:": l.email
                };
            });

            const ws = XLSX.utils.json_to_sheet(formatted, {
                header: [
                    "Serial Link",
                    "Mark", 
                    "US Serial Number", 
                    "Date Abandoned", 
                    "Correspondent", 
                    "Phone:", 
                    "Correspondent e-mail:"
                ]
            });
            // --- YAHAN TAK ---

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Leads");
            XLSX.writeFile(wb, "TM_Leads.xlsx");
        });

        // ✅ SMALL SAFE CLEAR BUTTON
        document.getElementById('clear-btn').addEventListener('click', () => {

            const confirm1 = confirm("Clear all data?");
            if (!confirm1) return;

            const confirm2 = confirm("This cannot be undone!");
            if (!confirm2) return;

            chrome.storage.local.set({ leads: [] }, () => {
                leads = [];
                document.getElementById('lead-count').innerText = 0;
                document.getElementById('scraper-log').innerText = "🗑 Cleared";
            });
        });

        // close
        document.getElementById('close-widget').onclick = () => {
            widget.style.display = "none";
        };

    });
}