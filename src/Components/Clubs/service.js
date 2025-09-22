import axios from 'axios'
import { ENDPOINT } from '../../env'
import moment from 'moment'

const request = async (method, collection, id, body) => {
    const options = {
        headers: {
            authorization: localStorage.getItem('_amateum_subject_tkn'),
            SignedBy: localStorage.getItem('_amateum_tkn')
        }
    }
    //console.log('request', method, collection, id, body, 'options', options);
    const resp = await axios[method](`${ENDPOINT}v2/${collection}/${id || ''}`, (['get', 'delete'].includes(method) ? options : body || {}), options)
    //console.log('request resp', resp.data)

    return resp.data
}

const service = {
    saveData: async (collection, data, toast) => {
            try {
                const res = await request('put', collection, null, data)
                if (res && res._id) {
                    if (toast) {
                        toast.show({severity: 'success', summary: 'Успешно', detail: 'Данные сохранены!', life: 1000})
                    }
                    return res
                } else {
                    if (toast) {
                        toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось создать запись', life: 1000})
                    }

                    return null
                }
            } catch (e) {
                console.log('save error', data, e);
                if (toast) {
                    toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось загрузить данные', life: 1000})
                }

                return null
            }
    },
    convertBase64: (file) => {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file)
            fileReader.onload = () => {
                resolve(fileReader.result);
            }
            fileReader.onerror = (error) => {
                reject(error);
            }
        })
    },
    removeData: async (collection, id, toast) => {
            try {
                const res = await request('delete', collection, id)
                if (res) {
                    if (toast) {
                        toast.show({severity: 'success', summary: 'Успешно', detail: 'Данные удалены!', life: 1000})
                    }
                    return res
                } else {
                    if (toast) {
                        toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось удалить запись', life: 1000})
                    }

                    return null
                }
            } catch (e) {
                console.log('remove error', id, e);
                if (toast) {
                    toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось удалить данные', life: 1000})
                }

                return null
            }
    },
    pushTeamToTour: async (body, toast) => {
        const {tournamentId, teamId, openDate, players, manage} = body
        //console.log('serv.push', body) //tournamentId, data, manage, mode, !!toast);
        try {
            const res = await request('post', 'pushTeamToTournament', null, body)
            if (toast) {
                if (res.success) {
                    toast.show({severity: 'success', summary: 'Успешно', detail: 'Команда добавлена в турнир!', life: 1000})
                } else {
                    toast.show({severity: 'error', summary: 'Ошибка', detail: 'Не удалось применить метод', life: 1000})
                }
            }

            return res
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
        } catch(e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось добавить команду в турнир'})
        }
    },
    renameDoc: async (id, name, collection, toast) => {
        if(!name || name.length < 3) {
            toast.show({severity: 'error', detail: 'Некорректное имя'})
        } else {
            try {
                await request('put', collection, id, {name: name})
                toast.show({severity: 'success', summary: 'Успешно', detail: 'Название сохранено'})
                return
            } catch(e) {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось переименовать запись'})
            }
        }
    },
    simpleUpdate: async (id, patch, collection, toast) => {
        try {
            await request('put', collection, id, patch)
            if (toast) {
                toast.show({severity: 'success', summary: 'Успешно', detail: 'Данные изменены'})
            }
            return
        } catch(e) {
            console.log('upd faild', e);
            if (toast) {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось изменить данные'})
            }
        }
    },
    upload: async ({decoded, target='clubs', asRaw = true, toast}) => {
        try {
            const uploaded = await axios.post(`${ENDPOINT}v1/common/upload`, {
                target: target,
                base64Data: decoded,
                asRaw: asRaw
            })
            if ( uploaded && uploaded.data ) {
                toast.show({severity: 'success', summary: 'Успешно', detail: 'Эмблема загружена'})
            } else {
                toast.show({severity: 'error', summary: 'Успешно', detail: 'Эмблема не загружена'})
            }
            return uploaded.data
        } catch (e) {
            console.log('err upload', e);
            toast.show({severity: 'error', summary: 'Успешно', detail: 'Эмблема не загружена'})
        }
    },
    attachment: async ({decoded, toast}) => {
        try {
            const res = await request('post', 'attachment', null, {
                base64Data: decoded
            })
            if (toast) {
                toast.show({severity: 'success', summary: 'Успешно', detail: 'Данные изменены'})
            }
            //console.log('res attachment', res);
            return res
        } catch(e) {
            console.log('upd faild', e);
            if (toast) {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось изменить данные'})
            }
        }
    },
    removeAccess: async (scopeId, toast) => {
        try {
            const resp = await axios.post(`${ENDPOINT}v1/store/remove`, {
                target: 'scopes',
                _id: scopeId
            })
            if(resp.data) {
                return resp.data
            } else {
                return null
            }
        } catch (e) {
            console.log('removeAccess faild', e);
            return null
        }
    },
    addAccess: async (clubId, userId, toast) => {
        try {
            const scop = {
                scope: 'readWrite',
                subjectType:'club',
                subjectId: clubId,
                userId: userId
            };
            const scope = await service.saveData('scopes', scop, toast);
            return scope
        } catch (e) {
            console.log('addAccess faild', e);
            return null
        }
    },
    getUser: async (phone, name, toast) => {
        try {
            const res = await axios.post(`${ENDPOINT}v1/unscoped/usersByPhone`, {
                phone: phone
            })
            //console.log('usersByPhone',res, phone );
            if (res && res.data) {
                if (res.data.length) {
                    return res.data[0]
                } else {
                    return res.data
                }
            } else {
                const user = await service.saveData('users', {
                    name: name,
                    phone: phone
                }, toast);
                return user
            }
        } catch (e) {
            console.log('getUser faild', e);
            return null
        }
    }
}

export default service
