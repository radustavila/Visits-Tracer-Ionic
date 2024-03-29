import axios from 'axios'
import { authConfig, baseUrl, getLogger, withLogs } from '../../core';
import { VisitProps } from '../props/VisitProps'


const log = getLogger('visitApi')
const visitUrl = `http://${baseUrl}/api/visits`

export const getVisits: (token: string, page: number, limit: number, filter: number, lastUpdated: string) 
=> Promise<VisitProps[]> = (token, page, limit, filter, lastUpdated) => {
    let query = ''
    if (page && limit && filter === 0) {
        query = `?page=${page}&limit=${limit}`
    } else if (filter !== 0) {
        query = `?filter=${filter}`
    }
    return withLogs(axios.get(`${visitUrl}${query}`, authConfig(token, lastUpdated)), 'getAllVisits')
}

export const getListNoPersons: (token: string, lastUpdated: string) => Promise<any> = (token, lastUpdated) => {
    return withLogs(axios.get(`${visitUrl}/no-persons`, authConfig(token, lastUpdated)), 'getListNoPersons')
}

export const createVisit: (token: string, visit: VisitProps) => Promise<VisitProps[]> = (token, visit) => {
    return withLogs(axios.post(`${visitUrl}`, visit, authConfig(token)), 'createVisit')
}

export const updateVisit: (token: string, visit: VisitProps) => Promise<VisitProps[]> = (token, visit) => {
    return withLogs(axios.put(`${visitUrl}/${visit._id}`, visit, authConfig(token)), 'updateVisit')
}

export const checkServer: (token: string) => Promise<any> = (token) => {
    return withLogs(axios.get(`${visitUrl}/check-server`, authConfig(token)), 'check server').then(res => {return res})
}

interface MessageData {
    type: string
    payload: VisitProps
}

export const newWebSocket = (token: string, onMessage: (data: MessageData) => void) => {
    const ws = new WebSocket(`ws://${baseUrl}`)
    ws.onopen = () => {
        log('web socket onopen');
        ws.send(JSON.stringify({ type: 'authorization', payload: { token } }))
    }
    ws.onclose = () => {
        log('web socket onclose');
    }
    ws.onerror = e => {
        log('web socket onerror', e);
    }
    ws.onmessage = messageEvent => {
        log('web socket onmessage');
        onMessage(JSON.parse(messageEvent.data))
    }
    return () => {
        ws.close()
    }
}
