import React, { useState, useContext, useRef, useEffect } from 'react'

import { MatchContext } from '../../../ctx'

import { InputMask } from 'primereact/inputmask'
import { OverlayPanel } from 'primereact/overlaypanel'

import './EventItem.scss'

import { secondary, selectorLabels } from './refs'

const PersonSelector = ({ selected, side, onCleaned, onSelected, label, isHeadQuarter }) => {
    const ctx = useContext(MatchContext)
    const opRef = useRef()

    const source = ctx.form[side+'Roster'] ? ctx.form[side+'Roster'][isHeadQuarter ? 'headquarters' : 'players'] : null

    return  source && source.length ? (
                <div className='person-select'>
                    <div className='person-trigger'>
                        <div
                            className='icon'
                            onClick={e => selected ? onCleaned() : opRef.current.toggle(e)}
                        >
                            <i className={`pi pi-${selected ? 'times' : 'plus'}`}></i>
                        </div>
                        <label>{label}</label>
                    </div>
                    <OverlayPanel ref={opRef} className='event-person-options'>
                        {source.map((p, i) => (
                            <div
                                className='option'
                                key={i}
                                onClick={e => {
                                    onSelected({...p})
                                    opRef.current.toggle(e)
                                }}
                            >{p.surname} {p.name}</div>
                        ))}
                    </OverlayPanel>
                </div>
            ) : null
}

const EventItem = ({ data, side, onErase, patchEvent }) => {
    const [form, setForm] = useState({})
    const typeItem = data.direct ? secondary.find(t => t.path === data.path && t.attrs && t.attrs.direct) : secondary.find(t => t.path === data.path)

    useEffect(() => {
        setForm({...data})
    }, [data])

    const selectorsSet = () => {
        //рендер селекторов. массив определяется типом события
        const renderer = set => {
            return set.map((subj, i) => {
                        const patchForm = (form, person) => {
                            const patch = subj === 'headquarter' ? {
                                headquarter: {...person},
                                player: null
                            } : {
                                headquarter: null,
                                [subj]: {...person}
                            }

                            patchEvent({...form, ...patch})
                            return {...form, ...patch}
                        }

                        return  <PersonSelector
                                    key={i}
                                    selected={form[subj]}
                                    side={side}
                                    onCleaned={() => {
                                        setForm({...form, [subj]: null})
                                        patchEvent({...form, [subj]: null})
                                    }}
                                    onSelected={person => setForm(patchForm(form, person))}
                                    label={selectorLabels[subj]}
                                    isHeadQuarter={subj === 'headquarter'}
                                />
                    })
        }

        let set = []
        if(typeItem) {
            switch(typeItem.path) {
                case 'yc':
                case 'rc':
                    set = ['player', 'headquarter']
                    break
                case 'sub':
                    set = ['playerIn', 'playerOut']
                    break
                default:
                    set = ['player']
            }
        }

        return renderer(set)
    }

    //вывод отображаемого значения в подвале карточки
    const renderValue = (addon=false) => {
        let key

        if(typeItem) {
            switch(typeItem.path) {
                case 'yc':
                case 'rc':
                    key = addon ? 'headquarter' : 'player'
                    break
                case 'sub':
                    key = addon ? 'playerOut' : 'playerIn'
                    break
            }
        }

        return key && form[key] ? form[key].name+' '+form[key].surname : null
    }

    return  <div className='event-item'>
                <div className='del-trigger' onClick={() => onErase()}>
                    <i className='pi pi-times'></i>
                </div>

                <div className='row'>
                    <div className='minute-input'>
                        <InputMask
                            value={form.minute}
                            mask='9?9'
                            slotChar=''
                            unmask={true}
                            onChange={e => {
                                setForm({...form, minute: e.value})
                                patchEvent({...form, minute: e.value})
                            }}
                        />
                    </div>

                    <div className='event-type'>
                        <div className='icon'>
                            <img src={typeItem.icon} />
                        </div>
                        <div className='desc'>{typeItem.label}</div>
                    </div>

                    {selectorsSet()}
                </div>

                <div className='row'>
                    <div className='minute-input'><label>минута</label></div>
                    <div className='event-type _value'></div>
                    <div className='person-select _value'>{renderValue()}</div>
                    <div className='person-select _value'>{renderValue(true)}</div>
                </div>
            </div>
}

export default EventItem
