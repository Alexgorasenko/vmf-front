import React, { useState, useEffect } from 'react'

import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import Matchday from './Matchday'
import service from '../../service'
import CustomScrollbars from 'react-custom-scrollbars-2'

const generateEmptyGroupMds = (groups, dayName, isNeedReverse=false, isReverseMirror=false) => {
    const mds = [];
    for (let group of groups) {
        const teamsCount = group.teams.length;
        const matchesCount = Math.floor((teamsCount * 10 / 2)/10);
        let numberOfRounds = teamsCount % 2 === 0 ? teamsCount - 1 : teamsCount;
        //console.log(matchesCount, group.teams.length);

        for (let i=0; i < numberOfRounds; i++) {
            const md = {
                name: dayName ? dayName.replace(/\d/g,'_').replace('_', `${i+1}`).replace(/_/g, '') : `${i+1} тур`,
                stageId: group.stageId,
                //groupId: groupData._id,
                type: 'plain',
                matches: []
            }
            for (let j=0; j < matchesCount; j++) {
                const newmatch = {
                    home: null,
                    away: null,
                    homeId: null,
                    awayId: null,
                    groupId: group._id,
                    groupName: group.name,
                }
                md.matches.push(newmatch)
            }
            mds.push(md)
        }
    }
    const matchdaysRed = mds.reduce((acc, cur) => {
        if (acc[cur.name]) {
            acc[cur.name]['matches'].push(...cur.matches)
        } else {
            acc[cur.name] = cur
        }
        return acc
    },{})

    //console.log(Object.values(matchdaysRed));
    const matchdays = Object.values(matchdaysRed).sort((a, b) => a.name > b.name ? 1 : -1);

    /*if (isNeedReverse) {
        const secondHalf = matchdays.map((item, ind) => {
            return {
                ...item,
                name: !isReverseMirror ? `${2*matchdays.length - ind} тур` : `${matchdays.length + ind +1} тур`
            }
        })

        if (isReverseMirror) {
            matchdays.push(...secondHalf.reverse());
        } else {
            matchdays.push(...secondHalf);
        }
    }*/
    //console.log('matchdays manual group', matchdays);
    return matchdays
}

