import React, {useEffect, useState} from 'react'

import {Button} from 'primereact/button'
import {Tag} from 'primereact/tag'
import {confirmDialog} from 'primereact/confirmdialog'
import Matchday from './Matchday'
import service from '../../service'
import CustomScrollbars from 'react-custom-scrollbars-2'

const generateEmptyRoundMds = (stageId, teams, dayName, isNeedReverse=false, isReverseMirror=false, roundsQty) => {
    const mds = [];
    const teamsCount = teams.length;
    const matchesCount = Math.floor((teamsCount * 10 / 2)/10);
    let numberOfRounds = (teamsCount % 2 === 0 ? teamsCount - 1 : teamsCount) * (roundsQty || 1);
    //console.log(matchesCount, group.teams.length);
    for (let i=0; i < numberOfRounds; i++) {
        const md = {
            name: dayName ? dayName.replace(/\d/g,'_').replace('_', `${i+1}`).replace(/_/g, '') : `${i+1} тур`,
            stageId: stageId,
            //groupId: groupData._id,
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
        mds.push(md)
    }

    if (isNeedReverse) {
        const secondHalf = mds.map((item, ind) => {
            return {
                ...item,
                name: !isReverseMirror ? `${2*mds.length - ind} тур` : `${mds.length + ind +1} тур`
            }
        })

        if (isReverseMirror) {
            mds.push(...secondHalf.reverse());
        } else {
            mds.push(...secondHalf);
        }
    }
    return mds
}
const getNumFromName = name => {
    const replaced = name.replace(/\D/g,'');
    if (replaced) {
        return +replaced
    } else {
        return 1
    }
}

const Plain = ({teams, stage, toast, updateStage}) => {
    //const [rounds, setRounds] = useState(1)
    //const [stage, setStage] = useState(stages.find(item => item.type === 'round'))
    const [roundMdays, setRoundMdays] = useState(stage ? stage.matchdays : [])
    //const [type, setType] = useState(stage && stage.matchdays && stage.matchdays.length ? 'fromDB' : 'auto' )
    const [type, setType] = useState('' )
    const [loading, setLoading] = useState(false)

    const [needOptions, setNeedOptions] = useState(true)

    const [flagAutoGenerate, setFlagAutoGenerate] = useState(false)

    const [flagSecondRoundMatches, setFlagSecondRoundMatches] = useState(false)

    const [flagNewRound, setFlagNewRound] = useState(false)

    useEffect(() => {
        //const st = stages.find(item => item.type === 'round')
        if (stage) {
            //setStage(st)
            const st = {...stage}
            const mds = st.matchdays || [];
            if (mds.length) {
                const teamsCount = st.teams.length;

                const matchesCount = Math.floor((teamsCount * 10 / 2)/10);

                let mdsCount = teamsCount % 2 === 0 ? (teamsCount - 1) * st.roundsQty : teamsCount * st.roundsQty;

                setFlagSecondRoundMatches(mds.length > mdsCount)

                setFlagAutoGenerate(mds.filter(item => item._id).length === 1 && mds.find(item => item._id)._id === mds[0]._id && mds[0].matches.length === matchesCount && mdsCount/st.roundsQty !== 1)

                const msDBcount = mds.reduce((acc, cur) => {
                    acc += cur.matches.length
                    return acc
                }, 0)
                setFlagNewRound(matchesCount * (mdsCount / st.roundsQty) === msDBcount && st.roundsQty > 1)

//console.log('mds.length', mds.length, 'matchesCount', matchesCount, 'mdsCount', mdsCount, 'mds.filter', mds.filter(md => md._id).length);
                let settedMds = [];
                if (mdsCount === mds.filter(md => md._id).length || (st.roundsQty >= 2 && mdsCount/st.roundsQty <= mds.filter(md => md._id).length)) {
                    //console.log('msDBcount === matchesCount * mdsCount', msDBcount, matchesCount * mdsCount);
                    if (msDBcount === matchesCount * mdsCount || (st.roundsQty === 2 && msDBcount >= matchesCount * mdsCount/st.roundsQty)) {
                        setType('fromDB')
                        //updateStage({...st, fillType: 'fromDB'})
                        settedMds = mds.slice(0, mdsCount)
                    } else {
                        setType('manual')
                        //updateStage({...st, fillType: 'manual'})
                        settedMds = manualMdsFilled(st.teams, mds);
                    }
                } else {
                    if (mds.find(md => md._id || md.matches.find(m => !m.home || !m.away))) {
                        setType('manual')
                        settedMds = manualMdsFilled(st.teams, mds);
                        //updateStage({...st, fillType: 'manual'})
                    } else {
                        //setType('auto')
                        //updateStage({...st, fillType: 'auto'})
                        settedMds= mds;
                    }
                }
                setRoundMdays(settedMds.sort((a,b) => a.name && b.name ? getNumFromName(a.name) - getNumFromName(b.name) : 0))
            }
            //console.log('st', st, type);
            //setStage(st)
        }
    },[stage])

    useEffect(() => {
        if (type === 'manual' && !roundMdays.find(rm => rm._id)) {
            const data = generateEmptyRoundMds(stage._id, stage.teams, '', false, false, stage.roundsQty);
            if (data) {
                setRoundMdays(data)
            }

        } else if (type === 'auto' && !roundMdays.find(rm => rm._id)) {
            async function f() {
                setLoading(true)
                const draft = await service.calendarDraftV2({
                    stageId: stage._id,
                    toast: toast
                })

                if (draft && draft.matchDays) {
                    setRoundMdays(draft.matchDays)
                }
                setLoading(false)
            }

            f().then()
        }
    }, [stage.teams])

    const manualMdsFilled = (teams, fromDBMds) => {
        const filledEmpty = generateEmptyRoundMds(stage._id, teams, fromDBMds[0].name, false, false, stage.roundsQty);
        const mapdFilled = [];
        const matchesCount = Math.floor((teams.length * 10 / 2)/10);

        for (let md of filledEmpty) {
            const curMdMs = [];
            const fromDbMd = fromDBMds.find(item => item.name === md.name);
            if (fromDbMd && fromDbMd.matches) {
                if (fromDbMd.matches.length < matchesCount) {
                    curMdMs.push(...fromDbMd.matches, ...md.matches.slice(0, matchesCount - fromDbMd.matches.length));
                } else {
                    curMdMs.push(...fromDbMd.matches);
                }

                mapdFilled.push({...fromDbMd, matches: curMdMs})
            } else {
                mapdFilled.push(md)
            }
        }
        //console.log('manualMdsFilled', mapdFilled);
        return mapdFilled;
    }


    const updMatchDay = (md, ind) => {
        //console.log('updMatchDay', ind, md);
        const updated = [...roundMdays.slice(0, ind), md, ...roundMdays.slice(ind+1) ].sort((a,b) => a.name && b.name ? getNumFromName(a.name) - getNumFromName(b.name) : 0);

        setRoundMdays(updated)
        updateStage({...stage, matchdays: updated})
    }

    const applyDraft = async (updated, ind=null) => {
        setLoading(true)
        //console.log('applyDraft', type, ind, updated);
        const curmds = updated ? updated : roundMdays;

        if (type === 'manual' || (updated && (ind || ind === 0))) {
            const mapd = curmds
                .filter((md, i) => i === ind && md.matches && md.matches.filter(m => (m.homeId && m.awayId) || m._id).length)
                .map(md => {
                    const ms = md.matches
                        .filter( m => (m.homeId && m.awayId) || m._id)
                        .map(m => ({homeId: m.homeId, awayId: m.awayId, matchId: m._id || null, matchdayId: md._id || null}));
                    return {...md, matches: ms}
                })
                //console.log('applyDraft mapd', mapd);

            if (mapd.length) {
                const res = await service.applyCalendarDraftV2(stage._id, toast, mapd);
                if (res && res.success && res.md) {
                    const updated = [...roundMdays.slice(0, ind), res.md, ...roundMdays.slice(ind+1) ].sort((a,b) => a.name && b.name ? getNumFromName(a.name) - getNumFromName(b.name) : 0)
                    //console.log('updMatchDayAndApply updated', res, updated);
                    setRoundMdays(updated)
                    updateStage({...stage, matchdays: updated})
                }
            } else {
                setLoading(false)
            }
        } else {
            const mapd = curmds.map(md => {
                const ms = md.matches
                    .map(m => ({homeId: m.homeId, awayId: m.awayId, matchId: m._id || null, matchdayId: md._id || null}));
                return {...md, matches: ms}
            })

            const res = await service.applyCalendarDraftV2(stage._id, toast, mapd);

            if (res) {
                //console.log('res', res);
                if (res.success) {
                    const draft = await service.calendarDraftV2({
                        stageId: stage._id,
                        toast: toast,
                        isRandomTeams: 0,
                        fromDB: 1})
                    //console.log('service.calendarDraftV2', draft.matchDays);
                    if (draft && draft.matchDays) {
                        //console.log(draft.matchDays);
                        setRoundMdays(draft.matchDays)
                        updateStage({...stage, matchdays: draft.matchDays})
                    }
                }
            }
        }

        setLoading(false)
        //updateStage({...stage, fillType: 'auto'})
    }

    const updMatchDayAndApply = async (md, ind) => {
        const updated = [...roundMdays.slice(0, ind), md, ...roundMdays.slice(ind+1) ].sort((a,b) => a.name && b.name ? getNumFromName(a.name) - getNumFromName(b.name) : 0)
        //console.log('updMatchDayAndApply updated', updated);
        setRoundMdays(updated)
        //updateStage({...stage, matchdays: updated})
        await applyDraft(updated, ind)
    }

    const clearDraft = async () => {
        if (type === 'manual') {
            //const data = generateEmptyGroupMds(stage.groups, stage.roundsQty > 1 ? true : false, stage.isReverseMirror || false);
            const data = roundMdays.map(item => {
                const mapdMs = item.matches.map(m => m._id ? m : {...m, home: null, away: null, homeId: null, awayId: null})

                return {
                    ...item,
                    matches: mapdMs
                }
            })
            if (data) {
                //console.log('clearDraft', data);
                setRoundMdays(data)
                updateStage({...stage, matchdays: data})
            }
        } else if (type === 'auto') {
            setLoading(true)
            const draft = await service.calendarDraftV2({
                stageId: stage._id,
                toast: toast,
                isRandomTeams: 1
            })
            if (draft && draft.matchDays) {
                //console.log(draft.matchDays);
                setRoundMdays(draft.matchDays)
                updateStage({...stage, matchdays: draft.matchDays})
                setType('fromDB')
            }
            setLoading(false)
        }

    }

    /*const clearDraft = () => {
        const data = generateEmptyRoundMds(stage._id, stage.teams,  stage.roundsQty > 1 ? true : false, stage.isReverseMirror || false);
        if (data) {
            console.log('clearDraft', data);
            setRoundMdays(data)
            updateStage({...stage, matchdays: data})
        }
    }*/

    const cancelDraft = () => {
        setType('')
        setRoundMdays([])
        updateStage({...stage, matchdays: []})
    }
//console.log('type', type);

    const deleteSecondRoundMatches = async () => {
        setLoading(true)
        const st = {...stage}
        const mds = st.matchdays || [];
        const teamsCount = st.teams.length;
        let mdsCount = teamsCount % 2 === 0 ? (teamsCount - 1) * st.roundsQty : teamsCount * st.roundsQty;
        const newMds = mds.map((md, indx) => {
            if (indx < mdsCount) {
                md.matches = md.matches.map(m => ({
                    homeId: m.homeId,
                    awayId: m.awayId,
                    matchId: m._id || null,
                    matchdayId: md._id || null
                }))
                return md
            }
            else {
                md.matches = md.matches.map(m => ({
                    homeId: null,
                    awayId: null,
                    matchId: m._id || null,
                    matchdayId: md._id || null
                }))
                return md
            }
        })
        await service.applyCalendarDraftV2(stage._id, toast, newMds);
        updateStage({...stage, matchdays: roundMdays})
    }

    const updMatchDayWithCopy = (md, md2, ind, ind2) => {
        let updated = [...roundMdays.slice(0, ind), md, ...roundMdays.slice(ind+1)]
        updated = [...updated.slice(0, ind2), md2, ...updated.slice(ind2+1)].sort((a,b) => a.name && b.name ? getNumFromName(a.name) - getNumFromName(b.name) : 0)
        setRoundMdays(updated)
        updateStage({...stage, matchdays: updated})
    }

    const updateName = async (name, day) => {
        const copyDay = roundMdays.find(rmd => rmd.name === name)
        if (copyDay) {
            await service.patchData(copyDay._id, 'matchdays', {name: day.name}, toast);
            await service.patchData(day._id, 'matchdays', {name: name}, toast);
            updMatchDayWithCopy({...copyDay, name: day.name }, {...day, name: name }, roundMdays.indexOf(copyDay), roundMdays.indexOf(day))
        } else {
            await service.patchData(day._id, 'matchdays', {name: name}, toast);
            updMatchDay({...day, name: name }, roundMdays.indexOf(day))
        }
    }

    return roundMdays && roundMdays.length ? (
        <div className='calendar-card fields-group' style={type === 'auto' ? {paddingBottom: 120} : {}}>
            <Tag className='group-title'>Календарь</Tag>

            {flagSecondRoundMatches ? [
                /*<Message severity="warn" text={`Найдены матчи второго круга. Удалить их?`} />,*/
                <div className="buttonset">
                    <Button
                        className='p-button'
                        icon='pi pi-check'
                        label='Применить календарь'
                        disabled={loading}
                        onClick={() => confirmDialog({
                            message: 'Применить календарь',
                            header: 'Подтвердите выбор',
                            icon: 'pi pi-check',
                            position: 'top',
                            acceptLabel: 'Да, применить',
                            rejectLabel: 'Изменить',
                            accept: () => {
                                deleteSecondRoundMatches().then(() => setLoading(false))
                                return
                            }
                        })}
                        loading={loading}
                    />
                    {/*<Button
                        className='p-button-sm p-button-warning'
                        label='Да'
                        disabled={loading}
                        onClick={() => confirmDialog({
                            message: 'Удалить матчи второго круга?',
                            header: 'Подтвердите выбор',
                            icon: 'pi pi-info-circle',
                            position: 'top',
                            acceptLabel: 'Да, удалить',
                            rejectLabel: 'Вернуться к заполнению',
                            accept: () => {
                                deleteSecondRoundMatches().then(() => setLoading(false))
                                return
                            }
                        })}
                        loading={loading}
                    />
                    <Button
                        className='p-button-sm p-button-secondary'
                        label='Добавить второй круг'
                        disabled={loading}
                        onClick={() => confirmDialog({
                            message: 'Добавить второй круг?',
                            header: 'Подтвердите выбор',
                            icon: 'pi pi-info-circle',
                            position: 'top',
                            acceptLabel: 'Да',
                            rejectLabel: 'Вернуться к заполнению',
                            accept: async () => {
                                await service.updateStage(stage._id, {roundsQty: 2}, toast)
                                updateStage({...stage, roundsQty: 2})
                                return
                            }
                        })}
                    />*/}
                </div>
            ] : null}

            {
                (flagAutoGenerate && type !== 'auto') ?
                <div className='actions cta'>
                    <div>
                        <Button
                            className={`p-button-sm p-button-secondary ${type === 'auto' ? 'type_auto' : ''}`}
                            icon='pi pi-bolt'
                            label='Далее сгенерировать автоматически'
                            onClick={async () => {
                                setLoading(true)
                                const draft = await service.getWIPCalendarDraft({
                                    stageId: stage._id,
                                    toast: toast
                                })

                                if (draft && draft.matchDays) {
                                    setRoundMdays(draft.matchDays)
                                }
                                setType('auto')
                                setNeedOptions(false)

                                setLoading(false)
                                return
                            }}
                        />
                    </div>
                </div> : null
            }

            {
                flagNewRound ?
                    <div className='actions cta'>
                        <div>
                            <Button
                                className={`p-button-sm p-button-secondary ${type === 'auto' ? 'type_auto' : ''}`}
                                icon='pi pi-bolt'
                                label='Добавить круг'
                                onClick={async () => {
                                    setLoading(true)
                                    const draft = await service.cloneSchedule(stage._id, toast)

                                    if (draft && draft.matchDays) {
                                        setRoundMdays(draft.matchDays)
                                    }

                                    updateStage({...stage, matchdays: draft.matchDays})
                                    setLoading(false)
                                    return
                                }}
                            />
                        </div>
                    </div> : null
            }

            <CustomScrollbars  autoHide autoHeight autoHeightMin='90%'>
                {roundMdays.map((md,ind) => (
                    <Matchday
                        day={md} key={md._id || `${ind}_md`}
                        ind={ind}
                        type={type}
                        teams={stage ? teams.filter(t => stage.teams.find(st => st._id === t._id) ? t : null) : []}
                        updMatchDay={updMatchDay}
                        groups={stage ? stage.groups : []}
                        updMatchDayAndApply={updMatchDayAndApply}
                        updateName={updateName}
                        mds={stage && stage.teams ? (stage.teams.length % 2 === 0 ? stage.teams.length - 1 : stage.teams.length) * stage.roundsQty : 0}
                    />
                ))}
            </CustomScrollbars>

            {['fromDB', 'manual'].includes(type) ? null : <div className='actions regular'>
                <div>
                    <Button
                        className='p-button'
                        icon='pi pi-check'
                        label='Применить календарь'
                        disabled={loading || !roundMdays.find( item => item && item.matches && item.matches.length && !!item.matches.find(m => m.home && m.away) ) || roundMdays.find( item => item && item.matches && item.matches.find(m => (m.home && !m.away) || (!m.home && m.away)) )}
                        onClick={() => confirmDialog({
                            message: 'Применить календарь',
                            header: 'Подтвердите выбор',
                            icon: 'pi pi-check',
                            position: 'top',
                            acceptLabel: 'Да, применить',
                            rejectLabel: 'Изменить',
                            accept: async () => {
                                // const draft = await service.calendarDraftV2({
                                    // stageId: stage._id,
                                    // toast: toast)
                                // setType('auto')
                                // if (draft && draft.matchDays) {
                                //     console.log(draft.matchDays);
                                //     setGroupsMdays(draft.matchDays)
                                // }
                                const apply = await applyDraft()
                                return
                            }
                        })}
                    />
                </div>
                {
                    needOptions ?
                        <div className='options'>
                    <Button
                        className='p-button-sm p-button-secondary refresh'
                        icon='pi pi-sync'
                        label='Другой вариант'
                        //disabled={roundMdays.find( item => item._id )}
                        disabled={loading || !roundMdays.find( item => item && item.matches && !!item.matches.find(m => m && m.home && m.away)) }
                        onClick={() => confirmDialog({
                            message: 'Другой вариант',
                            header: 'Подтвердите выбор',
                            icon: 'pi pi-info-circle',
                            position: 'top',
                            acceptLabel: type === 'manual' ? 'Да, сбросить' : 'да, запросить другой вариант',
                            rejectLabel: 'Отмена',
                            accept: async () => {
                                // const draft = await service.calendarDraft(stage._id, toast)
                                // setType('auto')
                                // if (draft && draft.matchDays) {
                                //     console.log(draft.matchDays);
                                //     setGroupsMdays(draft.matchDays)
                                // }
                                const apply = await clearDraft()
                                return
                            }
                        })}
                    />
                    <Button
                        className='p-button-sm p-button-warning cancel'
                        icon='pi pi-times'
                        label='Отмена'
                        disabled={loading || roundMdays.find( item => item && item._id) }
                        onClick={() => confirmDialog({
                            message: 'Отмена',
                            header: 'Подтвердите выбор',
                            icon: 'pi pi-info-circle',
                            position: 'top',
                            acceptLabel: 'Да, отменить',
                            rejectLabel: 'Вернуться к заполнению',
                            accept: () => {
                                const cancel = cancelDraft()
                                return
                            }
                        })}
                    />
                </div>
                    : null
                }
            </div>}
        </div>
    ) : (
        stage && stage._id && stage.teams && stage.teams.length > 1 ? <div className='calendar-card withoutMds fields-group'>
            <Tag className='group-title'>Календарь</Tag>
            <div className='actions cta'>
                <div>календаря еще нет <br/> выберите режим создания:</div>
                <div>
                    <Button
                        className={`p-button-sm p-button-secondary ${type === 'auto' ? 'type_auto' : ''}`}
                        icon='pi pi-bolt'
                        label='Сгенерировать автоматически'
                        onClick={async () => {
                            setLoading(true)
                            const draft = await service.calendarDraftV2({
                                stageId: stage._id,
                                toast: toast
                            })

                            if (draft && draft.matchDays) {
                                setRoundMdays(draft.matchDays)
                            }

                            updateStage({...stage, fillType: 'auto'})
                            setType('auto')
                            setLoading(false)
                            return
                        }}
                        // onClick={() => confirmDialog({
                        //     //message: messages[type],
                        //     header: 'Подтвердите выбор',
                        //     icon: 'pi pi-info-circle',
                        //     position: 'top',
                        //     acceptLabel: 'Да, продолжить',
                        //     rejectLabel: 'Выбрать другой',
                        //     accept: async () => {
                        //         setLoading(true)
                        //         const draft = await service.calendarDraftV2({
                        //             stageId: stage._id,
                        //             toast: toast
                        //         })
                        //
                        //         if (draft && draft.matchDays) {
                        //             console.log(draft.matchDays);
                        //             setRoundMdays(draft.matchDays)
                        //         }
                        //         updateStage({...stage, fillType: 'auto'})
                        //         setType('auto')
                        //         setLoading(false)
                        //         return
                        //     }
                        // })}
                    />
                </div>
                <div>или</div>
                <div>
                    <Button
                    className={`p-button-sm p-button-secondary ${type === 'auto' ? '' : 'type_auto'}`}
                        icon='pi pi-bars'
                        label='В ручном режиме'
                        onClick={() => {
                            const data = generateEmptyRoundMds(stage._id, stage.teams, '', false, false, stage.roundsQty);
                            if (data) {
                                setRoundMdays(data)
                            }
                            updateStage({...stage, fillType: 'manual'})
                            setType('manual')
                            return
                        }}
                        // onClick={() => confirmDialog({
                        //     //message: messages[type],
                        //     header: 'Подтвердите выбор',
                        //     icon: 'pi pi-info-circle',
                        //     position: 'top',
                        //     acceptLabel: 'Да, продолжить',
                        //     rejectLabel: 'Выбрать другой',
                        //     accept: () => {
                        //         //if(type !== 'custom') {
                        //             // const stages = await service.applyStages(subject, type, toast)
                        //             // updateTournament({stages: stages})
                        //
                        //
                        //         //}
                        //         const data = generateEmptyRoundMds(stage._id, stage.teams, '', stage.roundsQty > 1 ? true : false, stage.isReverseMirror || false);
                        //         if (data) {
                        //             setRoundMdays(data)
                        //         }
                        //         updateStage({...stage, fillType: 'manual'})
                        //         setType('manual')
                        //         return
                        //     }
                        // })}
                    />
                </div>
            </div>
        </div> : null
    )
}

export default Plain
