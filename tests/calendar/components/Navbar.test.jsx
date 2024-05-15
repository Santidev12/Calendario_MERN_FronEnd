import { fireEvent, render, screen } from "@testing-library/react";
import { useAuthStore } from "../../../src/hooks/useAuthStore";
import { Navbar } from "../../../src/calendar";

jest.mock('../../../src/hooks/useAuthStore')

describe('Pruebas en <Navbar />', () => {

    const mockStartLogout = jest.fn()

    test('debe de regresar el nombre del user', () => {
        
        useAuthStore.mockReturnValue({
            user: {
                name: 'Santiago',
            },
            startLogout: mockStartLogout
        })

        render(<Navbar/>)
        
        const salir = screen.getByLabelText('btn-logout')

        expect(screen.getByText('Santiago')).toBeTruthy()
        fireEvent.click( salir )
        expect( mockStartLogout ).toHaveBeenCalled()
    });
});