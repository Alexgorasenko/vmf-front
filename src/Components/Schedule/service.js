import axios from "axios";
import {ENDPOINT} from "../../env";
import moment from "moment/moment";

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
    updateMatches: async (id, body, toast) => {
        try {
            const resp = await axios.put(`${ENDPOINT}v2/matches/${id}`, body, options)
            if(resp.data) {
                return resp.data
            } else {
                return null
            }
        } catch (e){
            toast.show({severity: 'error', summary: 'Ошибка сервера', detail: 'Не удалось обновить расписание'})
        }
    }
}

export default service
