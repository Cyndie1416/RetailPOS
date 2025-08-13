// Sari-Sari Store POS System - Main JavaScript File
// Updated to use file-based JSON storage with manual save option

// Global variables
let products = [];
let customers = [];
let sales = [];
let settings = {};
let suppliers = [];
let orders = [];
let users = [];
let currentUser = null;
let cart = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting application...');
    loadData();
    console.log('Data loading completed');
    console.log('Users loaded:', users);
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Login form submission
    document.getElementById('loginPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
}

// Login function
async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    console.log('Login attempt:', { username, password });
    console.log('Available users:', users);
    
    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }
    
    try {
        const user = users.find(u => u.username === username && u.password === password);
        console.log('Found user:', user);
        
        if (user && user.status === 'active') {
            currentUser = user;
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('mainApp').style.display = 'block';
            document.getElementById('userName').textContent = user.name;
            
            console.log('Login successful for:', user.name);
            
            // Update user permissions
            updateUserPermissions();
            
            // Update last login
            user.lastLogin = new Date().toISOString();
            saveData();
            
            // Load initial data
            displayProducts();
            displayInventory();
            displayCustomers();
            displaySuppliers();
            displayUsers();
            displayReports();
            loadSettings();
            
        } else if (user && user.status !== 'active') {
            alert(`User account is ${user.status}. Please contact administrator.`);
        } else {
            alert('Invalid username or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again. Error: ' + error.message);
    }
}

