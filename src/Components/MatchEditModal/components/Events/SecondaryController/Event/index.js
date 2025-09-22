import React, {useEffect, useState, useRef } from 'react'
import { InputNumber } from 'primereact/inputnumber';
import Sub from '../../../../../../assets/img/replacenemt.svg'
import Yc from '../../../../../../assets/img/warning.svg'
import RcDirect from '../../../../../../assets/img/delete.svg'
import Rc from '../../../../../../assets/img/secondyellow.png'
import { Dropdown } from 'primereact/dropdown';
import { ConfirmPopup } from 'primereact/confirmpopup';
import { confirmPopup } from 'primereact/confirmpopup';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';

import './style.scss'

import moment from 'moment'

const icons = {
    sub: Sub,
    yc: Yc,
    rc: Rc,
    rcdirect: RcDirect
}

const labels = {
    sub: 'Замена',
    yc: 'Предупреждение',
    rc: 'Удаление за 2ЖК',
    rcdirect: 'Прямое удаление'
}

const rcoptions = [
    {value: 'rc', label: 'Удаление за 2ЖК'},
    {value: 'direct', label: 'Прямое удаление'}
]

const Event = ({ item, isActive, patchEvent, onSelected, eraseEvent }) => {
    const [obj, setObj]= useState(item)
    const [selected, setSelected] = useState(false);
    const [visible, setVisible] = useState(false);

    const panelRef = useRef()

    const accept = () => {
       eraseEvent()
    };

    const confirm2 = (event) => {
       confirmPopup({
           target: event.currentTarget,
           message: 'Счет изменится',
           icon: 'pi pi-info-circle',
           acceptClassName: 'p-button-danger',
           accept,
       });
   };

    return (
            <div className='event' >
                <div className={`event__block ${isActive ? "active" : ''}`} onClick={() => onSelected()}>
                    <div className={`event__block_main`} >
                        <div className='block__main_time'>
                            <span className='block__main_time_title'>минута</span>
                            <InputNumber value={item.minute} onValueChange={(e) => patchEvent('minute', e.value)}/>
                        </div>
                        <div className='block__main_event_name' >
                            <div className='name__executor'>
                                <span className='name__executor_title'>{labels[item.path === 'rc' ? item.direct ? 'rcdirect' : 'rc' : item.path]}</span>
                                <span className="name__executor_player" >{item.playerOut ? `${item.playerOut.surname} ${item.playerOut.name}` : item.player ? `${item.player.surname} ${item.player.name}` : "игрок не указан"}</span>
                            </div>
                            {item.path === 'sub' ?
                                <div className='name__rep'>
                                    <span className='name__rep_title'>Появился на поле</span>
                                    <span className='name__rep_player'> {item.playerIn ? `${item.playerIn.surname} ${item.playerIn.name}` : "игрок не указан"}</span>
                                </div>
                                : null
                             }

                        </div>
                        <img src={icons[item.path === 'rc' ? item.direct ? 'rcdirect' : 'rc' : item.path]} className="block__main_img"/>
                    </div>

                    {item.refinement ? [
                        <Button
                            icon="pi pi-bell"
                            className="p-button-rounded p-button-warning p-button-sm refinement p-button-outlined"
                            aria-label="Возможная корректировка"
                            onClick={e => panelRef.current.show(e)}
                        />,
                        <OverlayPanel
                            ref={panelRef}
                            dismissable
                            showCloseIcon
                            onHide={() => {
                                console.log('Hidden', item)
                            }}
                        >
                            <div className='refinement-content'>
                                <div className='author'>{item.refinement.author}</div>
                                <div className='date'>{moment(item.refinement.timestamp).format('DD.MM.YY HH:mm')}</div>
                                <div className='text'>{item.refinement.content}</div>
                            </div>
                        </OverlayPanel>
                    ] : null}

                    <ConfirmPopup
                        target={document.getElementById(`button${item.id}`)}
                        visible={visible}
                        onHide={() => {
                            setVisible(false);
                        }}
                        message="Удалить событие?"
                        icon="pi pi-exclamation-triangle"
                        accept={accept}
                        acceptLabel='Да, удалить'
                        rejectLabel='Отмена'
                    />

                    <i className='pi pi-times-circle' onClick={()=>setVisible(true)} id={`button${item.id}`}></i>
                </div>

                {(item.path === 'rc' && isActive) && <div className='event__block_addition'>
                    <Dropdown value={item.direct ? 'direct' : 'rc'} options={rcoptions} onChange={e => patchEvent('direct', (e.value === 'direct'))} />
                </div>}
            </div>
    )


}


export default Event
