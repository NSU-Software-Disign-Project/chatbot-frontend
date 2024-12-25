export default class chatLogic {
  constructor(renderer) {
    this.renderer = renderer;
    this.userResponses = [];
    this.isWaitingForInput = false;
    this.currentBlockIndex = 0;
  }

  initializeChat(initialJson) {
    this.jsonData = initialJson;
    this.renderNextBlock();
  }

  renderNextBlock() {
    if (this.isEndOfChat()) return;

    const currentBlock = this.getCurrentBlock();

    switch (currentBlock.type) {
      case "message":
        this.renderMessageBlock(currentBlock);
        break;
      case "options":
        this.renderOptionsBlock(currentBlock);
        break;
      case "input":
        this.renderInputBlock(currentBlock);
        break;
      default:
        console.warn(`Unknown block type: ${currentBlock.type}`);
        this.currentBlockIndex++;
        this.renderNextBlock();
    }
  }

  renderMessageBlock(block) {
    this.renderer.renderMessage(block.attributes.text, "bot");
    this.currentBlockIndex++;
    this.renderNextBlock();
  }

  renderOptionsBlock(block) {
    this.renderer.renderOptions(block.attributes.variants, (option) =>
      this.handleOptionsResponse(option, block.conditions)
    );
  }

  renderInputBlock(block) {
    this.isWaitingForInput = true;
    this.renderer.renderMessage(block.attributes.prompt, "bot");
  }

  handleOptionsResponse(option, conditions = {}) {
    this.renderer.renderMessage(option, "user");
    this.userResponses.push({ type: "options", userResponse: { value: option } });
    this.renderer.clearOptions();

    if (conditions[option]) {
      this.insertBlocks(conditions[option]);
    }

    this.currentBlockIndex++;
    this.renderNextBlock();
  }

  handleUserInput(userInput) {
    if (this.isWaitingForInput && userInput.trim()) {
      this.renderer.renderMessage(userInput, "user");
      this.userResponses.push({ type: "input", userResponse: { value: userInput } });

      this.isWaitingForInput = false;
      this.currentBlockIndex++;
      this.renderNextBlock();
    }
  }

  insertBlocks(blocks) {
    this.jsonData.splice(this.currentBlockIndex + 1, 0, ...blocks);
  }

  isEndOfChat() {
    return this.currentBlockIndex >= this.jsonData.length;
  }

  getCurrentBlock() {
    return this.jsonData[this.currentBlockIndex];
  }
}
