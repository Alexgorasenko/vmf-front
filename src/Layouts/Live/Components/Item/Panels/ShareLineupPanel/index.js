import React, { useContext, useState, useEffect } from 'react'

import { ProgressSpinner } from 'primereact/progressspinner'
import { Button } from 'primereact/button'
import Pennant from '../../../../../../assets/img/pennant.png'

import { ItemContext, LiveContext } from '../../../../ctx'

import './style.scss'

import { ENDPOINT } from '../../../../../../env'
import axios from 'axios'

const ShareLineupPanel = ({ side }) => {
    const [base, setBase] = useState(null)

    const ctx = useContext(ItemContext)
    const team = ctx.entity && ctx.entity.match ? ctx.entity.match[side] : null

    useEffect(() => {
        if(side && ctx && ctx.entity && ctx.entity.match) {
            const url = `${ENDPOINT}share?url=${decodeURIComponent(ENDPOINT+'render/elegance/startlineup/'+ctx.entity.match._id+'?side='+side)}`
            axios.get(url)
                .then(resp => {
                    setBase(resp.data)
                })
        }
    }, [side])

    return  <div className='share-lineup-panel'>
                {team ? (
                    <div className='panel-icon'>
                        <img src={team.club.emblem || ''} onError={e => {e.target.src = Pennant}} />
                    </div>
                ) : null}

                <div className='panel-title'>Скачать для соц. сетей</div>

                {base ? (
                    <div className='share-image'>
                        <img src={base} />
                    </div>
                ) : (
                    <div className='panel-loader' style={{height: '50vh'}}>
                        <ProgressSpinner style={{width: 64, height: 64}} />
                    </div>
                )}

                {base ? (
                    <div className='panel-action'>
                        <Button
                            className='p-button-sm p-button-info'
                            icon='pi pi-check'
                            onClick={() => {
                                window.open(base)
                                ctx.setPanel(null)
                            }}
                        >Скачать</Button>
                    </div>
                ) : null}
            </div>
}

export default ShareLineupPanel
