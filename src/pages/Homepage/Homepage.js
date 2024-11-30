import React, { useEffect, useRef } from 'react';
import './Homepage.css'
import { useNavigate } from "react-router-dom"
function Homepage(){
    const navigate = useNavigate()
    const handleClick = () => navigate(`/Diagram`)
    return(
        <div className='homePageContainer'>
            <h1 className='chatbotTittle'>ChatBot Constructor</h1>
            <p className='chatbotDescrition'>Simple chatbot constructor provided by drag'n'drop interface</p>
            <div className='buttonContainer'>
                <button onClick={handleClick} className='button'>/start</button>
            </div>
        </div>
    );
}
export default Homepage;