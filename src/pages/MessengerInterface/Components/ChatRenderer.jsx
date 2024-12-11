class ChatRenderer {
  constructor(chatContainer) {
    this.chatContainer = chatContainer;
    this.optionsContainer = null;
  }

  renderMessage(text, sender) {
    const message = document.createElement("div");
    message.classList.add("message", sender);
    message.textContent = text;
    this.chatContainer.appendChild(message);
    this.scrollToBottom();
  }

  renderOptions(options, callback) {
    this.clearOptions(); // Очистка старых вариантов, если есть

    this.optionsContainer = document.createElement("div");
    this.optionsContainer.classList.add("options");

    options.forEach((option) => {
      const button = document.createElement("button");
      button.textContent = option;
      button.addEventListener("click", () => callback(option));
      this.optionsContainer.appendChild(button);
    });

    // Добавляем контейнер с вариантами в чат
    this.chatContainer.appendChild(this.optionsContainer);
    this.scrollToBottom();
  }

  clearOptions() {
    // Удаляем контейнер с вариантами, если он существует
    if (this.optionsContainer) {
      this.optionsContainer.innerHTML = ""; // Очищаем содержимое, а не сам элемент
    }
  }

  scrollToBottom() {
    // Прокручиваем контейнер вниз
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }
}

export default ChatRenderer;
