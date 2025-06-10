import React from "react";
import BotItem from "./BotEntity";

const BotsList = ({ bots, onDelete, onShare }) => {
  return (
    <div className="bots-list">
      {bots.map((bot) => (
        <BotItem
          key={bot.id}
          bot={bot}
          onDelete={onDelete}
          onShare={onShare}
        />
      ))}
    </div>
  );
};

export default BotsList;