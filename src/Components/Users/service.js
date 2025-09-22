import axios from 'axios'
import { ENDPOINT } from '../../env'

const options = {
    headers: {
        authorization: localStorage.getItem('_amateum_subject_tkn'),
        SignedBy: localStorage.getItem('_amateum_tkn')
    }
}

const request = async (method, collection, id, body) => {
    const resp = await axios[method](`${ENDPOINT}v2/${collection}/${id || ''}`, (['get', 'delete'].includes(method) ? options : body || {}), options)
    return resp.data
}

const service = {
    simpleUpdate: async (id, patch, toast) => {
        try {
            const res = await axios.put(`${ENDPOINT}v2/players/${id}`, patch, options)
            if (toast) {
                toast.show({severity: 'success', summary: 'Успешно', detail: 'Данные изменены'})
            }
            //console.log('simpleUpdate', res.data);
            return res.data
        } catch(e) {
            console.log('upd faild', e);
            if (toast) {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось изменить данные'})
            }
            return null
        }
    },
    resetPin: async (id, toast) => {
        try {
            const res = await axios.put(`${ENDPOINT}v2/users/${id}`, {token: null}, options)
            if (toast) {
                toast.show({severity: 'success', summary: 'Успешно', detail: 'Пин-код сброшен'})
            }
            return res.data
        } catch(e) {
            if (toast) {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось сбросить пин-код'})
            }
            return null
        }
    },
    upload: async ({decoded, target='players', trim = true, toast}) => {
        try {
            const uploaded = await axios.post(`${ENDPOINT}v1/common/upload`, {
                target: target,
                base64Data: decoded,
                trim: trim
            })
            if (toast) {
                if ( uploaded && uploaded.data ) {
                    toast.show({severity: 'success', summary: 'Успешно', detail: 'Фото загружено'})
                } else {
                    toast.show({severity: 'error', summary: 'Успешно', detail: 'Фото не загружено'})
                }
            }
            return uploaded.data
        } catch (e) {
            console.log('err upload', e);
            if (toast) {
                toast.show({severity: 'error', summary: 'Ошибка', detail: 'Фото не загружено'})
            }
        }
    },
    saveData: async (form, col, toast) => {
        try {
            const res = form._id ? await axios.put(`${ENDPOINT}v2/${col}/${form._id}`, form, options) : await axios.put(`${ENDPOINT}v2/${col}`, form, options)

            if (toast) {
                if (res && res.data && (res.data.success || res.data._id)) {
                    toast.show({severity: 'success', summary: 'Успешно', detail: 'Данные изменены'})
                } else {
                    toast.show({severity: 'error', summary: 'Ошибка', detail: 'Не удалось изменить данные'})
                }
            }
            //console.log('simpleUpdate', res.data);
            return res.data
        } catch(e) {
            console.log('upd faild', e);
            if (toast) {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось изменить данные'})
            }
            return null
        }
    },
    removeData: async (col, id, toast ) => {

        try {
            const res = await request('delete', col, id)
            console.log('res remove', col, id, res);

            if (toast) {
                if (res && res.success) {
                    toast.show({severity: 'success', summary: 'Успешно'})
                } else {
                    toast.show({severity: 'error', summary: 'Ошибка'})
                }
            }
            //console.log('simpleUpdate', res.data);
            return res
        } catch(e) {
            console.log('upd faild', e);
            if (toast) {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось изменить данные'})
            }
            return null
        }
    },
    archive: async (id, toast) => {
        try {
            const res = await axios.put(`${ENDPOINT}v2/employees/${id}`, {archived: true}, options)

            if (toast) {
                if (res && res.data && res.data.success) {
                    toast.show({severity: 'success', summary: 'Успешно', detail: 'Данные изменены'})
                } else {
                    toast.show({severity: 'error', summary: 'Ошибка', detail: 'Не удалось изменить данные'})
                }
            }
            return res.data
        } catch (e) {
            console.log('upd faild', e);
            if (toast) {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось изменить данные'})
            }
            return null
        }
    }
}

export default service
