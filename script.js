// Default Data Structure
const defaultBagData = {
  "24%": { price: 1750, stock: 0, buyers: [] },
  "22%": { price: 1650, stock: 0, buyers: [] },
  "20%": { price: 1450, stock: 0, buyers: [] }
};

// Load saved data from localStorage, or fall back to default
let bagData = JSON.parse(localStorage.getItem("feedBazaarData")) || defaultBagData;

// Save current state to localStorage
function saveDataToStorage() {
  localStorage.setItem("feedBazaarData", JSON.stringify(bagData));
  updateAnalyticsSummaryCard();
}

// Host Credentials stored in localStorage (default password initialized to "9704862468")
const HOST_CREDENTIALS = {
  mobile: "9704862468"
};

function getHostPassword() {
  return localStorage.getItem("feedBazaarHostPassword") || "9704862468";
}

function setHostPassword(newPass) {
  localStorage.setItem("feedBazaarHostPassword", newPass);
}

// Global Auth State
let activeRole = null; // 'HOST' or 'DEMO'
let currentSelectedBag = null;

// On DOM load, calculate analytics preview
document.addEventListener("DOMContentLoaded", () => {
  updateAnalyticsSummaryCard();
  setupDemoFormListener();
});

// Centered Form Host Login Handler
document.getElementById("hostLoginForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const mobile = document.getElementById("hostMobile").value.trim();
  const password = document.getElementById("hostPassword").value.trim();

  if (mobile === HOST_CREDENTIALS.mobile && password === getHostPassword()) {
    loginUser("HOST");
  } else {
    alert("Access Denied: Invalid Host Credentials!");
  }
  this.reset();
});

// Demo Login Handling
function openDemoLoginModal() {
  document.getElementById("demoLoginForm").reset();
  document.getElementById("demoLoginModal").style.display = "block";
}

function setupDemoFormListener() {
  const demoForm = document.getElementById("demoLoginForm");
  if (demoForm) {
    demoForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const mobile = document.getElementById("demoMobile").value.trim();
      
      if (mobile.length === 10) {
        closeModal("demoLoginModal");
        loginUser("DEMO");
      } else {
        alert("Please enter a valid 10-digit mobile number.");
      }
    });
  }
}

// Common Login Flow (HOST vs DEMO)
function loginUser(role) {
  activeRole = role;

  // Reveal Dashboard and Header
  document.getElementById("heroSection").style.display = "none";
  document.getElementById("mainDashboard").style.display = "block";
  document.getElementById("loggedInNav").style.display = "block";

  const roleBadge = document.getElementById("roleBadge");
  const bannerTitle = document.getElementById("dashboardBannerTitle");
  const bannerDesc = document.getElementById("dashboardBannerDesc");

  if (role === "HOST") {
    document.body.classList.add("host-logged-in");
    document.body.classList.remove("demo-logged-in");

    if (roleBadge) {
      roleBadge.textContent = "⚡ HOST ACTIVE";
      roleBadge.style.backgroundColor = "#22c55e";
    }
    if (bannerTitle) bannerTitle.textContent = "👑 Host Management Portal Active";
    if (bannerDesc) bannerDesc.textContent = "Click on any of the feed cards below to manage inventory stock or inspect buyer details.";
  } else {
    document.body.classList.add("demo-logged-in");
    document.body.classList.remove("host-logged-in");

    if (roleBadge) {
      roleBadge.textContent = "👀 DEMO MODE";
      roleBadge.style.backgroundColor = "#0284c7";
    }
    if (bannerTitle) bannerTitle.textContent = "👀 Demo View Active";
    if (bannerDesc) bannerDesc.textContent = "You are currently viewing live stock and sales metrics in read-only mode.";
  }

  document.getElementById("mainDashboard").scrollIntoView({ behavior: 'smooth' });
  updateAnalyticsSummaryCard();
}

// Change Password Functions
function openChangePasswordModal() {
  document.getElementById("changePasswordForm").reset();
  document.getElementById("changePasswordModal").style.display = "block";
}

