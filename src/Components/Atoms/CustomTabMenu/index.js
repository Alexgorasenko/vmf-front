import React from 'react'

import './medias.scss'

const CustomTabMenu = ({ model, activeIndex, onTabChange }) => {
    return  <div className='custom-tabs'>
                {model.map((i, idx) => (
                    <div className={`custom-tabs_btn ${idx === activeIndex ? ' active' : ''}`} key={idx} onClick={() => onTabChange({index: idx, value: i})}>
                        <i className={i.icon}></i>
                        <span>{i.label}</span>
                    </div>
                ))}
            </div>
}

export default CustomTabMenu
