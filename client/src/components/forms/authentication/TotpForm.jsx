import {Alert, Button, Col, Container, Fade, Row} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import {useNavigate} from "react-router";
import {useState} from "react";
import * as API from "../../../API.js";
import isNumeric from "validator/es/lib/isNumeric.js";


function TotpForm({totpOK}) {
    const [show, setShow] = useState(false);
    const [totpCode, setTotpCode] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const navigate = useNavigate();

    const doTotpVerify = () => {
        API.totpVerify(totpCode)
            .then((res) => {
                totpOK(res.message);
            })
            .catch((err) => {
                setErrorMessage(err.message || 'Wrong code, please try again');
                setTimeout(() => setErrorMessage(''), 5000);
            })
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        setErrorMessage('');

        // Some validation
        if (totpCode !== '' && totpCode.length === 6 && isNumeric(totpCode)){
            doTotpVerify();
        } else {
            setErrorMessage('Invalid code');
            setTimeout(() => setErrorMessage(''),5000)
        }
    };

    return (
        <Row>
            <Col xs={1}/>
            <Col xs={10} className="bg-light p-4">
                <h2 className="text-center">Second Factor Authentication</h2>

                {/* a simplistic feature to show/hide the secret used to generate the TOTP */}
                <div
                    onMouseEnter={() => setShow(true)}
                    onMouseLeave={() => setShow(false)}
                    style={{ width: "fit-content", cursor: "pointer" }}
                >
                    <Fade in={show}>
                        <div>
                            <h5>secret: LXBSMDTMSP2I5XFXIYRGFVWSFI</h5>
                        </div>
                    </Fade>
                </div>


                <Form onSubmit={handleSubmit}>
                    {errorMessage ? <Alert className="rounded text-center small" variant='danger' dismissible
                                           onClick={() => setErrorMessage('')}>{errorMessage}</Alert> : ''}
                    <Form.Group controlId='totpCode'>
                        <Form.Label column={"lg"}>Enter Your Code</Form.Label>
                        <Form.Control placeholder="123456" type='text' value={totpCode} onChange={ev => setTotpCode(ev.target.value)}/>
                    </Form.Group>
                    <div className="d-flex py-4 justify-content-center">
                        <Button className='my-2 btn btn-secondary' type='submit'>Validate</Button>
                        <Button className='my-2 mx-2' variant='outline-danger'
                                onClick={() => navigate('/')}>Cancel</Button>

                    </div>
                </Form>
            </Col>
            <Col xs={1}></Col>
        </Row>
    )

}

export {TotpForm}