// Logout function
function logout() {
    currentUser = null;
    cart = [];
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

// Update user permissions based on role
function updateUserPermissions() {
    if (!currentUser) return;
    
    const permissions = currentUser.permissions;
    
    // Show/hide tabs based on permissions
    document.getElementById('usersTab').style.display = permissions.users ? 'inline-block' : 'none';
    
    // Disable buttons based on permissions
    const inventoryBtn = document.querySelector('button[onclick="showAddProductModal()"]');
    if (inventoryBtn) inventoryBtn.style.display = permissions.inventory ? 'inline-block' : 'none';
    
    const customersBtn = document.querySelector('button[onclick="showAddCustomerModal()"]');
    if (customersBtn) customersBtn.style.display = permissions.customers ? 'inline-block' : 'none';
    
    const suppliersBtn = document.querySelector('button[onclick="showAddSupplierModal()"]');
    if (suppliersBtn) suppliersBtn.style.display = permissions.suppliers ? 'inline-block' : 'none';
    
    const usersBtn = document.querySelector('button[onclick="showAddUserModal()"]');
    if (usersBtn) usersBtn.style.display = permissions.users ? 'inline-block' : 'none';
}

// Data Management Functions - No file fetching needed
function loadData() {
    console.log('Loading sample data...');
    loadSampleData(); // Always load sample data for now
}

function saveData() {
    try {
        // Automatically save to JSON files
        saveToJSONFiles();
        console.log('Data saved automatically to JSON files');
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data. Please check the console for details.');
    }
}

function saveToJSONFiles() {
    // Create downloadable files for each data type
    const dataFiles = {
        'products.json': products,
        'customers.json': customers,
        'sales.json': sales,
        'settings.json': settings,
        'suppliers.json': suppliers,
        'orders.json': orders,
        'users.json': users
    };
    
    // Download each file automatically
    Object.entries(dataFiles).forEach(([filename, data]) => {
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });
    
    // Show success message
    showSaveSuccess();
}

function showSaveSuccess() {
    // Create success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; 
        background: #27ae60; color: white; padding: 15px 20px; 
        border-radius: 8px; z-index: 2000; font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    notification.innerHTML = '✅ Data saved successfully! Files downloaded.';
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Load sample data if files don't exist
function loadSampleData() {
    products = [
        {
            id: 1,
            name: "Coca Cola 330ml",
            category: "beverages",
            price: 25.00,
            stock: 50,
            unit: "bottle",
            barcode: "123456789",
            minStock: 10,
            supplierId: 1,
            supplierName: "ABC Distributors",
            expiryDate: "2024-12-31",
            costPrice: 20.00,
            condition: "good",
            location: "Shelf A1"
        },
        {
            id: 2,
            name: "Pepsi 330ml",
            category: "beverages",
            price: 23.00,
            stock: 45,
            unit: "bottle",
            barcode: "987654321",
            minStock: 8,
            supplierId: 1,
            supplierName: "ABC Distributors",
            expiryDate: "2024-11-30",
            costPrice: 18.00,
            condition: "good",
            location: "Shelf A2"
        },
        {
            id: 3,
            name: "Lucky Me Pancit Canton",
            category: "snacks",
            price: 15.00,
            stock: 30,
            unit: "pack",
            barcode: "456789123",
            minStock: 5,
            supplierId: 1,
            supplierName: "ABC Distributors",
            expiryDate: "2024-10-15",
            costPrice: 12.00,
            condition: "good",
            location: "Shelf B1"
        },
        {
            id: 4,
            name: "Nissin Cup Noodles",
            category: "snacks",
            price: 18.00,
            stock: 25,
            unit: "cup",
            barcode: "789123456",
            minStock: 5,
            supplierId: 1,
            supplierName: "ABC Distributors",
            expiryDate: "2024-09-20",
            costPrice: 14.00,
            condition: "good",
            location: "Shelf B2"
        },
        {
            id: 5,
            name: "Tide Powder Detergent",
            category: "household",
            price: 45.00,
            stock: 15,
            unit: "pack",
            barcode: "321654987",
            minStock: 3,
            supplierId: 1,
            supplierName: "ABC Distributors",
            expiryDate: "2025-06-30",
            costPrice: 35.00,
            condition: "good",
            location: "Shelf C1"
        },
        {
            id: 6,
            name: "Colgate Toothpaste",
            category: "personal",
            price: 35.00,
            stock: 20,
            unit: "tube",
            barcode: "147258369",
            minStock: 4,
            supplierId: 1,
            supplierName: "ABC Distributors",
            expiryDate: "2025-03-15",
            costPrice: 28.00,
            condition: "good",
            location: "Shelf D1"
        }
    ];
    
    customers = [
        {
            id: 1,
            name: "Juan Dela Cruz",
            phone: "+63 912 345 6789",
            address: "123 Main Street, Barangay 1",
            location: {
                latitude: 14.5995,
                longitude: 120.9842,
                googleMapsUrl: "https://maps.google.com/?q=14.5995,120.9842"
            },
            creditLimit: 500.00,
            utang: 150.00,
            itemsToReturn: ["Coca Cola bottle"],
            smsEnabled: true,
            lastSmsReminder: "2024-01-10",
            customerType: "regular",
            utangHistory: [],
            paymentHistory: [],
            createdDate: "2023-06-01",
            lastVisit: "2024-01-15",
            status: "active"
        }
    ];
    
    sales = [];
    settings = {
        storeName: "Sari-Sari Store",
        storeAddress: "123 Main Street, City",
        storePhone: "+63 912 345 6789"
    };
    
    suppliers = [
        {
            id: 1,
            name: "ABC Distributors",
            contactPerson: "Juan Santos",
            phone: "+63 912 345 6789",
            email: "juan@abcdistributors.com",
            address: "123 Supplier Street, Manila",
            products: ["Coca Cola", "Pepsi", "Sprite"],
            paymentTerms: "Net 30",
            lastOrder: "2024-01-15",
            status: "active"
        }
    ];
    
    orders = [];
    users = [
        {
            id: 1,
            username: "owner",
            password: "owner123",
            name: "Store Owner",
            role: "owner",
            email: "owner@saripos.com",
            phone: "+63 912 345 6789",
            permissions: {
                pos: true,
                inventory: true,
                customers: true,
                reports: true,
                settings: true,
                suppliers: true,
                users: true,
                finance: true
            },
            lastLogin: "2024-01-15T10:30:00.000Z",
            status: "active"
        },
        {
            id: 2,
            username: "cashier",
            password: "cashier123",
            name: "Store Cashier",
            role: "cashier",
            email: "cashier@saripos.com",
            phone: "+63 923 456 7890",
            permissions: {
                pos: true,
                inventory: false,
                customers: true,
                reports: false,
                settings: false,
                suppliers: false,
                users: false,
                finance: false
            },
            lastLogin: "2024-01-15T09:15:00.000Z",
            status: "active"
        }
    ];
}

// Tab Management
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // Load tab-specific data
    switch(tabName) {
        case 'pos':
            displayProducts();
            break;
        case 'inventory':
            displayInventory();
            break;
        case 'customers':
            displayCustomers();
            break;
        case 'suppliers':
            displaySuppliers();
            break;
        case 'reports':
            displayReports();
            break;
        case 'users':
            displayUsers();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Product Management
function displayProducts() {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        if (product.stock > 0) {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <h3>${product.name}</h3>
                <p class="price">₱${product.price.toFixed(2)}</p>
                <p class="stock">Stock: ${product.stock} ${product.unit}</p>
                <button onclick="addToCart(${product.id})" class="add-btn">Add to Cart</button>
            `;
            productsGrid.appendChild(productCard);
        }
    });
}

function searchProducts() {
    const searchTerm = document.getElementById('searchProduct').value.toLowerCase();
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        if (product.stock > 0 && 
            (product.name.toLowerCase().includes(searchTerm) || 
             product.barcode.includes(searchTerm))) {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <h3>${product.name}</h3>
                <p class="price">₱${product.price.toFixed(2)}</p>
                <p class="stock">Stock: ${product.stock} ${product.unit}</p>
                <button onclick="addToCart(${product.id})" class="add-btn">Add to Cart</button>
            `;
            productsGrid.appendChild(productCard);
        }
    });
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }
    
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    cartItems.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <span>${item.name} x ${item.quantity}</span>
            <span>₱${itemTotal.toFixed(2)}</span>
            <button onclick="removeFromCart(${item.id})" class="remove-btn">×</button>
        `;
        cartItems.appendChild(cartItem);
    });
    
    cartTotal.textContent = `Total: ₱${total.toFixed(2)}`;
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
}

function clearCart() {
    cart = [];
    updateCartDisplay();
}

function processPayment(method) {
    if (cart.length === 0) {
        alert('Cart is empty!');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create sale record
    const sale = {
        id: Date.now(),
        date: new Date().toISOString(),
        items: cart.map(item => ({
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
        })),
        total: total,
        paymentMethod: method,
        cashier: currentUser ? currentUser.name : 'Unknown'
    };
    
    sales.push(sale);
    
    // Update product stock
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
            product.stock -= item.quantity;
        }
    });
    
    // Clear cart
    cart = [];
    updateCartDisplay();
    
    // Show success message
    alert(`Payment processed successfully!\nTotal: ₱${total.toFixed(2)}\nMethod: ${method.toUpperCase()}`);
    
    // Save data
    saveData();
}

// Inventory Management
function displayInventory() {
    const tableBody = document.getElementById('inventoryTableBody');
    tableBody.innerHTML = '';
    
    // Get search filters
    const searchName = document.getElementById('inventorySearchName')?.value.toLowerCase() || '';
    const searchBarcode = document.getElementById('inventorySearchBarcode')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('inventoryCategoryFilter')?.value || '';
    
    // Filter products
    let filteredProducts = products.filter(product => {
        const matchesName = !searchName || product.name.toLowerCase().includes(searchName);
        const matchesBarcode = !searchBarcode || (product.barcode && product.barcode.toLowerCase().includes(searchBarcode));
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        
        return matchesName && matchesBarcode && matchesCategory;
    });
    
    // Show search info if filters are active
    const searchInfo = document.getElementById('inventorySearchInfo');
    const searchText = document.getElementById('inventorySearchText');
    
    if (searchInfo && searchText) {
        if (searchName || searchBarcode || categoryFilter) {
            let infoText = `Showing ${filteredProducts.length} of ${products.length} products`;
            if (searchName) infoText += ` matching "${searchName}"`;
            if (searchBarcode) infoText += ` with barcode "${searchBarcode}"`;
            if (categoryFilter) infoText += ` in category "${categoryFilter}"`;
            
            searchText.textContent = infoText;
            searchInfo.style.display = 'block';
        } else {
            searchInfo.style.display = 'none';
        }
    }
    
    filteredProducts.forEach(product => {
        const row = document.createElement('tr');
        
        // Check expiry status
        let expiryStatus = 'No expiry';
        if (product.expiryDate) {
            const today = new Date();
            const expiryDate = new Date(product.expiryDate);
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry < 0) {
                expiryStatus = `<span style="color: #e74c3c; font-weight: bold;">Expired (${Math.abs(daysUntilExpiry)} days ago)</span>`;
            } else if (daysUntilExpiry <= 30) {
                expiryStatus = `<span style="color: #f39c12; font-weight: bold;">Expires in ${daysUntilExpiry} days</span>`;
            } else {
                expiryStatus = expiryDate.toLocaleDateString();
            }
        }
        
        // Check stock status
        let stockStatus = '';
        if (product.stock <= 0) {
            stockStatus = '<span style="color: #e74c3c; font-weight: bold;">Out of Stock</span>';
        } else if (product.stock <= 5) {
            stockStatus = '<span style="color: #f39c12; font-weight: bold;">Low Stock</span>';
        } else {
            stockStatus = '<span style="color: #27ae60; font-weight: bold;">In Stock</span>';
        }
        
        // Highlight search terms
        let displayName = product.name;
        let displayBarcode = product.barcode || 'N/A';
        
        if (searchName) {
            const regex = new RegExp(`(${searchName})`, 'gi');
            displayName = displayName.replace(regex, '<mark style="background: #ffeb3b; padding: 2px;">$1</mark>');
        }
        
        if (searchBarcode && product.barcode) {
            const regex = new RegExp(`(${searchBarcode})`, 'gi');
            displayBarcode = displayBarcode.replace(regex, '<mark style="background: #ffeb3b; padding: 2px;">$1</mark>');
        }
        
        row.innerHTML = `
            <td><strong>${displayName}</strong></td>
            <td>${product.category}</td>
            <td>₱${product.price.toFixed(2)}</td>
            <td>${product.stock} ${product.unit}</td>
            <td>${expiryStatus}</td>
            <td>${product.supplierName || 'N/A'}</td>
            <td>${stockStatus}</td>
            <td>
                <button onclick="restockProduct(${product.id})" class="btn btn-sm btn-primary">Restock</button>
                <button onclick="editProduct(${product.id})" class="btn btn-sm btn-warning">Edit</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function showAddProductModal() {
    // Populate supplier dropdown
    const supplierSelect = document.getElementById('newProductSupplier');
    supplierSelect.innerHTML = '<option value="">Select Supplier</option>';
    suppliers.forEach(supplier => {
        supplierSelect.innerHTML += `<option value="${supplier.id}">${supplier.name}</option>`;
    });
    
    document.getElementById('addProductModal').style.display = 'block';
}

function addProduct() {
    const name = document.getElementById('newProductName').value;
    const category = document.getElementById('newProductCategory').value;
    const price = parseFloat(document.getElementById('newProductPrice').value);
    const costPrice = parseFloat(document.getElementById('newProductCostPrice').value);
    const stock = parseInt(document.getElementById('newProductStock').value);
    const unit = document.getElementById('newProductUnit').value;
    const expiry = document.getElementById('newProductExpiry').value;
    const supplierId = document.getElementById('newProductSupplier').value;
    const location = document.getElementById('newProductLocation').value;
    const barcode = document.getElementById('newProductBarcode').value;
    
    if (!name || !price || stock < 0) {
        alert('Please fill in all required fields');
        return;
    }
    
    const supplier = suppliers.find(s => s.id == supplierId);
    
    const newProduct = {
        id: Date.now(),
        name: name,
        category: category,
        price: price,
        costPrice: costPrice || 0,
        stock: stock,
        unit: unit,
        barcode: barcode || '',
        minStock: Math.ceil(stock * 0.2), // 20% of current stock
        supplierId: supplierId ? parseInt(supplierId) : null,
        supplierName: supplier ? supplier.name : null,
        expiryDate: expiry || null,
        condition: 'good',
        location: location || 'Unknown'
    };
    
    products.push(newProduct);
    
    // Close modal and clear form
    closeModal('addProductModal');
    clearProductForm();
    
    // Update displays
    displayProducts();
    displayInventory();
    
    // Save data
    saveData();
}

function clearProductForm() {
    document.getElementById('newProductName').value = '';
    document.getElementById('newProductCategory').value = 'snacks';
    document.getElementById('newProductPrice').value = '';
    document.getElementById('newProductCostPrice').value = '';
    document.getElementById('newProductStock').value = '';
    document.getElementById('newProductUnit').value = 'piece';
    document.getElementById('newProductExpiry').value = '';
    document.getElementById('newProductSupplier').value = '';
    document.getElementById('newProductLocation').value = '';
    document.getElementById('newProductBarcode').value = '';
}

function restockProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const quantity = prompt(`Enter restock quantity for ${product.name}:`, '10');
    if (quantity && !isNaN(quantity)) {
        product.stock += parseInt(quantity);
        displayInventory();
        saveData();
    }
}

