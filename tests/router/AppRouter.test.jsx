const { render, screen } = require("@testing-library/react");
const { AppRouter } = require("../../src/router/AppRouter");
const { useAuthStore } = require("../../src/hooks/useAuthStore");
const { MemoryRouter } = require("react-router-dom");
const { CalendarPage } = require("../../src/calendar/pages/CalendarPage");

jest.mock('../../src/hooks/useAuthStore.js')
jest.mock('../../src/calendar/pages/CalendarPage.jsx', () => ({
    CalendarPage: () => <h1>CalendarPage</h1>
}))


describe('Pruebas en <AppRouter />', () => {

    const mockCheckAuthToken = jest.fn()
    
    test('debe de mostrar la pantalla de carga y llamar checkAuthToken', () => {
        
        useAuthStore.mockReturnValue({
            status: 'checking',
            checkAuthToken: mockCheckAuthToken
        })
        render( <AppRouter />);

        expect(screen.getByText('Cargando...')).toBeTruthy()
        expect(mockCheckAuthToken).toHaveBeenCalled();
        
    });

    test('debe de mostrar el login en caso de no estar autenticado', () => {
        
        useAuthStore.mockReturnValue({
            status: 'not-authenticated',
            checkAuthToken: mockCheckAuthToken
        })
        
        const { container } = render( 
            <MemoryRouter>
                <AppRouter />;
            </MemoryRouter>
        );

        expect(screen.getByText('Ingreso')).toBeTruthy();
        expect( container ).toMatchSnapshot();
    });

    test('debe mostrar el calendario si estamos autenticados', () => {
        
        useAuthStore.mockReturnValue({
            status: 'authenticated',
            checkAuthToken: mockCheckAuthToken
        })
        
        render( 
            <MemoryRouter >
                <AppRouter />;
            </MemoryRouter>
        );

        expect(screen.getByText('CalendarPage')).toBeTruthy();

    });
});