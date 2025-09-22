import React, {useEffect, useRef, useState} from 'react'

import {Button} from 'primereact/button'
import {confirmDialog} from 'primereact/confirmdialog'
import {Message} from 'primereact/message'

import Matchday from './Matchday'
import service from '../../service'
import CustomScrollbars from 'react-custom-scrollbars-2'

const generateEmptyRoundMds = ({ stageId, playoffgridId, teams, dayName }) => {
    const teamsCount = teams.length;
    const matchesCount = Math.floor((teamsCount * 10 / 2)/10);

    const md = {
        name: dayName,
        stageId: stageId,
        playoffgridId: playoffgridId,
        type: 'round',
        matches: []
    }
    for (let j=0; j < matchesCount; j++) {
        const newmatch = {
            home: null,
            away: null,
            homeId: null,
            awayId: null,
        }
        md.matches.push(newmatch)
    }

    return md
}

const reverseRoundMds = (md) => {
    return md.map(m => {
        return {
            away: m.home,
            awayId: m.homeId,
            home: m.away,
            homeId: m.awayId,
        }
    })
}

const GridPlayoff = ({grid, stage, updateData, teams, idx, toast }) => {
    const [form, setForm] = useState({...grid})

    const [roundMday, setRoundMday] = useState(null)
    const [type, setType] = useState(roundMday && roundMday._id ? 'fromDB' : 'manual' )

    const [suggest, setSuggest] = useState(null)

    const [loading, setLoading] = useState(false)
    const [unassigned, setUnassigned] = useState([])

    const [refFlag, setRefFlag] = useState(false)

    const matchdayRef = useRef()

    const [flagReverseMatches, setFlagReverseMatches] = useState(false)

    useEffect(() => {
        const md = grid && grid.matchdays && grid.matchdays.length ? {...grid.matchdays[0], name: grid.name} : generateEmptyRoundMds({
            stageId: stage._id,
            playoffgridId: grid._id,
            teams: teams,
            dayName: grid.name || '',
        });

        const merged = mergemdWithEmpty(md)
        setForm({...grid})
        const mdFromBDCount = merged.matches.filter(m => m.homeId && m.awayId)
        if (grid.roundsQty > 1 && mdFromBDCount.length === (teams.length * 10 / 2)/10) {
            merged.matches = merged.matches.concat(reverseRoundMds(merged.matches))
            setForm({...form, matchdays: [merged]})
            // updMatchDay(merged)
        } else if (grid.roundsQty === 1 && mdFromBDCount.length > (teams.length * 10 / 2)/10) {
            merged.matches = merged.matches.slice(0, (teams.length * 10 / 2) / 10)
            setForm({...form, matchdays: [merged]})
        }
        setRoundMday(merged)
        setTimeout(() => {
            setRefFlag(true)
        }, 300)
    }, [grid])

    useEffect(() => {
        setFlagReverseMatches(form && grid && form.matchdays && grid.matchdays && form.matchdays.length && grid.matchdays.length && form.matchdays[0].matches.length < grid.matchdays[0].matches.length)
    }, [form])

    const mergemdWithEmpty = md => {
        const merged = {...md}
        const msteams = md.matches && md.matches.length ? md.matches.reduce((acc, m) => {
            if (m.homeId && !acc[m.homeId]) {
                acc[m.homeId] = m.home
            }
            if (m.awayId && !acc[m.awayId]) {
                acc[m.awayId] = m.away
            }
            return acc
        }, {}) : {}
        const uns = teams.filter(t => !msteams[t._id]);
        if (uns.length) {
            const matchesCount = Math.floor((uns.length * 10 / 2)/10);
            const emptymatches = md.matches.filter(m => !m.home || !m.awayId).length;

            if (emptymatches < matchesCount) {
                const mdd = generateEmptyRoundMds({
                    stageId: stage._id,
                    playoffgridId: grid._id,
                    teams: uns,
                    dayName: grid.name || '',
                })

                merged.matches = [...md.matches, ...mdd.matches.slice(0, matchesCount-emptymatches)]
            }
            setUnassigned(uns.map(t => t.name) )
            setType('manual')
        } else {
            setUnassigned([])
            setType(md._id ? 'fromDB' : 'manual')
        }

        return merged
    }

    const hasChanges = () => {
        if (form.name !== grid.name) {
            return true
        }

        return false
    }

    const isValid = (item) => {
        if (!item.matches || !item.matches.length || !item.matches.find(m => m.home && m.away) ) {
            return false
        }
        if (item.matches.find(m => (m.home && !m.away) || (!m.home && m.away))) {
            return false
        }
        if (!item.matches.find(m => !m._id)) {
            return false
        }

        return true
    }

    const manualMdsFilled = (teams, fromDbMd) => {
        const filledEmpty = generateEmptyRoundMds(stage._id, grid._id, teams, fromDbMd.name);
        const resmd = {...fromDbMd, matches: []};

        const matchesCount = Math.floor((teams.length * 10 / 2)/10);

        if (fromDbMd && fromDbMd.matches) {
            if (fromDbMd.matches.length < matchesCount) {
                resmd.matches.push(...fromDbMd.matches, ...filledEmpty.matches.slice(0, matchesCount - fromDbMd.matches.length));
            } else {
                resmd.matches.push(...fromDbMd.matches);
            }
        }
        return resmd;
    }

    const updMatchDay = (md) => {
        setRoundMday({...md, name: roundMday ? roundMday.name : ''})

        const upd = {...form, matchdays: [md]}
        setForm(upd)
        updateData(upd, form._id)
        // applyGridDraft(upd).then()
    }

    const updMatchDayAndApply = (md) => {
        updMatchDay(md)
        applyGridDraft().then()
    }

    const applyGridDraft = async (upd = false) => {
        setLoading(true)
        const res = await service.applyCalendarGridDraft(upd ? upd : form, toast)
        setLoading(false)
        if (res && res.success && res.changedPlayoffgrid) {
            const mergedmd = mergemdWithEmpty(res.changedPlayoffgrid.matchdays[0])
            setRoundMday(mergedmd)
            setForm({...res.changedPlayoffgrid, matchdays: [mergedmd]})
            updateData({...res.changedPlayoffgrid, matchdays: [mergedmd]}, form._id)

        }
    }

    const deleteSecondRoundMatches = async () => {
        setLoading(true)
        const mdsCount = (teams.length * 10 / 2)/10 * grid.roundsQty
        const newMds = grid.matchdays[0].matches.map((md, indx) => {
            if (indx < mdsCount) {
                md = {
                    homeId: md.homeId,
                    awayId: md.awayId,
                    matchdayId: md.matchdayId || null,
                    _id: md._id || null
                }
                return md
            }
            else {
                md = {
                    homeId: null,
                    awayId: null,
                    matchdayId: md.matchdayId || null,
                    _id: md._id || null
                }
                return md
            }
        })
        form.matchdays[0].matches = newMds
        const res = await service.applyCalendarGridDraft(form, toast)
        setLoading(false)
        if (res && res.success && res.changedPlayoffgrid) {
            const mergedmd = mergemdWithEmpty(res.changedPlayoffgrid.matchdays[0])
            setRoundMday(mergedmd)
            setForm({...res.changedPlayoffgrid, matchdays: [mergedmd]})
            updateData({...res.changedPlayoffgrid, matchdays: [mergedmd]}, form._id)

        }
    }

    const clearDraft = () => {
        const data = generateEmptyRoundMds({
            stageId: stage._id,
            playoffgridId: form._id,
            teams: teams,
            dayName: form.name || '',
        });

        if (data) {
            setRoundMday(data)
        }
    }

    const valid = roundMday ? isValid(roundMday) : false

    return  roundMday ? (
        <div className='gridplayoff' ref={matchdayRef}>
            {unassigned.length ? (
                <Message severity="warn" text={`Не распределены команды: ${unassigned.join(', ')}`} />
            ) : null}

            <CustomScrollbars className='matchdays-scroll' autoHide autoHeight autoHeightMin={100} autoHeightMax={matchdayRef && matchdayRef.current ? (matchdayRef.current.getBoundingClientRect().height + 15) : 300}>
                <Matchday
                    day={roundMday}
                    type={type}
                    teams={teams}
                    toast={toast}
                    isGridMD={true}
                    updMatchDay={updMatchDay}
                    updMatchDayAndApply={updMatchDayAndApply}
                    lockedName={true}
                />
            </CustomScrollbars>

            {type === '' ? null : <div className='actions regular'>

                <div className='options'>
                    <Button
                        className='p-button p-button-sm btn-create'
                        icon='pi pi-check'
                        label='Сохранить'
                        disabled={(loading || !valid) && !flagReverseMatches}
                        onClick={() => confirmDialog({
                            message: 'Применить календарь?',
                            header: 'Подтвердите выбор',
                            icon: 'pi pi-check',
                            position: 'top',
                            acceptLabel: 'Да, применить',
                            rejectLabel: 'Изменить',
                            accept: async () => {
                                const apply = !flagReverseMatches ? await applyGridDraft() : await deleteSecondRoundMatches()
                                return
                            }
                        })}
                    />
                    <Button
                        className='p-button-sm p-button-secondary refresh'
                        icon='pi pi-sync'
                        label='Сбросить'
                        disabled={loading || !roundMday.matches.find(m => m.homeId && m.awayId ) || !valid}
                        onClick={() => confirmDialog({
                            message: 'Сбросить матчи?',
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
            </div>}
        </div>
    ) : (
        <p>Стадия не найдена</p>
    )
}

export default GridPlayoff
