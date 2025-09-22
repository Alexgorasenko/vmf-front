import React, { useState, useEffect, useRef } from 'react'

import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import Matchday from './Matchday'
import service from '../../service'
import CustomScrollbars from 'react-custom-scrollbars-2'
import teamItem from "../../../PlayersAndCoaches/TeamItem";

const getNumFromName = name => {
    const replaced = name.replace(/\D/g,'');
    if (replaced) {
        return +replaced
    } else {
        return 1
    }
}

const generateEmptyGroupMds = (grid, setFlagNewRound, dayName) => {
    //console.log('generateEmptyGroupMds', grid);
    const mds = [];
    //for (let group of groups) {
        const teamsCount = grid.teams.length;
        const matchesCount = Math.floor((teamsCount * 10 / 2)/10);
        let numberOfRounds = teamsCount % 2 === 0 ? (teamsCount - 1) * grid.roundsQty : teamsCount * grid.roundsQty;
        //console.log(matchesCount, group.teams.length);

        for (let i=0; i < numberOfRounds; i++) {
            const md = {
                name: dayName ? dayName.replace(/\d/g,'_').replace('_', `${i+1}`).replace(/_/g, '') : `${i+1} тур`,
                stageId: grid.playoffId,
                playoffgridId: grid._id,
                type: 'plain',
                matches: []
            }
            for (let j=0; j < matchesCount; j++) {
                const newmatch = {
                    home: null,
                    away: null,
                    homeId: null,
                    awayId: null,
                    // groupId: group._id,
                    // groupName: group.name,
                }
                md.matches.push(newmatch)
            }
            mds.push(md)
        }

        const msDBcount = grid.matchdays?.reduce((acc, cur) => {
            acc += cur.matches.filter(cm => cm._id).length
            return acc
        }, 0)
        setFlagNewRound(matchesCount * (numberOfRounds / grid.roundsQty) === msDBcount && grid.roundsQty > 1)

        if (grid && grid.matchdays && grid.matchdays.length) {
            //console.log('gerid', grid);
            if (grid.matchdays.length * grid.roundsQty <= mds.length && grid.roundsQty > 1){
                const mapd = mds.slice(0, numberOfRounds / grid.roundsQty).map((md, ind) => {
                    const patched = {...md}
                    const oldmd = grid.matchdays[ind]

                    if (oldmd && oldmd.matches && oldmd.matches.length) {
                        const mslen = oldmd.matches.length;
                        if (matchesCount > mslen) {
                            oldmd.matches = [...oldmd.matches, ...md.matches.slice(0, matchesCount - mslen)];
                            return oldmd
                        } else {
                            return oldmd
                        }
                    }
                    return patched
                });

                return mapd.sort((a,b) => a.name && b.name ? getNumFromName(a.name) - getNumFromName(b.name) : 0)
            } else {
                const mapd = mds.map((md, ind) => {
                    const patched = {...md}
                    const oldmd = grid.matchdays[ind]

                    if (oldmd && oldmd.matches && oldmd.matches.length) {
                        const mslen = oldmd.matches.length;
                        if (matchesCount > mslen) {
                            oldmd.matches = [...oldmd.matches, ...md.matches.slice(0, matchesCount - mslen)];
                            return oldmd
                        } else {
                            return oldmd
                        }
                    }
                    return patched
                });

                return mapd.sort((a,b) => a.name && b.name ? getNumFromName(a.name) - getNumFromName(b.name) : 0)
            }

        } else {
            if (grid.roundsQty > 1){
                return mds.slice(0, numberOfRounds / grid.roundsQty).sort((a,b) => a.name && b.name ? getNumFromName(a.name) - getNumFromName(b.name) : 0)
            } else return mds.sort((a,b) => a.name && b.name ? getNumFromName(a.name) - getNumFromName(b.name) : 0)
        }
}