document.getElementById("changePasswordForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const mobile = document.getElementById("cpMobile").value.trim();
  const oldPassword = document.getElementById("cpOldPassword").value.trim();
  const newPassword = document.getElementById("cpNewPassword").value.trim();
  const confirmNewPassword = document.getElementById("cpConfirmPassword").value.trim();

  if (mobile !== HOST_CREDENTIALS.mobile) {
    alert("Incorrect Host Mobile ID!");
    return;
  }

  if (oldPassword !== getHostPassword()) {
    alert("Incorrect Old Password! Please try again.");
    return;
  }

  if (newPassword !== confirmNewPassword) {
    alert("New passwords do not match!");
    return;
  }

  if (newPassword.length < 4) {
    alert("New password must be at least 4 characters long.");
    return;
  }

  setHostPassword(newPassword);
  closeModal("changePasswordModal");
});

// Logout Handling
function handleLogout() {
  activeRole = null;
  
  document.getElementById("heroSection").style.display = "flex";
  document.getElementById("mainDashboard").style.display = "none";
  document.getElementById("loggedInNav").style.display = "none";
  
  document.body.classList.remove("host-logged-in", "demo-logged-in");
}

// Open Bag Details Modal
function handleBagClick(type) {
  currentSelectedBag = type;
  const bag = bagData[type];

  document.getElementById("modalBagTitle").textContent = `FB-${type} Feed Bag Management`;
  document.getElementById("modalBagPrice").textContent = `₹${bag.price}`;
  document.getElementById("modalBagStock").textContent = `${bag.stock} bags`;

  // Display Host Controls ONLY if logged in as Host
  const hostControls = document.getElementById("hostControls");
  if (hostControls) {
    hostControls.style.display = activeRole === "HOST" ? "block" : "none";
  }

  // Reset filter inputs on open
  document.getElementById("buyerSearchInput").value = "";
  document.getElementById("buyerDateFilter").value = "all";

  renderBuyersList(type);
  document.getElementById("bagModal").style.display = "block";
}

// Add Stock Function (Host Only - Immediate execution, no confirmation popups)
function updateStockByHost() {
  if (activeRole !== "HOST") {
    alert("Action Denied: Host privilege required.");
    return;
  }

  const newBags = parseInt(document.getElementById("newStockInput").value, 10);
  
  if (isNaN(newBags) || newBags <= 0) {
    return;
  }

  bagData[currentSelectedBag].stock += newBags;
  saveDataToStorage();
  
  document.getElementById("modalBagStock").textContent = `${bagData[currentSelectedBag].stock} bags`;
  document.getElementById("newStockInput").value = "";
}

// Clear / Reset Stock Function (Host Only - Immediate execution, no confirmation popups)
function clearStockByHost() {
  if (activeRole !== "HOST") {
    alert("Action Denied: Host privilege required.");
    return;
  }

  bagData[currentSelectedBag].stock = 0;
  saveDataToStorage();

  document.getElementById("modalBagStock").textContent = `0 bags`;
}

// Host Sale Record Function (Host Only)
document.getElementById("saleForm").addEventListener("submit", function(e) {
  e.preventDefault();
  if (activeRole !== "HOST") {
    alert("Action Denied: Host privilege required.");
    return;
  }

  const name = document.getElementById("custName").value.trim();
  const mobile = document.getElementById("custMobile").value.trim();
  const village = document.getElementById("custVillage").value.trim();
  const qty = parseInt(document.getElementById("custQty").value, 10);
  
  const saleDate = new Date().toLocaleDateString('en-IN'); 
  const bag = bagData[currentSelectedBag];

  if (bag.stock < qty) {
    alert(`Insufficient stock! Current available stock is ${bag.stock} bags.`);
    return;
  }

  bag.stock -= qty;
  bag.buyers.push({ date: saleDate, name: name, mobile: mobile, village: village, qty: qty });
  
  saveDataToStorage();

  document.getElementById("modalBagStock").textContent = `${bag.stock} bags`;
  renderBuyersList(currentSelectedBag);
  this.reset();
});

// Render Buyers History Table with Search & Filter
function filterBuyersList() {
  if (currentSelectedBag) {
    renderBuyersList(currentSelectedBag);
  }
}

function parseINDate(dateStr) {
  // Convert DD/MM/YYYY into JS Date object
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  return new Date(dateStr);
}

