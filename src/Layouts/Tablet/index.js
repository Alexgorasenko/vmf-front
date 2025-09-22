import React, { useState } from 'react'

import './style.scss'

const Tablet = ({ sideblock, top }) => {
    const [collapsedSide, setCollapsedSide] = useState(true)

    const toggleCollapsedSide = () => {
        setCollapsedSide(!collapsedSide)
    }

    return  <div className={'layout-tablet'+(collapsedSide ? ' collapsed' : '')}>
                <div className='aside'>
                    {React.cloneElement(sideblock, {compact: true, collapsed: collapsedSide, toggleCollapsedSide: toggleCollapsedSide})}
                </div>

                <div className='page'>
                    {top}

                    <div className='container'>
                        <div className='container-grid'>
                            <div className='main'>List
                            </div>

                            <div className='side'>Side
                            </div>
                        </div>
                    </div>
                </div>
            </div>
}

export default Tablet
