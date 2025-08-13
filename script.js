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

// Utility functions for data validation and generation
function generateUniqueId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

function validateNumericInput(value, min = 0, max = Infinity) {
    const num = parseFloat(value);
    if (isNaN(num) || num < min || num > max) {
        return null;
    }
    return num;
}

function sanitizeStringInput(input) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, ''); // Basic XSS prevention
}

function validateRequiredField(value, fieldName) {
    if (!value || value.trim() === '') {
        alert(`${fieldName} is required`);
        return false;
    }
    return true;
}

function validateEmail(email) {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    if (!phone) return false;
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, starting application...');
    await loadData();
    console.log('Data loading completed');
    console.log('Users loaded:', users);
    setupEventListeners();
    
    // Update store name display after data is loaded
    updateStoreNameDisplayOnly();
    
    // Perform system health check
    const healthReport = performSystemHealthCheck();
    if (healthReport.status === 'error') {
        console.error('System health check failed:', healthReport.issues);
        alert('System health check failed. Please check the console for details.');
    } else if (healthReport.status === 'warning') {
        console.warn('System health check warnings:', healthReport.warnings);
    }
    
    // Check for existing session
    checkExistingSession();
    
    // Set up auto-save every 5 minutes
    setInterval(() => {
        if (currentUser) {
            console.log('Auto-saving data...');
            saveData();
        }
    }, 5 * 60 * 1000); // 5 minutes
});

// Check for existing login session
function checkExistingSession() {
    try {
        const sessionData = localStorage.getItem('sariPOS_session');
        if (sessionData) {
            const session = JSON.parse(sessionData);
            console.log('Found existing session:', session);
            
            // Check if session is not too old (24 hours)
            const loginTime = new Date(session.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
                // Find the user
                const user = users.find(u => u.id === session.userId && u.username === session.username);
                if (user && user.status === 'active') {
                    console.log('Restoring session for user:', user.name);
                    
                    // Restore the session
                    currentUser = user;
                    document.getElementById('loginScreen').style.display = 'none';
                    document.getElementById('mainApp').style.display = 'block';
                    document.getElementById('userName').textContent = user.name;
                    
                    // Update user permissions
                    updateUserPermissions();
                    
                    // Load initial data
                    displayProducts();
                    displayInventory();
                    displayCustomers();
                    displaySuppliers();
                    displayUsers();
                    displayReports();
                    loadSettings();
                    
                    // Update store name display
                    updateStoreNameDisplayOnly();
                    
                    // Start session timeout
                    startSessionTimeout();
                    updateSessionStatus();
                    
                    console.log('Session restored successfully');
                    return;
                }
            } else {
                console.log('Session expired, clearing...');
                localStorage.removeItem('sariPOS_session');
            }
        }
    } catch (error) {
        console.error('Error checking session:', error);
        localStorage.removeItem('sariPOS_session');
    }
    
    console.log('No valid session found, showing login screen');
}

// Session timeout management
let sessionTimeoutId = null;
const SESSION_TIMEOUT_MINUTES = 60; // 1 hour of inactivity

function startSessionTimeout() {
    // Clear any existing timeout
    if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
    }
    
    // Set new timeout
    sessionTimeoutId = setTimeout(() => {
        console.log('Session timeout - logging out user');
        alert('Your session has expired due to inactivity. Please log in again.');
        logout();
    }, SESSION_TIMEOUT_MINUTES * 60 * 1000);
    
    // Update session timestamp
    const sessionData = localStorage.getItem('sariPOS_session');
    if (sessionData) {
        const session = JSON.parse(sessionData);
        session.lastActivity = new Date().toISOString();
        localStorage.setItem('sariPOS_session', JSON.stringify(session));
    }
}

function resetSessionTimeout() {
    if (currentUser) {
        startSessionTimeout();
        updateSessionStatus();
    }
}

function updateSessionStatus() {
    const sessionStatus = document.getElementById('sessionStatus');
    if (!sessionStatus) return;
    
    const sessionData = localStorage.getItem('sariPOS_session');
    if (sessionData) {
        const session = JSON.parse(sessionData);
        const lastActivity = new Date(session.lastActivity || session.loginTime);
        const now = new Date();
        const minutesSinceActivity = (now - lastActivity) / (1000 * 60);
        
        if (minutesSinceActivity < 30) {
            sessionStatus.textContent = '● Session Active';
            sessionStatus.style.color = '#27ae60';
        } else if (minutesSinceActivity < 50) {
            sessionStatus.textContent = '⚠ Session Expiring Soon';
            sessionStatus.style.color = '#f39c12';
        } else {
            sessionStatus.textContent = '⚠ Session Expiring';
            sessionStatus.style.color = '#e74c3c';
        }
    }
}

// Add activity listeners to reset timeout
document.addEventListener('click', resetSessionTimeout);
document.addEventListener('keypress', resetSessionTimeout);
document.addEventListener('scroll', resetSessionTimeout);

// Update session status every minute
setInterval(() => {
    if (currentUser) {
        updateSessionStatus();
    }
}, 60000); // Update every minute