const GridRound = ({grid, stage, updateData, teams, idx, toast}) => {
    const [form, setForm] = useState({...grid})

    const [gridmdays, setGroupsMdays] = useState([])
    const [loading, setLoading] = useState(false)
    const [type, setType] = useState(stage.fillType || 'auto')

    const listRef = useRef()

    const [flagNewRound, setFlagNewRound] = useState(false)

    const initmd = {
        name: '',
        type: 'round',
        _id: 'newmd',
        stageId: stage._id,
        playoffgridId: grid._id,
        matches: []
    }

    const newmd = gridmdays ? gridmdays.find(g => !g._id || g._id === 'newmd') : null

    useEffect(() => {
        console.log('GRID EFF')
        if (grid) {
            setForm({...grid})
            const mds = generateEmptyGroupMds(grid, setFlagNewRound)
            //console.log('mds', mds);

            setGroupsMdays(mds)
        }
    }, [grid])

    const hasChanges = () => {
        if (form.name !== grid.name) {
            return true
        }

        return false
    }

    const isChanged = hasChanges();

    const updMatchDay = (md, ind) => {
        //console.log('updMatchDay', ind, md);
        const updated = [...gridmdays.slice(0, ind), md, ...gridmdays.slice(ind+1) ].sort((a,b) => a.name && b.name ? getNumFromName(a.name) - getNumFromName(b.name) : 0)
        const upd = {...form, matchdays: updated}
        //console.log('updMatchDay', updated, upd);
        setGroupsMdays(updated)
        setForm(upd)
        //updateData(upd)
        //updateStage({...stage, matchdays: updated})
    }

    const updMatchDayAndApply = (md) => {
        applyGridDraft().then()
    }

    const isValid = () => {
        let valid = false;
        //console.log('isValid', gridmdays);
        for (let item of gridmdays) {
            //console.log('isValid item.matches', item, item.matches.find(m => !m._id));
            /*
            if (!item.matches || !item.matches.length || item.matches.find(m => !m.home || !m.away) ) {
                valid = false
                break;
            }
            if (!item.matches.find(m => !m._id)) {
                valid = false
                break;
            }
            */
            if (item.matches && item.matches.length && item.matches.find(m => !m._id && m.homeId && m.awayId) ) {
                valid = true
                break;
            }
        }
        //console.log('isValid check', valid);
        return valid
    }

    const applyGridDraft = async () => {
        setLoading(true)
        const res = await service.applyCalendarGridDraft(form, toast)
        setLoading(false)
        if (res && res.success && res.changedPlayoffgrid) {
            const merged = generateEmptyGroupMds(res.changedPlayoffgrid, setFlagNewRound)
            const mergedgrid = {...res.changedPlayoffgrid, matchdays: merged}
            setGroupsMdays(merged)
            setForm(mergedgrid)
            updateData(mergedgrid, form._id)
        }
    }

    const clearDraft = async () => {
        const data = gridmdays.map(item => {
            const mapdMs = item.matches.map(m => m._id ? m : {...m, home: null, away: null, homeId: null, awayId: null})

            return {
                ...item,
                matches: mapdMs
            }
        })
        if (data) {
            setGroupsMdays(data)
        }
    }

    const wrongDay = gridmdays && gridmdays.length ? gridmdays.find( item => item && item.matches && item.matches.length && item.matches.find(m => !m.home || !m.away)) : null

    const valid = gridmdays ? isValid() : false

    return gridmdays && gridmdays.length ? (
        [
            flagNewRound ?
                <div className='actions cta'>
                    <div>
                        <Button
                            className={`p-button-sm p-button-secondary ${type === 'auto' ? 'type_auto' : ''}`}
                            icon='pi pi-bolt'
                            label='Добавить круг'
                            onClick={async () => {
                                setLoading(true)
                                const draft = await service.cloneSchedulePlayoffRound(grid._id, toast)

                                if (draft) {
                                    setGroupsMdays(draft)
                                    setFlagNewRound(false)
                                    setForm({...form, matchdays: draft})
                                    await applyGridDraft()
                                }

                                setLoading(false)
                                return
                            }}
                        />
                    </div>
                </div> : null,
            <div className='gridplayoff' ref={listRef}>
            <CustomScrollbars className='matchdays-scroll' autoHide autoHeight autoHeightMin={100} autoHeightMax={listRef && listRef.current ? listRef.current.getBoundingClientRect().height : 300}>
                {gridmdays.map((md,ind) => (
                    <Matchday
                        day={md}
                        key={md._id || `${ind}_md`}
                        ind={ind}
                        type={'manual'}
                        teams={teams}
                        updMatchDay={updMatchDay}
                        updMatchDayAndApply={updMatchDayAndApply}
                        toast={toast}
                        isGridMD={true}
                        groups={stage ? stage.groups : []}
                        lockedName={true}
                    />))}
            </CustomScrollbars>
        </div>,
        type === '' ? null : <div className='actions regular'>
            <div className='options'>
                <Button
                    className='p-button p-button-sm btn-create'
                    icon='pi pi-check'
                    label='Сохранить'
                    disabled={loading || !valid}
                    onClick={() => confirmDialog({
                        message: 'Применить календарь?',
                        header: 'Подтвердите выбор',
                        icon: 'pi pi-check',
                        position: 'top',
                        acceptLabel: 'Да, применить',
                        rejectLabel: 'Изменить',
                        accept: async () => {
                            const apply = await applyGridDraft()
                            return
                        }
                    })}
                />
                <Button
                    className='p-button-sm p-button-secondary refresh'
                    icon='pi pi-sync'
                    label='Очистить'
                    disabled={loading || !gridmdays.find( item => item && item.matches && !!item.matches.find(m => m && m.home && m.away)) || !valid}
                    onClick={() => confirmDialog({
                        message: 'Другой вариант',
                        header: 'Подтвердите выбор',
                        icon: 'pi pi-info-circle',
                        position: 'top',
                        acceptLabel: 'Да, сбросить',
                        rejectLabel: 'Отмена',
                        accept: async () => {
                            const apply = await clearDraft()
                            return
                        }
                    })}
                />
            </div>
        </div>
        ]
    ) : <div>нет данных</div>
}

export default GridRound
