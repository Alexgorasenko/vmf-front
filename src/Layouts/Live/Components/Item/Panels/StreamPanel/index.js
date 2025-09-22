import React, { useContext, useState, useEffect } from 'react'

import { InputSwitch } from 'primereact/inputswitch'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'

import { ItemContext } from '../../../../ctx'

import { patchStreamState } from '../../helpers'

import './style.scss'

const _colors = [
    '000000',
    'ffffff',
    '3b82f6',
    '1da750',
    'eec137',
    '059bb4',
    'ec4899',
    '6366f1',
    '119c8d',
    'f97316',
    'ff3d32'
]

const StreamPanel = () => {
    const ctx = useContext(ItemContext)
    const { entity, setEntity } = ctx

    const [onAir, setOnAir] = useState(entity && entity.stream && entity.stream.onAir)
    const [colors, setColors] = useState(entity && entity.stream && entity.stream.colors ? entity.stream.colors : {home: {primary: '000000', secondary: '000000'}, away: {primary: '000000', secondary: '000000'}})
    const [activeWidget, setActiveWidget] = useState(null)

    useEffect(() => {
        const current = entity && entity.stream ? {...entity.stream} : {}
        const body = {...current, onAir: onAir}
        patchStreamState(entity._id, body)
        setEntity({...entity, stream: body})
    }, [onAir])

    useEffect(() => {
        const current = entity && entity.stream ? {...entity.stream} : {}
        const body = {...current, colors: colors}
        patchStreamState(entity._id, body)
        setEntity({...entity, stream: body})
    }, [colors])

    useEffect(() => {
        if(activeWidget) {
            const current = entity && entity.stream ? {...entity.stream} : {}
            const body = {...current, widget: activeWidget}
            patchStreamState(entity._id, body)
            setEntity({...entity, stream: body})

            setTimeout(() => {
                patchStreamState(entity._id, {...body, widget: null})
                setEntity({...entity, stream: {...body, widget: null}})
                setActiveWidget(null)
            }, 5000)
        }
    }, [activeWidget])

    return  <div className='stream-panel panel'>
                <div className='panel-icon'>
                    <img src={require('../assets/kick-off.png')} />
                </div>
                <div className='panel-title'>Управление стримом</div>

                <div className='stream-form'>
                    <div className='switch-control' onClick={() => setOnAir(!onAir)}>
                        <InputSwitch checked={onAir} onChange={() => setOnAir(!onAir)} />
                        <label>Транслировать данные в стрим</label>
                    </div>

                    <div className='stream-form-section'>
                        <div className='stream-form-section-label' style={{marginBottom: '1rem'}}>Индикаторы цветов команд</div>
                        <div className='stream-form-section_half'>
                            <div className='stream-form-section-label'>{entity.match.home.name}</div>
                            <div className='p-inputgroup'>
                                <span className='p-inputgroup-addon'>верх</span>
                                <Dropdown
                                    options={_colors}
                                    value={colors.home.primary}
                                    onChange={e => setColors({...colors, home: {...colors.home, primary: e.value}})}
                                    itemTemplate={item => (<div className='color-dd-item' style={{background: `#${item}`}}></div>)}
                                    valueTemplate={item => (<div className='color-dd-item' style={{background: `#${item}`}}></div>)}
                                />
                                <span className='p-inputgroup-addon'>низ</span>
                                <Dropdown
                                    options={_colors}
                                    value={colors.home.secondary}
                                    onChange={e => setColors({...colors, home: {...colors.home, secondary: e.value}})}
                                    itemTemplate={item => (<div className='color-dd-item' style={{background: `#${item}`}}></div>)}
                                    valueTemplate={item => (<div className='color-dd-item' style={{background: `#${item}`}}></div>)}
                                />
                            </div>
                        </div>

                        <div className='stream-form-section_half'>
                            <div className='stream-form-section-label'>{entity.match.away.name}</div>
                            <div className='p-inputgroup'>
                                <span className='p-inputgroup-addon'>верх</span>
                                <Dropdown
                                    options={_colors}
                                    value={colors.away.primary}
                                    onChange={e => setColors({...colors, away: {...colors.away, primary: e.value}})}
                                    itemTemplate={item => (<div className='color-dd-item' style={{background: `#${item}`}}></div>)}
                                    valueTemplate={item => (<div className='color-dd-item' style={{background: `#${item}`}}></div>)}
                                />
                                <span className='p-inputgroup-addon'>низ</span>
                                <Dropdown
                                    options={_colors}
                                    value={colors.away.secondary}
                                    onChange={e => setColors({...colors, away: {...colors.away, secondary: e.value}})}
                                    itemTemplate={item => (<div className='color-dd-item' style={{background: `#${item}`}}></div>)}
                                    valueTemplate={item => (<div className='color-dd-item' style={{background: `#${item}`}}></div>)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className='stream-form-section'>
                        <div className='stream-form-section-label' style={{marginBottom: '1rem'}}>Показать виджеты:</div>
                        <div className='widgets-trigers'>
                            <Button className='p-button-sm' label={`Стартовый состав ${entity.match.home.name}`} onClick={() => setActiveWidget('roster_home')} loading={activeWidget} />
                            <Button className='p-button-sm' label={`Стартовый состав ${entity.match.away.name}`} onClick={() => setActiveWidget('roster_away')} loading={activeWidget} />
                            <Button className='p-button-sm' label={`LIVE-таблица`} onClick={() => setActiveWidget(`standings_${entity.match.stageId}`)} loading={activeWidget} />
                        </div>
                    </div>
                </div>
            </div>
}

export default StreamPanel
