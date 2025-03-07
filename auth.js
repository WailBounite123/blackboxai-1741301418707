// User accounts with their roles
const users = {
    'admin': {
        password: 'admin123',
        role: 'admin',
        name: 'Administrateur'
    },
    'userA': {
        password: 'userA123',
        role: 'A',
        name: 'Utilisateur A'
    },
    'userB': {
        password: 'userB123',
        role: 'B',
        name: 'Utilisateur B'
    }
};

// Function to show notifications
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-md text-white ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Function to authenticate user
function authenticateUser(username, password) {
    const user = users[username];
    if (user && user.password === password) {
        return {
            username,
            role: user.role,
            name: user.name
        };
    }
    return null;
}

// Cherche l'élément login-form
const loginForm = document.getElementById('login-form');
if (loginForm) {
    // Si le formulaire existe, on attache l'événement submit
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        // Check credentials
        const user = authenticateUser(username, password);
        
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('isLoggedIn', 'true');
            
            showNotification('Connexion réussie', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showNotification('Nom d\'utilisateur ou mot de passe incorrect', 'error');
        }
    });

    // Check if user is already logged in
    window.addEventListener('DOMContentLoaded', function() {
        if (localStorage.getItem('isLoggedIn') === 'true') {
            window.location.href = 'dashboard.html';
        }
    });
}


// Check if user is already logged in
window.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'dashboard.html';
    }
});

// Function to check user permissions
function hasPermission(permission) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return false;

    switch (permission) {
        case 'view_all_history':
            return user.role === 'admin';
        case 'view_all_stock':
            return user.role === 'admin';
        case 'add_items':
            return true; // All users can add items
        case 'import_stock':
            return user.role === 'admin';
        default:
            return false;
    }
}

// Function to filter history by user
function filterHistoryByUser(transactions) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return [];
    
    if (user.role === 'admin') {
        return transactions;
    } else {
        return transactions.filter(t => t.user === user.username);
    }
}

// Function to filter stock by user
function filterStockByUser(items) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return {};
    
    if (user.role === 'admin') {
        return items;
    } else {
        return items; // Allow all users to see all stock items
    }
}

// Export functions for use in other files
window.auth = {
    hasPermission,
    filterHistoryByUser,
    filterStockByUser,
    showNotification
};
