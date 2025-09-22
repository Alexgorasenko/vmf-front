import React, { useState, useEffect, useRef } from 'react'

import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { AutoComplete } from 'primereact/autocomplete'
import { Chips } from 'primereact/chips'

import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import { Tag } from 'primereact/tag'
import { OverlayPanel } from 'primereact/overlaypanel';
import CustomScrollbars from 'react-custom-scrollbars-2'

import service from '../../service'
import utils from '../utils'

import { ENDPOINT } from '../../../../env'
import axios from 'axios'

const Plain = ({ data, teams, toast, updateStage }) => {

    //const [rounds, setRounds] = useState(1)
    const [title, setTitle] = useState(data ? data.title : 'Основная стадия')
    const [initial, setInitial] = useState(data && data.initial ? utils.mapperInitial(data.initial, teams) : null)
    const [suggest, setSuggest] = useState(null)
    const [renderingGraphics, setRenderingGraphics] = useState(false)
    //const [suggest, setSuggest] = useState(null)
    useEffect(() => {
        setTitle(data.title || 'Основная стадия');
        setInitial(data && data.initial ? utils.mapperInitial(data.initial, teams) : null);
    },[data])

    const op = useRef(null);
    // if (initial) {
    //     op.current.toggle = true
    // }
    const setRounds = async val => {
        if (data.roundsQty !== val) {
            await service.updateStage(data._id, {roundsQty: val}, toast)
            updateStage({...data, roundsQty: val})
        }
    }

    const sendTitle = async () => {
        await service.updateStage(data._id, {title: title}, toast)
        updateStage({...data, title: title})
    }
    const sendInitial = async (sendNULL) => {
        const init = sendNULL ? null : utils.teamsToInitial(initial);
        if (op && op.current) {
            op.current.hide();
        }
        if (init || data.initial) {
            await service.updateStage(data._id, {initial: init}, toast)
            updateStage({...data, initial: init})
        }
    }

    const searchTeam = (evt, setter) => {
        const assigned = data.teams.map(t => t._id)

        const filtered = teams
                            .filter(t => !assigned.includes(t._id))
                            .filter(t => evt.query.length ? t.name.toLowerCase().includes(evt.query.toLowerCase()) : t.name)

        setter(filtered)
    }

    const setTeams = async (value) => {
        const mapped = value.map(t => ({_id: t._id}))
        updateStage({...data, teams: mapped})
        await service.updateStage(data._id, {teams: mapped}, toast)
    }

    const checkUnassigned = () => {
        const assigned = data && data.teams ? data.teams.map(t => t._id): []

        return teams
                    .filter(t => !assigned.includes(t._id))
                    .map(t => t.name)
    }

    const unassigned = checkUnassigned()


    const assignTeams = arr => {
        return arr.map(t => {
            return teams.find(_t => _t._id === t._id)
        })
    }

    const customInput = (id, e, key='pts') => {
        const mapd = initial.map(init => init.team._id === id ? {...init, [key]: e.target.value} : init)
        setInitial(mapd)
    }

    const updateInitial = (id, value, key='pts') => {
        const mapd = initial.map(init => init.team._id === id ? {...init, [key]: value} : init)
        setInitial(mapd)
    }

    const viewInitial = (initial) => {
        return initial ? (
            <div className='select-teams'>
                <div className='boxes points-offset-panel'>
                    <CustomScrollbars autoHide autoHeight autoHeightMin={60} autoHeightMax={700}>
                    {initial.map(item => (
                        <div key={item._id || item.team._id}>
                            <p className='p-inputgroup'>
                                <span className='p-inputgroup-addon'>{item.team.name}</span>
                                <InputNumber
                                    inputId={item._id || item.team._id}
                                    value={item.pts || 0}
                                    onValueChange={(e) => updateInitial(item.team._id, e.value, 'pts')}
                                />
                                <span className='p-inputgroup-addon'>очков</span>
                            </p>
                        </div>
                    ))}
                    </CustomScrollbars>
                    <div className='cancel-wrap' style={{display: 'flex', justifyContent: 'space-around'}}>
                        <Button
                            onClick={() => sendInitial()}
                            icon="pi pi-save"
                            className="btn-create p-button-sm p-button-outlined"
                            label='Сохранить'
                            disabled={!initial || !initial.find(t => t.pts)}
                        />
                    </div>
                </div>
            </div>
        ): null
    }

    const renderStandingsGraphics = () => {
        setRenderingGraphics(true)
        const sharableUrl = data.federationId === '624c17e25887f52dbfc6819c' ? `${ENDPOINT}render/ole/standingsv2/${data._id}` : `${ENDPOINT}render/elegance/standingsv2/${data._id}?type=schedule`
        axios.get(`${ENDPOINT}share?url=${encodeURIComponent(sharableUrl)}&asDecoded=true`)
            .then(resp => {
                setRenderingGraphics(false)
                const a = document.createElement("a")
                a.href = "data:image/png;base64," + resp.data
                a.download = `${data.title}_${data._id}.png`
                a.click()
            })
    }

    return  <div className='struct-card'>
                <Tag className='group-title'>{data.title || 'Круговой турнир'}</Tag>

                <Button
                    className='p-button-sm render-btn'
                    label={renderingGraphics ? 'Рендеринг...' : 'Скачать таблицу'}
                    icon='pi pi-image'
                    onClick={() => renderStandingsGraphics()}
                    loading={renderingGraphics}
                />

                <p className='p-inputgroup'>
                    <span className='p-inputgroup-addon'>Название стадии</span>
                    <InputText
                        inputId='title'
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={async (e) => await sendTitle()}
                    />
                </p>

                <p className='p-inputgroup'>
                    <span className='p-inputgroup-addon'>Количество кругов</span>
                    <InputNumber
                        inputId='roundsQty'
                        value={data && data.roundsQty ? data.roundsQty : 1}
                        onValueChange={(e) => setRounds(e.value)}
                        showButtons
                        buttonLayout="stacked"
                        step={1}
                        min={1}
                        max={3}
                        size={1}
                        incrementButtonClassName={data && data.roundsQty && data.roundsQty === 3 ? 'disabled-btn' : null}
                        decrementButtonClassName={data && data.roundsQty && data.roundsQty === 1 ? 'disabled-btn' : null}
                    />
                </p>


                <div className='groups-list'>
                    {unassigned.length ? [
                        <Message severity="warn" text={`Не распределены команды: ${unassigned.join(', ')}`} />,
                        <div className='action-grid'>
                            <Button
                                className='p-button-outlined p-button-sm addbtn p-button-rounded'
                                icon='pi pi-plus'
                                label='добавить все'
                                disabled={!unassigned.length}
                                onClick={() => setTeams(teams)}
                            />
                        </div>
                    ] : null}

                    <div className="p-inputgroup">
                        <Button label={'Команды'} disabled className='group-name' />
                        <AutoComplete
                            multiple
                            value={assignTeams(data.teams)}
                            suggestions={suggest}
                            completeMethod={(e) => searchTeam(e, setSuggest)}
                            field='name'
                            onChange={e => {
                                setTeams(e.value)
                            }}
                        />
                    </div>
                </div>

                <Button
                    onClick={(e) => {
                        if (!initial) {
                            const init = utils.getInitial(teams);
                            setInitial(init)
                        }
                        op.current.toggle(e)
                    }}
                    icon="pi pi-cog"
                    className="p-button-sm btn-default p-button-outlined"
                    label='корректировка очков'
                />
                <OverlayPanel ref={op} dismissable>
                    {viewInitial(initial, op)}
                </OverlayPanel>

            </div>
}

export default Plain
