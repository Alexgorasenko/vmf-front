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
    getNav: async (toast) => {
        try {
            const data = await request('get', 'getNav');
            return data
        } catch(e) {
            toast.current.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось обновить настройки стадии', life: 2000})
        }
    },
    postNav: async (nav, toast) => {
        try {
            const data = await request('post', 'postNav', null, {navs: nav});
            if (toast) {
                if (data.success) {
                    toast.current.show({severity: 'success', summary: 'Успешно', detail: 'Настройки изменены', life: 2000})
                } else {
                    toast.current.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось обновить настройки', life: 2000})
                }
            }
            return data

        } catch(e) {
            toast.current.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось обновить настройки стадии', life: 2000})
        }
    },
    /*updateStage: async (id, body, toast) => {
        try {
            const data = await request('put', 'stages', id, body);
            if (toast) {
                if (data.success) {
                    toast.current.show({severity: 'success', summary: 'Успешно', detail: 'Настройки обновлены', life: 2000})
                } else {
                    toast.current.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось обновить', life: 2000})
                }
            }
            return
        } catch(e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось обновить настройки стадии', life: 2000})
        }
    },
    renameGroup: async (_id, name, toast) => {
        try {
            const data = await request('put', 'apps', _id, {name: name});
            if (toast) {
                if (data.success) {
                    toast.current.show({severity: 'success', summary: 'Успешно', detail: 'Название обновлено', life: 2000})
                } else {
                    toast.current.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось обновить', life: 2000})
                }
            }
            return
        } catch(e) {
            toast.current.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось обновить', life: 2000})
        }

    },
    simpleUpdate: async (id, patch, toast) => {
        try {
            const data = await await request('put', 'apps', id, patch)
            if (toast) {
                if (data.success) {
                    toast.current.show({severity: 'success', summary: 'Успешно', detail: 'Настройки турнира изменены', life: 2000})
                } else {
                    toast.current.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось обновить', life: 2000})
                }
            }
            return
        } catch(e) {
            toast.current.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось изменить настройки турнира', life: 2000})
        }
    },*/
}

export default service
