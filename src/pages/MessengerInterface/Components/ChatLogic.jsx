class ChatLogic {
  constructor(renderer) {
    this.renderer = renderer;
    this.userResponses = [];
    this.isWaitingForInput = false;
    this.currentBlockKey = 0; // Текущий блок чата
    this.nodeData = [];
    this.linkData = [];
  }

  initializeChat(initialJson) {
    // Получаем данные и начинаем рендеринг
    this.nodeData = initialJson.nodeDataArray;
    this.linkData = initialJson.linkDataArray;
    console.log("Chat initialized", this.nodeData);
    this.renderNextBlock(); // Начинаем с первого блока
  }

  renderNextBlock() {
    const currentBlock = this.getCurrentBlock();

    if (!currentBlock) {
      console.warn("No more blocks to render.");
      return;
    }

    console.log("Rendering block:", currentBlock);

    switch (currentBlock.category) {
      case "messageBlock":
        this.renderMessageBlock(currentBlock);
        break;
      case "optionsBlock":
        this.renderOptionsBlock(currentBlock);
        break;
      case "inputBlock":
        this.renderInputBlock(currentBlock);
        break;
      case "conditionalBlock":
        this.renderConditionalBlock(currentBlock);
        break;
      default:
        console.warn(`Unknown block type: ${currentBlock.category}`);
        this.currentBlockKey++; // Переход к следующему блоку
        this.renderNextBlock();
    }
  }

  renderInputBlock(block) {
    this.isWaitingForInput = true; // Устанавливаем флаг ожидания ввода от пользователя
    this.renderer.renderMessage(block.prompt, "bot"); // Отображаем подсказку
    this.renderer.renderInput((userInput) => {
      this.handleUserInput(userInput, block);
    });
  }

  renderMessageBlock(block) {
    this.renderer.renderMessage(block.message, "bot");
    this.navigateToNextBlock(block.key);
  }

  renderOptionsBlock(block) {
    const options = block.additionalTexts.map((textObj) => textObj.text);
    this.renderer.renderOptions(options, (selectedOption) => {
      console.log("User selected option:", selectedOption);
      this.handleOptionsResponse(selectedOption, block);
    });
  }

  renderConditionalBlock(block) {
    const userValue = this.userResponses.find(
      (response) => response.key === block.value
    )?.value;
    console.log(
      "Evaluating condition for:",
      block.value,
      "User response:",
      userValue
    );

    if (userValue) {
      const isConditionMet = this.evaluateCondition(
        userValue,
        block.condition,
        block.conditionValue
      );
      console.log("Condition met:", isConditionMet);
      const nextKey = isConditionMet
        ? block.outputs[0]?.portId
        : block.outputs[1]?.portId;
      const nextBlock = this.nodeData.find((b) => b.key === parseInt(nextKey));
      if (nextBlock) {
        this.renderBlock(nextBlock);
      }
    }
  }

  handleUserInput(userInput) {
    if (!this.isWaitingForInput) return;

    console.log("User input:", userInput);
    this.renderer.renderMessage(userInput, "user"); // Отображаем сообщение пользователя

    // Сохраняем пользовательский ввод
    this.userResponses.push({
      type: "message",
      key: this.currentBlockKey,
      value: userInput,
    });

    // Переход к следующему блоку
    this.isWaitingForInput = false;
    this.renderNextBlock();
  }

  handleOptionsResponse(selectedOption, block) {
    this.renderer.renderMessage(selectedOption, "user");

    this.userResponses.push({
      type: "options",
      key: block.key,
      value: selectedOption,
    });

    this.renderer.clearOptions();
    const nextBlockKey = this.getNextBlockKeyForOption(block, selectedOption);
    // console.log(nextBlockKey);
    const nextBlock = this.nodeData.find((b) => b.key === nextBlockKey);
    console.log(nextBlock);
    this.renderBlock(nextBlock);
  }

  getNextBlockKeyForOption(block, option) {
    const matchingOption = block.additionalTexts.find(
      (optionObj) => optionObj.text === option
    );
    console.log(matchingOption);
    const outgoingLinks = this.linkData.filter(
      (link) => link.fromPort === matchingOption.portId
    );
    console.log(outgoingLinks);

    if (outgoingLinks.length > 0) {
      const nextLink = outgoingLinks[0];
      console.log(nextLink.to);
      return nextLink.to;
    }

    return null;
  }

  evaluateCondition(userValue, condition, conditionValue) {
    switch (condition) {
      case ">=":
        return parseInt(userValue) >= parseInt(conditionValue);
      case "<":
        return parseInt(userValue) < parseInt(conditionValue);
      // Добавьте другие условия, если нужно
      default:
        return false;
    }
  }

  getCurrentBlock() {
    return this.nodeData.find((block) => block.key === this.currentBlockKey);
  }

  navigateToNextBlock(currentBlockKey) {
    const nextLink = this.linkData.find(
      (link) => link.from === currentBlockKey
    );
    if (nextLink) {
      const nextBlockKey = nextLink.to;
      this.currentBlockKey = nextBlockKey;
      this.renderNextBlock();
    } else {
      console.warn(`No next block found for key ${currentBlockKey}`);
    }
  }

  renderBlock(block) {
    if (!block) return;
    this.currentBlockKey = block.key;
    this.renderNextBlock();
  }
}

export default ChatLogic;
