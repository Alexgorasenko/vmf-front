import React, { useState } from 'react'

import { PersonForm } from '../../Atoms'

import './headquarters.scss'

const Headquaters = ({ data, setter, editable=false }) => {
    return  <div className="headquarters">
                <PersonForm
                    display='row'
                    subjectType='headquarter'
                    data={null}
                    squadState={null}
                    setter={obj => setter(data.concat([obj]))}
                    editable={true}
                    allPersons={data}
                />

                {data.map(({squadState, ...person}, i) => (
                    <PersonForm
                        key={i}
                        display='row'
                        subjectType='headquarter'
                        remove={obj => {
                            const filtred = data.filter(p => !p.id || p.id !== obj.id)
                            console.log('REMOVE', obj, data, 'filtred', filtred);
                            setter(filtred)
                        }}
                        data={person}
                        squadState={squadState}
                        setter={obj => setter(data.map((row, idx) => idx === i ? {...row, ...obj} : row))}
                        editable={editable}
                    />
                ))}
            </div>
}

export default Headquaters
