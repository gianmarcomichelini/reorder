import {Alert, Button, Col, Form, Row} from "react-bootstrap";
import {useState} from "react";
import {useNavigate} from "react-router";
import * as API from "../../../API.js";
import isEmail from "validator/es/lib/isEmail.js";

function LoginForm({loginOK}) {
    const [userEmail, setUserEmail] = useState('u1@p.it');
    const [password, setPassword] = useState('pwd');
    const [errorMessage, setErrorMessage] = useState({show: false, message: '', variant: 'info'});

    const navigate = useNavigate();

    const doLogin = (credentials) => {
        API.logIn(credentials)
            .then((user) => {
                loginOK(user); // user is passed directly
            })
            .catch((err) => {
                setErrorMessage({show: true, message: err.message || 'Login failed', variant: 'danger'});
                setTimeout(() => setErrorMessage({show: false, message: '', variant: 'info'}), 2000);
            });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setErrorMessage({show: false, message: '', variant: 'info'});

        // no checks on password because must enable fast testing
        if (!isEmail(userEmail)) {
            //console.log(userEmail, password);
            setErrorMessage({show: true, message: 'Use a valid email', variant: 'danger'});
            setTimeout(() => setErrorMessage({show: false, message: '', variant: 'info'}), 2000);
        } else if (password === ''){
            setErrorMessage({show: true, message: 'Write something as a password', variant: 'danger'});
            setTimeout(() => setErrorMessage({show: false, message: '', variant: 'info'}), 2000);
            
        } else {
            doLogin({ username: userEmail, password });

        }
    };

    return (
        <Row>
            <Col xs={3}/>
            <Col xs={6} className="bg-light p-4">
                <h2 className="text-center">Login Form</h2>

                {errorMessage.show && (
                    <Alert
                        variant={errorMessage.variant}
                        onClose={() => setErrorMessage({show: false, message: '', variant: 'info'})}
                        dismissible
                    >
                        {errorMessage.message}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit} noValidate>
                    <Form.Group controlId="userEmail" className="mb-3">
                        <Form.Label column="lg">Email</Form.Label>
                        <Form.Control
                            placeholder="u1@p.it"
                            required
                            type="email"
                            value={userEmail}
                            onChange={(ev) => setUserEmail(ev.target.value)}
                        />
                    </Form.Group>

                    <Form.Group controlId="password" className="mb-3">
                        <Form.Label column="lg">Password</Form.Label>
                        <Form.Control
                            required
                            type="password"
                            value={password}
                            onChange={(ev) => setPassword(ev.target.value)}
                        />
                    </Form.Group>

                    <div className="d-flex py-4 justify-content-center">
                        <Button type="submit" className="my-2 btn btn-secondary">Login</Button>
                        <Button variant="outline-danger" className="my-2 mx-2" onClick={() => navigate('/')}>
                            Cancel
                        </Button>
                    </div>
                </Form>
            </Col>
            <Col xs={3}/>
        </Row>
    );
}

export {LoginForm};