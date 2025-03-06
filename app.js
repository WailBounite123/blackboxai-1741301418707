// Initialize inventory data structure in localStorage if it doesn't exist
if (!localStorage.getItem('inventory')) {
    localStorage.setItem('inventory', JSON.stringify({
        items: {},          // Store current quantities
        transactions: [],   // Store history of transactions
        itemTypes: []       // Store unique item types for autocomplete
    }));
}

// Helper function to show notifications
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-md text-white ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

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
        // Check if we have enough stock
        if (inventory.items[type] < quantity) {
            throw new Error(`Stock insuffisant pour ${type}`);
        }
        inventory.items[type] -= quantity;
    }

    // Record transaction
    inventory.transactions.push({
        type,
        quantity,
        isAddition,
        service,
        date: new Date().toISOString()
    });

    // Add to item types if not already present
    if (!inventory.itemTypes) {
        inventory.itemTypes = [];
    }
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
    const inventory = JSON.parse(localStorage.getItem('inventory') || '{"items":{}}');
    
    // Save current selection if any
    const currentSelection = typeSelect.value;
    
    // Clear current options except first placeholder
    while (typeSelect.options.length > 1) {
        typeSelect.remove(1);
    }
    
    // Add options for each item type in inventory
    Object.entries(inventory.items)
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

// Update dropdowns when inventory changes
document.addEventListener('inventoryUpdated', updateTypeDropdown);

// Function to update the stock display table
function updateStockDisplay() {
    const tableBody = document.getElementById('stock-table-body');
    const inventory = JSON.parse(localStorage.getItem('inventory'));
    
    // Clear current table content
    tableBody.innerHTML = '';

    // Check if there are any items
    if (Object.keys(inventory.items).length === 0) {
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
    Object.entries(inventory.items)
        .sort(([a], [b]) => a.localeCompare(b)) // Sort alphabetically
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
    
    // Clear current table content
    tableBody.innerHTML = '';

    // Check if there are any transactions
    if (!inventory.transactions || inventory.transactions.length === 0) {
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
    inventory.transactions
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
                        transaction.isAddition 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                    }">
                        ${transaction.isAddition ? 'Réception' : 'Sortie'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${transaction.quantity}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${transaction.service || '-'}
                </td>
            `;
            tableBody.appendChild(row);
        });
}

// Handle reception form submission
document.getElementById('reception-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const type = document.getElementById('type-reception').value.trim();
    const quantity = parseInt(document.getElementById('quantity-reception').value);

    try {
        updateInventory(type, quantity, true);
        showNotification(`Réception de ${quantity} ${type} enregistrée avec succès`);
        this.reset();
    } catch (error) {
        showNotification(error.message, 'error');
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
        showNotification(`Sortie de ${quantity} ${type} vers ${service} enregistrée avec succès`);
        this.reset();
    } catch (error) {
        showNotification(error.message, 'error');
    }
});

// Function to update datalist with item types
function updateItemTypesList() {
    const inventory = JSON.parse(localStorage.getItem('inventory'));
    const datalist = document.getElementById('item-types-list');
    
    // Clear current options
    datalist.innerHTML = '';
    
    // Add unique item types from inventory
    if (inventory.itemTypes) {
        inventory.itemTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            datalist.appendChild(option);
        });
    }
}

// Initialize display and dropdowns
document.addEventListener('DOMContentLoaded', () => {
    updateStockDisplay();
    updateTypeDropdown();
    updateHistoryDisplay();
    updateItemTypesList();
});
