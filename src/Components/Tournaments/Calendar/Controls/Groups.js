import React, { useState, useEffect } from 'react'

import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import Matchday from './Matchday'
import service from '../../service'
import CustomScrollbars from 'react-custom-scrollbars-2'


const getNumFromName = name => {
    const replaced = name.replace(/\D/g,'');
    if (replaced) {
        return +replaced
    } else {
        return 1
    }
}

const generateEmptyGroupMds = (groups, dayName, roundsQty, isNeedReverse=false, isReverseMirror=false) => {
    //console.log('generateEmptyGroupMds', groups, dayName);
    const mds = [];
    for (let group of groups) {
        const teamsCount = group.teams.length;
        const matchesCount = Math.floor((teamsCount * 10 / 2)/10);
        let numberOfRounds = teamsCount % 2 === 0 ? (teamsCount - 1) * roundsQty : teamsCount * roundsQty;

        for (let i=0; i < numberOfRounds; i++) {
            const md = {
                name: dayName ? dayName.replace(/\d/g,'_').replace('_', `${i+1}`).replace(/_/g, '') : `${i+1} тур`,
                stageId: group.stageId,
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

    const matchdays = Object.values(matchdaysRed).sort((a,b) => a.name && b.name ? getNumFromName(a.name) - getNumFromName(b.name) : 0)
    return matchdays
}

/*
const mergemdWithEmpty = (groups, fromDBMds) => {
    console.log('generateEmptyGroupMds', groups, fromDBMds);

    const bindedTeamsWithGroup = groups.reduce((acc, group) => {
        if (group.teams && group.teams.length) {
            for (let cur of group.teams) {
                if (cur._id && !acc[cur._id]) {
                    acc[cur._id] = {
                        groupId: group._id,
                        groupName: group.name
                    }
                }
            }
        }
        return acc
    }, {});

    const mdsOut = fromDBMds.reduce((acc, cur) => {

    }, {})

    for (let group of groups) {

        const teamsCount = group.teams.length;
        const matchesCount = Math.floor((teamsCount * 10 / 2)/10);
        let numberOfRounds = teamsCount % 2 === 0 ? teamsCount - 1 : teamsCount;

        for (let i=0; i < numberOfRounds; i++) {
            const md = {
                name: dayName ? dayName.replace(/\d/g,'_').replace('_', `${i+1}`).replace(/_/g, '') : `${i+1} тур`,
                stageId: group.stageId,
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

    const matchdays = Object.values(matchdaysRed).sort((a, b) => a.name > b.name ? 1 : -1);
    return matchdays
}
*/

const Groups = ({teams, stage, toast, updateStage }) => {
    const [groupsMdays, setGroupsMdays] = useState(stage ? stage.matchdays : [])

    const [type, setType] = useState(stage.fillType || '')
    const [loading, setLoading] = useState(false)

    const [needOptions, setNeedOptions] = useState(true)

    const [flagAutoGenerate, setFlagAutoGenerate] = useState(false)
    const [flagNewRound, setFlagNewRound] = useState(false)

    useEffect(() => {
        if (type === 'manual' && !groupsMdays.find(rm => rm._id)) {
            const data = generateEmptyGroupMds(stage.groups,'',stage.roundsQty, stage.roundsQty > 1 ? true : false, stage.isReverseMirror || false);
            if (data) {
                setGroupsMdays(data)
            }

        } else if (type === 'auto' && !groupsMdays.find(rm => rm._id)) {
            async function f() {
                setLoading(true)
                const draft = await service.getWIPCalendarDraft({
                    stageId: stage._id,
                    toast: toast
                })
                setLoading(false)
                if (draft && draft.matchDays) {
                    setGroupsMdays(draft.matchDays)
                }
            }
            f().then()
        }
    }, [stage.groups])

    useEffect(() => {
        //const st = stages.find(item => item.type === 'groups')
        if (stage) {
            const st = {...stage}

            let curtype = type;

            const mds = st.matchdays && st.matchdays.length ? st.matchdays.sort((a,b) => a.name && b.name ? getNumFromName(a.name) - getNumFromName(b.name) : 0) : [];

            if (mds.length) {

                const grteams = st.groups.reduce((acc, cur) => {
                    if (cur.teams && cur.teams.length > acc.length) {
                        acc = cur.teams
                    }
                    return acc;
                }, []);

                const totalTeamCount = st.groups.reduce((acc, g) => {
                    if(g.teams) {
                        acc += g.teams.length
                    }

                    return acc
                }, 0)

                const totalGroupsMatchesInFirstMD = st.groups.reduce((acc, cur) => {
                    if ( cur.teams ) {
                        const msCurCount = cur.teams.length % 2 === 0 ? cur.teams.length / 2 : ((cur.teams.length - 1) / 2);
                        acc += msCurCount;
                    }
                    return acc;
                }, 0);

                const grmatchesCount = st.groups.reduce((acc, cur) => {
                    if ( cur.teams ) {
                        const mdsCurCount = cur.teams.length % 2 === 0 ? cur.teams.length - 1 : cur.teams.length;
                        const msCurCount = cur.teams.length % 2 === 0 ? cur.teams.length / 2 : ((cur.teams.length - 1) / 2);
                        acc += mdsCurCount * msCurCount;
                    }
                    return acc;
                }, 0);

                const mdsCount = grteams.length % 2 === 0 ? grteams.length-1 : grteams.length;

                if (
                    mdsCount !== 1 &&
                    mds.filter(item => item._id).length === 1 &&
                    mds.find(item => item._id)._id === mds[0]._id
                ) {
                    const isFLag = mds[0].matches.length === totalGroupsMatchesInFirstMD;
                    setFlagAutoGenerate(isFLag)
                }  else {
                    setFlagAutoGenerate(false)
                }

                const msDBcount = mds.reduce((acc, cur) => {
                    acc += cur.matches.length
                    return acc
                }, 0)
                setFlagNewRound(grmatchesCount === msDBcount && st.roundsQty > 1)

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
            } /*else if (st.fillType === 'manual') {
                const filledMds = manualMdsFilled(st.groups, mds)
                setGroupsMdays(filledMds)
            }*/
            //setStage(st)
        }
    },[stage])

    const manualMdsFilled = (groups, fromDBMds) => {
        const bindedCountMatchesWithGroups = groups.reduce((acc, cur) => {
            const teamsCount = cur.teams.length;
            const matchesCount = Math.floor((teamsCount * 10 / 2)/10);
            if (cur.name && !acc[cur.name]) {
                acc[cur.name] = matchesCount;
            }
            return acc;
        }, {})

        // if (fromDBMds && fromDBMds.length) {
        //     const mapdFilled = mergemdWithEmpty(fromDBMds, generateEmptyGroupMds(groups, fromDBMds[0].name));
        //     return mapdFilled;
        // } else {
            const filledEmpty = fromDBMds && fromDBMds.length ? generateEmptyGroupMds(groups, fromDBMds[0].name, stage.roundsQty) : generateEmptyGroupMds(groups);
            const mapdFilled = [];
    //console.log('filledEmpty', filledEmpty, 'fromDBMds', fromDBMds);
            for (let md of filledEmpty) {
                //console.log('md.name', md.name);
                const curMdMs = [];
                const fromDbMd = fromDBMds.find(item => item.name === md.name);
                if (fromDbMd && fromDbMd.matches) {
                    const bindedMatchesWithGroups = fromDbMd.matches.reduce((acc, m) => {
                        if (m.groupName && !acc[m.groupName]) {
                            acc[m.groupName] = []
                        }
                        if (acc[m.groupName]){
                            acc[m.groupName].push(m);
                        }

                        return acc;
                    }, {})
                    //console.log('bindedMatchesWithGroups', bindedMatchesWithGroups, 'bindedCountMatchesWithGroups', bindedCountMatchesWithGroups);
                    for (let groupName in bindedCountMatchesWithGroups) {
                        const countCurMs = bindedMatchesWithGroups[groupName] ? bindedMatchesWithGroups[groupName].length : 0;
                        const restCount = bindedCountMatchesWithGroups[groupName] - countCurMs;

                        if (bindedMatchesWithGroups[groupName] && bindedMatchesWithGroups[groupName].length) {
                            curMdMs.push(...bindedMatchesWithGroups[groupName]);
                        }
                        //console.log('groupName', groupName, countCurMs, 'restCount', restCount);
                        if ( restCount > 0) {
                            curMdMs.push(...md.matches.filter(m => m.groupName === groupName).slice(0, restCount))
                        }

                    }
                    mapdFilled.push({...fromDbMd, matches: curMdMs})

                    /*for (let m of md.matches) {
                        const fromDbM = curMdMs.filter(mt => mt.groupName === m.groupName);
                        console.log('fromDbM', fromDbM, m.groupName);

                        if (!fromDbM) {
                            curMdMs.push(m)
                        }
                    }*/
                } else {
                    mapdFilled.push(md)
                }
            }
            //console.log('manualMdsFilled', mapdFilled);
            return mapdFilled.sort((a,b) => a.name && b.name ? getNumFromName(a.name) - getNumFromName(b.name) : 0);
        //}
    }

    const teamsForGroups = stage && stage.groups && stage.groups.length ? stage.groups.reduce((acc, gr) => {
        if (gr && gr.teams && gr.teams.length) {
            for (let t of gr.teams) {
                if (t._id && !acc[t._id]) {
                    acc[t._id] = {
                        groupName: gr.name,
                        groupId: gr._id
                    }
                }
            }
        }
        return acc
    }, {}) : {}

    const updMatchDay = (md, ind) => {
        //console.log('updMatchDay', ind, md);
        const updated = [...groupsMdays.slice(0, ind), md, ...groupsMdays.slice(ind+1) ].sort((a,b) => a.name && b.name ? getNumFromName(a.name) - getNumFromName(b.name) : 0)
        setGroupsMdays(updated)
        updateStage({...stage, matchdays: updated})
    }

    const updMatchDayAndApply = async (md, ind) => {
        const updated = [...groupsMdays.slice(0, ind), md, ...groupsMdays.slice(ind+1) ].sort((a,b) => a.name && b.name ? getNumFromName(a.name) - getNumFromName(b.name) : 0)
        //console.log('updMatchDayAndApply updated', updated);
        setGroupsMdays(updated)
        //updateStage({...stage, matchdays: updated})
        await applyDraft(updated, ind)
    }

    const applyDraft = async (updated = null, ind = null) => {
        setLoading(true)
        const sendingMds = updated || groupsMdays;
        if (type === 'manual' || (updated && (ind || ind === 0))) {
            const mapd = sendingMds
                .filter((md, i) => i === ind && md.matches && md.matches.filter(m => (m.homeId && m.awayId) || m._id).length)
                .map(md => {
                    const ms = md.matches
                        .filter( m => (m.homeId && m.awayId) || m._id)
                        .map(m => ({homeId: m.homeId, awayId: m.awayId, matchId: m._id || null, matchdayId: md._id || null}));
                    return {...md, matches: ms}
                })

            const res = await service.applyCalendarDraftV2(stage._id, toast, mapd)
            if (res && res.success && res.md) {
                const mapdMatches = res.md.matches && res.md.matches.length ? res.md.matches.map(m => {

                const tgr = (m.homeId && teamsForGroups[m.homeId]) ? teamsForGroups[m.homeId] : (m.awayId && teamsForGroups[m.awayId]) ? teamsForGroups[m.awayId] : {};

                    return {...m, ...tgr}
                }) : [];

                const updatedAfter = [...groupsMdays.slice(0, ind), {...res.md, matches: mapdMatches}, ...groupsMdays.slice(ind+1) ].sort((a,b) => a.name && b.name ? getNumFromName(a.name) - getNumFromName(b.name) : 0)

                setGroupsMdays(updatedAfter)
                updateStage({...stage, matchdays: updatedAfter, fillType: null})
            }
        } else {
            const mapd = sendingMds.map(md => {
                    const ms = md.matches
                        .map(m => ({homeId: m.homeId, awayId: m.awayId, matchId: m._id || null, matchdayId: md._id || null}));
                    return {...md, matches: ms}
                })

            const res = await service.applyCalendarDraftV2(stage._id, toast, mapd)
            if (res) {
                if (res.success) {
                    const draft = await service.calendarDraftV2({
                        stageId: stage._id,
                        toast: toast,
                        isRandomTeams: 0,
                        fromDB: 1})
                    if (draft && draft.matchDays) {
                        const soredMds = draft.matchDays.sort((a,b) => a.name && b.name ? getNumFromName(a.name) - getNumFromName(b.name) : 0)
                        setGroupsMdays(soredMds)
                        updateStage({...stage, matchdays: soredMds, fillType: 'fromDB'})
                    }
                }
            }
        }
        setLoading(false)
    }

    const clearDraft = async () => {
        if (type === 'manual') {
            const data = groupsMdays.map(item => {
                const mapdMs = item.matches.map(m => m._id ? m : {...m, home: null, away: null, homeId: null, awayId: null})

                return {
                    ...item,
                    matches: mapdMs
                }
            }).sort((a,b) => a.name && b.name ? getNumFromName(a.name) - getNumFromName(b.name) : 0)
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
        setType('')
        setGroupsMdays([])
        updateStage({...stage, matchdays: []})
    }

    const wrongDay = groupsMdays && groupsMdays.length ? groupsMdays.find( item => item && item.matches && item.matches.length && item.matches.find(m => !m.home || !m.away)) : null

    const totalTeamsLen = stage && stage.groups ? stage.groups.reduce((acc, g) => {
        if(g.teams) {
            acc += g.teams.length
        }

        return acc
    }, 0) : 0

    const updMatchDayWithCopy = (md, md2, ind, ind2) => {
        let updated = [...groupsMdays.slice(0, ind), md, ...groupsMdays.slice(ind+1)]
        updated = [...updated.slice(0, ind2), md2, ...updated.slice(ind2+1)].sort((a,b) => a.name && b.name ? getNumFromName(a.name) - getNumFromName(b.name) : 0)
        setGroupsMdays(updated)
        updateStage({...stage, matchdays: updated})
    }

    const updateName = async (name, day) => {
        const copyDay = groupsMdays.find(gmd => gmd.name === name)
        if (copyDay) {
            await service.patchData(copyDay._id, 'matchdays', {name: day.name}, toast);
            await service.patchData(day._id, 'matchdays', {name: name}, toast);
            updMatchDayWithCopy({...copyDay, name: day.name }, {...day, name: name }, groupsMdays.indexOf(copyDay), groupsMdays.indexOf(day))
        } else {
            await service.patchData(day._id, 'matchdays', {name: name}, toast);
            updMatchDay({...day, name: name }, groupsMdays.indexOf(day))
        }
    }

    return  groupsMdays && groupsMdays.length ? (
        <div className='calendar-card fields-group'>
            <Tag className='group-title'>Календарь</Tag>

            {(flagAutoGenerate) ? <div className='actions regular'>
                <div>
                    <Button
                        className={`p-button-sm p-button-secondary ${type === 'auto' ? 'type_auto' : ''}`}
                        icon='pi pi-bolt'
                        label='Далее сгенерировать автоматически'
                        onClick={() => confirmDialog({
                            message: 'Сгенерировать автоматически',
                            header: 'Подтвердите выбор',
                            icon: 'pi pi-info-circle',
                            position: 'top',
                            acceptLabel: 'Да, продолжить',
                            rejectLabel: 'Отмена',
                            accept: async () => {
                                setLoading(true)
                                const draft = await service.getWIPCalendarDraft({
                                    stageId: stage._id,
                                    toast: toast
                                })
                                setLoading(false)
                                if (draft && draft.matchDays) {
                                    setGroupsMdays(draft.matchDays)
                                }
                                setType('auto')
                                setNeedOptions(false)
                                return
                            }
                        })}
                    />
                </div>
            </div> : null}

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
                                    setGroupsMdays(draft.matchDays)
                                }

                                updateStage({...stage, matchdays: draft.matchDays})
                                setLoading(false)
                                return
                            }}
                        />
                    </div>
                </div>
                : null
            }

            <CustomScrollbars className='matchdays-scroll' autoHide autoHeight autoHeightMin={`calc(100vh - 50px)`}>
                {groupsMdays.map((md,ind) => (
                    <Matchday
                        day={md}
                        key={md._id || `${ind}_md`}
                        ind={ind}
                        type={type}
                        teams={teams}
                        updMatchDay={updMatchDay}
                        groups={stage ? stage.groups : []}
                        updMatchDayAndApply={updMatchDayAndApply}
                        updateName={updateName}
                        mds={
                            stage && stage.groups ? (stage.groups.reduce((acc, cur) => {
                                if (cur.teams && cur.teams.length > acc) {
                                    acc = cur.teams.length % 2 === 0 ? cur.teams.length - 1 : cur.teams.length
                                }
                                return acc;
                            }, [])) * stage.roundsQty : 0
                        }
                    />))}
            </CustomScrollbars>

                {['fromDB', 'manual'].includes(type) ? null : <div className='actions'>
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
                    {
                        needOptions ?
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
                        : null
                    }
                </div>}
        </div>
    ) : (
        stage && stage._id && (totalTeamsLen > 1) ? <div className='calendar-card withoutMds field-group'>
            <Tag className='group-title'>Календарь</Tag>
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
                                const data = generateEmptyGroupMds(stage.groups,'', stage.roundsQty, stage.roundsQty > 1 ? true : false, stage.isReverseMirror || false);
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
        </div> : null
    )
}

export default Groups
