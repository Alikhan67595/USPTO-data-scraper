// ✅ SCAN BUTTON (MISSING THA - MAIN ISSUE)
document.getElementById('startScan').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Inject content.js
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
    });

    setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, { action: "extract" }, (response) => {

            if (chrome.runtime.lastError) {
                alert("Page reload karo phir try karo");
                return;
            }

            if (response?.status === "success") {
                chrome.storage.local.get(['leads'], (res) => {
                    let leads = res.leads || [];
                    leads.push(response.data);

                    chrome.storage.local.set({ leads }, () => {
                        updateCount(leads.length);
                        alert("Saved!");
                    });
                });

            } else {
                alert( response.message);
            }
        });
    }, 5000);
});


// ✅ DOWNLOAD EXCEL
document.getElementById('downloadXlsx').addEventListener('click', () => {
    chrome.storage.local.get(['leads'], (res) => {
        let data = res.leads || [];

        if (data.length === 0) {
            alert("No data!");
            return;
        }

        const formattedData = data.map(item => ({
            "Mark": item.mark,
            "Serial": item.serial,
            "Date Abandoned": item.dateAbandoned,
            "Correspondent": item.correspondent,
            "Phone": item.phone,
            "Email": item.email
        }));

        const ws = XLSX.utils.json_to_sheet(formattedData, {
            header: ["Mark","Serial","Date Abandoned","Correspondent","Phone","Email"]
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Leads");

        XLSX.writeFile(wb, "TM_Leads.xlsx");
    });
});


// ✅ CLEAR DATA
document.getElementById('clearData').addEventListener('click', () => {
    if (confirm("Delete all data?")) {
        chrome.storage.local.set({ leads: [] }, () => updateCount(0));
    }
});


// ✅ COUNT UPDATE
function updateCount(count) {
    document.getElementById('count').innerText = count;
}

chrome.storage.local.get(['leads'], (res) => {
    updateCount(res.leads?.length || 0);
});