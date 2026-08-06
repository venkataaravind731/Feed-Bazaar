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
    alert("Welcome back, Host! Previous inventory data has been loaded.");
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
        alert("Logged in as Demo Viewer. You can view all live inventory and analytics data.");
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
  alert("Password changed successfully! Please use your new password for future logins.");
  closeModal("changePasswordModal");
});

// Logout Handling
function handleLogout() {
  activeRole = null;
  
  document.getElementById("heroSection").style.display = "flex";
  document.getElementById("mainDashboard").style.display = "none";
  document.getElementById("loggedInNav").style.display = "none";
  
  document.body.classList.remove("host-logged-in", "demo-logged-in");
  alert("Logged out successfully.");
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

  renderBuyersList(type);
  document.getElementById("bagModal").style.display = "block";
}

// Add Stock Function (Host Only)
function updateStockByHost() {
  if (activeRole !== "HOST") {
    alert("Action Denied: Host privilege required.");
    return;
  }

  const newBags = parseInt(document.getElementById("newStockInput").value, 10);
  
  if (isNaN(newBags) || newBags <= 0) {
    alert("Please enter a valid number of new bags.");
    return;
  }

  bagData[currentSelectedBag].stock += newBags;
  saveDataToStorage();
  
  document.getElementById("modalBagStock").textContent = `${bagData[currentSelectedBag].stock} bags`;
  document.getElementById("newStockInput").value = "";
  
  alert(`Successfully added ${newBags} bags! Total stock for FB-${currentSelectedBag} is now ${bagData[currentSelectedBag].stock} bags.`);
}

// Clear / Reset Stock Function (Host Only)
function clearStockByHost() {
  if (activeRole !== "HOST") {
    alert("Action Denied: Host privilege required.");
    return;
  }

  const confirmed = confirm(`Are you sure you want to delete/reset current stock for FB-${currentSelectedBag} to 0?`);
  if (!confirmed) return;

  bagData[currentSelectedBag].stock = 0;
  saveDataToStorage();

  document.getElementById("modalBagStock").textContent = `0 bags`;
  alert(`Stock for FB-${currentSelectedBag} has been reset to 0 bags.`);
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
  
  alert(`Sale recorded! Deducted ${qty} bag(s) from inventory.`);
});

// Render Buyers History Table
function renderBuyersList(type) {
  const tbody = document.getElementById("modalBuyersList");
  tbody.innerHTML = "";
  const buyers = bagData[type].buyers;

  if (!buyers || buyers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#888;">No customer purchases recorded yet.</td></tr>`;
    return;
  }

  const encodedType = encodeURIComponent(type);

  tbody.innerHTML = buyers.map((b, index) => {
    const actionCell = activeRole === "HOST"
      ? `<button class="btn-delete" onclick="deleteSaleEntry('${encodedType}', ${index})">Delete</button>`
      : `<span style="color:#aaa; font-style:italic;">Read-Only</span>`;

    return `
      <tr>
        <td>${b.date}</td>
        <td><strong>${b.name}</strong></td>
        <td>${b.mobile}</td>
        <td>${b.village}</td>
        <td>${b.qty} Bag(s)</td>
        <td>${actionCell}</td>
      </tr>
    `;
  }).join("");
}

// Delete Sale Entry and Restore Stock (Host Only)
function deleteSaleEntry(encodedType, index) {
  if (activeRole !== "HOST") {
    alert("Action Denied: Host privilege required.");
    return;
  }

  const type = decodeURIComponent(encodedType);
  const confirmed = confirm("Are you sure you want to delete this sales entry? The deducted bags will be restored back to stock.");
  if (!confirmed) return;

  const bag = bagData[type];
  const deletedEntry = bag.buyers.splice(index, 1)[0];

  bag.stock += deletedEntry.qty;
  saveDataToStorage();

  document.getElementById("modalBagStock").textContent = `${bag.stock} bags`;
  renderBuyersList(type);

  alert(`Sales entry deleted! ${deletedEntry.qty} bag(s) added back to current stock.`);
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