import React, { useState, useEffect, useRef } from 'react'

import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { AutoComplete } from 'primereact/autocomplete'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import { Tag } from 'primereact/tag'
import { OverlayPanel } from 'primereact/overlaypanel';
import CustomScrollbars from 'react-custom-scrollbars-2'

import service from '../../service'
import utils from '../utils'
import {Dropdown} from "primereact/dropdown";

const indexesChar = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

const Groups = ({ data, teams, toast, updateStage }) => {
    const [suggest, setSuggest] = useState(null)
    const [initial, setInitial] = useState(data && data.initial ? utils.mapperInitial(data.initial, teams) : null)

    const groupSelectNames = ['Группа A', 'Группа 1']

    const [selectedValue, setSelectedValue] = useState(data?.groups ? !isNaN(data?.groups[0]?.name[data?.groups[0]?.name?.length - 1]) ? 'number' : 'char' : 'char')

    useEffect(() => {
        setInitial(data && data.initial ? utils.mapperInitial(data.initial, teams) : null);
    },[data])

    const op = useRef(null);
    const listRef = useRef()

    const createGroup = async () => {
        const last = data.groups ? data.groups[data.groups.length - 1] : null
        const idx = last ? selectedValue === 'char' ? indexesChar[indexesChar.findIndex(i => i === last.name[last.name.length - 1]) + 1] : data.groups.length + 1 : 'A'
        if(idx) {
            const created = await service.createGroup(data._id, 'Группа '+idx, toast)
            updateStage({...data, groups: data.groups ? data.groups.concat([created]) : [created]})
        }
    }

    const searchTeam = evt => {
        const assigned = data.groups.reduce((acc, g) => {
            acc = acc.concat(g.teams.map(t => t._id))
            return acc
        }, [])

        const filtered = teams
                            .filter(t => !assigned.includes(t._id))
                            .filter(t => evt.query.length ? t.name.toLowerCase().includes(evt.query.toLowerCase()) : t.name)

        setSuggest(filtered)
    }

    const renameGroups = async (value) => {
        setSelectedValue(value === 'Группа A' ? 'char' : 'number')
        const renamed = data?.groups?.map((g, i) => ({...g, name: 'Группа '+ (value === 'Группа A' ? indexesChar[i] : i + 1)}))
        updateStage({...data, groups: renamed})

        for(let ro of renamed) {
            await service.renameGroup(ro._id, ro.name)
        }
    }

    const removeGroup = async (idx, _id) => {
        const filtered = data.groups.filter((g, i) => i !== idx)
        const reordered = filtered.map((g, i) => ({...g, name: 'Группа '+ (selectedValue === 'char' ? indexesChar[i] : i + 1)}))
        await service.removeGroup(_id, toast)

        updateStage({...data, groups: reordered})

        for(let ro of reordered) {
            await service.renameGroup(ro._id, ro.name)
        }
    }

    const checkUnassigned = () => {
        const assigned = data.groups ? data.groups.reduce((acc, g) => {
            acc = acc.concat(g.teams.map(t => t._id))
            //console.log(g.teams.map(t => t._id))
            return acc
        }, []) : []

        return teams
                    .filter(t => !assigned.includes(t._id))
                    .map(t => t.name)
    }

    const setTeams = async (idx, gid, value) => {
        const mapped = value.map(t => ({_id: t._id}))
        updateStage({...data, teams: data.groups.map((g, i) => i === idx ? {...g, teams: mapped} : g).map(gr => gr.teams.map(t => t)).flat(), groups: data.groups.map((g, i) => i === idx ? {...g, teams: mapped} : g)})
        await service.updateGroupTeams(gid, mapped, toast)
        await service.updateStage(data._id, {teams: data.groups.map((g, i) => i === idx ? {...g, teams: mapped} : g).map(gr => gr.teams.map(t => t)).flat()}, toast)
    }

    const unassigned = checkUnassigned()

    const assignTeams = arr => {
        return arr.map(t => {
            return teams.find(_t => _t._id === t._id)
        })
    }

    const setRounds = async val => {
        await service.updateStage(data._id, {roundsQty: val}, toast)
        updateStage({...data, roundsQty: val})
    }

    const sendInitial = async (sendNULL) => {
        //console.log('title',  title);
        const init = sendNULL ? null : utils.teamsToInitial(initial);
        console.log('init', init, sendNULL, initial);

        if (op && op.current) {
            op.current.hide();
        }
        if (init || data.initial) {
            await service.updateStage(data._id, {initial: init}, toast)
            updateStage({...data, initial: init})
        }
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
                    <CustomScrollbars  autoHide autoHeight autoHeightMin={60} autoHeightMax={700}>
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

    return  <div className='struct-card' ref={listRef}>
                <Tag className='group-title'>{data.title || 'Групповой этап'}</Tag>

                <p className='p-inputgroup'>
                    <span className='p-inputgroup-addon'>Количество кругов</span>
                    <InputNumber
                        inputId='roundsQty'
                        value={data.roundsQty}
                        onValueChange={(e) => setRounds(e.value)}
                        showButtons
                        buttonLayout="stacked"
                        step={1}
                        min={1}
                        max={6}
                        size={1}
                    />
                </p>

                <div className='groups-list'>
                    {unassigned.length ? (
                        <Message severity="warn" text={`Не распределены команды: ${unassigned.join(', ')}`} />
                    ) : null}

                    <CustomScrollbars className='matchdays-scroll' autoHide autoHeight autoHeightMin='calc(100vh - 500px)' autoHeightMax={listRef && listRef.current ? (listRef.current.getBoundingClientRect().height - 270) : 300}>
                        {data.groups ? data.groups.map((g, i) => (
                            <div className="p-inputgroup" key={i}>
                                {i === 0 ? <Dropdown
                                        value={g.name}
                                        options={groupSelectNames}
                                        onChange={(e) => renameGroups(e.target.value)}
                                        disabled={data.matchdays?.length > 0}
                                    />
                                    : <Button label={g.name} disabled className='group-name' />
                                }
                                <AutoComplete
                                    multiple
                                    value={assignTeams(g.teams)}
                                    suggestions={suggest}
                                    completeMethod={searchTeam}
                                    field='name'
                                    onChange={e => {
                                        setTeams(i, g._id, e.value)
                                    }}
                                />
                                {!g.teams.length ? <Button icon='pi pi-times' onClick={() => removeGroup(i, g._id)} /> : null}
                            </div>
                        )) : null}
                    </CustomScrollbars>
                </div>

                <div className='action'>
                    <Button
                        className='p-button-outlined p-button-rounded p-button-sm'
                        icon='pi pi-plus'
                        label='Добавить группу'
                        onClick={() => createGroup()}
                    />
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

export default Groups
