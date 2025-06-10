import React, { useState } from "react";
import BotsList from "./Entity/BotList";
import "./BotPage.css"
import {useNavigate} from "react-router-dom";

const BotPage = () => {
  const [bots, setBots] = useState([
    {
      id: 1,
      name: "Bot 1",
      description: "Bot for medical purposes",
    },
    {
      id: 2,
      name: "Bot 2",
      description: "Bot for educational purposes",
    },
    {
      id: 3,
      name: "Bot 3",
      description: "Bot for customer support",
    },
  ]);

  const navigate = useNavigate()

  // Состояния для модальных окон
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedBotId, setSelectedBotId] = useState(null);

  // Функция для открытия модального окна удаления
  const openDeleteModal = (botId) => {
    setSelectedBotId(botId);
    setDeleteModalOpen(true);
  };

  // Функция для закрытия модального окна удаления
  const closeDeleteModal = () => {
    setSelectedBotId(null);
    setDeleteModalOpen(false);
  };

  // Функция для удаления бота
  const handleDeleteBot = () => {
    if (selectedBotId) {
      setBots((prevBots) => prevBots.filter((bot) => bot.id !== selectedBotId));
      closeDeleteModal();
    }
  };

  // Функция для открытия модального окна обмена
  const openShareModal = (botId) => {
    setSelectedBotId(botId);
    setShareModalOpen(true);
  };

  // Функция для закрытия модального окна обмена
  const closeShareModal = () => {
    setSelectedBotId(null);
    setShareModalOpen(false);
  };

  // Функция для обмена ботом
  const handleShareBot = () => {
    if (selectedBotId) {
      console.log(`Sharing bot with ID ${selectedBotId}`);
      closeShareModal();
    }
  };

  const createNewBot = () => {
    navigate("/Diagram");
  }

  return (
    <div className="app">
      {/* Шапка */}
      <header>
        <h1>Hi Lorum</h1>
        <button onClick={createNewBot}>Create new bot +</button>
        <div className="actions">
          <nav>
            <a href="#">Tutorial</a>
            <a href="#">Sign out</a>
          </nav>
        </div>
      </header>

      {/* Список ботов */}
      <main>
        <BotsList
          bots={bots}
          onDelete={openDeleteModal}
          onShare={openShareModal}
        />
      </main>

      {/* Модальное окно для удаления */}
      {deleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Confirm Deletion</h2>
            <p>Are you sure you want to delete this bot?</p>
            <div className="modal-actions">
              <button onClick={handleDeleteBot}>Yes, Delete</button>
              <button onClick={closeDeleteModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для обмена */}
      {shareModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Share Bot</h2>
            <p>Do you want to share this bot?</p>
            <div className="modal-actions">
              <button onClick={handleShareBot}>Yes, Share</button>
              <button onClick={closeShareModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotPage;