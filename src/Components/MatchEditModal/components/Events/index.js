import React, { useState, useEffect, useContext } from 'react'

import { MatchContext } from '../../ctx'

import { InputSwitch } from 'primereact/inputswitch'
import { InputNumber } from 'primereact/inputnumber'
import { Button } from 'primereact/button'

import ItemEvent from '../../ItemEvent/index'
import ItemPlayer from '../../ItemPlayer/index'

import InitScore from './InitScore'
import GoalsController from './GoalsController'
import SecondaryController from './SecondaryController'
import PublishMatch from './PublishMatch'
import Controller from './Controller'

import './style.scss'

const inners = [InitScore, GoalsController, Controller, PublishMatch]

const Events = () => {
    const [step, setStep] = useState(0)

    const Specified = inners[step] || null

    return  <div className='events-controller'>
                {Specified ? <Specified setStep={setStep} currentStep={step} /> : null}
            </div>
}

export default Events
