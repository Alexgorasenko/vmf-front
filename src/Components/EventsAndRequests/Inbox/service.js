import axios from 'axios'
import { ENDPOINT } from '../../../env'
import moment from 'moment'

const request = async (method, collection, id, body) => {
    const options = {
        headers: {
            authorization: localStorage.getItem('_amateum_subject_tkn'),
            SignedBy: localStorage.getItem('_amateum_tkn')
        }
    }
    //console.log('options', options.headers.authorization);
    const resp = await axios[method](`${ENDPOINT}v2/${collection}${id ? `/${id}` : ''}`, (['get', 'delete'].includes(method) ? options : body || {}), options)
    return resp.data
}

const service = {
    getInbox: async (toast) => {
        try {
            const res = await request('get',`inbox`)
            if (res) {
                return res
            } else {
                return null
            }
        } catch (e) {
            return null
        }
    },
    getTourns: async () => {
        try {
            const res = await request('get',`list/tournaments`)
            if (res) {
                return res
            } else {
                return null
            }
        } catch (e) {
            return null
        }
    },
    applyQuery: async (patch, toast) => {
        try {
            const res = await request('post',`applyQuery`,null, patch)
            if (res && res.success && res.patch) {
                if (toast) {
                    toast.show({severity: 'success', summary: 'Успешно', detail: 'Данные изменены', life: 2000})
                }
                return res.patch
            } else {
                if (toast) {
                    toast.show({severity: 'error', summary: 'Ошибка', detail: 'Не удалось изменить данные', life: 2000})
                }
                return null
            }
        } catch (e) {
            if (toast) {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось изменить данные', life: 2000})
            }
            return null
        }
    },
    unlinkPlrFromSquad: async (data, toast) => {
        try {
            if (data && data.playerId && data.squadId) {
                const res = await request('post',`unlinkPlrFromSquad`,null, data)
                if (res && res.success) {
                    if (toast) {
                        toast.show({severity: 'success', summary: 'Успешно', detail: 'Игрок отзаявлен', life: 2000})
                    }
                    return res
                } else {
                    if (toast) {
                        toast.show({severity: 'error', summary: 'Ошибка', detail: 'Не удалось отзаявить игрока', life: 2000})
                    }
                    return null
                }
            } else {
                if (toast) {
                    toast.show({severity: 'error', summary: 'Ошибка', detail: 'Не все параметры указаны', life: 2000})
                }
                return null
            }
        } catch (e) {
            console.log('unlinkPlrFromSquad failed', e);
            if (toast) {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось изменить данные', life: 2000})
            }
            return null
        }
    }
}

export default service