// Customer Management
function displayCustomers() {
    const tableBody = document.getElementById('customersTableBody');
    tableBody.innerHTML = '';
    
    customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.name}</td>
            <td>${customer.phone}</td>
            <td>${customer.address}</td>
            <td>₱${customer.utang.toFixed(2)}</td>
            <td>${customer.itemsToReturn.join(', ') || 'None'}</td>
            <td>${new Date(customer.lastVisit).toLocaleDateString()}</td>
            <td>
                <button onclick="viewCustomerDetails(${customer.id})" class="btn btn-sm btn-info">View</button>
                <button onclick="addUtang(${customer.id})" class="btn btn-sm btn-warning">Add Utang</button>
                <button onclick="recordPayment(${customer.id})" class="btn btn-sm btn-success">Payment</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function showAddCustomerModal() {
    document.getElementById('addCustomerModal').style.display = 'block';
}

function addCustomer() {
    const name = document.getElementById('newCustomerName').value;
    const phone = document.getElementById('newCustomerPhone').value;
    const address = document.getElementById('newCustomerAddress').value;
    const creditLimit = parseFloat(document.getElementById('newCustomerCreditLimit').value) || 0;
    const smsEnabled = document.getElementById('newCustomerSmsEnabled').checked;
    
    if (!name || !phone) {
        alert('Please fill in name and phone number');
        return;
    }
    
    const newCustomer = {
        id: Date.now(),
        name: name,
        phone: phone,
        address: address,
        location: {
            latitude: 0,
            longitude: 0,
            googleMapsUrl: ""
        },
        creditLimit: creditLimit,
        utang: 0,
        itemsToReturn: [],
        smsEnabled: smsEnabled,
        lastSmsReminder: null,
        customerType: "new",
        utangHistory: [],
        paymentHistory: [],
        createdDate: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        status: "active"
    };
    
    customers.push(newCustomer);
    
    // Close modal and clear form
    closeModal('addCustomerModal');
    clearCustomerForm();
    
    // Update display
    displayCustomers();
    
    // Save data
    saveData();
}

