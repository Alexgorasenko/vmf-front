import React, {useContext, useEffect, useState} from 'react'

import { Button } from 'primereact/button'

import './style.scss'
import {WorkspaceContext} from "../../../../ctx";
import {MatchContext} from "../../../MatchEditModal/ctx";

const MatchdaysNav = ({ data, active, onSelected }) => {
    const [mdays, setMdays] = useState([])
    const [firstLoadFlag, setFirstLoadFlag] = useState(true)

    const ctx = useContext(WorkspaceContext)

    useEffect(() => {
        if(data) {
            const mapped = data.map(md => {
                const pld = md.matches ? md.matches.filter(m => m.score).length : 0
                const pld2 = md.matches ? md.matches.filter(m => (m.date && m.time) || m.score).length : 0
                const isCompleted = md.matches ? (md.matches.length === pld) : false
                const isFilled = md.matches ? (md.matches.length === pld2) : false

                return {...md, isCompleted: isCompleted, isFilled: isFilled}
            })

            setMdays(mapped)

            const unCompletedIdx = mapped.findIndex(md => !md.isFilled)
            if (!ctx.workspace.needUpdate){
                onSelected(mapped[unCompletedIdx > -1 ? unCompletedIdx : 0])
                ctx.setWorkspace({
                    ...ctx.workspace,
                    activeMday: mapped[unCompletedIdx > -1 ? unCompletedIdx : 0]
                })
            } else {
                ctx.setWorkspace({
                    ...ctx.workspace,
                    needUpdate: false
                })
                onSelected(ctx.workspace.activeMday)
            }
        }
    }, [])

    useEffect(() => {
        if (firstLoadFlag){
            setFirstLoadFlag(false)
        } else {
            ctx.setWorkspace({
                ...ctx.workspace,
                activeMday: active
            })
        }
    }, [active])

    return  <div className='matchdays-nav'>
                {mdays.map((md, i) => {
                    return  <div className='matchday-item' key={i}>
                                <Button
                                    icon={`pi pi-${md.isCompleted ? 'check' : 'clock'}`}
                                    className={`p-button-sm${md.isCompleted ? ' p-button-success' : ''}${active && (active._id === md._id) ? ' selected' : ''}`}
                                    onClick={() => onSelected({...md})}
                                >{md.name}</Button>
                            </div>
                })}
            </div>
}

export default MatchdaysNav
