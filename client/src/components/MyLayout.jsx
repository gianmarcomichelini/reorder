import {Button, Col, Container, Nav, Navbar, Row} from "react-bootstrap";
import {Outlet, useNavigate} from "react-router";
import {useContext, useEffect} from "react";
import {UserContext} from "../contexts/UserAuthContext.jsx";
import gifError404 from '../assets/images/NO404.gif';
import forkAndKnife from '../assets/images/restaurant/forkandknife.svg';
import userIcon from "../assets/images/userIcon.svg"
import {ModalContext} from "../contexts/MessageModalContext.jsx";

function BasicLayout() {
    return (
        <Container fluid className="p-0 d-flex flex-column " style={{minHeight: '100vh'}}>
            <MyHeader/>

            <main className="flex-grow-1">
                <Container fluid>
                    <Row>
                        <Col>
                            <Outlet/>
                        </Col>
                    </Row>
                </Container>
            </main>

            <MyFooter/>
        </Container>
    );
}


function MyHeader() {
    const {user, logout} = useContext(UserContext);
    const navigate = useNavigate();
    const navigateToHome = () => navigate('/')

    //console.log("User in header:", user);


    return (
        <div className="bg-body-secondary border-bottom">
            <Navbar expand="md" className="bg-body-secondary border-bottom">
                <Container fluid className="p-1 d-flex align-items-center justify-content-between"
                           style={{fontSize: '18px'}}>
                    <div className="d-flex align-items-center">
                        <Navbar.Brand
                            onClick={navigateToHome}
                            role="button"
                            className="fw-bold text-secondary d-flex align-items-center"
                        >
                            <img
                                src={forkAndKnife}
                                alt="Fork and Knife"
                                style={{height: '50px', marginRight: '0.5rem'}}
                            />
                            reorder
                        </Navbar.Brand>
                        <Navbar.Toggle aria-controls="basic-navbar-nav"/>
                    </div>

                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link onClick={navigateToHome} className="mx-2">
                                Home
                            </Nav.Link>
                            <Nav.Link onClick={() => navigate('/menu')} className="mx-2">
                                Menu
                            </Nav.Link>

                            {
                                user ?
                                    <>
                                        <Nav.Link onClick={() => navigate('/configurator')} className="mx-2">
                                            Make an Order
                                        </Nav.Link>
                                        <Nav.Link onClick={() => navigate('/my-orders')} className="mx-2">
                                            My Orders
                                        </Nav.Link>
                                        {
                                            (!user.isLoggedWithTotp && user.canDoTotp) ?
                                                <Nav.Link onClick={() => navigate('/login-totp')} className="mx-2">
                                                    Login with TOTP
                                                </Nav.Link>
                                                :
                                                null
                                        }
                                    </>
                                    :
                                    null
                            }
                        </Nav>

                        <div className="d-flex align-content-end">
                            <div className="d-flex align-items-center ms-auto">
                                {
                                    user ? (
                                    <>
                                        <Navbar.Text className="fs-6 me-3">
                                            {`Signed in${user.isLoggedWithTotp ? ' (2FA)' : ''} as: ${user.name}`}
                                        </Navbar.Text>
                                        <div>
                                            <img height={40} src={userIcon}/>
                                        </div>
                                        <Button variant="danger" className="mx-2" onClick={logout}>
                                            Logout
                                        </Button>
                                    </>
                                ) : (
                                    <Nav>
                                        <Nav.Link onClick={() => navigate('/login')} className="mx-2">
                                            Login
                                        </Nav.Link>
                                    </Nav>
                                )}
                            </div>


                        </div>


                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </div>
    );
}


function Home() {
    return (
        <Container fluid className="py-3 text-center">
            <Row>
                <Col className="d-flex justify-content-center align-items-center"
                style={{height:"60vh"}}>
                    <h1 className="text-lg-center">Welcome to <strong>reorder</strong>!</h1>
                </Col>
            </Row>
        </Container>
    );
}


function MyFooter() {

    return (
        <footer className="bg-light mt-5 py-3 border">
            <Row className="px-3">
                <Col md={6} className="text-start">

                </Col>
                <Col md={6} className="text-end">
                    <small>&copy; 2025 reorder</small>

                </Col>
            </Row>
        </footer>
    );
}

function DefaultRoute() {
    const {showMessage} = useContext(ModalContext);
    const navigate = useNavigate();

    useEffect(() => {
        showMessage({
            title: 'Error',
            message: 'No data here: This is not a valid page!\nYou will be redirected to the homepage.',
            variant: 'danger',
            onAfterClose: () => navigate('/'),
        });
    }, []);

    return (
        <Container fluid className="d-flex flex-column">
            <Row className="pt-2">
                <Col xs={12} className="d-flex flex-column justify-content-center align-items-center">
                    <img src={gifError404} alt="Animated GIF" style={{width: '200px', height: 'auto'}}/>
                </Col>
            </Row>
        </Container>
    );
}


export {BasicLayout, Home, DefaultRoute};