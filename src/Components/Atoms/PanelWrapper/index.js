import React, { useState } from 'react'

import { Sidebar } from 'primereact/sidebar'

import './style.scss'

const PanelWrapper = ({ layout, children, resetTrigger, area }) => {
    return layout !== 'mobile' ? children : (
        <Sidebar
            onHide={() => resetTrigger()}
            maskClassName={'live-panel '+(area ? area+'-panel' : '')}
            visible={true}
            position='bottom'
        >{children}</Sidebar>
    )
}

export default PanelWrapper
