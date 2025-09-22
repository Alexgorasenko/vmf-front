import React from 'react'
import Plug from '../../assets/img/plug_img_match.png'
import Pennant from '../../assets/img/pennant.png'

import './style.scss'

const Emblem = ({ source, backdroped, size, backgroundTransparent, className, isClub }) => {

    const handleOnError = (e) => {
        e.target.src = isClub ? Pennant : Plug;
    }

    return  <div className={`emblem ${className || ''} ${size || 'sm'}`+(backdroped ? ' backdroped': '') + (backgroundTransparent ? 'transparent' : '')}>
                <img src={source || ''}  onError={handleOnError}/>
            </div>
}

export default Emblem
