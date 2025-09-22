import axios from 'axios'
import { ENDPOINT } from '../../../env'

const options = {
    headers: {
        authorization: localStorage.getItem('_amateum_subject_tkn'),
        SignedBy: localStorage.getItem('_amateum_tkn')
    }
}

const request = async (method, collection, id, body) => {
    const resp = await axios[method](`${ENDPOINT}v2/${collection}${id ? '/'+id : ''}`, (['get', 'delete'].includes(method) ? options : body || {}), options)
    return resp.data
}

const service = {
    simpleUpdate: async (col, id, patch, toast) => {
        try {
            const res = await request('put', col, id, patch)
            if (toast) {
                if (res) {
                    toast.show({severity: 'success', summary: 'Успешно', detail: 'Данные изменены', life: 1000})
                } else {
                    toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось изменить данные', life: 1000})
                }
            }
            //console.log('simpleUpdate', res.data);
            return res
        } catch(e) {
            console.log('upd faild', e);
            if (toast) {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось изменить данные', life: 1000})
            }
            return null
        }
    },
    disquals: async (tid, toast) => {
        try {
            const resp = await request('get',`list/disquals${tid ? `?tournamentId=${tid}` : ''}`)

            return resp
        } catch(e) {
            console.log('disquals failed', e);
            if (toast) {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не получить данные', life: 1000})
            }
            return null
        }
    },
    playerSquads: async (fid, playerId, isHeads=false) => {
        try {
            const body = {
                subjectId: fid,
                playerId: playerId,
            }
            if (isHeads) {
                body.isHeads= true
            }
            const resp = await axios.post(`${ENDPOINT}v1/unscoped/playerSquads`, body)

            return resp.data
        } catch(e) {
            alert('Failed loading playerSquads')
        }
    },
    sendDisq: async (dis, toast) => {
        try {
            // const resp = await axios.post(`${ENDPOINT}store/entity`, {
            //     scopeType: 'disqualifications',
            //     target: 'self',
            //     body: dis
            // })
            const resp = await request('put',`disqualifications`, dis._id || null, dis)
            if (toast) {
                if (resp._id || resp.success) {
                    toast.show({severity: 'success', summary: 'Успешно', detail: 'Данные сохранены', life: 1000})
                } else {
                    toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось сохранить данные', life: 1000})
                }
            }

            return resp

        } catch(e) {
            console.log('error saveDisqual', e);
            if (toast) {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось сохранить данные', life: 1000})
            }
            return null
        }
    }
}

export default service
