import {Button, Col, Container, Row} from "react-bootstrap";
import {useContext, useEffect, useState} from "react";
import {UserContext} from "../../contexts/UserAuthContext.jsx";
import * as API from "../../API.js";
import {ModalContext} from "../../contexts/MessageModalContext.jsx";
import {Link, useNavigate} from "react-router";
import {DeleteOrderForm} from "../forms/DeleteOrderFrom.jsx";

function OrderList() {
    const {user, userLoading} = useContext(UserContext);
    const {showMessage} = useContext(ModalContext);
    const [orders, setOrders] = useState([]);
    const navigate = useNavigate();

    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        if (userLoading) return;

        if (!user) {
            showMessage({
                title: "Login Required",
                message: "Authenticate yourself before viewing past orders.",
                variant: "danger",
                onAfterClose: () => navigate('/login')
            });
        } else {
            API.getUserOrders(user.id)
                .then(setOrders)
                .catch((err) => {
                    showMessage({
                        title: "Error",
                        message: err?.[0]?.message || err?.message || "Could not load orders.",
                        variant: "danger"
                    });
                });
        }
    }, [user, userLoading, dirty]);

    const deleteOK = () => {
        setDirty(prev => !prev);
    }

    return (

        <>
            {
                user ?
                    <Container fluid className="py-3">
                        <Row>

                            <Col xs={6}>
                                {orders.length === 0 ? (
                                    <div className="text-center py-4">
                                        <h4>No orders found.</h4>
                                        <p>
                                            <Link to="/configurator" className="text-secondary">
                                                <Button className="btn btn-secondary btn-sm">
                                                    Create your own order now
                                                </Button>
                                            </Link>
                                        </p>
                                    </div>

                                ) : (
                                    orders.map(order =>
                                        <UserOrder key={order.id} order={order}/>
                                    )
                                )}
                            </Col>

                            <Col xs={6}>


                                {
                                    user.isLoggedWithTotp ?
                                        <>
                                            <Row>
                                                <p className="fst-italic ">
                                                    Since you logged in with 2FA — respect for security! — you’re now authorized to delete your orders:
                                                </p>
                                            </Row>

                                            <Row>
                                                <DeleteOrderForm orders={orders} deleteOK={deleteOK} />
                                            </Row>
                                        </>

                                        :
                                        null
                                }

                            </Col>
                        </Row>
                    </Container>
                    :
                    null
            }
        </>
    );
}


function UserOrder({order}) {
    return (
        <div className="border-secondary m-2 p-2 shadow" key={order.id}>
            <h4 className="text-center"><strong>ID:</strong> {order.id}</h4>
            <p><strong>Dish:</strong> {order.dish}</p>
            <p><strong>Size:</strong> {order.size}</p>
            <p><strong>Price:</strong> €{order.price.toFixed(2)}</p>
            <p><strong>Ingredients:</strong> {order.ingredients.length > 0
                ? order.ingredients.map(ing => ing).join(", ")
                : "None"}
            </p>
            <p><strong>Timestamp:</strong> {order.timestamp}</p>
        </div>
    )
}


export {OrderList};