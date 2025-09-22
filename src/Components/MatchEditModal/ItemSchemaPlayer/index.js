import React, {useEffect,useState} from 'react'

import './style.scss'

const ItemSchemaPlayer = ({ item, active }) => {

    const [num, setNum] = useState('');
    const [surname, setSurname] = useState('');
    const [act, setAct] = useState(false)

    useEffect(() => {
        setAct(active);
        if (item) {
            setNum(item.num ? item.num : item.number ? item.number : '')
            setSurname(item.surname || '')
        }
    }, [item, active])

    return  (
        <div className={`tactic__img_block ${act ? 'active' : (num || surname) ? 'fill' : 'empty'}`} >
            {act ? <i className='pi pi-user'></i> : (num || surname) ? [
            <span className='tactic-num' key='num'>{num || 'БН'}</span>,
            <span className='tactic-surname' key='surname'>{surname}</span>
        ] : <i className='pi pi-clock'></i>}
        </div>
    )
}

export default ItemSchemaPlayer
