function switchTab(tabId) {
    document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    document.getElementById('tab-' + tabId).classList.add('active');
    document.querySelector('[data-tab="' + tabId + '"]').classList.add('active');
}

function parsePrice(value) {
    return parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
}

function formatCurrency(amount) {
    if (isNaN(amount)) return 'R 0,00';
    return 'R ' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ').replace(/\./g, ',');
}

function calcAttorneyFee(price) {
    if (price <= 100000) return 6640;
    if (price <= 500000) {
        var base = 6640;
        var extra = Math.ceil((price - 100000) / 50000) * 1060;
        return base + extra;
    }
    if (price <= 1000000) {
        var base = 15120;
        var extra = Math.ceil((price - 500000) / 100000) * 2050;
        return base + extra;
    }
    if (price <= 5000000) {
        var base = 25370;
        var extra = Math.ceil((price - 1000000) / 200000) * 2050;
        return base + extra;
    }
    var base = 66370;
    var extra = Math.ceil((price - 5000000) / 1000000) * 5160;
    return base + extra;
}

function calcDeedsFee(price) {
    if (price <= 100000) return 50;
    if (price <= 200000) return 114;
    if (price <= 300000) return 727;
    if (price <= 600000) return 956;
    if (price <= 800000) return 1346;
    if (price <= 1000000) return 1546;
    if (price <= 2000000) return 1738;
    if (price <= 4000000) return 2408;
    if (price <= 6000000) return 2922;
    if (price <= 8000000) return 3480;
    if (price <= 10000000) return 4068;
    if (price <= 15000000) return 4844;
    if (price <= 20000000) return 5818;
    return 7751;
}

function calcTransferDuty(price) {
    if (price <= 1210000) return 0;
    if (price <= 1663800) return (price - 1210000) * 0.03;
    if (price <= 2329300) return 13614 + (price - 1663800) * 0.06;
    if (price <= 2994800) return 53544 + (price - 2329300) * 0.08;
    if (price <= 13310000) return 106784 + (price - 2994800) * 0.11;
    return 1241456 + (price - 13310000) * 0.13;
}

function calcMonthlyPayment(principal, annualRate, years) {
    var r = annualRate / 100 / 12;
    var n = years * 12;
    if (r === 0) return principal / n;
    var factor = Math.pow(1 + r, n);
    return principal * r * factor / (factor - 1);
}

/* ===== Shared Print / PDF Helpers ===== */
function getCalculatorResultsData(tabId, alertText) {
    var titleText = document.querySelector('.section-title h1').textContent.trim();
    var panel = document.getElementById('tab-' + tabId);
    var resultsPanel = panel.querySelector('.results-panel');
    var resultsBody = resultsPanel.querySelector('tbody');
    var rows = [];
    resultsBody.querySelectorAll('tr').forEach(function(tr) {
        var cells = tr.querySelectorAll('td');
        if (cells.length === 2) {
            rows.push({
                label: cells[0].textContent.trim().replace(/\s*\?\s*$/, ''),
                value: cells[1].textContent.trim(),
                total: tr.classList.contains('results-total')
            });
        }
    });

    if (!rows.length) {
        alert(alertText);
        return null;
    }

    var note = resultsPanel.querySelector('.results-note');
    return {
        title: titleText,
        rows: rows,
        note: note ? note.textContent.trim() : ''
    };
}

function isValidEmailAddress(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sendCalculatorEmail(tabId, alertText, subject, disclaimer) {
    var data = getCalculatorResultsData(tabId, alertText);
    if (!data) return;

    var userEmail = prompt('Enter your email address to receive this estimate:');
    if (userEmail === null) return;

    userEmail = userEmail.trim();
    if (!userEmail) return;

    if (!isValidEmailAddress(userEmail)) {
        alert('Please enter a valid email address.');
        return;
    }

    fetch('/api/send-calculator-email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: userEmail,
            subject: subject,
            title: data.title,
            rows: data.rows,
            note: data.note,
            disclaimer: disclaimer
        })
    })
    .then(function(response) {
        return response.json().then(function(payload) {
            return { ok: response.ok, payload: payload };
        });
    })
    .then(function(result) {
        if (result.ok && result.payload.success) {
            alert('Your estimate has been sent to ' + userEmail + '.');
            return;
        }
        alert(result.payload.error || 'Could not send the email. Please try again later.');
    })
    .catch(function() {
        alert('Could not send the email. Please try again later.');
    });
}

