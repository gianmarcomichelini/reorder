import {useState} from "react";
import {Badge, Col, Container, Row, Table} from "react-bootstrap";
import {CreateOrderForm} from "../forms/CreateOrderForm.jsx";


/*
Order Prototype:
    {
      "dish_name": "pizza",
      "size_name": "small",
      "ingredients": [
        {"ingredient_name": "tomatoes"},
        {"ingredient_name": "olives"},
        {"ingredient_name": "potatoes"}
      ]
    }
 */

function ConfigureOrder({dishes, sizes, ingredients, incompatibilities, dependencies, refreshMenu}) {
    const [order, setOrder] = useState({dish_name: "", size_name: "", ingredients: []});

    return (
        <Container fluid className="py-4">
            <Row>
                <Col xs={6}>
                    <CreateOrderForm
                        /* use the spread operator to avoid writing lots of key-value pairs */
                        {...{dishes, sizes, ingredients, incompatibilities, dependencies, order, setOrder, refreshMenu}}
                    />
                </Col>
                <Col xs={6}>
                    <OrderSummary
                        selectedDish={order.dish_name}
                        selectedSize={order.size_name}
                        selectedIngredients={order.ingredients}
                        sizes={sizes}
                        ingredients={ingredients}
                    />
                </Col>
            </Row>
        </Container>
    );
}


function OrderSummary({selectedDish, selectedSize, selectedIngredients, sizes, ingredients}) {
    const sizePrice = sizes.find((s) => s.name === selectedSize)?.price || 0;
    const ingredientsPrice = selectedIngredients.reduce((sum, ing) => {
        return sum + (ingredients.find((i) => i.name === ing.ingredient_name)?.price || 0);
    }, 0);
    const totalPrice = sizePrice + ingredientsPrice;

    return (
        <Container fluid>
            <Row className="py-3">
                <strong className="text-end" style={{fontSize: "xx-large"}}>Current Price: <Badge bg="success">{totalPrice.toFixed(2)}€</Badge></strong>
            </Row>


            <Row>
                <Col >
                    <Table hover bordered responsive className="table"
                           style={{width: "100%", minHeight: "200px", fontSize: "large"}}>
                        <thead>
                        <tr>
                            <th colSpan={2} className="text-lg-center">
                                <strong><i className="bi-cart-check-fill"/> Order Summary </strong>
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td><strong>Dish:</strong></td>
                            <td>{selectedDish || "dish..."}</td>
                        </tr>
                        <tr>
                            <td><strong>Size:</strong></td>
                            <td className="d-flex justify-content-between align-items-center">
                                {selectedSize ? (
                                    <>
                                        {selectedSize} <Badge bg="secondary">{sizePrice.toFixed(2)}€</Badge>
                                    </>
                                ) : (
                                    "size..."
                                )}
                            </td>
                        </tr>
                        <tr>
                            <td><strong>Ingredients:</strong></td>
                            <td>
                                {selectedIngredients.length ? (
                                    <ol>
                                        {selectedIngredients.map((ing) => {
                                            const price = ingredients.find((i) => i.name === ing.ingredient_name)?.price || 0;
                                            return (
                                                <li key={`${ing.ingredient_name}-summary-list`}
                                                    style={{listStylePosition: "outside"}}>
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <span>{ing.ingredient_name}</span>
                                                        <Badge bg="secondary">{price.toFixed(2)}€</Badge>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                ) : (
                                    "ingredients..."
                                )}
                            </td>
                        </tr>
                        </tbody>
                    </Table>
                </Col>
            </Row>

        </Container>

    );
}

export {ConfigureOrder};
