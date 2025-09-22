import React, { useState, useRef } from 'react'

import { OverlayPanel } from 'primereact/overlaypanel'
import { Checkbox } from 'primereact/checkbox'

import './style.scss'

import service from '../../../../service'

const MatchBindPanel = ({ matchId, derivativeBind, options, setDerivativeBind }) => {
    const [opened, setOpened] = useState(false)
    const panelRef = useRef()

    return  [
                <div
                    className={`bind-match ${derivativeBind && derivativeBind.length ? 'binded' : ''}`}
                    onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        panelRef.current.toggle(e);
                    }}
                >
                    <span style={opened ? {color: 'var(--green-500)'} : {}} className={`pi pi-${opened ? 'check' : 'link'}`}></span>
                </div>,
                <OverlayPanel
                    ref={panelRef}
                    dismissable={false}
                    onShow={() => setOpened(true)}
                    onHide={() => setOpened(false)}
                >
                    <div
                        className='bind-options'
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        {options.filter(o => o._id !== matchId && o.home && o.away).map((opt, i) => (
                            <div className='item'
                                key={i}
                                onClick={() => {
                                    const value = derivativeBind && derivativeBind.includes(opt._id) ? derivativeBind.filter(i => i !== opt._id) : [opt._id].concat(derivativeBind || [])
                                    service.patchData(matchId, 'matches', {derivativeBind: value})
                                    setDerivativeBind(value && value.length ? value : null)
                                }}
                            >
                                <div>
                                    <Checkbox checked={derivativeBind && derivativeBind.includes(opt._id)} />
                                </div>
                                <div>{opt.home.name} vs {opt.away.name}</div>
                            </div>
                        ))}
                    </div>
                </OverlayPanel>
            ]
}

export default MatchBindPanel
