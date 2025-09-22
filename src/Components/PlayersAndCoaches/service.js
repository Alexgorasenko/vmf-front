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
                toast.show({severity: 'success', summary: 'Успешно', detail: 'Данные изменены', life: 1000})
            }
            //console.log('simpleUpdate', res.data);
            return res.data
        } catch(e) {
            console.log('upd faild', e);
            if (toast) {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось изменить данные', life: 1000})
            }
            return null
        }
    },
    clearGlobal: async (id, toast) => {
        try {
            const res = await axios.get(`${ENDPOINT}v2/clearGlobal/${id}`, options)
            if (toast) {
                if (res.data && res.data.success) {
                    toast.show({severity: 'success', summary: 'Успешно', detail: 'Данные изменены', life: 1000})
                } else {
                    toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось изменить данные', life: 1000})
                }
            }
            //console.log('simpleUpdate', res.data);
            return res.data
        } catch(e) {
            console.log('upd faild', e);
            if (toast) {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось изменить данные', life: 1000})
            }
            return null
        }
    },
    upload: async ({decoded, target='players', trim = false, toast, asRaw=true}) => {
        try {
            const uploaded = await axios.post(`${ENDPOINT}v1/common/upload`, {
                target: target,
                base64Data: decoded,
                asRaw: asRaw
                // trim: true,
                // getThumb: true
            })
            /*if (toast) {
                if ( uploaded && uploaded.data ) {
                    toast.show({severity: 'success', summary: 'Успешно', detail: 'Фото загружено'})
                } else {
                    toast.show({severity: 'error', summary: 'Успешно', detail: 'Фото не загружено'})
                }
            }*/
            return uploaded.data
        } catch (e) {
            console.log('err upload', e);
            if (toast) {
                toast.show({severity: 'error', summary: 'Ошибка', detail: 'Фото не загружено'})
            }
            return null
        }
    },
    sendDisq: async ({target='self', dis, toast}) => {
        try {
            const resp = await axios.post(`${ENDPOINT}v1/store/entity`, {
                target: target,
                scopeType: 'disqualifications',
                body: dis
            })
            /*if ( uploaded && uploaded.data ) {
                toast.show({severity: 'success', summary: 'Успешно', detail: 'Фото загружено'})
            } else {
                toast.show({severity: 'error', summary: 'Успешно', detail: 'Фото не загружено'})
            }*/
            return resp.data
        } catch (e) {
            console.log('err upload', e);
            /*toast.show({severity: 'error', summary: 'Успешно', detail: 'Фото не загружено'})*/
        }
    },
    mergePlayers: async (targetPlayer, duplicates, toast) => {
        try {
            const filtred = duplicates.filter(item => targetPlayer._id.toString() !== item._id.toString())
            if (filtred && filtred.length) {
                let mergeSucces = true;
                const targetId = targetPlayer._id;
                for (let i=0; i<filtred.length; i++) {
                    const sourceId = filtred[i]._id;
                    //const resp = await axios.post(`${ENDPOINT}v1/unscoped/mergePlayers`, {
                    const resp = await axios.post(`${ENDPOINT}v2/mergePlayers`, {
                        // targetPlayer: targetPlayer,
                        // duplicates: filtred
                        sourceId: sourceId,
                        targetId: targetId
                    }, options)

                    console.log('mergePlayers', resp.data);

                    if (resp.data) {

                        if (!resp.data.success) {
                            mergeSucces = false;
                            break;
                        }
                    } else {
                        mergeSucces = false;
                        break;
                    }
                }
                if (toast) {
                    if (mergeSucces) {
                        toast.show({severity: 'success', summary: 'Успешно', detail: 'Данные обновлены', life: 1000})
                    } else {
                        toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось изменить данные', life: 1000})
                    }
                }
                return {success: mergeSucces}
            } else {
                toast.show({severity: 'error', detail: 'дубли не найдены', life: 1000})
                return {error: true, msg: 'дубли не найдены'}
            }

        } catch(e) {
            //alert('Failed loading playerSquads')
            console.log('Failed mergePlayers', e);
            return {error: true, msg: 'method failed'}
        }
    }
}

export default service
