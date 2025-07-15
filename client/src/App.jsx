import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import {Routes, Route, useNavigate} from 'react-router';
import {useEffect, useState} from "react";
import {UserContext} from './contexts/UserAuthContext.jsx';
import {ModalContext} from './contexts/MessageModalContext.jsx';
import {BasicLayout, DefaultRoute, Home} from "./components/MyLayout.jsx";
import {MenuPage} from "./components/orders/MenuPage.jsx";
import * as API from "./API.js";
import {LoginComponent, TotpComponent} from "./components/Login.jsx";
import MessageModal from "./components/MessageModal.jsx";
import {OrderList} from "./components/orders/OrderList.jsx";

function App() {
    const [userState, setUserState] = useState(null);

    // had problems with user info update, so use a loading flag (set also in the context)
    const [userLoading, setUserLoading] = useState(true);

    const defaultModalValue = {
        show: false,
        title: '',
        message: '',
        variant: '',
        onAfterClose: () => {},
    };
    const [modalState, setModalState] = useState(defaultModalValue);

    const navigate = useNavigate();

    useEffect(() => {
        setUserLoading(true);
        API.getUserInfo()
            .then(u => {
                if (u.id) {
                    setUserState({
                        id: u.id,
                        name: u.name,
                        canDoTotp: u.canDoTotp,
                        isLoggedWithTotp: u.isTotp
                    });
                } else {
                    setUserState(null);
                }
            })
            .catch(() => {
                setUserState(null);
            })
            .finally(() => {
                setUserLoading(false);
            });
    }, []);


    const updateUserInfo = () => {
        API.getUserInfo()
            .then(u => {
                    if (u.id) {
                        setUserState({
                            id: u.id,
                            name: u.name,
                            canDoTotp: u.canDoTotp,
                            isLoggedWithTotp: u.isTotp
                        });
                    } else {
                        setUserState(null)
                    }
                }
            )
            .catch(() => setUserState(null));

    };

    const logout = async () => {
        setUserState(null);
        API.logOut()
            .then(res => {
                showMessage({
                    title: "Logout Successful",
                    variant: 'success',
                    message: res.message,
                    onAfterClose: () => navigate('/')
                });
            })
            .catch(err => {
                showMessage({
                    title: "Error in Logout",
                    variant: 'danger',
                    message: err.message || 'Unknown error',
                    onAfterClose: () => navigate('/')
                });
            })
            .finally(() => {
                updateUserInfo();
            });
    };


    {/* functions for the global modal */
    }

    const showMessage = ({title, message, variant, onAfterClose}) => {
        setModalState({show: true, title, message, variant, onAfterClose});
    };

    const closeModal = () => {
        setModalState(defaultModalValue);
    };


    return (
        <UserContext value={{
            user: userState,
            userLoading: userLoading,
            setUser: updateUserInfo,
            logout,
        }}>
            <ModalContext value={{
                showMessage,
            }}>
                <Routes>
                    <Route path="/" element={<BasicLayout/>}>
                        <Route index element={<Home/>}/>
                        <Route path="/menu" element={<MenuPage seeOrderForm={false}/>}/>
                        <Route path="/configurator" element={<MenuPage seeOrderForm={true}/>}/>
                        <Route path="/login" element={<LoginComponent/>}/>
                        <Route path="/login-totp" element={<TotpComponent/>}/>
                        <Route path="/my-orders" element={<OrderList/>}/>


                        <Route path="*" element={<DefaultRoute/>}/>
                    </Route>
                </Routes>

                <MessageModal
                    show={modalState.show}
                    onClose={closeModal}
                    onAfterClose={modalState.onAfterClose}
                    title={modalState.title}
                    message={modalState.message}
                    variant={modalState.variant}
                    content={modalState.content}
                />
            </ModalContext>
        </UserContext>
    );
}


export default App;