// Setup event listeners
function setupEventListeners() {
    // Enter key for login
    document.getElementById('loginPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Only apply shortcuts when not in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Ctrl/Cmd + S for save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveData();
            showNotification('Data saved successfully!', 'success');
        }
        
        // Ctrl/Cmd + F for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const activeTab = document.querySelector('.tab.active');
            if (activeTab && activeTab.textContent.includes('Inventory')) {
                document.getElementById('inventorySearchName').focus();
            } else if (activeTab && activeTab.textContent.includes('POS')) {
                document.getElementById('searchProduct').focus();
            }
        }
        
        // Escape key to close modals
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('[id$="Modal"]');
            modals.forEach(modal => {
                if (modal.style.display === 'block') {
                    closeModal(modal.id);
                }
            });
        }
        
        // Number keys for quick tab switching
        if (e.key >= '1' && e.key <= '7' && !e.ctrlKey && !e.metaKey) {
            const tabIndex = parseInt(e.key) - 1;
            const tabs = ['pos', 'inventory', 'customers', 'suppliers', 'reports', 'users', 'settings'];
            if (tabs[tabIndex]) {
                showTab(tabs[tabIndex]);
            }
        }
    });
    
    // Auto-save on form changes
    const forms = document.querySelectorAll('input, select, textarea');
    forms.forEach(form => {
        form.addEventListener('change', function() {
            // Auto-save after a short delay
            setTimeout(() => {
                if (currentUser) {
                    saveData();
                }
            }, 1000);
        });
    });
    
    // Real-time search for products
    const searchProductInput = document.getElementById('searchProduct');
    if (searchProductInput) {
        searchProductInput.addEventListener('input', function() {
            searchProducts();
        });
    }
    
    // Real-time search for inventory
    const inventorySearchInputs = [
        document.getElementById('inventorySearchName'),
        document.getElementById('inventorySearchBarcode'),
        document.getElementById('inventoryCategoryFilter')
    ];
    
    inventorySearchInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', function() {
                searchInventory();
            });
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
            
            // Save login session to localStorage
            localStorage.setItem('sariPOS_session', JSON.stringify({
                userId: user.id,
                username: user.username,
                loginTime: new Date().toISOString()
            }));
            
            // Start session timeout monitoring
            startSessionTimeout();
            updateSessionStatus();
            
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
            
            // Update store name display
            updateStoreNameDisplayOnly();
            
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
    // Save data before logging out
    saveData();
    
    currentUser = null;
    cart = [];
    
    // Clear session timeout
    if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
        sessionTimeoutId = null;
    }
    
    // Clear session from localStorage
    localStorage.removeItem('sariPOS_session');
    
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

// Data Management Functions
async function loadData() {
    console.log('Loading data from JSON files...');
    try {
        await loadDataFromJSONFiles();
        console.log('Data loaded successfully from JSON files');
    } catch (error) {
        console.error('Error loading data from JSON files:', error);
        console.log('Loading sample data as fallback...');
        loadSampleData();
    }
}

