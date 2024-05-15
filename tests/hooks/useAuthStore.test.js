import { configureStore } from "@reduxjs/toolkit";
import { authSlice } from "../../src/store/auth/authSlice";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAuthStore } from "../../src/hooks/useAuthStore";
import { Provider } from "react-redux";
import { authenticatedState, initialState, notAuthenticatedState } from "../fixtures/authStates";
import { testUserCredentials } from "../fixtures/testUser";
import { calendarApi } from "../../src/api";


const getMockStore = ( initialState ) => {
    return configureStore({
        reducer: {
            auth: authSlice.reducer,
        },
        preloadedState: {
            auth: { ...initialState},
        }
    })
}

describe('Pruebas en useAuthStore', () => {

    beforeEach(() => localStorage.clear())


    test('debe de regresar los valores por defecto', () => {
        
        const mockStore = getMockStore({...initialState})
        const { result } = renderHook( () => useAuthStore(), {
            wrapper: ({children}) => <Provider store={ mockStore }>{children}</Provider>
        });

        expect(result.current).toEqual( {
            status: 'checking',
            user: {},
            errorMessage: undefined,
            checkAuthToken: expect.any(Function),
            startLogin: expect.any(Function),
            startLogout: expect.any(Function),
            startRegister: expect.any(Function)
          });
    });

    test('startLogin debe de realizar el checking', () => {
        
        localStorage.clear();
        const mockStore = getMockStore({...notAuthenticatedState})
        const { result } = renderHook( () => useAuthStore(), {
            wrapper: ({children}) => <Provider store={ mockStore }>{children}</Provider>
        });

        act(() => {
            result.current.startLogin( testUserCredentials )
        });

        const { errorMessage, user, status } = result.current
        expect({ errorMessage, status, user }).toEqual({...initialState})

       

    });

    test('startLogin debe de realizar el login correctamente', async() => {
        localStorage.clear();
        const mockStore = getMockStore({...notAuthenticatedState})
        const { result } = renderHook( () => useAuthStore(), {
            wrapper: ({children}) => <Provider store={ mockStore }>{children}</Provider>
        });

        await act(async() => {
            await result.current.startLogin( testUserCredentials )
        });

        const { errorMessage, user, status } = result.current
        expect({ errorMessage, status, user }).toEqual({
            status: 'authenticated',
            user: { name: 'Test User', uid: '664357386700dd757587b8d1' },
            errorMessage: undefined,
        })
        expect(localStorage.getItem('token')).toEqual( expect.any(String))
        expect(localStorage.getItem('token-init-date')).toEqual( expect.any(String))
    });

    test('startLogin debe de fallar la autenticacion ', async() => {
        
        localStorage.clear();
        const mockStore = getMockStore({...notAuthenticatedState})
        const { result } = renderHook( () => useAuthStore(), {
            wrapper: ({children}) => <Provider store={ mockStore }>{children}</Provider>
        });

        await act(async() => {
            await result.current.startLogin({ email: 'google@mail.com', password: '123456789'})
        });

        const { errorMessage, user, status } = result.current

        expect(localStorage.getItem('token')).toBe(null)
        expect({ errorMessage, user, status }).toEqual({
            errorMessage: 'Credentiales Incorrectas',
            user: {},
            status: 'not-authenticated'
        })

        await waitFor( 
            () => expect(result.current.errorMessage).toBe(undefined) 
        )
    })

    test('startRegister debe de crear un usuario', async() => {

        const newUser = { email: 'algo@mail.com', password: '123456789', name: 'algo'}

        const mockStore = getMockStore({...notAuthenticatedState})
        const { result } = renderHook( () => useAuthStore(), {
            wrapper: ({children}) => <Provider store={ mockStore }>{children}</Provider>
        });

        const spy = jest.spyOn( calendarApi, 'post' ).mockReturnValue({
            data: {
                "ok": true,
                "uid": "345345532532",
                "name": "Test User",
                "token": "algun-token"
            }
        })

        await act(async() => {
            await result.current.startRegister( newUser )
        });

        const { errorMessage, user, status } = result.current
        expect({ errorMessage, user, status }).toEqual({
            errorMessage: undefined,
            user: { name: 'Test User', uid: '345345532532' },
            status: 'authenticated'
        })

        spy.mockRestore();
    });

    test('startRegister debe de fallar la creacion', async() => {


        const mockStore = getMockStore({...notAuthenticatedState})
        const { result } = renderHook( () => useAuthStore(), {
            wrapper: ({children}) => <Provider store={ mockStore }>{children}</Provider>
        });

        await act(async() => {
            await result.current.startRegister( testUserCredentials )
        });

        const { errorMessage, user, status } = result.current

        expect({
            errorMessage: 'Un usuario existe con ese correo',
            user: {},
            status: 'not-authenticated'
        })

    });

    test('checkAuthToken debe de fallar si no hay token', async() => {
        const mockStore = getMockStore({...initialState})
        const { result } = renderHook( () => useAuthStore(), {
            wrapper: ({children}) => <Provider store={ mockStore }>{children}</Provider>
        });

        await act(async() => {
            await result.current.checkAuthToken()
        });

        const { errorMessage, user, status } = result.current
        expect({ errorMessage, user, status }).toEqual({
            errorMessage: undefined,
            user: {},
            status: 'not-authenticated'
        })
    });

    test('checkAuthToken debe de autenticar el usuario si hay un token', async() => {
        
        const { data } = await calendarApi.post('/auth', testUserCredentials);
        localStorage.setItem('token', data.token );

        const mockStore = getMockStore({...initialState})
        const { result } = renderHook( () => useAuthStore(), {
            wrapper: ({children}) => <Provider store={ mockStore }>{children}</Provider>
        });

        await act(async() => {
            await result.current.checkAuthToken()
        });

        const { errorMessage, user, status } = result.current
        expect({ errorMessage, user, status }).toEqual({
            errorMessage: undefined,
            user: { name: 'Test User', uid: '664357386700dd757587b8d1' },
            status: 'authenticated'
        })

    });

    test('checkAuthToken debe de dar error si token esta vencido', async() => {
        localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI2NjQzNTczODY3MDBkZDc1NzU4N2I4ZDEiLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWF0IjoxNzE1NzA5NTIwLCJleHAiOjE3MTU3MTY3MjB9.CCmyLQqOAzWAAzmysPUWDp2OJlPhdqResXmGTEGiPw0');

        const mockStore = getMockStore({...initialState})
        const { result } = renderHook( () => useAuthStore(), {
            wrapper: ({children}) => <Provider store={ mockStore }>{children}</Provider>
        });

        await act(async() => {
            await result.current.checkAuthToken()
        });

        const { errorMessage, user, status } = result.current
       
        expect({ errorMessage, user, status }).toEqual({
            errorMessage: undefined, user: {}, status: 'not-authenticated' 
        })
        expect(localStorage.getItem('token')).toBe(null)
    });

    test('startLogout debe de limpiar el localStorage', async() => {
        
        const mockStore = getMockStore({...authenticatedState})
        const { result } = renderHook( () => useAuthStore(), {
            wrapper: ({children}) => <Provider store={ mockStore }>{children}</Provider>
        });
        
        await act(async() => {
            await result.current.startLogout()
        });


        const { errorMessage, status, user } = result.current

        expect({errorMessage, status, user}).toEqual({
            errorMessage: undefined, status: 'not-authenticated', user: {} 
        })
        expect(localStorage.getItem('token')).toBe(null)

    });
});
