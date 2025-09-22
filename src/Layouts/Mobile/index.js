import React, { useState, useContext } from 'react'

import { ToolbarContext } from '../../Components/Toolbar/ctx'
import Toolbar from '../../Components/Toolbar'

import { Button } from '@ui/button'
import './style.scss'

const Mobile = ({ sideblock, top, body, onlyLiveMode, subject }) => {
    const [shownMenu, setShownMenu] = useState(false)
    const [toolbar, setToolbar] = useState({
        path: null,
        filters: {},
        data: {}
    })

    const toggleShownMenu = () => {
        setShownMenu(!shownMenu)
    }

    return  <div className={'layout-mobile'+(!shownMenu ? ' collapsed' : '')+(onlyLiveMode || window.location.pathname.includes('/live') ? ' notop' : '')}>
            <ToolbarContext.Provider
                value={{
                    toolbar,
                    setToolbar,
                    setFilter: (k, v) => setToolbar({
                        ...toolbar,
                        filters: {
                            ...toolbar.filters,
                            [k]: v
                        }
                    }),
                    setToolbarData: (data) => setToolbar({
                        ...toolbar,
                        data: data
                    })
                }}>
                    <div className={'aside'+(shownMenu ? ' shown' : '')}>
                        {React.cloneElement(sideblock, {compact: true, toggleShownMenu: toggleShownMenu, collapsed: !shownMenu})}
                    </div>

                    <div className='page'>
                        {React.cloneElement(top, {toggleShownMenu: toggleShownMenu})}
                        <Toolbar subject={subject} />
                        {body}
                    </div>
                </ToolbarContext.Provider>
            </div>
}

export default Mobile
