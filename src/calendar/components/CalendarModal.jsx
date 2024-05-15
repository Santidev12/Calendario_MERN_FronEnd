import { addHours, differenceInSeconds } from 'date-fns';
import { act, useEffect, useMemo, useState } from 'react';

import Modal from 'react-modal'
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale/es';
registerLocale('es', es)

import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css'
import { useUiStore } from '../../hooks/useUiStore';
import { useCalendarStore } from '../../hooks/useCalendarStore';
import { getEnvVariables } from '../../helpers';

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
    },
};


if( getEnvVariables().VITE_MODE !== 'test'){
    Modal.setAppElement('#root');
}

export const CalendarModal = () => {

    const { isDateModalOpen, closeDateModal } = useUiStore()
    const { activeEvent, startSavingEvent } = useCalendarStore();

    const [formSubmitted, setFormSubmitted] = useState(false);

    const [formValues, setFormValues] = useState({
        title: '',
        note: '',
        start: new Date(),
        end: addHours( new Date(), 2 )
    })

    const titleClass = useMemo(() => {
        if( !formSubmitted ) return '';

        return ( formValues.title.length > 0 )
            ? ''
            : 'is-invalid'
    }, [formValues.title, formSubmitted])

    useEffect(() => {
        if( activeEvent !== null ){
            setFormValues({ ...activeEvent })
        }
    }, [activeEvent])
    

    const onClodeModal = () => {
        closeDateModal();
        // setIsOpen(false)
    }

    const onInputChange = ({ target }) => {
        setFormValues({
            ...formValues,
            [target.name]: target.value,
        })
    }

    const onDateChanged = (event, changing) => {
        setFormValues({
            ...formValues,
            [changing]: event
        })
    }

    const onSubmit = async( event ) => {
        event.preventDefault();
        setFormSubmitted(true)

        const difference = differenceInSeconds( formValues.end, formValues.start )
        if ( isNaN(difference) || difference <= 0 ){

            Swal.fire('Fechas incorrectas', 'Revisar las fechas ingresadas', 'error')
            return
        }

        if ( formValues.title.length === 0 ) return;

        // TODO
        await startSavingEvent( formValues );
        closeDateModal();
        setFormSubmitted(false)
    }



    return (
        <Modal
            isOpen={ isDateModalOpen }
            onRequestClose={onClodeModal}
            style={customStyles}
            className="modal"
            overlayClassName="modal-fondo"
            closeTimeoutMS={200}
        >
            <h1> Nuevo evento </h1>
            <hr />
            <form className="container " onSubmit={ onSubmit }>

                <div className="form-group mb-2">
                    <label>Fecha y hora inicio</label>
                    <br />
                    <DatePicker 
                        selected={formValues.start} 
                        onChange={(event) => onDateChanged(event, 'start')} 
                        className='form-control mt-1'
                        dateFormat="Pp"
                        showTimeSelect
                        locale="es"
                        timeCaption='Hora'
                    />
                </div>

                <div className="form-group mb-2">
                    <label>Fecha y hora fin</label>
                    <br />
                    <DatePicker 
                        minDate={formValues.start}
                        selected={formValues.end} 
                        onChange={(event) => onDateChanged(event, 'end')} 
                        className={ formValues.start > formValues.end ? 'form-control is-invalid mt-1' : 'form-control mt-1'}
                        dateFormat="Pp"
                        showTimeSelect
                        locale="es"
                        timeCaption='Hora'
                    />
                </div>

                <hr />
                <div className="form-group mb-2">
                    <label>Titulo y notas</label>
                    <input
                        type="text"
                        className={`form-control ${ titleClass } mt-1`}
                        placeholder="Título del evento"
                        name="title"
                        autoComplete="off"
                        value={ formValues.title }
                        onChange={ onInputChange }
                    />
                    <small id="emailHelp" className="form-text text-muted">Una descripción corta</small>
                </div>

                <div className="form-group mb-2">
                    <textarea
                        type="text"
                        className="form-control"
                        placeholder="Notas"
                        rows="5"
                        name="note"
                        value={ formValues.note }
                        onChange={ onInputChange }
                    ></textarea>
                    <small id="emailHelp" className="form-text text-muted">Información adicional</small>
                </div>

                <button
                    type="submit"
                    className="btn btn-outline-primary btn-block"
                >
                    <i className="far fa-save"></i>
                    <span> Guardar</span>
                </button>

            </form>
        </Modal>
    )
}
