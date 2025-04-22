document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const strokeForm = document.getElementById('strokePredictionForm');

    function addMessage(content, isUser = false) {
        const message = document.createElement('div');
        message.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        message.innerHTML = `
            <img src="https://ui-avatars.com/api/?name=${isUser ? 'User' : 'AI'}" class="avatar">
            <div class="message-content">${content}</div>
        `;
        chatMessages.appendChild(message);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Handle sending messages
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            addMessage(message, true);
            messageInput.value = '';
            // Simulate AI response
            setTimeout(() => {
                addMessage('I understand. How can I help you with your health assessment today?');
            }, 1000);
        }
    }

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Handle stroke prediction form
    if (strokeForm) {
        strokeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(strokeForm);
            const data = Object.fromEntries(formData);

            try {
                // Simulate API call - replace URL with actual endpoint
                const response = await fetch('/predict-stroke', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                addMessage(`Based on your information, your stroke risk assessment is: ${result.probability}%`);

                // Get health plan
                const healthPlan = await fetch('/health-plan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const planResult = await healthPlan.json();
                addMessage(planResult.recommendations);

            } catch (error) {
                // For demo, show sample response
                addMessage("Based on your information, your stroke risk assessment is: 15%");
                setTimeout(() => {
                    addMessage(`Here's your personalized health plan:
                        1. Maintain a balanced diet rich in fruits and vegetables
                        2. Exercise for at least 30 minutes daily
                        3. Monitor your blood pressure regularly
                        4. Get adequate sleep (7-8 hours)
                        5. Manage stress through relaxation techniques`);
                }, 1000);
            }
        });
    }
});
// Xử lý gửi tin nhắn và lưu vào lịch sử
document.getElementById("sendButton").addEventListener("click", function () {
    const message = document.getElementById("messageInput").value.trim();
    if (message) {
        addMessageToHistory(message);
        document.getElementById("messageInput").value = "";
    }
});

function addMessageToHistory(text) {
    const historyList = document.getElementById("historyList");
    const listItem = document.createElement("li");
    listItem.textContent = text.length > 25 ? text.substring(0, 25) + "..." : text;
    historyList.appendChild(listItem);
    listItem.addEventListener("click", () => {
        alert("Bạn đã chọn: " + text);
    });
    
}