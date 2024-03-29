import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { login as loginApi } from './AuthApi';
import { Plugins } from '@capacitor/core';


const log = getLogger('AuthProvider')

type LoginFn = (username?: string, password?: string) => void

export interface AuthState {
    authenticationError: Error | null
    isAuthenticated: boolean
    isAuthenticating: boolean
    login?: LoginFn
    pendingAuthentication?: boolean
    username?: string
    password?: string
    token: string
}

const initialState: AuthState = {
    isAuthenticated: false,
    isAuthenticating: false,
    authenticationError: null,
    pendingAuthentication: false,
    token: ''
}

export const AuthContext = React.createContext<AuthState>(initialState)



interface AuthProviderProps {
    children: PropTypes.ReactNodeLike
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const { Storage } = Plugins
    const [ state, setState ] = useState<AuthState>(initialState)
    const { isAuthenticated, isAuthenticating, authenticationError, pendingAuthentication, token } = state
    const login = useCallback<LoginFn>(loginCallback, []);

    useEffect(authenticationEffect, [pendingAuthentication])
    const value = { isAuthenticated, login, isAuthenticating, authenticationError, token }
    
    log('render')
    return (
        <AuthContext.Provider value = { value }>
            { children }
        </AuthContext.Provider>
    )


    function loginCallback(username?: string, password?: string): void {
        log('login')
        setState({
            ...state,
            pendingAuthentication: true,
            username,
            password
        })
    }

    function authenticationEffect() {
        let canceled = false

        alreadyLoggedIn()
        authenticate()
        
        return () => {
            canceled = true
        }
        
        async function alreadyLoggedIn() {
            const res = await Storage.get({ key: 'user' })
            if (res.value) {
                log('User logged in already!')
                const user = JSON.parse(res.value)
                setState({
                    ...state,
                    token: user.token,
                    isAuthenticated: true,
                    pendingAuthentication: false
                })
            } else {
                log('No user logged in!')
            }
        }
    


        async function authenticate() {
            if (!pendingAuthentication) {
                log('authenticate, !pendingAuth, return')
                return
            }
            try {
                log('authenticate... ')
                setState({
                    ...state,
                    isAuthenticating: true
                })
                const { username, password } = state
                const { token } = await loginApi(username, password)
                if (canceled) {
                    return
                }
                log('authenticate succeeded')
                setState({
                    ...state,
                    token,
                    pendingAuthentication: false,
                    isAuthenticated: true,
                    isAuthenticating: false
                })
                
                await Storage.set({
                    key: 'user',
                    value: JSON.stringify({
                        token: token
                    })
                })
                log('save user succeeded')
            } catch (error) {
                if (canceled) {
                    return
                }
                log('authenticate failed')
                setState({
                    ...state,
                    authenticationError: error,
                    pendingAuthentication: false,
                    isAuthenticating: false
                })
            }
        }
    }

}