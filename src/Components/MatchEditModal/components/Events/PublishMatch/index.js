import React, { useState, useEffect, useContext, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import { MatchContext } from '../../../ctx'

import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { InputSwitch } from 'primereact/inputswitch'
import { Dropdown } from 'primereact/dropdown'

import Scoreboard from '../../../Scoreboard'

import axios from 'axios'
import { ENDPOINT } from '../../../../../env'

const cleanRefinements = obj => {
    return obj.events ? {
        ...obj,
        events: Object.keys(obj.events).reduce((acc, side) => {
            acc[side] = Object.keys(obj.events[side]).reduce((_acc, type) => {
                _acc[type] = obj.events[side][type].map(({refinement, ...evt}) => evt)
                return _acc
            }, {})
            return acc
        }, {})
    } : obj
}

const PublishMatch = ({ setStep }) => {
    const [options, setOptions] = useState({render: false, notify: false})
    const [publishing, setPublishing] = useState(false)

    const history = useHistory()

    const ctx = useContext(MatchContext)
    const { scores, homeRoster, awayRoster, mvp } = ctx.form

    const homeRosterOptions = homeRoster && homeRoster.players ? homeRoster.players.map(p => ({label: `${p.name} ${p.surname}`, value: p.num ? p.num : p._id})) : []
    const awayRosterOptions = awayRoster && awayRoster.players ? awayRoster.players.map(p => ({label: `${p.name} ${p.surname}`, value: p.num ? p.num : p._id})) : []

    const toastRef = useRef(null)

    const publishMatch = () => {
        setPublishing(true)
        axios.post(`${ENDPOINT}v2/applyMatchChanges`, {form: cleanRefinements(ctx.form), options: options}, {
            headers: {
                authorization: localStorage.getItem('_amateum_subject_tkn')
            }
        }).then(resp => {
            let info = resp.data ? (resp.data.info || '') : ''
            if (info) {
                toastRef.current.show({severity: 'info', summary: 'Матч сохранён успешно!', detail:info, life: 4000})
            } else {
                toastRef.current.show({severity: 'success', summary: 'Успешно', detail: 'Матч сохранён!'})
            }
            setTimeout(() => {
                 setPublishing(false)
                 history.push(window.location.pathname)
            }, 3500)
        })
    }

    return  <div className='publish-match'>
                <Toast position='top-center' ref={toastRef} />

                <span className='step_pablic_title title'>Публикация матча</span>

                <div className='step_pablic_button-group navigate-btns'>
                    <Button className="p-button-secondary p-button-text" label="Вторичные события" icon='pi pi-chevron-left' onClick={()=> setStep(2)} />
                </div>

                <div className='step_pablic_scoreboard'>
                    <Scoreboard editing={false} number={scores.full.home} id={"home"} />
                    <Scoreboard editing={false} number={scores.full.away} id={"away"} />
                </div>

                <div className='step_pablic_main'>
                    <div className='mvp'>
                        <div className='p-inputgroup'>
                            <span className='p-inputgroup-addon'>MVP у хозяев</span>
                            <Dropdown
                                options={homeRosterOptions}
                                value={mvp ? mvp.home : null}
                                onChange={e => ctx.setForm({...ctx.form, mvp: {...mvp, home: e.target.value}})}
                                showClear
                            />
                        </div>
                        <div className='p-inputgroup'>
                            <span className='p-inputgroup-addon'>MVP у гостей</span>
                            <Dropdown
                                options={awayRosterOptions}
                                onChange={e => ctx.setForm({...ctx.form, mvp: {...mvp, away: e.target.value}})}
                                value={mvp ? mvp.away : null}
                                showClear
                            />
                        </div>
                    </div>

                    <div className='main__switch'>
                        <InputSwitch checked={options.render} onChange={(e) => setOptions({...options, render: !options.render})} />
                        <span className='main__switch_label'>Графика в соц.сетях?</span>
                    </div>
                    <div className='main__switch'>
                        <InputSwitch checked={options.notify} onChange={(e) => setOptions({...options, notify: !options.notify})} />
                        <span className='main__switch_label'>Уведомления представителям команд?</span>
                    </div>
                </div>

                <Button
                    label={publishing ? "Публикуем матч" : "Опубликовать"}
                    icon="pi pi-check"
                    className="p-button-success"
                    onClick={() => publishMatch()}
                    loading={publishing}
                />
            </div>
}

export default PublishMatch
