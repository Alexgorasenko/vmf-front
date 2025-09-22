import axios from 'axios'
import { ENDPOINT } from '../../env'
import moment from 'moment'

const request = async (method, collection, id, body) => {
    const options = {
        headers: {
            authorization: localStorage.getItem('_amateum_subject_tkn'),
            signedby: localStorage.getItem('_amateum_tkn')
        }
    }
    const resp = await axios[method](`${ENDPOINT}v2/${collection}/${id || ''}`, (['get', 'delete'].includes(method) ? options : body || {}), options)
    return resp.data
}

const service = {
    updateStage: async (id, body, toast) => {
        try {
            await request('put', 'stages', id, body)
            toast.show({severity: 'success', summary: 'Успешно', detail: 'Настройки обновлены'})
            return
        } catch(e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось обновить настройки стадии'})
        }
    },
    updateGroupTeams: async (groupId, arr, toast) => {
        try {
            await request('put', 'groups', groupId, {teams: arr})
            toast.show({severity: 'success', summary: 'Успешно', detail: 'Состав группы обновлен'})
            return
        } catch(e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось обновить состав группы'})
        }
    },
    renameGroup: async (_id, name) => {
        await request('put', 'groups', _id, {name: name})
        return
    },
    removeGroup: async (_id, toast, col='groups') => {
        try {
            await request('delete', col, _id)
            toast.show({severity: 'success', summary: 'Успешно', detail: 'Данные удалены'})
            return
        } catch(e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось удалить'})
        }
    },
    postGrid: async (grid, toast) => {
        try {
            const {_id: gridId, ...body} = grid;

            const data = await request('put', 'playoffgrids', gridId === 'newGrid' ? null : gridId, body)
            if(data && (data.success || data._id)) {
                toast.show({severity: 'success', summary: 'Успешно', detail: 'Раунд добавлен в стадию'})
                return data
            } else {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось создать сетку'})
            }
        } catch(e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось создать сетку'})
        }
    },
    updateGrid: async (id, body, toast) => {
        try {
            await request('put', 'playoffgrids', id, body)
            toast.show({severity: 'success', summary: 'Успешно', detail: 'Настройки обновлены'})
            return
        } catch(e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось обновить настройки стадии'})
        }
    },
    patchData: async (id, col, patch, toast={show: () => null}) => {
        try {
            const data = await request('put', col, id, patch)
            if(data && (data.success || data._id)) {
                toast.show({severity: 'success', summary: 'Успешно', detail: 'Данные обновлены'})
                return data
            } else {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось обновить'})
                return null
            }
        } catch(e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось обновить'})
        }
    },
    createGroup: async (stageId, name, toast) => {
        try {
            const group = await request('put', 'groups', null, {stageId: stageId, name: name, teams: []})
            if(group._id) {
                toast.show({severity: 'success', summary: 'Успешно', detail: 'Группа добавлена в турнир'})
                return group
            } else {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось создать группу'})
            }
        } catch(e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось создать группу'})
        }
    },
    applyStages: async (tournament, type, toast) => {
        try {
            const federationId = tournament.federationId || tournament.league ? tournament.league.federationId : null;
            const stages = []
            if (!federationId) {
                console.log('wrong tournament', tournament);
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось создать стадии турнира, не указана федерация'})
                return stages;
            }
            switch(type) {
                case 'round':
                    const rnd = await request('put', 'stages', null, {
                        tournamentId: tournament._id,
                        federationId: federationId,
                        leagueId: tournament.league._id,
                        seasonId: tournament.seasonId,
                        type: 'round',
                        teams: tournament.teams.map(t => ({_id: t._id})),
                        roundsQty: 1,
                        title: 'Круговой турнир'
                    })

                    stages.push(rnd)
                    break
                case 'playoff':
                    const po = await request('put', 'stages', null, {
                        tournamentId: tournament._id,
                        federationId: federationId,
                        leagueId: tournament.league._id,
                        seasonId: tournament.seasonId,
                        type: 'playoff',
                        teams: [],
                        grids: [{title: 'Основная сетка', teams: []}],
                        title: 'Плейофф'
                    })

                    stages.push(po)
                    break
                case 'mixed':
                    const grs = await request('put', 'stages', null, {
                        tournamentId: tournament._id,
                        federationId: federationId,
                        leagueId: tournament.league._id,
                        seasonId: tournament.seasonId,
                        type: 'groups',
                        teams: tournament.teams.map(t => ({_id: t._id})),
                        title: 'Групповой этап'
                    })
                    stages.push(grs)

                    const _po = await request('put', 'stages', null, {
                        tournamentId: tournament._id,
                        leagueId: tournament.league._id,
                        federationId: federationId,
                        seasonId: tournament.seasonId,
                        type: 'playoff',
                        teams: [],
                        grids: [{title: 'Основная сетка', teams: []}],
                        title: 'Плейофф'
                    })

                    stages.push(_po)
                    break
            }

            toast.show({severity: 'success', summary: 'Успешно', detail: 'Стадии турнира созданы'})
            return stages
        } catch(e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось создать стадии турнира'})
        }
    },
    pushTeamToTour: async (tournamentId, data, mode, toast) => {
        try {
            /*const squad = await request('put', 'squads', null, {
                teamId: data._id,
                tournamentId: tournamentId,
                players: mode === 'empty' || !data.latestSquad ? [] : [...data.latestSquad.players],
                openDate: moment().format('YY-MM-DD')
            })

            if(squad && squad._id) {
                await request('put', 'tournaments', tournamentId, {push: ['teams', data._id]})
                toast.show({severity: 'success', summary: 'Успешно', detail: 'Команда добавлена в турнир!'})

                return squad
            } else {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось создать заявку команды'})
            }*/
            const body = {
                teamId: data._id,
                tournamentId: tournamentId,
                players: mode === 'empty' ? [] : mode,
                openDate: moment().format('YY-MM-DD')
            }
            const res = await request('post', 'pushTeamToTournament', null, body)
            if (toast) {
                if (res.success) {
                    toast.show({severity: 'success', summary: 'Успешно', detail: 'Команда добавлена в турнир!', life: 1000})
                } else {
                    toast.show({severity: 'error', summary: 'Ошибка', detail: 'Не удалось применить метод', life: 1000})
                }
            }

            return res.success ? {_id: res.squadId || res.queryId, ...body} : null;

        } catch(e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось добавить команду в турнир'})
        }
    },
    renameTournament: async (id, name, toast, append=false, internalName) => {
        if(!append && (!name || name.length < 3)) {
            toast.show({severity: 'error', detail: 'Некорректное имя'})
        } else {
            try {
                await request('put', 'tournaments', id, {[append ? 'appendMarker' : 'name']: name})
                toast.show({severity: 'success', summary: 'Успешно', detail: 'Имя турнира сохранено'})
                const nav = await request('get', 'getNav')
                const relatedNavItemIdx = nav ? nav.findIndex(node => node._id === id || (node.children && node.children.find(ch => ch._id === id))) : -1
                if(relatedNavItemIdx > -1) {
                    const patched = nav.map(node => ({
                        ...node,
                        name: id === node._id ? internalName : node.name,
                        children: node.children ? node.children.map(ch => ({
                            ...ch,
                            name: id === ch._id ? internalName : ch.name
                        })) : null
                    }))

                    await request('post', 'postNav', null, {navs: patched});
                }
                return
            } catch(e) {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось переименовать турнир'})
            }
        }
    },
    updFinishedState: async (id, state, toast) => {
        try {
            await request('put', 'tournaments', id, state ? {finished: true, addonsAllowed: false} : {finished: false})
            toast.show({severity: 'success', summary: 'Успешно', detail: 'Статус турнира изменён'})
            return
        } catch(e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось изменить статуc турнира'})
        }
    },
    simpleUpdate: async (id, patch, toast) => {
        try {
            await request('put', 'tournaments', id, patch)
            toast.show({severity: 'success', summary: 'Успешно', detail: 'Настройки турнира изменены'})
            return
        } catch(e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось изменить настройки турнира'})
        }
    },
    calendarDraftV1: async (stageId, toast, isRandomTeams) => {
        try {
            const draft = await axios.post(`${ENDPOINT}v1/unscoped/calendarDraft`, {
                stageId: stageId,
                isRandomTeams: isRandomTeams
            });
            console.log('draft', draft.data);
            return draft.data
        } catch(e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось сгенерировать черновик'})
        }
    },
    calendarDraftV2: async (req) => {
        const { stageId, toast, isRandomTeams=0, reverseCnt = 0, mirrorReverse = 0, fromDB=0 } = req
        try {
            const options = {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn'),
                    signedby: localStorage.getItem('_amateum_tkn')
                }
            }
            const draft = await axios.get(`${ENDPOINT}v2/calendarDraft/${stageId}?isRandomTeams=${isRandomTeams}&reverseCnt=${reverseCnt}&mirrorReverse=${mirrorReverse}&fromDB=${fromDB}`, options);
            console.log('draft2', draft.data);
            return draft.data
        } catch(e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось сгенерировать черновик'})
        }
    },
    getWIPCalendarDraft: async (req) => {
        const { stageId, toast, isRandomTeams=0, reverseCnt = 0, mirrorReverse = 0, fromDB=0 } = req
        try {
            const options = {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn'),
                    signedby: localStorage.getItem('_amateum_tkn')
                }
            }
            const draft = await axios.get(`${ENDPOINT}v2/getWIPCalendarDraft/${stageId}?isRandomTeams=${isRandomTeams}&reverseCnt=${reverseCnt}&mirrorReverse=${mirrorReverse}&fromDB=${fromDB}`, options);
            console.log('draft2', draft.data);
            return draft.data
        } catch(e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось сгенерировать черновик'})
        }
    },
    applyCalendarDraftV2: async (stageId, toast, mds) => {
        try {
            const options = {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn'),
                    signedby: localStorage.getItem('_amateum_tkn')
                }
            }
            const draft = await axios.post(`${ENDPOINT}v2/applyCalendarDraft`, {
                stageId: stageId,
                matchDays: mds
            }, options);
            if (toast) {
                if (draft.data.success) {
                    toast.show({severity: 'success', summary: 'Успешно', detail: 'Календарь сохранен'})
                } else {
                    toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось применить календарь'})
                }
            }
            return draft.data
        } catch(e) {
            if (toast) {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось применить календарь'})
            }
            return null
        }
    },
    cloneSchedule: async (stageId, toast) => {
        try {
            const options = {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn'),
                    signedby: localStorage.getItem('_amateum_tkn')
                }
            }
            const draft = await axios.post(`${ENDPOINT}v2/cloneSchedule`, {
                stageId: stageId
            }, options);
            if (toast) {
                if (draft.data.matchDays) {
                    toast.show({severity: 'success', summary: 'Успешно', detail: 'Календарь сохранен'})
                } else {
                    toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось применить календарь'})
                }
            }
            return draft.data
        } catch(e) {
            if (toast) {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось применить календарь'})
            }
            return null
        }
    },
    cloneSchedulePlayoffRound: async (playoffgridId, toast) => {
        try {
            const options = {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn'),
                    signedby: localStorage.getItem('_amateum_tkn')
                }
            }
            const draft = await axios.post(`${ENDPOINT}v2/cloneSchedulePlayoffRound`, {
                playoffgridId: playoffgridId
            }, options);
            if (toast) {
                if (draft.data) {
                    toast.show({severity: 'success', summary: 'Успешно', detail: 'Календарь сохранен'})
                } else {
                    toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось применить календарь'})
                }
            }
            return draft.data
        } catch(e) {
            if (toast) {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось применить календарь'})
            }
            return null
        }
    },
    applyCalendarGridDraft: async (grid, toast) => {
        try {
            const options = {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn'),
                    signedby: localStorage.getItem('_amateum_tkn')
                }
            }
            const draft = await axios.post(`${ENDPOINT}v2/applyCalendarGridDraft`, {
                stageId: grid.playoffId,
                playoffgridId: grid._id,
                matchdays: grid.matchdays && grid.matchdays.length ? grid.matchdays.map(md => ({...md, matches: md.matches.map(m => ({_id: m._id, homeId: m.homeId, awayId: m.awayId, matchdayId: m.matchdayId}))})).filter(md => md.matches && md.matches.length) : null
            }, options);
            if (toast) {
                if (draft.data.success) {
                    toast.show({severity: 'success', summary: 'Успешно', detail: 'Календарь сохранен'})
                } else {
                    toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось применить календарь'})
                }
            }
            return draft.data
        } catch(e) {
            if (toast) {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось применить календарь'})
            }
            return null
        }
    },
    addLocationSlot: async (locationId, tournamentId, toast) => {
        try {
            await request('put', 'slots', null, {locationId: locationId, tournamentId: tournamentId, ranges: {}})
            return
        } catch (e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось добавить площадку'})
        }
    },
    removeLocationSlot: async (_id, toast) => {
        try {
            await request('delete', 'slots', _id)
            toast.show({severity: 'success', summary: 'Успешно', detail: 'Площадка удалена'})
            return
        } catch(e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось удалить площадку'})
        }
    },
    addLocationSlotRanges : async (slotId, ranges, toast) => {
        try {
            await request('put', 'slots', slotId, {ranges})
            return
        } catch (e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось добавить площадку'})
        }
    },
}

export default service
