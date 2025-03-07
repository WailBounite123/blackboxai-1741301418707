// Check if user is logged in, if not redirect to login page
if (!localStorage.getItem('isLoggedIn')) {
    window.location.href = 'login.html';
}

// Get current user
const currentUser = JSON.parse(localStorage.getItem('user'));

// Initialize inventory data structure in localStorage if it doesn't exist
if (!localStorage.getItem('inventory')) {
    localStorage.setItem('inventory', JSON.stringify({
        items: {},          // Store current quantities
        transactions: [],   // Store history of transactions
        itemTypes: []       // Store unique item types for autocomplete
    }));
}

// Handle logout
document.getElementById('logout-button').addEventListener('click', function() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    auth.showNotification('Déconnexion réussie', 'success');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
});

// Helper function to update inventory
function updateInventory(type, quantity, isAddition = true, service = null) {
    const inventory = JSON.parse(localStorage.getItem('inventory'));
    
    // Initialize item type if it doesn't exist
    if (!inventory.items[type]) {
        inventory.items[type] = 0;
    }

    // Update quantity
    if (isAddition) {
        inventory.items[type] += quantity;
    } else {
        if (inventory.items[type] < quantity) {
            throw new Error(`Stock insuffisant pour ${type}`);
        }
        inventory.items[type] -= quantity;
    }

    // Record transaction with user information
    inventory.transactions.push({
        date: new Date().toISOString(),
        type,
        operation: isAddition ? 'Réception' : 'Sortie',
        quantity,
        service: service || '-',
        user: currentUser.username
    });

    // Add to item types if not already present
    if (!inventory.itemTypes.includes(type)) {
        inventory.itemTypes.push(type);
    }

    // Save updated inventory
    localStorage.setItem('inventory', JSON.stringify(inventory));
    
    // Update displays
    updateStockDisplay();
    updateHistoryDisplay();
    document.dispatchEvent(new Event('inventoryUpdated'));
}

// Function to update type dropdown in sortie form
function updateTypeDropdown() {
    const typeSelect = document.getElementById('type-sortie');
    const inventory = JSON.parse(localStorage.getItem('inventory'));
    
    // Get filtered items based on user role
    const filteredItems = auth.filterStockByUser(inventory.items);
    
    // Save current selection if any
    const currentSelection = typeSelect.value;
    
    // Clear current options except first placeholder
    while (typeSelect.options.length > 1) {
        typeSelect.remove(1);
    }
    
    // Add options for each item type in inventory
    Object.entries(filteredItems)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([type, quantity]) => {
            if (quantity > 0) { // Only show items with stock > 0
                const option = document.createElement('option');
                option.value = type;
                option.textContent = `${type} (${quantity} en stock)`;
                typeSelect.appendChild(option);
            }
        });
    
    // Restore selection if still valid
    if (currentSelection && [...typeSelect.options].some(opt => opt.value === currentSelection)) {
        typeSelect.value = currentSelection;
    }
}

