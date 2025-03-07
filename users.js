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

// Export the authentication function
window.authenticateUser = authenticateUser;
