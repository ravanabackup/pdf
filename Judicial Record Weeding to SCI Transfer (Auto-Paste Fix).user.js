// ==UserScript==
// @name         Judicial Record Weeding to SCI Transfer (Auto-Paste Fix)
// @namespace    http://tampermonkey.net/
// @version      1.3
// @match        http://10.145.22.11:8888/add_weeding_details.php*
// @match        https://www.sci.gov.in/case-status-court/*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    // Helper to convert date from "21-SEP-2020" format to "21-09-2020" format
    function convertDateFormat(dateStr) {
        if (!dateStr) return "";
        const months = {
            "JAN": "01", "FEB": "02", "MAR": "03", "APR": "04", "MAY": "05", "JUN": "06",
            "JUL": "07", "AUG": "08", "SEP": "09", "OCT": "10", "NOV": "11", "DEC": "12"
        };
        let parts = dateStr.toUpperCase().split('-');
        if (parts.length === 3) {
            let day = parts[0].padStart(2, '0');
            let monthName = parts[1];
            let year = parts[2];
            let monthNum = months[monthName] || monthName; 
            return `${day}-${monthNum}-${year}`;
        }
        return dateStr;
    }

    // --- SITE 1: WEEDING DETAILS SITE ---
    if (window.location.href.includes("10.145.22.11")) {
        
        const observer = new MutationObserver((mutations, obs) => {
            let outputDiv = document.querySelector("#output");
            if (outputDiv && outputDiv.innerText.trim() !== "" && !document.querySelector("#send-to-sci-btn")) {
                
                let btn = document.createElement("button");
                btn.id = "send-to-sci-btn";
                btn.type = "button";
                btn.className = "btn btn-warning";
                btn.style.marginLeft = "10px";
                btn.style.fontWeight = "bold";
                btn.innerText = "Send Data to Supreme Court Site";
                
                let actionArea = document.querySelector("input[value='Clear Values']");
                if (actionArea && actionArea.parentNode) {
                    actionArea.parentNode.appendChild(btn);
                } else {
                    outputDiv.insertBefore(btn, outputDiv.firstChild);
                }

                btn.addEventListener("click", function() {
                    let pageText = outputDiv.innerText;

                    // Scrape Case ID
                    let caseIdMatch = pageText.match(/[A-Z]+[-–]\d+[-–]\d{4}/i);
                    let caseNo = "";
                    if (caseIdMatch) {
                        let fullCaseId = caseIdMatch[0]; 
                        let parts = fullCaseId.split(/[-–]/);
                        if (parts.length >= 2) {
                            caseNo = parts[1]; 
                        }
                    }

                    // Scrape Date of Decision
                    let dateMatch = pageText.match(/(\d{1,2})[-–](JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[-–](\d{4})/i);
                    let formattedDate = "";
                    if (dateMatch) {
                        formattedDate = convertDateFormat(dateMatch[0]);
                    }

                    if (caseNo || formattedDate) {
                        GM_setValue("sci_case_no", caseNo);
                        GM_setValue("sci_date", formattedDate);
                        
                        // Small visual confirmation on the button itself
                        let originalText = btn.innerText;
                        btn.innerText = "✓ Sent!";
                        btn.className = "btn btn-success";
                        setTimeout(() => {
                            btn.innerText = originalText;
                            btn.className = "btn btn-warning";
                        }, 2000);
                    } else {
                        alert("Could not extract Case ID or Decision Date from the page content.");
                    }
                });
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // --- SITE 2: SUPREME COURT SITE ---
    if (window.location.href.includes("sci.gov.in")) {
        
        // Loop every 1 second checking for new data to paste instantly
        setInterval(function() {
            let storedCaseNo = GM_getValue("sci_case_no");
            let storedDate = GM_getValue("sci_date");

            if (storedCaseNo) {
                let targetInput = document.querySelector("#case_no");
                if (targetInput) {
                    targetInput.value = storedCaseNo;
                    targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                    targetInput.dispatchEvent(new Event('change', { bubbles: true }));
                    GM_setValue("sci_case_no", ""); // Clear storage trail
                }
            }

            if (storedDate) {
                let targetDateInput = document.querySelector("#listing_date");
                if (targetDateInput) {
                    targetDateInput.value = storedDate;
                    targetDateInput.dispatchEvent(new Event('input', { bubbles: true }));
                    targetDateInput.dispatchEvent(new Event('change', { bubbles: true }));
                    GM_setValue("sci_date", ""); // Clear storage trail
                }
            }
        }, 1000); 
    }
})();