import React, {useEffect, useState} from 'react'
import { Tag } from 'primereact/tag';
import { Tooltip } from 'primereact/tooltip';
import { Button } from 'primereact/button'

import './style.scss'

const ItemPlayer = ({ mode, item, disqualification, player='', setNum, nums, activeTab = null, addToBasic, setPlayer=()=>{}, idx, className='', playerItem, close, playerBlock, eventObj, event, setEvent, exists=false, red=false, activeMeny =()=>{}  }) => {
    const obj = eventObj
    const [number, setNumber] = useState('')
    const [active, setActive] = useState(true)
    const [initNum, setInitNum] = useState(false)
    const [isDupl, setIsDupl] = useState(false)
    const [actNums, setActNums] = useState(nums || null)

    const activePlayer = eventObj && eventObj.player && eventObj.player._id && eventObj.player._id === item._id ? true : false
    const activeAssist = eventObj && eventObj.assistant && eventObj.assistant._id && eventObj.assistant._id === item._id ? true : false
    const activeSubstitution = eventObj && eventObj.substitution && eventObj.substitution._id === item._id ? true : false

    const isDizablePlayer = activePlayer && playerBlock==='open' ||  activeAssist && playerBlock === 'assis' || activePlayer && playerBlock === 'goal' || activeSubstitution &&  playerBlock==='out' || activePlayer && playerBlock === 'replacement'  ? true : false

    useEffect(()=>{
        if(!initNum) {
            let numberReg = item ? item.number ? item.number.toString().replace(/\D/g,"") : item.num ? item.num.toString().replace(/\D/g,"") : '' : '';
            setNumber(numberReg)
            setInitNum(true)
            if (nums && nums.length) {
                setActNums(nums)
                setIsDupl(nums.filter(n => n.num === numberReg).length > 1)
            }
        } else {
            if (nums && nums.length) {
                setActNums(nums)
                setIsDupl(nums.filter(n => n.num === number).length > 1)
            }
        }
    }, [item, nums])

    const onClickItem = (idx, item, activeTab) =>{
        setPlayer(idx)
        if (activeTab === 'arrangement' && addToBasic) {
            addToBasic(item)
        } else {
            if(playerBlock==='goal'){
                playerItem({...obj, player:item, number:item.num})
                if(obj.owngoal){close(false)}else{close('assis')}
            }

            if(playerBlock==='assis'){
                playerItem({...obj, assistant: item, assist: item.num})
                close(false)

            }
            if(playerBlock === "replacement"){
                playerItem({...obj, player: item, number:item.num})
                close('out')
            }
            if(playerBlock === "out"){

                playerItem({...obj, substitution: item, sub: item.num})
                close(false)
                activeMeny(true)

            }
            if(playerBlock === 'open'){
                playerItem({...obj, player: item})
                close(false)
                activeMeny(true)
            }
        }
    }

    useEffect(()=>{
        let el = document.getElementById('element')
        if(el){
            el.scrollIntoView()
        }
    },[playerBlock])

    return  (
        <div className={`item__player_block ${idx === player ? 'active' : ''} ${className} ${isDizablePlayer ? '' : "dizable"}`} onClick={()=> onClickItem(idx, item, activeTab)} id={ isDizablePlayer ? "element" : null } >

            <div className='block__name'>{item.surname} {item.name}</div>

            {className === '' ? <span className='block__middlename'>{item.middlename || ' '}</span> : null}

            {mode === 'dreamlineups' ? <span className='block__team'>{item.teams.map(i => i.name) || ' '}</span> : null}

            {exists ? <Tag value="в основе" icon="pi pi-star"></Tag> : null}

            {disqualification ? <Tag severity='danger' value={disqualification} icon='pi pi-bolt'></Tag> : null}

            {item.fromExtras ? <Tag severity='warning' value='из сквозной заявки' icon='pi pi-bolt'></Tag> : null}

            {red ? active ? (
                    <span
                        className={`block__number ${isDupl ? 'invalid':''}`}
                        id='input'
                        onClick={()=> setActive(false)}
                    >{number === ''? "БН" : number}</span>
                ) : (
                    <input
                        className={`block__number ${isDupl ? 'invalid':''}`}
                        value={ number || ''}
                        onChange={(e) => {
                            const num = e.target.value;

                            if (actNums && actNums.length) {
                                const patched = actNums.map(n => n.indx === idx ? {...n, num: num} : n);

                                const filtred = patched.filter(n => n.num === num);
                                const len = filtred.length
                                //console.log('len > 1', len, len > 1, num, actNums, patched, filtred );
                                setActNums(patched);
                                setIsDupl( len > 1)
                            }
                            setNumber(num)
                        }}
                        onBlur={() => {
                            // console.log('ONBLUR', isDupl);
                            // if (!isDupl) {
                            //     console.log('setNum', number);
                            //     setNum(number)
                            // }
                            setNum(number)
                        }}
                        autoFocus
                    />
                ) : (<div className={`block__number ${isDupl ? 'invalid':''}`}>{number === ''? "БН" : number}</div>)
            }
            {activePlayer && playerBlock === 'goal' ?
                <i
                    className='pi pi-times-circle'
                    onClick={(e)=> {e.stopPropagation(); playerItem({...eventObj, player:null})}}
                />
                : null}
            {activeAssist && playerBlock === 'assis'  ?
                <i
                    className='pi pi-times-circle'
                    onClick={(e)=> {e.stopPropagation(); playerItem({...eventObj, assistant:null})}}
                />
                : null}
        </div>

        )
}


export default ItemPlayer
