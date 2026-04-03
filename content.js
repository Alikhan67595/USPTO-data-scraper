chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.action === "extract") {
        try {
            const bodyText = document.body.innerText;

            // ✅ Status check
            const isAbandoned = /Abandoned|Dead/i.test(bodyText);
            const isNone = /Attorney of Record\s*-\s*(None|NONE|Pro Se)/i.test(bodyText);

            if (!isAbandoned || !isNone) {
                return sendResponse({
                    status: "failed",
                    message: "Not Abandoned / Attorney not None"
                });
            }

            // ✅ Serial (Flexible Regex)
            const serial = bodyText.match(/(?:US )?Serial Number:\s*(\d+)/i)?.[1] || "";

            // ✅ Mark
            const mark = bodyText.match(/Mark:\s*(.+)/)?.[1]?.split("\n")[0]?.trim() || "";

            // ✅ Date Abandoned (Handle dot and multiple digits)
            const dateAbandoned = bodyText.match(/Date Abandoned:\s*([A-Za-z]+\.?\s\d{1,2},\s\d{4})/i)?.[1] || "";

            // ✅ Correspondent Section Logic
            // Section ko split karke block uthate hain
            const correspondentBlock = bodyText.split(/Correspondent Name\/Address:/i)[1] || "";
            
            // Name: Block ki pehli non-empty line
            const correspondent = correspondentBlock.split("\n").find(line => line.trim() !== "")?.trim() || "";

            // ✅ Email Logic (Multiple emails handle karne ke liye)
            let email = "N/A";
            if (correspondentBlock) {
                // Pehli valid email uthayega chahe 2 hon ya 3
                const emailMatch = correspondentBlock.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/i);
                if (emailMatch) email = emailMatch[0];
            }

            // ✅ Phone / Fax Logic (Pure block mein se phone dhoondna)
            const phones = correspondentBlock.match(/(\+?\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g) || [];
            const phone = phones.length > 0 ? phones[0] : "";

            // 🔍 Debugging helper (Browser console mein dikhayega kya miss hua)
            console.log("Extracted Data:", { serial, mark, dateAbandoned, correspondent, phone, email });

            // ❌ Validation Check (Email ko optional rakha hai taake crash na ho)
            if (!serial || !mark || !dateAbandoned || !correspondent || !phone) {
                let missingFields = [];
                if (!serial) missingFields.push("Serial");
                if (!mark) missingFields.push("Mark");
                if (!dateAbandoned) missingFields.push("Date Abandoned");
                if (!correspondent) missingFields.push("Correspondent");
                if (!phone) missingFields.push("Phone");

                return sendResponse({
                    status: "failed",
                    message: "Missing: " + missingFields.join(", ")
                });
            }

            const data = {
                serial,
                mark,
                dateAbandoned,
                correspondent,
                phone,
                email
            };

            sendResponse({ status: "success", data });

        } catch (err) {
            sendResponse({ status: "error", message: err.message });
        }
    }

    return true;
});