import React, {useEffect, useState} from 'react'
import { Inplace, InplaceDisplay, InplaceContent } from 'primereact/inplace';
import { InputNumber } from 'primereact/inputnumber';
import './style.scss'



const Scoreboard = ({ number=0, editing=true, onChange, id}) => {
    const [text, setText] = useState(number || 0)
    const [active, setActive]= useState(false)

    const handleChange =(e)=>{
        if(!isNaN(parseInt(e))) {
            setText(e)
            onChange(parseInt(e))
        }
    }

    return  <div className={`scoreboard ${active ? 'active': ''}`}>
                <div className={`scoreboard__block ${active ? 'active': ''}`}></div>
                {editing ?
                    <Inplace closable={true} onOpen={()=>setActive(true)}>
                    <InplaceDisplay>
                        {text}
                    </InplaceDisplay>
                    <InplaceContent>
                        <InputNumber value={text} onChange={(e) => handleChange(e.value)} autoFocus min={0} />
                    </InplaceContent>

                </Inplace> : <span className="scoreboard__number">{number==='' ? 0 : number}</span>}
            </div>
}


export default Scoreboard
