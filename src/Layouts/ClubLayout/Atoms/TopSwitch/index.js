import React from 'react'

import { Badge } from 'primereact/badge'

import './style.scss'

const TopSwitch = ({ model, active, onChange }) => {
    return  <div className='top-switch'>
                {model.map((item, idx) => (
                    <div
                        key={idx}
                        onClick={() => onChange(idx)}
                        className={`top-switch_option ${active === idx ? 'active' : ''}`}
                    >
                        <div>{item.label}</div>
                        {item.icon ? (
                            <i className={`pi ${item.icon}`}></i>
                        ) : item.badge ? (
                            <Badge value={item.badge}></Badge>
                        ) : null}
                    </div>
                ))}
                <div
                    className='indicator'
                    style={{
                        width: `calc((100% - 0.7rem)/${model.length})`,
                        left: `calc(((100%/${model.length})*${active}) + ${0.35/(active + 2)}rem)`
                    }}
                ></div>
            </div>
}

export default TopSwitch
