import React from 'react'

import BackgroundBlackGold from './img/achievement-black-gold.svg'
import GoldStar from './img/achievement-star-gold.svg'
import GoldStarNonAcrive from './img/achievement-star-gold-non-active.svg'
import GoalGold from './img/achievement-goal-gold.svg'
import AssistGold from './img/achievement-assist-gold.svg'
import MvpGold from './img/achievement-mvp-gold.svg'
import MatchesGold from './img/achievement-matches-gold.svg'
import LineupsGold from './img/achievement-lineups-gold.svg'

import BackgroundTeam from './img/achievement-team.svg'
import StarTeam from './img/achievement-star-team.svg'
import StarTeamNonAcrive from './img/achievement-star-team-non-active.svg'
import GoalTeam from './img/achievement-goal-team.svg'
import AssistTeam from './img/achievement-assist-team.svg'
import MvpTeam from './img/achievement-mvp-team.svg'
import MatchesTeam from './img/achievement-matches-team.svg'
import LineupsTeam from './img/achievement-lineups-team.svg'

import BackgroundTournament from './img/achievement-tournament.svg'
import StarTournament from './img/achievement-star-tournament.svg'
import StarTournamentNonAcrive from './img/achievement-star-tournament-non-active.svg'
import GoalTournament from './img/achievement-goal-tournament.svg'
import AssistTournament from './img/achievement-assist-tournament.svg'
import MvpTournament from './img/achievement-mvp-tournament.svg'
import MatchesTournament from './img/achievement-matches-tournament.svg'
import LineupsTournament from './img/achievement-lineups-tournament.svg'

import './style.scss'

const Achievement = ({size, sample, scope, value, grade}) => {

    let background, star, starNonActive, icon, color;

    switch (sample) {
        case 'career':
            background = BackgroundBlackGold;
            star = GoldStar;
            starNonActive = GoldStarNonAcrive;
            color = 'color1'
            switch (scope) {
                case 'goals':
                    icon = GoalGold;
                    break
                case 'assists':
                    icon = AssistGold;
                    break
                case 'mvps':
                    icon = MvpGold;
                    break
                case 'matches':
                    icon = MatchesGold;
                    break
                case 'lineups':
                    icon = LineupsGold;
                    break
            }
            break
        case 'team':
            background = BackgroundTeam;
            star = StarTeam;
            starNonActive = StarTeamNonAcrive;
            color = 'color2'
            switch (scope) {
                case 'goals':
                    icon = GoalTeam;
                    break
                case 'assists':
                    icon = AssistTeam;
                    break
                case 'mvps':
                    icon = MvpTeam;
                    break
                case 'matches':
                    icon = MatchesTeam;
                    break
                case 'lineups':
                    icon = LineupsTeam;
                    break
            }
            break
        case 'tournament':
            background = BackgroundTournament;
            star = StarTournament;
            starNonActive = StarTournamentNonAcrive;
            color = 'color3'
            switch (scope) {
                case 'goals':
                    icon = GoalTournament;
                    break
                case 'assists':
                    icon = AssistTournament;
                    break
                case 'mvps':
                    icon = MvpTournament;
                    break
                case 'matches':
                    icon = MatchesTournament;
                    break
                case 'lineups':
                    icon = LineupsTournament;
                    break
            }
            break
    }

    return (
        <div className={'achievement'} style={{width: size, height: size}}>
            <div className={'shape'}>
                <img src={background} className={'background'}/>
                <img src={icon} className={'icon'}/>
            </div>
            <div className={'number'} style={{fontSize: size/6.5}}>
                <div className={`text1 ${color}`}>{value}</div>
                <div className={`text2`}>{value}</div>
                <div className={`text3 ${color}`}>{value}</div>
                <div className={`text4 ${color}`}>{value}</div>
                <div className={`text5 ${color}`}>{value}</div>
                <div className={`text6 ${color}`}>{value}</div>
            </div>
            <div className={'stars'} style={{width: size/1.5}}>
                <img src={grade >= 1 ? star : starNonActive} style={{width: '73%', marginRight: '10%'}}/>
                <img src={grade >= 2 ? star : starNonActive} style={{width: '73%', marginTop: '17%'}}/>
                <img src={grade >= 3 ? star : starNonActive} style={{width: '73%', marginLeft: '10%'}}/>
            </div>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@500&display=swap');
            </style>
        </div>
    )
}

export default Achievement
