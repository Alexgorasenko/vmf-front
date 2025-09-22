import React, { useState, useEffect, useRef } from 'react'

import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { AutoComplete } from 'primereact/autocomplete'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import { Tag } from 'primereact/tag'
import { Dropdown } from 'primereact/dropdown';

import { OverlayPanel } from 'primereact/overlaypanel';
import CustomScrollbars from 'react-custom-scrollbars-2'

import service from '../../service'
//import utils from '../utils'

const types = [
    {id: 'round', label: ' В круг'},
    {id: 'playoff', label: 'На вылет'},
]

const PlayoffGrids = ({ data, teams, toast, updateStage, setSharedGrid }) => {
    const initGrid = {
        name: 'Безымянный раунд',
        type: 'playoff',
        teams: [],
        roundsQty: 1,
        _id: 'newGrid',
        playoffId: data._id
    }

    const getTypeGrids = grids => {
        let type = null;

        const isAllGridRound = grids.length ? !grids.find(gr => gr.type === 'playoff') : null;
        if (isAllGridRound) {
            type = 'isAllGridRound'
        } else {
            const isAllGridPlayoff = grids.length ? !grids.find(gr => gr.type === 'round') : null;
            if (isAllGridRound) {
                type = 'isAllGridRound'
            } else {
                type = 'gridsMixed'
            }

        }
        return type
    }

    const [grids, setGrids] = useState(data.playoffgrids || [{...initGrid}])
    const [typeGrids, setTypeGrids] = useState(getTypeGrids(grids))
    const [selectedGrid, setSelectedGrid] = useState(data.playoffgrids && data.playoffgrids ? data.playoffgrids[data.playoffgrids.length-1]  : null)

    const [stageUnassigns, setStageUnassigns] = useState(null)

    useEffect(() => {
        if(grids.length) {
            setSelectedGrid(grids[grids.length - 1])
        }
    }, [grids.length])

    useEffect(() => {
        setSharedGrid(selectedGrid)
    }, [selectedGrid])

    useEffect(() => {
        const stageGrids = data.playoffgrids || [];
        //console.log('isAllGridRound', isAllGridRound, stageGrids);
        const type = getTypeGrids(stageGrids)
        const updSelected = selectedGrid && stageGrids.length ? stageGrids.find(g => g._id === selectedGrid._id) : null;

        if (type === 'isAllGridRound') {
            const gridTeamsObj = stageGrids.reduce((acc, g) => {
                if (g.teams && g.teams.length) {
                    for (let t of g.teams) {
                        if (t._id && !acc[t._id]) {
                            acc[t._id] = { _id: t._id }
                        }
                    }
                }
                return acc
            }, {})

            const unassign = teams.filter(t => !gridTeamsObj[t._id]);
            setStageUnassigns(unassign)
        } else {
            setStageUnassigns(null)
        }

        setGrids(stageGrids)
        setTypeGrids(type)
        setSelectedGrid(updSelected || null)

    }, [data])

    const newGrid = grids ? grids.find(g => !g._id || g._id === 'newGrid') : null

    const createGrid = async () => {

        if(!newGrid) {
            const added = [...grids, {...initGrid}];
            const type = getTypeGrids(added)
            setGrids(added)
            setTypeGrids(type)
            setSelectedGrid(initGrid)
        }
    }

    const removeGrid = async (form) => {
        const filtered = data.playoffgrids.filter((g, i) => g._id !== form._id)
        await service.removeGroup(form._id, toast, 'playoffgrids')

        updateStage({...data, playoffgrids: filtered})
    }

    const updateData = async (grid, oldid) => {

        const mapd = grids.map((g, i) => g._id === oldid ? grid : g)
        setGrids(mapd)
        const type = getTypeGrids(mapd)
        setTypeGrids(type)
        const upd = {playoffgrids: data.playoffgrids ? mapd : [{...grid}]};

        const gridsteamsObj = mapd.reduce((acc, g) => {
            if (g.teams && g.teams.length) {
                for (let t of g.teams) {
                    if (t._id && !acc[t._id]) {
                        acc[t._id] = { _id: t._id }
                    }
                }
            }
            return acc
        }, {})

        const stageteams = Object.values(gridsteamsObj);

        if (stageteams.length && (!data.teams || !data.teams.length || stageteams.length !== data.teams.length)) {
            upd.teams = stageteams
            await service.patchData(data._id, 'stages', {teams: stageteams.map(t => ({_id: t._id}))}, toast)
        }
        updateStage({...data, ...upd})
    }
    const selectedIndex = selectedGrid ? grids.find(gr => gr._id === selectedGrid._id) : -1
    return  <div className='struct-card playoffView'>
                <Tag className='group-title'>Раунды стадии</Tag>
                {grids && grids.length ? (
                    <div className='plf-dd-wrap'>
                        <Dropdown
                            options={grids}
                            optionLabel='internalName'
                            value={selectedGrid}
                            onChange={e => {
                                setSelectedGrid(e.value)
                            }}
                            placeholder='-- выберите раунд'
                            optionLabel="name"
                        />
                    </div>
                ) : null}

                {selectedGrid ? (
                    <GridData
                        grid={selectedGrid}
                        teams={typeGrids === 'isAllGridPlayoff' ? selectedIndex > 0 ? grids[selectedIndex-1].teams : teams : teams}
                        stageUnassigns={stageUnassigns}
                        typeGrids={typeGrids}
                        toast={toast}
                        updateData={updateData}
                        removeGrid={removeGrid}
                        setSelectedGrid={setSelectedGrid}
                    />
                ) : null}

                {newGrid ? null : (
                    <div className='action'>
                        <Button
                            className='p-button-outlined p-button-rounded p-button-sm'
                            icon='pi pi-plus'
                            label='Добавить раунд'
                            onClick={() => createGrid()}
                        />
                    </div>
                )}
            </div>
}

