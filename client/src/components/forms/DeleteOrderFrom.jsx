import {Alert, Col, Container, Row} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import {useContext, useState} from "react";
import * as API from "../../API.js";
import {ModalContext} from "../../contexts/MessageModalContext.jsx";
import isNumeric from "validator/es/lib/isNumeric.js";


function DeleteOrderForm({orders, deleteOK}) {
    const [alert, setAlert] = useState({show: false, message: '',});
    const [orderIdState, setOrderIdState] = useState(0);

    const {showMessage} = useContext(ModalContext);

    const handleSubmission = (e) => {
        e.preventDefault();

        if (!orderIdState || !isNumeric(orderIdState)) {
            setAlert({show: true, message: 'Please select an order ID.'});
            setTimeout( () => setAlert({show:false, message: ''}), 2000);
        } else {
            API.deleteOrder(orderIdState)
                .then(res => {
                        showMessage({
                            title: `Order ${res.orderId} Deleted Successfully`,
                            message: `${res.message}`,
                            variant: "success"
                        })
                        deleteOK();
                        setOrderIdState('')
                    })
                .catch(err => {
                    showMessage({
                        title: "Order Not Deleted",
                        message: `${err.message}`,
                        variant: "danger"
                    })
                });
        }


    };

    return (
        <Container>
            <Row>
                {
                    <Alert
                        show={alert.show}
                        variant='danger'
                        onClose={() => setAlert({...alert, show: false})}
                        dismissible
                    >
                        {alert.message}
                    </Alert>
                }
            </Row>
            <Row>
                <Form onSubmit={handleSubmission} className="border rounded shadow-sm py-4 px-3 bg-light">
                    <Form.Group className="mb-3">
                        <Form.Label column="lg">Choose an Order ID:</Form.Label>
                        <Form.Select value={orderIdState} onChange={(e) => setOrderIdState(e.target.value)}>
                            <option value="">.</option>
                            {orders.map((o, index) => (
                                <option key={o.id || index} value={o.id}>
                                    {o.id}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Row>
                        <Col className="d-flex justify-content-center">
                            <button type="submit"
                                    className="btn btn-lg btn-secondary rounded px-4 py-2 shadow">Delete
                            </button>
                        </Col>
                    </Row>
                </Form>
            </Row>
        </Container>
    );
}


export {DeleteOrderForm};