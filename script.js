// Default Data Structure
const defaultBagData = {
  "24%": { price: 1750, stock: 0, buyers: [] },
  "22%": { price: 1650, stock: 0, buyers: [] },
  "20%": { price: 1450, stock: 0, buyers: [] }
};

// Load saved data from localStorage, or fall back to default
let bagData = JSON.parse(localStorage.getItem("feedBazaarData")) || defaultBagData;

// Function to save current state to localStorage
function saveDataToStorage() {
  localStorage.setItem("feedBazaarData", JSON.stringify(bagData));
}

// Fixed Host Credentials
const HOST_CREDENTIALS = {
  mobile: "9704862468",
  password: "9704862468"
};

let isHostLoggedIn = false;
let currentSelectedBag = null;

// Centered Form Host Login Handler
document.getElementById("hostLoginForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const mobile = document.getElementById("hostMobile").value.trim();
  const password = document.getElementById("hostPassword").value.trim();

  if (mobile === HOST_CREDENTIALS.mobile && password === HOST_CREDENTIALS.password) {
    isHostLoggedIn = true;
    
    // Hide Hero Login Card & Reveal Main Dashboard
    document.getElementById("heroSection").style.display = "none";
    document.getElementById("mainDashboard").style.display = "block";
    document.getElementById("loggedInNav").style.display = "block";
    
    document.body.classList.add("host-logged-in");
    
    alert("Welcome back, Host! Previous inventory data has been loaded.");
    
    // Smooth scroll down to main dashboard
    document.getElementById("mainDashboard").scrollIntoView({ behavior: 'smooth' });
  } else {
    alert("Access Denied: Invalid Host Credentials!");
  }
  this.reset();
});

// Logout Handling
function handleLogout() {
  isHostLoggedIn = false;
  
  // Hide Main Dashboard & Show Centered Login Hero
  document.getElementById("heroSection").style.display = "flex";
  document.getElementById("mainDashboard").style.display = "none";
  document.getElementById("loggedInNav").style.display = "none";
  
  document.body.classList.remove("host-logged-in");
  alert("Host logged out successfully. Data is safely saved!");
}

// Open Bag Details Modal
function handleBagClick(type) {
  currentSelectedBag = type;
  const bag = bagData[type];

  document.getElementById("modalBagTitle").textContent = `FB-${type} Feed Bag Management`;
  document.getElementById("modalBagPrice").textContent = `₹${bag.price}`;
  document.getElementById("modalBagStock").textContent = `${bag.stock} bags`;

  renderBuyersList(type);
  document.getElementById("bagModal").style.display = "block";
}

// Add Stock Function
function updateStockByHost() {
  if (!isHostLoggedIn) return;

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

// Clear / Delete Stock Function
function clearStockByHost() {
  if (!isHostLoggedIn) return;

  const confirmed = confirm(`Are you sure you want to delete/reset current stock for FB-${currentSelectedBag} to 0?`);
  if (!confirmed) return;

  bagData[currentSelectedBag].stock = 0;
  saveDataToStorage();

  document.getElementById("modalBagStock").textContent = `0 bags`;
  alert(`Stock for FB-${currentSelectedBag} has been reset to 0 bags.`);
}

// Host Sale Record Function
document.getElementById("saleForm").addEventListener("submit", function(e) {
  e.preventDefault();
  if (!isHostLoggedIn) return;

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

  // Deduct stock and store sale entry
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

  buyers.forEach((b, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${b.date}</td>
        <td><strong>${b.name}</strong></td>
        <td>${b.mobile}</td>
        <td>${b.village}</td>
        <td>${b.qty} Bag(s)</td>
        <td>
          <button class="btn-delete" onclick="deleteSaleEntry('${type}', ${index})">Delete</button>
        </td>
      </tr>
    `;
  });
}

// Delete Sale Entry and Restore Stock
function deleteSaleEntry(type, index) {
  if (!isHostLoggedIn) return;

  const confirmed = confirm("Are you sure you want to delete this sales entry? The deducted bags will be restored back to stock.");
  if (!confirmed) return;

  const bag = bagData[type];
  const deletedEntry = bag.buyers.splice(index, 1)[0];

  // Restore deleted bags back to current stock total
  bag.stock += deletedEntry.qty;
  saveDataToStorage();

  document.getElementById("modalBagStock").textContent = `${bag.stock} bags`;
  renderBuyersList(type);

  alert(`Sales entry deleted! ${deletedEntry.qty} bag(s) added back to current stock.`);
}

// Close Modal Helper
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}