const GridData = ({ grid, teams, idx, toast, updateData, removeGrid, stageUnassigns, typeGrids, setSelectedGrid }) => {
    const [form, setForm] = useState({...grid})
    const [suggest, setSuggest] = useState(null)
    const op = useRef(null);
    const listRef = useRef()


    useEffect(() => {
        if (grid) {
            setForm({...grid})
        }
    }, [grid])

    const changeType = async (type) => {
        setForm({...form, type: type});

        if (form._id && form._id !== 'newGrid' && type !== grid.type) {
            const doc = await service.patchData(form._id, 'playoffgrids', {type: type}, toast);
            if (doc && doc.success) {
                updateData({...form, type: type}, form._id)
            }
        }
    }

    const searchTeam = (evt) => {
        const checkedTeams = typeGrids === 'isAllGridRound' ? [...stageUnassigns] : teams.filter(t => !form.teams.map(gt => gt._id).includes(t._id))
        const filtered = checkedTeams
                            .filter(t => evt.query.length ? t.name.toLowerCase().includes(evt.query.toLowerCase()) : t.name)

        setSuggest(filtered)
    }

    const hasChanges = () => {
        if (form.name !== grid.name) {
            return true
        }
        if (form.type !== grid.type) {
            return true
        }
        if (form.teams.length && !grid.teams.length) {
            return true
        }
        if (form.teams.length !== grid.teams.length) {
            return true
        }
        const mapd = form.teams.map(t => t._id);

        for (let team of form.teams) {
            if (!mapd.includes(team._id)) {
                return true
            }
        }
        return false
    }

    const checkUnassigned = () => {
        return typeGrids === 'isAllGridRound' ? (stageUnassigns || []) : teams
                    .filter(t => !form.teams.map(gt => gt._id).includes(t._id))
    }

    const setTeams = async (value) => {
        const mapped = value.map(t => ({_id: t._id}))
        setForm({...form, teams: mapped})

        if (form._id && form._id !== 'newGrid') {
            await service.patchData(form._id, 'playoffgrids', {teams: mapped}, toast)
            updateData({...form, teams: mapped}, form._id)
        }
    }

    const assignTeams = arr => {
        return arr.length ? arr.map(t => {
            return teams.find(_t => _t._id === t._id)
        }) : []
    }

    const setRounds = async (val) => {
        if (form._id && form._id !== 'newGrid') {
            await service.updateGrid(form._id, {roundsQty: val}, toast)
            updateData({...form, roundsQty: val}, form._id)
        }
        setForm({...form, roundsQty: val})
    }

    const postGrid = async () => {
        const upd = await service.postGrid(form, toast)
        const updated = {...form, ...upd}
        updateData(updated, form._id)
        setForm(updated)
        setSelectedGrid(updated)
    }

    const unassigned = checkUnassigned(grid)
    const isChanged = hasChanges();

    return  <div className='grid-card'>
                <span className='filter_btns' style={{marginTop: '1.5rem'}}>
                    <span
                    onClick={async () => await changeType('playoff')}
                    className={form.type === 'playoff' ? 'filter active' : 'filter'}>На вылет</span>
                    <span
                    onClick={async () => await changeType('round')}
                    className={form.type === 'round' ? 'filter active' : 'filter'}>В круг</span>
                </span>

                <div className="p-inputgroup" style={{marginBottom: '.75rem'}}>
                    <span className='p-inputgroup-addon'>Название раунда</span>
                    <InputText
                        value={form.name}
                        onChange={(e) => setForm({...form, name: e.target.value})}
                        placeholder='напр: 1/4 финала'
                        onBlur={async e => {
                            if (form._id && form._id !== 'newGrid' && e.target.value) {
                                const {_id, ...team} = form;
                                const doc = await service.patchData(_id, 'playoffgrids', {name: e.target.value}, toast);
                                if (doc && doc.success) {
                                    updateData({...form, name: e.target.value}, form._id)
                                }
                            }
                        }}
                    />

                    {(form._id && form._id !== 'newGrid' && (!form.matchdays || !form.matchdays.length)) ? (
                        <Button className='p-button-sm btn-delete' icon='pi pi-times' label='удалить раунд' onClick={() => removeGrid(form)} />
                    ) : null}
                </div>

                <p className='p-inputgroup' style={{marginTop: 0}}>
                    <span className='p-inputgroup-addon'>{form.type === 'round' ? 'Количество кругов' : 'Количество матчей в паре'}</span>
                    <InputNumber
                        inputId='roundsQty'
                        value={form.roundsQty}
                        onValueChange={(e) => setRounds(e.value)}
                        showButtons
                        step={1}
                        min={1}
                        max={3}
                        size={1}
                        incrementButtonClassName={grid && grid.roundsQty && grid.roundsQty === 3 ? 'disabled-btn' : null}
                        decrementButtonClassName={grid && grid.roundsQty && grid.roundsQty === 1 ? 'disabled-btn' : null}
                    />
                </p>

                <div className='grid-data' ref={listRef}>
                    <CustomScrollbars className='matchdays-scroll' autoHide autoHeight autoHeightMin={100} autoHeightMax={listRef && listRef.current ? (listRef.current.getBoundingClientRect().height - 40) : 300}>
                        {unassigned.length ? [
                            <Message severity="warn" text={`Не распределены команды: ${unassigned.map(t => t.name).join(', ')}`} />,
                            <div className='action-grid'>
                                <Button
                                    className='p-button-outlined p-button-rounded p-button-sm addbtn'
                                    icon='pi pi-plus'
                                    label='Добавить все'
                                    disabled={!unassigned.length}
                                    onClick={() => setTeams([...form.teams, ...unassigned])}
                                />
                            </div>
                        ] : null}

                        <div className="p-inputgroup">
                            <Button label={'Команды'} disabled className='group-name' />
                            <AutoComplete
                                multiple
                                value={assignTeams(form.teams)}
                                suggestions={suggest}
                                completeMethod={searchTeam}
                                field='name'
                                onChange={e => {
                                    setTeams(e.value)
                                }}
                            />
                        </div>
                    </CustomScrollbars>
                </div>
                {!form._id || form._id.includes('new') ? <div className='save-grid'>
                    <Button
                        className='p-button-outlined p-button-sm btn-save'
                        icon='pi pi-check'
                        label='Сохранить раунд'
                        disabled={!form.name || !form.teams.length || form.teams.length < 2 || !isChanged}
                        onClick={() => postGrid()}
                    />
                </div> : null}
            </div>
}

export default PlayoffGrids
