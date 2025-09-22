import React, {useEffect, useState} from "react";

import {Draggable} from "react-beautiful-dnd";
import {Link, useLocation} from "react-router-dom";
import {Tag} from "primereact/tag";
import moment from "moment/moment";
import styled from "styled-components";
import Ball from '../../../assets/img/soccer-ball.png'
import { Button } from 'primereact/button'

import axios from 'axios';
import { ENDPOINT } from '../../../env'
import {Tooltip} from "primereact/tooltip";

const Container = styled.div`
  width: ${props => props.isDragDisabled ? 'auto' : '30px'};
  display: grid;
  justify-content: center;
`

function getStyle(style, snapshot) {
    if (!snapshot.isDropAnimating) {
        return style;
    }
    const { moveTo, curve, duration } = snapshot.dropAnimation;
    const translate = `translate(${moveTo.x + 5}px, ${moveTo.y}px)`;
    const rotate = 'rotate(1turn)';

    return {
        ...style,
        transform: `${translate} ${rotate}`,
        opacity: 0,
        transition: `transform ${curve} ${duration + 0.35}s, opacity 0.9s`,
    };
}

const RefinementsDefault = {
    1: 'pi pi-bolt',
    2: 'pi pi-star',
    3: 'pi pi-users',
    4: 'pi pi-id-card'
}

const TooltipForRefinements = {
    1: 'Не заполнен счет',
    2: 'Не заполнены авторы голов',
    3: 'Не заполнен персонал',
    4: 'Не заполнен состав'
}

const MatchItem = ({match, index, subject}) => {
    const [loading, setLoading] = useState(false);
    let location = useLocation();

    const useRefinements = subject.federationId === '63720deb3d69d811c73373e5'
    const [refinements, setRefinements] = useState([])

    useEffect(() => {
        if (useRefinements) {
            const newRefinements = []
            if (match){
                if (!match.score && match.score === null){
                    newRefinements.push(1)
                } else {
                    if (!match.isFullGoalEvents){
                        newRefinements.push(2)
                    }
                }
                if (!match.employees || match.employees.length === 0){
                    newRefinements.push(3)
                }
                if (!match.rosters || match.rosters.length === 0 || match.rosters.length !== 2 || (match.rosters[0].players === 0 && match.rosters[1].players === 0)){
                    newRefinements.push(4)
                }
                setRefinements(newRefinements)
            }
        }
    }, [match])

    const downloadSheet = async () => {
        setLoading(true)
        const tkn = localStorage.getItem('_amateum_subject_tkn')

        const body = {
            federationId: null,
            tournamentId: null,
            minDate: null,
            maxDate: null,
            matchId: match._id
        };

        try {
            const response = await axios.post(
                `${ENDPOINT}v2/getZipPdfProtocols`,
                body,
                {responseType: 'arraybuffer',
                headers: {
                    'Accept': 'application/octet-stream',
                    'Authorization': tkn
                }}
            )

            if(!response.error && response.succes !== false ) {
                setLoading(false)
                const blob = new Blob([response.data], {type: 'application/octet-stream'})
                const link = document.createElement('a')
                link.href = window.URL.createObjectURL(blob)
                link.download = `${match.homeName}_${match.awayName}_${moment(match.date, 'YY-MM-DD').format('DD.MM.YY')}.pdf`
                link.click()
            }
        } catch (e) {
            console.log('get protocols failed', e);
        }
    }

    return <Draggable key={match._id} draggableId={match._id} index={index} isDragDisabled={!!match.date}>
        {(provided, snapshot) => (
            <Container
                {...provided.draggableProps}
                ref={provided.innerRef}
                isDragDisabled={!!match.date}
                isDragging={snapshot.isDragging && !snapshot.isDropAnimating}
                style={getStyle(provided.draggableProps.style, snapshot)}
            >
                {
                    match.score || match.date ? <Link
                            to={{
                                pathname: `/schedule?editmatch=${match._id}`,
                                state: { background: location }
                            }}
                            style={{color: 'inherit', textDecoration: 'inherit', display: 'flex', alignItems: 'center', justifyContent:'center'}}
                        >
                            <div className={'match'} style={{background: (index%2 !== 0) ? 'none' : '#F6F9FC'}}>
                                <Button
                                    className='p-button p-button-sm btn-create sheet-trigger'
                                    icon='pi pi-file'
                                    loading={loading}
                                    onClick={e => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        downloadSheet();
                                    }}
                                />
                                <div className='refinements-group'>
                                    {refinements ? refinements.map(r => [
                                        <Tooltip target={`.tooltip${r}`}/>,
                                        <i
                                            className={`tooltip${r} ${RefinementsDefault[r]}`}
                                            data-pr-tooltip={TooltipForRefinements[r]}
                                            data-pr-position='left'
                                        />
                                    ]) : null}
                                </div>
                                <div className={'text-1'}>{match.homeName}</div>
                                <div className={'text-2'}>{match.score ? <Tag>{match.score}</Tag> : match.date ? <div>
                                    <div className='match-time'>{match.time}</div>
                                    <div className='match-date'>{moment(match.date, 'YY-MM-DD').format('D MMMM')}</div>
                                </div> : '🆚'}</div>
                                <div className={'text-3'}>{match.awayName}</div>
                            </div>
                        </Link>
                        :
                        <div
                            className={'match'}
                            style={{
                                background: snapshot.isDragging ? 'none' : (index%2 !== 0) ? 'none' : '#F6F9FC',
                                transition: 'background 0.25s'
                            }}
                        >
                            <div className={'text-1'}
                                 style={{
                                     opacity: snapshot.isDragging ? 0 : 1,
                                     transition: 'opacity 0.25s, max-width 1s',
                                     maxWidth: snapshot.isDragging ? 'calc((100% - 200px)/2)' : 'calc((100% - 100px)/2)'
                                }}
                            >
                                {match.homeName}
                            </div>
                            <div className={'text-2'}{...provided.dragHandleProps}>
                                {snapshot.isDragging ? <img src={Ball}/> : '🆚'}
                            </div>
                            <div className={'text-3'}
                                 style={{
                                     opacity: snapshot.isDragging ? 0 : 1,
                                     transition: 'opacity 0.25s, max-width 1s',
                                     maxWidth: snapshot.isDragging ? 'calc((100% - 200px)/2)' : 'calc((100% - 100px)/2)'
                                }}
                            >
                                {match.awayName}
                            </div>
                        </div>
                }
            </Container>
        )}
    </Draggable>
}

export default MatchItem