function saveCalculatorPDF(tabId, alertText, filename) {
    var data = getCalculatorResultsData(tabId, alertText);
    if (!data) return;

    var JsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!JsPDF) {
        alert('PDF library failed to load. Please refresh the page and try again.');
        return;
    }

    var doc = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    var margin = 20;
    var pageWidth = doc.internal.pageSize.getWidth();
    var pageHeight = doc.internal.pageSize.getHeight();
    var contentWidth = pageWidth - (margin * 2);
    var y = margin;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(data.title, margin, y);
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    data.rows.forEach(function(row) {
        if (!row.label && !row.value) {
            y += 4;
            return;
        }
        if (y > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
        if (row.total) {
            y += 3;
            doc.setLineWidth(0.5);
            doc.setDrawColor(0, 0, 0);
            doc.line(margin, y, pageWidth - margin, y);
            y += 7;
            doc.setFont('helvetica', 'bold');
        }

        doc.text(row.label, margin, y);
        doc.text(row.value, pageWidth - margin, y, { align: 'right' });

        if (row.total) {
            doc.setFont('helvetica', 'normal');
        } else {
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.1);
            doc.line(margin, y + 2, pageWidth - margin, y + 2);
        }
        y += 6;
    });

    if (data.note) {
        y += 4;
        if (y > pageHeight - margin - 10) {
            doc.addPage();
            y = margin;
        }
        doc.setFontSize(8);
        doc.text(doc.splitTextToSize(data.note, contentWidth), margin, y);
    }

    doc.save(filename);
}

/* ===== Bond Cost Calculator ===== */
function bcCalculate() {
    var input = document.getElementById('bc-bondAmount');
    var raw = input.value.trim();
    if (!raw) { alert('Please enter a bond amount.'); return; }
    var price = parsePrice(raw);
    if (price <= 0) { alert('Please enter a valid bond amount.'); return; }
    var attorneyExcl = calcAttorneyFee(price);
    var attorneyIncl = attorneyExcl * 1.15;
    var deedsFee = calcDeedsFee(price);
    var postages = 920, elecGen = 402.50, elecInstruction = 575, deedsSearches = 138;
    var subtotal = attorneyIncl + deedsFee + postages + elecGen + elecInstruction + deedsSearches;
    var rows = [
        { label: 'Bond Amount', value: formatCurrency(price), highlight: false },
        { label: '', value: '', highlight: false },
        { label: 'Bond Attorney Fees', value: formatCurrency(attorneyIncl), highlight: false, tooltip: 'Fee prescribed by the Law Society of South Africa and calculated based on the Bond amount.' },
        { label: 'Postages & Petties', value: formatCurrency(postages), highlight: false, tooltip: 'Costs incurred such as telephone costs, postage and courier fees, administration fees, and bank charges.' },
        { label: 'Deeds Office Fees', value: formatCurrency(deedsFee), highlight: false, tooltip: 'Fees published in the Government Gazette and calculated based on the bond amount.' },
        { label: 'Electronic Generation Fee', value: formatCurrency(elecGen), highlight: false, tooltip: 'Fees incurred for the generation of electronic documents' },
        { label: 'Electronic Instruction Fee', value: formatCurrency(elecInstruction), highlight: false, tooltip: 'Fees incurred when electronically instructing a Bank.' },
        { label: 'Deeds Office Searches', value: formatCurrency(deedsSearches), highlight: false, tooltip: 'Deeds Office search fees to ensure there are no conditions that may prevent the property transaction.' },
        { label: '', value: '', highlight: false },
        { label: 'Total Bond Costs (incl VAT)', value: formatCurrency(subtotal), highlight: true }
    ];
    var tbody = document.getElementById('bc-resultsBody');
    tbody.innerHTML = '';
    rows.forEach(function(row) {
        var tr = document.createElement('tr');
        if (row.highlight) tr.className = 'results-total';
        if (row.label === '' && row.value === '') tr.style.height = '8px';
        var td1 = document.createElement('td');
        if (row.tooltip) {
            td1.innerHTML = row.label + ' <span class="tooltip-icon" data-tooltip="' + row.tooltip.replace(/"/g, '&quot;') + '">?</span>';
        } else {
            td1.textContent = row.label;
        }
        var td2 = document.createElement('td');
        td2.textContent = row.value;
        tr.appendChild(td1);
        tr.appendChild(td2);
        tbody.appendChild(tr);
    });
    var panel = document.getElementById('bc-resultsPanel');
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function bcSavePDF() {
    saveCalculatorPDF('bond-cost', 'Please calculate a bond cost estimate first.', 'bond-cost-estimate.pdf');
}

function bcSendEmail() {
    sendCalculatorEmail(
        'bond-cost',
        'Please calculate a bond cost estimate first.',
        'Bond Cost Estimate',
        'Disclaimer: This is an estimate only. Actual costs may vary.'
    );
}

document.getElementById('bc-bondAmount').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') bcCalculate();
});

