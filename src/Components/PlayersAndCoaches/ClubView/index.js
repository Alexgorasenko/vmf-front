import React, {useEffect, useRef, useState} from "react";
import axios from "axios";
import {ENDPOINT} from "../../../env";
import {InputText} from "primereact/inputtext";
import CustomScrollbars from "react-custom-scrollbars-2";
import PlayerCard from "../PlayerCard";
import SelectedItem from "../SelectedItem";
import Image1 from "../../../assets/img/image 11.svg";

const ClubView = ({toast}) => {
    //const toast = useRef(null)
    const [playersArray, setPlayersArray] = useState([])
    const [searchString, setSearchString] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null)

    useEffect(() => {
        axios.get(`${ENDPOINT}v2/list/players`, {
            headers: {
                authorization: localStorage.getItem('_amateum_subject_tkn')
            }
        }).then(
            resp => {
                setPlayersArray(resp.data.players)
            }
        )
    }, [localStorage.getItem('_amateum_subject_tkn')])

    const patchItem = (p) => {
        setPlayersArray(playersArray.map(pl => pl._id && p._id.toString() === pl._id.toString() ? {...p} : pl))
    }

    return <div>
        <div className={'name-input'}>
            <span className="p-input-icon-right">
                <InputText placeholder={'Поиск игрока'} className={'input'} value={searchString} onChange={(e) => setSearchString(e.target.value)} />
            </span>
        </div>
        <div className={'content'}>
            <div className={'search-result'}>
                <div className={'row'}>
                    <CustomScrollbars autoHide width={'auto'} autoHeight autoHeightMin={`calc(100vh - 300px)`} >
                        {playersArray.filter(p => (p.name + p.middlename + p.surname).includes(searchString)).map(player => {
                            return <PlayerCard
                                key={player._id}
                                selected={selectedPlayer && selectedPlayer._id && selectedPlayer._id.toString() === player._id.toString()}
                                setSelectedPlayer={setSelectedPlayer}
                                player={player}
                                clubView={true}
                            />
                        })}
                    </CustomScrollbars>
                </div>
            </div>
            {selectedPlayer
                ?  <CustomScrollbars className='item-bar' autoHide autoHeight autoHeightMin='calc(100vh - 80px)'>
                    <SelectedItem
                        selected={selectedPlayer}
                        patchItem={patchItem}
                        toast={toast}
                        clubView={true}
                    />
                </CustomScrollbars>
                : <div className={'side-notes'}>
                    <img src={Image1} className={'image1'}/>
                    <div className={'rectangle-4'}>
                        <ul role="list" className={'text'}>
                            <li>
                                Кликните на карточку игрока для редактирования
                            </li>
                        </ul>
                    </div>
                </div>
            }
        </div>
    </div>
}

export default ClubView
