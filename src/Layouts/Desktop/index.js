import React, { useContext, useState } from 'react'

import { ToolbarContext } from '../../Components/Toolbar/ctx'
import Toolbar from '../../Components/Toolbar'

import './style.scss'
import './pixel-ratios.scss'

const Desktop = ({ sideblock, top, body, subject }) => {
    const [toolbar, setToolbar] = useState({
        path: null,
        filters: {},
        data: {}
    })

    return  <div className='layout-desktop'>
                <div className='aside'>
                    {sideblock}
                </div>

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
                    <div className='page'>
                        {top}
                        <Toolbar subject={subject} />

                        <div className='container'>
                            {body}
                        </div>
                    </div>
                </ToolbarContext.Provider>
            </div>
}

export default Desktop
