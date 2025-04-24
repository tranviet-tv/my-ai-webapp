document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const authModal = document.getElementById('authModal');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const closeAuthModal = document.getElementById('closeAuthModal');
    const authLink = document.getElementById('authLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const mainApp = document.getElementById('mainApp');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const userAvatar = document.getElementById('userAvatar');
    
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const newChatBtn = document.getElementById('newChatBtn');
    const chatContainer = document.querySelector('.chat-container');
    const welcomeMessage = document.querySelector('.center-welcome');
    const chatHistory = document.getElementById('chatHistory');
    
    // State
    let currentChatId = null;
    let chats = JSON.parse(localStorage.getItem('healthcareChats')) || [];
    let currentUser = JSON.parse(localStorage.getItem('healthcareCurrentUser')) || null;
    
    // Initialize the app
    function init() {
        // Check if user is logged in
        if (currentUser) {
            showMainApp();
        } else {
            showAuthModal('login');
        }
        
        // Set up event listeners
        setupEventListeners();
    }
    
    // Set up all event listeners
    function setupEventListeners() {
        // Auth modal tabs
        loginTab.addEventListener('click', () => switchAuthTab('login'));
        registerTab.addEventListener('click', () => switchAuthTab('register'));
        
        // Close auth modal
        closeAuthModal.addEventListener('click', hideAuthModal);
        
        // Auth link in welcome message
        authLink.addEventListener('click', (e) => {
            e.preventDefault();
            showAuthModal('login');
        });
        
        // Login form submission
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLogin();
        });
        
        // Register form submission
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleRegister();
        });
        
        // Logout button
        logoutBtn.addEventListener('click', handleLogout);
        
        // Chat functionality
        newChatBtn.addEventListener('click', createNewChat);
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
    
    // Auth tab switching
    function switchAuthTab(tab) {
        if (tab === 'login') {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
        } else {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
        }
    }
    
    // Show auth modal
    function showAuthModal(initialTab = 'login') {
        authModal.classList.add('active');
        switchAuthTab(initialTab);
    }
    
    // Hide auth modal
    function hideAuthModal() {
        authModal.classList.remove('active');
    }
    
    // Show notification
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Handle login
    function handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Simple validation
        if (!email || !password) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        // In a real app, you would make an API call here
        // For demo purposes, we'll just simulate a successful login
        currentUser = {
            id: 'user_' + Date.now(),
            name: email.split('@')[0],
            email: email,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}`
        };
        
        localStorage.setItem('healthcareCurrentUser', JSON.stringify(currentUser));
        showNotification('Login successful!', 'success');
        hideAuthModal();
        showMainApp();
    }
    
    // Handle register
    function handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        // Simple validation
        if (!name || !email || !password || !confirmPassword) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }
        
        // In a real app, you would make an API call here
        // For demo purposes, we'll just simulate a successful registration
        currentUser = {
            id: 'user_' + Date.now(),
            name: name,
            email: email,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`
        };
        
        localStorage.setItem('healthcareCurrentUser', JSON.stringify(currentUser));
        showNotification('Registration successful!', 'success');
        hideAuthModal();
        showMainApp();
    }
    
    // Handle logout
    function handleLogout() {
        currentUser = null;
        localStorage.removeItem('healthcareCurrentUser');
        showNotification('Logged out successfully', 'success');
        
        // Hide main app and show auth modal
        mainApp.style.display = 'none';
        showAuthModal('login');
        
        // Reset chat UI
        chatContainer.style.display = 'none';
        welcomeMessage.style.display = 'flex';
        chatMessages.innerHTML = '';
        currentChatId = null;
    }
    
    // Show main app after login
    function showMainApp() {
        if (!currentUser) return;
        
        // Update user info
        usernameDisplay.textContent = currentUser.name;
        userAvatar.src = currentUser.avatar;
        
        // Show main app
        mainApp.style.display = 'flex';
        
        // Initialize chat functionality
        initChatFunctionality();
    }
    
    // Initialize chat functionality
    function initChatFunctionality() {
        renderChatHistory();
        
        // Hide chat container and show welcome message initially
        chatContainer.style.display = 'none';
        welcomeMessage.style.display = 'flex';
    }
    
    // Render chat history in sidebar
    function renderChatHistory() {
        // Clear existing chat history except the title
        while (chatHistory.children.length > 1) {
            chatHistory.removeChild(chatHistory.lastChild);
        }
        
        // Filter chats for current user
        const userChats = chats.filter(chat => chat.userId === currentUser?.id);
        
        // Add each chat to the history
        userChats.forEach((chat, index) => {
            const chatItem = document.createElement('div');
            chatItem.className = `chat-item ${currentChatId === chat.id ? 'active' : ''}`;
            chatItem.innerHTML = `
                <div class="chat-item-content">Chat ${index + 1}</div>
                <button class="delete-chat-btn" data-chat-id="${chat.id}">×</button>
            `;
            
            // Add click event to load chat
            chatItem.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-chat-btn')) {
                    loadChat(chat.id);
                }
            });
            
            // Add delete button event
            const deleteBtn = chatItem.querySelector('.delete-chat-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteChat(chat.id);
            });
            
            chatHistory.appendChild(chatItem);
        });
    }
    
    // Create a new chat
    function createNewChat() {
        if (!currentUser) {
            showAuthModal('login');
            return;
        }
        
        const newChat = {
            id: Date.now().toString(),
            userId: currentUser.id,
            messages: [],
            createdAt: new Date().toISOString()
        };
        
        chats.unshift(newChat); // Add to beginning of array
        currentChatId = newChat.id;
        saveChats();
        
        // Clear the chat messages
        chatMessages.innerHTML = '';
        
        // Show chat container and hide welcome message
        chatContainer.style.display = 'flex';
        welcomeMessage.style.display = 'none';
        
        // Update chat history
        renderChatHistory();
        
        // Focus on the message input
        messageInput.focus();
    }
    
    // Load an existing chat
    function loadChat(chatId) {
        const chat = chats.find(c => c.id === chatId);
        if (!chat) return;
        
        currentChatId = chatId;
        
        // Clear and repopulate chat messages
        chatMessages.innerHTML = '';
        chat.messages.forEach(msg => {
            addMessageToUI(msg.content, msg.isUser);
        });
        
        // Show chat container and hide welcome message
        chatContainer.style.display = 'flex';
        welcomeMessage.style.display = 'none';
        
        // Update active state in chat history
        renderChatHistory();
        
        // Focus on the message input
        messageInput.focus();
    }
    
    // Delete a chat
    function deleteChat(chatId) {
        if (confirm('Are you sure you want to delete this chat?')) {
            chats = chats.filter(chat => chat.id !== chatId);
            
            // If we're deleting the current chat, show welcome screen
            if (currentChatId === chatId) {
                currentChatId = null;
                chatContainer.style.display = 'none';
                welcomeMessage.style.display = 'flex';
                chatMessages.innerHTML = '';
            }
            
            saveChats();
            renderChatHistory();
        }
    }
    
    // Add a message to the UI
    function addMessageToUI(content, isUser = false) {
        const message = document.createElement('div');
        message.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        message.innerHTML = `
            <img src="${isUser ? (currentUser?.avatar || 'https://ui-avatars.com/api/?name=User') : 'https://ui-avatars.com/api/?name=AI'}" class="avatar">
            <div class="message-content">${content}</div>
        `;
        chatMessages.appendChild(message);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Add a message to the current chat
    function addMessageToChat(content, isUser = false) {
        if (!currentChatId || !currentUser) return;
        
        const chat = chats.find(c => c.id === currentChatId);
        if (chat) {
            chat.messages.push({ content, isUser });
            saveChats();
        }
    }
    
    // Handle sending messages
    function sendMessage() {
        if (!currentUser) {
            showAuthModal('login');
            return;
        }
        
        const message = messageInput.value.trim();
        if (message) {
            // If no current chat, create one
            if (!currentChatId) {
                createNewChat();
            }
            
            // Add user message
            addMessageToUI(message, true);
            addMessageToChat(message, true);
            messageInput.value = '';
            
            // Simulate AI response
            setTimeout(() => {
                const response = 'Hi we support stroke risk measurement';
                addMessageToUI(response, false);
                addMessageToChat(response, false);
            }, 1000);
        }
    }
    
    // Save chats to localStorage
    function saveChats() {
        localStorage.setItem('healthcareChats', JSON.stringify(chats));
    }
    
    // Initialize the app
    init();
});