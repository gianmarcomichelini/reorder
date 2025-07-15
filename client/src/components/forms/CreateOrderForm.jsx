import Form from 'react-bootstrap/Form';
import {Alert, Button, Col, Container, Row} from "react-bootstrap";
import * as API from "../../API.js";
import {useContext, useState} from "react";
import {ModalContext} from "../../contexts/MessageModalContext.jsx";
import isAlpha from "validator/es/lib/isAlpha.js";

function CreateOrderForm({
                             dishes, sizes, ingredients,
                             incompatibilities, dependencies,
                             order, setOrder,
                             refreshMenu
                         }) {
    const [alert, setAlert] = useState({show: false, message: '', variant: 'info'});
    const showAlertDanger = (message) => {
        setAlert({
            show: true,
            message,
            variant: 'danger',
        });
        setTimeout(() => setAlert(a => ({...a, show: false})), 5000);
    };
    const {showMessage} = useContext(ModalContext);


    const buildIncompatMap = (list) => {
        const map = new Map();
        list.forEach(({ingredient1, ingredient2}) => {
            map.set(ingredient1, (map.get(ingredient1) || new Set()).add(ingredient2));
            map.set(ingredient2, (map.get(ingredient2) || new Set()).add(ingredient1));
        });
        return map;
    };

    const buildDepMap = (list) => {
        const map = new Map();
        list.forEach(({ingredient1, ingredient2}) => {
            map.set(ingredient1, (map.get(ingredient1) || new Set()).add(ingredient2));
        });
        return map;
    };

    const incompatMap = buildIncompatMap(incompatibilities);
    const depMap = buildDepMap(dependencies);

    const handleMaxIngredients = (setOrArray, sizeName) => {
        // ingredient list can be a set or an array, depends on the function which calls it
        const count = setOrArray instanceof Set ? setOrArray.size : setOrArray.length;
        const max = sizes.find(s => s.name === sizeName)?.maxIngredients ?? Infinity;
        if (count > max) {
            showMessage({
                title: "Too Much Ingredients",
                message: `The current configuration would exceed the maximum of ${max} ingredients for size "${sizeName}". Remove other ingredients. \n This may be due to a dependency that needs to be added automatically`,
                variant: "warning"
            });
            return true;
        }
        return false;
    };

    const handleDishChange = (e) => {
        const newDishName = e.target.value;
        setOrder(prevOrder => ({...prevOrder, dish_name: newDishName}));
    };

    const handleSizeChange = (e) => {
        const newSize = e.target.value;
        if (!handleMaxIngredients(order.ingredients, newSize))
            setOrder(prevOrder => ({...prevOrder, size_name: newSize}));
    };

    const handleIngredientToggle = (name, checked) => {
        const selected = order.ingredients;
        const selectedNames = selected.map(i => i.ingredient_name);
        const finalSet = new Set(selectedNames);

        // if the checkbox is checked then...
        if (checked) {
            const addDeps = (ing) => {
                // adding dependent ingredients if any
                for (const dep of depMap.get(ing) || []) {
                    if (!finalSet.has(dep)) {
                        finalSet.add(dep);
                        addDeps(dep);
                    }
                }
            };
            finalSet.add(name);
            addDeps(name);

            if (handleMaxIngredients(finalSet, order.size_name)) return;

            // checking for conflicts (incompatibilities) for each ingredient of the final set
            for (const ing of finalSet) {
                for (const conflict of incompatMap.get(ing) || []) {
                    if (finalSet.has(conflict)) {
                        showMessage({
                            title: "Incompatibility Found",
                            message: `${ing} and ${conflict} are incompatible.`,
                            variant: "warning"
                        });
                        return;
                    }
                }
            }


            // creating the list of objects as defined in the last .map
            //  then insert them in the order
            const updated = [...finalSet]
                .map(ingName => ingredients.find(i => i.name === ingName))
                .filter(i => i !== undefined && i !== null)    // removing any undefined ingredient
                .map(i => ({ingredient_name: i.name}));
            // only valid ingredients of the finalSet are now in the array of objects

            setOrder(prevOrder => ({...prevOrder, ingredients: updated}));

            // selectedNames is the name list of the current selected ingredients
            const autoDeps = [...finalSet].filter(i => !selectedNames.includes(i) && i !== name);
            if (autoDeps.length) {
                setAlert({
                    show: true,
                    message: `Dependencies added: ${autoDeps.join(', ')}`,
                    variant: 'info',
                });
                setTimeout(() => {
                    setAlert(a => ({...a, show: false}));
                }, 5000);}
            } else {    // if the ingredient is unchecked
                const toRemove = new Set([name]);

                // recursive excision of ingredients if dependencies are present
                const removeDependents = (ing) => {
                    // depMap contains a list of key ingredient with the value that is a list of dependencies (deps)
                    for (const [depender, deps] of depMap.entries()) {
                        if (deps.has(ing) && selectedNames.includes(depender)) {
                            toRemove.add(depender);
                            removeDependents(depender);
                        }
                        // if ingredient hasn't dependencies go on
                    }
                };
                removeDependents(name);
                const remaining = selected.filter(i => !toRemove.has(i.ingredient_name));
                setOrder({...order, ingredients: remaining});
            }
    };

    const handleSubmission = (e) => {
        e.preventDefault();

        const dish = order.dish_name;
        const size = order.size_name;
        if (!dish || !isAlpha(dish)) {
            showAlertDanger('Select a valid dish name');
        } else if (!size || !isAlpha(size)) {
            showAlertDanger('Select a valid size');
        } else {
            API.createOrder(order)
                .then(res => {
                    showMessage({
                        title: "Order Placed",
                        message: `${res.message} with ID: ${res.orderId}`,
                        variant: "success",
                        onAfterClose: () => setOrder({dish_name: '', size_name: '', ingredients: []})
                    });
                    refreshMenu(prev => !prev);
                })
                .catch(err => {
                    showMessage({
                        title: "Form Error",
                        message: err.message,
                        variant: "danger",
                    });
                });
        }
    };

    return (
        <Container fluid>
            {alert.show && (
                <Row>
                    <Alert variant={alert.variant} onClose={() => setAlert({...alert, show: false})} dismissible>
                        {alert.message}
                    </Alert>
                </Row>
            )}
            <Row>
                <Form onSubmit={handleSubmission} className="border rounded shadow-sm py-4 px-3 bg-light">
                    <Form.Group className="mb-3">
                        <Form.Label column="lg">Choose a Dish</Form.Label>
                        <Form.Select value={order.dish_name} onChange={handleDishChange}>
                            <option value="">.</option>
                            {dishes.map((d, i) => <option key={i} value={d.name}>{d.name}</option>)}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label column="lg">Choose a Size</Form.Label>
                        <Form.Select value={order.size_name} onChange={handleSizeChange}>
                            <option value="">.</option>
                            {sizes.map((s, i) => <option key={i} value={s.name}>{s.name}</option>)}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label column="lg">Choose Ingredients</Form.Label>
                        {ingredients.map((ing) => (
                            <Form.Check
                                key={ing.name}
                                id={`checkbox-${ing.name}`}
                                label={ing.name}
                                checked={order.ingredients.some(i => i.ingredient_name === ing.name)}
                                onChange={(e) => handleIngredientToggle(ing.name, e.target.checked)}
                            />
                        ))}
                        <div className="py-2">
                            <Button
                                className="btn btn-light btn-outline-dark"
                                size="sm"
                                onClick={() => setOrder(prev => ({...prev, ingredients: []}))}
                            >
                                Reset Ingredients
                            </Button>
                        </div>
                    </Form.Group>

                    <Row>
                        <Col className="d-flex justify-content-center">
                            <Button type="submit" className="btn btn-lg btn-secondary rounded px-4 py-2 shadow">
                                Send the Order
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Row>
        </Container>
    );
}

export {CreateOrderForm};