# 🏪 Sari-Sari Store POS System

A complete **Point of Sale (POS) system** designed specifically for sari-sari stores and small retail businesses in the Philippines. Built with **pure HTML, CSS, and JavaScript** for maximum compatibility and offline functionality.

## ✨ **Features Overview**

### 🛒 **POS Sales**
- **Quick Product Search** - Search by name or barcode
- **Shopping Cart** - Add/remove items with quantity control
- **Multiple Payment Methods** - Cash and GCash support
- **Receipt Generation** - Print or digital receipts
- **Real-time Stock Updates** - Automatic inventory deduction

### 📦 **Advanced Inventory Management**
- **Product Categories** - Snacks, beverages, household, personal care
- **Stock Tracking** - Real-time stock levels with low stock alerts
- **Expiry Date Tracking** - Monitor product expiration dates
- **Cost Price Management** - Track profit margins
- **Location Tracking** - Shelf/aisle organization
- **Barcode Support** - Manual entry or scanner integration
- **Supplier Integration** - Link products to suppliers

### 👥 **Customer Management**
- **Customer Database** - Store customer information
- **Utang (Credit) System** - Track customer debts
- **Payment History** - Complete transaction records
- **Items to Return** - Track borrowed items (bottles, etc.)
- **SMS Reminders** - Automated payment reminders
- **Google Maps Integration** - Customer location tracking
- **Credit Limits** - Set customer credit limits

### 🚚 **Supplier Management**
- **Supplier Database** - Contact information and details
- **Product Associations** - Link suppliers to products
- **Order Generation** - Automatic low stock orders
- **Payment Terms** - Track payment agreements
- **Order History** - Complete order tracking
- **Contact Management** - Phone, email, address

### 👤 **User Management & Security**
- **Role-Based Access** - Owner and Cashier roles
- **Login System** - Secure user authentication
- **Permission Control** - Customizable access levels
- **User Activity Tracking** - Login history and actions
- **Account Management** - Add, edit, enable/disable users

### 📊 **Advanced Reporting**
- **Daily Sales Reports** - Real-time sales tracking
- **Monthly Analytics** - Sales trends and patterns
- **Profit/Loss Analysis** - Cost vs. selling price tracking
- **Utang Reports** - Outstanding customer debts
- **Low Stock Alerts** - Products needing restocking
- **Expiry Alerts** - Products expiring soon
- **Payment Method Analysis** - Cash vs. GCash tracking

### ⚙️ **System Settings**
- **Store Information** - Customizable store details
- **Data Export/Import** - Backup and restore functionality
- **Receipt Customization** - Store branding on receipts
- **System Preferences** - User-configurable options

## 🚀 **Quick Start Guide**

### **Step 1: Setup**
1. **Download** all files to your computer
2. **Open** `index.html` in your web browser
3. **Login** with demo credentials:
   - **Owner**: username: `owner`, password: `owner123`
   - **Cashier**: username: `cashier`, password: `cashier123`

### **Step 2: Initial Configuration**
1. Go to **Settings** tab
2. Update your **Store Information**
3. Add your **Products** in the Inventory tab
4. Add your **Customers** in the Customers tab
5. Add your **Suppliers** in the Suppliers tab

### **Step 3: Start Using**
1. **POS Sales** - Process customer transactions
2. **Inventory** - Manage your product stock
3. **Customers** - Track utang and customer info
4. **Reports** - View sales and business analytics

## 💾 **Data Storage & Saving**

### **How It Works**
1. **System reads** from your JSON files in the `data/` folder
2. **You make changes** (add products, process sales, etc.)
3. **System shows popup** with updated JSON content
4. **You copy and paste** the updated content into your JSON files
5. **Refresh the page** to see your changes

