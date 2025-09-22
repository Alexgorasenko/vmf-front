import React, { useState } from 'react'

import { AutoComplete } from 'primereact/autocomplete'
import { ENDPOINT } from '../../../env'
import axios from 'axios'
import moment from 'moment'

const TagsControl = ({ type, value, updateTagsPost, placeholder }) => {

    const [suggestions, setSuggestions] = useState([]);

    const mapdValue = value ? value.map(m => (
        {
            ...m,
            info: type === 'matches' ? `${m.home.name} VS ${m.away.name} | ${moment(m.date, 'YY-MM-DD').format('DD.MM.YY')}` : type === 'players' ? `${m.surname} ${m.name}` : `${m.name}`
        }
    )) : null

    const searchData = (evt) => {
        //console.log('searchData', type, evt, evt.query);
        if (evt && evt.query && evt.query.length > 1) {
            axios.get(`${ENDPOINT}v2/${type === 'players' ? 'suggestPlayer' : 'suggestData'}?query=${evt.query}&type=${type}`, {
                headers: {
                    Authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            }).then(resp => {
                if(resp.data) {
                    const mapdValues = mapdValue && mapdValue.length ? mapdValue.map(s => s._id.toString()) : [];

                    const mapd = resp.data.filter(data => !mapdValues.includes(data._id.toString())).map(m => (
                        {
                            ...m,
                            info: type === 'matches' ? `${m.home.name} VS ${m.away.name} | ${moment(m.date, 'YY-MM-DD').format('DD.MM.YY')}` : type === 'players' ? `${m.surname} ${m.name}` : `${m.name}`
                        }
                    ))

                    //const sugst = mapd;

                    //setSuggestions(suggestions ? {...suggestions, ...sugst} : sugst)
                    setSuggestions(mapd)
                    //toastRef.current.show({severity: 'success', summary: 'Успешно!', detail: 'Данные получены'})
                } else {
                    setSuggestions([])
                    //toastRef.current.show({severity: 'error', summary: 'Данные не были получены', detail: 'Ошибка сервера. Пожалуйста, сообщите в поддержку'})
                }
            })
        } else {
            setSuggestions([])
        }
    }


    return  <AutoComplete
                inputClassName='p-inputtext-sm'
                placeholder={placeholder}
                value={mapdValue}
                suggestions={suggestions}
                completeMethod={searchData}
                field="info"
                multiple
                onChange={(e) => updateTagsPost(type, e.value)}
                aria-label="tags"
            />
}

export default TagsControl
