import {useContext, useEffect} from "react";
import {useNavigate} from "react-router";
import {UserContext} from "../contexts/UserAuthContext.jsx";
import {Container} from "react-bootstrap";
import {LoginForm} from "./forms/authentication/LoginForm.jsx";
import {TotpForm} from "./forms/authentication/TotpForm.jsx";
import {ModalContext} from "../contexts/MessageModalContext.jsx";

function LoginComponent() {
    const navigate = useNavigate();

    const {showMessage} = useContext(ModalContext);
    const {setUser} = useContext(UserContext);

    const loginOK = (u) => {
        setUser();
        showMessage({
            title: 'Login Successful',
            message: `Welcome, ${u.name} \n You will be redirected to the home page`,
            variant: 'success',
            onAfterClose: () => navigate('/')
        });
    }

    return (
        <Container className="mt-5">
            <LoginForm loginOK={loginOK}/>
        </Container>
    );
}


function TotpComponent() {
    const {user, setUser, userLoading} = useContext(UserContext);
    const {showMessage} = useContext(ModalContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (userLoading) return
        if (!userLoading && !user) {
            showMessage({
                title: "Login Required",
                message: `You will be redirected to the login page`,
                variant: 'danger',
                onAfterClose: () => navigate('/login')
            });
        }
        else if (!user.canDoTotp) {
            showMessage({
                title: "2FA Required",
                message: `Check your secret availability and retry`,
                variant: 'danger',
                onAfterClose: () => navigate('/login')
            });
        }
    }, [user, userLoading]);


    const totpOK = (message) => {

        //console.log("setting user for TOTP login:",user)
        setUser();
        showMessage({
            title: "Login With TOTP Successful",
            message: `${message}, ${user.name}\nYou will be redirected to the home page`,
            variant: 'success',
            onAfterClose: () => navigate('/')
        });

    };

    return (
        <>
            {
                user ?
                    <Container className="mt-5">
                        < TotpForm totpOK={totpOK}/>
                    </Container>
                    :
                    null
            }
        </>
    );
}


export {LoginComponent, TotpComponent};