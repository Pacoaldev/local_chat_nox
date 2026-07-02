document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');
    const saveSettings = document.getElementById('save-settings');
    const apiUrlInput = document.getElementById('api-url');

    // Default API URL (assuming LM Studio runs on the same PC serving the UI, on port 5555)
    // window.location.hostname gets the IP that the user typed in the browser to access the site
    const currentHost = window.location.hostname || 'localhost';
    let LM_STUDIO_API_URL = `http://${currentHost}:5555/v1/chat/completions`;

    // Load saved URL if exists
    const savedUrl = localStorage.getItem('lm_studio_api_url');
    if (savedUrl) {
        LM_STUDIO_API_URL = savedUrl;
    }
    apiUrlInput.value = LM_STUDIO_API_URL;

    // Chat history to maintain context
    let messages = [
        { role: "system", content: "Eres un asistente de Inteligencia Artificial útil, amigable y que responde en español. Estás ayudando a una familia." }
    ];

    // Auto-resize input or scroll to bottom helper
    const scrollToBottom = () => {
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    // UI creation helpers
    const createMessageElement = (content, isUser = false) => {
        const wrapper = document.createElement('div');
        wrapper.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        
        const inner = document.createElement('div');
        inner.className = 'message-content';
        
        if (isUser) {
            inner.textContent = content; // Text only for user
        } else {
            // Render markdown for AI response
            inner.innerHTML = marked.parse(content);
        }
        
        wrapper.appendChild(inner);
        return wrapper;
    };

    const createTypingIndicator = () => {
        const wrapper = document.createElement('div');
        wrapper.className = 'message ai-message typing-indicator-wrapper';
        wrapper.id = 'typing-indicator';
        
        const inner = document.createElement('div');
        inner.className = 'message-content typing-indicator';
        inner.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        
        wrapper.appendChild(inner);
        return wrapper;
    };

    // Handle form submit
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const text = userInput.value.trim();
        if (!text) return;

        // 1. Add user message to UI and history
        chatBox.appendChild(createMessageElement(text, true));
        messages.push({ role: "user", content: text });
        
        userInput.value = '';
        sendBtn.disabled = true;
        scrollToBottom();

        // 2. Show typing indicator
        const typingIndicator = createTypingIndicator();
        chatBox.appendChild(typingIndicator);
        scrollToBottom();

        try {
            // 3. Call LM Studio API
            const response = await fetch(LM_STUDIO_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 2000,
                    stream: false // Simple non-streaming first. Can be upgraded to streaming.
                })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            const aiReply = data.choices[0].message.content;

            // Remove typing indicator
            typingIndicator.remove();

            // 4. Show AI reply and add to history
            chatBox.appendChild(createMessageElement(aiReply, false));
            messages.push({ role: "assistant", content: aiReply });

        } catch (error) {
            console.error("Error communicating with LM Studio:", error);
            typingIndicator.remove();
            
            let errorMsg = "Lo siento, hubo un problema al conectar con el servidor local. 😥";
            if (error.message.includes('Failed to fetch')) {
                errorMsg = `No se pudo conectar a LM Studio en ${LM_STUDIO_API_URL}. Por favor, asegúrate de que LM Studio está ejecutándose, que el servidor local está activado en el puerto 5555 y que CORS está habilitado.`;
            }
            
            chatBox.appendChild(createMessageElement(`**Error:** ${errorMsg}`, false));
        } finally {
            sendBtn.disabled = false;
            userInput.focus();
            scrollToBottom();
        }
    });

    // Settings Modal Handlers
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('active');
        apiUrlInput.value = LM_STUDIO_API_URL;
    });

    closeSettings.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    saveSettings.addEventListener('click', () => {
        LM_STUDIO_API_URL = apiUrlInput.value.trim();
        localStorage.setItem('lm_studio_api_url', LM_STUDIO_API_URL);
        settingsModal.classList.remove('active');
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });
});
