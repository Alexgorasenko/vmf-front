import React, {useEffect, useState} from 'react'
import { Inplace, InplaceDisplay, InplaceContent } from 'primereact/inplace';
import { InputNumber } from 'primereact/inputnumber';
import './style.scss'



const Numberboard = ({ onChange=()=>{}, editing=true, number }) => {

    const [text, setText] = useState(number);

    useEffect(()=>{
        setText(number)
    },[])


    const handleChange =(e)=>{
        setText(e)
    }

    return  <div className="numberboard">
                {editing ?
                    <Inplace>
                    <InplaceDisplay>
                        {text}
                    </InplaceDisplay>
                    <InplaceContent>
                        <InputNumber value={text} onChange={(e) => handleChange(e.value)} autoFocus />
                    </InplaceContent>

                </Inplace> : <span className="numberboard__number">{number==='' ? 0 : number}</span>}
            </div>
}


export default Numberboard
