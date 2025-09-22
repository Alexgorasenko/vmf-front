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
    }
}

export default service
