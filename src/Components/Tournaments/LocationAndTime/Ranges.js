import {Chips} from "primereact/chips";
import React, {useEffect} from "react";
import service from "../service";

const rangesDefault = {
    'mon': [],
    'tue': [],
    'wed': [],
    'thu': [],
    'fri': [],
    'sat': [],
    'sun': []
}

const struct = [
    {label: 'Понедельник', wd: 'mon'},
    {label: 'Вторник', wd: 'tue'},
    {label: 'Среда', wd: 'wed'},
    {label: 'Четверг', wd: 'thu'},
    {label: 'Пятница', wd: 'fri'},
    {label: 'Суббота', wd: 'sat'},
    {label: 'Воскресенье', wd: 'sun'}
]

const Ranges = ({slot, updateSlots, toast}) => {

    useEffect(() => {
        if (!slot.ranges) {
            slot.ranges={...rangesDefault}
        }
    }, [slot])

    const customInput = (slot, day, e) => {
        switch (e.target.value.length){
            case 1:
                if (!new RegExp(/[0-2]$/).exec(e.target.value)){
                    e.target.value = ''
                }
                break
            case 2:
                if (new RegExp(/^(0[0-9]|1[0-9]|2[0-3])$/).exec(e.target.value)){
                    e.target.value += `:`
                } else e.target.value = e.target.value.slice(0,-1)
                break
            case 4:
                if (!new RegExp(/^(0[0-9]|1[0-9]|2[0-3]):[0-5]$/).exec(e.target.value)){
                    e.target.value = e.target.value.slice(0,-1)
                }
                break
            case 6:
                e.target.value = e.target.value.slice(0,-1)
                break
        }
    }

    const updateRanges = (slot, day, time) => {
        const re = new RegExp(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)
        const result = time.value.map(v => {
            return re.exec(v)
        })
        if(result.findIndex(r => !r) === -1 || time.originalEvent.type === 'click'){
            slot.ranges[day] = time.value.sort((a,b) => a > b ? 1 : -1)
            service.addLocationSlotRanges(slot._id, slot.ranges, toast).then()
            updateSlots()
        } else toast.current.show({ severity: 'error', summary: 'Ошибка', detail: 'Введите правильное время', life: 3000 });
    }

    return struct.map(item => (
        <div className='p-inputgroup chips-container' key={item.wd}>
            <span className='p-inputgroup-addon'>{item.label}</span>
            <span className='p-float-label'>
                <Chips
                    onInput={(e) => customInput(slot, item.wd, e)}
                    placeholder={'--:--'} keyfilter={`num`}
                    value={slot.ranges && slot.ranges[item.wd] ? slot.ranges[item.wd].sort((a,b) => a > b ? 1 : -1) : null}
                    onChange={(e) => updateRanges(slot, item.wd, e)}/>
            </span>
        </div>
    ))
}

export default Ranges