async function loadDataFromJSONFiles() {
    // First, try to load from localStorage (most recent data)
    try {
        const localStorageData = localStorage.getItem('sariPOS_data');
        if (localStorageData) {
            const data = JSON.parse(localStorageData);
            console.log('Loading data from localStorage...');
            
            if (data.products) products = data.products;
            if (data.customers) customers = data.customers;
            if (data.sales) sales = data.sales;
            if (data.settings) settings = data.settings;
            if (data.suppliers) suppliers = data.suppliers;
            if (data.orders) orders = data.orders;
            if (data.users) users = data.users;
            
            console.log('Data loaded from localStorage successfully');
            return; // Use localStorage data if available
        }
    } catch (error) {
        console.warn('Could not load from localStorage:', error);
    }
    
    // Fallback to loading from JSON files
    console.log('Loading data from JSON files...');
    const dataFiles = [
        'data/products.json',
        'data/customers.json', 
        'data/sales.json',
        'data/settings.json',
        'data/suppliers.json',
        'data/orders.json',
        'data/users.json'
    ];
    
    let filesLoaded = 0;
    const totalFiles = dataFiles.length;
    
    const loadPromises = dataFiles.map(async (filePath) => {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to load ${filePath}: ${response.status}`);
            }
            const data = await response.json();
            filesLoaded++;
            console.log(`Loaded ${filePath} (${filesLoaded}/${totalFiles})`);
            return { filePath, data };
        } catch (error) {
            console.warn(`Could not load ${filePath}:`, error);
            return { filePath, data: null };
        }
    });
    
    try {
        const results = await Promise.all(loadPromises);
        
        results.forEach(({ filePath, data }) => {
            if (data !== null) {
                if (filePath.includes('products.json')) {
                    products = data;
                } else if (filePath.includes('customers.json')) {
                    customers = data;
                } else if (filePath.includes('sales.json')) {
                    sales = data;
                } else if (filePath.includes('settings.json')) {
                    settings = data;
                } else if (filePath.includes('suppliers.json')) {
                    suppliers = data;
                } else if (filePath.includes('orders.json')) {
                    orders = data;
                } else if (filePath.includes('users.json')) {
                    users = data;
                }
            }
        });
        
        console.log(`Successfully loaded ${filesLoaded}/${totalFiles} data files`);
        
        // If no files were loaded, throw error to trigger fallback
        if (filesLoaded === 0) {
            throw new Error('No data files could be loaded');
        }
        
    } catch (error) {
        console.error('Error loading data files:', error);
        throw error; // Re-throw to trigger fallback
    }
    
    // Ensure arrays are initialized if files are empty or missing
    if (!Array.isArray(products)) products = [];
    if (!Array.isArray(customers)) customers = [];
    if (!Array.isArray(sales)) sales = [];
    if (!Array.isArray(suppliers)) suppliers = [];
    if (!Array.isArray(orders)) orders = [];
    if (!Array.isArray(users)) users = [];
    if (!settings || typeof settings !== 'object') settings = {};
}

function saveData() {
    try {
        // Validate data integrity before saving
        if (!validateDataIntegrity()) {
            console.error('Data integrity validation failed');
            alert('Data validation failed. Please check your inputs.');
            return;
        }
        
        // Automatically save to JSON files
        saveToJSONFiles();
        console.log('Data saved automatically to JSON files');
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data. Please check the console for details.');
    }
}

function validateDataIntegrity() {
    try {
        // Validate products
        if (!Array.isArray(products)) return false;
        for (let product of products) {
            if (!product.id || !product.name || typeof product.price !== 'number' || product.price < 0) {
                console.error('Invalid product data:', product);
                return false;
            }
        }
        
        // Validate customers
        if (!Array.isArray(customers)) return false;
        for (let customer of customers) {
            if (!customer.id || !customer.name || !customer.phone) {
                console.error('Invalid customer data:', customer);
                return false;
            }
        }
        
        // Validate sales
        if (!Array.isArray(sales)) return false;
        for (let sale of sales) {
            if (!sale.id || !sale.date || !Array.isArray(sale.items) || typeof sale.total !== 'number') {
                console.error('Invalid sale data:', sale);
                return false;
            }
        }
        
        // Validate suppliers
        if (!Array.isArray(suppliers)) return false;
        for (let supplier of suppliers) {
            if (!supplier.id || !supplier.name || !supplier.contactPerson || !supplier.phone) {
                console.error('Invalid supplier data:', supplier);
                return false;
            }
        }
        
        // Validate users
        if (!Array.isArray(users)) return false;
        for (let user of users) {
            if (!user.id || !user.username || !user.name) {
                console.error('Invalid user data:', user);
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Data integrity validation error:', error);
        return false;
    }
}

function saveToJSONFiles() {
    // Save to localStorage for persistence
    const dataToSave = {
        products: products,
        customers: customers,
        sales: sales,
        settings: settings,
        suppliers: suppliers,
        orders: orders,
        users: users,
        lastSaved: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('sariPOS_data', JSON.stringify(dataToSave));
        console.log('Data saved to localStorage');
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
    
    // Also create downloadable files for backup
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
    // Create success notification (only show for manual saves, not auto-saves)
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; 
        background: #27ae60; color: white; padding: 15px 20px; 
        border-radius: 8px; z-index: 2000; font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        opacity: 0.9;
    `;
    notification.innerHTML = '✅ Data saved successfully!';
    
    document.body.appendChild(notification);
    
    // Remove notification after 2 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 2000);
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
        },
        {
            id: 7,
            name: "Sprite 330ml",
            category: "beverages",
            price: 22.00,
            stock: 3,
            unit: "bottle",
            barcode: "111222333",
            minStock: 5,
            supplierId: 1,
            supplierName: "ABC Distributors",
            expiryDate: "2024-12-31",
            costPrice: 18.00,
            condition: "good",
            location: "Shelf A3"
        },
        {
            id: 8,
            name: "Milo Powder",
            category: "beverages",
            price: 120.00,
            stock: 2,
            unit: "jar",
            barcode: "444555666",
            minStock: 3,
            supplierId: 1,
            supplierName: "ABC Distributors",
            expiryDate: "2024-02-15",
            costPrice: 95.00,
            condition: "good",
            location: "Shelf A4"
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
    
    sales = [
        {
            id: 1,
            date: new Date().toISOString(),
            items: [
                { id: 1, name: "Coca Cola 330ml", price: 25.00, quantity: 2 }
            ],
            total: 50.00,
            paymentMethod: "cash",
            customerId: null,
            cashierId: 1
        },
        {
            id: 2,
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
            items: [
                { id: 2, name: "Pepsi 330ml", price: 23.00, quantity: 1 },
                { id: 3, name: "Chips", price: 15.00, quantity: 3 }
            ],
            total: 68.00,
            paymentMethod: "gcash",
            customerId: 1,
            cashierId: 2
        }
    ];
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
        id: generateUniqueId(),
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
        cashier: currentUser ? currentUser.name : 'Unknown',
        cashierId: currentUser ? currentUser.id : null
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
    // Get and validate input values
    const name = sanitizeStringInput(document.getElementById('newProductName').value);
    const category = document.getElementById('newProductCategory').value;
    const price = validateNumericInput(document.getElementById('newProductPrice').value, 0.01);
    const costPrice = validateNumericInput(document.getElementById('newProductCostPrice').value, 0);
    const stock = validateNumericInput(document.getElementById('newProductStock').value, 0);
    const unit = document.getElementById('newProductUnit').value;
    const expiry = document.getElementById('newProductExpiry').value;
    const supplierId = document.getElementById('newProductSupplier').value;
    const location = sanitizeStringInput(document.getElementById('newProductLocation').value);
    const barcode = sanitizeStringInput(document.getElementById('newProductBarcode').value);
    
    // Validate required fields
    if (!validateRequiredField(name, 'Product name')) return;
    if (price === null) {
        alert('Please enter a valid price (greater than 0)');
        return;
    }
    if (stock === null) {
        alert('Please enter a valid stock quantity (0 or greater)');
        return;
    }
    
    // Check for duplicate barcode
    if (barcode && products.some(p => p.barcode === barcode)) {
        alert('A product with this barcode already exists');
        return;
    }
    
    const supplier = suppliers.find(s => s.id == supplierId);
    
    const newProduct = {
        id: generateUniqueId(),
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
        location: location || 'Unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
    
    // Create restock modal
    const modal = document.createElement('div');
    modal.id = 'restockModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.5); z-index: 1000; 
        display: flex; align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 400px;">
            <h3>📦 Restock Product</h3>
            <p><strong>Product:</strong> ${product.name}</p>
            <p><strong>Current Stock:</strong> ${product.stock} ${product.unit}</p>
            <p><strong>Minimum Stock:</strong> ${product.minStock || 0} ${product.unit}</p>
            
            <div style="margin: 20px 0;">
                <label><strong>Restock Quantity:</strong></label>
                <input type="number" id="restockQuantity" value="${Math.max(10, product.minStock || 5)}" min="1" style="width: 100%; padding: 10px; margin-top: 5px; border: 2px solid #ddd; border-radius: 5px;">
            </div>
            
            <div style="margin: 20px 0;">
                <label><strong>Cost Price (₱):</strong></label>
                <input type="number" id="restockCostPrice" value="${product.costPrice || 0}" step="0.01" min="0" style="width: 100%; padding: 10px; margin-top: 5px; border: 2px solid #ddd; border-radius: 5px;">
            </div>
            
            <div style="margin: 20px 0;">
                <label><strong>Supplier:</strong></label>
                <select id="restockSupplier" style="width: 100%; padding: 10px; margin-top: 5px; border: 2px solid #ddd; border-radius: 5px;">
                    <option value="">Select Supplier</option>
                    ${suppliers.map(s => `<option value="${s.id}" ${s.id === product.supplierId ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="confirmRestock(${productId})" class="btn btn-primary">Confirm Restock</button>
                <button onclick="closeModal('restockModal')" class="btn btn-warning">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function confirmRestock(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const quantity = parseInt(document.getElementById('restockQuantity').value);
    const costPrice = parseFloat(document.getElementById('restockCostPrice').value);
    const supplierId = document.getElementById('restockSupplier').value;
    
    if (!quantity || quantity <= 0) {
        showNotification('Please enter a valid quantity', 'error');
        return;
    }
    
    // Update product
    product.stock += quantity;
    if (costPrice > 0) {
        product.costPrice = costPrice;
    }
    if (supplierId) {
        product.supplierId = parseInt(supplierId);
        const supplier = suppliers.find(s => s.id === parseInt(supplierId));
        if (supplier) {
            product.supplierName = supplier.name;
        }
    }
    
    // Add to restock history
    if (!product.restockHistory) {
        product.restockHistory = [];
    }
    
    product.restockHistory.push({
        id: generateUniqueId(),
        date: new Date().toISOString(),
        quantity: quantity,
        costPrice: costPrice,
        supplierId: supplierId ? parseInt(supplierId) : null,
        restockedBy: currentUser ? currentUser.name : 'Unknown'
    });
    
    closeModal('restockModal');
    displayInventory();
    saveData();
    
    showNotification(`Successfully restocked ${quantity} ${product.unit} of ${product.name}`, 'success');
}

// Bulk operations for inventory
function showBulkOperationsModal() {
    const modal = document.createElement('div');
    modal.id = 'bulkOperationsModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.5); z-index: 1000; 
        display: flex; align-items: center; justify-content: center;
    `;
    
    const lowStockProducts = products.filter(p => p.stock <= (p.minStock || 0));
    const expiringProducts = products.filter(p => {
        if (!p.expiryDate) return false;
        const expiryDate = new Date(p.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    });
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 600px; max-height: 80vh; overflow-y: auto;">
            <h3>⚡ Bulk Operations</h3>
            
            <div style="margin: 20px 0;">
                <h4>📦 Low Stock Items (${lowStockProducts.length})</h4>
                ${lowStockProducts.length > 0 ? `
                    <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
                        ${lowStockProducts.map(product => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                                <span>${product.name}</span>
                                <span style="color: #e74c3c;">${product.stock} ${product.unit}</span>
                            </div>
                        `).join('')}
                    </div>
                    <button onclick="bulkRestockLowStock()" class="btn btn-primary" style="margin-top: 10px;">Restock All Low Stock Items</button>
                ` : '<p>No low stock items</p>'}
            </div>
            
            <div style="margin: 20px 0;">
                <h4>⚠️ Expiring Soon (${expiringProducts.length})</h4>
                ${expiringProducts.length > 0 ? `
                    <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
                        ${expiringProducts.map(product => {
                            const expiryDate = new Date(product.expiryDate);
                            const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
                            return `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                                    <span>${product.name}</span>
                                    <span style="color: #f39c12;">Expires in ${daysUntilExpiry} days</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <button onclick="bulkDiscountExpiring()" class="btn btn-warning" style="margin-top: 10px;">Apply Discount to Expiring Items</button>
                ` : '<p>No items expiring soon</p>'}
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="closeModal('bulkOperationsModal')" class="btn btn-primary">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function bulkRestockLowStock() {
    const lowStockProducts = products.filter(p => p.stock <= (p.minStock || 0));
    
    lowStockProducts.forEach(product => {
        const restockQuantity = Math.max(10, (product.minStock || 5) * 2);
        product.stock += restockQuantity;
        
        // Add to restock history
        if (!product.restockHistory) {
            product.restockHistory = [];
        }
        
        product.restockHistory.push({
            id: generateUniqueId(),
            date: new Date().toISOString(),
            quantity: restockQuantity,
            costPrice: product.costPrice || 0,
            supplierId: product.supplierId,
            restockedBy: currentUser ? currentUser.name : 'Bulk Operation'
        });
    });
    
    closeModal('bulkOperationsModal');
    displayInventory();
    saveData();
    
    showNotification(`Bulk restocked ${lowStockProducts.length} items`, 'success');
}

function bulkDiscountExpiring() {
    const expiringProducts = products.filter(p => {
        if (!p.expiryDate) return false;
        const expiryDate = new Date(p.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    });
    
    expiringProducts.forEach(product => {
        // Apply 20% discount to expiring items
        const originalPrice = product.originalPrice || product.price;
        product.originalPrice = originalPrice;
        product.price = originalPrice * 0.8; // 20% discount
    });
    
    closeModal('bulkOperationsModal');
    displayInventory();
    displayProducts();
    saveData();
    
    showNotification(`Applied discount to ${expiringProducts.length} expiring items`, 'success');
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
                <button onclick="editCustomer(${customer.id})" class="btn btn-sm btn-primary">Edit</button>
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
    // Get and validate input values
    const name = sanitizeStringInput(document.getElementById('newCustomerName').value);
    const phone = sanitizeStringInput(document.getElementById('newCustomerPhone').value);
    const address = sanitizeStringInput(document.getElementById('newCustomerAddress').value);
    const creditLimit = validateNumericInput(document.getElementById('newCustomerCreditLimit').value, 0);
    const smsEnabled = document.getElementById('newCustomerSmsEnabled').checked;
    
    // Validate required fields
    if (!validateRequiredField(name, 'Customer name')) return;
    if (!validateRequiredField(phone, 'Phone number')) return;
    
    // Validate phone number format
    if (!validatePhone(phone)) {
        alert('Please enter a valid phone number');
        return;
    }
    
    // Check for duplicate phone number
    if (customers.some(c => c.phone === phone)) {
        alert('A customer with this phone number already exists');
        return;
    }
    
    const newCustomer = {
        id: generateUniqueId(),
        name: name,
        phone: phone,
        address: address || '',
        location: {
            latitude: 0,
            longitude: 0,
            googleMapsUrl: ""
        },
        creditLimit: creditLimit || 0,
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
    const utangAmount = validateNumericInput(amount, 0.01);
    
    if (utangAmount !== null) {
        customer.utang += utangAmount;
        
        // Add to utang history
        const utangRecord = {
            id: generateUniqueId(),
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
    } else {
        alert('Please enter a valid amount');
    }
}

function recordPayment(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const amount = prompt(`Enter payment amount for ${customer.name} (Current utang: ₱${customer.utang.toFixed(2)}):`, '0');
    const paymentAmount = validateNumericInput(amount, 0.01);
    
    if (paymentAmount !== null) {
        customer.utang = Math.max(0, customer.utang - paymentAmount);
        
        // Add to payment history
        const paymentRecord = {
            id: generateUniqueId(),
            date: new Date().toISOString(),
            amount: paymentAmount,
            method: 'cash',
            notes: 'Manual payment'
        };
        
        customer.paymentHistory.push(paymentRecord);
        displayCustomers();
        saveData();
    } else {
        alert('Please enter a valid amount');
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
    // Get and validate input values
    const name = sanitizeStringInput(document.getElementById('newSupplierName').value);
    const contact = sanitizeStringInput(document.getElementById('newSupplierContact').value);
    const phone = sanitizeStringInput(document.getElementById('newSupplierPhone').value);
    const email = sanitizeStringInput(document.getElementById('newSupplierEmail').value);
    const address = sanitizeStringInput(document.getElementById('newSupplierAddress').value);
    const paymentTerms = sanitizeStringInput(document.getElementById('newSupplierPaymentTerms').value);
    
    // Validate required fields
    if (!validateRequiredField(name, 'Supplier name')) return;
    if (!validateRequiredField(contact, 'Contact person')) return;
    if (!validateRequiredField(phone, 'Phone number')) return;
    
    // Validate phone number format
    if (!validatePhone(phone)) {
        alert('Please enter a valid phone number');
        return;
    }
    
    // Validate email format if provided
    if (email && !validateEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    // Check for duplicate supplier name
    if (suppliers.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        alert('A supplier with this name already exists');
        return;
    }
    
    const newSupplier = {
        id: generateUniqueId(),
        name: name,
        contactPerson: contact,
        phone: phone,
        email: email || '',
        address: address || '',
        products: [],
        paymentTerms: paymentTerms || 'Net 30',
        lastOrder: null,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
        id: generateUniqueId(),
        supplierId: supplierId,
        supplierName: supplier.name,
        date: new Date().toISOString(),
        items: lowStockProducts.map(product => ({
            productId: product.id,
            productName: product.name,
            quantity: product.minStock * 2, // Order 2x minimum stock
            unitPrice: product.costPrice || 0,
            totalPrice: (product.costPrice || 0) * (product.minStock * 2)
        })),
        totalAmount: lowStockProducts.reduce((sum, product) => 
            sum + ((product.costPrice || 0) * (product.minStock * 2)), 0
        ),
        status: 'pending',
        deliveryDate: null,
        notes: 'Auto-generated order for low stock items',
        createdBy: currentUser ? currentUser.name : 'System',
        createdAt: new Date().toISOString()
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
    
    // Get supplier's products and orders
    const supplierProducts = products.filter(p => p.supplierId === supplierId);
    const supplierOrders = orders.filter(o => o.supplierId === supplierId);
    
    // Create detailed supplier view modal
    const modal = document.createElement('div');
    modal.id = 'supplierDetailsModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.5); z-index: 1000; 
        display: flex; align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 700px; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>🚚 Supplier Details</h2>
                <button onclick="closeModal('supplierDetailsModal')" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                    <h3>Contact Information</h3>
                    <p><strong>Name:</strong> ${supplier.name}</p>
                    <p><strong>Contact Person:</strong> ${supplier.contactPerson}</p>
                    <p><strong>Phone:</strong> ${supplier.phone}</p>
                    <p><strong>Email:</strong> ${supplier.email || 'Not provided'}</p>
                    <p><strong>Address:</strong> ${supplier.address || 'Not provided'}</p>
                </div>
                
                <div>
                    <h3>Business Information</h3>
                    <p><strong>Payment Terms:</strong> ${supplier.paymentTerms || 'Not specified'}</p>
                    <p><strong>Status:</strong> <span style="color: ${supplier.status === 'active' ? '#27ae60' : '#e74c3c'};">${supplier.status}</span></p>
                    <p><strong>Last Order:</strong> ${supplier.lastOrder ? new Date(supplier.lastOrder).toLocaleDateString() : 'Never'}</p>
                    <p><strong>Products Supplied:</strong> ${supplierProducts.length} items</p>
                    <p><strong>Total Orders:</strong> ${supplierOrders.length}</p>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>Products Supplied (${supplierProducts.length})</h3>
                ${supplierProducts.length > 0 ? `
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${supplierProducts.map(product => `
                            <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px;">
                                <p><strong>${product.name}</strong></p>
                                <p>Price: ₱${product.price.toFixed(2)} | Stock: ${product.stock} ${product.unit}</p>
                                <p>Status: <span style="color: ${product.stock <= (product.minStock || 0) ? '#e74c3c' : '#27ae60'};">${product.stock <= (product.minStock || 0) ? 'Low Stock' : 'In Stock'}</span></p>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p>No products from this supplier</p>'}
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>Recent Orders (${supplierOrders.length})</h3>
                ${supplierOrders.length > 0 ? `
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${supplierOrders.slice(-5).reverse().map(order => `
                            <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px;">
                                <p><strong>Order Date:</strong> ${new Date(order.date).toLocaleDateString()}</p>
                                <p><strong>Total Amount:</strong> ₱${order.totalAmount.toFixed(2)}</p>
                                <p><strong>Status:</strong> <span style="color: ${order.status === 'pending' ? '#f39c12' : order.status === 'delivered' ? '#27ae60' : '#e74c3c'};">${order.status}</span></p>
                                <p><strong>Items:</strong> ${order.items.length} products</p>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p>No orders from this supplier</p>'}
            </div>
            
            <div style="text-align: center;">
                <button onclick="closeModal('supplierDetailsModal')" class="btn btn-primary">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function editSupplier(supplierId) {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) {
        alert('Supplier not found!');
        return;
    }
    
    // Fill form with supplier data
    document.getElementById('editSupplierId').value = supplier.id;
    document.getElementById('editSupplierName').value = supplier.name;
    document.getElementById('editSupplierContact').value = supplier.contactPerson;
    document.getElementById('editSupplierPhone').value = supplier.phone;
    document.getElementById('editSupplierEmail').value = supplier.email || '';
    document.getElementById('editSupplierAddress').value = supplier.address || '';
    document.getElementById('editSupplierPaymentTerms').value = supplier.paymentTerms || '';
    
    // Show modal
    document.getElementById('editSupplierModal').style.display = 'block';
}

function updateSupplier() {
    const id = parseInt(document.getElementById('editSupplierId').value);
    const name = document.getElementById('editSupplierName').value;
    const contactPerson = document.getElementById('editSupplierContact').value;
    const phone = document.getElementById('editSupplierPhone').value;
    const email = document.getElementById('editSupplierEmail').value;
    const address = document.getElementById('editSupplierAddress').value;
    const paymentTerms = document.getElementById('editSupplierPaymentTerms').value;
    
    if (!name || !contactPerson || !phone) {
        alert('Please fill in name, contact person, and phone number');
        return;
    }
    
    const supplierIndex = suppliers.findIndex(s => s.id == id);
    if (supplierIndex === -1) {
        alert('Supplier not found!');
        return;
    }
    
    // Update supplier
    suppliers[supplierIndex] = {
        ...suppliers[supplierIndex],
        name: name,
        contactPerson: contactPerson,
        phone: phone,
        email: email,
        address: address,
        paymentTerms: paymentTerms
    };
    
    // Close modal and refresh display
    closeModal('editSupplierModal');
    displaySuppliers();
    saveData();
    
    alert('Supplier updated successfully!');
}

function editCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
        alert('Customer not found!');
        return;
    }
    
    // Fill form with customer data
    document.getElementById('editCustomerId').value = customer.id;
    document.getElementById('editCustomerName').value = customer.name;
    document.getElementById('editCustomerPhone').value = customer.phone;
    document.getElementById('editCustomerAddress').value = customer.address || '';
    document.getElementById('editCustomerCreditLimit').value = customer.creditLimit || 0;
    document.getElementById('editCustomerSmsEnabled').checked = customer.smsEnabled !== false;
    
    // Show modal
    document.getElementById('editCustomerModal').style.display = 'block';
}

function updateCustomer() {
    const id = parseInt(document.getElementById('editCustomerId').value);
    const name = document.getElementById('editCustomerName').value;
    const phone = document.getElementById('editCustomerPhone').value;
    const address = document.getElementById('editCustomerAddress').value;
    const creditLimit = parseFloat(document.getElementById('editCustomerCreditLimit').value);
    const smsEnabled = document.getElementById('editCustomerSmsEnabled').checked;
    
    if (!name || !phone) {
        alert('Please fill in name and phone number');
        return;
    }
    
    const customerIndex = customers.findIndex(c => c.id == id);
    if (customerIndex === -1) {
        alert('Customer not found!');
        return;
    }
    
    // Update customer
    customers[customerIndex] = {
        ...customers[customerIndex],
        name: name,
        phone: phone,
        address: address,
        creditLimit: creditLimit || 0,
        smsEnabled: smsEnabled
    };
    
    // Close modal and refresh display
    closeModal('editCustomerModal');
    displayCustomers();
    saveData();
    
    alert('Customer updated successfully!');
}

function viewCustomerDetails(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    // Create detailed customer view modal
    const modal = document.createElement('div');
    modal.id = 'customerDetailsModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.5); z-index: 1000; 
        display: flex; align-items: center; justify-content: center;
    `;
    
    const utangHistory = customer.utangHistory || [];
    const paymentHistory = customer.paymentHistory || [];
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 600px; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>👤 Customer Details</h2>
                <button onclick="closeModal('customerDetailsModal')" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                    <h3>Basic Information</h3>
                    <p><strong>Name:</strong> ${customer.name}</p>
                    <p><strong>Phone:</strong> ${customer.phone}</p>
                    <p><strong>Address:</strong> ${customer.address || 'Not provided'}</p>
                    <p><strong>Customer Type:</strong> ${customer.customerType || 'Regular'}</p>
                    <p><strong>Status:</strong> <span style="color: ${customer.status === 'active' ? '#27ae60' : '#e74c3c'};">${customer.status}</span></p>
                </div>
                
                <div>
                    <h3>Financial Information</h3>
                    <p><strong>Current Utang:</strong> <span style="color: ${customer.utang > 0 ? '#e74c3c' : '#27ae60'}; font-weight: bold;">₱${customer.utang.toFixed(2)}</span></p>
                    <p><strong>Credit Limit:</strong> ₱${(customer.creditLimit || 0).toFixed(2)}</p>
                    <p><strong>Items to Return:</strong> ${customer.itemsToReturn.join(', ') || 'None'}</p>
                    <p><strong>Last Visit:</strong> ${new Date(customer.lastVisit).toLocaleDateString()}</p>
                    <p><strong>SMS Enabled:</strong> ${customer.smsEnabled ? 'Yes' : 'No'}</p>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>Recent Utang History</h3>
                ${utangHistory.length > 0 ? `
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${utangHistory.slice(-5).reverse().map(utang => `
                            <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px;">
                                <p><strong>Date:</strong> ${new Date(utang.date).toLocaleDateString()}</p>
                                <p><strong>Amount:</strong> ₱${utang.amount.toFixed(2)}</p>
                                <p><strong>Status:</strong> ${utang.status}</p>
                                <p><strong>Notes:</strong> ${utang.notes || 'No notes'}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p>No utang history</p>'}
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>Recent Payment History</h3>
                ${paymentHistory.length > 0 ? `
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${paymentHistory.slice(-5).reverse().map(payment => `
                            <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px;">
                                <p><strong>Date:</strong> ${new Date(payment.date).toLocaleDateString()}</p>
                                <p><strong>Amount:</strong> ₱${payment.amount.toFixed(2)}</p>
                                <p><strong>Method:</strong> ${payment.method}</p>
                                <p><strong>Notes:</strong> ${payment.notes || 'No notes'}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p>No payment history</p>'}
            </div>
            
            <div style="text-align: center;">
                <button onclick="closeModal('customerDetailsModal')" class="btn btn-primary">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        alert('Product not found!');
        return;
    }
    
    // Populate supplier dropdown
    const supplierSelect = document.getElementById('editProductSupplier');
    supplierSelect.innerHTML = '<option value="">Select Supplier</option>';
    suppliers.forEach(supplier => {
        supplierSelect.innerHTML += `<option value="${supplier.id}" ${product.supplierId == supplier.id ? 'selected' : ''}>${supplier.name}</option>`;
    });
    
    // Fill form with product data
    document.getElementById('editProductId').value = product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductCategory').value = product.category;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductCostPrice').value = product.costPrice || 0;
    document.getElementById('editProductStock').value = product.stock;
    document.getElementById('editProductUnit').value = product.unit;
    document.getElementById('editProductExpiry').value = product.expiryDate || '';
    document.getElementById('editProductLocation').value = product.location || '';
    document.getElementById('editProductBarcode').value = product.barcode || '';
    
    // Show modal
    document.getElementById('editProductModal').style.display = 'block';
}

function updateProduct() {
    const id = parseInt(document.getElementById('editProductId').value);
    const name = document.getElementById('editProductName').value;
    const category = document.getElementById('editProductCategory').value;
    const price = parseFloat(document.getElementById('editProductPrice').value);
    const costPrice = parseFloat(document.getElementById('editProductCostPrice').value);
    const stock = parseInt(document.getElementById('editProductStock').value);
    const unit = document.getElementById('editProductUnit').value;
    const expiry = document.getElementById('editProductExpiry').value;
    const supplierId = document.getElementById('editProductSupplier').value;
    const location = document.getElementById('editProductLocation').value;
    const barcode = document.getElementById('editProductBarcode').value;
    
    if (!name || !price || stock < 0) {
        alert('Please fill in all required fields');
        return;
    }
    
    const productIndex = products.findIndex(p => p.id == id);
    if (productIndex === -1) {
        alert('Product not found!');
        return;
    }
    
    const supplier = suppliers.find(s => s.id == supplierId);
    
    // Update product
    products[productIndex] = {
        ...products[productIndex],
        name: name,
        category: category,
        price: price,
        costPrice: costPrice || 0,
        stock: stock,
        unit: unit,
        barcode: barcode || '',
        supplierId: supplierId ? parseInt(supplierId) : null,
        supplierName: supplier ? supplier.name : null,
        expiryDate: expiry || null,
        location: location || 'Unknown'
    };
    
    // Close modal and refresh display
    closeModal('editProductModal');
    displayInventory();
    displayProducts();
    saveData();
    
    alert('Product updated successfully!');
}

function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) {
        alert('User not found!');
        return;
    }
    
    // Fill form with user data
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserUsername').value = user.username;
    document.getElementById('editUserName').value = user.name;
    document.getElementById('editUserRole').value = user.role;
    document.getElementById('editUserEmail').value = user.email || '';
    document.getElementById('editUserPhone').value = user.phone || '';
    
    // Show modal
    document.getElementById('editUserModal').style.display = 'block';
}

function updateUser() {
    const id = parseInt(document.getElementById('editUserId').value);
    const username = document.getElementById('editUserUsername').value;
    const name = document.getElementById('editUserName').value;
    const role = document.getElementById('editUserRole').value;
    const email = document.getElementById('editUserEmail').value;
    const phone = document.getElementById('editUserPhone').value;
    
    if (!username || !name) {
        alert('Please fill in username and name');
        return;
    }
    
    const userIndex = users.findIndex(u => u.id == id);
    if (userIndex === -1) {
        alert('User not found!');
        return;
    }
    
    // Check if username already exists (excluding current user)
    const existingUser = users.find(u => u.username === username && u.id !== id);
    if (existingUser) {
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
    
    // Update user
    users[userIndex] = {
        ...users[userIndex],
        username: username,
        name: name,
        role: role,
        email: email,
        phone: phone,
        permissions: permissions
    };
    
    // Close modal and refresh display
    closeModal('editUserModal');
    displayUsers();
    saveData();
    
    alert('User updated successfully!');
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
    const totalUtang = customers.reduce((sum, customer) => sum + (customer.utang || 0), 0);
    
    // Count low stock items
    const lowStockCount = products.filter(product => product.stock <= (product.minStock || 0)).length;
    
    // Count expiring items (within 30 days)
    const currentDate = new Date();
    const expiringCount = products.filter(product => {
        if (!product.expiryDate) return false;
        const expiryDate = new Date(product.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    }).length;
    
    // Update dashboard
    const todaySalesElement = document.getElementById('todaySales');
    const totalUtangElement = document.getElementById('totalUtang');
    const lowStockCountElement = document.getElementById('lowStockCount');
    const expiringCountElement = document.getElementById('expiringCount');
    
    if (todaySalesElement) todaySalesElement.textContent = `₱${todaySales.toFixed(2)}`;
    if (totalUtangElement) totalUtangElement.textContent = `₱${totalUtang.toFixed(2)}`;
    if (lowStockCountElement) lowStockCountElement.textContent = lowStockCount;
    if (expiringCountElement) expiringCountElement.textContent = expiringCount;
    
    // Display recent sales
    const recentSalesTableBody = document.getElementById('recentSalesTableBody');
    if (recentSalesTableBody) {
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
}

// Settings
// Function to update store name throughout the application
function updateStoreNameDisplay() {
    const storeName = settings.storeName || 'Sari-Sari Store';
    const fullStoreName = storeName + ' POS';
    
    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.textContent = fullStoreName;
    
    // Update login screen title
    const loginTitle = document.getElementById('loginTitle');
    if (loginTitle) loginTitle.textContent = '🏪 ' + fullStoreName;
    
    // Update main application title
    const mainTitle = document.getElementById('mainTitle');
    if (mainTitle) mainTitle.textContent = '🏪 ' + fullStoreName;
}

// Function to update store name display without affecting input fields
function updateStoreNameDisplayOnly() {
    const storeName = settings.storeName || 'Sari-Sari Store';
    const fullStoreName = storeName + ' POS';
    
    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.textContent = fullStoreName;
    
    // Update login screen title
    const loginTitle = document.getElementById('loginTitle');
    if (loginTitle) loginTitle.textContent = '🏪 ' + fullStoreName;
    
    // Update main application title
    const mainTitle = document.getElementById('mainTitle');
    if (mainTitle) mainTitle.textContent = '🏪 ' + fullStoreName;
}

function loadSettings() {
    document.getElementById('storeName').value = settings.storeName || 'Sari-Sari Store';
    document.getElementById('storeAddress').value = settings.storeAddress || '123 Main Street, City';
    document.getElementById('storePhone').value = settings.storePhone || '+63 912 345 6789';
    
    // Update store name display throughout the application (without affecting input fields)
    updateStoreNameDisplayOnly();
}

function saveStoreInfo() {
    settings.storeName = document.getElementById('storeName').value;
    settings.storeAddress = document.getElementById('storeAddress').value;
    settings.storePhone = document.getElementById('storePhone').value;
    
    // Update store name display throughout the application
    updateStoreNameDisplay();
    
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
        showNotification('Camera access not available. Please enter barcode manually.', 'warning');
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
            <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                <p style="font-size: 0.9rem; color: #666; margin: 0;">
                    <strong>Note:</strong> For now, please manually enter the barcode number. 
                    Full barcode scanning will be available in future updates.
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Start camera
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            const video = document.getElementById('barcodeVideo');
            video.srcObject = stream;
            showNotification('Camera started successfully. Point at barcode.', 'success');
        })
        .catch(err => {
            console.error('Camera error:', err);
            showNotification('Camera access denied. Please enter barcode manually.', 'error');
            closeBarcodeModal();
        });
}

function captureBarcode() {
    // This is a placeholder - in a real implementation, you would use a barcode library
    // like QuaggaJS or ZXing to decode the barcode from the video stream
    showNotification('Barcode scanning feature is being developed. Please enter the barcode manually for now.', 'info');
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

// Notification system for better user feedback
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; 
        padding: 15px 20px; border-radius: 8px; z-index: 2000; 
        font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 300px; word-wrap: break-word;
    `;
    
    // Set colors based on type
    switch(type) {
        case 'success':
            notification.style.background = '#27ae60';
            notification.style.color = 'white';
            break;
        case 'error':
            notification.style.background = '#e74c3c';
            notification.style.color = 'white';
            break;
        case 'warning':
            notification.style.background = '#f39c12';
            notification.style.color = 'white';
            break;
        default:
            notification.style.background = '#3498db';
            notification.style.color = 'white';
    }
    
    notification.innerHTML = message;
    document.body.appendChild(notification);
    
    // Remove notification after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 4000);
}

// System health check function
function performSystemHealthCheck() {
    const healthReport = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        issues: [],
        warnings: [],
        recommendations: []
    };
    
    // Check localStorage support
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        healthReport.localStorage = 'working';
    } catch (error) {
        healthReport.localStorage = 'not supported';
        healthReport.status = 'warning';
        healthReport.warnings.push('localStorage not supported - data persistence may be limited');
    }
    
    // Check data integrity
    if (!Array.isArray(products)) {
        healthReport.status = 'error';
        healthReport.issues.push('Products data is corrupted');
    }
    if (!Array.isArray(customers)) {
        healthReport.status = 'error';
        healthReport.issues.push('Customers data is corrupted');
    }
    if (!Array.isArray(sales)) {
        healthReport.status = 'error';
        healthReport.issues.push('Sales data is corrupted');
    }
    if (!Array.isArray(users)) {
        healthReport.status = 'error';
        healthReport.issues.push('Users data is corrupted');
    }
    
    // Check for empty critical data
    if (users.length === 0) {
        healthReport.status = 'error';
        healthReport.issues.push('No users found - system cannot function');
    }
    if (products.length === 0) {
        healthReport.warnings.push('No products found - add products to start selling');
    }
    
    // Check for data inconsistencies
    const invalidProducts = products.filter(p => !p.id || !p.name || typeof p.price !== 'number');
    if (invalidProducts.length > 0) {
        healthReport.warnings.push(`${invalidProducts.length} products have invalid data`);
    }
    
    const invalidCustomers = customers.filter(c => !c.id || !c.name || !c.phone);
    if (invalidCustomers.length > 0) {
        healthReport.warnings.push(`${invalidCustomers.length} customers have invalid data`);
    }
    
    // Check for low stock items
    const lowStockItems = products.filter(p => p.stock <= (p.minStock || 0));
    if (lowStockItems.length > 0) {
        healthReport.warnings.push(`${lowStockItems.length} items are low on stock`);
    }
    
    // Check for expiring items
    const currentDate = new Date();
    const expiringItems = products.filter(p => {
        if (!p.expiryDate) return false;
        const expiryDate = new Date(p.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    });
    if (expiringItems.length > 0) {
        healthReport.warnings.push(`${expiringItems.length} items are expiring soon`);
    }
    
    // Check for high utang customers
    const highUtangCustomers = customers.filter(c => (c.utang || 0) > (c.creditLimit || 0));
    if (highUtangCustomers.length > 0) {
        healthReport.warnings.push(`${highUtangCustomers.length} customers have exceeded credit limits`);
    }
    
    // Generate recommendations
    if (products.length === 0) {
        healthReport.recommendations.push('Add products to inventory to start selling');
    }
    if (customers.length === 0) {
        healthReport.recommendations.push('Add customers to track utang and sales');
    }
    if (suppliers.length === 0) {
        healthReport.recommendations.push('Add suppliers to manage inventory restocking');
    }
    if (lowStockItems.length > 0) {
        healthReport.recommendations.push('Restock low inventory items');
    }
    if (expiringItems.length > 0) {
        healthReport.recommendations.push('Check expiring items and consider discounts');
    }
    
    console.log('System Health Check:', healthReport);
    return healthReport;
}
