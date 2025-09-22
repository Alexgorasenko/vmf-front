import React, {useRef} from 'react'

import './style.scss'

import {Toast} from "primereact/toast";
import FederationView from "./FederationView";
import ClubView from "./ClubView";

const PlayersAndCoaches = ({ subject, layout }) => {
    const toast = useRef(null)

    /*const fileUploadRef = useRef(null);*/

    const clubView = (subject && subject.type === 'club')

    /*const cancelOptions = {label: 'Удалить фото', icon: 'pi pi-times-circle', className: 'p-button-danger'};

    const headerTemplate = (options) => {
        const { className, chooseButton, cancelButton } = options;

        return (
            <div className={className} style={{backgroundColor: 'transparent', display: 'flex', alignItems: 'center'}}>
                {chooseButton}
                {cancelButton}
            </div>
        );
    }*/

    return (
        <div className={'players-and-coaches'}>
            <Toast ref={toast}></Toast>
            {
                !clubView ? <FederationView layout={layout} toast={toast.current}/> : <ClubView layout={layout} toast={toast.current}/>
            }
        </div>
    )
}

export default PlayersAndCoaches
