import React from 'react'

import { Button } from 'primereact/button'

import './style.scss'

const SideNotes = ({ icon, content, primaryAction, style }) => {
    return  <div className='side-notes' style={style}>
                <div className='image'>
                    <img src={require(`./${icon}.png`)} />
                </div>

                <div className='text-group'>
                    {content}
                </div>

                {primaryAction ? (
                    <div className='primary-action'>
                        <Button
                            className='p-button-sm'
                            label={primaryAction.label}
                            onClick={() => primaryAction.action()}
                        />
                    </div>
                ) : null}
            </div>
}

export default SideNotes
