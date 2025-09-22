import React, { useContext, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { ItemContext, LiveContext } from '../../../../ctx'

import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { Checkbox } from 'primereact/checkbox'

import { applyMatchState } from '../../helpers'

import './style.scss'

const MvpSelector = ({ subject, options, value, onSelected }) => {
    return  <div className='mvp-selector'>
                <div className='label'>MVP у {subject}</div>
                <Dropdown
                    options={options.map(o => ({label: o.name+' '+o.surname, value: o._id}))}
                    placeholder='- не выбран -'
                    onChange={e => onSelected(e.value)}
                    value={value}
                />
            </div>
}

const FinishPeriod = ({ _finishSuggested }) => {
    const [finishSuggested, setFinishSuggested] = useState(_finishSuggested || false)
    const [finishOptions, setFinishOptions] = useState({homeMvp: null, awayMvp: null, publish: true, share: false})
    const ctx = useContext(ItemContext)
    const liveCtx = useContext(LiveContext)

    const history = useHistory()

    return  <div className='finish-period'>
                <div className='panel-icon'>
                    <img src={require('../assets/whistle.png')} />
                </div>

                <div className='panel-title'>{ctx.entity.postMode ? 'Опубликовать' : 'Завершить'} {finishSuggested ? 'матч' : 'тайм'}</div>
                <div className='panel-subtitle'>{finishSuggested ? '' : 'выберите дальнейшие действия:'}</div>

                {finishSuggested ? (
                    <div className='finish-options'>
                        <MvpSelector subject={ctx.entity.match.home.name} options={ctx.entity.rosters.home ? ctx.entity.rosters.home.list : []} value={finishOptions.homeMvp} onSelected={id => setFinishOptions({...finishOptions, homeMvp: id})} />
                        <MvpSelector subject={ctx.entity.match.away.name} options={ctx.entity.rosters.away ? ctx.entity.rosters.away.list : []} value={finishOptions.awayMvp} onSelected={id => setFinishOptions({...finishOptions, awayMvp: id})} />

                        <div className='check-option'>
                            <Checkbox checked={finishOptions.publish} onChange={() => setFinishOptions({...finishOptions, publish: !finishOptions.publish})} inputId='publish' />
                            <label htmlFor='publish' className='p-checkbox-label'>Опубликовать результат</label>
                        </div>

                        <div className='check-option'>
                            <Checkbox checked={finishOptions.share} onChange={() => setFinishOptions({...finishOptions, share: !finishOptions.share})} inputId='share' />
                            <label htmlFor='share' className='p-checkbox-label'>Опубликовать матч-пост в соц.сети</label>
                        </div>
                    </div>
                ) : null}

                <div className='panel-action'>
                    <Button
                        className='p-button-sm p-button-secondary'
                        icon='pi pi-times'
                        onClick={() => finishSuggested ? setFinishSuggested(false) : ctx.setPanel(null)}
                    >Отмена{!finishSuggested ? ', продолжить тайм' : ''}</Button>

                    {!finishSuggested ? <Button
                        className='p-button-sm p-button-info'
                        icon='pi pi-refresh'
                        onClick={() => {
                            ctx.setTime({
                                ...ctx.time,
                                active: false,
                                displayMinute: ctx.time.period*ctx.entity.match.periodDuration
                            })
                            ctx.setPanel(null)
                        }}
                    >Перерыв. Затем матч продолжится</Button> : null}

                    <Button
                        className={`p-button-sm p-button-${finishSuggested ? 'info' : 'secondary'}`}
                        icon='pi pi-check'
                        onClick={() => {
                            if(!finishSuggested) {
                                setFinishSuggested(true)
                            } else {
                                applyMatchState(ctx, finishOptions)
                                    .then(resp => {
                                        liveCtx.liveToast({severity: 'success', detail: 'Матч успешно сохранён'})
                                        ctx.setPanel(null)
                                        history.push('/live')
                                    })
                            }
                        }}
                    >{ctx.entity.postMode ? 'Опубликовать' : 'Завершить'} матч</Button>
                </div>
            </div>
}

export default FinishPeriod
