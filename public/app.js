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

    const attachBtn = document.getElementById('attach-btn');
    const fileInput = document.getElementById('file-input');
    const filePreviewContainer = document.getElementById('file-preview-container');

    const currentHost = window.location.hostname || 'localhost';
    let LM_STUDIO_API_URL = `http://${currentHost}:5555/v1/chat/completions`;

    const savedUrl = localStorage.getItem('lm_studio_api_url');
    if (savedUrl) {
        LM_STUDIO_API_URL = savedUrl;
    }
    apiUrlInput.value = LM_STUDIO_API_URL;

    let messages = [
        { role: "system", content: "Eres un asistente de Inteligencia Artificial útil, amigable y que responde en español. Estás ayudando a una familia." }
    ];

    let selectedFiles = [];

    const scrollToBottom = () => {
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const createMessageElement = (content, isUser = false) => {
        const wrapper = document.createElement('div');
        wrapper.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        
        const inner = document.createElement('div');
        inner.className = 'message-content';
        
        if (isUser) {
            // For user, content might be a string or an array (vision format)
            if (typeof content === 'string') {
                inner.textContent = content;
            } else if (Array.isArray(content)) {
                // Find text
                const textPart = content.find(p => p.type === 'text');
                if (textPart) inner.textContent = textPart.text;
                // Add tiny image indicator
                const images = content.filter(p => p.type === 'image_url');
                if (images.length > 0) {
                    const imgText = document.createElement('div');
                    imgText.style.fontSize = '0.8em';
                    imgText.style.opacity = '0.8';
                    imgText.style.marginTop = '4px';
                    imgText.textContent = `[+ ${images.length} imagen(es) adjunta(s)]`;
                    inner.appendChild(imgText);
                }
            }
        } else {
            inner.innerHTML = marked.parse(content);
        }
        
        wrapper.appendChild(inner);
        return wrapper;
    };

    const createTypingIndicator = (text = null) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'message ai-message typing-indicator-wrapper';
        wrapper.id = 'typing-indicator';
        
        const inner = document.createElement('div');
        inner.className = 'message-content typing-indicator';
        if (text) {
            inner.style.fontSize = '0.85em';
            inner.textContent = text;
        } else {
            inner.innerHTML = `
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            `;
        }
        
        wrapper.appendChild(inner);
        return wrapper;
    };

    // --- FILE HANDLING LOGIC ---
    attachBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            // Prevent duplicates by name
            if (!selectedFiles.find(f => f.name === file.name)) {
                selectedFiles.push(file);
            }
        });
        renderFilePreviews();
        fileInput.value = ''; // Reset
    });

    function renderFilePreviews() {
        filePreviewContainer.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const pill = document.createElement('div');
            pill.className = 'file-pill';
            pill.innerHTML = `
                <span>${file.name}</span>
                <button type="button" class="remove-file" data-index="${index}">&times;</button>
            `;
            filePreviewContainer.appendChild(pill);
        });

        document.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                selectedFiles.splice(idx, 1);
                renderFilePreviews();
            });
        });
    }

    async function processFiles() {
        let extractedText = '';
        let imagesBase64 = [];

        for (const file of selectedFiles) {
            const ext = file.name.split('.').pop().toLowerCase();
            
            if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
                // Image
                const base64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                });
                imagesBase64.push(base64);
            } 
            else if (ext === 'pdf') {
                // PDF Parsing using pdf.js
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
                let text = `\n\n--- Documento PDF: ${file.name} ---\n`;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map(item => item.str).join(' ') + '\n';
                }
                extractedText += text;
            }
            else if (ext === 'docx') {
                // Word Parsing using mammoth.js
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({arrayBuffer: arrayBuffer});
                extractedText += `\n\n--- Documento Word: ${file.name} ---\n` + result.value;
            }
            else {
                // Standard Text files (.txt, .md, .csv, .json, etc)
                const text = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsText(file);
                });
                extractedText += `\n\n--- Archivo: ${file.name} ---\n` + text;
            }
        }

        return { extractedText, imagesBase64 };
    }
    // ----------------------------

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let text = userInput.value.trim();
        if (!text && selectedFiles.length === 0) return;

        sendBtn.disabled = true;
        userInput.value = '';
        let typingIndicator;

        try {
            let messageContent = text;

            // If files are attached, process them first
            if (selectedFiles.length > 0) {
                typingIndicator = createTypingIndicator("Leyendo archivos...");
                chatBox.appendChild(typingIndicator);
                scrollToBottom();

                const { extractedText, imagesBase64 } = await processFiles();
                
                if (extractedText) {
                    messageContent += (messageContent ? "\n\n" : "") + "Te adjunto la siguiente información para que la analices:\n" + extractedText;
                }

                if (imagesBase64.length > 0) {
                    // Vision format for LM Studio
                    let contentArray = [{ type: "text", text: messageContent }];
                    imagesBase64.forEach(b64 => {
                        contentArray.push({
                            type: "image_url",
                            image_url: { url: b64 }
                        });
                    });
                    messageContent = contentArray;
                }

                typingIndicator.remove(); // Remove reading indicator
            }

            // 1. Add user message to UI and history
            chatBox.appendChild(createMessageElement(messageContent, true));
            messages.push({ role: "user", content: messageContent });
            
            // Reset files
            selectedFiles = [];
            renderFilePreviews();
            scrollToBottom();

            // 2. Show thinking indicator
            typingIndicator = createTypingIndicator();
            chatBox.appendChild(typingIndicator);
            scrollToBottom();

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
                    stream: false 
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
            console.error("Error:", error);
            if(typingIndicator) typingIndicator.remove();
            
            let errorMsg = "Lo siento, hubo un problema al conectar con el servidor local o al procesar los archivos. 😥";
            if (error.message.includes('Failed to fetch')) {
                errorMsg = `No se pudo conectar a LM Studio. Asegúrate de que el servidor local está activado en el puerto 5555 y que CORS está habilitado.`;
            }
            chatBox.appendChild(createMessageElement(`**Error:** ${errorMsg}`, false));
        } finally {
            sendBtn.disabled = false;
            userInput.focus();
            scrollToBottom();
        }
    });

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

    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });
});
