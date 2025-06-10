import React from "react";

const BotEntity = ({ bot, onDelete, onShare }) => {
  return (
    <div className="bot-item">
      <div className="bot-info">
        <h3>{bot.name}</h3>
        <p>{bot.description}</p>
      </div>
      <div className="bot-actions">
        <button onClick={() => onDelete(bot.id)}>Delete bot</button>
        <button onClick={() => onShare(bot.id)}>Share bot</button>
      </div>
    </div>
  );
};

export default BotEntity;