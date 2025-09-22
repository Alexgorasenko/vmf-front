import axios from "axios";
import {ENDPOINT} from "../../../env";

const request = async (method, id, body) => {
    const options = {
        headers: {
            authorization: localStorage.getItem('_amateum_subject_tkn'),
            signedby: localStorage.getItem('_amateum_tkn')
        }
    }
    const resp = await axios[method](`${ENDPOINT}v2/dreamlineups/${id || ''}`, (['get', 'delete'].includes(method) ? options : body || {}), options)
    return resp.data
}

const service = {
    createDreamLineup : async (body, toast) => {
        try {
            const resp = await request('put', '', body)
            if (!resp.error) {
                toast.show({severity: 'success', summary: 'Успешно', detail: 'Сборная добавлена'})
            } else {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось добавить сборную'})
            }
            return !resp.error
        } catch (e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось добавить сборную'})
        }
    },
    updateDreamLineup : async (id, body, toast) => {
        try {
            const resp = await request('put', id, body)
            if (resp.success) {
                toast.show({severity: 'success', summary: 'Успешно', detail: 'Сборная обновлена'})
            } else {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось обновить сборную'})
            }
            return resp.success
        } catch (e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось обновить сборную'})
        }
    },
    deleteDreamLineup : async (id, toast) => {
        try {
            const resp = await request('delete', id)
            if (resp.success) {
                toast.show({severity: 'success', summary: 'Успешно', detail: 'Сборная удалена'})
            } else {
                toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось удалить сборную'})
            }
            return resp.success
        } catch (e) {
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось удалить сборную'})
        }
    },
}

export default service