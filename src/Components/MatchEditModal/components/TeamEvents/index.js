import React, { useState, useEffect, useRef, useContext } from 'react'

import { Tag } from 'primereact/tag'
import { OverlayPanel } from 'primereact/overlaypanel'
import { InputTextarea } from 'primereact/inputtextarea'
import { Button } from 'primereact/button'

import { WorkspaceContext } from '../../../../ctx'

import './style.scss'

import { ENDPOINT } from '../../../../env'
import axios from 'axios'

const reduceEvs = obj => {
    return Object.entries(obj).map(e => e[1].map(evt => ({...evt, type: e[0]}))).flat(1).sort((a, b) => parseInt(a.minute) - parseInt(b.minute))
}

const RefinementForm = ({ data, uuid, source, onSaved }) => {
    const [text, setText] = useState(data && data.refinement ? data.refinement.content : null)
    const [progress, setProgress] = useState(false)

    useEffect(() => {
        if(progress) {
            setProgress(false)
        }
    }, [data && data.refinement])

    return  <div className='refinement-form'>
                <InputTextarea
                    autoResize
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder='Уточнение для организатора'
                    rows={4}
                />

                <Button
                    className='p-button-sm'
                    icon='pi pi-send'
                    label='Отправить уточнение'
                    onClick={() => {
                        setProgress(true)
                        onSaved(text)
                    }}
                    loading={progress}
                />
            </div>
}

const TeamEvents = ({ team, match }) => {
    const [evs, setEvs] = useState(null)
    const [euid, setEuid] = useState(null)
    const [evsSource, setEvsSource] = useState(null)

    useEffect(() => {
        if(match && match.events && !evs) {
            const evsSource = match.events.find(e => e.type === 'events')
            if(evsSource) {
                setEvsSource(evsSource)
                setEvs(evsSource.data[team] ? reduceEvs(evsSource.data[team]) : [])
            }
        }
    }, [])

    const refinementRef = useRef()

    const wctx = useContext(WorkspaceContext)

    const updateEvt = (body) => {
        return new Promise((resolve, reject) => {
            const origin = evs.find(evt => evt.uuid === euid)
            if(origin) {
                const idx = evsSource.data[team][origin.type].findIndex(evt => evt.uuid === euid)
                if(idx > -1) {
                    const patch = {[`data.${team}.${origin.type}.${idx}.refinement`]: body}
                    axios.put(`${ENDPOINT}v2/events/${evsSource._id}`, patch, {
                        headers: {
                            Authorization: localStorage.getItem('_amateum_subject_tkn')
                        }
                    }).then(resp => {
                        resolve(true)
                    })
                } else {
                    resolve(true)
                }
            } else {
                resolve(true)
            }
        })
    }

    return  <div className='team-events'>
                {evs ? evs.length ? evs.map(e => (
                    <div className='team-events-item' key={e.uuid}>
                        <Tag
                            className='event-type'
                            severity={e.type === 'yc' ? 'warning' : e.type === 'rc' ? 'danger' : !e.missedPenalty && !e.owngoal ? 'success' : 'info'}
                            value={e.type === 'yc' ? 'Предупреждение' : e.type === 'rc' ? 'Удаление' : e.missedPenalty ? 'Незабитый пенальти' : e.owngoal ? 'Автогол' : e.penalty ? 'Гол с пенальти' : 'Гол'}
                        />
                        <Tag
                            className='event-minute'
                            value={!isNaN(e.minute) ? e.minute+' минута' : 'минута не указана'}
                        />

                        <div className='events-item-body'>
                            <div className='player'>{e.player ? e.player.name+' '+e.player.surname : 'Игрок не указан'}</div>
                            {['yc', 'rc'].includes(e.type) ? null : <div className='assistant'>ассистент: {e.assistant ? e.assistant.name+' '+e.assistant.surname : 'не указан'}</div>}

                            {e.uuid ? <Tag
                                className={'refinement'+(e.refinement ? ' active' : '')}
                                value={e.refinement ? 'корректировка на рассмотрении' : 'добавить корректировку'}
                                onClick={(_e) => {
                                    setEuid(e.uuid)
                                    refinementRef.current.toggle(_e)
                                }}
                            /> : null}
                        </div>
                    </div>
                )): 'нет событий' : null}

                <OverlayPanel
                    ref={refinementRef}
                    showCloseIcon
                    dismissable
                    onHide={() => setEuid(null)}
                >
                    <RefinementForm
                        data={evs ? evs.find(e => e.uuid === euid) : null}
                        uuid={euid}
                        onSaved={(text) => {
                            const refinementBody = text && text.length ? {
                                content: text,
                                timestamp: new Date().getTime(),
                                author: wctx.workspace.profile.name
                            } : null

                            updateEvt(refinementBody)
                                .then(resp => {
                                    setEvs(evs.map(evt => evt.uuid === euid ? ({
                                        ...evt,
                                        refinement: refinementBody
                                    }) : evt))

                                    setEuid(null)
                                    refinementRef.current.hide()
                                })
                        }}
                    />
                </OverlayPanel>
            </div>
}

export default TeamEvents