function clearCustomerForm() {
    document.getElementById('newCustomerName').value = '';
    document.getElementById('newCustomerPhone').value = '';
    document.getElementById('newCustomerAddress').value = '';
    document.getElementById('newCustomerCreditLimit').value = '';
    document.getElementById('newCustomerSmsEnabled').checked = true;
}

function addUtang(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const amount = prompt(`Enter utang amount for ${customer.name}:`, '0');
    if (amount && !isNaN(amount)) {
        const utangAmount = parseFloat(amount);
        customer.utang += utangAmount;
        
        // Add to utang history
        const utangRecord = {
            id: Date.now(),
            date: new Date().toISOString(),
            items: [],
            amount: utangAmount,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            status: 'unpaid',
            notes: 'Manual utang entry'
        };
        
        customer.utangHistory.push(utangRecord);
        displayCustomers();
        saveData();
    }
}

function recordPayment(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const amount = prompt(`Enter payment amount for ${customer.name} (Current utang: ₱${customer.utang.toFixed(2)}):`, '0');
    if (amount && !isNaN(amount)) {
        const paymentAmount = parseFloat(amount);
        customer.utang = Math.max(0, customer.utang - paymentAmount);
        
        // Add to payment history
        const paymentRecord = {
            date: new Date().toISOString(),
            amount: paymentAmount,
            method: 'cash',
            notes: 'Manual payment'
        };
        
        customer.paymentHistory.push(paymentRecord);
        displayCustomers();
        saveData();
    }
}

