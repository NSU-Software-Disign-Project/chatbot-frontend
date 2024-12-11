
export default class chatRenderer {
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
    this.clearOptions();
    this.optionsContainer = document.createElement("div");
    this.optionsContainer.classList.add("options");

    options.forEach((option) => {
      const button = document.createElement("button");
      button.textContent = option;
      button.addEventListener("click", () => callback(option));
      this.optionsContainer.appendChild(button);
    });

    this.chatContainer.appendChild(this.optionsContainer);
    this.scrollToBottom();
  }

  clearOptions() {
    if (this.optionsContainer) {
      this.optionsContainer.remove();
      this.optionsContainer = null;
    }
  }

  scrollToBottom() {
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }
}