const Groups = ({teams, stages, toast, updateStage}) => {
    //const [rounds, setRounds] = useState(1)
    const [stage, setStage] = useState(stages.find(item => item.type === 'groups'))
    const [groupsMdays, setGroupsMdays] = useState(stage ? stage.matchdays : [])

    const [type, setType] = useState(stage.fillType || 'auto')
    const [loading, setLoading] = useState(false)

    const manualMdsFilled = (groups, fromDBMds) => {
        const filledEmpty = generateEmptyGroupMds(groups, fromDBMds[0].name);
        const mapdFilled = [];

        for (let md of filledEmpty) {
            const curMdMs = [];
            const fromDbMd = fromDBMds.find(item => item.name === md.name);
            if (fromDbMd && fromDbMd.matches) {
                curMdMs.push(...fromDbMd.matches);

                for (let m of md.matches) {
                    const fromDbM = curMdMs.find(mt => mt.groupName === m.groupName);
                    //console.log('fromDbM', fromDbM, m.groupName);

                    if (!fromDbM) {
                        curMdMs.push(m)
                    }
                }
                mapdFilled.push({...fromDbMd, matches: curMdMs})
            } else {
                mapdFilled.push(md)
            }
        }
        //console.log('manualMdsFilled', mapdFilled);
        return mapdFilled;
    }

    useEffect(() => {
        const st = stages.find(item => item.type === 'groups')
        if (st) {
            let curtype = type;

            const mds = st.matchdays || [];
            if (mds.length) {

                const grteams = st.groups.reduce((acc, cur) => {
                    if (cur.teams && cur.teams.length > acc.length) {
                        acc = cur.teams
                    }
                    return acc;
                }, []);

                const grmatchesCount = st.groups.reduce((acc, cur) => {
                    if ( cur.teams ) {
                        const mdsCurCount = cur.teams.length % 2 === 0 ? cur.teams.length - 1 : cur.teams.length;
                        const msCurCount = cur.teams.length % 2 === 0 ? cur.teams.length / 2 : ((cur.teams.length - 1) / 2);
                        acc += mdsCurCount * msCurCount;
                    }
                    return acc;
                }, 0);

                const mdsCount = grteams % 2 === 0 ? grteams.length-1 : grteams.length;

                if (st.fillType) {
                    //setType(st.fillType)
                    if (st.fillType === 'manual') {
                        const filledMds = manualMdsFilled(st.groups, mds)
                        setGroupsMdays(filledMds)
                    } else {
                        setGroupsMdays(mds)
                    }
                } else {
                    //console.log('mdsCount', mdsCount, 'grteams', grteams.length, 'grmatchesCount', grmatchesCount, 'st.fillType', st.fillType, curtype);

                    if (mdsCount === mds.filter(md => md._id).length) {
                        const msDBcount = mds.reduce((acc, cur) => {
                            acc += cur.matches.length
                            return acc
                        }, 0)
                        //console.log('grmatchesCount', grmatchesCount)

                        if (msDBcount === grmatchesCount) {
                            curtype = 'fromDB';
                            // setType('fromDB')
                            // updateStage({...st, fillType: 'fromDB'})
                            //setGroupsMdays(mds)
                        } else {
                            curtype = 'manual';
                            //setType('manual')
                            //updateStage({...st, fillType: 'manual'})
                            // const filledMds = manualMdsFilled(st.groups, mds)
                            // setGroupsMdays(filledMds)
                        }
                    } else {
                        if (mds.find(md => md._id || md.matches.find(m => !m.home || !m.away))) {
                            //setType('manual');
                            curtype = 'manual'
                            // const filledMds = manualMdsFilled(st.groups, mds)
                            // setGroupsMdays(filledMds)
                            //updateStage({...st, fillType: 'manual'})
                        } else {
                            //setType('auto')
                            //updateStage({...st, fillType: 'auto'})
                            //setGroupsMdays(mds)
                        }
                    }
                    if (curtype !== 'auto') {
                        updateStage({...st, fillType: curtype})
                        setType(curtype)
                    }
                }
            }
            setStage(st)
        }
    },[stages])

    // useEffect(() => {
    //     if (stage && stage.matchdays && stage.matchdays.length) {
    //         console.log('stage.matchdays', stage.matchdays);
    //         const md = stage.matchdays.find( item => item && item.matches && item.matches.length && !!item.matches.find(m => !m.home || !m.away) );
    //
    //         if (md) {
    //             setType('manual')
    //         } else {
    //             setType('auto')
    //         }
    //     } else {
    //         setType('auto')
    //     }
    // }, [stage])

    /*useEffect(() => {
        const md = groupsMdays.find( item => item && item.matches && item.matches.length && !!item.matches.find(m => !m.home || !m.away) );
console.log('md',md);
        if (md) {
            setType('manual')
        } else {
            setType('auto')
        }
    }, [groupsMdays])*/

    const updMatchDay = (md, ind) => {
        //console.log('updMatchDay', ind, md);
        const updated = [...groupsMdays.slice(0, ind), md, ...groupsMdays.slice(ind+1) ].sort((a,b) => a.name > b.name ? 1 : -1)
        setGroupsMdays(updated)
        updateStage({...stage, matchdays: updated})
    }

    const applyDraft = async () => {
        setLoading(true)
        const mapd = type === 'manual' ? groupsMdays
            .filter(md => md.matches && md.matches.filter(m => (m.homeId && m.awayId) || m._id).length)
            .map(md => {
                const ms = md.matches
                    .filter( m => (m.homeId && m.awayId) || m._id)
                    .map(m => ({homeId: m.homeId, awayId: m.awayId, matchId: m._id || null, matchdayId: md._id || null}));
                return {...md, matches: ms}
            }) : groupsMdays.map(md => {
                const ms = md.matches
                    .map(m => ({homeId: m.homeId, awayId: m.awayId, matchId: m._id || null, matchdayId: md._id || null}));
                return {...md, matches: ms}
            })
        //console.log('applyDraft', stage._id, mapd);

        const res = await service.applyCalendarDraftV2(stage._id, toast, mapd)
        if (res) {
            //console.log(res);
            if (res.success) {
                const draft = await service.calendarDraftV2({
                    stageId: stage._id,
                    toast: toast,
                    isRandomTeams: 0,
                    fromDB: 1})
                //console.log('service.calendarDraftV2 reload', draft.matchDays);
                if (draft && draft.matchDays) {
                    //console.log(draft.matchDays);
                    setGroupsMdays(draft.matchDays)
                    updateStage({...stage, matchdays: draft.matchDays, fillType: 'fromDB'})
                }
            }
        }
        setLoading(false)
        //updateStage({...stage, fillType: 'auto'})
    }

    const clearDraft = async () => {
        if (type === 'manual') {
            //const data = generateEmptyGroupMds(stage.groups, stage.roundsQty > 1 ? true : false, stage.isReverseMirror || false);
            const data = groupsMdays.map(item => {
                const mapdMs = item.matches.map(m => m._id ? m : {...m, home: null, away: null, homeId: null, awayId: null})

                return {
                    ...item,
                    matches: mapdMs
                }
            })
            if (data) {
                //console.log('clearDraft', data);
                setGroupsMdays(data)
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
                setGroupsMdays(draft.matchDays)
                updateStage({...stage, matchdays: draft.matchDays})
            }
            setLoading(false)
        }

    }

    const cancelDraft = () => {
        setGroupsMdays([])
        updateStage({...stage, matchdays: []})
    }
    const wrongDay = groupsMdays && groupsMdays.length ? groupsMdays.find( item => item && item.matches && item.matches.length && item.matches.find(m => !m.home || !m.away)) : null

//console.log('loading',loading, 'wrongDay', wrongDay, !!wrongDay, type, stage);

    return  groupsMdays && groupsMdays.length ? (
        <div className='calendar-card fields-group'>
            <Tag className='group-title'>{stage ? stage.title : 'Групповой этап'}</Tag>

            <CustomScrollbars className='matchdays-scroll' autoHide autoHeight autoHeightMin='68.5vh'>
                {groupsMdays.map((md,ind) => (
                    <Matchday
                        day={md} key={md._id || `${ind}_md`}
                        ind={ind}
                        type={type}
                        teams={teams}
                        updMatchDay={updMatchDay}
                        groups={stage ? stage.groups : []}
                    />))}
            </CustomScrollbars>

                {type === 'fromDB' ? null : <div className='actions'>
                    <div>
                        <Button
                            className='p-button p-button-primary'
                            icon='pi pi-check'
                            label='Применить календарь'
                            disabled={loading || !!wrongDay}
                            onClick={() => confirmDialog({
                                message: 'Применить календарь',
                                header: 'Подтвердите выбор',
                                icon: 'pi pi-info-circle',
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
                    <div className='options'>
                        <Button
                            className='p-button-sm p-button-secondary refresh'
                            icon='pi pi-sync'
                            label='Другой вариант'
                            //disabled={groupsMdays.find( item => item._id )}
                            disabled={loading || !groupsMdays.find( item => item && item.matches && !!item.matches.find(m => m && m.home && m.away)) }
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
                            disabled={loading || groupsMdays.find( item => item && item._id) }
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
                </div>}
        </div>
    ) : (
        stage && stage._id ? <div className='calendar-card withoutMds field-group'>
            <Tag className='group-title'>{stage ? stage.title : 'Групповой этап'}</Tag>
            <div className='actions regular'>
                <div>календаря еще нет <br/> выберите режим создания:</div>
                <div>
                    <Button
                        className={`p-button-sm p-button-secondary ${type === 'auto' ? 'type_auto' : ''}`}
                        icon='pi pi-bolt'
                        label='Сгенерировать автоматически'
                        onClick={() => confirmDialog({
                            message: 'Сгенерировать автоматически',
                            header: 'Подтвердите выбор',
                            icon: 'pi pi-info-circle',
                            position: 'top',
                            acceptLabel: 'Да, продолжить',
                            rejectLabel: 'Выбрать другой',
                            accept: async () => {
                                setLoading(true)
                                const draft = await service.calendarDraftV2({
                                    stageId: stage._id,
                                    toast: toast
                                })
                                setLoading(false)
                                if (draft && draft.matchDays) {
                                    setGroupsMdays(draft.matchDays)
                                }
                                updateStage({...stage, fillType: 'auto'})
                                setType('auto')
                                return
                            }
                        })}
                    />
                </div>
                <div>или</div>
                <div>
                    <Button
                    className={`p-button-sm p-button-secondary ${type === 'auto' ? '' : 'type_auto'}`}
                        icon='pi pi-bars'
                        label='В ручном режиме'
                        onClick={() => confirmDialog({
                            message: 'Заполнить в ручном режиме',
                            header: 'Подтвердите выбор',
                            icon: 'pi pi-info-circle',
                            position: 'top',
                            acceptLabel: 'Да, продолжить',
                            rejectLabel: 'Выбрать другой',
                            accept: () => {
                                //if(type !== 'custom') {
                                    // const stages = await service.applyStages(subject, type, toast)
                                    // updateTournament({stages: stages})


                                //}
                                const data = generateEmptyGroupMds(stage.groups, stage.roundsQty > 1 ? true : false, stage.isReverseMirror || false);
                                if (data) {
                                    setGroupsMdays(data)
                                }
                                updateStage({...stage, fillType: 'manual'})
                                setType('manual')
                                return
                            }
                        })}
                    />
                </div>
            </div>

            {/*<div className='action'>
                <Button
                    className='p-button-sm'
                    icon='pi pi-save'
                    label='Продолжить'
                    onClick={() => confirmDialog({
                        //message: messages[type],
                        header: 'Подтвердите выбор',
                        icon: 'pi pi-info-circle',
                        position: 'top',
                        acceptLabel: 'Да, продолжить',
                        rejectLabel: 'Выбрать другой',
                        accept: async () => {
                            //if(type !== 'custom') {
                                // const stages = await service.applyStages(subject, type, toast)
                                // updateTournament({stages: stages})


                            //}
                            if (type === 'auto') {
                                const draft = await service.calendarDraft(stage._id, toast)
                            } else {
                                console.log('manual data', teams);
                            }
                            return
                        }
                    })}
                />
            </div>*/}
        </div> : <p>Стадия не найдена</p>
    )
}

export default Groups
