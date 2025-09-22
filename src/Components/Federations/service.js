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
    removeData: async (_id, toast, col='groups') => {
        try {
            await request('delete', col, _id)
            toast.show({severity: 'success', summary: 'Успешно', detail: 'Данные удалены'})
            return
        } catch(e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось удалить'})
        }
    },
    patchData: async (id, col, patch, toast) => {
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
    }
}

export default service