### **File Structure**
```
SariPOS/
├── index.html          # Main application
├── styles.css          # Styling and layout
├── script.js           # All functionality
├── README.md           # This file
├── SETUP.md            # Setup instructions
└── data/               # Your data files
    ├── products.json   # Product inventory
    ├── customers.json  # Customer database
    ├── sales.json      # Sales transactions
    ├── suppliers.json  # Supplier information
    ├── orders.json     # Purchase orders
    ├── users.json      # User accounts
    └── settings.json   # System settings
```

## 🔐 **Security & User Roles**

### **Owner Role** (Full Access)
- ✅ All POS functions
- ✅ Inventory management
- ✅ Customer management
- ✅ Supplier management
- ✅ User management
- ✅ Reports and analytics
- ✅ System settings
- ✅ Financial data

### **Cashier Role** (Limited Access)
- ✅ POS sales
- ✅ Customer information (view only)
- ❌ Inventory management
- ❌ Supplier management
- ❌ User management
- ❌ Reports
- ❌ System settings

## 📱 **Mobile & Device Support**

### **Responsive Design**
- **Mobile Phones** - Touch-friendly interface
- **Tablets** - Optimized for larger screens
- **Desktop** - Full-featured experience
- **All Browsers** - Chrome, Firefox, Safari, Edge

### **Offline Capability**
- **No Internet Required** - Works completely offline
- **Local Storage** - All data stored on your device
- **Data Backup** - Export/import functionality
- **No Server Needed** - Runs directly in your browser

## 🛠️ **Technical Features**

### **Advanced Inventory**
- **Multi-unit Support** - Pieces, packs, kg, liters, bottles
- **Automatic Reordering** - Low stock alerts and suggestions
- **Expiry Management** - Track and alert on expiring products
- **Condition Tracking** - Good, damaged, expired status
- **Location Management** - Shelf and aisle organization

### **Customer Features**
- **Detailed Utang Tracking** - Itemized credit history
- **Payment Scheduling** - Due dates and reminders
- **Customer Categories** - Regular, new, VIP customers
- **Return Item Tracking** - Bottles, containers, etc.
- **Communication History** - SMS and contact logs

### **Supplier Integration**
- **Automated Orders** - Generate orders for low stock items
- **Order Templates** - Predefined order formats
- **Delivery Tracking** - Order status and delivery dates
- **Contact Management** - Multiple contact methods
- **Payment Terms** - Net 30, COD, etc.

### **Reporting & Analytics**
- **Real-time Dashboard** - Live sales and inventory data
- **Trend Analysis** - Sales patterns and forecasting
- **Profit Margins** - Cost vs. selling price analysis
- **Customer Insights** - Buying patterns and preferences
- **Supplier Performance** - Order fulfillment and delivery

## 🔧 **Customization Options**

### **Receipt Customization**
- Store name and logo
- Custom messages
- Tax and discount fields
- Multiple receipt formats

### **User Permissions**
- Customizable role permissions
- Feature-specific access control
- Activity logging and tracking

### **Data Management**
- Export to various formats
- Backup and restore
- Data migration tools
- Import from other systems

## 📞 **Support & Updates**

### **Getting Help**
- Check the **SETUP.md** file for detailed instructions
- Review the **data/ folder** for sample data structure
- Test with demo accounts before adding real data

### **Data Backup**
- **Regular Backups** - Export your data frequently
- **Multiple Copies** - Keep backups in different locations
- **Version Control** - Track changes over time

## 🎯 **Perfect For**

- **Sari-sari Stores** - Small neighborhood shops
- **Convenience Stores** - Mini-marts and corner stores
- **Small Retailers** - Family-owned businesses
- **Market Vendors** - Stall and booth operators
- **Any Small Business** - Needing simple POS functionality

## 💡 **Pro Tips**

1. **Start Small** - Add a few products first, then expand
2. **Regular Backups** - Export your data weekly
3. **Train Staff** - Use cashier role for employees
4. **Monitor Reports** - Check daily sales and utang regularly
5. **Update Stock** - Keep inventory levels current

---

**🚀 Ready to transform your sari-sari store? Open `index.html` and start managing your business like a pro!**