// Function to update the stock display table
function updateStockDisplay() {
    const tableBody = document.getElementById('stock-table-body');
    const inventory = JSON.parse(localStorage.getItem('inventory'));
    
    // Get filtered items based on user role
    const filteredItems = auth.filterStockByUser(inventory.items);
    
    // Clear current table content
    tableBody.innerHTML = '';

    // Check if there are any items
    if (Object.keys(filteredItems).length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="2" class="px-6 py-4 text-center text-gray-500">
                <i class="fas fa-box-open mr-2"></i>
                Aucun élément en stock
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }

    // Add each item to the table
    Object.entries(filteredItems)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([type, quantity]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${type}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm ${quantity === 0 ? 'text-red-600' : 'text-gray-900'}">
                        ${quantity}
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
}

// Function to format date
function formatDate(isoString) {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Function to update the history display table
function updateHistoryDisplay() {
    const tableBody = document.getElementById('history-table-body');
    const inventory = JSON.parse(localStorage.getItem('inventory'));
    
    // Get filtered transactions based on user role
    const filteredTransactions = auth.filterHistoryByUser(inventory.transactions);
    
    // Clear current table content
    tableBody.innerHTML = '';

    // Check if there are any transactions
    if (!filteredTransactions || filteredTransactions.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                <i class="fas fa-info-circle mr-2"></i>
                Aucune opération enregistrée
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }

    // Add each transaction to the table in reverse chronological order
    filteredTransactions
        .slice()
        .reverse()
        .forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${formatDate(transaction.date)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${transaction.type}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.operation === 'Réception'
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                    }">
                        ${transaction.operation}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${transaction.quantity}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${transaction.service}
                </td>
            `;
            tableBody.appendChild(row);
        });
}

// Function to update datalist with item types
function updateItemTypesList() {
    const datalist = document.getElementById('item-types-list');
    const inventory = JSON.parse(localStorage.getItem('inventory'));
    
    // Get filtered items based on user role
    const filteredItems = auth.filterStockByUser(inventory.items);
    
    // Clear current options
    datalist.innerHTML = '';
    
    // Add unique item types from inventory
    Object.keys(filteredItems).forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        datalist.appendChild(option);
    });
}

// Function to download stock as Excel
function downloadStockExcel() {
    const inventory = JSON.parse(localStorage.getItem('inventory'));
    const filteredItems = auth.filterStockByUser(inventory.items);
    const wb = XLSX.utils.book_new();
    
    // Create stock data
    const stockData = Object.entries(filteredItems).map(([type, quantity]) => ({
        "Type d'élément": type,
        "Quantité en stock": quantity
    }));
    
    // Convert to worksheet and add to workbook
    const ws = XLSX.utils.json_to_sheet(stockData);
    XLSX.utils.book_append_sheet(wb, ws, "État du stock");
    
    // Save file
    XLSX.writeFile(wb, "etat_du_stock.xlsx");
}

// Function to download history as Excel
function downloadHistoryExcel() {
    const inventory = JSON.parse(localStorage.getItem('inventory'));
    const filteredTransactions = auth.filterHistoryByUser(inventory.transactions);
    const wb = XLSX.utils.book_new();
    
    // Format transactions data
    const historyData = filteredTransactions.map(t => ({
        "Date": formatDate(t.date),
        "Type d'élément": t.type,
        "Opération": t.operation,
        "Quantité": t.quantity,
        "Service": t.service
    }));
    
    // Convert to worksheet and add to workbook
    const ws = XLSX.utils.json_to_sheet(historyData);
    XLSX.utils.book_append_sheet(wb, ws, "Historique");
    
    // Save file
    XLSX.writeFile(wb, "historique_operations.xlsx");
}

// Function to handle stock Excel import
function handleStockExcelImport(event) {
    // Only admin can import stock
    if (!auth.hasPermission('view_all_stock')) {
        auth.showNotification('Vous n\'avez pas la permission d\'importer le stock', 'error');
        return;
    }

    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // Get current inventory
            const inventory = JSON.parse(localStorage.getItem('inventory'));
            
            // Update inventory with imported data
            jsonData.forEach(row => {
                const type = row["Type d'élément"];
                const quantity = row["Quantité en stock"];
                
                if (type && !isNaN(quantity)) {
                    inventory.items[type] = parseInt(quantity);
                    if (!inventory.itemTypes.includes(type)) {
                        inventory.itemTypes.push(type);
                    }
                }
            });
            
            // Save updated inventory
            localStorage.setItem('inventory', JSON.stringify(inventory));
            
            // Update displays
            updateStockDisplay();
            updateTypeDropdown();
            updateItemTypesList();
            
            auth.showNotification('Import du stock réussi');
        } catch (error) {
            console.error('Error importing Excel:', error);
            auth.showNotification('Erreur lors de l\'import du fichier Excel', 'error');
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// Handle reception form submission
document.getElementById('reception-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const type = document.getElementById('type-reception').value.trim();
    const quantity = parseInt(document.getElementById('quantity-reception').value);

    try {
        updateInventory(type, quantity, true);
        auth.showNotification(`Réception de ${quantity} ${type} enregistrée avec succès`);
        this.reset();
    } catch (error) {
        auth.showNotification(error.message, 'error');
    }
});

// Handle sortie form submission
document.getElementById('sortie-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const type = document.getElementById('type-sortie').value.trim();
    const quantity = parseInt(document.getElementById('quantity-sortie').value);
    const service = document.getElementById('service').value.trim();

    try {
        updateInventory(type, quantity, false, service);
        auth.showNotification(`Sortie de ${quantity} ${type} vers ${service} enregistrée avec succès`);
        this.reset();
    } catch (error) {
        auth.showNotification(error.message, 'error');
    }
});

// Update user info in header
const userNameElement = document.createElement('span');
userNameElement.className = 'text-sm text-white mr-4';
userNameElement.textContent = `${currentUser.name} (${currentUser.role === 'admin' ? 'Administrateur' : 'Utilisateur ' + currentUser.role})`;
document.getElementById('logout-button').parentNode.insertBefore(userNameElement, document.getElementById('logout-button'));

// Initialize display and dropdowns
document.addEventListener('DOMContentLoaded', () => {
    updateStockDisplay();
    updateTypeDropdown();
    updateHistoryDisplay();
    updateItemTypesList();
});