function renderBuyersList(type) {
  const tbody = document.getElementById("modalBuyersList");
  tbody.innerHTML = "";
  const buyers = bagData[type].buyers || [];

  const searchQuery = (document.getElementById("buyerSearchInput")?.value || "").toLowerCase().trim();
  const dateFilter = document.getElementById("buyerDateFilter")?.value || "all";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredBuyers = buyers.map((b, originalIndex) => ({ ...b, originalIndex })).filter(b => {
    // Text search filter
    const matchText = b.name.toLowerCase().includes(searchQuery) ||
                      b.mobile.includes(searchQuery) ||
                      b.village.toLowerCase().includes(searchQuery);

    if (!matchText) return false;

    // Date range filter
    if (dateFilter === "all") return true;

    const entryDate = parseINDate(b.date);
    entryDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));

    if (dateFilter === "today") return diffDays === 0;
    if (dateFilter === "week") return diffDays >= 0 && diffDays <= 7;
    if (dateFilter === "month") return diffDays >= 0 && diffDays <= 30;

    return true;
  });

  if (filteredBuyers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#888;">No matching customer purchases found.</td></tr>`;
    return;
  }

  const encodedType = encodeURIComponent(type);

  tbody.innerHTML = filteredBuyers.map(b => {
    const totalCost = b.qty * bagData[type].price;
    const deleteBtn = activeRole === "HOST"
      ? `<button class="btn-delete" onclick="deleteSaleEntry('${encodedType}', ${b.originalIndex})">Delete</button>`
      : `<span style="color:#aaa; font-style:italic;">Read-Only</span>`;

    const shareBtn = `<button class="btn-whatsapp" onclick="shareViaWhatsApp('${encodedType}', ${b.originalIndex})">WhatsApp</button>`;
    const printBtn = `<button class="btn-print" onclick="printReceipt('${encodedType}', ${b.originalIndex})">Print</button>`;

    return `
      <tr>
        <td data-label="Date">${b.date}</td>
        <td data-label="Customer Name"><strong>${b.name}</strong></td>
        <td data-label="Mobile Number">${b.mobile}</td>
        <td data-label="Village">${b.village}</td>
        <td data-label="Bags Bought">${b.qty} Bag(s) (₹${totalCost})</td>
        <td data-label="Actions">
          <div class="action-btn-group">
            ${shareBtn}
            ${printBtn}
            ${deleteBtn}
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// Delete Sale Entry and Restore Stock (Host Only - Immediate execution, no confirmation popups)
function deleteSaleEntry(encodedType, index) {
  if (activeRole !== "HOST") {
    alert("Action Denied: Host privilege required.");
    return;
  }

  const type = decodeURIComponent(encodedType);
  const bag = bagData[type];
  const deletedEntry = bag.buyers.splice(index, 1)[0];

  bag.stock += deletedEntry.qty;
  saveDataToStorage();

  document.getElementById("modalBagStock").textContent = `${bag.stock} bags`;
  renderBuyersList(type);
}

// WhatsApp Share Generator
function shareViaWhatsApp(encodedType, index) {
  const type = decodeURIComponent(encodedType);
  const entry = bagData[type].buyers[index];
  const itemPrice = bagData[type].price;
  const totalCost = entry.qty * itemPrice;

  const text = `*FEED BAZAAR RECEIPT*%0A` +
               `--------------------------------%0A` +
               `*Customer:* ${entry.name}%0A` +
               `*Village:* ${entry.village}%0A` +
               `*Date:* ${entry.date}%0A` +
               `*Product:* Feed Bag FB-${type}%0A` +
               `*Quantity:* ${entry.qty} Bag(s)%0A` +
               `*Rate:* ₹${itemPrice} / bag%0A` +
               `*Total Amount:* ₹${totalCost}%0A` +
               `--------------------------------%0A` +
               `Thank you for buying from Feed Bazaar!`;

  window.open(`https://wa.me/91${entry.mobile}?text=${text}`, '_blank');
}

// Printable Bill Generator
function printReceipt(encodedType, index) {
  const type = decodeURIComponent(encodedType);
  const entry = bagData[type].buyers[index];
  const itemPrice = bagData[type].price;
  const totalCost = entry.qty * itemPrice;

  // Dynamically grab logo image src from your web page navbar
  const navbarLogo = document.querySelector('.brand-logo-img');
  const logoSrc = navbarLogo ? navbarLogo.src : 'logo.png';

  // Dynamic theme colors matching card themes
  let themeColor = '#023e8a'; // Blue (22%)
  if (type === '24%') themeColor = '#1b5e20'; // Green (24%)
  if (type === '20%') themeColor = '#800f2f'; // Red (20%)

  const printWindow = window.open('', '', 'width=650,height=850');
  printWindow.document.write(`
    <html>
      <head>
        <title>Receipt - Feed Bazaar Rajupalem</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 25px; 
            background-color: #f4f6f9; 
            color: #333; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .receipt-box { 
            background: #ffffff;
            border-radius: 16px;
            padding: 25px; 
            max-width: 480px; 
            margin: auto; 
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            border: 2px solid ${themeColor};
          }
          .header { 
            text-align: center; 
            border-bottom: 2px dashed #e0e0e0; 
            padding-bottom: 16px; 
            margin-bottom: 18px; 
          }
          .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 8px;
          }
          .brand-logo-img {
            height: 55px;
            width: auto;
            max-width: 220px;
            object-fit: contain;
          }
          .fb-badge {
            background: linear-gradient(135deg, #1b5e20, #2e7d32);
            color: #ffd700;
            font-weight: 900;
            font-size: 1.1rem;
            padding: 6px 12px;
            border-radius: 8px;
            letter-spacing: 1px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          }
          .store-name {
            font-size: 1.45rem;
            font-weight: 800;
            color: ${themeColor};
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .store-tagline {
            font-size: 0.85rem;
            color: #555;
            margin-top: 3px;
            font-weight: 600;
          }
          .section-title {
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #777;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .info-group {
            background-color: #f8fafc;
            border-radius: 10px;
            padding: 12px 14px;
            margin-bottom: 16px;
            border: 1px solid #e2e8f0;
          }
          .row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 6px; 
            font-size: 0.92rem;
          }
          .row:last-child { margin-bottom: 0; }
          .row .label { color: #64748b; font-weight: 500; }
          .row .value { font-weight: 600; color: #1e293b; }
          
          .item-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          .item-table th {
            background-color: ${themeColor};
            color: #ffffff;
            font-size: 0.85rem;
            padding: 10px 8px;
            text-align: left;
          }
          .item-table td {
            padding: 10px 8px;
            font-size: 0.9rem;
            border-bottom: 1px solid #e2e8f0;
          }
          .total-box { 
            background: linear-gradient(135deg, ${themeColor}, #0f172a);
            color: #ffffff;
            border-radius: 10px;
            padding: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 1.05rem;
            font-weight: bold;
            margin-top: 15px;
          }
          .total-amount {
            font-size: 1.35rem;
            color: #ffd700;
          }
          .footer { 
            text-align: center; 
            margin-top: 20px; 
            font-size: 0.85rem; 
            color: #64748b; 
          }
          .thank-you {
            font-weight: 700;
            color: ${themeColor};
            margin-bottom: 3px;
          }

          @media print {
            body { background: #ffffff; padding: 0; }
            .receipt-box { box-shadow: none; border-radius: 0; border: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <div class="logo-container">
              <span class="fb-badge">FB</span>
              <img src="${logoSrc}" alt="Feed Bazaar Logo" class="brand-logo-img" onerror="this.style.display='none'">
            </div>
            <div class="store-name">Feed Bazaar Rajupalem</div>
            <div class="store-tagline">Quality Cattle Feed Supplier</div>
          </div>

          <div class="section-title">Customer & Invoice Details</div>
          <div class="info-group">
            <div class="row"><span class="label">Invoice Date:</span> <span class="value">${entry.date}</span></div>
            <div class="row"><span class="label">Customer Name:</span> <span class="value">${entry.name}</span></div>
            <div class="row"><span class="label">Mobile Number:</span> <span class="value">+91 ${entry.mobile}</span></div>
            <div class="row"><span class="label">Village:</span> <span class="value">${entry.village}</span></div>
          </div>

          <div class="section-title">Purchase Summary</div>
          <table class="item-table">
            <thead>
              <tr>
                <th style="border-top-left-radius: 6px;">Product</th>
                <th>Qty</th>
                <th>Rate</th>
                <th style="text-align: right; border-top-right-radius: 6px;">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>FB-${type}</strong> Feed Bag</td>
                <td>${entry.qty}</td>
                <td>₹${itemPrice}</td>
                <td style="text-align: right;"><strong>₹${totalCost}</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="total-box">
            <span>Total Paid Amount</span>
            <span class="total-amount">₹${totalCost}</span>
          </div>

          <div class="footer">
            <p class="thank-you">Thank you for purchasing with us!</p>
            <p>Visit Feed Bazaar Rajupalem for premium quality feed.</p>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// Aggregate buyers sales by date across all feed types
function getDailySalesData() {
  const dailySales = {};

  Object.keys(bagData).forEach(type => {
    const buyers = bagData[type].buyers || [];
    buyers.forEach(entry => {
      const date = entry.date;
      const qty = entry.qty || 0;

      if (!dailySales[date]) {
        dailySales[date] = { "24%": 0, "22%": 0, "20%": 0, total: 0 };
      }

      if (dailySales[date][type] !== undefined) {
        dailySales[date][type] += qty;
      }
      dailySales[date].total += qty;
    });
  });

  return dailySales;
}

// Update preview numbers on card
function updateAnalyticsSummaryCard() {
  const dailySales = getDailySalesData();
  const todayDate = new Date().toLocaleDateString('en-IN');
  
  const todayTotal = dailySales[todayDate] ? dailySales[todayDate].total : 0;
  
  let overallTotal = 0;
  Object.values(dailySales).forEach(day => {
    overallTotal += day.total;
  });

  const todayElem = document.getElementById("todayTotalBags");
  const overallElem = document.getElementById("overallTotalBags");

  if (todayElem) todayElem.textContent = todayTotal;
  if (overallElem) overallElem.textContent = overallTotal;
}

// Render Daily Analytics Modal Table
function openAnalyticsModal() {
  const dailySales = getDailySalesData();
  const tbody = document.getElementById("analyticsTableBody");
  tbody.innerHTML = "";

  const dates = Object.keys(dailySales);

  if (dates.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#888;">No sales recorded on any date yet.</td></tr>`;
  } else {
    dates.reverse().forEach(date => {
      const data = dailySales[date];
      tbody.innerHTML += `
        <tr>
          <td><strong>${date}</strong></td>
          <td>${data["24%"]} Bag(s)</td>
          <td>${data["22%"]} Bag(s)</td>
          <td>${data["20%"]} Bag(s)</td>
          <td><strong style="color: #2e7d32;">${data.total} Bag(s)</strong></td>
        </tr>
      `;
    });
  }

  document.getElementById("analyticsModal").style.display = "block";
}

// Export Daily Analytics Report to CSV
function exportAnalyticsToCSV() {
  const dailySales = getDailySalesData();
  const dates = Object.keys(dailySales);

  if (dates.length === 0) {
    alert("No sales data available to export.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,Date,FB-24% Sold,FB-22% Sold,FB-20% Sold,Total Bags Sold\n";

  dates.forEach(date => {
    const row = dailySales[date];
    csvContent += `"${date}",${row["24%"]},${row["22%"]},${row["20%"]},${row.total}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `FeedBazaar_Sales_Report_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Download JSON Data Backup (Host Only)
function downloadDataBackup() {
  if (activeRole !== "HOST") {
    alert("Action Denied: Host privilege required.");
    return;
  }

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bagData, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `FeedBazaar_Backup_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
}

// Restore Data from JSON Backup File (Host Only)
function restoreDataBackup(event) {
  if (activeRole !== "HOST") {
    alert("Action Denied: Host privilege required.");
    return;
  }

  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsedData = JSON.parse(e.target.result);
      if (parsedData["24%"] && parsedData["22%"] && parsedData["20%"]) {
        bagData = parsedData;
        saveDataToStorage();
        location.reload();
      } else {
        alert("Invalid backup file structure.");
      }
    } catch (err) {
      alert("Error reading file: Invalid JSON structure.");
    }
  };
  reader.readAsText(file);
}

// Close Modal Helper
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

window.onclick = function(event) {
  const bagModal = document.getElementById("bagModal");
  const analyticsModal = document.getElementById("analyticsModal");
  const changePasswordModal = document.getElementById("changePasswordModal");
  const demoLoginModal = document.getElementById("demoLoginModal");

  if (event.target === bagModal) bagModal.style.display = "none";
  if (event.target === analyticsModal) analyticsModal.style.display = "none";
  if (event.target === changePasswordModal) changePasswordModal.style.display = "none";
  if (event.target === demoLoginModal) demoLoginModal.style.display = "none";
};