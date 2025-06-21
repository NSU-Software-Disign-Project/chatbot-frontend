import React from 'react';
import './Homepage.css';
import { useNavigate } from "react-router-dom";
import AnimatedLogo from './AnimatedLogo'; // Путь зависит от структуры проекта

function Homepage() {
  const navigate = useNavigate();
  const handleClick = () => navigate(`/auth`);

  return (
    <div className="homePageContainer">
      {/* Фоновое SVG-логотип */}
      <div className="background-logo">
        <AnimatedLogo />
      </div>

      {/* Основной контент */}
      <div className="content">
        <h1 className='chatbotTittle'>ChatBot Constructor</h1>
        <p className='chatbotDescrition'>
          Simple chatbot constructor provided by drag'n'drop interface
        </p>
        <div className='buttonContainer'>
          <button onClick={handleClick} className='button'>/start</button>
        </div>
      </div>
    </div>
  );
}

export default Homepage;