/* ===== Bond Repayment Calculator ===== */
function brCalculate() {
    var amountInput = document.getElementById('br-bondAmount');
    var raw = amountInput.value.trim();
    if (!raw) { alert('Please enter a bond amount.'); return; }
    var principal = parsePrice(raw);
    if (principal <= 0) { alert('Please enter a valid bond amount.'); return; }
    var years = parseInt(document.querySelector('input[name="br-years"]:checked').value);
    if (isNaN(years) || years < 1) { alert('Please enter a valid number of years.'); return; }
    var rateStr = document.getElementById('br-interestRate').value.trim().replace(',', '.');
    var annualRate = parseFloat(rateStr);
    if (isNaN(annualRate) || annualRate <= 0) { alert('Please enter a valid interest rate.'); return; }
    var monthly = calcMonthlyPayment(principal, annualRate, years);
    var totalRepayment = monthly * years * 12;
    var totalInterest = totalRepayment - principal;
    var rows = [
        { label: 'Bond Amount', value: formatCurrency(principal), highlight: false },
        { label: 'Annual Interest Rate', value: annualRate.toFixed(2) + '%', highlight: false },
        { label: 'Repayment Term', value: years + ' years', highlight: false },
        { label: '', value: '', highlight: false },
        { label: 'Total Monthly Cost', value: formatCurrency(monthly), highlight: true },
        { label: 'Interest Repayment', value: formatCurrency(totalInterest), highlight: false, tooltip: 'The total amount of interest that will be repaid.' },
        { label: 'Total Loan Repayment', value: formatCurrency(totalRepayment), highlight: false, tooltip: 'The total amount to be repaid including the capital amount and the interest amount.' }
    ];
    var tbody = document.getElementById('br-resultsBody');
    tbody.innerHTML = '';
    rows.forEach(function(row) {
        var tr = document.createElement('tr');
        if (row.highlight) tr.className = 'results-total';
        if (row.label === '' && row.value === '') tr.style.height = '8px';
        var td1 = document.createElement('td');
        if (row.tooltip) {
            td1.innerHTML = row.label + ' <span class="tooltip-icon" data-tooltip="' + row.tooltip.replace(/"/g, '&quot;') + '">?</span>';
        } else {
            td1.textContent = row.label;
        }
        var td2 = document.createElement('td');
        td2.textContent = row.value;
        tr.appendChild(td1);
        tr.appendChild(td2);
        tbody.appendChild(tr);
    });
    var panel = document.getElementById('br-resultsPanel');
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function brSavePDF() {
    saveCalculatorPDF('bond-repayment', 'Please calculate a bond repayment estimate first.', 'bond-repayment-estimate.pdf');
}

function brSendEmail() {
    sendCalculatorEmail(
        'bond-repayment',
        'Please calculate a bond repayment estimate first.',
        'Bond Repayment Estimate',
        'Disclaimer: This is an estimate only. Actual costs may vary.'
    );
}

document.getElementById('br-bondAmount').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') brCalculate();
});
document.getElementById('br-interestRate').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') brCalculate();
});

/* ===== Transfer Cost Calculator ===== */
function tcCalculate() {
    var input = document.getElementById('tc-purchasePrice');
    var raw = input.value.trim();
    if (!raw) { alert('Please enter a property purchase price.'); return; }
    var price = parsePrice(raw);
    if (price <= 0) { alert('Please enter a valid purchase price.'); return; }
    var attorneyExcl = calcAttorneyFee(price);
    var attorneyIncl = attorneyExcl * 1.15;
    var deedsFee = calcDeedsFee(price);
    var transferDuty = calcTransferDuty(price);
    var postages = 920, elecGen = 322, fica = 393.30, deedsSearches = 138, ratesClearance = 138;
    var subtotal = attorneyIncl + deedsFee + transferDuty + postages + elecGen + fica + deedsSearches + ratesClearance;
    var rows = [
        { label: 'Property Purchase Price', value: formatCurrency(price), highlight: false },
        { label: '', value: '', highlight: false },
        { label: 'Transfer Attorney Fees', value: formatCurrency(attorneyIncl), highlight: false, tooltip: 'Fee prescribed by the Law Society of South Africa and calculated based on the purchase price of the property.' },
        { label: 'Postages & Petties', value: formatCurrency(postages), highlight: false, tooltip: 'A fee calculated with reference to the Transfer Fee for administration charges and legislative compliance.' },
        { label: 'Deeds Office Fees', value: formatCurrency(deedsFee), highlight: false, tooltip: 'Fees published in the Government Gazette and calculated based on the purchase price of the property.' },
        { label: 'Electronic Generation Fee', value: formatCurrency(elecGen), highlight: false, tooltip: 'Fees incurred for the generation of electronic documents' },
        { label: 'FICA', value: formatCurrency(fica), highlight: false, tooltip: 'Costs incurred when verifying the identity of a client prior to establishing a business relationship with them.' },
        { label: 'Deeds Office Searches', value: formatCurrency(deedsSearches), highlight: false, tooltip: 'Deeds Office search fees to ensure there are no conditions that may prevent the property transaction.' },
        { label: 'Rates Clearance Fees', value: formatCurrency(ratesClearance), highlight: false, tooltip: 'A Rates Clearance Certificate must be obtained to verify that there are no outstanding Rates and Taxes payable by the Seller of the Property' },
        { label: 'Transfer Duty', value: formatCurrency(transferDuty), highlight: false, tooltip: 'Tax levied by the Government on property transactions' },
        { label: '', value: '', highlight: false },
        { label: 'Total Transfer Costs (incl VAT)', value: formatCurrency(subtotal), highlight: true }
    ];
    var tbody = document.getElementById('tc-resultsBody');
    tbody.innerHTML = '';
    rows.forEach(function(row) {
        var tr = document.createElement('tr');
        if (row.highlight) tr.className = 'results-total';
        if (row.label === '' && row.value === '') tr.style.height = '8px';
        var td1 = document.createElement('td');
        if (row.tooltip) {
            td1.innerHTML = row.label + ' <span class="tooltip-icon" data-tooltip="' + row.tooltip.replace(/"/g, '&quot;') + '">?</span>';
        } else {
            td1.textContent = row.label;
        }
        var td2 = document.createElement('td');
        td2.textContent = row.value;
        tr.appendChild(td1);
        tr.appendChild(td2);
        tbody.appendChild(tr);
    });
    var panel = document.getElementById('tc-resultsPanel');
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function tcSavePDF() {
    saveCalculatorPDF('transfer-cost', 'Please calculate a transfer cost estimate first.', 'transfer-cost-estimate.pdf');
}

function tcSendEmail() {
    sendCalculatorEmail(
        'transfer-cost',
        'Please calculate a transfer cost estimate first.',
        'Transfer Cost Estimate',
        'Disclaimer: This is an estimate only. Actual costs may vary.'
    );
}

document.getElementById('tc-purchasePrice').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') tcCalculate();
});

document.getElementById('bc-bondAmount').addEventListener('keydown', function(e) { if (e.key === 'Enter') bcCalculate(); });
document.getElementById('br-bondAmount').addEventListener('keydown', function(e) { if (e.key === 'Enter') brCalculate(); });
document.getElementById('br-interestRate').addEventListener('keydown', function(e) { if (e.key === 'Enter') brCalculate(); });
document.getElementById('tc-purchasePrice').addEventListener('keydown', function(e) { if (e.key === 'Enter') tcCalculate(); });
