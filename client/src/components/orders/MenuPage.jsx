import {Badge, Col, Container, Row, Table} from "react-bootstrap";
import {useContext, useEffect, useState} from "react";
import * as API from "../../API.js";
import {
    DishCard, IncompatibilityAndDependencySection,
    IngredientCard,
    MenuSections,
    MyIncompatibilityAndDependency,
    SizeCard
} from "./utils.jsx";
import {UserContext} from "../../contexts/UserAuthContext.jsx";
import {useNavigate} from "react-router";
import {ModalContext} from "../../contexts/MessageModalContext.jsx";
import {ConfigureOrder} from "./Configurator.jsx";

function MenuPage({seeOrderForm}) {
    const [data, setData] = useState({
        dishes: [],
        ingredients: [],
        sizes: [],
        dependencies: [],
        incompatibilities: [],
    });
    const [dirty, setDirty] = useState(false);

    const {user, userLoading} = useContext(UserContext);
    const {showMessage} = useContext(ModalContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (userLoading) return;
        if (seeOrderForm && !user) {
            navigate('/menu');
            showMessage({
                title: "Login Required",
                message: "Authenticate yourself before creating an order.",
                variant: "danger",
                onAfterClose: () => navigate("/login"),
            });
            return;
        }
        API.getMenu()
            .then(setData)
            .catch((err) =>
                showMessage({
                    title: "Error",
                    message: err?.[0]?.message || "Unknown error",
                    variant: "danger",
                    onAfterClose: () => navigate("/"),
                })
            );
    }, [seeOrderForm, dirty, user, userLoading]);

    const {
        dishes,
        ingredients,
        sizes,
        dependencies,
        incompatibilities,
    } = data;

    if (!dishes.length || !sizes.length || !ingredients.length) return null;

    return (
        <Container fluid className="py-4">
            {seeOrderForm && user && (
                <ConfigureOrder
                    dishes={dishes}
                    sizes={sizes}
                    ingredients={ingredients}
                    incompatibilities={incompatibilities}
                    dependencies={dependencies}
                    refreshMenu={setDirty}
                />
            )}
            <Row className="text-center">
                <Col md={4}>
                    <MenuSections
                        list={sizes}
                        header="Sizes"
                        renderItem={(el) => <SizeCard size={el}/>}
                        mdStyle={1}
                    />
                </Col>
                <Col className="align-content-center">
                    <MenuSections
                        list={dishes}
                        header="Dishes"
                        renderItem={(el) => <DishCard dish={el}/>}
                        mdStyle={3}
                    />
                </Col>
            </Row>
            <Row className="py-4">
                <Col>
                    <MenuSections
                        list={ingredients}
                        header="Ingredients"
                        renderItem={(el) => <IngredientCard ingredient={el}/>}
                        mdStyle={3}
                    />
                </Col>
            </Row>
            <Row className="py-4">
                {
                    [
                        {list: incompatibilities, header: "Incompatibilities", task: "incompatibility"},
                        {list: dependencies, header: "Dependencies", task: "dependency"}
                    ]
                        .map(({list, header, task}) => (
                            <Col key={header}>
                                <IncompatibilityAndDependencySection
                                    list={list}
                                    header={header}
                                    renderItem={(pair) => (
                                        <MyIncompatibilityAndDependency pair={pair} task={task}/>
                                    )}
                                />
                            </Col>
                        ))
                }
            </Row>
        </Container>
    );
}


export {MenuPage};