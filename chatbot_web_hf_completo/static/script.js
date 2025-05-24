document.addEventListener('DOMContentLoaded', function() {
    const chatbox = document.querySelector(".chatbox");
    const chatInput = document.querySelector(".chat-input textarea");
    const sendChatBtn = document.querySelector(".chat-input span");
    const chatbotToggler = document.querySelector(".chatbot-toggler");
    const chatbotCloseBtn = document.querySelector(".chatbot header span");

    let userMessage = null;
    const API_URL = "/chat"; // URL do endpoint do seu backend Flask
    const initialHeight = chatInput.scrollHeight;

    const createChatLi = (message, className) => {
        // Create a chat <li> element with passed message and className
        const chatLi = document.createElement("li");
        chatLi.classList.add("chat", className);
        let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
        chatLi.innerHTML = chatContent;
        chatLi.querySelector("p").textContent = message;
        return chatLi; // return chat <li> element
    }

    const generateResponse = async (incomingChatLi) => {
        const messageElement = incomingChatLi.querySelector("p");
        messageElement.textContent = "Digitando..."; // Mensagem de "digitando..."

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: userMessage })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.response || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            messageElement.textContent = data.response; // Atualiza com a resposta real
        } catch (error) {
            console.error("Erro ao gerar resposta:", error);
            messageElement.classList.add("error");
            messageElement.textContent = "Oops! Algo deu errado. Por favor, tente novamente.";
        } finally {
            chatbox.scrollTo(0, chatbox.scrollHeight);
        }
    }

    const handleChat = () => {
        userMessage = chatInput.value.trim(); // Get user entered message and remove extra whitespace
        if (!userMessage) return;

        // Clear the input textarea and set its height to default
        chatInput.value = "";
        chatInput.style.height = `${initialHeight}px`;

        // Append the user's message to the chatbox
        chatbox.appendChild(createChatLi(userMessage, "outgoing"));
        chatbox.scrollTo(0, chatbox.scrollHeight);

        // Display "Thinking..." message while waiting for the response
        setTimeout(() => {
            const incomingChatLi = createChatLi("Digitando...", "incoming");
            chatbox.appendChild(incomingChatLi);
            chatbox.scrollTo(0, chatbox.scrollHeight);
            generateResponse(incomingChatLi);
        }, 600); // Give a slight delay for better UX
    }

    chatInput.addEventListener("input", () => {
        // Adjust the height of the input textarea based on its content
        chatInput.style.height = `${initialHeight}px`;
        chatInput.style.height = `${chatInput.scrollHeight}px`;
    });

    chatInput.addEventListener("keydown", (e) => {
        // If Enter key is pressed and the input is not empty and the user is not holding shift key
        if(e.key === "Enter" && !e.shiftKey && userMessage) {
            e.preventDefault(); // Prevent new line on Enter
            handleChat();
        }
    });

    sendChatBtn.addEventListener("click", handleChat);
    chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
    chatbotCloseBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));

    // Adiciona a mensagem inicial do bot quando a página carrega
    const initialBotMessage = "Olá! Bem-vindo(a) à nossa Loja de Departamentos. Como posso ajudar você hoje?";
    chatbox.appendChild(createChatLi(initialBotMessage, "incoming"));
    chatbox.scrollTo(0, chatbox.scrollHeight);
});