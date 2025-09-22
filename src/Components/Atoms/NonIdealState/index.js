import React from 'react'

import './style.scss'

const NonIdealState = ({ icon, text, action }) => {
    return  <div className='non-ideal-state'>
                <div className='card'>
                    <i className={`pi pi-${icon || 'star'}`}></i>
                    <div className='notice'>{text}</div>
                </div>
            </div>
}

export default NonIdealState
