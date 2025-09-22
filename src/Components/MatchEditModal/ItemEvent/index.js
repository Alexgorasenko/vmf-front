import React, {useEffect, useState, useRef} from 'react'
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { ConfirmPopup } from 'primereact/confirmpopup';
import { Button } from 'primereact/button'
import { OverlayPanel } from 'primereact/overlaypanel';
import { confirmPopup } from 'primereact/confirmpopup';

import moment from 'moment'

import './style.scss'

const classEvent =[
    {name:'Гол с игры', value: 'goal'},
    {name:'С пенальти', value: 'penalty'},
    {name:'Со штрафного', value: 'freeKick'},
    {name:'Незабитый пенальти', value: 'missedPenalty'}
]

const ItemEvent = ({ item, onSelected, isActive, patchEvent, eraseEvent, secondary }) => {
    const [visible, setVisible] = useState(false)

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

   const panelRef = useState()

   const isOwnGoal = typeof(item.owngoal) === 'undefined' ? false : item.owngoal

    return  (
            <div className='item__event'>
                <div className={`item__event_block ${isActive ? "active" : ''} `} >
                    <div className="item__event_block_time">
                        <div className='block__time'>
                            <span className='block__time_title'>минута</span>
                            <InputNumber value={item.minute || 0} onValueChange={(e) => patchEvent('minute', e.value)}/>
                        </div>
                        <div onClick={() => onSelected()}>
                            <div className='block__event_name' >
                                <div className='name__executor'>
                                    <span className='name__executor_title'>{item.freeKick || item.subtype === 'standart' ? 'Гол со штрафного' : item.penalty || item.subtype === 'penalty' ? 'С пенальти' : item.missedPenalty ? 'Незабитый пенальти' : item.owngoal ? 'Автогол соперника' : 'Гол с игры'}</span>
                                    <span className="name__executor_player" >{item.player ? `${item.player.surname} ${item.player.name}` : "игрок не указан"}</span>
                                </div>
                                {!item.owngoal && item.subtype !== 'penalty' && !item.penalty && !item.missedPenalty ? (
                                    <div className='name__assistant'>
                                        <span className='name__assistant_title'>Ассистент</span>
                                        <span className='name__assistant_player' >{item.assistant ? `${item.assistant.surname} ${item.assistant.name}` : "игрок не указан"}</span>
                                    </div>
                                ) : null}
                            </div>
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
                    </div>

                    <ConfirmPopup
                        target={document.getElementById(`button${item.id}`)}
                        visible={visible}
                        onHide={() => setVisible(false)}
                        message={`Удалить событие?${!item.missedPenalty ? ' Счет игры изменится' : ''}`}
                        icon="pi pi-exclamation-triangle"
                        accept={accept}
                        acceptLabel='Да, удалить'
                        rejectLabel='Отмена'
                    />

                    <i className='pi pi-times-circle' onClick={()=>setVisible(true)} id={`button${item.id}`}></i>
                </div>

                {isActive ?
                    <div className='item__event_block_addition'>
                        <div className='addition__switch'>
                            <InputSwitch checked={isOwnGoal} onChange={() => patchEvent('owngoal', !isOwnGoal)} />
                            <label>Автогол соперника?</label>
                        </div>
                        {!isOwnGoal && <Dropdown value={item.subtype || Object.keys(item).find(k => ['penalty', 'missedPenalty', 'freeKick'].includes(k) && item[k]) || 'goal'} options={classEvent} onChange={e => patchEvent(e.value, true)} optionLabel="name" />}

                    </div> : null }

            </div>
    )
}


export default ItemEvent