// Supplier Management
function displaySuppliers() {
    const tableBody = document.getElementById('suppliersTableBody');
    tableBody.innerHTML = '';
    
    suppliers.forEach(supplier => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${supplier.name}</td>
            <td>${supplier.contactPerson}</td>
            <td>${supplier.phone}</td>
            <td>${supplier.email}</td>
            <td>${supplier.products.join(', ')}</td>
            <td>${supplier.lastOrder || 'Never'}</td>
            <td>
                <button onclick="viewSupplierDetails(${supplier.id})" class="btn btn-sm btn-info">View</button>
                <button onclick="createOrder(${supplier.id})" class="btn btn-sm btn-primary">Order</button>
                <button onclick="editSupplier(${supplier.id})" class="btn btn-sm btn-warning">Edit</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function showAddSupplierModal() {
    document.getElementById('addSupplierModal').style.display = 'block';
}

function addSupplier() {
    const name = document.getElementById('newSupplierName').value;
    const contact = document.getElementById('newSupplierContact').value;
    const phone = document.getElementById('newSupplierPhone').value;
    const email = document.getElementById('newSupplierEmail').value;
    const address = document.getElementById('newSupplierAddress').value;
    const paymentTerms = document.getElementById('newSupplierPaymentTerms').value;
    
    if (!name || !contact || !phone) {
        alert('Please fill in supplier name, contact person, and phone number');
        return;
    }
    
    const newSupplier = {
        id: Date.now(),
        name: name,
        contactPerson: contact,
        phone: phone,
        email: email || '',
        address: address || '',
        products: [],
        paymentTerms: paymentTerms || 'Net 30',
        lastOrder: null,
        status: 'active'
    };
    
    suppliers.push(newSupplier);
    
    // Close modal and clear form
    closeModal('addSupplierModal');
    clearSupplierForm();
    
    // Update display
    displaySuppliers();
    
    // Save data
    saveData();
}

function clearSupplierForm() {
    document.getElementById('newSupplierName').value = '';
    document.getElementById('newSupplierContact').value = '';
    document.getElementById('newSupplierPhone').value = '';
    document.getElementById('newSupplierEmail').value = '';
    document.getElementById('newSupplierAddress').value = '';
    document.getElementById('newSupplierPaymentTerms').value = '';
}

function createOrder(supplierId) {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;
    
    // Find products from this supplier that need restocking
    const lowStockProducts = products.filter(p => 
        p.supplierId === supplierId && p.stock <= p.minStock
    );
    
    if (lowStockProducts.length === 0) {
        alert('No products from this supplier need restocking');
        return;
    }
    
    // Create order
    const order = {
        id: Date.now(),
        supplierId: supplierId,
        supplierName: supplier.name,
        date: new Date().toISOString(),
        items: lowStockProducts.map(product => ({
            productName: product.name,
            quantity: product.minStock * 2, // Order 2x minimum stock
            unitPrice: product.costPrice,
            totalPrice: product.costPrice * (product.minStock * 2)
        })),
        totalAmount: lowStockProducts.reduce((sum, product) => 
            sum + (product.costPrice * (product.minStock * 2)), 0
        ),
        status: 'pending',
        deliveryDate: null,
        notes: 'Auto-generated order for low stock items'
    };
    
    orders.push(order);
    
    // Update supplier last order
    supplier.lastOrder = new Date().toISOString();
    
    alert(`Order created for ${supplier.name}!\nTotal: ₱${order.totalAmount.toFixed(2)}\nItems: ${order.items.length}`);
    
    displaySuppliers();
    saveData();
}

function viewSupplierDetails(supplierId) {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;
    
    alert(`Supplier Details:\n\nName: ${supplier.name}\nContact: ${supplier.contactPerson}\nPhone: ${supplier.phone}\nEmail: ${supplier.email}\nAddress: ${supplier.address}\nPayment Terms: ${supplier.paymentTerms}\nLast Order: ${supplier.lastOrder || 'Never'}`);
}

function editSupplier(supplierId) {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;
    
    alert('Edit supplier functionality will be implemented in the next version.');
}

function viewCustomerDetails(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    alert(`Customer Details:\n\nName: ${customer.name}\nPhone: ${customer.phone}\nAddress: ${customer.address}\nUtang: ₱${customer.utang.toFixed(2)}\nItems to Return: ${customer.itemsToReturn.join(', ') || 'None'}\nLast Visit: ${new Date(customer.lastVisit).toLocaleDateString()}`);
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    alert('Edit product functionality will be implemented in the next version.');
}

function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    alert('Edit user functionality will be implemented in the next version.');
}

// User Management
function displayUsers() {
    const tableBody = document.getElementById('usersTableBody');
    tableBody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.name}</td>
            <td>${user.role}</td>
            <td>${user.email}</td>
            <td>${new Date(user.lastLogin).toLocaleDateString()}</td>
            <td><span style="color: ${user.status === 'active' ? 'green' : 'red'};">${user.status}</span></td>
            <td>
                <button onclick="editUser(${user.id})" class="btn btn-sm btn-warning">Edit</button>
                <button onclick="toggleUserStatus(${user.id})" class="btn btn-sm btn-${user.status === 'active' ? 'danger' : 'success'}">${user.status === 'active' ? 'Disable' : 'Enable'}</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function showAddUserModal() {
    document.getElementById('addUserModal').style.display = 'block';
}

function addUser() {
    const username = document.getElementById('newUserUsername').value;
    const password = document.getElementById('newUserPassword').value;
    const name = document.getElementById('newUserName').value;
    const role = document.getElementById('newUserRole').value;
    const email = document.getElementById('newUserEmail').value;
    const phone = document.getElementById('newUserPhone').value;
    
    if (!username || !password || !name) {
        alert('Please fill in username, password, and name');
        return;
    }
    
    // Check if username already exists
    if (users.find(u => u.username === username)) {
        alert('Username already exists');
        return;
    }
    
    // Set permissions based on role
    const permissions = {
        pos: true,
        inventory: role === 'owner',
        customers: true,
        reports: role === 'owner',
        settings: role === 'owner',
        suppliers: role === 'owner',
        users: role === 'owner',
        finance: role === 'owner'
    };
    
    const newUser = {
        id: Date.now(),
        username: username,
        password: password,
        name: name,
        role: role,
        email: email || '',
        phone: phone || '',
        permissions: permissions,
        lastLogin: null,
        status: 'active'
    };
    
    users.push(newUser);
    
    // Close modal and clear form
    closeModal('addUserModal');
    clearUserForm();
    
    // Update display
    displayUsers();
    
    // Save data
    saveData();
}

function clearUserForm() {
    document.getElementById('newUserUsername').value = '';
    document.getElementById('newUserPassword').value = '';
    document.getElementById('newUserName').value = '';
    document.getElementById('newUserRole').value = 'cashier';
    document.getElementById('newUserEmail').value = '';
    document.getElementById('newUserPhone').value = '';
}

function toggleUserStatus(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    user.status = user.status === 'active' ? 'inactive' : 'active';
    displayUsers();
    saveData();
}

// Reports
function displayReports() {
    // Calculate today's sales
    const today = new Date().toDateString();
    const todaySales = sales.filter(sale => 
        new Date(sale.date).toDateString() === today
    ).reduce((sum, sale) => sum + sale.total, 0);
    
    // Calculate total utang
    const totalUtang = customers.reduce((sum, customer) => sum + customer.utang, 0);
    
    // Count low stock items
    const lowStockCount = products.filter(product => product.stock <= product.minStock).length;
    
    // Count expiring items (within 30 days)
    const currentDate = new Date();
    const expiringCount = products.filter(product => {
        if (!product.expiryDate) return false;
        const expiryDate = new Date(product.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    }).length;
    
    // Update dashboard
    document.getElementById('todaySales').textContent = `₱${todaySales.toFixed(2)}`;
    document.getElementById('totalUtang').textContent = `₱${totalUtang.toFixed(2)}`;
    document.getElementById('lowStockCount').textContent = lowStockCount;
    document.getElementById('expiringCount').textContent = expiringCount;
    
    // Display recent sales
    const recentSalesTableBody = document.getElementById('recentSalesTableBody');
    recentSalesTableBody.innerHTML = '';
    
    const recentSales = sales.slice(-10).reverse(); // Last 10 sales
    recentSales.forEach(sale => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(sale.date).toLocaleDateString()}</td>
            <td>${sale.items.length} items</td>
            <td>₱${sale.total.toFixed(2)}</td>
            <td>${sale.paymentMethod.toUpperCase()}</td>
        `;
        recentSalesTableBody.appendChild(row);
    });
}

// Settings
function loadSettings() {
    document.getElementById('storeName').value = settings.storeName || 'Sari-Sari Store';
    document.getElementById('storeAddress').value = settings.storeAddress || '123 Main Street, City';
    document.getElementById('storePhone').value = settings.storePhone || '+63 912 345 6789';
}

function saveStoreInfo() {
    settings.storeName = document.getElementById('storeName').value;
    settings.storeAddress = document.getElementById('storeAddress').value;
    settings.storePhone = document.getElementById('storePhone').value;
    
    saveData();
    alert('Store information saved successfully!');
}

// Utility Functions
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function exportData() {
    const data = {
        products: products,
        customers: customers,
        sales: sales,
        settings: settings,
        suppliers: suppliers,
        orders: orders,
        users: users
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `sari-pos-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.products) products = data.products;
                    if (data.customers) customers = data.customers;
                    if (data.sales) sales = data.sales;
                    if (data.settings) settings = data.settings;
                    if (data.suppliers) suppliers = data.suppliers;
                    if (data.orders) orders = data.orders;
                    if (data.users) users = data.users;
                    
                    alert('Data imported successfully!');
                    location.reload();
                } catch (error) {
                    alert('Error importing data. Please check the file format.');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function backupData() {
    saveData();
    alert('Data backup completed! All JSON files have been downloaded to your Downloads folder.');
}

function printReceipt() {
    if (cart.length === 0) {
        alert('Cart is empty!');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const receipt = `
        ${settings.storeName || 'Sari-Sari Store'}
        ${settings.storeAddress || '123 Main Street, City'}
        ${settings.storePhone || '+63 912 345 6789'}
        
        Date: ${new Date().toLocaleDateString()}
        Time: ${new Date().toLocaleTimeString()}
        Cashier: ${currentUser ? currentUser.name : 'Unknown'}
        
        ${'='.repeat(40)}
        
        ${cart.map(item => 
            `${item.name}\n${item.quantity} x ₱${item.price.toFixed(2)} = ₱${(item.price * item.quantity).toFixed(2)}`
        ).join('\n\n')}
        
        ${'='.repeat(40)}
        
        TOTAL: ₱${total.toFixed(2)}
        
        Thank you for your purchase!
        Please come again!
    `;
    
    // For now, just show the receipt in an alert
    // In a real implementation, this would send to a thermal printer
    alert('Receipt:\n\n' + receipt);
}

// Initialize the application
loadData();

// Inventory Search Functions
function searchInventory() {
    displayInventory();
}

function clearInventorySearch() {
    document.getElementById('inventorySearchName').value = '';
    document.getElementById('inventorySearchBarcode').value = '';
    document.getElementById('inventoryCategoryFilter').value = '';
    displayInventory();
}

function startBarcodeScan() {
    // Check if device has camera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera access not available. Please enter barcode manually.');
        document.getElementById('inventorySearchBarcode').focus();
        return;
    }
    
    // Create camera modal
    const modal = document.createElement('div');
    modal.id = 'barcodeModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); z-index: 2000; 
        display: flex; align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 15px; text-align: center; max-width: 500px;">
            <h3>📷 Barcode Scanner</h3>
            <p>Point camera at barcode</p>
            <video id="barcodeVideo" style="width: 100%; max-width: 400px; border: 2px solid #ddd; border-radius: 8px;" autoplay></video>
            <div style="margin-top: 15px;">
                <button class="btn btn-success" onclick="captureBarcode()">📸 Capture</button>
                <button class="btn btn-warning" onclick="closeBarcodeModal()">❌ Cancel</button>
            </div>
            <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">
                Note: For now, please manually enter the barcode number
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Start camera
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            const video = document.getElementById('barcodeVideo');
            video.srcObject = stream;
        })
        .catch(err => {
            console.error('Camera error:', err);
            alert('Camera access denied. Please enter barcode manually.');
            closeBarcodeModal();
        });
}

function captureBarcode() {
    // This is a placeholder - in a real implementation, you would use a barcode library
    // like QuaggaJS or ZXing to decode the barcode from the video stream
    alert('Barcode scanning feature is being developed. Please enter the barcode manually for now.');
    closeBarcodeModal();
}

function closeBarcodeModal() {
    const modal = document.getElementById('barcodeModal');
    if (modal) {
        // Stop camera stream
        const video = document.getElementById('barcodeVideo');
        if (video && video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
        
        modal.remove();
    }
    
    // Focus on barcode input
    document.getElementById('inventorySearchBarcode').focus();
}
